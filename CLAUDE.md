# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Angular coding patterns and standards are in `.claude/CLAUDE.md` — read that file for component, signal, template, and accessibility rules.

## Commands

```bash
npm start                              # dev server (ng serve)
ng build --configuration development  # dev build with source maps
npm run build                          # production build
npm test                               # Vitest unit tests (NOT Karma/Jasmine)
npx prettier --write <file>            # format a file
```

## Local Setup

Three things must be running:
1. **Frontend** — `npm start` (port 4200)
2. **Backend API** — separate process at `http://localhost:3000`
3. **Docker / DB** — backend depends on a database via Docker

## Environment Files

- `src/environments/environment.development.ts` — `API_ENDPOINT: "http://localhost:3000"`. This file is swapped in during `ng serve` / dev builds.
- `src/environments/environment.ts` — production template with `API_ENDPOINT: ''`. Never hardcode URLs elsewhere.

## Tailwind v4

No `tailwind.config.js`. All design tokens live in `src/styles.css` under `@theme`. Use Tailwind v4 class names:
- `bg-linear-to-br` (not `bg-gradient-to-br`)
- `bg-linear-to-t` (not `bg-gradient-to-t`)

Design tokens: `ink`, `ink-soft`, `paper`, `paper-warm`, `ember`, `ember-deep`, `sun`, `crimson`, `crimson-light`, `sage`, `earth`, `bone`.

## Adding a New API Integration

Follow this pattern — all three steps required:

1. **Endpoint constant** → `src/app/shared/constants/api-endpoints.ts`
2. **TypeScript type** → `src/app/shared/interfaces/<domain>.interface.ts`
3. **Service method** → `src/app/features/<feature>/services/<feature>.service.ts`

Auth interceptor attaches Bearer tokens to all requests matching `environment.API_ENDPOINT`. To skip the auth retry on a route, add it to `SKIP_AUTH_RETRY_ENDPOINTS` in `api-endpoints.ts`. Never use `HttpBackend` to bypass interceptors.

## Adding a New Page

1. Create `src/app/features/<feature>/pages/<page-name>/<page-name>.ts` + `<page-name>.html`
2. Register the route in `src/app/features/<feature>/pages/<feature>.routes.ts` using `loadComponent`
3. Use `host: { class: 'flex-1 flex flex-col' }` so the page fills the shell correctly
