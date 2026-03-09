---
type: reference
title: Phase 03 - Shared Components Testing Patterns & Guide
created: 2026-03-06
tags:
  - testing
  - shared-components
  - jest
  - angular
  - patterns
related:
  - '[[PHASE-03-TASK-5-SUMMARY]]'
  - '[[TEST-COVERAGE-ANALYSIS-REPORT]]'
---

# Shared Components Testing Patterns & Guide

## Document Overview

This guide documents comprehensive testing patterns discovered and implemented across 8 shared components during Phase 03 Task 5. The patterns serve as a reference for writing high-quality unit tests for shared Angular components in the Kubermatic Dashboard.

**Test Coverage Achieved**: 81 total test cases across 8 components (270% of 30+ target)

---

## Table of Contents

1. [Foundation Patterns](#foundation-patterns)
2. [Component Testing Patterns](#component-testing-patterns)
3. [Service & Dependency Patterns](#service--dependency-patterns)
4. [Form Testing Patterns](#form-testing-patterns)
5. [Material Component Patterns](#material-component-patterns)
6. [Observable & RxJS Patterns](#observable--rxjs-patterns)
7. [Test Organization & Structure](#test-organization--structure)
8. [Common Testing Scenarios](#common-testing-scenarios)
9. [Testing Checklist](#testing-checklist)
10. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## 1. Foundation Patterns

### 1.1 Apache License Header (Required in All Test Files)

Every test file must include a full 15-line Apache 2.0 license header:

```typescript
// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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
```

**Tool**: Use `npm run fix:license` to add/update headers (sets year to 2025)

### 1.2 Standard Import Organization

Organize imports in the following order:

```typescript
// 1. Angular core modules
import {ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ReactiveFormsModule, FormsModule} from '@angular/forms';

// 2. Angular Material
import {MatDialog, MatDialogRef} from '@angular/material/dialog';

// 3. Core services
import {AuthService} from '@core/services/auth';
import {UserService} from '@core/services/user';

// 4. Shared entities, models, modules
import {Cluster} from '@shared/entity/cluster';
import {SharedModule} from '@shared/module';

// 5. Test utilities and mocks
import {AuthMockService} from '@test/services/auth-mock';
import {of, Subject} from 'rxjs';

// 6. Component under test
import {AddonListComponent} from './component';
```

### 1.3 TestBed Configuration Pattern

Standard TestBed setup for most shared components:

```typescript
describe('ComponentNameComponent', () => {
  let fixture: ComponentFixture<ComponentNameComponent>;
  let component: ComponentNameComponent;
  let serviceUnderTest: jasmine.SpyObj<ServiceType>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        NoopAnimationsModule,
        SharedModule, // Contains Material modules and pipes
        // Add additional imports: ReactiveFormsModule, MatDialogModule, etc.
      ],
      providers: [
        // Mock services with spies
        {provide: ServiceType, useClass: ServiceMockService},
        {provide: MatDialog, useValue: matDialogMock},
      ],
      teardown: {destroyAfterEach: false}, // Important for perf
    }).compileComponents();

    // Inject services
    serviceUnderTest = TestBed.inject(ServiceType) as jasmine.SpyObj<ServiceType>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComponentNameComponent);
    component = fixture.componentInstance;
    // Set @Input properties before detectChanges()
    component.inputProperty = mockValue;
  });

  // Tests follow...
});
```

**Key Points**:
- Split TestBed setup and component initialization into separate `beforeEach` blocks
- Always include `teardown: {destroyAfterEach: false}` for performance
- Set @Input properties before calling `fixture.detectChanges()`
- Use SharedModule to avoid redundant module imports

### 1.4 Consistent Variable Naming

Follow these naming conventions:

```typescript
// Component instances
let fixture: ComponentFixture<ComponentType>;
let component: ComponentType;

// Service mocks
let serviceName: jasmine.SpyObj<ServiceType>;
let matDialog: jasmine.SpyObj<MatDialog>;

// Mock data
const mockObject: EntityType = {...};
const mockArray: EntityType[] = [...];

// Event/observable tracking
let changeEmitted: any;
let deleteCalled = false;
```

---

## 2. Component Testing Patterns

### 2.1 Component Initialization Testing

**Pattern**: Test component instantiation and basic state

```typescript
it('should initialize component', () => {
  fixture.detectChanges();
  expect(component).toBeTruthy();
});

it('should set default values on initialization', () => {
  fixture.detectChanges();
  expect(component.defaultProperty).toBe(expectedValue);
  expect(component.anotherProperty).toBeTruthy();
});
```

**Characteristics**:
- Call `fixture.detectChanges()` first to trigger ngOnInit
- Verify component exists with `.toBeTruthy()`
- Check default property values are set correctly
- Include 2-4 initialization tests minimum

### 2.2 @Input Property Binding Pattern

**Test Pattern**: Verify @Input properties are bound correctly

```typescript
it('should bind @Input property and update on change', () => {
  const mockData = {id: '123', name: 'test'};
  component.inputData = mockData;
  fixture.detectChanges();

  expect(component.inputData).toBe(mockData);
  expect(component.processedData).toEqual(expectedTransformation);
});

it('should handle null @Input values gracefully', () => {
  component.inputData = null;
  fixture.detectChanges();

  expect(component.displayText).toBe('No data');
  expect(component.form.valid).toBeFalsy();
});

it('should update component on @Input change', () => {
  component.inputData = initialData;
  fixture.detectChanges();

  component.inputData = changedData;
  fixture.detectChanges();

  expect(component.processedData).toBeDifferentFrom(initial);
});
```

**Key Points**:
- Test with valid data first
- Test with null/undefined values
- Test ngOnChanges behavior when input changes
- Verify derived properties update correctly

### 2.3 @Output Event Emission Pattern

**Test Pattern**: Verify @Output EventEmitters work correctly

```typescript
it('should emit @Output event when action occurs', (done: DoneFn) => {
  let emittedValue: any;

  component.actionComplete.subscribe(value => {
    emittedValue = value;
    expect(emittedValue).toEqual(expectedValue);
    done();
  });

  fixture.detectChanges();
  component.triggerAction();

  expect(emittedValue).toBeDefined();
});

it('should emit event with correct payload', () => {
  const emitSpy = spyOn(component.itemSelected, 'emit');
  const mockItem = {id: '1', name: 'Item'};

  component.selectItem(mockItem);

  expect(emitSpy).toHaveBeenCalledWith(mockItem);
});

it('should not emit event when action is invalid', () => {
  const emitSpy = spyOn(component.itemDeleted, 'emit');

  component.deleteItem(invalidItem);

  expect(emitSpy).not.toHaveBeenCalled();
});
```

**Key Points**:
- Use spy on EventEmitter to verify calls
- Test with valid and invalid data
- Verify correct payload is emitted
- Test that events are NOT emitted when conditions aren't met

### 2.4 Lifecycle Hook Testing Pattern

**Test Pattern**: Verify ngOnInit, ngOnChanges, ngOnDestroy

```typescript
it('should call ngOnInit and load data', () => {
  // Properties set before fixture.detectChanges()
  component.projectId = 'proj-123';

  // detectChanges triggers ngOnInit
  fixture.detectChanges();

  expect(component.dataLoaded).toBeTruthy();
  expect(serviceMock.loadData).toHaveBeenCalledWith('proj-123');
});

it('should handle ngOnChanges when input changes', () => {
  component.inputProp = 'value1';
  fixture.detectChanges();

  component.inputProp = 'value2';
  fixture.detectChanges(); // Triggers ngOnChanges

  expect(component.derivedValue).toBe('processed-value2');
});

it('should unsubscribe on ngOnDestroy', () => {
  const subscribeSpy = spyOn(component.subscription, 'unsubscribe');

  fixture.detectChanges();
  fixture.destroy(); // Triggers ngOnDestroy

  expect(subscribeSpy).toHaveBeenCalled();
});
```

**Key Points**:
- ngOnInit is triggered by first `fixture.detectChanges()`
- ngOnChanges is triggered by subsequent `fixture.detectChanges()` after property changes
- ngOnDestroy is triggered by `fixture.destroy()`
- Test subscription cleanup in ngOnDestroy

---

## 3. Service & Dependency Patterns

### 3.1 Service Mocking with jasmine.SpyObj

**Pattern**: Create mocks for all service dependencies

```typescript
beforeEach(() => {
  // Option 1: Mock service with properties
  const addonServiceSpy = jasmine.createSpyObj('AddonService', [], {
    accessibleAddons: of(['addon1', 'addon2']),
    addonConfigs: of([mockAddonConfig]),
  });

  // Option 2: Mock service with methods
  const projectServiceSpy = jasmine.createSpyObj('ProjectService', [
    'getProjectList',
    'createProject',
    'deleteProject',
  ]);

  // Option 3: Mock with both properties and methods
  const userServiceSpy = jasmine.createSpyObj(
    'UserService',
    ['loadUserSettings'],
    {
      user: of(mockUser),
      isAdmin: true,
    }
  );

  TestBed.configureTestingModule({
    providers: [
      {provide: AddonService, useValue: addonServiceSpy},
      {provide: ProjectService, useValue: projectServiceSpy},
      {provide: UserService, useValue: userServiceSpy},
    ],
  }).compileComponents();

  addonService = TestBed.inject(AddonService) as jasmine.SpyObj<AddonService>;
  projectService = TestBed.inject(ProjectService) as jasmine.SpyObj<ProjectService>;
  userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
});
```

**Key Points**:
- Use `jasmine.createSpyObj()` for all service mocks
- First argument: service name (for debugging)
- Second argument: array of method names
- Third argument (optional): object of property definitions
- Return Observables using `of()` for properties
- Type-cast injected mocks with `as jasmine.SpyObj<ServiceType>`

### 3.2 Service Method Call Verification

**Pattern**: Verify service methods are called correctly

```typescript
it('should call service method with correct parameters', () => {
  const mockCluster = {id: 'test', name: 'My Cluster'};
  component.cluster = mockCluster;
  fixture.detectChanges();

  component.saveCluster();

  expect(clusterServiceMock.updateCluster).toHaveBeenCalledWith(mockCluster);
});

it('should not call service when validation fails', () => {
  component.form.patchValue({requiredField: null});
  fixture.detectChanges();

  component.save();

  expect(serviceMock.save).not.toHaveBeenCalled();
});

it('should call service method only once', () => {
  component.quickSave();
  component.quickSave();

  expect(serviceMock.save).toHaveBeenCalledTimes(1);
});
```

**Key Points**:
- Use `toHaveBeenCalled()` to verify method was called
- Use `toHaveBeenCalledWith(args)` to verify parameters
- Use `toHaveBeenCalledTimes(n)` to verify call count
- Use `not.toHaveBeenCalled()` to verify method wasn't called

### 3.3 Observable Return Value Pattern

**Pattern**: Mock Observable-returning service methods

```typescript
beforeEach(() => {
  const clusterServiceSpy = jasmine.createSpyObj('ClusterService', [
    'loadClusters',
    'getClusterHealth',
  ]);

  // Mock method returning Observable
  clusterServiceSpy.loadClusters.and.returnValue(
    of({clusters: [mockCluster1, mockCluster2]})
  );

  clusterServiceSpy.getClusterHealth.and.returnValue(
    of({status: 'healthy', message: 'All systems nominal'})
  );

  TestBed.configureTestingModule({
    providers: [{provide: ClusterService, useValue: clusterServiceSpy}],
  }).compileComponents();

  clusterService = TestBed.inject(ClusterService) as jasmine.SpyObj<ClusterService>;
});

it('should handle Observable response from service', (done: DoneFn) => {
  component.loadClusters();
  fixture.detectChanges();

  clusterService.loadClusters().subscribe(response => {
    expect(response.clusters.length).toBe(2);
    expect(response.clusters[0]).toBe(mockCluster1);
    done();
  });
});
```

**Key Points**:
- Use `.and.returnValue(of(...))` for Observable return values
- Use `done: DoneFn` callback for async observable assertions
- Call `done()` when assertion completes
- Alternative: Use `fakeAsync` and `tick` for timing control

---

## 4. Form Testing Patterns

### 4.1 Form Initialization Testing

**Pattern**: Test FormGroup creation and initial values

```typescript
it('should create form with all controls', () => {
  fixture.detectChanges();

  expect(component.form).toBeTruthy();
  expect(component.form.get('firstName')).toBeTruthy();
  expect(component.form.get('email')).toBeTruthy();
  expect(component.form.get('enabled')).toBeTruthy();
});

it('should initialize form with provided values', () => {
  component.userData = {
    firstName: 'John',
    email: 'john@example.com',
    enabled: true,
  };
  fixture.detectChanges();

  expect(component.form.get('firstName').value).toBe('John');
  expect(component.form.get('email').value).toBe('john@example.com');
  expect(component.form.get('enabled').value).toBe(true);
});

it('should initialize form with default values when data is null', () => {
  component.userData = null;
  fixture.detectChanges();

  expect(component.form.get('firstName').value).toBe('');
  expect(component.form.get('enabled').value).toBe(false);
});
```

**Key Points**:
- Test form existence and control existence
- Test initial values match input data
- Test default values when input is null
- Use `form.get('controlName').value` to access current value

### 4.2 Form Validation Testing

**Pattern**: Test form validation rules and states

```typescript
it('should validate email format', () => {
  const emailControl = component.form.get('email');

  emailControl.setValue('invalid-email');
  expect(emailControl.valid).toBeFalsy();
  expect(emailControl.hasError('email')).toBeTruthy();

  emailControl.setValue('valid@example.com');
  expect(emailControl.valid).toBeTruthy();
  expect(emailControl.hasError('email')).toBeFalsy();
});

it('should mark form as invalid when required field is empty', () => {
  component.form.get('firstName').setValue('');

  expect(component.form.valid).toBeFalsy();
  expect(component.form.hasError('required')).toBeTruthy();
});

it('should mark form as valid when all validations pass', () => {
  component.form.patchValue({
    firstName: 'John',
    email: 'john@example.com',
    enabled: true,
  });

  expect(component.form.valid).toBeTruthy();
});
```

**Key Points**:
- Test individual control validation
- Test form-level validation
- Use `.hasError('errorType')` to check specific errors
- Test both valid and invalid states
- Use `patchValue()` for partial updates, `setValue()` for complete updates

### 4.3 Form Value Changes Testing

**Pattern**: Test form control value changes and debouncing

```typescript
it('should detect form value changes', (done: DoneFn) => {
  let valueChanged = false;

  component.form.valueChanges.subscribe(value => {
    if (value.searchTerm === 'kubernetes') {
      valueChanged = true;
    }
  });

  fixture.detectChanges();
  component.form.get('searchTerm').setValue('kubernetes');

  expect(valueChanged).toBeTruthy();
  done();
});

it('should debounce input changes by 300ms', fakeAsync(() => {
  let emitCount = 0;
  component.filterChanged.subscribe(() => emitCount++);

  fixture.detectChanges();
  component.form.get('filter').setValue('kubernetes');

  tick(150); // Less than debounce time
  expect(emitCount).toBe(0);

  tick(200); // Now exceeds 300ms total
  expect(emitCount).toBe(1);
}));
```

**Key Points**:
- Subscribe to `form.valueChanges` Observable
- Use `fakeAsync` and `tick` for debounce testing
- Test that events emit after debounce period
- Test that events don't emit before debounce period

### 4.4 Form Control Enable/Disable Pattern

**Pattern**: Test dynamic form control state changes

```typescript
it('should enable/disable controls based on conditions', () => {
  const advancedOptionsControl = component.form.get('advancedOptions');

  component.showAdvanced = false;
  fixture.detectChanges();
  expect(advancedOptionsControl.disabled).toBeTruthy();

  component.showAdvanced = true;
  fixture.detectChanges();
  expect(advancedOptionsControl.enabled).toBeTruthy();
});

it('should conditionally require field based on another control', () => {
  const cpuControl = component.form.get('cpu');
  const memoryControl = component.form.get('memory');

  cpuControl.setValue(null);
  fixture.detectChanges();
  expect(memoryControl.hasError('required')).toBeTruthy();

  cpuControl.setValue(2);
  fixture.detectChanges();
  expect(memoryControl.hasError('required')).toBeFalsy();
});
```

**Key Points**:
- Test `control.disabled` and `control.enabled` properties
- Test conditional validators
- Test cross-field validation
- Verify control state after property changes

---

## 5. Material Component Patterns

### 5.1 MatDialog Mocking Pattern

**Pattern**: Mock MatDialog for dialog components

```typescript
beforeEach(() => {
  // Create dialog ref mock
  const dialogRefMock = jasmine.createSpyObj('MatDialogRef', ['close', 'afterClosed']);
  dialogRefMock.afterClosed.and.returnValue(of({action: 'confirmed', data: mockData}));

  // Create dialog mock
  const matDialogMock = jasmine.createSpyObj('MatDialog', ['open']);
  matDialogMock.open.and.returnValue(dialogRefMock);

  TestBed.configureTestingModule({
    providers: [
      {provide: MatDialog, useValue: matDialogMock},
    ],
  }).compileComponents();

  matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
});

it('should open dialog with correct configuration', () => {
  fixture.detectChanges();
  component.openEditDialog(mockCluster);

  expect(matDialog.open).toHaveBeenCalledWith(
    EditDialogComponent,
    jasmine.objectContaining({
      data: {cluster: mockCluster, mode: 'edit'},
      width: '600px',
    })
  );
});

it('should handle dialog result when user confirms', (done: DoneFn) => {
  fixture.detectChanges();
  component.openDeleteDialog(mockItem);

  matDialog.open().afterClosed().subscribe(result => {
    expect(result.action).toBe('confirmed');
    expect(component.itemDeleted).toBeTruthy();
    done();
  });
});
```

**Key Points**:
- Create mock for `MatDialogRef` with `close()` and `afterClosed()` methods
- Mock `MatDialog.open()` to return the ref mock
- Verify dialog is opened with correct component and config
- Test dialog result handling in `afterClosed()` subscription
- Use `jasmine.objectContaining()` for partial object matching

### 5.2 MatTable with DataSource Pattern

**Pattern**: Test MatTable initialization and data binding

```typescript
it('should initialize table with DataSource', () => {
  fixture.detectChanges();

  expect(component.dataSource).toBeTruthy();
  expect(component.dataSource.data).toEqual(mockData);
});

it('should configure table sort', () => {
  fixture.detectChanges();

  expect(component.sort).toBeTruthy();
  expect(component.dataSource.sort).toBe(component.sort);
});

it('should configure table paginator', () => {
  fixture.detectChanges();

  expect(component.paginator).toBeTruthy();
  expect(component.dataSource.paginator).toBe(component.paginator);
});

it('should display correct columns in correct order', () => {
  fixture.detectChanges();

  expect(component.displayedColumns).toEqual([
    'select',
    'name',
    'status',
    'createdAt',
    'actions',
  ]);
});
```

**Key Points**:
- Test DataSource is initialized and bound to data
- Test sort and paginator are configured
- Test displayed columns list is correct
- Test sort active and direction settings

---

## 6. Observable & RxJS Patterns

### 6.1 Observable Subscription Testing

**Pattern**: Test components that subscribe to Observables

```typescript
it('should subscribe to service Observable on init', (done: DoneFn) => {
  const mockCluster = {id: '123', name: 'test'};
  clusterServiceMock.getCluster.and.returnValue(of(mockCluster));

  fixture.detectChanges();

  expect(component.cluster).toEqual(mockCluster);
  done();
});

it('should unsubscribe on component destroy', () => {
  const subscription = component.subscription;
  const unsubscribeSpy = spyOn(subscription, 'unsubscribe');

  fixture.destroy();

  expect(unsubscribeSpy).toHaveBeenCalled();
});

it('should handle Observable error gracefully', (done: DoneFn) => {
  const error = new Error('Service unavailable');
  serviceMock.loadData.and.returnValue(
    throwError(() => error)
  );

  fixture.detectChanges();

  setTimeout(() => {
    expect(component.errorMessage).toBe('Service unavailable');
    expect(component.loading).toBeFalsy();
    done();
  }, 0);
});
```

**Key Points**:
- Use `of()` for successful Observable mocks
- Use `throwError()` for error scenarios
- Test error handling and user feedback
- Verify subscriptions are cleaned up on destroy
- Use `done()` callback for async assertions

### 6.2 Subject and Event Stream Testing

**Pattern**: Test components that use Subjects for state management

```typescript
it('should react to Subject emissions', (done: DoneFn) => {
  const dataSubject = new Subject<DataType>();

  dataSubject.subscribe(data => {
    expect(data.value).toBe('test');
    done();
  });

  dataSubject.next({value: 'test'});
});

it('should emit events when component state changes', () => {
  let emittedValue: ClusterEvent;

  component.clusterUpdated.subscribe(event => {
    emittedValue = event;
  });

  component.updateCluster({name: 'new-name'});

  expect(emittedValue).toBeTruthy();
  expect(emittedValue.action).toBe('updated');
});
```

**Key Points**:
- Create Subject instances for manual event control
- Use `.next()` to emit values
- Subscribe to Subjects to verify emissions
- Test Subject completion with `.complete()`

### 6.3 RxJS Operator Testing

**Pattern**: Test components using RxJS operators

```typescript
it('should debounce search input by 500ms', fakeAsync(() => {
  const results: string[] = [];

  component.searchResults$.subscribe(result => {
    results.push(result);
  });

  component.searchTerm.next('test');
  tick(300);
  component.searchTerm.next('test2');
  tick(250);
  expect(results.length).toBe(0); // Not yet emitted

  tick(250); // Now 500ms after last value
  expect(results.length).toBe(1);
}));

it('should switch map to latest observable', fakeAsync(() => {
  let projectId = 'proj-1';
  serviceMock.loadProject.and.callFake((id) =>
    of({id, data: `data-${id}`})
  );

  component.selectProject(projectId);
  tick();

  expect(component.projectData.data).toBe('data-proj-1');

  component.selectProject('proj-2'); // New request cancels previous
  tick();

  expect(component.projectData.data).toBe('data-proj-2');
}));
```

**Key Points**:
- Use `fakeAsync` and `tick` for operator timing
- Test debounce, throttle, and switchMap behavior
- Verify operators combine observables correctly
- Test operator cancellation/switching

---

## 7. Test Organization & Structure

### 7.1 Describe Block Hierarchy

**Pattern**: Organize tests into logical groups

```typescript
describe('AddonListComponent', () => {
  // Setup and teardown...

  describe('Component Initialization', () => {
    it('should initialize component', () => { /* ... */ });
    it('should load addon configs on init', () => { /* ... */ });
  });

  describe('@Input Binding', () => {
    it('should bind cluster input property', () => { /* ... */ });
    it('should update when cluster input changes', () => { /* ... */ });
  });

  describe('canAdd() Method', () => {
    it('should return true when cluster is ready and user has permission', () => { /* ... */ });
    it('should return false when cluster is not ready', () => { /* ... */ });
  });

  describe('@Output Events', () => {
    it('should emit addonInstalled event', () => { /* ... */ });
    it('should emit addonDeleted event', () => { /* ... */ });
  });

  describe('Dialog Integration', () => {
    it('should open install dialog', () => { /* ... */ });
    it('should handle dialog result', () => { /* ... */ });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on destroy', () => { /* ... */ });
  });
});
```

**Key Points**:
- Group related tests in nested `describe` blocks
- Use descriptive names that explain what's being tested
- Keep 3-6 tests per describe block for readability
- Order tests logically (init → inputs → methods → outputs → cleanup)

### 7.2 Mock Data Organization

**Pattern**: Organize mock data at the top of test file

```typescript
describe('ClusterSummaryComponent', () => {
  let fixture: ComponentFixture<ClusterSummaryComponent>;
  let component: ClusterSummaryComponent;

  // Mock data factories - at top of describe block
  const mockCluster: Cluster = {
    id: 'cluster-1',
    name: 'production-cluster',
    spec: {
      cloud: {aws: {vpcId: 'vpc-123'}},
      admissionPlugins: ['PodPreset'],
    },
  } as Cluster;

  const mockMachineDeployment: MachineDeployment = {
    name: 'node-pool-1',
    spec: {
      template: {operatingSystem: 'ubuntu'},
    },
  } as MachineDeployment;

  const mockDatacenter: Datacenter = {
    metadata: {name: 'dc-1'},
    spec: {provider: 'aws'},
  } as Datacenter;

  // TestBed and component initialization...
});
```

**Key Points**:
- Define all mock data before TestBed configuration
- Use const for immutable test data
- Create multiple variations for different test scenarios
- Use descriptive names that indicate the data's purpose

### 7.3 Test Naming Convention

**Pattern**: Use descriptive test names that explain behavior

```typescript
// ❌ Bad - unclear what's being tested
it('works', () => { /* ... */ });
it('test addon', () => { /* ... */ });

// ✅ Good - explains the behavior and conditions
it('should return true when cluster is ready and user has permission', () => { /* ... */ });
it('should emit itemDeleted event with correct payload', () => { /* ... */ });
it('should disable save button when form has validation errors', () => { /* ... */ });
it('should handle observable error by displaying error message', () => { /* ... */ });
```

**Test Naming Formula**: `should [action] when [condition]` or `should [behavior]`

---

## 8. Common Testing Scenarios

### 8.1 Testing Conditional Rendering

**Pattern**: Test components that conditionally render content

```typescript
it('should show loading state while data is being fetched', () => {
  component.loading = true;
  fixture.detectChanges();

  const spinner = fixture.debugElement.query(
    By.directive(MatSpinner)
  );
  expect(spinner).toBeTruthy();
});

it('should show error message when data loading fails', () => {
  component.error = 'Failed to load clusters';
  fixture.detectChanges();

  const errorElement = fixture.debugElement.query(
    By.css('[data-cy="error-message"]')
  );
  expect(errorElement.nativeElement.textContent).toContain('Failed to load');
});

it('should show data when loading completes', () => {
  component.clusters = [mockCluster1, mockCluster2];
  component.loading = false;
  fixture.detectChanges();

  const rows = fixture.debugElement.queryAll(By.css('mat-table tbody tr'));
  expect(rows.length).toBe(2);
});
```

**Key Points**:
- Use `fixture.debugElement.query()` to find elements
- Test all conditional branches (loading, error, success)
- Use `[data-cy="..."]` attributes for element selection
- Verify correct content is displayed for each state

### 8.2 Testing User Interactions

**Pattern**: Test click events, input changes, and form submissions

```typescript
it('should call delete method when delete button is clicked', () => {
  const deleteButton = fixture.debugElement.query(
    By.css('[data-cy="delete-btn"]')
  );
  spyOn(component, 'deleteItem');

  deleteButton.nativeElement.click();

  expect(component.deleteItem).toHaveBeenCalled();
});

it('should emit value when input changes', () => {
  const inputElement = fixture.debugElement.query(
    By.css('input[type="text"]')
  ).nativeElement;
  spyOn(component.valueChanged, 'emit');

  inputElement.value = 'new value';
  inputElement.dispatchEvent(new Event('input'));
  fixture.detectChanges();

  expect(component.valueChanged.emit).toHaveBeenCalledWith('new value');
});

it('should submit form when submit button is clicked', () => {
  spyOn(component, 'onSubmit');
  const form = fixture.debugElement.query(By.css('form'));

  form.nativeElement.dispatchEvent(new Event('submit'));

  expect(component.onSubmit).toHaveBeenCalled();
});
```

**Key Points**:
- Use `.nativeElement.click()` to simulate clicks
- Create events with `new Event()` for input changes
- Use `dispatchEvent()` to trigger events
- Verify event handlers are called with correct parameters

### 8.3 Testing Empty States

**Pattern**: Test components with no data

```typescript
it('should display empty state message when list is empty', () => {
  component.items = [];
  fixture.detectChanges();

  const emptyMessage = fixture.debugElement.query(
    By.css('[data-cy="empty-state"]')
  );
  expect(emptyMessage).toBeTruthy();
  expect(emptyMessage.nativeElement.textContent).toContain('No items');
});

it('should hide empty state when items are loaded', () => {
  component.items = [mockItem1, mockItem2];
  fixture.detectChanges();

  const emptyMessage = fixture.debugElement.query(
    By.css('[data-cy="empty-state"]')
  );
  expect(emptyMessage).toBeFalsy();
});
```

**Key Points**:
- Test empty list display
- Test that empty state is hidden when data exists
- Test alternative text/messaging for empty states

### 8.4 Testing Async Operations

**Pattern**: Test components with async/await and Promises

```typescript
it('should handle async data loading with fakeAsync', fakeAsync(() => {
  let result: ClusterData;

  component.loadCluster('cluster-1');
  expect(component.loading).toBeTruthy();

  tick(1000); // Simulate async delay

  expect(component.loading).toBeFalsy();
  expect(component.cluster).toBeTruthy();
}));

it('should handle Promise resolution', async () => {
  const data = await component.loadDataAsync();

  expect(data.clusters.length).toBeGreaterThan(0);
});

it('should handle async error with catchError', fakeAsync(() => {
  serviceMock.loadData.and.returnValue(
    throwError(() => new Error('Network error'))
  );

  component.loadData();
  tick();

  expect(component.errorMessage).toBe('Network error');
}));
```

**Key Points**:
- Use `fakeAsync` and `tick` for Observable timing
- Use `async` for Promise-based testing
- Test error scenarios with `throwError`
- Verify loading states and error handling

---

## 9. Testing Checklist

Use this checklist for shared component testing:

### Pre-Test Checklist
- [ ] Create `.spec.ts` file in same directory as component
- [ ] Add Apache 2.0 license header (15 lines)
- [ ] Import required testing modules and utilities
- [ ] Define mock data objects at top of describe block
- [ ] Configure TestBed with all dependencies
- [ ] Create fixture and component in separate beforeEach blocks

### Initialization Tests
- [ ] Test component instantiation with `.toBeTruthy()`
- [ ] Test default property values are set
- [ ] Test required services are injected
- [ ] Test initial form state (if applicable)

### Input/Output Tests
- [ ] Test each @Input property binding
- [ ] Test @Input with null/undefined values
- [ ] Test @Input change detection (ngOnChanges)
- [ ] Test each @Output event emission
- [ ] Test event payload correctness
- [ ] Test events NOT emitted when conditions aren't met

### Method Tests
- [ ] Test public method behavior
- [ ] Test method with valid parameters
- [ ] Test method with invalid parameters
- [ ] Test method return values and side effects
- [ ] Test permission/validation before action

### Form Tests (if applicable)
- [ ] Test form creation and controls exist
- [ ] Test form initialization with data
- [ ] Test form with null data
- [ ] Test form validation rules
- [ ] Test form value changes
- [ ] Test form submission

### Service Integration Tests
- [ ] Test service method calls are correct
- [ ] Test service parameters are passed correctly
- [ ] Test handling of service responses
- [ ] Test error handling from services
- [ ] Mock all service dependencies

### Material Component Tests
- [ ] Test Material components are initialized
- [ ] Test DataSource/Sort/Paginator configuration
- [ ] Test dialog opens with correct config
- [ ] Test dialog result handling

### Cleanup Tests
- [ ] Test subscriptions are cleaned up on destroy
- [ ] Test memory leaks are prevented
- [ ] Test ViewChild references are unset

### Edge Cases
- [ ] Test with empty/null data
- [ ] Test with boundary values
- [ ] Test with special characters
- [ ] Test with large datasets
- [ ] Test rapid repeated actions

### Code Coverage
- [ ] Aim for 80%+ line coverage
- [ ] Cover all conditional branches
- [ ] Cover error paths
- [ ] Cover edge cases
- [ ] Aim for 100% coverage of public methods

---

## 10. Anti-Patterns to Avoid

### ❌ Don't: Test Implementation Details

```typescript
// Bad: Testing internal state
it('should set private _isLoading to true', () => {
  component['_isLoading'] = true;
  expect(component['_isLoading']).toBeTruthy();
});

// Good: Test observable behavior
it('should show loading spinner', () => {
  component.isLoading$.subscribe(loading => {
    expect(loading).toBeTruthy();
  });
});
```

### ❌ Don't: Use Hard Waits/Sleeps

```typescript
// Bad: Unpredictable timing
it('should load data', (done) => {
  component.loadData();
  setTimeout(() => {
    expect(component.data).toBeTruthy();
    done();
  }, 2000); // Arbitrary wait time
});

// Good: Use fakeAsync and tick
it('should load data', fakeAsync(() => {
  component.loadData();
  tick(100); // Explicit timing
  expect(component.data).toBeTruthy();
}));
```

### ❌ Don't: Create Real HTTP Requests

```typescript
// Bad: Real HTTP in tests
it('should fetch cluster', () => {
  const http = TestBed.inject(HttpClient);
  http.get('/api/clusters').subscribe(data => {
    expect(data).toBeTruthy();
  });
});

// Good: Mock service
it('should fetch cluster', (done: DoneFn) => {
  clusterService.get.and.returnValue(of(mockCluster));
  component.loadCluster();
  clusterService.get().subscribe(cluster => {
    expect(cluster).toEqual(mockCluster);
    done();
  });
});
```

### ❌ Don't: Test Children Components

```typescript
// Bad: Too tightly coupled
it('should render list items', () => {
  const listItems = fixture.debugElement.queryAll(By.directive(ListItemComponent));
  expect(listItems.length).toBe(5);
});

// Good: Test parent's responsibility
it('should pass items to list', () => {
  component.items = [item1, item2, item3];
  fixture.detectChanges();
  expect(component.items.length).toBe(3);
});
```

### ❌ Don't: Create Overly Complex Tests

```typescript
// Bad: Multiple concerns in one test
it('should do everything', () => {
  component.initialize();
  fixture.detectChanges();
  component.loadData();
  tick(100);
  component.saveData();
  expect(serviceMock.save).toHaveBeenCalled();
  expect(component.saved).toBeTruthy();
  expect(component.loading).toBeFalsy();
});

// Good: One concern per test
it('should load data when component initializes', () => {
  fixture.detectChanges();
  expect(serviceMock.loadData).toHaveBeenCalled();
});

it('should set saved flag after save completes', fakeAsync(() => {
  component.saveData();
  tick();
  expect(component.saved).toBeTruthy();
}));
```

### ❌ Don't: Share Test State Between Tests

```typescript
// Bad: Tests depend on previous state
let sharedData;

it('test 1', () => {
  sharedData = {id: '123'};
  // Test uses sharedData
});

it('test 2', () => {
  // Relies on sharedData from test 1
  expect(sharedData.id).toBe('123');
});

// Good: Each test is independent
it('test 1', () => {
  const data = {id: '123'};
  expect(data.id).toBe('123');
});

it('test 2', () => {
  const data = {id: '456'};
  expect(data.id).toBe('456');
});
```

### ❌ Don't: Suppress Errors with expect().not

```typescript
// Bad: Hiding problems
it('should work', () => {
  expect(component).toBeTruthy(); // Too vague
  expect(component.data).toBeTruthy(); // Masks null/undefined
});

// Good: Specific expectations
it('should initialize with empty data array', () => {
  expect(component.data).toEqual([]);
});

it('should load data from service', () => {
  expect(component.data).toEqual(mockData);
  expect(component.data.length).toBe(3);
});
```

---

## Summary Table: Testing Pattern Quick Reference

| Pattern | Use Case | Key Method | Example |
|---------|----------|-----------|---------|
| **Initialization** | Component setup | `fixture.detectChanges()` | Test ngOnInit |
| **@Input Binding** | Property binding | `component.property = value` | Test input reactivity |
| **@Output Events** | Event emission | `spyOn(component.output, 'emit')` | Verify event fired |
| **Form Testing** | Reactive forms | `component.form.get('control')` | Test validation |
| **Service Mocking** | Dependency injection | `jasmine.createSpyObj()` | Mock HTTP calls |
| **Observable Testing** | Async operations | `of()` / `throwError()` | Test subscriptions |
| **Dialog Testing** | Material dialog | `matDialog.open()` | Test dialog result |
| **Conditional Render** | DOM testing | `fixture.debugElement.query()` | Test visibility |
| **User Interaction** | Click/input events | `.nativeElement.click()` | Test handlers |
| **Async Timing** | RxJS operators | `fakeAsync()` / `tick()` | Test debounce |
| **Empty States** | Edge cases | Array length checks | Test no data |
| **Cleanup** | Lifecycle | `ngOnDestroy` | Unsubscribe test |

---

## Related Documentation

- **Phase 03 Task 5 Summary**: [[PHASE-03-TASK-5-SUMMARY]] - Test implementation details and statistics
- **Test Coverage Analysis**: [[TEST-COVERAGE-ANALYSIS-REPORT]] - Coverage gaps and next steps
- **Project CLAUDE.md**: Architecture patterns and development workflow
- **Jest Configuration**: `jest.config.cjs` and `src/test.base.ts`

---

**Last Updated**: 2026-03-06
**Phase**: 03 Task 7
**Status**: Complete
**Audience**: Developers writing unit tests for shared components
