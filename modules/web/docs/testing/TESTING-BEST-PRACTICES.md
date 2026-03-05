---
type: reference
title: Testing Best Practices Guide
created: 2026-03-05
tags:
  - testing
  - jest
  - component-testing
  - best-practices
related:
  - '[[TESTING-PATTERNS]]'
  - '[[MOCK-SERVICES-REFERENCE]]'
  - '[[COMPREHENSIVE-COVERAGE-REPORT]]'
---

# Testing Best Practices Guide

This guide documents lessons learned from comprehensive testing of the Kubermatic Dashboard. It covers common mistakes to avoid, anti-patterns, maintainability, test tools, performance optimization, and debugging strategies.

**Target Audience:** All developers writing tests for the Kubermatic Dashboard
**Scope:** Jest unit tests for Angular components and services

---

## Table of Contents

1. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
2. [Anti-Patterns in Component Testing](#anti-patterns-in-component-testing)
3. [Writing Maintainable Tests](#writing-maintainable-tests)
4. [Stubs vs Spies vs Mocks](#stubs-vs-spies-vs-mocks)
5. [Performance Tips](#performance-tips)
6. [Debugging Failing Tests](#debugging-failing-tests)
7. [Code Review Checklist](#code-review-checklist)

---

## Common Mistakes to Avoid

### 1. Forgetting to Call `detectChanges()` After Input Changes

❌ **WRONG** - Changes not propagated to component:

```typescript
it('should display user name', () => {
  component.userName = 'Alice';  // Input changed but not detected
  expect(component.displayName).toBe('Alice');  // FAILS: displayName still empty
});
```

✅ **RIGHT** - Detect changes after input modification:

```typescript
it('should display user name', () => {
  component.userName = 'Alice';
  fixture.detectChanges();  // Critical: propagate changes
  expect(component.displayName).toBe('Alice');  // PASSES
});
```

**Why:** Angular's change detection doesn't run automatically in tests. Without `detectChanges()`, OnPush strategy components won't update.

---

### 2. Not Marking Form Controls as Touched

❌ **WRONG** - Validation errors don't show:

```typescript
it('should show error for empty email', () => {
  const emailControl = component.form.get('email');
  emailControl.setValue('');
  // Error message not visible because control isn't touched yet
  expect(component.form.get('email').errors).toEqual({required: true});
});
```

✅ **RIGHT** - Mark as touched before checking errors:

```typescript
it('should show error for empty email', () => {
  const emailControl = component.form.get('email');
  emailControl.setValue('');
  emailControl.markAsTouched();  // User interaction simulation
  fixture.detectChanges();
  expect(emailControl.hasError('required')).toBe(true);
});
```

**Why:** Angular Material and custom validators only show errors on touched controls (UX pattern prevents showing errors while user is still typing).

---

### 3. Over-Testing Component Children

❌ **WRONG** - Testing implementation details instead of behavior:

```typescript
it('should render the child component correctly', () => {
  expect(component.childComponent.items.length).toBe(5);
  expect(component.childComponent.selectedItem).toBe(items[0]);
  // Testing child's internal state - brittle!
});
```

✅ **RIGHT** - Test parent-child communication contract:

```typescript
it('should pass items to child and handle selection', () => {
  component.items = [item1, item2, item3];
  fixture.detectChanges();

  // Simulate child selection via @Output event
  component.childComponent.selectItem.emit(item1);
  expect(component.onItemSelected).toHaveBeenCalledWith(item1);
});
```

**Why:** Children have their own tests. Parent tests should only verify the contract (inputs passed, outputs handled).

---

### 4. Not Cleaning Up Subscriptions and Timers

❌ **WRONG** - Memory leaks in tests:

```typescript
it('should update data every 5 seconds', () => {
  component.startTimer();
  tick(5000);
  expect(component.data).toEqual(newData);
  // Timer still running in background - pollutes other tests!
});
```

✅ **RIGHT** - Clean up in afterEach:

```typescript
it('should update data every 5 seconds', fakeAsync(() => {
  component.startTimer();
  tick(5000);
  expect(component.data).toEqual(newData);
  component.ngOnDestroy();  // Or component cleanup in afterEach
}));

afterEach(() => {
  fixture.destroy();  // Cleans up all subscriptions
});
```

**Why:** Uncleaned timers and subscriptions cause test isolation violations and flaky tests.

---

### 5. Using Wrong Selectors for DOM Queries

❌ **WRONG** - Brittle CSS selectors:

```typescript
const button = fixture.debugElement.query(
  By.css('div.container > div:nth-child(2) > button:nth-child(3)')
);  // FRAGILE: breaks with any template change
```

✅ **RIGHT** - Use data-cy attributes:

```typescript
const button = fixture.debugElement.query(By.css('[data-cy="submit-button"]'));
// Or use FixtureHelper
const button = FixtureHelper.querySelector(fixture, '[data-cy="submit-button"]');
```

**Why:** data-cy attributes are explicit selectors for testing, unaffected by styling/layout changes.

---

### 6. Testing Implementation Instead of Behavior

❌ **WRONG** - Testing private methods:

```typescript
it('should calculate total correctly', () => {
  // Private methods shouldn't be tested directly
  expect(component['_calculateTotal']([1, 2, 3])).toBe(6);
});
```

✅ **RIGHT** - Test behavior through public interface:

```typescript
it('should display total price for items', () => {
  component.items = [
    {name: 'Item 1', price: 10},
    {name: 'Item 2', price: 20}
  ];
  fixture.detectChanges();
  const totalDisplay = FixtureHelper.getText(fixture, '[data-cy="total-price"]');
  expect(totalDisplay).toBe('$30');
});
```

**Why:** Private method tests break during refactoring. Public behavior stays the same.

---

### 7. Not Providing Required Dependencies in TestBed

❌ **WRONG** - Incomplete TestBed setup:

```typescript
describe('ClusterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClusterComponent],
      imports: [HttpClientModule]
      // Missing: MatDialog, ActivatedRoute, ClusterService, etc.
    }).compileComponents();
  });
  // Tests fail with "NullInjectorError"
});
```

✅ **RIGHT** - Comprehensive setup:

```typescript
describe('ClusterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClusterComponent],
      imports: [
        HttpClientModule,
        MatDialogModule,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        {provide: ActivatedRoute, useValue: mockActivatedRoute},
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: NotificationService, useClass: NotificationMockService}
      ]
    }).compileComponents();
  });
  // All dependencies available
});
```

**Or use helper:** `TestBedSetup.configureComponentWithServices({...})`

**Why:** Missing dependencies cause injector errors at runtime. Better to fail at setup than in tests.

---

## Anti-Patterns in Component Testing

### Anti-Pattern 1: Testing Too Much in One Test

❌ **WRONG** - Multiple assertions on different concerns:

```typescript
it('should handle form submission', () => {
  component.form.patchValue({name: 'test', email: 'test@example.com'});
  fixture.detectChanges();

  // Testing form validation
  expect(component.form.valid).toBe(true);

  // Testing API call
  component.submit();
  expect(mockService.create).toHaveBeenCalled();

  // Testing notification display
  expect(mockNotification.success).toHaveBeenCalled();

  // Testing navigation
  expect(mockRouter.navigate).toHaveBeenCalledWith(['/projects']);
  // Too many concerns = test fails in mysterious ways
});
```

✅ **RIGHT** - One concern per test:

```typescript
it('should enable submit button when form is valid', () => {
  component.form.patchValue({name: 'test', email: 'test@example.com'});
  fixture.detectChanges();
  expect(component.form.valid).toBe(true);
});

it('should call service.create() on form submission', () => {
  component.form.patchValue({name: 'test', email: 'test@example.com'});
  component.submit();
  expect(mockService.create).toHaveBeenCalled();
});

it('should display success notification after creation', () => {
  component.form.patchValue({name: 'test', email: 'test@example.com'});
  component.submit();
  expect(mockNotification.success).toHaveBeenCalledWith('Created successfully');
});
```

**Why:** Single-concern tests fail clearly, show exactly what's wrong, and are reusable.

---

### Anti-Pattern 2: Hard-Coded Test Data Instead of Factories

❌ **WRONG** - Duplication across tests:

```typescript
describe('ProjectComponent', () => {
  let mockProject1: any;
  let mockProject2: any;

  beforeEach(() => {
    mockProject1 = {
      id: 'proj-1',
      name: 'Project 1',
      namespace: 'ns-1',
      creationTimestamp: '2024-01-01T00:00:00Z',
      // 50+ properties repeated in every test file
    };
    mockProject2 = {...mockProject1, id: 'proj-2', name: 'Project 2'};
  });
});
```

✅ **RIGHT** - Use factory functions:

```typescript
// In src/test/data/project.factory.ts
export function createMockProject(overrides?: Partial<Project>): Project {
  return {
    id: 'proj-1',
    name: 'Project 1',
    namespace: 'ns-1',
    creationTimestamp: '2024-01-01T00:00:00Z',
    // ... all defaults
    ...overrides
  };
}

// In tests:
it('should display project name', () => {
  const project = createMockProject({name: 'My Project'});
  component.project = project;
  fixture.detectChanges();
  expect(FixtureHelper.getText(fixture, '.project-name')).toBe('My Project');
});
```

**Why:** Factories are DRY, updateable in one place, and tests are clearer.

---

### Anti-Pattern 3: Over-Mocking Everything

❌ **WRONG** - Mocking simple objects:

```typescript
const mockDate = {
  getTime: jasmine.createSpy('getTime').and.returnValue(1000),
  toISOString: jasmine.createSpy('toISOString').and.returnValue('2024-01-01'),
  // Way overkill for a date
};
```

✅ **RIGHT** - Only mock what matters:

```typescript
// For testing date formatting:
const testDate = new Date('2024-01-01');
component.date = testDate;
fixture.detectChanges();
expect(component.formattedDate).toBe('Jan 1, 2024');

// For testing timer behavior:
jest.useFakeTimers();
tick(5000);
jest.useRealTimers();
```

**Why:** Over-mocking makes tests fragile. Real objects work better for simple types.

---

### Anti-Pattern 4: Ignoring Observable Unsubscription

❌ **WRONG** - Observable subscriptions leak:

```typescript
it('should fetch projects on init', fakeAsync(() => {
  component.ngOnInit();
  tick();
  expect(component.projects).toEqual([project1, project2]);
  // Subscription still active - pollutes next test
}));
```

✅ **RIGHT** - Component cleanup or use takeUntil:

```typescript
it('should fetch projects on init', fakeAsync(() => {
  component.ngOnInit();
  tick();
  expect(component.projects).toEqual([project1, project2]);
  fixture.destroy();  // Triggers ngOnDestroy -> cleanup
}));

// Or in component:
ngOnInit() {
  this.projects$ = this.projectService.list()
    .pipe(takeUntil(this.destroy$))
    .subscribe(projects => this.projects = projects);
}

ngOnDestroy() {
  this.destroy$.next();
}
```

**Why:** Unsubscribed observables continue running, causing test pollution and flakiness.

---

## Writing Maintainable Tests

### 1. Use Descriptive Test Names

❌ **WRONG** - Vague naming:

```typescript
it('works', () => { ... });
it('should load', () => { ... });
it('form test', () => { ... });
```

✅ **RIGHT** - Clear behavior descriptions:

```typescript
it('should display empty state when no projects exist', () => { ... });
it('should enable submit button only when form is valid', () => { ... });
it('should display error toast when project creation fails', () => { ... });
```

**Why:** Test names are documentation. "should X when Y" clearly states intent.

---

### 2. Follow Arrange-Act-Assert Pattern

```typescript
it('should update cluster when save is clicked', () => {
  // ARRANGE: Set up initial state
  const originalName = 'Old Name';
  const newName = 'New Name';
  component.cluster = createMockCluster({name: originalName});
  fixture.detectChanges();

  // ACT: Perform user action
  component.form.patchValue({name: newName});
  FixtureHelper.triggerClick(fixture, '[data-cy="save-button"]');

  // ASSERT: Verify result
  expect(mockService.update).toHaveBeenCalledWith(expect.objectContaining({name: newName}));
});
```

**Why:** AAA pattern is immediately understandable and self-documenting.

---

### 3. Group Related Tests with Describe Blocks

```typescript
describe('ProjectListComponent', () => {
  describe('Initialization', () => {
    it('should load projects on init', () => { ... });
    it('should display loading state during fetch', () => { ... });
  });

  describe('User Interactions', () => {
    it('should open delete dialog when delete button clicked', () => { ... });
    it('should call service.delete when confirmed', () => { ... });
  });

  describe('Error Handling', () => {
    it('should display error toast on load failure', () => { ... });
    it('should allow retry after failure', () => { ... });
  });
});
```

**Why:** Related tests grouped logically improve navigation and maintenance.

---

### 4. Use beforeEach Sparingly

❌ **WRONG** - Bloated beforeEach:

```typescript
beforeEach(async () => {
  await TestBed.configureTestingModule({...}).compileComponents();
  fixture = TestBed.createComponent(MyComponent);
  component = fixture.componentInstance;

  // Test-specific setup buried in beforeEach
  component.items = [item1, item2, item3];
  component.selectedItem = item1;
  component.filter = 'active';
  fixture.detectChanges();
  // Now every test starts with this state - confusing!
});
```

✅ **RIGHT** - Minimal beforeEach, setup in tests:

```typescript
beforeEach(async () => {
  await TestBed.configureTestingModule({...}).compileComponents();
  fixture = TestBed.createComponent(MyComponent);
  component = fixture.componentInstance;
  // Only TestBed creation in beforeEach
});

it('should filter items by status', () => {
  // Setup specific to this test
  component.items = [activeItem, inactiveItem];
  component.filterStatus = 'active';
  fixture.detectChanges();

  expect(component.filteredItems).toEqual([activeItem]);
});
```

**Why:** Minimal beforeEach makes each test's setup explicit and modifiable.

---

### 5. Keep Tests Independent

✅ **RIGHT** - Tests don't depend on each other:

```typescript
describe('ProjectListComponent', () => {
  it('Test A: should load projects', () => {
    // Can run in any order
    fixture.detectChanges();
    expect(component.projects.length).toBeGreaterThan(0);
  });

  it('Test B: should filter projects', () => {
    // Doesn't depend on Test A running first
    component.projects = [project1, project2];
    fixture.detectChanges();
    expect(component.filteredProjects.length).toBe(1);
  });
});
```

❌ **WRONG** - Tests with implicit dependencies:

```typescript
let createdProject: Project;

it('Test A: should create project', () => {
  component.create('New Project');
  createdProject = component.lastCreated;
});

it('Test B: should display new project', () => {
  // Test B fails if Test A didn't run!
  expect(component.projects).toContain(createdProject);
});
```

**Why:** Tests must run independently in any order for reliability.

---

## Stubs vs Spies vs Mocks

### Choosing the Right Tool

| Tool | Use Case | Example |
|------|----------|---------|
| **Stub** | Replace with simple implementation returning known values | `of(mockData)` for service |
| **Spy** | Monitor real object behavior without replacing it | `spyOn(obj, 'method').and.callThrough()` |
| **Mock** | Full replacement with call tracking and error injection | Custom `MockService` class |

---

### When to Use Each

#### Stubs: Simple Return Values

✅ Use when you just need predictable output:

```typescript
// Service that returns projects
const projectService = {
  list: () => of([project1, project2])
};

TestBed.configureTestingModule({
  providers: [{provide: ProjectService, useValue: projectService}]
});
```

**When to use:** Testing simple data flows, no need to verify service was called.

---

#### Spies: Monitoring Real Objects

✅ Use when testing integration with real service:

```typescript
const realRouter = TestBed.inject(Router);
spyOn(realRouter, 'navigate').and.returnValue(Promise.resolve(true));

component.goToProject('proj-1');
expect(realRouter.navigate).toHaveBeenCalledWith(['/projects/proj-1']);
```

**When to use:** Want real service logic but need to verify navigation/side effects.

---

#### Mocks: Complex Behavior & State Tracking

✅ Use for complex services with multiple methods:

```typescript
// From src/test/services/project-mock.ts
@Injectable()
export class ProjectMockService {
  private _projects = [project1, project2];

  // Call tracking
  getProjectsCallCount = 0;

  list(): Observable<Project[]> {
    this.getProjectsCallCount++;
    return of([...this._projects]);
  }

  // State simulation
  setError(shouldError: boolean) {
    this._shouldError = shouldError;
  }

  create(project: Project): Observable<Project> {
    if (this._shouldError) {
      return throwError(() => new Error('Creation failed'));
    }
    return of(project);
  }
}
```

**When to use:** Need to verify method calls, simulate errors, or track state.

---

### Comparison Example

**Testing same component with different approaches:**

```typescript
// Option 1: Stub (simplest)
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      {provide: ClusterService, useValue: {
        list: () => of([cluster1, cluster2])
      }}
    ]
  });
});
// Good for: Simple cases where you just need data

// Option 2: Spy (real object)
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [ClusterService]  // Real service
  });
  const service = TestBed.inject(ClusterService);
  spyOn(service, 'list').and.returnValue(of([cluster1, cluster2]));
});
// Good for: Testing real service logic with controlled side effects

// Option 3: Mock (custom class)
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      {provide: ClusterService, useClass: ClusterMockService}
    ]
  });
});
// Good for: Complex scenarios, error testing, call tracking
```

---

## Performance Tips

### 1. Reduce Change Detection Calls

❌ **SLOW** - Excessive detectChanges:

```typescript
it('should update multiple fields', () => {
  component.name = 'test';
  fixture.detectChanges();  // Detection #1

  component.description = 'desc';
  fixture.detectChanges();  // Detection #2

  component.enabled = true;
  fixture.detectChanges();  // Detection #3
});
```

✅ **FAST** - Single detection after all updates:

```typescript
it('should update multiple fields', () => {
  component.name = 'test';
  component.description = 'desc';
  component.enabled = true;
  fixture.detectChanges();  // Single detection
});
```

---

### 2. Use fakeAsync Instead of setTimeout

❌ **SLOW** - Real timeouts in tests:

```typescript
it('should debounce search input', (done) => {
  component.search('query');
  setTimeout(() => {
    expect(mockService.search).toHaveBeenCalled();
    done();
  }, 500);  // Real 500ms wait!
});
```

✅ **FAST** - Controlled time with fakeAsync:

```typescript
it('should debounce search input', fakeAsync(() => {
  component.search('query');
  tick(500);  // Instant time advancement
  expect(mockService.search).toHaveBeenCalled();
}));
```

**Savings:** 500ms per test × 1000+ tests = 8+ minutes saved!

---

### 3. Avoid Unnecessary Material Module Imports

❌ **SLOW** - Import all Material modules:

```typescript
TestBed.configureTestingModule({
  imports: [
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatDialogModule,
    MatMenuModule,
    // ... 20+ more modules
  ]
});
```

✅ **FAST** - Import only what's needed:

```typescript
TestBed.configureTestingModule({
  imports: [
    MatButtonModule,  // Used in template
    MatInputModule,   // Used in template
    NoopAnimationsModule  // One line instead of importing MatAnimationsModule
  ]
});
```

Or use helper:

```typescript
TestBed.configureTestingModule({
  ...TestBedSetup.configureBasicComponentTest()
});
```

---

### 4. Use NO_ERRORS_SCHEMA for Complex Templates

❌ **SLOW** - Template won't compile:

```typescript
TestBed.configureTestingModule({
  declarations: [MyComponent, UnrelatedComponent1, UnrelatedComponent2, ...],
  imports: [Module1, Module2, Module3, ...]  // Heavy dependencies
});
```

✅ **FAST** - Ignore unknown elements:

```typescript
TestBed.configureTestingModule({
  declarations: [MyComponent],
  imports: [ReactiveFormsModule],
  schemas: [NO_ERRORS_SCHEMA]  // Ignore unknown elements
});
```

---

### 5. Lazy-Load Heavy Modules

❌ **SLOW** - Load MatDialog for every test:

```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [MatDialogModule, MatFormFieldModule, MatTableModule, ...]
  });
});
```

✅ **FAST** - Import only in describe blocks that need it:

```typescript
describe('ProjectListComponent', () => {
  describe('Dialog Interactions', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [MatDialogModule]
      });
    });
    // Tests here can use MatDialog
  });

  describe('List Display', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [MatTableModule]
      });
    });
    // Tests here use only MatTable
  });
});
```

---

### 6. Profile Test Execution

```bash
# Show test execution times
npm test -- --verbose

# Identify slowest tests
npm test -- --listTests | while read test; do
  time npm test "$test" 2>/dev/null
done
```

---

## Debugging Failing Tests

### 1. Use `fdescribe` and `fit` to Isolate Tests

When a test fails, isolate it:

```typescript
// Run only this describe block
fdescribe('ProjectComponent', () => {
  // Only tests in this block run
});

// OR run only this test
fit('should load projects', () => {
  // Only this test runs
});

// Remove f to run all tests again
describe('ProjectComponent', () => { ... });
```

---

### 2. Log Component State

```typescript
it('should update after click', () => {
  FixtureHelper.triggerClick(fixture, '[data-cy="submit"]');
  fixture.detectChanges();

  // Debug output
  console.log('Form value:', component.form.value);
  console.log('Component state:', component);
  console.log('DOM content:', fixture.nativeElement.innerHTML);

  expect(component.submitted).toBe(true);
});
```

---

### 3. Check Form Validation

```typescript
it('form should be valid', () => {
  component.form.patchValue({
    name: 'test',
    email: 'test@example.com'
  });

  // Debug form state
  console.log('Form errors:', component.form.errors);
  console.log('Name control errors:', component.form.get('name')?.errors);
  console.log('Email control errors:', component.form.get('email')?.errors);
  console.log('Form valid:', component.form.valid);

  expect(component.form.valid).toBe(true);
});
```

---

### 4. Verify Mock Was Called Correctly

```typescript
it('should call service with correct parameters', () => {
  component.createProject({name: 'test', namespace: 'ns-test'});

  // Debug spy calls
  console.log('Create called:', mockService.create.calls.count());
  console.log('Call args:', mockService.create.calls.mostRecent().args);
  console.log('All calls:', mockService.create.calls.all());

  expect(mockService.create).toHaveBeenCalledWith(
    expect.objectContaining({name: 'test'})
  );
});
```

---

### 5. Check Observable Emissions

```typescript
it('should emit project list', fakeAsync(() => {
  let result: Project[];

  component.projects$.subscribe(projects => {
    console.log('Emitted projects:', projects);
    result = projects;
  });

  tick();

  expect(result).toEqual([project1, project2]);
}));
```

---

### 6. Examine DOM Structure

```typescript
it('should render list items', () => {
  component.items = [item1, item2, item3];
  fixture.detectChanges();

  // Debug DOM
  console.log('Full HTML:', fixture.nativeElement.innerHTML);
  console.log('Items count:', FixtureHelper.querySelectorAll(fixture, '.item').length);
  console.log('First item text:', FixtureHelper.getText(fixture, '.item'));

  expect(component.items.length).toBe(3);
});
```

---

## Code Review Checklist

Use this checklist when reviewing test code:

### Test Structure
- [ ] Test name clearly describes behavior: "should X when Y"
- [ ] Uses Arrange-Act-Assert pattern (or clear sections)
- [ ] Single responsibility: one concept tested
- [ ] Independent from other tests

### Component Testing
- [ ] `detectChanges()` called after input changes
- [ ] Form controls marked as touched before checking errors
- [ ] Child components tested via @Input/@Output contract, not internal state
- [ ] DOM queries use data-cy attributes (not implementation selectors)
- [ ] All subscriptions cleaned up in afterEach or via fixture.destroy()

### Service & API Testing
- [ ] HTTP requests verified with correct URL and method
- [ ] Request parameters/headers validated
- [ ] Error scenarios tested (404, 401, 500, timeout)
- [ ] Observable completion tested
- [ ] No deprecated async patterns (async/fakeAsync without tick)

### Form Testing
- [ ] Validation tested for each field
- [ ] Form enables/disables correctly based on validity
- [ ] Submit calls service with correct payload
- [ ] Validation errors displayed after touch
- [ ] Form reset clears values and touched state

### Mocking
- [ ] Appropriate tool used (stub/spy/mock)
- [ ] Mock has only necessary methods implemented
- [ ] No over-mocking simple objects
- [ ] Error scenarios mocked for failure tests
- [ ] Mock resets between tests if stateful

### Async Operations
- [ ] Uses fakeAsync + tick (not real timeouts)
- [ ] Observable subscriptions cleaned up
- [ ] Promises handled with async/await or .then()
- [ ] Change detection happens after async operations
- [ ] No memory leaks from unsubscribed observables

### Debugging & Maintainability
- [ ] No hard-coded test data (use factories)
- [ ] Meaningful variable names
- [ ] Comments explain non-obvious behavior
- [ ] No console.log() left behind
- [ ] Uses shared test utilities (FixtureHelper, TestBedSetup)

### Performance
- [ ] No real setTimeout/setInterval (use fakeAsync)
- [ ] Minimal number of detectChanges() calls
- [ ] Only necessary Material modules imported
- [ ] NO_ERRORS_SCHEMA used when appropriate
- [ ] Heavy computations not repeated in loop

### Edge Cases & Error Handling
- [ ] Null/undefined inputs handled
- [ ] Empty arrays/lists tested
- [ ] Large datasets tested (pagination, virtualization)
- [ ] Network errors tested
- [ ] Permission errors tested
- [ ] Concurrent operations tested

---

## Quick Reference: Common Testing Patterns

### Test a Button Click

```typescript
it('should delete when delete button clicked', () => {
  // Arrange
  const deleteButton = FixtureHelper.querySelector(
    fixture,
    '[data-cy="delete-button"]'
  );

  // Act
  FixtureHelper.triggerClick(fixture, deleteButton);
  fixture.detectChanges();

  // Assert
  expect(mockService.delete).toHaveBeenCalled();
});
```

### Test Form Validation

```typescript
it('should require email field', () => {
  component.form.get('email').setValue('');
  component.form.get('email').markAsTouched();
  fixture.detectChanges();

  expect(component.form.get('email').hasError('required')).toBe(true);
});
```

### Test Observable Resolution

```typescript
it('should display data from service', fakeAsync(() => {
  component.ngOnInit();
  tick();
  fixture.detectChanges();

  expect(component.data).toEqual(mockData);
}));
```

### Test Dialog Opening

```typescript
it('should open dialog on action', () => {
  FixtureHelper.triggerClick(fixture, '[data-cy="open-dialog"]');

  expect(mockDialogService.open).toHaveBeenCalledWith(
    MyDialogComponent,
    expect.any(Object)
  );
});
```

### Test Error Display

```typescript
it('should show error message when service fails', fakeAsync(() => {
  mockService.create.and.returnValue(
    throwError(() => new Error('Creation failed'))
  );

  component.create();
  tick();
  fixture.detectChanges();

  expect(FixtureHelper.getText(fixture, '.error-message'))
    .toContain('Creation failed');
}));
```

---

## Summary

Well-maintained tests are:
- **Clear** - Purpose evident from test name and structure
- **Independent** - Run in any order without side effects
- **Fast** - Use fakeAsync, minimal change detection
- **Focused** - One concept per test
- **Maintainable** - Use factories, avoid implementation details
- **Debuggable** - Clear failures with helpful logs

Apply these practices consistently to build a reliable, sustainable test suite.

---

**Related Documentation:**
- [[TESTING-PATTERNS]] - Detailed testing patterns and examples
- [[MOCK-SERVICES-REFERENCE]] - Mock service implementations
- [[COMPREHENSIVE-COVERAGE-REPORT]] - Coverage metrics and analysis
