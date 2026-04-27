import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Admin Panel</h1>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-center gap-4">
            <div class="bg-indigo-100 rounded-full p-4">
              <i class="pi pi-users text-indigo-600 text-2xl"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">User Management</h3>
              <p class="text-sm text-gray-500">Manage system users</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-center gap-4">
            <div class="bg-green-100 rounded-full p-4">
              <i class="pi pi-sliders-h text-green-600 text-2xl"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">System Settings</h3>
              <p class="text-sm text-gray-500">Configure application</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-center gap-4">
            <div class="bg-amber-100 rounded-full p-4">
              <i class="pi pi-history text-amber-600 text-2xl"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">Audit Log</h3>
              <p class="text-sm text-gray-500">View system activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminComponent {}
