# Backend

REST API for the Auberge Henri IV application. Built with Express 5 and TypeScript, backed by PostgreSQL.

## Stack

Express 5, TypeScript, PostgreSQL (`pg`), Zod, `jsonwebtoken`, `bcrypt`, `cookie-parser`, `express-rate-limit`, `multer`, `file-type`, `node-cron`, Resend.

## Structure

```
backend/
├── server.ts          App setup and router mounting
├── db.ts              PostgreSQL connection pool
├── cron.ts            Scheduled jobs (node-cron)
├── rateLimiting.ts    Per-route rate limiters
├── routes/            HTTP layer (public/user routes, plus routes/admin/)
├── schemas/           Zod request validation
├── services/          Business logic and SQL (plus services/admin/)
├── middleware/        Auth, authorization, param validation, error handling
├── models/ types/     Database row and API types
├── utils/             Password/token helpers, email, errors, logging sanitizer
└── db/                init.sql (schema) and seed.sql (fake dev data)
```

Requests flow through **route → validation schema → service → database**. Routes stay thin, services own the logic, and errors are raised as typed `AppError` subclasses that a central error handler turns into HTTP responses.

## Scripts

| Command         | What it does                                                   |
| --------------- | -------------------------------------------------------------- |
| `npm run dev`   | Starts the server with nodemon (used inside the dev container) |
| `npm run build` | Compiles TypeScript to `build/`                                |

## Authentication and authorization

- Login issues a 15-minute access token and a 7-day refresh token, both as `httpOnly`, `SameSite=Strict` cookies. The refresh cookie is only sent to `/api/auth/refresh`.
- Passwords are hashed with bcrypt. Google sign-in is supported and requires a verified Google email.
- `authMiddleware` requires a valid session, `optionalAuthMiddleware` attaches the user if present, and `authorizeApartment` / `authorizeProSpace` / `authorizeUser` check permissions on the specific resource.
- Every `/api/admin` route requires a logged-in admin (`authMiddleware` followed by `authorizeAdmin`).

## API overview

All routes are served under `/api`.

### Auth (`/api/auth`)

| Method | Path                                | Notes                                  |
| ------ | ----------------------------------- | -------------------------------------- |
| POST   | `/register`                         | Sends a verification email             |
| GET    | `/verify-email`                     | Confirms the email address             |
| POST   | `/resend-verification`              |                                        |
| POST   | `/forgot-password`                  | Includes a honeypot field against bots |
| POST   | `/reset-password`                   |                                        |
| POST   | `/login`                            | Sets session cookies                   |
| POST   | `/google/register`, `/google/login` | Google OAuth                           |
| POST   | `/refresh`                          | Rotates the tokens                     |
| POST   | `/logout`                           | Clears cookies                         |
| GET    | `/me`                               | Current user                           |

### Resources

| Method           | Path                                                                                              | Access                                            |
| ---------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| GET              | `/apartments`                                                                                     | Public (results depend on the user, if logged in) |
| GET              | `/apartments/access-to-apartments`                                                                | Logged in                                         |
| GET              | `/apartments/:uuid`, `/apartments/:uuid/media`                                                    | Logged in with read access                        |
| GET              | `/pro-spaces`, `/pro-spaces/access-to-pro-spaces`, `/pro-spaces/:uuid`, `/pro-spaces/:uuid/media` | Same rules as apartments                          |
| GET              | `/common-spaces/media`                                                                            | Logged in                                         |
| GET              | `/home/overview`, `/home/reviews`                                                                 | Public                                            |
| GET              | `/media/:uuid`                                                                                    | Authorized per item, then served by nginx         |
| GET, PUT, DELETE | `/user/:uuid`                                                                                     | The user themselves or an admin                   |

### Admin (`/api/admin`)

| Area                      | Endpoints                                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Users                     | `GET /users`                                                                                                                                                                                                  |
| Home reviews              | `POST /home/reviews`, `PUT` and `DELETE /home/reviews/:id`                                                                                                                                                    |
| Apartments and pro spaces | `POST /create`, `GET /`, `GET`, `PUT`, `DELETE /:uuid`, `PUT /:uuid/availability`, `GET /:uuid/media`, and `GET`, `POST`, `DELETE /user-accesses` to grant or revoke access (plus `GET /user-accesses/:uuid`) |
| Common spaces             | `GET /common-spaces/media`                                                                                                                                                                                    |
| Media                     | Upload, reorder and delete files per context, plus thumbnail upload and delete                                                                                                                                |

## Media handling

Uploads use `multer` with in-memory storage and enforced limits on file size and count, then are validated server-side before being written to the storage volume. Files are never served directly: the media endpoint checks permissions and responds with an `X-Accel-Redirect` header so nginx streams the file from an internal-only location.

## Rate limiting

Rate limiting is layered with `express-rate-limit`. A global limiter applies to every request, and stricter limiters sit on sensitive routes. Each limiter picks its key based on what it protects: the user ID when the request is authenticated, the email address for email-sending endpoints, and the client IP otherwise (using `ipKeyGenerator`, so IPv6 addresses are grouped by prefix). The server trusts one proxy hop and nginx restores the real visitor IP behind Cloudflare, so IP-based limits apply per visitor.

| Limiter                                          | Limit                                                              | Key                            |
| ------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------ |
| Global (all requests except media)               | 150 / minute                                                       | IP                             |
| Browsing (`/home`, `/apartments`, `/pro-spaces`) | 90 / minute                                                        | IP                             |
| Browsing (`/user`, `/common-spaces`, `/auth/me`) | 90 / minute                                                        | User ID                        |
| Media fetch                                      | 300 / minute                                                       | IP                             |
| Registration                                     | 5 / hour                                                           | IP                             |
| Email verification                               | 5 / hour                                                           | IP                             |
| Resend verification email                        | 3 / hour                                                           | Email address                  |
| Forgot password                                  | 3 / hour                                                           | Email address                  |
| Reset password                                   | 5 / hour                                                           | IP                             |
| Login                                            | 5 failed attempts / 30 minutes (successful logins are not counted) | IP                             |
| Google sign-in                                   | 15 / 15 minutes                                                    | IP                             |
| Token refresh                                    | 10 / 15 minutes                                                    | User ID from the refresh token |
| Profile update                                   | 3 / hour                                                           | User ID                        |
| Admin media changes                              | 10 / minute                                                        | User ID                        |

Counters are held in memory, which suits a single-instance deployment. They reset when the server restarts.

## Security notes

- Zod validates every body and query string, and route parameters are checked as UUIDs.
- Layered rate limiting protects authentication, token refresh, media fetching and admin uploads (see above).
- Log data is sanitized before it is written.
- Secrets come from environment variables only (see the root README).
