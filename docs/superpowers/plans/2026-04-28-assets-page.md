# Assets Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the read-only `/assets` page with a full CRUD page using Angular reactive forms, a `FormArray`-backed table with staged add/edit/delete, cancel/refresh confirmation dialogs, and a collapsible audit log.

**Architecture:** An `AssetsStateService` (facade) owns the `FormArray`, all pending-change state, and API orchestration. A thin `AssetsListComponent` container renders the table (PrimeNG `p-table` with `filteredControls` as the value), delegates every action to the service, and calls `cdr.detectChanges()` after every async callback. Two child components handle isolated concerns: `AssetRowComponent` (attribute selector `[appAssetRow]` — renders `<td>` cells only, host `<tr>` owned by parent) and `AuditLogComponent` (collapsible log panel).

**Tech Stack:** Angular 21 standalone components, `ReactiveFormsModule` (`FormBuilder` / `FormArray` / `FormGroup` / `FormControl`), PrimeNG 21 (Table, AutoComplete, Select, Button, ConfirmDialog, Tooltip), Tailwind v4, Vitest 4.x.

---

## File Map

| Action | Path |
|---|---|
| **Create** | `src/app/features/assets/components/audit-log/audit-log.component.ts` |
| **Create** | `src/app/features/assets/components/audit-log/audit-log.component.spec.ts` |
| **Create** | `src/app/features/assets/services/assets-state.service.ts` |
| **Create** | `src/app/features/assets/services/assets-state.service.spec.ts` |
| **Create** | `src/app/features/assets/components/asset-row/asset-row.component.ts` |
| **Replace** | `src/app/features/assets/assets-list/assets-list.component.ts` |

No route changes needed — `/assets` already points to `AssetsListComponent`.

---

## Task 1: AuditLogComponent

**Files:**
- Create: `src/app/features/assets/components/audit-log/audit-log.component.ts`
- Create: `src/app/features/assets/components/audit-log/audit-log.component.spec.ts`

- [ ] **Step 1.1: Write the failing test**

```typescript
// src/app/features/assets/components/audit-log/audit-log.component.spec.ts
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AuditLogComponent, LogEntry } from './audit-log.component';

describe('AuditLogComponent', () => {
  let fixture: ComponentFixture<AuditLogComponent>;
  let component: AuditLogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditLogComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(AuditLogComponent);
    component = fixture.componentInstance;
  });

  it('renders entries', () => {
    const entries: LogEntry[] = [
      { id: 1, time: '10:00:00', action: 'Load', detail: 'Loaded 3 assets' },
    ];
    component.entries = entries;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Load');
    expect(el.textContent).toContain('Loaded 3 assets');
  });

  it('emits close when × button is clicked', () => {
    component.entries = [];
    fixture.detectChanges();
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    buttons[buttons.length - 1].click();
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('emits clear when Clear button is clicked', () => {
    component.entries = [];
    fixture.detectChanges();
    const clearSpy = vi.fn();
    component.clear.subscribe(clearSpy);
    const clearBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    clearBtn.click();
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  it('shows empty message when entries array is empty', () => {
    component.entries = [];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No log entries yet');
  });
});
```

- [ ] **Step 1.2: Run test — expect FAIL (module not found)**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A 3 "AuditLogComponent"
```

Expected: error about missing module.

- [ ] **Step 1.3: Create the component**

```typescript
// src/app/features/assets/components/audit-log/audit-log.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

export interface LogEntry {
  id: number;
  time: string;
  action: string;
  detail: string;
}

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 mt-4 overflow-hidden">
      <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <i class="pi pi-list text-gray-400"></i> Audit Log
        </h3>
        <div class="flex gap-2">
          <button
            pButton
            type="button"
            label="Clear"
            icon="pi pi-eraser"
            severity="secondary"
            [text]="true"
            size="small"
            (click)="clear.emit()"
          ></button>
          <button
            pButton
            type="button"
            icon="pi pi-times"
            severity="secondary"
            [text]="true"
            size="small"
            (click)="close.emit()"
          ></button>
        </div>
      </div>
      <div class="divide-y divide-gray-50 max-h-48 overflow-y-auto">
        @for (entry of entries; track entry.id) {
          <div class="px-5 py-2 flex items-start gap-4 text-xs">
            <span class="text-gray-400 shrink-0 font-mono">{{ entry.time }}</span>
            <span class="font-semibold text-indigo-600 shrink-0">{{ entry.action }}</span>
            <span class="text-gray-600">{{ entry.detail }}</span>
          </div>
        }
        @if (entries.length === 0) {
          <p class="px-5 py-4 text-xs text-gray-400">No log entries yet.</p>
        }
      </div>
    </div>
  `,
})
export class AuditLogComponent {
  @Input() entries: LogEntry[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
}
```

- [ ] **Step 1.4: Run tests — expect PASS**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A 5 "AuditLogComponent"
```

Expected: 4 passing tests for `AuditLogComponent`.

- [ ] **Step 1.5: Commit**

```bash
git add src/app/features/assets/components/audit-log/
git commit -m "feat(assets): add AuditLogComponent with LogEntry interface"
```

---

## Task 2: AssetsStateService

**Files:**
- Create: `src/app/features/assets/services/assets-state.service.ts`
- Create: `src/app/features/assets/services/assets-state.service.spec.ts`

- [ ] **Step 2.1: Write the failing tests**

```typescript
// src/app/features/assets/services/assets-state.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AssetsStateService } from './assets-state.service';
import { AssetService } from '../../../core/services/asset.service';
import { Asset } from '../../../core/models/asset.model';

const mockAsset: Asset = {
  id: '1', name: 'Gold', type: 'Commodity', value: 5000,
  currency: 'USD', status: 'Active', lastUpdated: '2026-01-01',
};

function makeSvc(overrides: Record<string, unknown> = {}) {
  return {
    getAssets:    vi.fn().mockReturnValue(of([mockAsset])),
    addAsset:     vi.fn().mockReturnValue(of({ ...mockAsset, id: '2' })),
    updateAsset:  vi.fn().mockReturnValue(of(mockAsset)),
    deleteAsset:  vi.fn().mockReturnValue(of(undefined)),
    getAssetById: vi.fn().mockReturnValue(of(mockAsset)),
    ...overrides,
  };
}

describe('AssetsStateService', () => {
  let service: AssetsStateService;
  let assetSvc: ReturnType<typeof makeSvc>;

  beforeEach(() => {
    assetSvc = makeSvc();
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        AssetsStateService,
        { provide: AssetService, useValue: assetSvc },
      ],
    });
    service = TestBed.inject(AssetsStateService);
  });

  it('loadAssets builds FormArray and calls onDone', () => {
    let done = false;
    service.loadAssets(() => { done = true; });
    expect(done).toBe(true);
    expect(service.rows.length).toBe(1);
    expect(service.rows.at(0).get('name')?.value).toBe('Gold');
    expect(service.form.pristine).toBe(true);
    expect(service.hasUnsavedChanges).toBe(false);
  });

  it('addRow prepends a new row with temp id and marks form dirty', () => {
    service.loadAssets(() => {});
    service.addRow();
    expect(service.rows.length).toBe(2);
    const newId = service.rows.at(0).get('id')?.value as string;
    expect(newId.startsWith('new-')).toBe(true);
    expect(service.form.dirty).toBe(true);
    expect(service.hasUnsavedChanges).toBe(true);
  });

  it('markDeleted adds id to deletedIds and sets hasUnsavedChanges', () => {
    service.loadAssets(() => {});
    service.markDeleted('1');
    expect(service.deletedIds.has('1')).toBe(true);
    expect(service.hasUnsavedChanges).toBe(true);
  });

  it('restoreDeleted removes id from deletedIds', () => {
    service.loadAssets(() => {});
    service.markDeleted('1');
    service.restoreDeleted('1');
    expect(service.deletedIds.has('1')).toBe(false);
  });

  it('cancelChanges resets FormArray to originalAssets and clears dirty state', () => {
    service.loadAssets(() => {});
    service.addRow();
    service.markDeleted('1');
    service.cancelChanges(() => {});
    expect(service.rows.length).toBe(1);
    expect(service.deletedIds.size).toBe(0);
    expect(service.form.pristine).toBe(true);
    expect(service.hasUnsavedChanges).toBe(false);
  });

  it('saveChanges blocks and sets saveError when a row has invalid name', () => {
    service.loadAssets(() => {});
    service.rows.at(0).get('name')!.setValue('');
    service.form.markAsDirty();
    let done = false;
    service.saveChanges(() => { done = true; });
    expect(done).toBe(true);
    expect(service.saveError).toContain('validation');
    expect(assetSvc.updateAsset).not.toHaveBeenCalled();
  });

  it('saveChanges blocks on duplicate names', () => {
    assetSvc.getAssets.mockReturnValue(of([
      mockAsset,
      { ...mockAsset, id: '2', name: 'Gold' },
    ]));
    service.loadAssets(() => {});
    service.rows.at(0).markAsDirty();
    service.form.markAsDirty();
    let done = false;
    service.saveChanges(() => { done = true; });
    expect(done).toBe(true);
    expect(service.saveError).toContain('Duplicate');
  });

  it('saveChanges calls DELETE for staged deletions of existing assets', () => {
    service.loadAssets(() => {});
    service.markDeleted('1');
    service.saveChanges(() => {});
    expect(assetSvc.deleteAsset).toHaveBeenCalledWith('1');
  });

  it('saveChanges does NOT call DELETE for staged deletions of new (unsaved) rows', () => {
    service.loadAssets(() => {});
    service.addRow();
    const newId = service.rows.at(0).get('id')?.value as string;
    service.markDeleted(newId);
    service.saveChanges(() => {});
    expect(assetSvc.deleteAsset).not.toHaveBeenCalled();
  });

  it('saveChanges calls POST for new rows with valid data', () => {
    service.loadAssets(() => {});
    service.addRow();
    service.rows.at(0).get('name')!.setValue('Silver');
    service.rows.at(0).get('type')!.setValue('Commodity');
    service.saveChanges(() => {});
    expect(assetSvc.addAsset).toHaveBeenCalled();
  });

  it('saveChanges calls PUT for dirty existing rows', () => {
    service.loadAssets(() => {});
    service.rows.at(0).get('name')!.setValue('Gold Updated');
    service.rows.at(0).markAsDirty();
    service.saveChanges(() => {});
    expect(assetSvc.updateAsset).toHaveBeenCalledWith('1', expect.objectContaining({ name: 'Gold Updated' }));
  });

  it('saveChanges sets saveError on HTTP 403', () => {
    service.loadAssets(() => {});
    service.markDeleted('1');
    assetSvc.deleteAsset.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403, statusText: 'Forbidden' }))
    );
    service.saveChanges(() => {});
    expect(service.saveError).toContain('Permission denied');
    expect(service.saving).toBe(false);
  });

  it('log appends entries and caps at 50', () => {
    for (let i = 0; i < 55; i++) service.log('Test', `Entry ${i}`);
    expect(service.auditLog.length).toBe(50);
    expect(service.auditLog[0].detail).toBe('Entry 54');
  });

  it('clearLog empties the log then adds a Clear entry', () => {
    service.log('Test', 'first');
    service.clearLog();
    expect(service.auditLog.length).toBe(1);
    expect(service.auditLog[0].action).toBe('Clear Log');
  });
});
```

- [ ] **Step 2.2: Run tests — expect FAIL (module not found)**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A 3 "AssetsStateService"
```

- [ ] **Step 2.3: Create the service**

```typescript
// src/app/features/assets/services/assets-state.service.ts
import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AssetService } from '../../../core/services/asset.service';
import { Asset } from '../../../core/models/asset.model';
import { LogEntry } from '../components/audit-log/audit-log.component';

@Injectable({ providedIn: 'root' })
export class AssetsStateService {
  private fb = inject(FormBuilder);
  private assetSvc = inject(AssetService);

  readonly form: FormGroup = this.fb.group({ rows: this.fb.array([]) });
  originalAssets: Asset[] = [];
  deletedIds = new Set<string>();
  saving = false;
  saveError = '';
  auditLog: LogEntry[] = [];
  private logCounter = 0;

  get rows(): FormArray {
    return this.form.get('rows') as FormArray;
  }

  get hasUnsavedChanges(): boolean {
    return this.form.dirty || this.deletedIds.size > 0;
  }

  get knownTypes(): string[] {
    return [...new Set(
      this.rows.controls
        .map(c => (c.get('type')?.value as string) ?? '')
        .filter(Boolean),
    )].sort();
  }

  loadAssets(onDone: () => void): void {
    this.assetSvc.getAssets().subscribe(assets => {
      this.originalAssets = assets.map(a => ({ ...a }));
      this._rebuildFormArray(assets);
      this.deletedIds.clear();
      this.saveError = '';
      this.form.markAsPristine();
      this.log('Load', `Loaded ${assets.length} asset(s)`);
      onDone();
    });
  }

  addRow(): void {
    const today = new Date().toISOString().split('T')[0];
    const newRow: Asset = {
      id: `new-${Date.now()}`,
      name: '', type: '', value: 0,
      currency: 'USD', status: 'Active', lastUpdated: today,
    };
    this.rows.insert(0, this._buildRow(newRow));
    this.form.markAsDirty();
    this.log('Add', 'New row added — fill in name, type, and value');
  }

  markDeleted(id: string): void {
    const name = this._getRowName(id);
    this.deletedIds.add(id);
    this.form.markAsDirty();
    this.log('Delete', `Marked "${name}" for deletion`);
  }

  restoreDeleted(id: string): void {
    const name = this._getRowName(id);
    this.deletedIds.delete(id);
    this.log('Restore', `Restored "${name}"`);
  }

  cancelChanges(onDone: () => void): void {
    this._rebuildFormArray(this.originalAssets);
    this.deletedIds.clear();
    this.saveError = '';
    this.form.markAsPristine();
    this.log('Cancel', 'Changes cancelled — reverted to last saved state');
    onDone();
  }

  saveChanges(onDone: () => void): void {
    const activeRows = this.rows.controls.filter(
      c => !this.deletedIds.has(c.get('id')!.value as string),
    );

    if (activeRows.some(c => c.invalid)) {
      activeRows.forEach(c => c.markAllAsTouched());
      this.saveError = 'Please fix all validation errors before saving.';
      this.log('Save', 'Blocked — validation errors');
      onDone();
      return;
    }

    const names = activeRows.map(c =>
      ((c.get('name')!.value as string) ?? '').trim().toLowerCase(),
    );
    if (names.some((n, i) => names.indexOf(n) !== i)) {
      this.saveError = 'Duplicate asset names found — please use unique names.';
      this.log('Save', 'Blocked — duplicate names');
      onDone();
      return;
    }

    const ops: Observable<unknown>[] = [];

    for (const id of this.deletedIds) {
      if (this.originalAssets.some(o => o.id === id)) {
        this.log('API', `DELETE /api/assets/${id}`);
        ops.push(this.assetSvc.deleteAsset(id));
      }
    }

    for (const ctrl of activeRows) {
      const id = ctrl.get('id')!.value as string;
      const asset = this._rowToAsset(ctrl as FormGroup);
      if (id.startsWith('new-')) {
        this.log('API', `POST /api/assets "${asset.name}"`);
        ops.push(this.assetSvc.addAsset(asset));
      } else if (ctrl.dirty) {
        this.log('API', `PUT /api/assets/${id} "${asset.name}"`);
        ops.push(this.assetSvc.updateAsset(id, asset));
      }
    }

    if (ops.length === 0) {
      this.form.markAsPristine();
      this.deletedIds.clear();
      this.log('Save', 'Nothing to save');
      onDone();
      return;
    }

    this.saving = true;
    this.saveError = '';
    const count = ops.length;

    forkJoin(ops).subscribe({
      next: () => {
        this.log('Save', `${count} operation(s) completed successfully`);
        this.saving = false;
        this.deletedIds.clear();
        this.loadAssets(onDone);
      },
      error: (err: HttpErrorResponse) => {
        this.saveError = this._httpError(err);
        this.log('Save', `Failed — HTTP ${err.status}: ${this.saveError}`);
        this.saving = false;
        onDone();
      },
    });
  }

  log(action: string, detail: string): void {
    const time = new Date().toLocaleTimeString();
    this.auditLog = [
      { id: ++this.logCounter, time, action, detail },
      ...this.auditLog,
    ].slice(0, 50);
  }

  clearLog(): void {
    this.auditLog = [];
    this.log('Clear Log', 'Activity log cleared');
  }

  private _rebuildFormArray(assets: Asset[]): void {
    this.rows.clear();
    for (const asset of assets) {
      this.rows.push(this._buildRow(asset));
    }
  }

  private _buildRow(asset: Asset): FormGroup {
    return this.fb.group({
      id:           [asset.id],
      name:         [asset.name         ?? '',       Validators.required],
      type:         [asset.type         ?? '',       Validators.required],
      value:        [asset.value        ?? 0,        [Validators.required, Validators.min(0)]],
      status:       [asset.status       ?? 'Active', Validators.required],
      description:  [asset.description  ?? ''],
      serialNumber: [asset.serialNumber ?? ''],
      purchaseDate: [asset.purchaseDate ?? ''],
      lastUpdated:  [asset.lastUpdated  ?? ''],
    });
  }

  private _rowToAsset(ctrl: FormGroup): Asset {
    const v = ctrl.getRawValue() as Record<string, unknown>;
    return {
      id:           v['id']          as string,
      name:         (v['name']         as string) ?? '',
      type:         (v['type']         as string) ?? '',
      value:        +(v['value']       ?? 0),
      currency:     'USD',
      status:       (v['status']       as 'Active' | 'Inactive') ?? 'Active',
      lastUpdated:  (v['lastUpdated']  as string) ?? '',
      description:  (v['description']  as string) || undefined,
      serialNumber: (v['serialNumber'] as string) || undefined,
      purchaseDate: (v['purchaseDate'] as string) || undefined,
    };
  }

  private _getRowName(id: string): string {
    const ctrl = this.rows.controls.find(c => c.get('id')?.value === id);
    return (ctrl?.get('name')?.value as string) ?? id;
  }

  private _httpError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 403: return 'Permission denied — your account role cannot perform this action.';
      case 401: return 'Session expired — please log in again.';
      case 409: return 'Conflict — another user may have modified this asset. Refresh and try again.';
      case 404: return 'Asset not found — it may have been deleted.';
      default:
        return (err.error as { message?: string })?.message ?? err.message ?? 'Server error';
    }
  }
}
```

- [ ] **Step 2.4: Run tests — expect PASS**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A 5 "AssetsStateService"
```

Expected: 13 passing tests.

- [ ] **Step 2.5: Commit**

```bash
git add src/app/features/assets/services/
git commit -m "feat(assets): add AssetsStateService facade with FormArray and staged CRUD"
```

---

## Task 3: AssetRowComponent

**Files:**
- Create: `src/app/features/assets/components/asset-row/asset-row.component.ts`

This component uses attribute selector `[appAssetRow]` — it attaches to `<tr>` elements in the parent table. Its template renders only `<td>` cells. It receives the `FormGroup` as `rowGroup` (not `formGroup`) to avoid conflict with Angular's built-in `FormGroupDirective`. Each control is accessed via a typed getter and bound with `[formControl]`.

- [ ] **Step 3.1: Create the component**

```typescript
// src/app/features/assets/components/asset-row/asset-row.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: '[appAssetRow]',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    SelectModule,
    AutoCompleteModule,
    TooltipModule,
  ],
  template: `
    <!-- Expand toggle -->
    <td class="w-8 pl-2">
      <button
        type="button"
        pButton
        [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
        severity="secondary"
        [text]="true"
        size="small"
        (click)="toggleExpand.emit()"
      ></button>
    </td>
    <!-- Name -->
    <td class="px-3 py-2">
      <input
        pInputText
        type="text"
        [formControl]="nameCtrl"
        class="w-full text-sm"
        [class.ng-invalid]="nameCtrl.invalid && nameCtrl.touched"
        placeholder="Asset name"
      />
      @if (nameCtrl.invalid && nameCtrl.touched) {
        <small class="text-red-500 text-xs block mt-0.5">Name is required</small>
      }
    </td>
    <!-- Type -->
    <td class="px-3 py-2">
      <p-autocomplete
        [formControl]="typeCtrl"
        [suggestions]="typeSuggestions"
        (completeMethod)="onSearchType($event)"
        [forceSelection]="false"
        [dropdown]="true"
        styleClass="w-full"
        inputStyleClass="text-sm w-full"
      ></p-autocomplete>
      @if (typeCtrl.invalid && typeCtrl.touched) {
        <small class="text-red-500 text-xs block mt-0.5">Type is required</small>
      }
    </td>
    <!-- Value -->
    <td class="px-3 py-2 text-right">
      <input
        pInputText
        type="number"
        [formControl]="valueCtrl"
        class="w-full text-right text-sm font-mono"
        [class.ng-invalid]="valueCtrl.invalid && valueCtrl.touched"
        min="0"
      />
    </td>
    <!-- Status -->
    <td class="px-3 py-2">
      <p-select
        [formControl]="statusCtrl"
        [options]="statusOptions"
        styleClass="w-full text-sm"
      ></p-select>
    </td>
    <!-- Last Updated (display-only) -->
    <td class="px-3 py-2 text-gray-500 text-sm whitespace-nowrap">
      {{ rowGroup.get('lastUpdated')?.value }}
    </td>
    <!-- Actions -->
    <td class="px-2 py-2 text-center">
      @if (!isDeleted) {
        <button
          type="button"
          pButton
          icon="pi pi-trash"
          severity="danger"
          [text]="true"
          size="small"
          pTooltip="Mark for deletion"
          (click)="deleteClicked.emit()"
        ></button>
      } @else {
        <button
          type="button"
          pButton
          icon="pi pi-undo"
          severity="secondary"
          [text]="true"
          size="small"
          pTooltip="Restore"
          (click)="restoreClicked.emit()"
        ></button>
      }
    </td>
  `,
})
export class AssetRowComponent {
  @Input({ required: true }) rowGroup!: FormGroup;
  @Input() isDeleted = false;
  @Input() isNew = false;
  @Input() expanded = false;
  @Input() knownTypes: string[] = [];
  @Output() deleteClicked  = new EventEmitter<void>();
  @Output() restoreClicked = new EventEmitter<void>();
  @Output() toggleExpand   = new EventEmitter<void>();

  typeSuggestions: string[] = [];

  readonly statusOptions = [
    { label: 'Active',   value: 'Active'   },
    { label: 'Inactive', value: 'Inactive' },
  ];

  get nameCtrl():   FormControl { return this.rowGroup.get('name')   as FormControl; }
  get typeCtrl():   FormControl { return this.rowGroup.get('type')   as FormControl; }
  get valueCtrl():  FormControl { return this.rowGroup.get('value')  as FormControl; }
  get statusCtrl(): FormControl { return this.rowGroup.get('status') as FormControl; }

  onSearchType(event: { query: string }): void {
    const q = event.query.toLowerCase();
    const matches = this.knownTypes.filter(t => t.toLowerCase().includes(q));
    if (q && !this.knownTypes.some(t => t.toLowerCase() === q)) {
      this.typeSuggestions = [event.query, ...matches];
    } else {
      this.typeSuggestions = matches;
    }
  }
}
```

- [ ] **Step 3.2: Commit**

```bash
git add src/app/features/assets/components/asset-row/
git commit -m "feat(assets): add AssetRowComponent with inline reactive controls and expand toggle"
```

---

## Task 4: Replace AssetsListComponent

**Files:**
- Replace: `src/app/features/assets/assets-list/assets-list.component.ts`

This is the thin container. `[value]="filteredControls"` drives PrimeNG pagination. The body template renders `<tr appAssetRow [rowGroup]="asFormGroup(ctrl)">` per control. The expanded section is a sibling `<tr>` in the same body loop. `ConfirmationService` is in component `providers[]` (not root) per CLAUDE.md. Every async callback ends with `cdr.detectChanges()`.

- [ ] **Step 4.1: Replace the component**

```typescript
// src/app/features/assets/assets-list/assets-list.component.ts
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, AbstractControl, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { AssetsStateService } from '../services/assets-state.service';
import { AuditLogComponent } from '../components/audit-log/audit-log.component';
import { AssetRowComponent } from '../components/asset-row/asset-row.component';

@Component({
  selector: 'app-assets-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    TableModule,
    ConfirmDialogModule,
    TooltipModule,
    AuditLogComponent,
    AssetRowComponent,
  ],
  providers: [ConfirmationService],
  template: `
    <p-confirmDialog></p-confirmDialog>
    <div class="p-6">

      <!-- Header + Toolbar -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Assets</h1>
          <p class="text-gray-500">Manage your investment portfolio</p>
        </div>
        <div class="flex items-center gap-2 flex-wrap justify-end">
          @if (!showAuditLog) {
            <button pButton type="button" label="Audit Log" icon="pi pi-list"
              severity="secondary" [outlined]="true" size="small"
              (click)="showAuditLog = true">
            </button>
          }
          <button pButton type="button" label="Refresh" icon="pi pi-refresh"
            severity="secondary" [outlined]="true" size="small"
            (click)="onRefresh()">
          </button>
          <button pButton type="button" label="Cancel" icon="pi pi-times"
            severity="secondary" [outlined]="true" size="small"
            [disabled]="!state.hasUnsavedChanges"
            (click)="onCancel()">
          </button>
          <button pButton type="button" label="Add Asset" icon="pi pi-plus"
            severity="secondary" size="small"
            (click)="onAdd()">
          </button>
          <button pButton type="button"
            [label]="state.saving ? 'Saving...' : 'Save Changes'"
            [icon]="state.saving ? 'pi pi-spin pi-spinner' : 'pi pi-save'"
            severity="primary" size="small"
            [disabled]="!state.hasUnsavedChanges || state.saving"
            (click)="onSave()">
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1">
            <input pInputText type="text" [(ngModel)]="searchText"
              placeholder="Search by name..." class="w-full"
              (input)="applyFilters()" />
          </div>
          <div>
            <p-multiselect [options]="typeOptions" [(ngModel)]="filterTypes"
              placeholder="Filter by type" (onChange)="applyFilters()"
              [showClear]="true" styleClass="w-full sm:w-56">
            </p-multiselect>
          </div>
          <div>
            <p-select [options]="statusOptions" [(ngModel)]="filterStatus"
              placeholder="Filter by status" (onChange)="applyFilters()"
              [showClear]="true" styleClass="w-full sm:w-44">
            </p-select>
          </div>
        </div>
      </div>

      <!-- Save error banner -->
      @if (state.saveError) {
        <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-2 text-sm text-red-700">
          <i class="pi pi-exclamation-circle"></i>
          {{ state.saveError }}
        </div>
      }

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <p-table
          [value]="filteredControls"
          [rows]="10"
          [paginator]="true"
          [rowsPerPageOptions]="[5, 10, 25]"
          styleClass="p-datatable-sm"
        >
          <ng-template pTemplate="header">
            <tr>
              <th style="width:2.5rem"></th>
              <th>Name</th>
              <th>Type</th>
              <th class="text-right" style="width:10rem">Value</th>
              <th style="width:8rem">Status</th>
              <th style="width:9rem">Last Updated</th>
              <th style="width:3rem"></th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-ctrl>
            @let rowId = getRowId(ctrl);
            <tr
              appAssetRow
              [rowGroup]="asFormGroup(ctrl)"
              [isDeleted]="state.deletedIds.has(rowId)"
              [isNew]="rowId.startsWith('new-')"
              [expanded]="expandedIds.has(rowId)"
              [knownTypes]="state.knownTypes"
              (toggleExpand)="toggleRow(rowId)"
              (deleteClicked)="onMarkDeleted(rowId)"
              (restoreClicked)="onRestoreDeleted(rowId)"
              [class.opacity-50]="state.deletedIds.has(rowId)"
              [class.bg-red-50]="state.deletedIds.has(rowId)"
              [class.line-through]="state.deletedIds.has(rowId)"
              [class.bg-blue-50]="rowId.startsWith('new-') && !state.deletedIds.has(rowId)"
              [class.border-l-4]="rowId.startsWith('new-') && !state.deletedIds.has(rowId)"
              [class.border-blue-400]="rowId.startsWith('new-') && !state.deletedIds.has(rowId)"
            ></tr>

            @if (expandedIds.has(rowId)) {
              <tr class="bg-gray-50 border-t border-gray-100">
                <td colspan="7" class="px-6 py-4">
                  <div [formGroup]="asFormGroup(ctrl)"
                    class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">Description</label>
                      <textarea
                        formControlName="description"
                        class="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        rows="2"
                        placeholder="Optional description"
                      ></textarea>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">Serial Number</label>
                      <input pInputText type="text" formControlName="serialNumber"
                        class="w-full text-sm" placeholder="e.g. SN-12345" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">Purchase Date</label>
                      <input pInputText type="date" formControlName="purchaseDate"
                        class="w-full text-sm" />
                    </div>
                  </div>
                </td>
              </tr>
            }
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="text-center py-8 text-gray-400">No assets found.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Audit Log -->
      @if (showAuditLog) {
        <app-audit-log
          [entries]="state.auditLog"
          (close)="showAuditLog = false"
          (clear)="onClearLog()"
        ></app-audit-log>
      }

    </div>
  `,
})
export class AssetsListComponent implements OnInit {
  searchText = '';
  filterTypes: string[] = [];
  filterStatus: string | null = null;
  showAuditLog = false;
  expandedIds = new Set<string>();
  filteredControls: AbstractControl[] = [];

  typeOptions: { label: string; value: string }[] = [];
  readonly statusOptions = [
    { label: 'Active',   value: 'Active'   },
    { label: 'Inactive', value: 'Inactive' },
  ];

  constructor(
    readonly state: AssetsStateService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.state.loadAssets(() => {
      this._rebuildTypeOptions();
      this.applyFilters();
      this.cdr.detectChanges();
    });
  }

  applyFilters(): void {
    this.filteredControls = this.state.rows.controls.filter(ctrl => {
      const name   = ((ctrl.get('name')?.value   as string) ?? '').toLowerCase();
      const type   =  (ctrl.get('type')?.value   as string) ?? '';
      const status =  (ctrl.get('status')?.value as string) ?? '';
      const matchSearch = !this.searchText || name.includes(this.searchText.toLowerCase());
      const matchType   = this.filterTypes.length === 0 || this.filterTypes.includes(type);
      const matchStatus = !this.filterStatus || status === this.filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }

  toggleRow(id: string): void {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  }

  asFormGroup(ctrl: AbstractControl): FormGroup {
    return ctrl as FormGroup;
  }

  getRowId(ctrl: AbstractControl): string {
    return ((ctrl as FormGroup).get('id')?.value as string) ?? '';
  }

  onAdd(): void {
    this.state.addRow();
    this._rebuildTypeOptions();
    this.applyFilters();
    this.cdr.detectChanges();
  }

  onSave(): void {
    this.state.saveChanges(() => {
      this._rebuildTypeOptions();
      this.applyFilters();
      this.cdr.detectChanges();
    });
  }

  onCancel(): void {
    if (!this.state.hasUnsavedChanges) return;
    this.confirmationService.confirm({
      header: 'Unsaved Changes',
      message: 'You have unsaved changes. This will discard all edits. Continue?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Discard & Continue',
      rejectLabel: 'Keep Editing',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.state.cancelChanges(() => {
          this._rebuildTypeOptions();
          this.applyFilters();
          this.expandedIds.clear();
          this.cdr.detectChanges();
        });
      },
    });
  }

  onRefresh(): void {
    const doRefresh = () => {
      this.state.loadAssets(() => {
        this._rebuildTypeOptions();
        this.applyFilters();
        this.expandedIds.clear();
        this.cdr.detectChanges();
      });
    };
    if (this.state.hasUnsavedChanges) {
      this.confirmationService.confirm({
        header: 'Unsaved Changes',
        message: 'Refreshing will discard all unsaved edits. Continue?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Refresh & Discard',
        rejectLabel: 'Keep Editing',
        acceptButtonStyleClass: 'p-button-danger',
        accept: doRefresh,
      });
    } else {
      doRefresh();
    }
  }

  onMarkDeleted(id: string): void {
    this.state.markDeleted(id);
    this.cdr.detectChanges();
  }

  onRestoreDeleted(id: string): void {
    this.state.restoreDeleted(id);
    this.cdr.detectChanges();
  }

  onClearLog(): void {
    this.state.clearLog();
    this.cdr.detectChanges();
  }

  private _rebuildTypeOptions(): void {
    this.typeOptions = this.state.knownTypes.map(t => ({ label: t, value: t }));
  }
}
```

- [ ] **Step 4.2: Run the build — expect zero errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: `Application bundle generation complete.`

Common TypeScript errors to fix if they appear:
- `@let` not recognized — requires Angular 18+; we are on Angular 21 ✓
- `TooltipModule` not found — import from `primeng/tooltip` ✓
- `FormControl` cast issue — use `as FormControl` on `.get()` results

- [ ] **Step 4.3: Start dev server and verify in browser**

```bash
npm start
```

Open `http://localhost:4200/assets`. Walk through this checklist:

1. Table loads assets from the API
2. Name / Type / Value / Status cells are editable inputs; editing activates Save Changes button
3. Click `›` expand arrow → Description / Serial Number / Purchase Date appear below the row; click again to collapse
4. Click **Add Asset** → new row prepended with blue left border and blank inputs
5. Click trash icon → row turns red + strikethrough (staged delete); delete button becomes undo
6. Click undo → row restored to normal
7. Click **Save Changes** → API calls fire; table reloads; audit log gains entries
8. Click **Cancel** with edits → PrimeNG ConfirmDialog appears; choose Discard → changes gone
9. Click **Refresh** with edits → ConfirmDialog appears; choose Discard → table reloads
10. Click **Audit Log** in toolbar → log panel appears at bottom of page
11. Click **×** on log panel → panel hides; "Audit Log" button reappears in toolbar
12. Click **Clear** in log panel → entries cleared

- [ ] **Step 4.4: Run full test suite**

```bash
npm test 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 4.5: Commit**

```bash
git add src/app/features/assets/assets-list/assets-list.component.ts
git commit -m "feat(assets): replace AssetsListComponent with reactive-form CRUD page

- FormArray-backed table with staged add/edit/delete (no API call until Save)
- Cancel and Refresh show ConfirmDialog when unsaved changes exist
- Expand row reveals description, serialNumber, purchaseDate fields
- Audit log panel collapsible via toolbar toggle; Clear button empties entries
- NG0100 prevention: cdr.detectChanges() after every async callback"
```

---

## Spec Coverage Check

| Spec requirement | Implemented in |
|---|---|
| Angular reactive forms — `FormArray` per row | Task 2 service, Task 4 component |
| Add / Update / staged Delete | Task 2 `addRow`, `markDeleted`, `saveChanges` |
| Changes held until Save | Task 2 `hasUnsavedChanges`, Task 4 `onSave` |
| Cancel + ConfirmDialog | Task 4 `onCancel` |
| Refresh + ConfirmDialog | Task 4 `onRefresh` |
| Collapsible audit log panel | Task 1 `AuditLogComponent`, Task 4 `showAuditLog` |
| Show Audit Log toolbar button | Task 4 `@if (!showAuditLog)` guard |
| Expand row for description / serialNumber / purchaseDate | Task 3 `toggleExpand`, Task 4 expanded `<tr>` |
| Deleted row: strikethrough + red bg | Task 4 `line-through`, `bg-red-50` |
| New row: blue left border | Task 4 `bg-blue-50`, `border-l-4`, `border-blue-400` |
| Validation before save (required + duplicates) | Task 2 `saveChanges` guards |
| HTTP error messages | Task 2 `_httpError` |
| NG0100 prevention | Task 4 `cdr.detectChanges()` in all callbacks |
| `ConfirmationService` in component `providers[]` | Task 4 `providers: [ConfirmationService]` |
