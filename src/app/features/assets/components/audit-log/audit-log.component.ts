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
