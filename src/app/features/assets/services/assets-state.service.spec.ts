// src/app/features/assets/services/assets-state.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AssetsStateService } from './assets-state.service';
import { AssetService } from '../../../core/services/asset.service';
import { Asset } from '../../../core/models/asset.model';

const mockAsset: Asset = {
  id: '1',
  name: 'Gold',
  type: 'Commodity',
  value: 5000,
  currency: 'USD',
  status: 'Active',
  lastUpdated: '2026-01-01',
};

function makeSvc(overrides: Record<string, unknown> = {}) {
  return {
    getAssets: vi.fn().mockReturnValue(of([mockAsset])),
    addAsset: vi.fn().mockReturnValue(of({ ...mockAsset, id: '2' })),
    updateAsset: vi.fn().mockReturnValue(of(mockAsset)),
    deleteAsset: vi.fn().mockReturnValue(of(undefined)),
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
      providers: [AssetsStateService, { provide: AssetService, useValue: assetSvc }],
    });
    service = TestBed.inject(AssetsStateService);
  });

  it('loadAssets builds FormArray and calls onDone', () => {
    let done = false;
    service.loadAssets(() => {
      done = true;
    });
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
    service.saveChanges(() => {
      done = true;
    });
    expect(done).toBe(true);
    expect(service.saveError).toContain('validation');
    expect(assetSvc.updateAsset).not.toHaveBeenCalled();
  });

  it('saveChanges blocks on duplicate names', () => {
    assetSvc.getAssets.mockReturnValue(of([mockAsset, { ...mockAsset, id: '2', name: 'Gold' }]));
    service.loadAssets(() => {});
    service.rows.at(0).markAsDirty();
    service.form.markAsDirty();
    let done = false;
    service.saveChanges(() => {
      done = true;
    });
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
    service.rows.at(0).markAsDirty();
    service.saveChanges(() => {});
    expect(assetSvc.addAsset).toHaveBeenCalled();
  });

  it('saveChanges calls PUT for dirty existing rows', () => {
    service.loadAssets(() => {});
    service.rows.at(0).get('name')!.setValue('Gold Updated');
    service.rows.at(0).markAsDirty();
    service.saveChanges(() => {});
    expect(assetSvc.updateAsset).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ name: 'Gold Updated' }),
    );
  });

  it('saveChanges sets saveError on HTTP 403', () => {
    service.loadAssets(() => {});
    service.markDeleted('1');
    assetSvc.deleteAsset.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403, statusText: 'Forbidden' })),
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
