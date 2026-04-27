import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-indigo-900 text-indigo-200 py-4 px-6 flex flex-col sm:flex-row items-center justify-between text-sm gap-2 flex-shrink-0">
      <div class="flex items-center gap-2">
        <i class="pi pi-chart-bar text-indigo-400"></i>
        <span class="font-semibold text-white">Assets Management</span>
      </div>
      <div class="text-center">
        <span>&copy; {{ currentYear }} Assets Management System. All rights reserved.</span>
      </div>
      <div class="flex items-center gap-4">
        <a href="#" class="hover:text-white transition-colors">Privacy Policy</a>
        <a href="#" class="hover:text-white transition-colors">Terms of Service</a>
      </div>
    </footer>
  `
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
