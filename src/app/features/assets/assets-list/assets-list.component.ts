import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../../core/services/asset.service';
import { Asset } from '../../../core/models/asset.model';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-assets-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, InputTextModule, ButtonModule, SelectModule],
  template: `
    <div class="p-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Assets</h1>
          <p class="text-gray-500">Manage your investment portfolio</p>
        </div>
        <button pButton icon="pi pi-plus" label="Add Asset" severity="primary"></button>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <input pInputText type="text" [(ngModel)]="searchText" placeholder="Search assets..." class="w-full" (input)="filterAssets()"/>
          </div>
          <div>
            <p-select
              [options]="typeOptions"
              [(ngModel)]="selectedType"
              placeholder="Filter by type"
              (onChange)="filterAssets()"
              [showClear]="true"
              styleClass="w-full sm:w-48"
            ></p-select>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <p-table
          [value]="filteredAssets"
          [rows]="10"
          [paginator]="true"
          [rowsPerPageOptions]="[5, 10, 25]"
          styleClass="p-datatable-sm p-datatable-gridlines"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
              <th pSortableColumn="type">Type <p-sortIcon field="type"></p-sortIcon></th>
              <th pSortableColumn="value" class="text-right">Value <p-sortIcon field="value"></p-sortIcon></th>
              <th>Currency</th>
              <th pSortableColumn="status">Status <p-sortIcon field="status"></p-sortIcon></th>
              <th pSortableColumn="lastUpdated">Last Updated <p-sortIcon field="lastUpdated"></p-sortIcon></th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-asset>
            <tr>
              <td class="font-medium">{{ asset.name }}</td>
              <td><span class="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">{{ asset.type }}</span></td>
              <td class="text-right font-mono">{{ asset.value | number:'1.2-2' }}</td>
              <td>{{ asset.currency }}</td>
              <td>
                <span [class]="asset.status === 'Active' ? 'bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium' : 'bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium'">
                  {{ asset.status }}
                </span>
              </td>
              <td class="text-gray-500 text-sm">{{ asset.lastUpdated }}</td>
              <td>
                <div class="flex gap-1">
                  <button pButton icon="pi pi-eye" severity="secondary" [text]="true" size="small"></button>
                  <button pButton icon="pi pi-pencil" severity="secondary" [text]="true" size="small"></button>
                  <button pButton icon="pi pi-trash" severity="danger" [text]="true" size="small"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="text-center py-8 text-gray-400">No assets found.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `
})
export class AssetsListComponent implements OnInit {
  assets: Asset[] = [];
  filteredAssets: Asset[] = [];
  searchText = '';
  selectedType: string | null = null;
  typeOptions: { label: string; value: string }[] = [];

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    this.assetService.getAssets().subscribe(assets => {
      this.assets = assets;
      this.filteredAssets = assets;
      const types = [...new Set(assets.map(a => a.type))];
      this.typeOptions = types.map(t => ({ label: t, value: t }));
    });
  }

  filterAssets(): void {
    this.filteredAssets = this.assets.filter(a => {
      const matchesSearch = !this.searchText ||
        a.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        a.type.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesType = !this.selectedType || a.type === this.selectedType;
      return matchesSearch && matchesType;
    });
  }
}
