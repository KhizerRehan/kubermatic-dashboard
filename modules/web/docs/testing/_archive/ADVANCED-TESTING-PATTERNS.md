<!-- Copyright 2020 The Kubermatic Kubernetes Platform contributors. -->

# Advanced Testing Patterns & Utilities Guide

A comprehensive guide to advanced testing patterns and utilities available in the Kubermatic Dashboard test suite, with before/after examples showing code improvements.

## Table of Contents

1. [Overview](#overview)
2. [Observable Mock Builder Patterns](#observable-mock-builder-patterns)
3. [Reactive Form Testing Helpers](#reactive-form-testing-helpers)
4. [Change Detection Testing](#change-detection-testing)
5. [HTTP Mock Interception](#http-mock-interception)
6. [Testing Async/Await and Promises](#testing-asyncawait-and-promises)
7. [Testing Error Scenarios](#testing-error-scenarios)
8. [TestBed Configuration Helpers](#testbed-configuration-helpers)
9. [Fixture Helper Patterns](#fixture-helper-patterns)
10. [Advanced Integration Examples](#advanced-integration-examples)

## Overview

The Kubermatic Dashboard testing infrastructure provides advanced utilities that reduce boilerplate, improve code clarity, and enable testing of complex scenarios:

- **MockObservableBuilder** - Create observables with different emission patterns
- **FormBuilderHelper** - Simplify reactive form testing
- **ChangeDetectionHelper** - Test OnPush strategy and component reactivity
- **HttpMockBuilder** - Simplify HTTP request mocking
- **TestBedSetup** - Reduce TestBed configuration boilerplate
- **FixtureHelper** - Simplify fixture DOM operations

---

## Observable Mock Builder Patterns

### Problem: Verbose Observable Mocking

**Before (Manual Observable Creation):**

```typescript
// Creates duplicate code across many tests
it('should load data successfully', fakeAsync(() => {
  const mockData = fakeProject();
  spyOn(projectService, 'projects', 'get').and.returnValue(
    of(mockData).pipe(
      delay(100),
      shareReplay(1)
    )
  );

  component.loadProjects();
  fixture.detectChanges();
  tick(100);

  expect(component.projects).toEqual(mockData);
}));

// Testing errors requires throwError calls
it('should handle load errors', fakeAsync(() => {
  spyOn(projectService, 'projects', 'get').and.returnValue(
    throwError(() => new HttpErrorResponse({status: 500}))
  );

  component.loadProjects();
  fixture.detectChanges();
  tick();

  expect(component.errorMessage).toBeTruthy();
}));

// Testing timeouts requires NEVER observables
it('should timeout on slow API', fakeAsync(() => {
  spyOn(projectService, 'projects', 'get').and.returnValue(
    NEVER
  );

  component.loadProjects();
  fixture.detectChanges();
  tick(5000);

  expect(component.timedOut).toBe(true);
}));
```

**After (Using MockObservableBuilder):**

```typescript
import {MockObservableBuilder} from '@test/utils';

it('should load data successfully', fakeAsync(() => {
  const mockData = fakeProject();
  spyOn(projectService, 'projects', 'get').and.returnValue(
    MockObservableBuilder.success(mockData)
  );

  component.loadProjects();
  fixture.detectChanges();
  tick();

  expect(component.projects).toEqual(mockData);
}));

it('should handle load errors', fakeAsync(() => {
  const error = new Error('API Error');
  spyOn(projectService, 'projects', 'get').and.returnValue(
    MockObservableBuilder.error(error)
  );

  component.loadProjects();
  fixture.detectChanges();
  tick();

  expect(component.errorMessage).toBeTruthy();
}));

it('should timeout on slow API', fakeAsync(() => {
  spyOn(projectService, 'projects', 'get').and.returnValue(
    MockObservableBuilder.timeout()
  );

  component.loadProjects();
  fixture.detectChanges();
  tick(5000);

  expect(component.timedOut).toBe(true);
}));
```

### MockObservableBuilder API

**Location:** `src/test/utils/mock-observable-builder.ts`

**Available Methods:**

```typescript
class MockObservableBuilder {
  // Create observable that emits data then completes
  static success<T>(data: T, delayMs?: number): Observable<T>

  // Create observable that emits error
  static error<T>(error: Error | string, delayMs?: number): Observable<T>

  // Create observable that never emits (for timeout testing)
  static timeout<T>(): Observable<T>

  // Create manual Subject for test control
  static createSubject<T>(): Subject<T>

  // Emit array items sequentially
  static successArray<T>(items: T[], delayMs?: number): Observable<T[]>
}
```

### Common Observable Patterns

**Pattern: Testing Subscription Cleanup**

```typescript
it('should unsubscribe on destroy', () => {
  const subject = MockObservableBuilder.createSubject<Project[]>();
  spyOn(projectService, 'projects', 'get').and.returnValue(subject);

  component.ngOnInit();
  expect(fixture.componentInstance.subscription).toBeTruthy();

  component.ngOnDestroy();
  expect(fixture.componentInstance.subscription.closed).toBe(true);
});
```

**Pattern: Testing RxJS Operators**

```typescript
it('should filter projects by status', fakeAsync(() => {
  const projects = [
    fakeProject({status: 'Active'}),
    fakeProject({status: 'Inactive'}),
  ];

  spyOn(projectService, 'projects', 'get').and.returnValue(
    MockObservableBuilder.successArray(projects, 50)
  );

  component.loadProjects();
  fixture.detectChanges();
  tick(50);

  expect(component.activeProjects.length).toBe(1);
  expect(component.activeProjects[0].status).toBe('Active');
}));
```

**Pattern: Testing Observable Chains**

```typescript
it('should chain multiple observables', fakeAsync(() => {
  const projectData = fakeProject();
  const clusterData = fakeCluster();

  spyOn(projectService, 'get').and.returnValue(
    MockObservableBuilder.success(projectData, 100)
  );
  spyOn(clusterService, 'list').and.returnValue(
    MockObservableBuilder.success([clusterData], 100)
  );

  component.loadProjectAndClusters();
  fixture.detectChanges();
  tick(200);

  expect(component.project).toEqual(projectData);
  expect(component.clusters).toEqual([clusterData]);
}));
```

---

## Reactive Form Testing Helpers

### Problem: Verbose Form Control Manipulation

**Before (Manual FormBuilder Setup):**

```typescript
it('should validate project name', () => {
  const form = new FormGroup({
    projectName: new FormControl('', [Validators.required, Validators.minLength(3)]),
    description: new FormControl('', []),
    labels: new FormControl([], [])
  });

  const control = form.get('projectName');
  control?.setValue('');
  control?.markAsTouched();
  fixture.detectChanges();

  expect(control?.hasError('required')).toBe(true);
  expect(fixture.nativeElement.querySelector('.error-message')).toBeTruthy();

  control?.setValue('valid-project-name');
  fixture.detectChanges();

  expect(control?.hasError('required')).toBe(false);
  expect(control?.valid).toBe(true);
});

// Repetitive setter patterns for multiple controls
it('should validate cluster configuration', () => {
  const form = new FormGroup({
    clusterName: new FormControl('', Validators.required),
    kubernetesVersion: new FormControl('', Validators.required),
    machineCount: new FormControl(3, [Validators.required, Validators.min(1)]),
    enableNetworkPolicy: new FormControl(false, [])
  });

  form.get('clusterName')?.setValue('test-cluster');
  form.get('clusterName')?.markAsTouched();
  form.get('kubernetesVersion')?.setValue('1.28.0');
  form.get('machineCount')?.setValue(5);
  // ... lots of repetitive code
});
```

**After (Using FormBuilderHelper):**

```typescript
import {FormBuilderHelper} from '@test/utils';

it('should validate project name', () => {
  const form = FormBuilderHelper.createFormWithValidation({
    projectName: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    labels: [[]]
  });

  FormBuilderHelper.setControlValue(form, 'projectName', '');
  FormBuilderHelper.markAsTouched(form);
  fixture.detectChanges();

  expect(FormBuilderHelper.getControlValue(form, 'projectName')).toBe('');
  expect(form.get('projectName')?.hasError('required')).toBe(true);

  FormBuilderHelper.setControlValue(form, 'projectName', 'valid-project-name');
  fixture.detectChanges();

  expect(form.get('projectName')?.valid).toBe(true);
});

it('should validate cluster configuration', () => {
  const form = FormBuilderHelper.createFormWithValidation({
    clusterName: ['', Validators.required],
    kubernetesVersion: ['', Validators.required],
    machineCount: [3, [Validators.required, Validators.min(1)]],
    enableNetworkPolicy: [false]
  });

  FormBuilderHelper.setInputAndDetect({
    form,
    values: {
      clusterName: 'test-cluster',
      kubernetesVersion: '1.28.0',
      machineCount: 5
    }
  });

  FormBuilderHelper.verifyControlState(form, 'clusterName', {
    valid: true,
    dirty: true,
    touched: true,
    value: 'test-cluster'
  });
});
```

### FormBuilderHelper API

**Location:** `src/test/utils/form-builder-helper.ts`

**Available Methods:**

```typescript
class FormBuilderHelper {
  // Create FormGroup with validators
  static createFormWithValidation(config: {[key: string]: any}): FormGroup

  // Set control value
  static setControlValue(form: FormGroup, name: string, value: any, markTouched?: boolean): void

  // Get control value with type safety
  static getControlValue<T>(form: FormGroup, name: string): T

  // Mark as touched/dirty/invalid
  static markAsTouched(form: FormGroup): void
  static markAsDirty(form: FormGroup): void
  static markAsInvalid(form: FormGroup): void

  // Reset form
  static reset(form: FormGroup, values?: any): void

  // Set control enabled state
  static setControlEnabled(form: FormGroup, name: string, enabled: boolean): void

  // Verify control state matches expected
  static verifyControlState(form: FormGroup, name: string, expected: ControlState): void

  // Set multiple values with change detection
  static setInputAndDetect(options: {form, values, detectChanges?: boolean}): void

  // Get control errors
  static getControlErrors(form: FormGroup, name: string): ValidationErrors | null
}
```

### Form Testing Patterns

**Pattern: Testing Custom Validators**

```typescript
it('should validate CIDR format', () => {
  const form = FormBuilderHelper.createFormWithValidation({
    cidr: ['', [cidrValidator()]]
  });

  const cidrControl = form.get('cidr');

  // Test invalid CIDR
  FormBuilderHelper.setControlValue(form, 'cidr', 'invalid-cidr');
  expect(cidrControl?.hasError('cidrFormat')).toBe(true);

  // Test valid CIDR
  FormBuilderHelper.setControlValue(form, 'cidr', '10.0.0.0/8');
  expect(cidrControl?.valid).toBe(true);
});
```

**Pattern: Testing Conditional Validation**

```typescript
it('should validate labels only when tagging enabled', () => {
  const form = FormBuilderHelper.createFormWithValidation({
    enableLabels: [false],
    labels: ['', Validators.required]
  });

  // Initially, labels should not be required
  FormBuilderHelper.setControlValue(form, 'labels', '');
  expect(form.get('labels')?.valid).toBe(true);

  // When tagging enabled, labels becomes required
  FormBuilderHelper.setControlValue(form, 'enableLabels', true);
  // Simulate conditional validator logic
  if (form.get('enableLabels')?.value) {
    form.get('labels')?.setValidators(Validators.required);
    form.get('labels')?.updateValueAndValidity();
  }

  FormBuilderHelper.setControlValue(form, 'labels', '');
  expect(form.get('labels')?.hasError('required')).toBe(true);
});
```

---

## Change Detection Testing

### Problem: OnPush Components Not Updating in Tests

**Before (Manual Change Detection):**

```typescript
it('should update when input changes', () => {
  const component = fixture.componentInstance;
  const input = {id: '1', name: 'Project A'};

  // Component uses OnPush strategy but doesn't detect changes
  component.project = input;
  fixture.detectChanges();

  // May not work correctly for OnPush components
  expect(fixture.nativeElement.querySelector('.project-name').textContent)
    .toContain('Project A');

  // Changing property doesn't trigger detection
  component.project.name = 'Project B';
  fixture.detectChanges();

  // OnPush might not detect in-place modifications
  expect(fixture.nativeElement.querySelector('.project-name').textContent)
    .toContain('Project B');
});

// Testing component reactivity is tedious
it('should be reactive to input changes', () => {
  const component = fixture.componentInstance;

  component.clusters = [fakeCluster()];
  fixture.detectChanges();
  tick();

  expect(component.clusterCount).toBe(1);

  component.clusters = [...component.clusters, fakeCluster()];
  fixture.detectChanges();
  tick();

  expect(component.clusterCount).toBe(2);
});
```

**After (Using ChangeDetectionHelper):**

```typescript
import {ChangeDetectionHelper} from '@test/utils';

it('should update when input changes', () => {
  const input = {id: '1', name: 'Project A'};

  ChangeDetectionHelper.setInputAndDetect(fixture, fixture.componentInstance, {
    project: input
  });

  expect(ChangeDetectionHelper.getText(fixture, '.project-name'))
    .toContain('Project A');

  // Verify OnPush is implemented
  expect(ChangeDetectionHelper.hasOnPushStrategy(fixture.componentInstance))
    .toBe(true);
});

it('should be reactive to input changes', () => {
  ChangeDetectionHelper.setInputAndDetect(fixture, fixture.componentInstance, {
    clusters: [fakeCluster()]
  });

  expect(fixture.componentInstance.clusterCount).toBe(1);

  // Set new reference (required for OnPush)
  ChangeDetectionHelper.setInputAndDetect(fixture, fixture.componentInstance, {
    clusters: [fakeCluster(), fakeCluster()]
  });

  expect(fixture.componentInstance.clusterCount).toBe(2);
});

it('should verify OnPush semantics', () => {
  const component = fixture.componentInstance;

  // Test that in-place modifications DON'T trigger detection
  ChangeDetectionHelper.verifyOnPushSemantics(fixture, () => {
    component.projects = [fakeProject()];
    component.projects[0].name = 'Modified';
    fixture.detectChanges();
  });

  // In-place modification shouldn't update view
  expect(fixture.nativeElement.querySelector('.project-name').textContent)
    .not.toContain('Modified');
});
```

### ChangeDetectionHelper API

**Location:** `src/test/utils/change-detection-helper.ts`

**Available Methods:**

```typescript
class ChangeDetectionHelper {
  // Trigger change detection with optional async tick
  static detectChanges(fixture: ComponentFixture<any>, tickMs?: number): void

  // Manually mark for check
  static markForCheck(component: any): void

  // Verify component has OnPush detection
  static hasOnPushStrategy(component: any): boolean

  // Set inputs and trigger detection
  static setInputAndDetect(fixture: ComponentFixture<any>, component: any, inputs: any, detectChanges?: boolean): void

  // Verify component is reactive to input changes
  static testInputReactivity(fixture: ComponentFixture<any>, component: any, inputChanges: any[]): boolean

  // Verify OnPush semantics (in-place mods don't trigger detection)
  static verifyOnPushSemantics(fixture: ComponentFixture<any>, modifyFn: Function): void

  // Get rendered HTML content
  static getCompiledHtml(fixture: ComponentFixture<any>): string

  // Get rendered text content
  static getText(fixture: ComponentFixture<any>, selector?: string): string
}
```

### Change Detection Patterns

**Pattern: Testing OnPush with Input Changes**

```typescript
it('should properly implement OnPush strategy', () => {
  const component = fixture.componentInstance;

  // Set initial input
  ChangeDetectionHelper.setInputAndDetect(fixture, component, {
    data: {id: 1, name: 'Test'}
  }, true);

  expect(component.processedData).toBeTruthy();

  // Change with new reference (detects change)
  ChangeDetectionHelper.setInputAndDetect(fixture, component, {
    data: {id: 2, name: 'Updated'}
  }, true);

  expect(component.processedData.id).toBe(2);
});
```

**Pattern: Testing Async Input Updates**

```typescript
it('should update view with async input changes', fakeAsync(() => {
  let inputData = fakeData();

  ChangeDetectionHelper.setInputAndDetect(fixture, fixture.componentInstance, {
    data: inputData
  });

  tick(100);
  inputData = fakeData({modified: true});

  ChangeDetectionHelper.setInputAndDetect(fixture, fixture.componentInstance, {
    data: inputData
  });

  tick();
  expect(ChangeDetectionHelper.getText(fixture, '.data-modified')).toBeTruthy();
}));
```

---

## HTTP Mock Interception

### Problem: Repetitive HTTP Testing Setup

**Before (Manual HttpTestingController):**

```typescript
it('should fetch projects from API', () => {
  component.loadProjects();

  const req = httpMock.expectOne('/api/v1/projects');
  expect(req.request.method).toBe('GET');
  expect(req.request.headers.has('Authorization')).toBe(true);

  req.flush([fakeProject()]);
  expect(component.projects.length).toBe(1);
});

it('should handle HTTP errors', () => {
  component.loadProjects();

  const req = httpMock.expectOne('/api/v1/projects');
  req.error(
    new ProgressEvent('error'),
    {status: 500, statusText: 'Server Error'}
  );

  expect(component.errorMessage).toContain('Failed to load projects');
});

it('should verify request parameters', () => {
  component.searchProjects('kubernetes', {limit: 10, offset: 0});

  const req = httpMock.expectOne(request =>
    request.url === '/api/v1/projects' &&
    request.params.get('query') === 'kubernetes'
  );

  expect(req.request.params.get('limit')).toBe('10');
  req.flush([]);
});
```

**After (Using HttpMockBuilder):**

```typescript
import {HttpMockBuilder} from '@test/utils';

let httpMock: HttpTestingController;
let builder: HttpMockBuilder;

beforeEach(() => {
  TestBed.configureTestingModule({...});
  httpMock = TestBed.inject(HttpTestingController);
  builder = new HttpMockBuilder(httpMock);
});

it('should fetch projects from API', () => {
  component.loadProjects();

  builder.expectGetRequest('/api/v1/projects', [fakeProject()]);
  expect(component.projects.length).toBe(1);
});

it('should handle HTTP errors', () => {
  component.loadProjects();

  builder.expectRequest(
    'GET',
    '/api/v1/projects',
    null,
    fakeError('Server Error'),
    500
  );

  expect(component.errorMessage).toContain('Server Error');
});

it('should verify request parameters', () => {
  component.searchProjects('kubernetes', {limit: 10, offset: 0});

  builder.expectGetRequest(
    '/api/v1/projects?query=kubernetes&limit=10'
  );
});

afterEach(() => {
  builder.verifyNoOutstandingRequests();
});
```

### HttpMockBuilder API

**Location:** `src/test/utils/http-mock-builder.ts`

**Available Methods:**

```typescript
class HttpMockBuilder {
  constructor(httpMock: HttpTestingController)

  // Expect GET request
  expectGetRequest<T>(url: string, data?: T, status?: number): HttpTestingController

  // Expect POST request
  expectPostRequest<T>(url: string, expectedBody?: any, data?: T, status?: number): HttpTestingController

  // Expect PUT request
  expectPutRequest<T>(url: string, expectedBody?: any, data?: T, status?: number): HttpTestingController

  // Expect DELETE request
  expectDeleteRequest<T>(url: string, data?: T, status?: number): HttpTestingController

  // Generic request expectation
  expectRequest<T>(method: string, url: string, data?: T, status?: number): HttpTestingController

  // Verify request was made with specific params
  verifyRequestParams(url: string, params: {[key: string]: string}): void

  // Verify request headers contain expected values
  verifyRequestHeaders(url: string, headers: {[key: string]: string}): void

  // Verify no outstanding requests
  verifyNoOutstandingRequests(): void

  // Create error response
  createErrorResponse(status: number, message: string): HttpErrorResponse

  // Create success response
  createSuccessResponse<T>(data: T, status?: number): T
}
```

### HTTP Mocking Patterns

**Pattern: Testing Interceptors**

```typescript
it('should add Authorization header to requests', () => {
  component.getUser();

  const req = httpMock.expectOne('/api/v1/user');
  expect(req.request.headers.has('Authorization')).toBe(true);
  expect(req.request.headers.get('Authorization')).toContain('Bearer');
  req.flush(fakeUser());
});
```

**Pattern: Testing Request Transformation**

```typescript
it('should transform request body on POST', () => {
  const projectData = {name: 'New Project'};
  component.createProject(projectData);

  const req = httpMock.expectOne('/api/v1/projects');
  expect(req.request.body).toEqual({
    name: 'New Project',
    timestamp: jasmine.any(Number)
  });
  req.flush(fakeProject());
});
```

---

## Testing Async/Await and Promises

### Problem: Mixing Callbacks and Promises in Tests

**Before (Manual Promise Handling):**

```typescript
it('should load async data', (done) => {
  service.getDataAsync().then(data => {
    expect(data).toBeTruthy();
    done();
  }).catch(err => {
    fail('Should not error: ' + err);
    done();
  });
});

// Multiple async operations
it('should chain async operations', (done) => {
  service.loadUser()
    .then(user => {
      expect(user).toBeTruthy();
      return service.loadUserProjects(user.id);
    })
    .then(projects => {
      expect(projects).toBeTruthy();
      done();
    })
    .catch(err => {
      fail(err);
      done();
    });
});

// Testing async errors is repetitive
it('should handle async errors', (done) => {
  service.getDataAsync()
    .then(() => {
      fail('Should have thrown error');
      done();
    })
    .catch(err => {
      expect(err.message).toContain('API Error');
      done();
    });
});
```

**After (Using async/await in Tests):**

```typescript
it('should load async data', async () => {
  const data = await service.getDataAsync();
  expect(data).toBeTruthy();
});

it('should chain async operations', async () => {
  const user = await service.loadUser();
  expect(user).toBeTruthy();

  const projects = await service.loadUserProjects(user.id);
  expect(projects).toBeTruthy();
});

it('should handle async errors', async () => {
  await expectAsync(service.getDataAsync()).toBeRejectedWithError(/API Error/);
});

// Testing multiple async scenarios
it('should handle concurrent async operations', async () => {
  const [user, projects, settings] = await Promise.all([
    service.loadUser(),
    service.loadProjects(),
    service.loadSettings()
  ]);

  expect(user).toBeTruthy();
  expect(projects).toBeTruthy();
  expect(settings).toBeTruthy();
});
```

### Async Testing Patterns

**Pattern: Testing Promise Chains**

```typescript
it('should chain multiple promises with error handling', async () => {
  const result = await service.getUser()
    .then(user => service.getProjects(user.id))
    .then(projects => projects.filter(p => p.active))
    .catch(err => {
      console.error(err);
      return [];
    });

  expect(Array.isArray(result)).toBe(true);
});
```

**Pattern: Timeout Testing**

```typescript
it('should timeout after delay', async () => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 1000)
  );

  await expectAsync(timeoutPromise).toBeRejectedWithError(/Timeout/);
});
```

---

## Testing Error Scenarios

### Problem: Incomplete Error Coverage

**Before (Limited Error Testing):**

```typescript
it('should handle errors', () => {
  spyOn(service, 'getProjects').and.returnValue(
    throwError(() => new Error('API Error'))
  );

  component.loadProjects();
  fixture.detectChanges();

  expect(component.error).toBeTruthy();
});

// Doesn't test different error types
// Doesn't test error recovery
// Doesn't test error messages
```

**After (Comprehensive Error Testing):**

```typescript
it('should handle network errors', fakeAsync(() => {
  const error = new HttpErrorResponse({
    error: 'Network error',
    status: 0,
    statusText: 'Unknown Error'
  });

  spyOn(service, 'getProjects').and.returnValue(
    MockObservableBuilder.error(error)
  );

  component.loadProjects();
  fixture.detectChanges();
  tick();

  expect(component.errorMessage).toContain('Network error');
  expect(component.errorSeverity).toBe('critical');
}));

it('should handle 404 errors', fakeAsync(() => {
  const error = new HttpErrorResponse({
    error: {message: 'Project not found'},
    status: 404,
    statusText: 'Not Found'
  });

  spyOn(service, 'getProject').and.returnValue(
    MockObservableBuilder.error(error)
  );

  component.loadProject('non-existent');
  fixture.detectChanges();
  tick();

  expect(component.notFound).toBe(true);
}));

it('should retry on transient errors', fakeAsync(() => {
  let callCount = 0;
  spyOn(service, 'getProjects').and.callFake(() => {
    callCount++;
    if (callCount < 3) {
      return MockObservableBuilder.error(new Error('Temporary error'));
    }
    return MockObservableBuilder.success([fakeProject()]);
  });

  component.loadProjects();
  fixture.detectChanges();
  tick();

  expect(component.projects).toBeTruthy();
}));

it('should show appropriate error message for different status codes', () => {
  const errorScenarios = [
    {status: 400, message: 'Invalid request'},
    {status: 401, message: 'Unauthorized'},
    {status: 403, message: 'Forbidden'},
    {status: 500, message: 'Server error'},
  ];

  errorScenarios.forEach(scenario => {
    const error = new HttpErrorResponse({status: scenario.status});
    spyOn(service, 'getProjects').and.returnValue(
      MockObservableBuilder.error(error)
    );

    component.loadProjects();
    fixture.detectChanges();

    expect(component.getErrorMessage(scenario.status)).toBe(scenario.message);
  });
});
```

### Error Testing Patterns

**Pattern: Testing Validation Error Scenarios**

```typescript
it('should display validation errors on form submission', () => {
  const form = FormBuilderHelper.createFormWithValidation({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  FormBuilderHelper.markAsTouched(form);
  fixture.detectChanges();

  const errors = FormBuilderHelper.getControlErrors(form, 'email');
  expect(errors?.['required']).toBe(true);

  FormBuilderHelper.setControlValue(form, 'email', 'invalid');
  expect(FormBuilderHelper.getControlErrors(form, 'email')?.['email']).toBe(true);

  FormBuilderHelper.setControlValue(form, 'email', 'user@example.com');
  expect(FormBuilderHelper.getControlErrors(form, 'email')).toBeNull();
});
```

---

## TestBed Configuration Helpers

### Problem: Repetitive TestBed Setup

**Before (Manual TestBed Configuration):**

```typescript
describe('ProjectListComponent', () => {
  let fixture: ComponentFixture<ProjectListComponent>;
  let component: ProjectListComponent;
  let projectService: ProjectService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectListComponent],
      imports: [
        BrowserModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatTableModule,
        MatDialogModule
      ],
      providers: [
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: NotificationService, useClass: NotificationMockService}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    projectService = TestBed.inject(ProjectService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// Lots of duplication when testing dialogs
describe('ProjectDialogComponent', () => {
  let fixture: ComponentFixture<ProjectDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectDialogComponent],
      imports: [
        BrowserModule,
        NoopAnimationsModule,
        MatDialogModule,
        ReactiveFormsModule,
        MatFormFieldModule
      ],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: {projectId: 'test'}}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDialogComponent);
  });
});
```

**After (Using TestBedSetup Helper):**

```typescript
import {TestBedSetup} from '@test/utils';

describe('ProjectListComponent', () => {
  let fixture: ComponentFixture<ProjectListComponent>;
  let component: ProjectListComponent;
  let projectService: ProjectService;

  beforeEach(async () => {
    fixture = await TestBedSetup.configureComponentWithServices({
      component: ProjectListComponent,
      imports: [MatTableModule, MatDialogModule],
      providers: [
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: AppConfigService, useClass: AppConfigMockService}
      ]
    });

    component = TestBedSetup.getComponent(fixture);
    projectService = TestBedSetup.injectService(ProjectService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('ProjectDialogComponent', () => {
  let fixture: ComponentFixture<ProjectDialogComponent>;

  beforeEach(async () => {
    fixture = await TestBedSetup.configureComponentWithDialog({
      component: ProjectDialogComponent,
      dialogData: {projectId: 'test'}
    });
  });

  it('should display dialog data', () => {
    const component = TestBedSetup.getComponent(fixture);
    expect(component.projectId).toBe('test');
  });
});
```

### TestBedSetup API

**Location:** `src/test/utils/test-bed-setup.ts`

**Available Methods:**

```typescript
class TestBedSetup {
  // Basic component test setup
  static async configureBasicComponentTest(options?: {
    imports?: any[]
    declarations?: any[]
    providers?: any[]
    teardown?: {destroyAfterEach: boolean}
  }): Promise<ComponentFixture<any>>

  // Component with HTTP and service mocking
  static async configureComponentWithServices(options: {
    component: any
    imports?: any[]
    declarations?: any[]
    providers?: any[]
  }): Promise<ComponentFixture<any>>

  // Component with Material Dialog
  static async configureComponentWithDialog(options: {
    component: any
    dialogData?: any
    imports?: any[]
    declarations?: any[]
    providers?: any[]
  }): Promise<ComponentFixture<any>>

  // Feature module integration test
  static async configureFeatureModule(options: {
    featureModule: any
    additionalImports?: any[]
    declarations?: any[]
    providers?: any[]
  }): Promise<ComponentFixture<any>>

  // Async component compilation
  static async compileComponents(): Promise<void>

  // Type-safe service injection
  static injectService<T>(serviceType: Type<T>): T

  // Get component with typing
  static getComponent<T>(fixture: ComponentFixture<T>): T
}
```

---

## Fixture Helper Patterns

### Problem: Verbose DOM Querying and Event Handling

**Before (Manual DOM Operations):**

```typescript
it('should display projects and handle delete', fakeAsync(() => {
  fixture.detectChanges();
  tick();

  // Query DOM
  const projectElements = fixture.nativeElement.querySelectorAll('[data-cy="project-item"]');
  expect(projectElements.length).toBe(2);

  // Trigger events
  const deleteBtn = fixture.nativeElement.querySelector('[data-cy="delete-btn-0"]');
  deleteBtn.click();
  fixture.detectChanges();
  tick();

  // Check visibility
  const deleteConfirmation = fixture.nativeElement.querySelector('.delete-confirmation');
  expect(deleteConfirmation.style.display).not.toBe('none');

  // Submit deletion
  const confirmBtn = fixture.nativeElement.querySelector('[data-cy="confirm-delete"]');
  confirmBtn.click();
  fixture.detectChanges();
  tick();

  expect(projectElements.length).toBe(1);
}));

// Complex visibility checks
it('should toggle advanced options', () => {
  const advancedSection = fixture.nativeElement.querySelector('[data-cy="advanced-options"]');
  expect(advancedSection.offsetHeight > 0).toBe(false); // Hidden initially

  const toggleBtn = fixture.nativeElement.querySelector('[data-cy="toggle-advanced"]');
  toggleBtn.click();
  fixture.detectChanges();

  expect(advancedSection.offsetHeight > 0).toBe(true); // Visible after click
});
```

**After (Using FixtureHelper):**

```typescript
import {FixtureHelper} from '@test/utils';

it('should display projects and handle delete', fakeAsync(() => {
  fixture.detectChanges();
  tick();

  expect(FixtureHelper.querySelectorAll(fixture, '[data-cy="project-item"]').length).toBe(2);

  FixtureHelper.triggerClick(fixture, '[data-cy="delete-btn-0"]');
  fixture.detectChanges();
  tick();

  expect(FixtureHelper.isVisible(fixture, '.delete-confirmation')).toBe(true);

  FixtureHelper.triggerClick(fixture, '[data-cy="confirm-delete"]');
  fixture.detectChanges();
  tick();

  expect(FixtureHelper.querySelectorAll(fixture, '[data-cy="project-item"]').length).toBe(1);
}));

it('should toggle advanced options', () => {
  expect(FixtureHelper.isVisible(fixture, '[data-cy="advanced-options"]')).toBe(false);

  FixtureHelper.triggerClick(fixture, '[data-cy="toggle-advanced"]');
  fixture.detectChanges();

  expect(FixtureHelper.isVisible(fixture, '[data-cy="advanced-options"]')).toBe(true);
});
```

### FixtureHelper API

**Location:** `src/test/utils/fixture-helper.ts`

**Available Methods:**

```typescript
class FixtureHelper {
  // DOM Querying
  static querySelector<T>(fixture: ComponentFixture<T>, selector: string): HTMLElement | null
  static querySelectorAll<T>(fixture: ComponentFixture<T>, selector: string): HTMLElement[]
  static getByDataCy<T>(fixture: ComponentFixture<T>, dataCy: string): HTMLElement | null

  // DOM Events
  static triggerClick<T>(fixture: ComponentFixture<T>, selector: string | HTMLElement): void
  static triggerInputChange<T>(fixture: ComponentFixture<T>, selector: string | HTMLElement, value?: string): void
  static triggerSelectChange<T>(fixture: ComponentFixture<T>, selector: string | HTMLElement, value?: string): void

  // State Verification
  static isVisible<T>(fixture: ComponentFixture<T>, selector: string | HTMLElement): boolean
  static isDisabled<T>(fixture: ComponentFixture<T>, selector: string | HTMLElement): boolean

  // Text Operations
  static getText<T>(fixture: ComponentFixture<T>, selector?: string | HTMLElement): string
  static textContains<T>(fixture: ComponentFixture<T>, selector: string | HTMLElement, text: string): boolean

  // Change Detection
  static detectChanges<T>(fixture: ComponentFixture<T>, tickMs?: number): void

  // Component Setup
  static setInputs<T>(fixture: ComponentFixture<T>, inputs: {[key: string]: any}, detectChanges?: boolean): void
}
```

---

## Advanced Integration Examples

### Complete Component Test with All Utilities

```typescript
import {TestBedSetup, FixtureHelper, MockObservableBuilder, FormBuilderHelper, ChangeDetectionHelper} from '@test/utils';

describe('CompleteProjectManagementComponent', () => {
  let fixture: ComponentFixture<ProjectManagementComponent>;
  let component: ProjectManagementComponent;
  let projectService: ProjectService;

  beforeEach(async () => {
    // Setup TestBed with all necessary mocks and imports
    fixture = await TestBedSetup.configureComponentWithServices({
      component: ProjectManagementComponent,
      imports: [MatTableModule, MatDialogModule, ReactiveFormsModule],
      providers: [
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: NotificationService, useClass: NotificationMockService}
      ]
    });

    component = TestBedSetup.getComponent(fixture);
    projectService = TestBedSetup.injectService(ProjectService);
  });

  it('should load, filter, and manage projects', fakeAsync(() => {
    // Setup mock data
    const projects = [
      fakeProject({id: '1', name: 'Project A'}),
      fakeProject({id: '2', name: 'Project B'})
    ];

    spyOn(projectService, 'projects', 'get').and.returnValue(
      MockObservableBuilder.success(projects)
    );

    // Load projects
    fixture.detectChanges();
    tick();

    expect(FixtureHelper.querySelectorAll(fixture, '[data-cy="project-row"]').length).toBe(2);

    // Search/filter projects
    FixtureHelper.triggerInputChange(fixture, '[data-cy="search-input"]', 'Project A');
    fixture.detectChanges();
    tick();

    // Verify filtered results
    expect(FixtureHelper.getText(fixture, '[data-cy="project-row-0"]')).toContain('Project A');
  }));

  it('should validate and create new project with form helpers', fakeAsync(() => {
    const newProjectData = {
      name: 'New Project',
      description: 'Test project',
      labels: ['test', 'kubernetes']
    };

    // Setup form
    const form = FormBuilderHelper.createFormWithValidation({
      name: ['', Validators.required],
      description: [''],
      labels: [[]]
    });

    // Set values and verify validation
    FormBuilderHelper.setInputAndDetect({
      form,
      values: newProjectData,
      detectChanges: true
    });

    expect(form.valid).toBe(true);

    spyOn(projectService, 'create').and.returnValue(
      MockObservableBuilder.success(fakeProject(newProjectData))
    );

    component.createProject(newProjectData);
    tick();

    expect(projectService.create).toHaveBeenCalled();
  }));

  it('should handle errors gracefully', fakeAsync(() => {
    const error = new HttpErrorResponse({
      status: 500,
      message: 'Failed to load projects'
    });

    spyOn(projectService, 'projects', 'get').and.returnValue(
      MockObservableBuilder.error(error)
    );

    fixture.detectChanges();
    tick();

    expect(component.errorMessage).toContain('Failed to load projects');
    expect(FixtureHelper.isVisible(fixture, '.error-alert')).toBe(true);
  }));

  it('should respect OnPush change detection strategy', () => {
    expect(ChangeDetectionHelper.hasOnPushStrategy(component)).toBe(true);

    // Set inputs properly for OnPush
    ChangeDetectionHelper.setInputAndDetect(fixture, component, {
      projects: [fakeProject()]
    });

    expect(component.projectCount).toBe(1);

    // Update with new reference (required for OnPush)
    ChangeDetectionHelper.setInputAndDetect(fixture, component, {
      projects: [fakeProject(), fakeProject()]
    });

    expect(component.projectCount).toBe(2);
  });
});
```

---

## Best Practices

1. **Use MockObservableBuilder** for consistent observable mocking patterns
2. **Use FormBuilderHelper** for all reactive form testing to reduce boilerplate
3. **Verify OnPush Strategy** in components using `ChangeDetectionHelper.hasOnPushStrategy()`
4. **Use FixtureHelper** for all DOM operations to improve readability
5. **Use HttpMockBuilder** for HTTP testing to simplify assertion code
6. **Use TestBedSetup** to reduce repeated TestBed configuration
7. **Test Error Scenarios** comprehensively with different error types
8. **Clean Up Subscriptions** in `ngOnDestroy` to prevent memory leaks
9. **Use data-cy Attributes** for fixture queries instead of fragile CSS selectors
10. **Test OnPush Semantics** to ensure components properly handle immutable objects

---

## Related Documentation

- [Mock Services Reference](./MOCK-SERVICES-REFERENCE.md) - Complete guide to all mock services
- [Testing Patterns Guide](./TESTING-PATTERNS.md) - Common testing patterns and examples
- [Setup Verification Checklist](./SETUP-VERIFICATION.md) - Jest configuration and troubleshooting
- Testing Utilities: `src/test/utils/` - Source code for all helper utilities
- Test Services: `src/test/services/` - Mock service implementations

---

**Last Updated:** March 2026
**Angular Version:** 20.3.x
**Jest Version:** Latest
