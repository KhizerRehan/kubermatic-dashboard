# Machine Type Selector Component

## Overview

The **Machine Type Selector** is a rich, tabular interface component that replaces simple dropdown selectors for choosing machine/instance types during cluster creation. It provides an intuitive way to compare specifications, filter by category (CPU/GPU), and search through potentially large lists of machine types.

## Features

### ✨ Core Features

- **Tabular View**: Display machine types in a structured table with columns for:
  - Selection radio button
  - Name / Instance Type (with architecture badge)
  - vCPU count
  - Memory (RAM in GB)
  - GPU count (when in GPU category)
  - Description/Category
  - Price per hour (optional)

- **Search Functionality**: Real-time filtering by name, pretty name, or description

- **Category Toggles**: 
  - **CPU / General**: Standard compute instances
  - **GPU / Accelerated**: GPU-enabled instances

- **Fixed Headers**: Search bar, category toggles, and column headers remain fixed while scrolling

- **Responsive Design**: Adapts to different screen sizes and supports both light and dark themes

- **Accessibility**: Full keyboard navigation and screen reader support

## Usage

### Basic Example

```typescript
import { MachineTypeOption } from '@shared/components/machine-type-selector/component';

// In your component
machineTypeOptions: MachineTypeOption[] = [
  {
    name: 't3.medium',
    prettyName: 'T3 Medium',
    vcpus: 2,
    memory: 4,
    gpus: 0,
    price: 0.048,
    description: 'General Purpose',
    architecture: 'x64'
  },
  {
    name: 'g4dn.xlarge',
    prettyName: 'G4DN Extra Large',
    vcpus: 4,
    memory: 16,
    gpus: 1,
    price: 0.658,
    description: 'GPU Optimized',
    architecture: 'x64'
  }
];

selectedMachineType = '';

onMachineTypeChange(machineType: string): void {
  console.log('Selected:', machineType);
}
```

```html
<km-machine-type-selector 
  [options]="machineTypeOptions"
  [label]="'Machine Type'"
  [required]="true"
  [showGpuFilter]="true"
  [(ngModel)]="selectedMachineType"
  (selectionChange)="onMachineTypeChange($event)">
</km-machine-type-selector>
```

### With Reactive Forms

```typescript
import { FormBuilder, FormGroup } from '@angular/forms';

form: FormGroup;

ngOnInit(): void {
  this.form = this._builder.group({
    machineType: ['', Validators.required]
  });
}
```

```html
<form [formGroup]="form">
  <km-machine-type-selector 
    [options]="machineTypeOptions"
    [label]="'Machine Type'"
    [required]="true"
    [showGpuFilter]="true"
    formControlName="machineType">
  </km-machine-type-selector>
</form>
```

## Interface

### MachineTypeOption

```typescript
interface MachineTypeOption {
  name: string;           // Machine type identifier (e.g., 't3.medium')
  prettyName?: string;    // Human-readable name (e.g., 'T3 Medium')
  vcpus: number;          // Number of virtual CPUs
  memory: number;         // Memory in GB
  gpus?: number;          // Number of GPUs (optional, defaults to 0)
  price?: number;         // Price per hour in USD (optional)
  description?: string;   // Custom description (optional, auto-generated if not provided)
  architecture?: string;  // Architecture (e.g., 'x64', 'arm64')
}
```

### Component Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `options` | `MachineTypeOption[]` | `[]` | Array of machine type options |
| `label` | `string` | `'Machine Type'` | Label displayed above the selector |
| `required` | `boolean` | `false` | Whether selection is required |
| `showGpuFilter` | `boolean` | `true` | Whether to show the GPU category toggle |

### Component Outputs

| Output | Type | Description |
|--------|------|-------------|
| `selectionChange` | `EventEmitter<string>` | Emits the selected machine type name |

## Integration Example (AWS Provider)

The component has been integrated into the AWS provider in the cluster creation wizard. Here's how it's used:

### Component TypeScript

```typescript
import { MachineTypeOption } from '@shared/components/machine-type-selector/component';
import { AWSSize } from '@shared/entity/provider/aws';

export class AWSBasicNodeDataComponent {
  machineTypeOptions: MachineTypeOption[] = [];

  private _setSizes(sizes: AWSSize[]): void {
    // Convert AWS sizes to MachineTypeOption format
    this.machineTypeOptions = sizes
      .filter(size => size.architecture === this.selectedArchitecture)
      .map(size => ({
        name: size.name,
        prettyName: size.pretty_name,
        vcpus: size.vcpus,
        memory: size.memory,
        gpus: size.gpus,
        price: size.price,
        architecture: size.architecture,
      }));
  }

  onSizeChange(size: string): void {
    // Handle selection change
    this._nodeDataService.nodeData.spec.cloud.aws.instanceType = size;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }
}
```

### Template HTML

```html
<km-machine-type-selector 
  [options]="machineTypeOptions"
  [label]="sizeLabel"
  [required]="true"
  [showGpuFilter]="true"
  [formControlName]="Controls.Size"
  (selectionChange)="onSizeChange($event)">
</km-machine-type-selector>
```

## Styling

The component includes comprehensive SCSS styling with:

- **Sticky headers** for search bar, category toggles, and table headers
- **Scrollable table body** (max-height: 400px)
- **Hover effects** on rows
- **Selection highlighting** with a distinct background color
- **Dark theme support** via `.km-dark-theme` class
- **Architecture badges** with subtle styling
- **Responsive layout** adapting to container width

### Customization

You can override styles by targeting the component's CSS classes:

```scss
.km-machine-type-selector {
  // Override max-height for table container
  &-table-container {
    max-height: 600px;
  }

  // Custom selection color
  &-row-selected {
    background-color: rgba(76, 175, 80, 0.12);
  }
}
```

## Multi-Provider Support

The component is designed to work with any cloud provider. Map provider-specific instance data to the `MachineTypeOption` interface:

### GCP Example

```typescript
gcpMachineTypeOptions = gcpMachineTypes.map(machine => ({
  name: machine.name,
  prettyName: machine.description,
  vcpus: machine.guestCpus,
  memory: machine.memoryMb / 1024,
  gpus: machine.accelerators?.length || 0,
  description: machine.kind,
}));
```

### Azure Example

```typescript
azureMachineTypeOptions = azureVMSizes.map(vm => ({
  name: vm.name,
  prettyName: vm.name,
  vcpus: vm.numberOfCores,
  memory: vm.memoryInMB / 1024,
  gpus: vm.numberOfGpus || 0,
  description: vm.osDiskSizeInMB ? 'With OS Disk' : 'Standard',
}));
```

## Benefits

### User Experience

- **Easy Comparison**: Users can see all specifications at once
- **Quick Filtering**: Find GPU instances or search by name instantly
- **Visual Feedback**: Selected row is clearly highlighted
- **Price Transparency**: Optional price column helps with cost optimization

### Developer Experience

- **Reusable**: Single component works across all providers
- **Type-Safe**: Full TypeScript interface support
- **Flexible**: Supports both ngModel and reactive forms
- **Maintainable**: Centralized styling and behavior

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- **ARIA labels** for screen readers
- **Keyboard navigation** (arrow keys, Enter to select)
- **Focus management** with visible focus indicators
- **Semantic HTML** (proper table structure)

## Future Enhancements

Potential improvements for future versions:

- [ ] Column sorting (by vCPU, memory, price)
- [ ] Multiple selection mode
- [ ] Custom column configuration
- [ ] Export table data
- [ ] Favorites/bookmarking
- [ ] Comparison mode (side-by-side comparison)
- [ ] Performance tier indicators (Basic/Standard/Premium)
- [ ] Region-specific pricing

## License

Copyright 2026 The Kubermatic Kubernetes Platform contributors.
Licensed under the Apache License, Version 2.0.
