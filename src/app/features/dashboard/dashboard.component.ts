import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AssetService } from '../../core/services/asset.service';
import { Asset } from '../../core/models/asset.model';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, CurrencyPipe],
  template: `
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
              <p class="text-2xl font-bold text-gray-800">{{ totalValue | currency:'USD':'symbol':'1.0-0' }}</p>
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
              <p class="text-2xl font-bold text-gray-800">{{ assetTypes }}</p>
            </div>
            <div class="bg-purple-100 rounded-full p-3">
              <i class="pi pi-chart-pie text-purple-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Assets Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-5 border-b border-gray-100">
          <h2 class="text-lg font-semibold text-gray-800">Recent Assets</h2>
        </div>
        <p-table [value]="assets" [rows]="5" [paginator]="true" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th class="text-right">Value</th>
              <th>Status</th>
              <th>Last Updated</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-asset>
            <tr class="hover:bg-gray-50">
              <td class="font-medium">{{ asset.name }}</td>
              <td>{{ asset.type }}</td>
              <td class="text-right font-mono">{{ asset.value | currency:asset.currency }}</td>
              <td>
                <span [class]="asset.status === 'Active' ? 'bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium' : 'bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium'">
                  {{ asset.status }}
                </span>
              </td>
              <td class="text-gray-500 text-sm">{{ asset.lastUpdated }}</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  assets: Asset[] = [];
  totalValue = 0;
  activeCount = 0;
  assetTypes = 0;
  currentUser: User | null = null;

  constructor(private assetService: AssetService, private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.assetService.getAssets().subscribe(assets => {
      this.assets = assets;
      this.totalValue = assets.reduce((sum, a) => sum + a.value, 0);
      this.activeCount = assets.filter(a => a.status === 'Active').length;
      this.assetTypes = new Set(assets.map(a => a.type)).size;
    });
  }
}
