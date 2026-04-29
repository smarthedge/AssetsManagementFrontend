import { ChangeDetectorRef, Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
        <div role="alert" class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-2 text-sm text-red-700">
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
                      <label [for]="'desc-' + rowId" class="block text-xs font-medium text-gray-600 mb-1">Description</label>
                      <textarea
                        [id]="'desc-' + rowId"
                        formControlName="description"
                        class="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        rows="2"
                        placeholder="Optional description"
                      ></textarea>
                    </div>
                    <div>
                      <label [for]="'sn-' + rowId" class="block text-xs font-medium text-gray-600 mb-1">Serial Number</label>
                      <input pInputText type="text" [id]="'sn-' + rowId" formControlName="serialNumber"
                        class="w-full text-sm" placeholder="e.g. SN-12345" />
                    </div>
                    <div>
                      <label [for]="'pd-' + rowId" class="block text-xs font-medium text-gray-600 mb-1">Purchase Date</label>
                      <input pInputText type="date" [id]="'pd-' + rowId" formControlName="purchaseDate"
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
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.state.saveError = '';
    this.state.saving = false;
    this.state.loadAssets(() => {
      this._rebuildTypeOptions();
      this.applyFilters();
      this.cdr.detectChanges();
    });
    this.state.form.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this._rebuildTypeOptions();
      this.applyFilters();
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
