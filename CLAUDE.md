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
| `description` | `description` | optional |
| `serialNumber` | `serialNumber` | optional |
| `purchaseDate` | `purchaseDate` | optional |
| `version` | `version` | optional; for optimistic concurrency |

`toRequest` omits `status` — the API derives active/inactive from context, not a writable boolean.

### Login Page (`/login`)

`LoginComponent` uses a **split-panel sliding card** UI driven by `isSignUpActive: boolean` that toggles an `.active` class on the card. CSS transitions handle the panel slide; no JS animation library is used.

- **Sign-up panel is UI-only**: The "Create Account" form has unbound inputs and no submit handler — there is no registration API endpoint yet.
- **Component-scoped CSS**: Unlike every other page (which uses Tailwind), `LoginComponent` carries a large inline `styles: []` block. Do not replace it with Tailwind classes without testing the slide animation carefully.
- **`*ngIf` vs `@if`**: The error banner uses `*ngIf` (requires `CommonModule` in `imports`). Other components use Angular 17+ `@if` control flow. Keep each file consistent with itself; do not mix within a component.
- **Demo credentials** are displayed in the UI (`admin`/`admin123`, `user`/`user123`) — intentional for the demo environment.

### Styling

Two separate CSS entry points defined in `angular.json`:
- `src/tailwind.css` — Tailwind v4 via PostCSS (`@tailwindcss/postcss`)
- `src/styles.scss` — global SCSS (PrimeIcons import only)

Tailwind v4 requires two PostCSS config files: `postcss.config.json` (esbuild/production) and `postcss.config.js` (Vite dev server). Both must stay in sync if PostCSS plugins change.

### UI Library

**PrimeNG 21** with the **Aura** theme preset (configured in `app.config.ts`). `ConfirmationService` must be in component-level `providers: []`, not root — scoping it to root causes dialog conflicts across routes.

### Assets Page Architecture (`/assets`)

The assets page uses a **reactive-form CRUD** pattern split across three layers:

**`AssetsStateService`** (`providedIn: 'root'`) owns all mutable state:

- `form: FormGroup` with a single `rows: FormArray` — one `FormGroup` per asset
- `originalAssets: Asset[]` — snapshot at last load/save; used to distinguish new rows (`POST`) from edits (`PUT`)
- `deletedIds: Set<string>` — IDs soft-deleted in the UI but not yet sent to the API
- `hasUnsavedChanges` — `form.dirty || deletedIds.size > 0`
- `knownTypes: string[]` — derived live from current row values; drives the type autocomplete
- `auditLog: LogEntry[]` — capped at 50 entries, newest first

New rows get `id: 'new-<timestamp>'`. `saveChanges()` uses this prefix to route `POST` vs `PUT`. After a successful save it calls `loadAssets()` to re-sync.

**`AssetsListComponent`** is a thin coordinator: it holds filter state (`searchText`, `filterTypes`, `filterStatus`), calls `state.*` methods, and calls `cdr.detectChanges()` in every callback.

**`AssetRowComponent`** uses an **attribute selector** (`selector: '[appAssetRow]'`) so it renders as a `<tr>` element without a wrapper tag. It receives a `FormGroup` via `[rowGroup]` input and emits `deleteClicked`/`restoreClicked`/`toggleExpand` events.

**`AuditLogComponent`** is display-only: receives `LogEntry[]`, emits `close`/`clear` events.

### Dashboard Component State Machine

The dashboard (`/dashboard`) independently tracks unsaved changes before committing to the API (separate from `AssetsStateService`):

- `assets` — mutable working copy (spread from API response on load/refresh)
- `originalAssets` — snapshot at last load or successful save; used to distinguish new rows (`POST`) from edits (`PUT`)
- `dirtyIds: Set<string>` — IDs modified since last save; drives the Save button enabled state
- `duplicateNames: Set<string>` — names appearing more than once; drives amber `border-l-4` row highlight
- `filteredAssets` — derived view after search/type/status filters; holds references to the same objects as `assets`

`saveChanges()` uses `forkJoin` over HTTP observables (POST for new rows, PUT for edits). Deletes are optimistic — UI removes the row immediately, then fires `DELETE` in the background.

### Known Patterns & Gotchas

**NG0100 prevention — always end async subscribe callbacks with `cdr.detectChanges()`:** Fast localhost HTTP responses arrive as microtasks and can land between Angular's two dev-mode change detection passes. Every `AssetsListComponent` and `DashboardComponent` callback that mutates template-visible state must call `this.cdr.detectChanges()` at the end.

**Assets page dirty tracking uses Angular reactive forms:** `form.dirty` (set by `FormArray` controls) plus `deletedIds.size > 0`. Do not replicate the dashboard's manual `dirtyIds: Set<string>` approach in the assets page.

**`AssetRowComponent` is an attribute-selector component:** Its selector is `[appAssetRow]`, applied to a `<tr>` in `AssetsListComponent`'s template. Pass the `FormGroup` via `[rowGroup]`, not `[formGroup]`, to avoid conflicts with Angular's own `FormGroupDirective`.

**HTTP error mapping locations:**

- Assets page → `AssetsStateService._httpError()` (private)
- Dashboard → `DashboardComponent.httpErrorMessage()`

Add new status codes to both. Mapping: 403 → permission denied, 401 → session expired, 409 → conflict, 404 → not found.

**Save validation before HTTP calls:** `AssetsStateService.saveChanges()` validates required fields and unique names client-side before firing any HTTP request. It calls `markAllAsTouched()` on invalid rows to surface inline errors.

**`POST /api/assets` requires admin role** — the backend returns 403 for regular users. The frontend shows the mapped error message but cannot bypass this; the user must log in with an account that has the admin role.
