// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MachineTypeAdapterFactory} from './adapters';
import {MachineCategory, NormalizedMachineType, ProviderType} from './models/machine-type.model';

// Re-export for backward compatibility
export {MachineCategory, NormalizedMachineType, ProviderType} from './models/machine-type.model';

/**
 * @deprecated Use NormalizedMachineType instead. This interface is kept for backward compatibility.
 */
export interface MachineTypeOption {
  name: string;
  prettyName?: string;
  vcpus: number;
  memory: number;
  gpus?: number;
  price?: number;
  description?: string;
  architecture?: string;
}

@Component({
  selector: 'km-machine-type-selector',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MachineTypeSelectorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MachineTypeSelectorComponent implements OnInit, OnChanges, ControlValueAccessor {
  /**
   * Raw machine type data from the provider API.
   * Will be normalized using the appropriate adapter based on `provider` input.
   */
  @Input() rawOptions: unknown[] | Record<string, unknown[]> = [];

  /**
   * @deprecated Use `rawOptions` with `provider` input instead.
   * Pre-normalized options for backward compatibility.
   */
  @Input() options: MachineTypeOption[] = [];

  /**
   * The cloud provider type. Used to select the appropriate adapter for normalization.
   * Can be a ProviderType enum value or a string (e.g., 'aws', 'gcp', 'azure').
   */
  @Input() provider: ProviderType | string = ProviderType.Default;

  /** Label displayed above the selector */
  @Input() label = 'Machine Type';

  /** Whether selection is required */
  @Input() required = false;

  /** Whether to show GPU filter tab. If no GPU types exist, tab will be hidden anyway. */
  @Input() showGpuFilter = true;

  /** Emits when a machine type is selected */
  @Output() selectionChange = new EventEmitter<string>();

  /** Emits the full normalized machine type object when selected */
  @Output() machineTypeSelected = new EventEmitter<NormalizedMachineType>();

  searchQuery = '';
  selectedTabIndex = 0;
  selectedMachineType = '';

  /** All normalized machine types */
  normalizedOptions: NormalizedMachineType[] = [];

  /** Filtered options for CPU tab */
  cpuOptions: NormalizedMachineType[] = [];

  /** Filtered options for GPU tab */
  gpuOptions: NormalizedMachineType[] = [];

  /** Currently displayed filtered options (based on selected tab and search) */
  filteredOptions: NormalizedMachineType[] = [];

  /** Whether GPU machine types exist */
  hasGpuTypes = false;

  /** Whether any price data is available */
  hasPriceData = false;

  /** Columns to display in the table */
  displayedColumns: string[] = [];

  readonly MachineCategory = MachineCategory;

  private _onChange: (value: string) => void = () => {};
  private _onTouched: () => void = () => {};

  constructor(private readonly _cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this._normalizeAndFilterOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.rawOptions || changes.options || changes.provider) {
      this._normalizeAndFilterOptions();
    }
  }

  writeValue(value: string): void {
    this.selectedMachineType = value || '';
    this._cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  /**
   * Handle tab change between CPU and GPU types
   */
  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this._applySearchFilter();
  }

  /**
   * Handle search input changes
   */
  onSearchChange(query: string): void {
    this.searchQuery = query;
    this._applySearchFilter();
  }

  /**
   * Handle machine type selection
   */
  onMachineTypeSelect(machineType: NormalizedMachineType): void {
    this.selectedMachineType = machineType.id;
    this._onChange(machineType.id);
    this._onTouched();
    this.selectionChange.emit(machineType.id);
    this.machineTypeSelected.emit(machineType);
    this._cdr.markForCheck();
  }

  /**
   * Get display name for a machine type
   */
  getDisplayName(option: NormalizedMachineType): string {
    return option.name || option.id;
  }

  /**
   * Track function for ngFor optimization
   */
  trackById(_: number, option: NormalizedMachineType): string {
    return option.id;
  }

  /**
   * Get the currently selected category based on tab index
   */
  get selectedCategory(): MachineCategory {
    return this.selectedTabIndex === 1 ? MachineCategory.GPU : MachineCategory.CPU;
  }

  /**
   * Normalize raw options using the appropriate adapter and categorize them
   */
  private _normalizeAndFilterOptions(): void {
    // First check for raw options with provider adapter
    if (this.rawOptions && (Array.isArray(this.rawOptions) ? this.rawOptions.length > 0 : Object.keys(this.rawOptions).length > 0)) {
      const adapter = MachineTypeAdapterFactory.getAdapter(this.provider);
      this.normalizedOptions = adapter.normalizeAll(this.rawOptions as never);
    }
    // Fall back to legacy options format
    else if (this.options && this.options.length > 0) {
      this.normalizedOptions = this._convertLegacyOptions(this.options);
    } else {
      this.normalizedOptions = [];
    }

    // Categorize into CPU and GPU
    this.cpuOptions = this.normalizedOptions.filter(opt => opt.category === MachineCategory.CPU);
    this.gpuOptions = this.normalizedOptions.filter(opt => opt.category === MachineCategory.GPU);

    // Update flags
    this.hasGpuTypes = this.gpuOptions.length > 0;
    this.hasPriceData = this.normalizedOptions.some(opt => opt.pricePerHour !== undefined);

    // Apply search filter
    this._applySearchFilter();
  }

  /**
   * Convert legacy MachineTypeOption[] to NormalizedMachineType[]
   */
  private _convertLegacyOptions(options: MachineTypeOption[]): NormalizedMachineType[] {
    return options.map(opt => ({
      id: opt.name,
      name: opt.prettyName || opt.name,
      vcpus: opt.vcpus,
      memoryGB: opt.memory,
      gpus: opt.gpus ?? 0,
      category: (opt.gpus && opt.gpus > 0) ? MachineCategory.GPU : MachineCategory.CPU,
      description: opt.description || this._inferDescription(opt.name, opt.gpus ?? 0),
      architecture: opt.architecture,
      pricePerHour: opt.price,
    }));
  }

  /**
   * Infer description from machine type name
   */
  private _inferDescription(name: string, gpus: number): string {
    const lowerName = name.toLowerCase();

    if (gpus > 0 || lowerName.includes('gpu')) {
      return 'GPU Optimized';
    }
    if (lowerName.includes('compute') || lowerName.includes('highcpu') || lowerName.includes('high-cpu')) {
      return 'Compute Optimized';
    }
    if (lowerName.includes('memory') || lowerName.includes('highmem') || lowerName.includes('high-memory')) {
      return 'Memory Optimized';
    }
    return 'General Purpose';
  }

  /**
   * Apply search filter to the currently selected category
   */
  private _applySearchFilter(): void {
    const sourceOptions = this.selectedTabIndex === 1 ? this.gpuOptions : this.cpuOptions;

    if (!this.searchQuery) {
      this.filteredOptions = [...sourceOptions];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredOptions = sourceOptions.filter(
        option =>
          option.id.toLowerCase().includes(query) ||
          option.name.toLowerCase().includes(query) ||
          (option.description && option.description.toLowerCase().includes(query))
      );
    }

    this._updateDisplayedColumns();
    this._cdr.markForCheck();
  }

  /**
   * Update displayed columns based on current state
   */
  private _updateDisplayedColumns(): void {
    const columns = ['select', 'name', 'vcpus', 'memoryGB'];

    // Add GPU column if in GPU tab
    if (this.selectedCategory === MachineCategory.GPU) {
      columns.push('gpus');
    }

    // Always show description
    columns.push('description');

    // Add price column if price data exists
    if (this.hasPriceData) {
      columns.push('pricePerHour');
    }

    this.displayedColumns = columns;
  }
}
