# Assets Page — Design Spec
**Date:** 2026-04-28  
**Status:** Approved

---

## Overview

Replace the existing read-only `AssetsListComponent` (`/assets`) with a full CRUD page built on Angular reactive forms. All changes (add, edit, delete) are staged locally and committed to the API only when the user clicks **Save Changes**. Cancel and Refresh both prompt for confirmation when unsaved changes exist. An audit log panel sits at the bottom of the page and can be hidden/shown.

---

## Architecture

### Files

```
src/app/features/assets/
  assets-list/
    assets-list.component.ts          ← thin container (replaces existing)
  components/
    asset-row/asset-row.component.ts  ← single reactive row + expand/collapse
    audit-log/audit-log.component.ts  ← presentational log panel
  services/
    assets-state.service.ts           ← FormArray, pending state, API orchestration
```

### Data Flow

```
AssetService (HTTP)
    ↓  loadAssets / saveChanges / cancelChanges / refreshData
AssetsStateService  (FormArray + deletedIds + auditLog)
    ↓  form, deletedIds, hasUnsavedChanges, saving, saveError, auditLog
AssetsListComponent  (toolbar, filters, table shell)
    ↓  [formGroup] per row    [entries] [visible]
AssetRowComponent            AuditLogComponent
```

`AssetsStateService` is `providedIn: 'root'`. All mutable state lives here. Components are coordinators and presentational shells only.

---

## `AssetsStateService`

### Form Structure

```typescript
form = fb.group({
  rows: fb.array([])
});
```

Each row `FormGroup` controls:

| Control | Type | Validators |
|---|---|---|
| `id` | string | — (hidden, non-editable) |
| `name` | string | required |
| `type` | string | required |
| `value` | number | required, min(0) |
| `status` | `'Active' \| 'Inactive'` | required |
| `description` | string | — |
| `serialNumber` | string | — |
| `purchaseDate` | string | — |

### Pending-Change State

- `originalAssets: Asset[]` — snapshot taken on load and after successful save
- `deletedIds = new Set<string>()` — staged deletes; row stays in FormArray but is flagged
- `hasUnsavedChanges` — `form.dirty || deletedIds.size > 0`
- `saving: boolean` — true while forkJoin is in flight
- `saveError: string` — last HTTP error message; cleared on next save attempt

### Public API

| Method | Behaviour |
|---|---|
| `loadAssets()` | GET assets → rebuild FormArray, clear dirty/deleted, snapshot originalAssets |
| `addRow()` | Prepend FormGroup with temp id `new-<timestamp>`, mark form dirty |
| `markDeleted(id)` | Add to `deletedIds`, mark form dirty |
| `restoreDeleted(id)` | Remove from `deletedIds` |
| `saveChanges()` | forkJoin: POST new rows + PUT dirty existing rows + DELETE deletedIds; on success reset dirty state and snapshot |
| `cancelChanges()` | Rebuild FormArray from `originalAssets`, clear deletedIds, reset form pristine |
| `refreshData(confirmFn)` | If `hasUnsavedChanges`, call `confirmFn` (confirmation callback); on confirm call `loadAssets()` |
| `log(action, detail)` | Prepend `LogEntry` to `auditLog` (capped at 50) |
| `clearLog()` | Empty `auditLog` |

`refreshData` accepts a `confirmFn: () => Promise<boolean>` so the service never imports PrimeNG directly — the component owns the dialog.

---

## Components

### `AssetsListComponent` (container)

**Toolbar (right-aligned):**
- **Show Audit Log** toggle button (hidden when log panel is visible)
- **Refresh** button — calls `state.refreshData()`; shows confirmation dialog via `ConfirmationService` if `hasUnsavedChanges`
- **Cancel** button — calls `state.cancelChanges()`; shows confirmation dialog if `hasUnsavedChanges`
- **Save Changes** button — disabled when `!hasUnsavedChanges || saving`; shows spinner icon while `saving`

**Filter bar:** search by name (text input), type multi-select, status select — same pattern as dashboard.

**Save error banner:** red alert strip above the table when `saveError` is non-empty.

**Table columns:** expand-toggle · Name · Type · Value · Status · Last Updated · Actions (delete/restore).

The component loops over `rows` FormArray, passes each `FormGroup` to `<app-asset-row>`, and passes `deletedIds.has(row.get('id')!.value)` as `[isDeleted]`.

**Audit log visibility** is controlled by `showAuditLog: boolean` on the component. The toolbar "Show Audit Log" button sets it to `true`. The log panel `(close)` event sets it to `false`.

---

### `AssetRowComponent`

**Inputs:**
- `@Input() formGroup: FormGroup`
- `@Input() isDeleted = false`
- `@Input() isNew = false`
- `@Input() knownTypes: string[]` — for autocomplete suggestions

**Outputs:**
- `@Output() deleteClicked = new EventEmitter<void>()`
- `@Output() restoreClicked = new EventEmitter<void>()`

**Inline columns (always visible):**

| Column | Control | Notes |
|---|---|---|
| Expand toggle | button `pi-chevron-right` / `pi-chevron-down` | toggles `expanded` local boolean |
| Name | `<input pInputText>` | red border when `name.invalid && name.touched` |
| Type | `<p-autocomplete>` | `knownTypes` as suggestions, free-text allowed |
| Value | `<input type="number">` | right-aligned, min 0 |
| Status | `<p-select>` Active / Inactive | |
| Last Updated | display-only text | |
| Actions | Delete or Restore button | |

**Expanded section** (`colspan="8"` below the row, shown when `expanded`):
- Description — `<textarea>`
- Serial Number — `<input>`
- Purchase Date — `<p-datepicker>`

**Visual states:**
- Deleted: `opacity-50 line-through bg-red-50`; Actions column shows **Restore** button
- New (unsaved): `bg-blue-50 border-l-4 border-blue-400`
- Invalid: red `border-l-4 border-red-400` on the row

---

### `AuditLogComponent`

**Inputs:**
- `@Input() entries: LogEntry[]`
- `@Input() visible = true`

**Outputs:**
- `@Output() close = new EventEmitter<void>()`
- `@Output() clear = new EventEmitter<void>()`

Collapsible panel at the bottom of the page. Max height `12rem`, `overflow-y-auto`. Each entry shows: time (monospace) · action (indigo bold) · detail (gray). Header row has **Clear** button and **×** close button. When `visible = false`, the panel is not rendered — the parent shows "Show Audit Log" in the toolbar instead.

---

## Unsaved-Changes Guard

Both **Cancel** and **Refresh** use `ConfirmationService` (PrimeNG) before discarding changes. Pattern identical to the existing dashboard:

```
header: 'Unsaved Changes'
message: 'You have unsaved changes. This will discard all edits. Continue?'
acceptLabel: 'Discard & Continue'
rejectLabel: 'Keep Editing'
acceptButtonStyleClass: 'p-button-danger'
```

`ConfirmationService` is added to `AssetsListComponent`'s `providers: []` (not root) to avoid dialog conflicts with other routes.

---

## Save Logic

```
saveChanges():
  1. Validate: if any row.invalid (excluding deleted rows) → set saveError, return
  2. Validate: if duplicate names (excluding deleted rows) → set saveError, return
  3. Build ops array:
     - For each id in deletedIds that exists in originalAssets → DELETE
     - For each dirty row not in deletedIds:
         - id starts with 'new-' → POST
         - else → PUT
  4. saving = true; forkJoin(ops).subscribe(...)
  5. On success: snapshot originalAssets, clear deletedIds, form.markAsPristine(), saving = false
  6. On error: saveError = httpErrorMessage(err), saving = false
  7. Caller calls cdr.detectChanges() after both next and error
```

---

## NG0100 Prevention

Per the CLAUDE.md convention: every `subscribe` callback that mutates template-visible state must call `cdr.detectChanges()` at the end. This applies to the `loadAssets()` callback and both `next`/`error` callbacks of `saveChanges()` — called in `AssetsListComponent` after delegating to the service.

---

## Routing

No route changes needed. The existing `/assets` route already points to `AssetsListComponent`.

---

## Out of Scope

- Bulk select / bulk delete
- CSV export
- Real-time sync / WebSocket
- Pagination beyond what `AssetService.getAssets(0, 100)` already provides
