# Quick Start Guide: Advanced Machine Type Selector

## For Users

### What's New?

The machine type selection during cluster creation now features a **rich tabular interface** instead of a simple dropdown. This makes it much easier to:

- **Compare** machine specifications side-by-side
- **Find GPU-enabled** instances quickly
- **Search** by name or description
- **See pricing** information at a glance

### How to Use

1. **Navigate** to the cluster creation wizard
2. **Select** AWS as your provider (or any provider with the new selector)
3. **Choose** your architecture (x64 or arm64)
4. **Use the new machine type selector:**

   **Search:** Type in the search box to filter by name or description
   
   **Filter by Category:**
   - Click "CPU / General" for standard compute instances
   - Click "GPU / Accelerated" for GPU-enabled instances
   
   **Select:** Click on any row to select that machine type
   
   **Review:** See your selection confirmed at the bottom

5. **Continue** with the rest of the cluster configuration

### Tips

- 💡 Use the search box to quickly find specific instance families (e.g., "t3", "g4dn")
- 💡 Sort by price by scanning the rightmost column
- 💡 Check the architecture badge to ensure compatibility
- 💡 Look for GPU count when deploying ML/AI workloads

## For Developers

### Adding to a New Provider

**Step 1:** Import the component (already available via SharedModule)

**Step 2:** Map your provider's machine types to the interface:

```typescript
import {MachineTypeOption} from '@shared/components/machine-type-selector/component';

// In your component
machineTypeOptions: MachineTypeOption[] = [];

private _setMachineTypes(providerMachineTypes: YourProviderType[]): void {
  this.machineTypeOptions = providerMachineTypes.map(machine => ({
    name: machine.id,                    // Required: unique identifier
    prettyName: machine.displayName,     // Optional: human-readable name
    vcpus: machine.cpuCount,             // Required: number of CPUs
    memory: machine.memoryGB,            // Required: memory in GB
    gpus: machine.gpuCount || 0,         // Optional: GPU count (defaults to 0)
    price: machine.pricePerHour,         // Optional: price in USD/hour
    description: machine.category,       // Optional: auto-generated if omitted
    architecture: machine.arch,          // Optional: e.g., 'x64', 'arm64'
  }));
}
```

**Step 3:** Add to your template:

```html
<km-machine-type-selector 
  [options]="machineTypeOptions"
  [label]="'Machine Type'"
  [required]="true"
  [showGpuFilter]="true"
  [formControlName]="Controls.MachineType"
  (selectionChange)="onMachineTypeChange($event)">
</km-machine-type-selector>
```

**Step 4:** Handle the selection:

```typescript
onMachineTypeChange(machineType: string): void {
  // Update your node data with the selected machine type
  this._nodeDataService.nodeData.spec.cloud.yourProvider.machineType = machineType;
  this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
}
```

### Customization Options

```typescript
// Hide GPU filter for providers without GPU support
[showGpuFilter]="false"

// Custom label
[label]="'Select Instance Size'"

// Make selection optional
[required]="false"

// Listen to selection changes
(selectionChange)="onSelectionChange($event)"
```

### Testing

```bash
# Run unit tests
npm test -- --include="**/machine-type-selector/**"

# Run E2E tests
npm run e2e -- --spec="**/machine-type-selector.spec.ts"
```

## Component Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `MachineTypeOption[]` | `[]` | Array of machine types to display |
| `label` | `string` | `'Machine Type'` | Label above the selector |
| `required` | `boolean` | `false` | Whether selection is required |
| `showGpuFilter` | `boolean` | `true` | Show/hide GPU category toggle |

| Event | Type | Description |
|-------|------|-------------|
| `selectionChange` | `EventEmitter<string>` | Emits selected machine type name |

## MachineTypeOption Interface

```typescript
interface MachineTypeOption {
  name: string;           // Required: Machine type identifier
  prettyName?: string;    // Optional: Display name
  vcpus: number;          // Required: CPU count
  memory: number;         // Required: RAM in GB
  gpus?: number;          // Optional: GPU count (default: 0)
  price?: number;         // Optional: Price per hour USD
  description?: string;   // Optional: Category/description
  architecture?: string;  // Optional: CPU architecture
}
```

## Examples

### AWS Integration

```typescript
// AWS-specific mapping
this.machineTypeOptions = awsSizes
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
```

### GCP Integration

```typescript
// GCP-specific mapping
this.machineTypeOptions = gcpMachineTypes.map(machine => ({
  name: machine.name,
  prettyName: machine.description,
  vcpus: machine.guestCpus,
  memory: machine.memoryMb / 1024,
  gpus: machine.accelerators?.length || 0,
}));
```

### Azure Integration

```typescript
// Azure-specific mapping
this.machineTypeOptions = azureVMSizes.map(vm => ({
  name: vm.name,
  prettyName: vm.name,
  vcpus: vm.numberOfCores,
  memory: vm.memoryInMB / 1024,
  gpus: vm.numberOfGpus || 0,
}));
```

## Troubleshooting

### "No machine types found"

**Cause:** The `options` array is empty or all options are filtered out.

**Solution:** 
1. Verify the provider API is returning machine types
2. Check if the architecture filter is removing all options
3. Clear any search queries or category filters

### Selection not updating

**Cause:** The form control is not properly connected.

**Solution:**
```typescript
// Ensure form control is set up correctly
this.form = this._builder.group({
  machineType: ['', Validators.required]
});
```

### GPU filter not working

**Cause:** Machine types don't have `gpus` property set.

**Solution:**
```typescript
// Ensure gpus is set (even to 0) for all machine types
gpus: machine.gpuCount || 0
```

## Support

- 📖 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/kubermatic/kubermatic/issues)
- 💬 [Community Slack](https://slack.kubermatic.io/)

---

**Last Updated:** January 7, 2026
