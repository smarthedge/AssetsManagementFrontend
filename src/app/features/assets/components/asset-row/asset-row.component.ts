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
        aria-label="Toggle row details"
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
          aria-label="Mark for deletion"
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
          aria-label="Restore row"
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
