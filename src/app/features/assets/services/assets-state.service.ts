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
