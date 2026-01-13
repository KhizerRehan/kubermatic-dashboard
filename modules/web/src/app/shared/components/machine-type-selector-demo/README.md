# Machine Type Selector Demo

This demo component showcases the provider-agnostic `km-machine-type-selector` component with real API response formats from multiple cloud providers.

## Features

- **Multi-Provider Support**: Test the selector with AWS, GCP, Azure, Hetzner, DigitalOcean, and OpenStack
- **Real API Data**: Uses actual provider API response formats from `/modules/web/src/providers`
- **Adapter Pattern Validation**: Demonstrates how different provider data formats are normalized
- **Interactive Testing**: Switch between providers and see how the component handles different data structures
- **Detailed Inspection**: View normalized data objects and API response formats

## How to Access

1. Start the development server:
   ```bash
   npm start
   ```

2. Navigate to: `http://localhost:8000/machine-type-demo`
   
   Note: You must be logged in to access this page (protected by AuthGuard)

## Usage

1. **Select a Provider**: Click on one of the provider buttons (AWS, GCP, Azure, etc.)
2. **View API Format**: Expand "View API Response Format" to see the raw provider data structure
3. **Select Machine Type**: Browse and select machine types using the component
4. **Inspect Details**: View the normalized machine type details below the selector
5. **View Normalized Data**: Expand "View Normalized Data Object" to see the adapter output

## What It Tests

### Adapter Pattern
- Each provider has unique API response formats:
  - **AWS**: `{ name, pretty_name, memory, vcpus, gpus, price, architecture }`
  - **GCP**: `{ name, description, memory (MB), vcpus }` - GPUs inferred from name
  - **Azure**: `{ name, numberOfCores, numberOfGPUs, memoryInMB }`
  - **Hetzner**: Grouped data `{ standard: [], dedicated: [] }` with `cores` instead of `vcpus`
  - **DigitalOcean**: Grouped data with slug-based identifiers
  - **OpenStack**: `{ slug, memory (MB), vcpus, disk, swap }`

### Component Features
- CPU/GPU filtering tabs
- Search functionality
- Responsive table layout
- Light/dark theme support
- Price display (when available)
- Architecture badges
- GPU count display

## Provider Data Sources

All mock data is loaded from:
```
/modules/web/src/providers/
├── aws.json
├── gcp.json
├── azure.json
├── hetzner-withGPU.json
├── digitalocean.json
└── openstack.json
```

## Implementation Reference

The demo component demonstrates proper usage of the selector:

```typescript
<km-machine-type-selector
  [rawOptions]="providerData"
  [provider]="'aws'"
  label="Select Instance Type"
  [required]="true"
  (selectionChange)="onSelect($event)"
  (machineTypeSelected)="onMachineTypeSelect($event)">
</km-machine-type-selector>
```

## Development Notes

- Component is registered in `SharedModule`
- Route is defined in `PagesRoutingModule` at `/machine-type-demo`
- Theme support via `theme.scss` mixin
- Uses existing Material components and Kubermatic styling patterns
