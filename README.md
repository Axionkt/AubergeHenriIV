# Auberge Henri IV

A web application for managing prospective tenant applications at Auberge Henri IV. Instead of exchanging photos and unit details over email, administrators publish apartments and professional spaces on the site and decide exactly which registered users can view which units.

> **Live site:** coming soon

## Features

- **Permission-controlled listings.** Anyone can browse the public overview, but the details and media of an apartment or professional space are only visible to users an admin has granted access to.
- **Accounts.** Registration with email verification, Google sign-in, and password reset by email.
- **Admin dashboard.** Manage users, apartments, professional spaces, common-space media and homepage reviews. Grant or revoke per-user access, toggle availability (optionally revoking existing access), and upload, drag-and-drop reorder and delete media.
- **Protected media.** Photos and files are served only after the backend has checked the viewer's permissions.
- **Historical archive.** A dedicated French-language page presenting the building's history as a timeline.

The interface is in French; the code and documentation are in English.

## Tech stack

| Layer          | Technology                                                                     |
| -------------- | ------------------------------------------------------------------------------ |
| Frontend       | React 19, TypeScript, Vite, React Router, TanStack Query, dnd-kit, CSS Modules |
| Backend        | Node.js, Express 5, TypeScript, Zod, JWT (httpOnly cookies), bcrypt            |
| Database       | PostgreSQL 17 (`pg`, plain SQL)                                                |
| Email          | Resend                                                                         |
| Infrastructure | Docker Compose, nginx, Cloudflare                                              |

## Architecture

```
Browser ──► Cloudflare ──► nginx (TLS, routing)
                              │
                              ├── /          ──► frontend container (static build served by nginx)
                              ├── /api/      ──► backend (Express) ──► PostgreSQL
                              └── /internal/storage/  (internal only: files served by nginx
                                                       after the backend authorizes the request)
```

## Project structure

```
.
├── backend/              Express API (routes, services, schemas, middleware, SQL init/seed)
├── frontend/             React app (Vite)
├── nginx/                nginx configs (dev.conf, prod.conf)
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── .env.example
```

See [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md) for details on each part.

## Running locally

**Prerequisites:** Docker with the Compose plugin.

1. Copy the environment template and fill it in:
   ```bash
   cp .env.example .env
   ```
   Generate random secrets with `node backend/gen-secrets.sh` or `openssl rand -base64 48`. A `RESEND_API_KEY` is only needed for flows that send email (registration, password reset).
2. Start the stack:
   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```
3. Open <http://localhost>.

The database is created and filled with **fake sample data** on first start (`backend/db/init.sql` and `backend/db/seed.sql`). These run only when the database volume is empty. To reset everything, run `docker compose -f docker-compose.dev.yml down -v`.

| Account                                              | Password | Role                                    |
| ---------------------------------------------------- | -------- | --------------------------------------- |
| `admin@mail.com`                                     | `test`   | Admin                                   |
| `user1@mail.com`, `user2@mail.com`, `user3@mail.com` | `test`   | User, each with different access grants |

These credentials exist for local development only. The seed file is never mounted in the production compose file.

## Environment variables

Copy `.env.example` to `.env`. Real values are never committed.

| Variable             | Purpose                                |
| -------------------- | -------------------------------------- |
| `DB_PASSWORD`        | PostgreSQL password                    |
| `JWT_ACCESS_SECRET`  | Signs short-lived access tokens        |
| `JWT_REFRESH_SECRET` | Signs refresh tokens                   |
| `RESEND_API_KEY`     | Resend API key for transactional email |
| `FRONTEND_URL`       | Public site URL (production)           |

The Google OAuth client ID is a public identifier (not a secret) and is set in `frontend/src/App.tsx`.

## Deployment

The production setup runs on a single VPS with Docker Compose behind Cloudflare.

1. Clone the repository on the server.
2. Create the files that are intentionally not in git: `.env` (with freshly generated secrets, `chmod 600`) and `nginx/certs/` containing a Cloudflare Origin Certificate (`fullchain.pem`, `privkey.pem`).
3. Set Cloudflare's SSL/TLS mode to **Full (strict)** and point the DNS record at the server with the proxy enabled.
4. Start the stack:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
5. Create the first admin: register a normal account on the site, then promote it directly in the database:
   ```bash
   docker compose -f docker-compose.prod.yml exec db psql -U app_user -d ah4_database \
     -c "UPDATE users SET is_admin = true WHERE email = 'you@example.com';"
   ```

Production builds use multi-stage Dockerfiles: the frontend is compiled by Vite and served as static files by nginx, and the backend runs the compiled JavaScript as a non-root user. The database and uploaded files live in named Docker volumes, so back both up regularly (`pg_dump` plus a copy of the storage volume).

## Technical highlights

- **Cookie-based authentication.** Access and refresh JWTs are stored in `httpOnly`, `SameSite=Strict` cookies (`Secure` in production), so scripts in the browser cannot read them. The refresh cookie is scoped to the refresh endpoint only.
- **Authorization checked before files are served.** The media endpoint authorizes the request, then hands the actual file transfer to nginx through an internal `X-Accel-Redirect`. Files are never reachable by guessing a path.
- **Layered access control.** Public routes use optional authentication, protected routes require it, and resource routes additionally check that the user was granted access to that specific apartment or space.
- **Validation at the boundary.** Request bodies, query strings and route parameters are validated with Zod and UUID parameter checks. Uploads are size- and count-limited and inspected server-side.
- **Layered rate limiting.** A global per-IP limit plus per-route limiters keyed by user ID, IP or email address depending on what is being protected (for example, failed logins are counted per IP and password-reset emails per address), with IPv6-safe key generation.
- **Small, reproducible deployment.** Everything runs from two compose files, with no secrets in the repository.

## Roadmap

- Form management, so administrators can send forms to applicants through the site
- Possibly an in-app chat to replace email entirely

## License

The source code is released under the MIT License, with exclusions. The name "Auberge Henri IV", all branding, text, images and media, and the site's visual design are **not** licensed, and may not be used to publish a website that replicates or resembles the original. See [`LICENSE`](LICENSE) for the full terms.

## Author

Built by Kelian Yvon.
