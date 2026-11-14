# Backend

REST API for Auberge Henri IV: Express 5 and TypeScript on PostgreSQL 17, with plain SQL through `pg` and no ORM. It handles accounts and sessions, per-unit access grants, protected media, and the admin dashboard.

For the system-level view (architecture, threat model, deployment), see the [root README](../README.md).

## Contents

- [Structure](#structure)
- [Request lifecycle](#request-lifecycle)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Data model and migrations](#data-model-and-migrations)
- [Upload pipeline](#upload-pipeline)
- [Errors, logging and auditing](#errors-logging-and-auditing)
- [Rate limiting](#rate-limiting)
- [API reference](#api-reference)
- [Development](#development)
- [Tests](#tests)

## Structure

```
backend/
├── app.ts             Express app: middleware order, router mounting, /health
├── server.ts          Startup: migrations, listen, cron jobs, graceful shutdown
├── config.ts          Environment variables, validated with Zod before anything else runs
├── db.ts              PostgreSQL connection pool
├── db/                migrate.ts (runner), migrations/ (numbered SQL), seed.sql (fake dev data)
├── scripts/           One-off operator scripts (legacy media move)
├── jobs/              Scheduled jobs (node-cron)
├── middleware/        Authentication, authorization, rate limiting, request context, errors
├── routes/            HTTP layer: validate input, call a service, shape the response
│   ├── admin/           Admin-only routes
│   └── spaces/          Router factories shared by apartments and pro spaces
├── schemas/           Zod schemas for every body, query and param
├── services/          Business logic and SQL
│   ├── admin/           Admin-side services
│   └── spaces/          Service factories and per-kind definitions
├── emails/            Resend client, HTML layout, templates, notifications
├── context/           Per-request context (AsyncLocalStorage) used by the logger
├── models/ types/     Database row types and API response types
└── utils/             Tokens, passwords, logging, audit trail, errors, uploads, SQL helpers
```

**Layering.** A request goes route → Zod schema → service → database. Routes stay thin and never touch SQL. Services own the queries and throw typed `AppError` subclasses (`NotFoundError`, `ForbiddenError`, ...), which one error handler turns into HTTP responses.

**Shared space logic.** Apartments and professional spaces have separate tables and can grow different fields, but about 95% of their behavior is the same. That shared logic lives once, in factories (`services/spaces/`, `services/admin/AdminSpaceService.ts`, `routes/spaces/`). Each kind is a small definition in `services/spaces/spaceKinds.ts`: its tables, media context and the mapping of its extra columns. Table names are interpolated into SQL only from these fixed definitions, never from a request.

## Request lifecycle

Middleware runs in this order (`app.ts`):

| # | Step | Why it is here |
| --- | --- | --- |
| 1 | `GET /health` | Before logging and limits, so the 15-second Docker probe neither fills the access log nor gets throttled |
| 2 | Request ID | A UUID per request, returned as `X-Request-Id` and in error bodies, so a user report can be matched to a log line |
| 3 | Access log | One JSON line when the response closes: route template, status, duration, user ID, and whether the client aborted |
| 4 | Global rate limit | Rejects floods before any body is parsed |
| 5 | `express.json({ limit: "100kb" })`, cookies | JSON only; no `urlencoded` parser, which shrinks the CSRF surface |
| 6 | Request context | Opens an AsyncLocalStorage scope so any log line, even deep in a service, carries the request ID, path, IP and user |
| 7 | Router | Per-route limiter → authentication → authorization → Zod validation → service |
| 8 | 404, then error handler | Normalizes anything thrown (Zod, multer, Postgres, body-parser) into a typed error and logs it once. 5xx details never reach the client |

`app.set("trust proxy", 1)`: exactly one hop (nginx) is trusted. nginx overwrites `X-Forwarded-For` with the real visitor IP, which it takes from `CF-Connecting-IP` only when the connection comes from Cloudflare, so `req.ip` can't be spoofed by a client.

## Authentication

### Sessions

| Token | Lifetime | Cookie path | Contents |
| --- | --- | --- | --- |
| Access JWT | 15 min | `/` | `sub` (user ID), `isAdmin` |
| Refresh JWT | 7 days | `/api/auth/refresh` only | `sub`, `v` (the user's `token_version`) |

- Both are `httpOnly`, `SameSite=Strict` cookies, and `Secure` in production. Each has its own secret (32+ characters), and the algorithm is pinned to HS256 on both sign and verify.
- `POST /auth/refresh` loads the user and compares `v` with the current `token_version`. A password reset increments that column, so every refresh token issued before the reset stops working. A deleted user gets a 401 and their cookies cleared.
- The frontend refreshes on a 401 and replays the request, sharing one in-flight refresh between concurrent requests.

### Email and password

- Passwords: bcrypt with cost 12. New passwords need 10 or more characters with upper, lower, digit and symbol, no spaces, and at most 72 bytes (bcrypt silently ignores anything past that).
- Emails are trimmed and lowercased by the Zod schema. The database enforces this with a `CHECK` and a unique index.
- Login looks up the user, then **always** runs `bcrypt.compare`, against a dummy hash when the email is unknown. Unknown email and wrong password produce the same error and the same timing.

### Email tokens (verification, password reset)

```
register / forgot-password                       verify-email / reset-password
──────────────────────────                       ─────────────────────────────
raw   = 32 random bytes (hex)                    hash(raw from request body)
store = sha256(raw), expiry                      UPDATE ... WHERE token = $hash AND expires > NOW()
email = link containing raw    ── user clicks ──► clears the token in the same statement (single use)
```

Only the hash is stored, so a read-only database leak yields no working links. The tokens have 256 bits of entropy, so a fast unsalted hash is enough. Lifetimes are 24 hours for verification and 1 hour for reset. `verify-email` is a POST with the token in the body: the email link opens a frontend page, which posts the token. That keeps the state change off GET, where email security scanners that prefetch links would trigger it, and keeps the token out of API request logs. The page URL itself still carries the token, which is one reason tokens are single-use and short-lived.

### Google sign-in

The frontend sends the ID token (a JWT) from Google's sign-in button. `google-auth-library` verifies its signature against Google's keys, and checks its audience against `GOOGLE_CLIENT_ID` and its expiry. The backend also requires `email_verified`. The profile names go through the same Zod rules as typed names, with fallbacks.

### Anti-enumeration

`forgot-password` and `resend-verification` give the same answer whether or not an account exists, and send nothing to accounts it doesn't apply to. Registration is the one deliberate exception: it says an email is taken, a UX choice limited to 5 attempts per hour per IP.

## Authorization

All checks live in `middleware/authorizationMiddleware.ts` and run before the handler, so services never re-check permissions.

| Guard | Used on | Rule |
| --- | --- | --- |
| `authorizeAdmin` | every `/admin/*` route | `isAdmin` in the access token |
| `authorizeSelfOrAdmin` | `/user/:uuid` | the caller is that user, or an admin |
| `authorizeSpace` | `/apartments/:uuid`, `/pro-spaces/:uuid` (+ `/media`) | a grant on that exact unit, with no expiry or an expiry in the future |
| `authorizeCommonSpace` | common-area media | a live grant on at least one unit of that kind |
| `authorizeMedia` | `/media/:uuid` | loads the row once; thumbnails are public, anything else needs the grant for the unit (or kind) it belongs to |

Grants live in `UserApartmentAccess` / `UserProSpaceAccess` (`user_id`, `space_id`, `access_expiry`). Expiry dates are calendar days in the admin UI and are stored as the end of that day in Paris time, DST included (`utils/time.ts`). Expired rows are ignored by every query and purged daily.

## Data model and migrations

| Table | Purpose |
| --- | --- |
| `Users` | Account, bcrypt hash (null for Google-only accounts), hashed email tokens, `token_version`, `is_admin` |
| `Apartments`, `ProSpaces` | The units. Same core columns; apartments add kitchen appliance fields |
| `UserApartmentAccess`, `UserProSpaceAccess` | Grants: composite primary key `(user_id, space_id)`, optional expiry, `ON DELETE CASCADE` on both sides |
| `Media` | One row per file: context (`apartment`, `pro-space`, or a common area), unit ID, role (`REGULAR`, `THUMBNAIL`, `PLAN`), type, display order, storage path |
| `Reviews` | Homepage testimonials |
| `schema_migrations` | Which migration files have been applied |

Integrity is enforced in the database too, not only in Zod: a unique index allows one thumbnail and one plan per unit, a `CHECK` forbids a unit ID on common-area media, and `CHECK`s cover energy ratings, sizes and lowercase emails.

### Migrations

`db/migrate.ts` runs before the server starts listening:

1. Takes a Postgres advisory lock, so two starting instances can't migrate at the same time.
2. Applies every `db/migrations/*.sql` file not yet recorded in `schema_migrations`, in filename order, **each in its own transaction**. A failing file rolls back completely and aborts startup.
3. A database created before the runner existed is detected, and its baseline (`000_init.sql`) is recorded as already applied.

`000_init.sql` is frozen: it is exactly the schema production was first built from, and a test pins its checksum. Editing it would change new databases but never existing ones, so the two would silently drift apart. Every change since then is a numbered file:

| File | Change |
| --- | --- |
| `001_media_roles.sql` | `role` (`REGULAR`, `THUMBNAIL`, `PLAN`) replaces `is_thumbnail`; uppercase media types plus `DOCUMENT`; the single `common-space` context becomes `apartment-common` and `pro-space-common` (existing rows go to `apartment-common`) |
| `002_space_fields.sql` | `has_private_parking`; optional energy figures; free-text previous consumption |
| `003_email.sql` | Lowercase emails, enforced by a `CHECK` |
| `004_not_null.sql` | `NOT NULL` on flags and timestamps |
| `005_indexes.sql` | Indexes for lookups by unit on the grant tables |
| `006_hash_tokens.sql` | Hashes pending verification tokens, drops pending reset links, unique token indexes |
| `007_token_version.sql` | `token_version`, bumped on password reset |
| `008_media_check.sql` | Unit ID required except on common-area media |
| `009_checks.sql` | Energy rating and size `CHECK`s |
| `010_media_created_at.sql` | `NOT NULL` media timestamps |

Enum changes rebuild the type instead of using `ALTER TYPE ... ADD VALUE`, whose new value can't be used in the transaction that adds it.

### Moving legacy media files

Media uploaded before the current layout lives at `<unitId>/<originalName>-<id>.<ext>` (and `common-space/...`). It is served fine as is, since files are always read from `Media.file_path`. `scripts/moveLegacyMedia.ts` moves it to `<context>/<unitId>/<mediaId>.<ext>`, which also takes client file names off the disk, and updates each row:

```bash
docker compose -f docker-compose.prod.yml exec backend node build/scripts/moveLegacyMedia.js --dry-run
docker compose -f docker-compose.prod.yml exec backend node build/scripts/moveLegacyMedia.js
```

Each file is renamed and then its row updated, but only if the row is unchanged. A failed update moves the file back. A run that stops halfway can be resumed: a file found at its new path with a stale row is just re-pointed. Missing files and paths outside the storage root are reported and left alone. Back up the database and the `storage` volume first anyway.

To change the schema, add the next numbered file. Don't put `BEGIN`/`COMMIT` in it (the runner already wraps it), and don't quote table names (`000_init.sql` created them unquoted, so Postgres stores them in lowercase).

## Upload pipeline

```
multipart ─► multer (disk, size/count caps) ─► temp file on the storage volume
         ─► Zod: real type from magic bytes == declared MIME == allowed extension;
                 per-file, per-request (20 files) and total (500 MB) caps
         ─► transaction: INSERT row ─► move file to <context>/<unitId>/<uuid>.<ext> ─► COMMIT
              └─ on any failure: ROLLBACK and delete the moved files
         ─► on response close: delete whatever is left in temp (rejected files, aborted uploads)
```

- The type is taken from file contents (`file-type`), never from the client's `Content-Type` or file name. Images, MP4 and WebM are allowed in galleries, images only as thumbnails, images or PDF as plans.
- Stored names are random UUIDs. User file names never reach the filesystem or the `X-Accel-Redirect` header.
- The temp directory sits on the same volume as the final location, so moving a file is an atomic `rename`.
- Replacing a thumbnail or plan deletes the old file only after the new row has committed. Deleting a unit removes its rows in one transaction and its files after commit, because files can't be rolled back.
- An hourly cron job clears temp files left behind by a crash.

Serving: `GET /media/:uuid` authorizes the request, then answers with `X-Accel-Redirect` (see the root README). nginx sends `X-Content-Type-Options: nosniff` with every response.

## Errors, logging and auditing

- **Errors:** `utils/errors/normalizeError.ts` maps multer, body-parser and known Postgres errors (unique, foreign-key and check violations, bad input) to 4xx `AppError`s. Anything else is a 500 with a generic message and the request ID.
- **Logs:** structured JSON through `pino`, one line per event:
  - Unexpected errors are logged at error level with their stack.
  - Mapped Postgres errors are logged as warnings (they can also mean a bug in our own SQL).
  - 401s are logged at info level, since expired access tokens are routine.
  - Keys that look like secrets (`token`, `password`, `cookie`, `key`, `hash`, ...) are redacted. Email addresses and raw tokens are never logged.
- **Security events:** `logSecurityEvent` writes warn-level lines for failed logins (with the reason), 403s and rate-limit hits, without personal data.
- **Audit trail:** `utils/audit.ts` records who granted or revoked which access, created, edited, deleted or toggled which unit, uploaded or deleted which media, edited reviews, and deleted users. It logs `admin_audit` events with the admin's ID and target IDs only.

## Rate limiting

`express-rate-limit`, keyed by what each limiter protects. IPv6 addresses are grouped by prefix (`ipKeyGenerator`).

| Limiter | Limit | Key |
| --- | --- | --- |
| Global (all requests except media) | 150 / minute | IP |
| Browsing (`/home`, `/apartments`, `/pro-spaces`) | 90 / minute | IP (mounted before authentication) |
| Browsing (`/user`, `/auth/me`) | 90 / minute | User ID |
| Media fetch | 300 / minute | IP |
| Registration | 5 / hour | IP |
| Email verification | 5 / hour | IP |
| Resend verification email | 3 / hour | Email address |
| Forgot password | 3 / hour | Email address |
| Reset password | 5 / hour | IP |
| Login | 5 failed attempts / 30 minutes (successes not counted) | IP |
| Google sign-in | 15 / 15 minutes | IP |
| Token refresh | 10 / 15 minutes | User ID from the refresh token |
| Profile update or deletion | 3 / hour | Target user ID |
| Admin media changes | 10 / minute | User ID |

Counters are held in memory, which fits the single-instance deployment. Running several instances would need a shared store.

## API reference

All routes are served under `/api`.

### Auth (`/api/auth`)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/register` | Sends a verification email |
| POST | `/verify-email` | Token in the body |
| POST | `/resend-verification` | Same answer whether or not the account exists |
| POST | `/forgot-password` | Same answer whether or not the account exists; includes a honeypot field |
| POST | `/reset-password` | Single use; revokes all existing sessions |
| POST | `/login` | Sets session cookies |
| POST | `/google/register`, `/google/login` | Google ID token in `googleToken` |
| POST | `/refresh` | Issues a new token pair if `token_version` still matches |
| POST | `/logout` | Clears cookies |
| GET | `/me` | Current user |

### Units, media and users

| Method | Path | Access |
| --- | --- | --- |
| GET | `/apartments`, `/pro-spaces` | Public; marks which units the caller can open |
| GET | `/apartments/access-to-apartments`, `/pro-spaces/access-to-pro-spaces` | Logged in: the caller's own grants |
| GET | `/apartments/:uuid`, `/apartments/:uuid/media` (same for `/pro-spaces`) | Grant on that unit |
| GET | `/apartments/common-space/media`, `/pro-spaces/common-space/media` | Grant on any unit of that kind |
| GET | `/home/overview`, `/home/reviews` | Public |
| GET | `/media/:uuid` | Per item (see Authorization); file served by nginx |
| GET, PUT, DELETE | `/user/:uuid` | That user or an admin |
| GET | `/health` | Public; checks the database |

### Admin (`/api/admin`)

| Area | Endpoints |
| --- | --- |
| Users | `GET /users` |
| Reviews | `POST /home/reviews`, `PUT` and `DELETE /home/reviews/:id` |
| Apartments, pro spaces (`/apartments`, `/pro-spaces`) | `GET /`, `POST /`, `GET`, `PUT`, `DELETE /:uuid`, `PUT /:uuid/availability`, `GET /:uuid/media`, `GET /:uuid/user-accesses`, `GET /common-space/media`, `GET`, `POST`, `DELETE /user-accesses` (list, grant or revoke in bulk) |
| Media (`/media`) | `POST`, `DELETE /:context{/:uuid}` (gallery upload and delete), `PUT /:context{/:uuid}/reorder`, `POST`, `DELETE /:context/:uuid/thumbnail` and `/plan` |

## Development

The backend normally runs inside the dev compose stack (see the root README), which mounts the source and restarts on change.

| Command | What it does |
| --- | --- |
| `npm run dev` | nodemon + ts-node (used by the dev container) |
| `npm run build` | Compiles TypeScript to `build/` |
| `npm start` | Runs the compiled server |
| `npx tsc --noEmit` | Typecheck (`strict`, `noUnusedLocals`, `noUnusedParameters`), tests included |
| `npm test` | Integration tests (see below) |

`bash gen-secrets.sh` prints two random JWT secrets for `.env`.

## Tests

Integration tests (`tests/`, Vitest + supertest) drive the real Express app against a real PostgreSQL 17. The schema is built by the migration runner from an empty database, the way a new deployment gets it. Only the edges are faked: Resend (emails are recorded, and tests read tokens out of the link like a user would) and Google ID token verification.

```bash
docker run -d --rm --name auberge-test-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=auberge_test -p 5433:5432 postgres:17
npm test
docker stop auberge-test-pg
```

The defaults (`localhost:5433`, `postgres`/`postgres`, `auberge_test`) can be overridden with the usual `DB_*` variables. Each run drops and rebuilds the schema, so the setup refuses any `DB_NAME` that doesn't contain `test`. Test files run one at a time and each starts from empty tables. Unit tests run once per kind (apartments and pro spaces): the logic is shared, but each kind has its own tables and media contexts, and a slip in that wiring would only break one of them.

What they lock in:

| Area | Property |
| --- | --- |
| Email tokens | Only the SHA-256 is stored; the stored value is not itself a working token; verification and reset links work once |
| Sessions | A password reset bumps `token_version`, and refresh tokens issued before it get `401 Session invalide.` |
| Login | Email is case-insensitive; unknown email and wrong password return the same 401 body; unverified accounts get 403; 5 failures from one IP get a 429, even with the right password next |
| Anti-enumeration | `forgot-password` and `resend-verification` answer identically for unknown emails and send nothing |
| Response shape | `/auth/me` and login return a plain `UserDTO`, never `token_version` |
| Authorization | Admin routes need a validly signed admin token; units need a live grant on that exact unit (expired grants are refused before the nightly purge); common areas need a grant on a unit of the same kind; `/user/:uuid` is self-only |
| Media | Thumbnails are public; other media need a grant, and denied requests never get an `X-Accel-Redirect` |
| Input | Malformed UUID params are a 400, before any SQL runs |
| Uploads | The type is taken from the bytes: disguised files, a wrong declared type or a wrong extension are rejected with nothing stored and temp files removed; stored names are random |
| Admin | Create, grant, revoke and "unavailable + revoke" take effect immediately and write `admin_audit` entries; non-admins can't grant |
| Migrations | A database built from the original baseline, with data in every legacy shape, upgrades to exactly the schema of a new database, with its data converted; the baseline file is unchanged; re-running the runner is a no-op |

CI (`.github/workflows/ci.yml`) runs the typecheck and these tests against a `postgres:17` service container on every push and pull request, and builds the frontend. The workflow token is read-only. `npm run build` uses `tsconfig.build.json`, so tests never end up in `build/`.
