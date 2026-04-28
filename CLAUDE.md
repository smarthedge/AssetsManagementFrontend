# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server at http://localhost:4200 (ng serve)
npm run build      # production build
npm run watch      # dev build with watch mode
npm test           # run all unit tests (Vitest via @angular/build:unit-test)
```

There is no single-test or lint command configured. Tests use **Vitest** (not Karma/Jest) — the runner is `@angular/build:unit-test`.

## Architecture

**Angular 21 standalone components** — no NgModules anywhere. Every component declares its own `imports: []`. All routes use standalone components.

### Routing & Auth

```
/login               → LoginComponent (public)
/                    → LayoutComponent (authGuard)
  /dashboard         → DashboardComponent
  /assets            → AssetsListComponent
  /admin             → AdminComponent (roleGuard, requires role 'admin')
```

`authGuard` checks `AuthService.isLoggedIn()`. `roleGuard` checks `AuthService.hasRole()`.

### HTTP & JWT

`HttpClient` is configured globally in `app.config.ts` with `withInterceptors([jwtInterceptor])`. The interceptor handles both directions:
- **Outbound:** attaches `Authorization: Bearer <token>` if a token exists in localStorage
- **Inbound:** catches `401` responses, calls `authService.logout()` (clears localStorage, navigates to `/login`), then re-throws so component-level error handlers also see the error

**Critical:** `AuthService` injects `HttpBackend` (not `HttpClient`) to avoid a circular dependency:
```
HttpClient → jwtInterceptor → inject(AuthService) → HttpClient
```
Using `HttpBackend` creates a bypass client that skips all interceptors — correct for the login endpoint which has no token yet.

### Backend API

Base URL: `http://localhost:8080`

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/login` | Returns `{ access_token, user }` |
| `GET /api/assets?page=0&size=100` | Paginated asset list |
| `POST /api/assets` | Create — requires admin role (403 otherwise) |
| `PUT /api/assets/{id}` | Update |
| `DELETE /api/assets/{id}` | Soft delete |

Auth stores `access_token` as `auth_token` and a mapped user object as `auth_user` in localStorage. Both are cleared on `logout()`.

### Asset Model Field Mapping

The UI `Asset` interface does **not** match the API `AssetResponse` 1:1. `AssetService` owns the mapping in two private methods (`toAsset`, `toRequest`):

| UI `Asset` field | API field | Notes |
|---|---|---|
| `type` | `category` | renamed |
| `status` (`'Active'`/`'Inactive'`) | `status` (boolean) | converted |
| `lastUpdated` | `lastChangedDateTime` | trimmed to `YYYY-MM-DD` |
| `currency` | — | not in API; always `'USD'` |
| `id` | `id` (number) | stringified |

### Styling

Two separate CSS entry points defined in `angular.json`:
- `src/tailwind.css` — Tailwind v4 via PostCSS (`@tailwindcss/postcss`)
- `src/styles.scss` — global SCSS (PrimeIcons import only)

Tailwind v4 requires two PostCSS config files: `postcss.config.json` (esbuild/production) and `postcss.config.js` (Vite dev server). Both must stay in sync if PostCSS plugins change.

### UI Library

**PrimeNG 21** with the **Aura** theme preset (configured in `app.config.ts`). `ConfirmationService` must be in component-level `providers: []`, not root — scoping it to root causes dialog conflicts across routes.

### Dashboard Component State Machine

The dashboard tracks unsaved changes locally before committing to the API:

- `assets` — mutable working copy (spread from API response on load/refresh)
- `originalAssets` — snapshot at last load or successful save; used to distinguish new rows (`POST`) from edits (`PUT`)
- `dirtyIds: Set<string>` — IDs modified since last save; drives the Save button enabled state
- `duplicateNames: Set<string>` — names appearing more than once; drives amber `border-l-4` row highlight
- `filteredAssets` — derived view after search/type/status filters; holds references to the same objects as `assets`

`saveChanges()` uses `forkJoin` over HTTP observables (POST for new rows, PUT for edits). Deletes are optimistic — UI removes the row immediately, then fires `DELETE` in the background.

### Known Patterns & Gotchas

**NG0100 prevention — always end async subscribe callbacks with `cdr.detectChanges()`:** Fast localhost HTTP responses arrive as microtasks and can land between Angular's two dev-mode change detection passes. Currently applied in `doRefresh()` and both `next`/`error` callbacks of `saveChanges()`. Any new subscribe callback that flips template-visible state must also call `this.cdr.detectChanges()` at the end.

**Dirty tracking via `ngModelChange`, not `onEditComplete`:** PrimeNG's table `onEditComplete` event is unreliable — it fires only on Enter/blur, and `event.data` can be `undefined`. Each editable input has an explicit `(ngModelChange)` handler instead:
- Name → `onNameChange(asset)` — marks dirty, calls `rebuildDuplicates()`
- Value → `onValueChange(asset)` — marks dirty, coerces `+asset.value`, calls `recalcStats()`
- Type → `onTypeChange(asset)` via autocomplete `(onSelect)`/`(onBlur)` — marks dirty, calls `rebuildTypeOptions()` + `recalcStats()`

Status and Last Updated are display-only — do not add `ngModelChange` to them.

**HTTP error messages:** `DashboardComponent.httpErrorMessage(err: HttpErrorResponse)` maps status codes to user-facing strings (403 → permission denied, 401 → session expired, 409 → conflict, 404 → not found). Add new status codes here, not in individual call sites.

**`POST /api/assets` requires admin role** — the backend returns 403 for regular users. The frontend shows the mapped error message but cannot bypass this; the user must log in with an account that has the admin role.
