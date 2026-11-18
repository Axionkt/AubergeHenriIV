# Auberge Henri IV

A production web application that controls who can see which apartments and professional spaces at Auberge Henri IV, a residential building in France. Instead of exchanging photos and floor plans over email, the building's administrators publish units on the site and grant individual registered users time-limited access to each one.

> **Live site:** [https://auberge-henri4.com](https://auberge-henri4.com)

The application is in real use. This public repository also serves as a portfolio piece focused on **backend, infrastructure and security engineering**: per-resource authorization, session handling, file-upload safety, database migrations, and a hardened single-server deployment. The sections below are written with that reader in mind.

## At a glance

| Area | What is in this repository |
| --- | --- |
| Authorization | Per-user, per-unit access grants with expiry, enforced in middleware before any data or file is returned |
| Authentication | Email/password (bcrypt) and Google sign-in (server-side authorization code flow with PKCE); short-lived JWT access tokens and revocable refresh tokens in `httpOnly` cookies |
| File security | Magic-byte type detection, random storage names, atomic moves, files served by nginx only after an authorization check (`X-Accel-Redirect`) |
| Data | PostgreSQL 17 with plain SQL, a transactional migration runner, and `CHECK` constraints that mirror input validation |
| Abuse resistance | Layered rate limiting keyed by IP, user or email; enumeration-safe auth responses; constant-time login path |
| Observability | Structured JSON logs with request IDs, secret redaction, security events and an admin audit trail |
| Infrastructure | Docker Compose behind Cloudflare and nginx; non-root, read-only, capability-less API container; health-gated startup |

## Architecture

```
Browser ──► Cloudflare (TLS, proxy) ──► nginx (TLS, security headers, real client IP)
                                          │
                                          ├── /                    ──► frontend   React SPA, static files served by nginx
                                          ├── /api/                ──► backend    Express 5 API ──► PostgreSQL 17
                                          │                                       │
                                          │                                       └─ Resend (transactional email)
                                          └── /internal/storage/   internal only: nginx streams a file after the
                                                                   backend has authorized the request
```

All services run from one Compose file on a single VPS. Uploaded files and the database live in named Docker volumes.

### How a protected file is served

1. The browser requests `GET /api/media/:uuid` with its session cookie.
2. The backend loads the media row and checks the caller's grant for that unit (thumbnails are public; everything else needs a live grant or admin rights).
3. On success the backend responds with no body, only `X-Accel-Redirect: /internal/storage/<path>`.
4. nginx streams the file from the storage volume. That location is marked `internal`, so it can't be requested directly, and storage paths are random UUIDs that are never derived from user input.

The Node process never streams large files, and there is no URL that bypasses the authorization check.

## Security design

| Threat | Mitigation |
| --- | --- |
| Session theft through XSS | Tokens are only in `httpOnly` cookies. React escapes output, and rich text is rendered as React elements, never as raw HTML. A Content-Security-Policy is staged in report-only mode |
| CSRF | `SameSite=Strict` cookies. The API parses JSON only (plus multipart on admin upload routes), never form-encoded bodies |
| Stolen refresh token | The refresh cookie is scoped to `/api/auth/refresh`. Refresh tokens carry a `token_version`, which a password reset increments, revoking every existing session |
| Forged Google login | Server-side code flow: `state` bound to a signed, short-lived cookie, PKCE, and `nonce`; the ID token's signature and audience are verified (`google-auth-library`) and a verified Google email is required |
| Database leak exposing account links | Email verification and reset tokens are stored as SHA-256 hashes; only the emailed link holds the raw value. Reset links are single-use and expire after 1 hour |
| Account enumeration | Forgot-password and resend-verification answer the same whether or not the account exists. Login gives one error for unknown emails and wrong passwords, and always runs bcrypt so timing doesn't tell them apart. (Registration is the deliberate exception, see below) |
| Brute force and email flooding | Per-route rate limits keyed on what is being protected (failed logins per IP, reset emails per address, refresh per user). Security events are logged |
| Malicious uploads | Type detected from file bytes and checked against the declared type and extension. Per-file, per-request and total size caps. Files stored under random names outside any web root |
| IDOR on units and media | Every `:uuid` route goes through an authorization middleware that checks the grant for that specific resource. Params are validated as UUIDs before reaching SQL |
| SQL injection | Parameterized queries everywhere. The few interpolated identifiers (table names in the shared space services) come from fixed constants, never from requests |
| Spoofed client IPs | nginx trusts `CF-Connecting-IP` only from Cloudflare's published ranges and overwrites `X-Forwarded-For`; Express trusts exactly one proxy hop |
| Container compromise | API runs as a non-root user on a read-only filesystem with all Linux capabilities dropped, `no-new-privileges`, and memory limits |
| Secrets in the repository | All secrets come from `.env`, which is git-ignored. Compose refuses to start if one is missing, and the backend validates them again at startup |

### Known tradeoffs

- **Stateless refresh tokens.** Logout clears cookies but doesn't revoke a copied refresh token before it expires (7 days). A password reset does revoke all sessions. A per-token revocation list wasn't worth it for this user base.
- **Admin flag in the access token.** Demoting an admin takes effect when their access token expires (at most 15 minutes).
- **In-memory rate limits.** These suit a single instance. They would move to Redis if the API ever ran on more than one.
- **Registration says when an email is already taken.** This is a deliberate UX choice, bounded by a limit of 5 attempts per hour per IP.

## Tech stack

| Layer | Technology |
| --- | --- |
| Backend | Node.js 22, Express 5, TypeScript, Zod, `pg` (plain SQL), `jsonwebtoken`, bcrypt, `google-auth-library`, multer, `file-type`, pino |
| Database | PostgreSQL 17 |
| Frontend | React 19, TypeScript, Vite, React Router, TanStack Query, dnd-kit, CSS Modules |
| Email | Resend |
| Infrastructure | Docker Compose, nginx, Cloudflare |

## Repository layout

```
.
├── backend/                 Express API: routes, services, schemas, middleware, migrations
├── frontend/                React SPA (public site, user area, admin dashboard)
├── nginx/                   Reverse proxy configs: dev.conf, prod.conf
├── docker-compose.dev.yml   Local stack with hot reload and seed data
├── docker-compose.prod.yml  Production stack
└── .env.example             Required environment variables
```

[`backend/README.md`](backend/README.md) covers the API design, auth flows, data model and upload pipeline in depth. [`frontend/README.md`](frontend/README.md) covers the client.

## Features

- **Permission-controlled listings.** Anyone can browse the public overview; the details, photos, videos and floor plans of a unit are only visible to users granted access to it.
- **Accounts.** Registration with email verification, Google sign-in, password reset by email, profile editing and self-service account deletion.
- **Admin dashboard.** Manage units, common-area media, homepage reviews and users. Grant or revoke access in bulk with an optional expiry date, mark units unavailable (optionally revoking all their access), and upload, reorder and delete media.
- **Historical archive.** A French-language page presenting the building's history as a timeline.

The interface is in French; the code and documentation are in English.

## Running locally

**Prerequisites:** Docker with the Compose plugin.

1. Create your environment file:
   ```bash
   cp .env.example .env
   ```
   Generate the JWT secrets with `bash backend/gen-secrets.sh`. Compose refuses to start if a variable is missing. Locally, a placeholder `RESEND_API_KEY` is fine: emails then fail and are logged, without breaking the request.
2. Start the stack:
   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```
3. Open <http://localhost>.

On first start, Postgres creates the baseline schema from `backend/db/migrations/000_init.sql` and loads **fake sample data** from `backend/db/seed.sql`. The backend then applies the numbered migrations on top. To start over: `docker compose -f docker-compose.dev.yml down -v`.

| Account | Password | Role |
| --- | --- | --- |
| `admin@mail.com` | `test` | Admin |
| `user1@mail.com`, `user2@mail.com`, `user3@mail.com` | `test` | Users with different access grants (`user3` is unverified) |

These accounts exist only in the dev seed, which the production compose file never mounts.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `FRONTEND_URL` | Public site URL, used in email links (production; dev sets it) |
| `DB_PASSWORD` | PostgreSQL password |
| `JWT_ACCESS_SECRET` | Signs 15-minute access tokens (32+ characters) |
| `JWT_REFRESH_SECRET` | Signs 7-day refresh tokens (32+ characters) |
| `GOOGLE_CLIENT_ID` | Google OAuth client; also the audience required on Google ID tokens |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret, used to exchange the sign-in code (secret) |
| `RESEND_API_KEY` | Resend API key for transactional email |

The compose files set the rest (`NODE_ENV`, `DB_*`, `STORAGE_ROOT`). Optional: `UPLOAD_TMP_DIR` (defaults to `STORAGE_ROOT/.tmp`, on the same volume so moves are atomic) and `LOG_LEVEL` (default `info`). `backend/config.ts` validates everything at startup and exits with a clear message if something is missing.

Google sign-in is a server-side redirect, so the frontend has no Google configuration. The Google console must list `<FRONTEND_URL>/api/auth/google/callback` as an authorized redirect URI.

## Deployment

Production is one VPS running `docker-compose.prod.yml` behind Cloudflare.

1. Clone the repository on the server.
2. Add the files that are deliberately not in git: `.env` (freshly generated secrets, `chmod 600`) and `nginx/certs/` with a Cloudflare Origin Certificate (`fullchain.pem`, `privkey.pem`). Set `server_name` in `nginx/prod.conf`.
3. Set Cloudflare's SSL/TLS mode to **Full (strict)** and proxy the DNS record.
4. Firewall ports 80 and 443 to [Cloudflare's IP ranges](https://www.cloudflare.com/ips/) only (for example with `ufw`), so the origin can't be reached around Cloudflare.
5. Start the stack:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
6. Create the first admin: register on the site, then promote the account:
   ```bash
   docker compose -f docker-compose.prod.yml exec db psql -U app_user -d ah4_database \
     -c "UPDATE users SET is_admin = true WHERE email = 'you@example.com';"
   ```

### Container hardening

| Service | Hardening |
| --- | --- |
| backend | Multi-stage build, production dependencies only, runs as `node`, read-only root filesystem with a `tmpfs` for `/tmp`, `cap_drop: ALL`, `no-new-privileges`, 512 MB memory limit, `/health` check (database included) |
| nginx | Pinned `nginx:1.28-alpine`, `no-new-privileges`, storage volume mounted read-only, starts only once the backend is healthy |
| db | Major version pinned (`postgres:17`), not published to the host in production, health-checked |
| all | JSON log rotation (5 × 10 MB per container), `restart: unless-stopped` |

The API runs `node` directly as PID 1, so a `docker compose` stop or redeploy sends it SIGTERM. In-flight requests finish (with a 10-second cap) and the database pool closes cleanly.

## Operations

- **Updates:** `git pull`, then `docker compose -f docker-compose.prod.yml up -d --build`. Pending migrations run before the API accepts traffic. A failed migration rolls back and the API exits instead of starting on a half-migrated schema.
- **Backups:** back up the database and the `storage` volume nightly, and copy both off the server. For example `docker compose -f docker-compose.prod.yml exec -T db pg_dump -U app_user ah4_database | gzip > ah4-$(date +%F).sql.gz`, plus an archive of the storage volume. Test a restore.
- **Logs:** one JSON line per event with a request ID, which the API also returns in the `X-Request-Id` header and in error bodies. They contain IP addresses and user IDs, but never emails, passwords or tokens. Admin actions appear as `admin_audit` events. Retention is bounded by the log rotation above.
- **Scheduled jobs:** expired unverified accounts and expired access grants are purged daily, and orphaned upload temp files hourly.

## Roadmap

- Forms that administrators can send to applicants through the site
- Possibly an in-app chat to replace email entirely

## License

The source code is released under the MIT License, with exclusions. The name "Auberge Henri IV", all branding, text, images and media, and the site's visual design are **not** licensed, and may not be used to publish a website that replicates or resembles the original. See [`LICENSE`](LICENSE) for the full terms.

## Author

Built and operated by Kelian Yvon.
