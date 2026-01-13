# Kubermatic Web UI - Quick Reference Guide

## Directory Quick Navigation

### Core Services
**Location**: `modules/web/src/app/core/services/`

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `cluster.ts` | Cluster CRUD | create(), list(), get(), update(), delete() |
| `cluster-spec.ts` | Cluster state holder | provider, datacenter, cluster getters/setters |
| `node-data/service.ts` | Node config state | nodeDataChanges Observable, provider management |
| `wizard/wizard.ts` | Wizard navigation | stepper, steps, step visibility control |
| `wizard/presets.ts` | Provider presets | credential presets, credential loading |
| `provider/aws.ts` | AWS API wrapper | getSubnets(), getSizes() |

### Key Components

**Wizard Steps**: `modules/web/src/app/wizard/step/`
- `provider-datacenter/` - Provider & datacenter selection
- `cluster/` - Cluster name, version, network
- `provider-settings/` - Cloud-specific settings
- `node-settings/` - Initial node deployment
- `applications/` - Application selection
- `summary/` - Review configuration

**Node Data**: `modules/web/src/app/node-data/`
- `component.ts` - Main node configuration component (30KB)
- `basic/provider/aws/` - AWS-specific node config
- `basic/provider/{provider}/` - Provider-specific components

**Shared Components**: `modules/web/src/app/shared/components/`
- 57+ reusable components
- Form, dialog, utility, and provider-specific components
- All exported through `shared/module.ts`

### Key Models & Types

**Location**: `modules/web/src/app/shared/`

| File | Contains |
|------|----------|
| `entity/cluster.ts` | Cluster, CloudSpec, ClusterSpec types |
| `entity/node.ts` | NodeSpec, NodeCloudSpec, OperatingSystemSpec |
| `entity/provider/*.ts` | Provider-specific entities (AWS, Azure, GCP, etc.) |
| `model/NodeSpecChange.ts` | NodeData class for data transfer |
| `model/NodeProviderConstants.ts` | NodeProvider enum, OS enum, utilities |
| `validators/base-form.validator.ts` | Base validator class |

---

## Common Tasks

### Adding a New Feature Component
```
1. Create: app/my-feature/
2. Files: component.ts, template.html, style.scss, module.ts
3. Export: Add to module.ts declarations
4. Register: Add route in routing.ts with loadChildren
5. Use: Import in other modules via app/my-feature/module
```

### Adding a New Cloud Provider
```
1. API Service: core/services/provider/provider-name.ts
   - Extends HttpClient communication
   - Methods for getSubnets(), getSizes(), etc.

2. Node Config: node-data/basic/provider/provider-name/
   - Component implementing ControlValueAccessor
   - Handles provider-specific node configuration

3. Wizard Settings: wizard/step/provider-settings/provider/provider-name/
   - Component for cluster-level provider setup

4. Types: shared/entity/provider/provider-name.ts
   - Define provider-specific types (Subnet, Size, etc.)

5. Constants: Update shared/model/NodeProviderConstants.ts
   - Add provider enum value
   - Add display name mapping
```

### Modifying the Wizard
```
1. View Steps: wizard/config.ts
   - Each step is a WizardStep with enabled flag
   
2. Update Visibility: core/services/wizard/wizard.ts
   - _hideStep() / _showStep() methods
   - Called based on provider selection

3. Add Form Control: Use FormBuilder in step component
   - Set validators, configure async validators
   - Connect to service through form control value

4. Conditional Rendering: Use *ngIf in step template
   - Based on provider, operating system, etc.
```

### Understanding Data Flow for Node Configuration
```
Wizard Step (node-settings/)
    ↓
NodeDataComponent (ControlValueAccessor)
    ↓
Provider-Specific Component (aws/, gcp/, etc.)
    ↓
NodeDataService (state update & broadcast)
    ↓
Other components subscribe to nodeDataChanges
```

### Working with Forms
```typescript
// 1. In component
constructor(private fb: FormBuilder) {}

ngOnInit() {
  this.form = this.fb.group({
    name: ['', Validators.required],
    count: [1, [Validators.required, Validators.min(1)]],
    provider: ['', this.asyncValidator]
  });
}

// 2. Implement ControlValueAccessor for reuse
writeValue(value: any) { this.form.patchValue(value); }
registerOnChange(fn: any) { this.onChangeCallback = fn; }
registerOnTouched(fn: any) { this.onTouchedCallback = fn; }

// 3. Export in SharedModule
// 4. Use in parent form
<my-component formControl="myControl"></my-component>
```

---

## State Management Overview

### No Redux/NgRx - Service-Based Pattern

**State Holders**:
1. `ClusterSpecService` - Cluster configuration
2. `NodeDataService` - Node deployment configuration
3. `WizardService` - Wizard navigation state

**Pattern**:
```typescript
// Define private state
private _state = initialState;

// Expose as Observable
readonly stateChanges = new ReplaySubject<State>();

// Update and emit
setProperty(value) {
  this._state = newState;
  this.stateChanges.next(this._state);
}
```

**Subscription in Components**:
```typescript
constructor(private service: MyService) {}

ngOnInit() {
  this.service.stateChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(state => {
      // Update component
    });
}
```

---

## HTTP Interceptors

**Location**: `core/interceptors/`

1. **AuthInterceptor** - Adds JWT token to requests
2. **CheckTokenInterceptor** - Validates token expiration
3. **ErrorNotificationsInterceptor** - Shows error notifications
4. **LoaderInterceptor** - Shows/hides loading spinner

---

## Material Design Configuration

**Defaults Set In**: `shared/module.ts`

```typescript
// Dialog: 660px width
MAT_DIALOG_DEFAULT_OPTIONS: { minWidth: 660, maxWidth: 660 }

// Form Fields: Outline appearance
MAT_FORM_FIELD_DEFAULT_OPTIONS: { appearance: 'outline' }

// Paginator: Hide page size selector
MAT_PAGINATOR_DEFAULT_OPTIONS: { hidePageSize: true }
```

---

## Environment Configuration

**Type**: `app-config.ts` and `environment.ts`

Key config points:
- API root endpoint
- Animation enabled/disabled
- Feature flags
- Theme configuration

---

## Testing Patterns

### Services
```typescript
// Mock dependencies
const mockClusterService = jasmine.createSpyObj('ClusterService', ['create']);

// Provide in TestBed
TestBed.configureTestingModule({
  providers: [MyService, { provide: ClusterService, useValue: mockClusterService }]
});
```

### Components
```typescript
// Use DebugElement for DOM testing
const fixture = TestBed.createComponent(MyComponent);
const debugElement = fixture.debugElement;
const htmlElement = debugElement.nativeElement;

// Trigger change detection
fixture.detectChanges();
```

---

## Common Patterns

### ControlValueAccessor Template
```typescript
@Component({
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MyComponent),
    multi: true
  }]
})
export class MyComponent implements ControlValueAccessor {
  control = new FormControl();
  
  writeValue(value: any) {
    if (value) this.control.setValue(value, { emitEvent: false });
  }
  
  registerOnChange(fn: any) {
    this.control.valueChanges.subscribe(fn);
  }
  
  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }
}
```

### Service with Observable State
```typescript
@Injectable()
export class MyService {
  private _state = initialState;
  readonly changes$ = new BehaviorSubject(this._state);
  
  get state() { return this._state; }
  
  setState(value: any) {
    this._state = value;
    this.changes$.next(this._state);
  }
}
```

### Async Validator
```typescript
export const asyncValidator = (control: AbstractControl) => {
  return this.service.checkUniqueName(control.value).pipe(
    map(exists => exists ? { nameTaken: true } : null),
    catchError(() => of(null))
  );
};
```

---

## File Size Reference

| File | Size | Notes |
|------|------|-------|
| `node-data/component.ts` | ~30KB | Central node configuration component |
| `wizard/component.ts` | ~14KB | Wizard orchestrator |
| `core/services/cluster-spec.ts` | ~18KB | Cluster state management |
| `core/services/name-generator.ts` | ~32KB | Intelligent name generation |
| `shared/module.ts` | ~314 lines | 57+ components exported |

---

## Debugging Tips

1. **Check Form State**: 
   - Use `component.form.value` to inspect form data
   - Use `component.form.status` to check validity

2. **Track Service State**:
   - Add console.log in service methods
   - Subscribe to Observables to track changes

3. **Provider Selection**:
   - Check `ClusterSpecService.provider` property
   - Verify `WizardService.steps` visibility

4. **Node Data**:
   - Inspect `NodeDataService._nodeData`
   - Check `nodeDataChanges` subscription

---

## Related Documents

- `ARCHITECTURE_GUIDE.md` - Comprehensive architecture documentation
- `README.md` (in wizard/) - Wizard-specific documentation
- Backend API docs - For API endpoint details

---

## Key Contacts/Owners

See git blame for specific features:
```bash
git log --oneline modules/web/src/app/wizard/component.ts | head -10
git blame modules/web/src/app/core/services/node-data/service.ts
```

---

## Important Notes

1. **No State Management Library**: Uses service-based pattern instead of Redux/NgRx
2. **ControlValueAccessor Everywhere**: Reusable form components use this pattern
3. **18+ Providers**: Architecture designed to scale with new cloud providers
4. **Lazy-Loaded Modules**: All features lazy-loaded for performance
5. **Material Design**: Consistent UI using Angular Material
6. **Reactive Forms**: Forms are single source of truth for data

