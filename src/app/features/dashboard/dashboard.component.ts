import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AssetService } from '../../core/services/asset.service';
import { Asset } from '../../core/models/asset.model';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    CurrencyPipe,
    InputTextModule,
    ButtonModule,
    SelectModule,
    MultiSelectModule,
    AutoCompleteModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  template: `
    <p-confirmDialog></p-confirmDialog>
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p class="text-gray-500">Welcome back, {{ currentUser?.username }}!</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Total Assets</p>
              <p class="text-2xl font-bold text-gray-800">{{ assets.length }}</p>
            </div>
            <div class="bg-indigo-100 rounded-full p-3">
              <i class="pi pi-box text-indigo-600 text-xl"></i>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Total Value</p>
              <p class="text-2xl font-bold text-gray-800">
                {{ totalValue | currency: 'USD' : 'symbol' : '1.0-0' }}
              </p>
            </div>
            <div class="bg-green-100 rounded-full p-3">
              <i class="pi pi-dollar text-green-600 text-xl"></i>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Active Assets</p>
              <p class="text-2xl font-bold text-gray-800">{{ activeCount }}</p>
            </div>
            <div class="bg-blue-100 rounded-full p-3">
              <i class="pi pi-check-circle text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Asset Types</p>
              <p class="text-2xl font-bold text-gray-800">{{ assetTypeCount }}</p>
            </div>
            <div class="bg-purple-100 rounded-full p-3">
              <i class="pi pi-chart-pie text-purple-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1">
            <input
              pInputText
              type="text"
              [(ngModel)]="searchText"
              placeholder="Search by name..."
              class="w-full"
              (input)="applyFilters()"
            />
          </div>
          <div>
            <p-multiselect
              [options]="typeOptions"
              [(ngModel)]="filterTypes"
              placeholder="Filter by type"
              (onChange)="applyFilters()"
              [showClear]="true"
              styleClass="w-full sm:w-56"
            ></p-multiselect>
          </div>
          <div>
            <p-select
              [options]="statusOptions"
              [(ngModel)]="filterStatus"
              placeholder="Filter by status"
              (onChange)="applyFilters()"
              [showClear]="true"
              styleClass="w-full sm:w-44"
            ></p-select>
          </div>
        </div>
      </div>

      <!-- Assets Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-800">Recent Assets</h2>
          <div class="flex items-center gap-3">
            @if (saveError) {
              <span class="text-sm text-red-600 flex items-center gap-1">
                <i class="pi pi-exclamation-circle"></i> {{ saveError }}
              </span>
            }
            <button
              pButton
              label="Refresh"
              icon="pi pi-refresh"
              severity="secondary"
              [outlined]="true"
              size="small"
              (click)="refreshData()"
            ></button>
            <button
              pButton
              label="Add Asset"
              icon="pi pi-plus"
              severity="secondary"
              size="small"
              (click)="addAsset()"
            ></button>
            <button
              pButton
              [label]="saving ? 'Saving...' : 'Save Changes'"
              [icon]="saving ? 'pi pi-spin pi-spinner' : 'pi pi-save'"
              severity="primary"
              size="small"
              [disabled]="!hasUnsavedChanges || saving"
              (click)="saveChanges()"
            ></button>
          </div>
        </div>
        <p-table
          [value]="filteredAssets"
          [rows]="10"
          [paginator]="true"
          styleClass="p-datatable-sm"
          (onEditComplete)="onEditComplete($event)"
        >
          <ng-template pTemplate="header">
            <tr>
              <th style="width:3.5rem"></th>
              <th>Name</th>
              <th>Type</th>
              <th class="text-right">Value</th>
              <th>Status</th>
              <th>Last Updated</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-asset>
            <tr
              class="hover:bg-gray-50"
              [class.bg-amber-50]="duplicateNames.has(asset.name.trim().toLowerCase())"
              [class.border-l-4]="duplicateNames.has(asset.name.trim().toLowerCase())"
              [class.border-amber-400]="duplicateNames.has(asset.name.trim().toLowerCase())"
            >
              <!-- Delete (active rows only) -->
              <td>
                @if (asset.status === 'Active') {
                  <button
                    pButton
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    size="small"
                    (click)="deleteAsset(asset)"
                  ></button>
                }
              </td>
              <!-- Name: click to edit -->
              <td pEditableColumn class="font-medium">
                <p-cellEditor>
                  <ng-template pTemplate="input">
                    <input pInputText type="text" [(ngModel)]="asset.name" class="w-full" />
                  </ng-template>
                  <ng-template pTemplate="output">{{ asset.name }}</ng-template>
                </p-cellEditor>
              </td>
              <!-- Type: autocomplete — pick from list or type a new value -->
              <td pEditableColumn>
                <p-cellEditor>
                  <ng-template pTemplate="input">
                    <p-autocomplete
                      [(ngModel)]="asset.type"
                      [suggestions]="typeSuggestions"
                      (completeMethod)="searchTypes($event)"
                      [forceSelection]="false"
                      [dropdown]="true"
                      styleClass="w-full"
                      (onSelect)="onTypeChange(asset)"
                      (onBlur)="onTypeChange(asset)"
                    ></p-autocomplete>
                  </ng-template>
                  <ng-template pTemplate="output">
                    <span
                      class="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{ asset.type }}
                    </span>
                  </ng-template>
                </p-cellEditor>
              </td>
              <!-- Value: click to edit -->
              <td pEditableColumn class="font-mono" style="text-align: right">
                <p-cellEditor>
                  <ng-template pTemplate="input">
                    <input
                      pInputText
                      type="number"
                      [(ngModel)]="asset.value"
                      class="w-full text-right"
                    />
                  </ng-template>
                  <ng-template pTemplate="output">
                    <span class="block text-right">{{
                      asset.value | currency: asset.currency
                    }}</span>
                  </ng-template>
                </p-cellEditor>
              </td>
              <!-- Status: display only -->
              <td>
                <span
                  [class]="
                    asset.status === 'Active'
                      ? 'bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium'
                      : 'bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium'
                  "
                >
                  {{ asset.status }}
                </span>
              </td>
              <td class="text-gray-500 text-sm">{{ asset.lastUpdated }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center py-8 text-gray-400">No assets found.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Activity Log -->
      @if (activityLog.length > 0) {
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 mt-4 overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <i class="pi pi-list text-gray-400"></i> Activity Log
            </h3>
            <button
              pButton
              label="Clear"
              icon="pi pi-times"
              severity="secondary"
              [text]="true"
              size="small"
              (click)="clearLog()"
            ></button>
          </div>
          <div class="divide-y divide-gray-50 max-h-48 overflow-y-auto">
            @for (entry of activityLog; track entry.id) {
              <div class="px-5 py-2 flex items-start gap-4 text-xs">
                <span class="text-gray-400 shrink-0 font-mono">{{ entry.time }}</span>
                <span class="font-semibold text-indigo-600 shrink-0">{{ entry.action }}</span>
                <span class="text-gray-600">{{ entry.detail }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  assets: Asset[] = [];
  filteredAssets: Asset[] = [];
  originalAssets: Asset[] = [];
  totalValue = 0;
  activeCount = 0;
  assetTypeCount = 0;
  currentUser: User | null = null;

  searchText = '';
  filterTypes: string[] = [];
  filterStatus: string | null = null;

  dirtyIds = new Set<string>();
  duplicateNames = new Set<string>();
  saveError = '';
  saving = false;
  activityLog: { id: number; time: string; action: string; detail: string }[] = [];
  private logCounter = 0;

  get hasUnsavedChanges(): boolean {
    return this.dirtyIds.size > 0;
  }

  typeOptions: { label: string; value: string }[] = [];
  typeSuggestions: string[] = [];
  statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  constructor(
    private assetService: AssetService,
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.doRefresh();
  }

  applyFilters(): void {
    this.filteredAssets = this.assets.filter((a) => {
      const matchesSearch =
        !this.searchText || a.name.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesType = this.filterTypes.length === 0 || this.filterTypes.includes(a.type);
      const matchesStatus = !this.filterStatus || a.status === this.filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }

  recalcStats(): void {
    this.totalValue = this.assets.reduce((sum, a) => sum + +a.value, 0);
    this.activeCount = this.assets.filter((a) => a.status === 'Active').length;
    this.assetTypeCount = new Set(this.assets.map((a) => a.type)).size;
  }

  rebuildTypeOptions(): void {
    const types = [...new Set(this.assets.map((a) => a.type))].sort();
    this.typeOptions = types.map((t) => ({ label: t, value: t }));
  }

  rebuildDuplicates(): void {
    const counts = new Map<string, number>();
    for (const a of this.assets) {
      const key = a.name.trim().toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    this.duplicateNames = new Set([...counts.entries()].filter(([, c]) => c > 1).map(([n]) => n));
  }

  searchTypes(event: { query: string }): void {
    const q = event.query.toLowerCase();
    const known = [...new Set(this.assets.map((a) => a.type))].sort();
    const matches = known.filter((t) => t.toLowerCase().includes(q));
    // Surface the typed value first if it's a new type the user wants to add
    if (q && !known.some((t) => t.toLowerCase() === q)) {
      this.typeSuggestions = [event.query, ...matches];
    } else {
      this.typeSuggestions = matches;
    }
  }

  onTypeChange(asset: Asset): void {
    if (asset.type) {
      this.dirtyIds.add(asset.id);
      this.saveError = '';
      this.rebuildTypeOptions();
      this.recalcStats();
    }
  }

  onEditComplete(event: { data?: Asset }): void {
    const asset = event.data;
    if (!asset) return;
    asset.value = +asset.value;
    this.dirtyIds.add(asset.id);
    this.saveError = '';
    this.rebuildDuplicates();
    this.recalcStats();
  }

  refreshData(): void {
    this.log('Refresh', 'Refresh button clicked');
    if (this.hasUnsavedChanges) {
      this.confirmationService.confirm({
        header: 'Unsaved Changes',
        message: `You have ${this.dirtyIds.size} unsaved change(s). Refreshing will discard all edits. Do you want to continue?`,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Refresh & Discard',
        rejectLabel: 'Cancel',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => {
          this.doRefresh();
          this.log('Refresh', 'Data refreshed — unsaved changes discarded');
        },
        reject: () => {
          this.log('Refresh', 'Cancelled — unsaved changes kept');
        },
      });
    } else {
      this.doRefresh();
      this.log('Refresh', 'Data refreshed');
    }
  }

  private doRefresh(): void {
    this.assetService.getAssets().subscribe((assets) => {
      this.assets = assets.map((a) => ({ ...a }));
      this.originalAssets = assets.map((a) => ({ ...a }));
      this.dirtyIds.clear();
      this.saveError = '';
      this.rebuildTypeOptions();
      this.rebuildDuplicates();
      this.applyFilters();
      this.recalcStats();
      this.cdr.detectChanges();
    });
  }

  addAsset(): void {
    const today = new Date().toISOString().split('T')[0];
    const newAsset: Asset = {
      id: Date.now().toString(),
      name: 'New Asset',
      type: 'Stock',
      value: 0,
      currency: 'USD',
      status: 'Active',
      lastUpdated: today,
    };
    this.assets = [newAsset, ...this.assets];
    this.dirtyIds.add(newAsset.id);
    this.rebuildTypeOptions();
    this.rebuildDuplicates();
    this.applyFilters();
    this.recalcStats();
    this.log('Add Asset', 'New row added — click cells to edit name, type, and value');
  }

  saveChanges(): void {
    this.log('Save Changes', `Attempting to save ${this.dirtyIds.size} change(s)`);
    const names = this.assets.map((a) => a.name.trim().toLowerCase());
    const hasDuplicate = names.some((n, i) => names.indexOf(n) !== i);
    if (hasDuplicate) {
      this.saveError = 'Duplicate asset name found — please use unique names.';
      this.log('Save Changes', 'Blocked — duplicate asset name detected');
      return;
    }

    const ops: Observable<Asset>[] = [];
    for (const id of this.dirtyIds) {
      const asset = this.assets.find((a) => a.id === id);
      if (!asset) continue;
      const isNew = !this.originalAssets.some((o) => o.id === id);
      const payload = JSON.stringify({
        name: asset.name,
        type: asset.type,
        value: asset.value,
        description: asset.description,
        serialNumber: asset.serialNumber,
      });
      if (isNew) {
        this.log('API POST', 'POST /api/assets');
        this.log('Payload', payload);
        ops.push(this.assetService.addAsset(asset));
      } else {
        this.log('API PUT', `PUT /api/assets/${id}`);
        this.log('Payload', payload);
        ops.push(this.assetService.updateAsset(id, asset));
      }
    }

    const count = this.dirtyIds.size;
    this.saving = true;
    forkJoin(ops).subscribe({
      next: () => {
        this.log('Save Changes', `${count} asset(s) saved successfully`);
        this.dirtyIds.clear();
        this.saveError = '';
        this.saving = false;
        this.originalAssets = this.assets.map((a) => ({ ...a }));
        this.rebuildDuplicates();
      },
      error: (err: HttpErrorResponse) => {
        this.saveError = this.httpErrorMessage(err);
        this.log('Save Changes', `Failed — HTTP ${err.status}: ${this.saveError}`);
        this.saving = false;
      },
    });
  }

  deleteAsset(asset: Asset): void {
    this.log('Delete Asset', `"${asset.name}" (${asset.type})`);
    this.log('API DELETE', `DELETE /api/assets/${asset.id}`);
    // Optimistic UI removal
    this.assets = this.assets.filter((a) => a.id !== asset.id);
    this.originalAssets = this.originalAssets.filter((a) => a.id !== asset.id);
    this.dirtyIds.delete(asset.id);
    this.rebuildTypeOptions();
    this.rebuildDuplicates();
    this.applyFilters();
    this.recalcStats();
    this.assetService.deleteAsset(asset.id).subscribe({
      error: (err: HttpErrorResponse) => {
        this.log('Delete Asset', `Failed — HTTP ${err.status}: ${this.httpErrorMessage(err)}`);
      },
    });
  }

  private httpErrorMessage(err: HttpErrorResponse): string {
    switch (err.status) {
      case 403:
        return 'Permission denied — your account role cannot perform this action. Log in with an admin account.';
      case 401:
        return 'Session expired — please log in again.';
      case 409:
        return 'Conflict — another user may have modified this asset. Refresh and try again.';
      case 404:
        return 'Asset not found — it may have been deleted.';
      default:
        return err.error?.message ?? err.message ?? 'Server error';
    }
  }

  log(action: string, detail: string): void {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${action}: ${detail}`);
    this.activityLog = [{ id: ++this.logCounter, time, action, detail }, ...this.activityLog].slice(
      0,
      50,
    );
  }

  clearLog(): void {
    this.log('Clear Log', 'Activity log cleared');
    this.activityLog = [];
  }
}
