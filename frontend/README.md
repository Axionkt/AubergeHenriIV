# Frontend

Single-page application for the Auberge Henri IV project, built with React and Vite. The interface is in French.

## Stack

React 19, TypeScript, Vite, React Router 7, TanStack Query, Axios, dnd-kit (drag-and-drop media ordering), `@react-oauth/google`, CSS Modules.

## Scripts

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Starts the Vite dev server (port 5173)              |
| `npm run build`     | Type-checks and builds to `dist/`                   |
| `npm run preview`   | Serves the production build locally                 |
| `npm run typecheck` | Runs the TypeScript compiler without emitting files |

In the Docker setup you normally don't run these by hand. The dev compose file runs the Vite dev server and nginx proxies it, and the production image builds the app and serves `dist/` with nginx.

## Structure

```
src/
├── main.tsx, App.tsx, router.tsx   Entry point and routes
├── pages/                          Route-level screens (home, resources, details, auth, profile, admin, archive)
├── components/
│   ├── Admin/                      Admin panels and access management
│   ├── archive/                    Historical archive timeline components
│   ├── home/                       Homepage sections
│   └── form/                       Reusable inputs (Input, Select, Switch, DateInput, ...)
├── context/                        Auth and toast providers
├── hooks/                          Session keep-alive, resource edit forms
├── lib/                            Axios instance, query client, auth and error helpers
└── types/                          Shared TypeScript types
```

## How it works

- **Data fetching.** Server state is handled by TanStack Query on top of a shared Axios instance. Requests go to `/api` on the same origin, so no CORS configuration is needed.
- **Authentication.** Sessions live in `httpOnly` cookies set by the backend, so the app never touches tokens. `AuthContext` holds the current user, a keep-alive hook refreshes the session before it expires, and route guards protect logged-in and admin-only pages.
- **Admin tools.** Admins manage listings, users and access grants from the admin page, and reorder media with drag and drop.
- **Styling.** Each component has its own CSS Module, with global styles in `index.css`.

## Environment

Frontend variables prefixed with `VITE_` are embedded at build time, so in production they must be passed as Docker build arguments rather than runtime environment variables.

The Google OAuth client ID is a public identifier (not a secret) and is set in `src/App.tsx`.
