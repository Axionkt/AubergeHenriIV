# Frontend

Single-page application for Auberge Henri IV, built with React 19 and Vite. It is the public site, the user area and the admin dashboard in one app. The interface is in French.

The interesting engineering in this project is mostly server-side (see the [root](../README.md) and [backend](../backend/README.md) READMEs). This document covers how the client works with that backend: sessions, authorization-aware routing, and the admin tools.

## Stack

React 19, TypeScript, Vite, React Router 7, TanStack Query, Axios, dnd-kit (drag-and-drop media ordering), CSS Modules.

## Structure

```
src/
├── main.tsx, App.tsx, router.tsx   Entry point, providers, routes (with data loaders and guards)
├── pages/                          Route-level screens: home, unit details, auth flows, profile, admin, archive
├── components/
│   ├── admin/                      Admin panels, access manager, resource edit form, media management
│   ├── archive/                    Historical timeline
│   ├── home/                       Homepage sections
│   └── form/                       Reusable inputs (Input, Select, Switch, DateInput, rich-text Textarea, ...)
├── context/                        Auth and toast providers
├── hooks/                          Session keep-alive, admin resource edit form
├── lib/                            Axios instance and refresh logic, query client and keys, error helpers
└── types/                          API response types, mirroring the backend DTOs
```

## Sessions

The app never sees a token: the backend sets access and refresh tokens as `httpOnly` cookies, and the client works with them only through HTTP status codes.

- **Page load.** `AuthContext` calls `/auth/me`. On a 401 it tries one refresh and asks again, so a returning visitor whose 15-minute access token expired is still logged in (the refresh token lasts 7 days). If the refresh also fails, the visitor is anonymous.
- **During use.** An Axios interceptor catches a 401 on any non-auth request, refreshes once, and replays the request. Concurrent 401s share a single in-flight refresh (`lib/auth.ts`). If the refresh fails, the session is over: cookies are cleared and the user is sent to the login page.
- **Media pages.** The browser loads images and videos itself, so the interceptor can't retry them. Unit detail pages therefore refresh the token on a timer and whenever the tab becomes visible again (`hooks/useAccessTokenKeepAlive.ts`).
- **Google sign-in.** `components/GoogleAuthButton.tsx` is a plain link to the backend's `/api/auth/google/start`, which runs the whole redirect flow. Errors come back as a `?erreur=` code, mapped to a message in `lib/googleAuth.ts`.
- **Email links.** The verification page reads the token from its URL and POSTs it to the API, so link-prefetching email scanners can't verify an account by opening the link.

## Routing and authorization

`ProtectedRoute` and `AdminRoute` (in `components/RouteGuards.tsx`) wait for the session check, then redirect to login, or home for non-admins. These guards are **UX only**. Every protected API route and every media file is authorized again by the backend, and the backend is the only real line of defense.

## Data fetching

- TanStack Query on top of one Axios instance with `baseURL: "/api"`. The API is on the same origin, so there is no CORS configuration and the cookies are first-party.
- Query keys are centralized in `lib/query.ts`, so a mutation can invalidate exactly the lists and details it changed.
- API errors carry a French `message` and, for validation errors, per-field `errors`. The admin forms map these onto the matching inputs.

## Rendering user content

Unit descriptions and reviews support a small Markdown-like syntax (lists, quotes, bold, italic, links). The renderer in `components/form/Textarea.tsx` builds React elements and never uses `dangerouslySetInnerHTML`. Links are only accepted with `http(s):` or `mailto:` schemes and open with `rel="noopener noreferrer nofollow"`. The backend also strips HTML tags before storage, so this is defense in depth.

## Admin tools

- **Resource editor** (`hooks/useResourceEditForm.ts`), shared by apartments and pro spaces. Media changes (new files, deletions, reordering, thumbnail, plan) are staged locally and sent to the API only on save, in a fixed order.
- **Access manager.** Grant or revoke access for many users and units at once, with an optional expiry date.
- **Drag-and-drop ordering** of gallery media with dnd-kit.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 5173 (proxies `/api` to the backend) |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript only |

In the Docker setup you don't normally run these yourself. The dev compose file runs the Vite dev server behind nginx, and the production image builds `dist/` and serves it with nginx. `index.html` is always revalidated, and the fingerprinted `assets/` are cached for a year.

## Configuration

There are no runtime environment variables. Google sign-in is a plain link to the backend's `/api/auth/google/start`, so the frontend has no Google configuration and loads nothing from Google. Any future `VITE_*` variable is embedded at build time, so it would have to be passed as a Docker build argument.
