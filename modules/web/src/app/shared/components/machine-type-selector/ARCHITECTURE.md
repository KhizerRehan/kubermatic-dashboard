# Machine Type Selector - Component Architecture

## Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Machine Type Selector                     │
│                    (ControlValueAccessor)                    │
└───────────────────┬─────────────────────────────────────────┘
                    │
    ┌───────────────┴───────────────┐
    │                               │
    ▼                               ▼
┌───────────────┐          ┌─────────────────┐
│  Template     │          │   Component     │
│  (HTML)       │◄────────►│   Logic (TS)    │
└───────────────┘          └─────────────────┘
    │                               │
    ▼                               ▼
┌───────────────┐          ┌─────────────────┐
│  Styling      │          │   Data Model    │
│  (SCSS)       │          │   (Interface)   │
└───────────────┘          └─────────────────┘
```

## Component Hierarchy

```
km-machine-type-selector
│
├── .km-machine-type-selector-label
│   └── Label text + required indicator
│
└── .km-machine-type-selector-panel
    │
    ├── .km-machine-type-selector-search
    │   └── mat-form-field (Search input)
    │
    ├── .km-machine-type-selector-categories
    │   └── mat-button-toggle-group
    │       ├── CPU / General toggle
    │       └── GPU / Accelerated toggle
    │
    ├── .km-machine-type-selector-table-container (scrollable)
    │   └── table.km-machine-type-selector-table
    │       ├── thead (sticky)
    │       │   └── tr
    │       │       ├── th (Select)
    │       │       ├── th (Name)
    │       │       ├── th (vCPU)
    │       │       ├── th (Memory)
    │       │       ├── th (GPUs) [conditional]
    │       │       ├── th (Description)
    │       │       └── th (Price) [conditional]
    │       │
    │       └── tbody
    │           └── tr.km-machine-type-selector-row (for each option)
    │               ├── td (mat-radio-button)
    │               ├── td (Name + architecture badge)
    │               ├── td (vCPU count)
    │               ├── td (Memory in GB)
    │               ├── td (GPU count) [conditional]
    │               ├── td (Description)
    │               └── td (Price) [conditional]
    │
    └── .km-machine-type-selector-footer [conditional]
        └── Selected indicator
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Parent Component                      │
│                     (e.g., AWS Component)                    │
└───────────────────┬──────────────────┬──────────────────────┘
                    │                  │
                    │ [options]        │ (selectionChange)
                    │ [label]          │ event
                    │ [required]       │
                    │ [showGpuFilter]  │
                    │                  │
                    ▼                  │
┌─────────────────────────────────────┼──────────────────────┐
│        MachineTypeSelectorComponent │                      │
│                                     │                      │
│  Input Properties:                  │  Output Events:      │
│  • options: MachineTypeOption[]     │  • selectionChange   │
│  • label: string                    │                      │
│  • required: boolean                └──────────────────────┤
│  • showGpuFilter: boolean                                  │
│                                                             │
│  Internal State:                                           │
│  • searchQuery: string                                     │
│  • selectedCategory: MachineCategory                       │
│  • selectedMachineType: string                             │
│  • filteredOptions: MachineTypeOption[]                    │
│                                                             │
│  Methods:                                                   │
│  • onCategoryChange(category)                              │
│  • onSearchChange(query)                                   │
│  • onMachineTypeSelect(name)                               │
│  • _filterOptions()                                        │
└─────────────────────────────────────────────────────────────┘
```

## State Management

```
User Actions                Internal State              Visual Output
───────────                ───────────────             ─────────────

[Type in search]    ──►    searchQuery = "t3"    ──►   Filtered table
                            _filterOptions()           showing only
                                                       matching rows

[Click CPU toggle]  ──►    selectedCategory = CPU ──► Show only
                            _filterOptions()          CPU instances

[Click GPU toggle]  ──►    selectedCategory = GPU ──► Show only
                            _filterOptions()          GPU instances

[Click table row]   ──►    selectedMachineType = ──►  Highlight row
                            "t3.medium"               Show footer
                            _onChange(value)          Emit event
```

## Integration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 1. Provider Fetches Data                     │
│                                                               │
│  Provider API ──► AWSService.getSizes() ──► AWSSize[]       │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│              2. Component Maps Data to Interface             │
│                                                               │
│  AWSSize[] ──► map() ──► MachineTypeOption[]                │
│  {                        {                                  │
│    name: "t3.medium"        name: "t3.medium"               │
│    pretty_name: "..."       prettyName: "..."               │
│    vcpus: 2                 vcpus: 2                        │
│    memory: 4                memory: 4                       │
│    gpus: 0                  gpus: 0                         │
│    price: 0.048             price: 0.048                    │
│  }                          architecture: "x64"              │
│                          }                                   │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│            3. Selector Receives and Displays Data            │
│                                                               │
│  [options]="machineTypeOptions"                              │
│                                                               │
│  User sees table ──► Selects option ──► Emits event        │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│             4. Parent Handles Selection Change               │
│                                                               │
│  (selectionChange)="onSizeChange($event)"                    │
│                                                               │
│  Update node data ──► Trigger validation ──► Continue wizard│
└─────────────────────────────────────────────────────────────┘
```

## Filtering Logic

```
Input: options = [All Machine Types]
         │
         ▼
    ┌────────────────────┐
    │ Architecture Filter│ (Applied in parent for AWS)
    │ x64 or arm64       │
    └────────┬───────────┘
             │
             ▼ filteredByArchitecture[]
    ┌────────────────────┐
    │ Category Filter    │
    │ CPU or GPU         │
    └────────┬───────────┘
             │
             │ filteredByCategory[] = options.filter(o => 
             │   category === GPU ? o.gpus > 0 : o.gpus === 0
             │ )
             │
             ▼ filteredByCategory[]
    ┌────────────────────┐
    │ Search Filter      │
    │ By name/description│
    └────────┬───────────┘
             │
             │ filteredOptions[] = filteredByCategory.filter(o =>
             │   o.name.includes(query) ||
             │   o.prettyName?.includes(query) ||
             │   o.description?.includes(query)
             │ )
             │
             ▼
Output: filteredOptions[] displayed in table
```

## Component Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                         ngOnInit()                           │
│                                                               │
│  1. Initialize component                                     │
│  2. Call _filterOptions()                                    │
│  3. Set default category (CPU)                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   User Interactions                          │
│                                                               │
│  • Type in search ──► onSearchChange() ──► _filterOptions() │
│  • Toggle category ──► onCategoryChange() ──► _filterOptions│
│  • Click row ──► onMachineTypeSelect() ──► emit event       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ControlValueAccessor Methods                    │
│                                                               │
│  • writeValue() ──► Set internal value                       │
│  • registerOnChange() ──► Store callback                     │
│  • registerOnTouched() ──► Store callback                    │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
machine-type-selector/
│
├── component.ts           (166 lines)
│   ├── @Component decorator
│   ├── MachineTypeOption interface
│   ├── MachineCategory enum
│   ├── Properties (Input/Output)
│   ├── ControlValueAccessor implementation
│   └── Methods (filter, search, select)
│
├── template.html          (130 lines)
│   ├── Label section
│   ├── Panel container
│   │   ├── Search bar
│   │   ├── Category toggles
│   │   ├── Table (thead + tbody)
│   │   └── Footer (selection status)
│   └── Conditional rendering (@if)
│
├── style.scss             (266 lines)
│   ├── Layout (.km-machine-type-selector)
│   ├── Search styling
│   ├── Category toggle styling
│   ├── Table styling
│   │   ├── Fixed headers (position: sticky)
│   │   ├── Row hover effects
│   │   └── Column widths
│   └── Dark theme overrides
│
├── index.ts               (17 lines)
│   └── Exports
│
├── README.md              (459 lines)
│   ├── Overview
│   ├── Usage examples
│   ├── API reference
│   └── Integration guide
│
├── QUICK_START.md         (200+ lines)
│   ├── User guide
│   ├── Developer guide
│   └── Troubleshooting
│
└── sample-data.ts         (200 lines)
    ├── AWS sample data
    ├── GCP sample data
    └── Azure sample data
```

## Dependencies

```
Angular Core
  ├── @angular/core (Component, Input, Output, etc.)
  ├── @angular/forms (ControlValueAccessor, NG_VALUE_ACCESSOR)
  └── @angular/common (NgIf, NgFor)

Angular Material
  ├── MatFormFieldModule (Search input)
  ├── MatInputModule (Text input)
  ├── MatIconModule (Icons)
  ├── MatRadioModule (Radio buttons)
  └── MatButtonToggleModule (Category toggles)

RxJS
  └── (Used in parent components for data streaming)

TypeScript
  └── Interface definitions
```

---

This architecture diagram provides a comprehensive overview of how the Machine Type Selector component is structured and how it integrates with the rest of the application.
