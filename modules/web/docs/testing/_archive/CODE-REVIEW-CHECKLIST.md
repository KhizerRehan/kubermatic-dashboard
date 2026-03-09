---
type: reference
title: Code Review Checklist for Tests
created: 2026-03-05
tags:
  - testing
  - code-review
  - quality-assurance
  - jest
  - practices
related:
  - '[[TESTING-BEST-PRACTICES]]'
  - '[[TESTING-PATTERNS]]'
  - '[[ADVANCED-TESTING-PATTERNS]]'
---

# Code Review Checklist for Tests

This guide provides code reviewers with comprehensive checklists for evaluating test quality, coverage adequacy, and component testability. Use this document when reviewing pull requests that contain test code or new components.

**Target Audience:** Code reviewers, tech leads, QA engineers
**Scope:** Jest unit tests, test utilities, and component testability review

---

## Table of Contents

1. [Test Code Review Checklist](#test-code-review-checklist)
2. [Test Coverage Adequacy](#test-coverage-adequacy)
3. [Test Naming Conventions](#test-naming-conventions)
4. [Common Test Issues to Watch For](#common-test-issues-to-watch-for)
5. [Performance Considerations](#performance-considerations)
6. [Documentation Requirements](#documentation-requirements)
7. [Component Testability Review](#component-testability-review)
8. [Review Decision Guide](#review-decision-guide)

---

## Test Code Review Checklist

Use this checklist when reviewing PR that includes new or modified test files (`.spec.ts`).

### Structure & Setup

- [ ] Test file has a descriptive `describe()` block matching the component/service name
  - ✅ Good: `describe('ClusterDeleteComponent', () => { ... })`
  - ❌ Bad: `describe('Delete', () => { ... })`

- [ ] `beforeEach()` block properly initializes TestBed for all tests
  - ✅ TestBed configuration matches component dependencies
  - ✅ Common setup is in `beforeEach()`, not repeated in each test
  - ✅ Services are properly mocked or injected
  - ❌ Async setup (`async()` or `fakeAsync()`) used only when necessary

- [ ] `afterEach()` block includes cleanup where needed
  - ✅ HttpTestingController verification: `httpController.verify()`
  - ✅ Subscription cleanup for observable tests
  - ✅ Timer cleanup: `flush()` or `discardPeriodicTasks()` in fakeAsync tests

- [ ] Test isolation is maintained
  - ✅ Each test is independent and doesn't depend on other tests running first
  - ✅ No shared state between tests (state reset in `beforeEach()`)
  - ✅ Mocks are reset or fresh instances created for each test

### Change Detection & Input Handling

- [ ] `fixture.detectChanges()` is called after setting component properties
  - ✅ Called after each `@Input` property assignment
  - ✅ Called before checking DOM elements in components with OnPush strategy
  - ❌ Missing when component uses OnPush change detection strategy

- [ ] Form control interactions properly simulate user behavior
  - ✅ `setValue()` + `markAsTouched()` for form validation tests
  - ✅ `dispatchEvent()` or helper functions for user input simulation
  - ✅ Uses `detectChanges()` after form interactions
  - ❌ Testing form state without marking controls as touched

- [ ] Async operations properly handled
  - ✅ `fakeAsync()` and `tick()` for timer-based code (RxJS operators)
  - ✅ `async()` and `whenStable()` for promises
  - ✅ Or use Jasmine's `done` callback
  - ✅ Observable subscriptions properly unwound
  - ❌ Race conditions in async tests (non-deterministic timing)

### Mocking & Dependencies

- [ ] All service dependencies are properly mocked
  - ✅ Mock services return `Observable` with test data
  - ✅ Mocks implement the interface expected by component
  - ✅ Uses existing mock services from `src/test/services/`
  - ❌ Creating one-off mocks when reusable mock exists
  - ❌ Passing real services into test components (too much integration)

- [ ] HTTP calls properly intercepted
  - ✅ `HttpTestingController` used for API calls
  - ✅ All expected requests are explicitly matched and responded to
  - ✅ `httpController.verify()` called in `afterEach()`
  - ❌ Real HTTP requests being made in tests
  - ❌ Unmatched HTTP requests left hanging

- [ ] Mock data is representative and realistic
  - ✅ Mocks contain realistic field values
  - ✅ Mocks test both happy path and edge cases
  - ✅ Empty arrays and null values tested where applicable
  - ❌ Overly simplified mock data that doesn't match real data structure

- [ ] Dialog and modal interactions properly mocked
  - ✅ `MatDialog.open()` calls mocked with test data
  - ✅ Dialog result handling verified
  - ✅ Close/dismiss flows tested
  - ❌ Testing actual dialog component behavior (should test separately)

### Assertions & Expectations

- [ ] Assertions are clear and specific
  - ✅ `expect(value).toBe(expected)` for simple values
  - ✅ `expect(value).toEqual(expected)` for objects/arrays
  - ✅ `expect(element.textContent).toContain('Expected text')` for DOM
  - ❌ Vague expectations: `expect(result).toBeTruthy()`
  - ❌ Multiple assertions testing unrelated things in one test

- [ ] Error handling is tested
  - ✅ Error cases explicitly tested
  - ✅ Error messages verified
  - ✅ Error recovery tested (if applicable)
  - ❌ Only testing happy path
  - ❌ Assertions that don't verify error state

- [ ] Edge cases are covered
  - ✅ Empty inputs/arrays handled
  - ✅ Null/undefined values tested
  - ✅ Boundary conditions tested
  - ✅ Long strings, large arrays, special characters tested
  - ❌ Only typical/normal cases tested

- [ ] Observable/async behavior properly verified
  - ✅ Observable completion tested
  - ✅ Emitted values verified in order
  - ✅ Error emissions tested
  - ✅ Subscription count reasonable (not memory leaks)
  - ❌ Observable behavior not verified
  - ❌ Assuming observable completion without testing

### Code Quality

- [ ] No console.log() or debug code left in tests
  - ✅ Clean test output
  - ✅ All debugging removed before review
  - ❌ `console.log()`, `debugger`, or `.skip()` left in code

- [ ] Tests are not overly complex
  - ✅ Each test has single responsibility
  - ✅ Complex scenarios broken into multiple tests
  - ✅ Helper functions extracted for repeated setup
  - ❌ 100+ line test methods
  - ❌ Tests that do multiple unrelated things

- [ ] Test names accurately describe what is tested
  - ✅ Descriptive test names (see Test Naming Conventions section)
  - ✅ Names start with "should" or "it" prefix
  - ✅ Names describe expected behavior, not implementation
  - ❌ Generic names like "test1", "works", "component test"

- [ ] Dead code is not present
  - ✅ All variables and imports are used
  - ✅ Unused mocks or test helpers removed
  - ❌ Commented-out test code
  - ❌ Unused imports or variables

---

## Test Coverage Adequacy

### What Constitutes Adequate Test Coverage?

Coverage metrics should be evaluated alongside practical importance. A component with 90% line coverage but missing critical edge cases is inadequate, while a simple utility with 100% coverage might be over-tested.

### Coverage Goals by Component Type

#### Shared Components (Critical)
- **Target:** 80-100% line coverage
- **Required Coverage:**
  - All user interactions (click, input, selection)
  - All conditional rendering paths (v-if, ngIf)
  - All input property combinations
  - All output events
  - Error states and loading states
  - Edge cases: empty arrays, null values, very long strings

**Example Breakdown for Modal Component:**
```
✅ Modal opens (trigger click) → 100% of open logic tested
✅ Modal closes (close button, cancel, outside click)
✅ Data passed via @Input is displayed
✅ User actions emit via @Output correctly
✅ Keyboard events (escape key) handled
✅ Animation states tested
❌ CSS styling (not needed - styling tested via e2e)
❌ Accessibility attributes (WAI-ARIA tested separately)
```

#### Feature/Page Components (Important)
- **Target:** 70-90% line coverage
- **Required Coverage:**
  - Happy path workflows (50% of coverage effort)
  - Error handling and failure states (30%)
  - Edge cases and boundary conditions (20%)
  - Loading states, empty states
  - Permission/authorization checks (if applicable)

**Example for Cluster Creation Page:**
```
✅ Form displays all fields with correct defaults
✅ Form validation works for each field
✅ Submit creates cluster and calls API
✅ Error response shown to user
✅ Loading indicator displayed during submission
✅ User can cancel and go back
❌ Deep testing of wizard sub-steps (tested separately)
❌ Styling and animation states
```

#### Services (High Priority)
- **Target:** 85-100% line coverage
- **Required Coverage:**
  - All public methods
  - Happy path and error paths
  - Observable emissions and completions
  - Cache behavior (if applicable)
  - All conditional logic branches
  - HTTP error handling

**Example for ClusterService:**
```
✅ getClusters() returns cluster list
✅ HTTP error triggers notification
✅ Observable cache shared across subscribers
✅ Cache invalidated on update
✅ Timer-based refresh works
✅ Manual refresh via Subject works
❌ Private helper methods (tested indirectly via public methods)
```

#### Directives & Pipes (Moderate)
- **Target:** 85-95% line coverage
- **Required Coverage:**
  - All input combinations
  - Edge cases (null, undefined, empty string)
  - Transformation accuracy
  - Error handling

#### Utility Functions (Moderate)
- **Target:** 80-100% line coverage (vary by criticality)
- **Required Coverage:**
  - All code paths
  - Boundary conditions
  - Edge cases

### Coverage Anti-Patterns to Avoid

❌ **Chasing 100% coverage:**
- ✅ Focus on meaningful coverage (important code paths)
- ❌ Don't test every line if it's not critical
- ❌ Testing private methods directly (test through public API)

❌ **Testing implementation details:**
- ✅ Test behavior and outputs
- ❌ Don't test that a specific service method was called (test the result)
- ❌ Don't test component properties (test DOM output)

❌ **Overly broad test assertions:**
- ✅ Test specific behaviors
- ❌ Single test that tests 10 different things (split into 10 tests)

❌ **Inadequate edge case coverage:**
- ✅ Test boundaries: empty arrays, null values, extreme sizes
- ❌ Only testing the "happy path"

---

## Test Naming Conventions

### File Naming

✅ **Correct:**
```
component.spec.ts       (matches component.ts)
service.spec.ts         (matches service.ts)
form.spec.ts            (matches form.ts)
```

❌ **Incorrect:**
```
component.test.ts
component-test.ts
componentTest.ts
test-component.ts
```

### Describe Block Naming

✅ **Correct:**
```typescript
describe('ClusterDeleteComponent', () => { ... })
describe('ProjectService', () => { ... })
describe('emailValidator', () => { ... })
```

The describe block name should match the actual class/function name.

### Test Case Naming

Test names should follow the pattern:
```
should [expected behavior] [when condition]
```

✅ **Good Examples:**
```typescript
it('should display cluster name in title', () => { ... })
it('should disable submit button when form is invalid', () => { ... })
it('should call API with correct parameters when user clicks create', () => { ... })
it('should show error message when API returns 403', () => { ... })
it('should clear form when modal is closed', () => { ... })
it('should emit selectedCluster when row is clicked', () => { ... })
it('should not display quota section when quotas are disabled', () => { ... })
it('should handle null value gracefully', () => { ... })
```

❌ **Bad Examples:**
```typescript
it('test cluster deletion', () => { ... })           // Too vague
it('works', () => { ... })                          // What works?
it('component test', () => { ... })                 // Not descriptive
it('ClusterDeleteComponent', () => { ... })         // Use describe for this
it('should work', () => { ... })                    // Too generic
it('deletes cluster', () => { ... })                // Missing context
it('test 1', () => { ... })                         // Not descriptive
```

### Nested Describe Blocks (for complex components)

When testing multiple features within one component, use nested describes:

```typescript
describe('ClusterDetailComponent', () => {
  describe('display', () => {
    it('should show cluster name in title', () => { ... })
    it('should show cluster status badge', () => { ... })
  })

  describe('edit functionality', () => {
    it('should enable edit button when authorized', () => { ... })
    it('should open edit dialog on button click', () => { ... })
  })

  describe('delete functionality', () => {
    it('should show confirmation dialog before delete', () => { ... })
    it('should delete cluster when confirmed', () => { ... })
    it('should show error if delete fails', () => { ... })
  })
})
```

---

## Common Test Issues to Watch For

### Issue 1: Race Conditions in Async Tests

**Symptom:** Test passes sometimes but fails randomly (flaky test)

**Root Cause:** Not properly waiting for async operations to complete

❌ **WRONG:**
```typescript
it('should fetch clusters', (done) => {
  service.fetchClusters();
  setTimeout(() => {  // Unreliable timing
    expect(result).toBeDefined();
    done();
  }, 100);
});
```

✅ **RIGHT:**
```typescript
it('should fetch clusters', fakeAsync(() => {
  service.fetchClusters();
  tick();  // Wait for all pending timers
  expect(result).toBeDefined();
}));

// OR use async/whenStable:
it('should fetch clusters', async () => {
  await service.fetchClusters();
  fixture.whenStable().then(() => {
    expect(result).toBeDefined();
  });
});
```

### Issue 2: Memory Leaks from Subscriptions

**Symptom:** Tests pass individually but fail when run together; test suite gets slower

**Root Cause:** Observable subscriptions not properly unsubscribed

❌ **WRONG:**
```typescript
it('should update on value change', () => {
  service.values$.subscribe(val => {
    expect(val).toBeDefined();
  });
  // Subscription never unsubscribed
});
```

✅ **RIGHT:**
```typescript
it('should update on value change', () => {
  const subscription = service.values$.subscribe(val => {
    expect(val).toBeDefined();
  });
  subscription.unsubscribe();  // Clean up
});

// OR use takeUntil pattern:
it('should update on value change', () => {
  const destroy$ = new Subject<void>();
  service.values$.pipe(takeUntil(destroy$)).subscribe(val => {
    expect(val).toBeDefined();
  });
  destroy$.next();
  destroy$.complete();
});
```

### Issue 3: Incomplete HTTP Mock Setup

**Symptom:** "no matching requests for pending request" errors during test

**Root Cause:** Not all HTTP requests matched with `expectOne()` or `expectNone()`

❌ **WRONG:**
```typescript
it('should create cluster', () => {
  service.createCluster(data);
  // Forgot to mock the HTTP POST request
  expect(result).toBeDefined();  // FAILS: HTTP request still pending
});
```

✅ **RIGHT:**
```typescript
it('should create cluster', () => {
  service.createCluster(data);
  const req = httpMock.expectOne('/api/clusters');
  req.flush({id: '123'});  // Respond to HTTP request
  expect(result).toBeDefined();
});
```

### Issue 4: Testing Implementation Instead of Behavior

**Symptom:** Tests break when refactoring internal implementation (even if behavior stays same)

**Root Cause:** Testing private implementation details instead of public contract

❌ **WRONG:**
```typescript
it('should process data', () => {
  component.data = testData;
  expect(component._internalCache).toEqual(expected);  // Testing private property
  expect(component._processDataHelper).toHaveBeenCalled();  // Testing private method
});
```

✅ **RIGHT:**
```typescript
it('should display processed data', () => {
  component.data = testData;
  fixture.detectChanges();
  expect(element.textContent).toContain('Expected value');  // Test output
});
```

### Issue 5: OnPush Change Detection Not Triggered

**Symptom:** Expected DOM updates not appearing in tests

**Root Cause:** Not calling `fixture.detectChanges()` after changing inputs

❌ **WRONG:**
```typescript
it('should display user name', () => {
  component.user = {name: 'Alice'};
  // detectChanges not called - OnPush components won't update
  expect(element.textContent).toContain('Alice');  // FAILS
});
```

✅ **RIGHT:**
```typescript
it('should display user name', () => {
  component.user = {name: 'Alice'};
  fixture.detectChanges();  // Critical for OnPush!
  expect(element.textContent).toContain('Alice');  // PASSES
});
```

### Issue 6: Mocking Too Broadly

**Symptom:** Tests pass but real code fails; false confidence in test coverage

**Root Cause:** Mocking real implementation when testing edge cases

❌ **WRONG:**
```typescript
it('should handle errors', () => {
  const mockService = jasmine.createSpyObj('UserService', ['getUser']);
  // Mock returns success, but want to test error handling
  mockService.getUser.and.returnValue(of({name: 'Alice'}));

  component.loadUser();
  expect(something).toBeDefined();  // Test passes but doesn't test error
});
```

✅ **RIGHT:**
```typescript
it('should display error message on failure', () => {
  const mockService = jasmine.createSpyObj('UserService', ['getUser']);
  mockService.getUser.and.returnValue(throwError({status: 500}));  // Error case

  component.loadUser();
  fixture.detectChanges();
  expect(element.textContent).toContain('Error loading user');  // Real error handling
});
```

### Issue 7: Inconsistent Test Data

**Symptom:** Tests work with one data set but fail with another; unreliable test

**Root Cause:** Using arbitrary or incomplete mock data

❌ **WRONG:**
```typescript
const mockCluster = {
  name: 'test',
  // Missing required fields like spec, status, metadata
};
```

✅ **RIGHT:**
```typescript
const mockCluster = {
  id: '123',
  name: 'test-cluster',
  spec: { /* required spec fields */ },
  status: { /* required status fields */ },
  metadata: { /* required metadata */ },
};
```

---

## Performance Considerations

### Test Execution Time

**Target:** Full test suite completes in under 5 minutes

### Identifying Slow Tests

```bash
# Run tests with timing information
npm test -- --verbose

# Look for tests taking >500ms
```

### Common Performance Issues

#### 1. Excessive TestBed Configuration

❌ **WRONG:** Full Angular Material setup for every test
```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [
      BrowserModule,
      CommonModule,
      HttpClientModule,
      MatMenuModule,
      MatButtonModule,
      MatIconModule,
      MatTooltipModule,
      // ... 20+ Material modules
      MatDatepickerModule,
      // ...
    ]
  });
});
```

✅ **RIGHT:** Only import what you need
```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [
      CommonModule,
      HttpClientTestingModule,
      MatButtonModule,  // Only what component uses
      MatIconModule,    // Only what component uses
    ]
  });
});
```

#### 2. Unnecessary Real Module Imports

❌ **WRONG:**
```typescript
TestBed.configureTestingModule({
  imports: [FullApplicationModule],  // Imports entire app
});
```

✅ **RIGHT:**
```typescript
TestBed.configureTestingModule({
  imports: [
    CommonModule,
    HttpClientTestingModule,
  ],
  declarations: [ComponentUnderTest],
  providers: [/* only needed services */],
});
```

#### 3. Large or Heavy Mock Data

❌ **WRONG:**
```typescript
const mockClusters = Array(10000).fill(null).map((_, i) => ({
  id: `cluster-${i}`,
  // ... heavy data
}));
```

✅ **RIGHT:**
```typescript
const mockClusters = [
  {id: '1', name: 'cluster-1'},
  {id: '2', name: 'cluster-2'},
  {id: '3', name: 'cluster-3'},
];
```

### Memory Usage Review

When reviewing tests, watch for:

- [ ] Creating new HttpTestingController instances (should reuse)
- [ ] Memory leaks from unsubscribed observables
- [ ] Large arrays or objects in test setup
- [ ] Repeated expensive operations in beforeEach

### Optimization Tips for Reviewers

**Suggestion 1:** If tests take >500ms, suggest breaking into smaller describe blocks
```typescript
// Instead of one large describe with 50 tests
describe('LargeComponent', () => { /* 50 tests */ })

// Split into focused describes
describe('LargeComponent - Display', () => { /* 15 tests */ })
describe('LargeComponent - Input Handling', () => { /* 15 tests */ })
describe('LargeComponent - Output Events', () => { /* 15 tests */ })
```

**Suggestion 2:** If setup is complex, suggest using test helper utilities
```typescript
// Instead of:
beforeEach(() => {
  component.form = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
    role: new FormControl(''),
    // ... 10 more controls
  });
});

// Use FormBuilderHelper:
beforeEach(() => {
  component.form = FormBuilderHelper.createFormWithValidation({
    name: [''],
    email: [''],
    role: [''],
  });
});
```

---

## Documentation Requirements

### JSDoc Comments for Complex Tests

Complex test logic should include documentation:

✅ **Well Documented:**
```typescript
/**
 * Verifies that the cluster creation form properly validates
 * machine deployment configurations and rejects invalid CIDR blocks.
 *
 * This test ensures the form uses the cidrValidator and displays
 * appropriate error messages to users.
 *
 * @see cidrValidator in shared/validators
 */
it('should validate machine network CIDR', () => {
  component.form.get('machineNetwork').setValue('192.168.1.0/24');
  expect(component.form.get('machineNetwork').valid).toBe(true);

  component.form.get('machineNetwork').setValue('invalid');
  expect(component.form.get('machineNetwork').hasError('invalidCIDR')).toBe(true);
});
```

❌ **Undocumented:**
```typescript
it('should validate machine network CIDR', () => {
  // No explanation of what's being tested or why
  component.form.get('machineNetwork').setValue('192.168.1.0/24');
  expect(component.form.get('machineNetwork').valid).toBe(true);
});
```

### Inline Comments for Non-Obvious Logic

```typescript
it('should debounce search input and emit after 300ms', fakeAsync(() => {
  // Type search term
  component.searchInput.setValue('kubernetes');
  fixture.detectChanges();

  // Advance time but not enough to trigger debounce
  tick(200);
  expect(component.searchResults).not.toBeDefined();

  // Cross debounce threshold
  tick(100);
  expect(component.searchResults).toBeDefined();
}));
```

### Test Utility Documentation

When creating custom test helpers or mocks, include clear documentation:

```typescript
/**
 * Helper for setting up TestBed with common configuration for
 * component testing. Reduces boilerplate across component tests.
 *
 * @param config Configuration options
 * @param config.imports Additional imports beyond CommonModule
 * @param config.declarations Components to declare
 * @param config.providers Services to provide
 *
 * @example
 * TestBedSetup.configureBasicComponentTest({
 *   imports: [MatButtonModule],
 *   declarations: [MyComponent],
 *   providers: [{provide: MyService, useClass: MyServiceMock}],
 * });
 */
export function configureBasicComponentTest(config: TestConfig) {
  // Implementation
}
```

### Linking to Related Documentation

Include references to testing guides and patterns:

```typescript
/**
 * Tests the async modal dialog behavior.
 *
 * References:
 * - ADVANCED-TESTING-PATTERNS.md - Dialog Testing Pattern
 * - MOCK-SERVICES-REFERENCE.md - MatDialogMock
 */
it('should open confirmation dialog', () => {
  // Test implementation
});
```

---

## Component Testability Review

When reviewing component code alongside tests, evaluate **testability**. A well-designed component is easier to test and usually has better architecture.

### Testability Red Flags

#### 1. Overly Complex Component Constructor

❌ **TESTABILITY ISSUE:**
```typescript
constructor(
  private service1: Service1,
  private service2: Service2,
  private service3: Service3,
  private http: HttpClient,
  private dialog: MatDialog,
  private router: Router,
  private route: ActivatedRoute,
  private cdr: ChangeDetectorRef,
  private notification: NotificationService,
  // ... 15+ dependencies
) { }
```

**Impact on Testing:** Requires mocking 15+ dependencies for simple unit tests

**Suggestion:** Consider service composition or dependency injection reorganization. Break component into smaller, focused components.

✅ **BETTER:**
```typescript
constructor(
  private clusterFacade: ClusterFacade,  // Aggregated service
  private dialog: MatDialog,
) { }
```

#### 2. Component Doing Too Many Things

❌ **TESTABILITY ISSUE:**
```typescript
export class ClusterPageComponent implements OnInit {
  // Handles:
  // - Data loading from API
  // - Filtering and sorting
  // - Dialog opening/closing
  // - Form validation
  // - Permission checking
  // - Error handling
  // - Analytics tracking
  // ... 500+ lines
}
```

**Impact on Testing:** Tests become complex, brittle, slow. Hard to test individual features.

**Suggestion:** Split into smaller components with single responsibilities:
```
ClusterPageComponent (container/smart component)
├── ClusterListComponent (presentation)
├── ClusterFilterComponent (presentation)
├── ClusterDetailComponent (presentation)
```

#### 3. Tight Coupling to External Services

❌ **TESTABILITY ISSUE:**
```typescript
export class UserProfileComponent {
  constructor(
    private http: HttpClient,  // Tightly coupled
    private analyticsService: AnalyticsService,  // Hard to mock
  ) { }

  loadUser() {
    this.http.get('/api/user').subscribe(user => {
      this.userData = user;
      this.analyticsService.trackUserLoad();  // Side effect in component
    });
  }
}
```

**Impact on Testing:** Must test HTTP and analytics together; can't isolate component logic

**Suggestion:** Inject a service that handles HTTP + analytics:
```typescript
export class UserProfileComponent {
  constructor(private userService: UserService) { }

  loadUser() {
    this.userService.loadUser().subscribe(user => {
      this.userData = user;
    });
  }
}
// UserService handles HTTP + analytics tracking internally
```

#### 4. Hardcoded Values or Constants

❌ **TESTABILITY ISSUE:**
```typescript
export class PaginationComponent {
  pageSize = 20;  // Hardcoded
  maxPages = 100; // Hardcoded

  get pages(): Array<number> {
    return Array(this.maxPages).fill(null).map((_, i) => i + 1);
  }
}
```

**Impact on Testing:** Can't test edge cases without modifying source code

**Suggestion:** Make configurable:
```typescript
export class PaginationComponent {
  @Input() pageSize = 20;
  @Input() maxPages = 100;
}
```

#### 5. Change Detection Not Optimized

❌ **TESTABILITY ISSUE:**
```typescript
@Component({
  selector: 'km-list',
  template: '...',
  // No OnPush - default ChangeDetectionStrategy.Default
})
export class ListComponent { }
```

**Impact on Testing:** Tests run slower; change detection runs on every event (even unrelated ones)

**Suggestion:** Use OnPush for better performance and clearer dependency tracking:
```typescript
@Component({
  selector: 'km-list',
  template: '...',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent { }
```

#### 6. Large Inline Templates

❌ **TESTABILITY ISSUE:**
```typescript
@Component({
  selector: 'km-form',
  template: `
    <!-- 500+ lines of template inline -->
    <form [formGroup]="form">
      <!-- Complex conditional rendering -->
      <div *ngIf="condition1 && condition2 || condition3">
        <!-- Nested components, directives, pipes -->
      </div>
    </form>
  `
})
```

**Impact on Testing:** Hard to write focused tests; tests become fragile to small template changes

**Suggestion:** Extract to separate template file and break into sub-components:
```typescript
@Component({
  selector: 'km-form',
  templateUrl: './template.html',  // Separate file
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormComponent { }
```

### Testability Improvements to Request

When reviewing components, suggest these improvements:

| Issue | Impact | Suggested Fix |
|-------|--------|---------------|
| Too many constructor dependencies | Hard to test | Extract facade service |
| Mixed concerns (data + UI + business logic) | Brittle tests | Split into smart/dumb components |
| Hardcoded values | Limited test coverage | Add `@Input()` properties |
| Not using OnPush | Slow tests | Add `ChangeDetectionStrategy.OnPush` |
| Complex conditional logic in template | Hard to test template | Extract logic to component methods |
| Large component (500+ lines) | Hard to write tests | Break into smaller components |
| No dependency injection | Tight coupling | Inject dependencies |
| Tightly coupled to specific service | Hard to mock | Depend on interfaces, not implementations |

---

## Review Decision Guide

### When to APPROVE Tests

✅ **Approve when:**
- [ ] All test code review items checked off
- [ ] Coverage is adequate for component type
- [ ] Test names accurately describe behavior
- [ ] No obvious performance issues
- [ ] Mocks are realistic and reusable
- [ ] Tests verify actual behavior, not implementation details
- [ ] Error cases are tested
- [ ] Tests will likely catch real bugs in production

### When to REQUEST CHANGES

🔴 **Request changes when:**
- [ ] Critical test gaps (major functionality untested)
- [ ] Performance issue (test takes >1 second)
- [ ] Memory leak (unsubscribed observables, uncleaned resources)
- [ ] Flaky tests (race conditions, timing issues)
- [ ] Missing error handling tests
- [ ] Too much mocking (testing mocks, not real behavior)
- [ ] Unclear test names
- [ ] Implementation details tested instead of behavior
- [ ] OnPush components not handled properly

### When to COMMENT (Optional Suggestions)

💡 **Comment when:**
- [ ] Test could be more efficient
- [ ] Code reuse opportunity (helper function, existing mock)
- [ ] Testability improvement in accompanying component code
- [ ] Documentation could be clearer
- [ ] Edge cases could be added (if not blocking)
- [ ] Similar patterns used elsewhere in codebase

### Red Flags That Block Approval

🚫 **Do not approve if:**
- [ ] Test coverage drops for critical components
- [ ] Memory leak potential
- [ ] Tests depend on external state (other tests, timing)
- [ ] HTTP requests not properly mocked (real network calls)
- [ ] Sensitive data in test fixtures
- [ ] Test names don't match behavior
- [ ] Change detection strategy not considered
- [ ] Form validation tests don't mark controls as touched

---

## Related Testing Resources

- **[[TESTING-PATTERNS]]** - Common testing patterns and idioms
- **[[TESTING-BEST-PRACTICES]]** - Detailed best practices and anti-patterns
- **[[ADVANCED-TESTING-PATTERNS]]** - Complex scenarios and edge cases
- **[[MOCK-SERVICES-REFERENCE]]** - Complete mock service documentation
- **[[TEAM-ONBOARDING]]** - Team training and learning path

---

**Document Last Updated:** March 2026
**Scope:** Kubermatic Dashboard Jest Unit Tests
**Status:** Reference documentation for code reviewers
