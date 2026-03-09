# Test Utilities

Reusable helper classes for Angular unit tests in the Kubermatic Dashboard. All utilities live in `src/test/utils/` and reduce boilerplate in component, service, and form tests.

---

## Table of Contents

- [HttpMockBuilder](#httpmockbuilder)
- [FixtureHelper](#fixturehelper)
- [FormBuilderHelper](#formbuilderhelper)
- [ChangeDetectionHelper](#changedetectionhelper)
- [MockObservableBuilder](#mockobservablebuilder)
- [TestBedSetup](#testbedsetup)
- [click / ButtonClickEvents](#click--buttonclickevents)
- [Running the Tests](#running-the-tests)

---

## HttpMockBuilder

**File:** `http-mock-builder.ts`

Simplifies HTTP request mocking with `HttpTestingController`. Wraps the common pattern of expecting a request, flushing a response, and verifying behavior.

### Setup

```typescript
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {HttpMockBuilder} from '@test/utils/http-mock-builder';

let httpMock: HttpTestingController;
let builder: HttpMockBuilder;

beforeEach(() => {
  TestBed.configureTestingModule({imports: [HttpClientTestingModule]});
  httpMock = TestBed.inject(HttpTestingController);
  builder = new HttpMockBuilder(httpMock);
});

afterEach(() => {
  httpMock.verify(); // ensure no outstanding requests
});
```

### Methods

| Method | Description |
|--------|-------------|
| `expectGetRequest(url, data?, status?)` | Intercept a GET and flush a response |
| `expectPostRequest(url, data?, body?, status?)` | Intercept a POST and optionally verify body |
| `expectPutRequest(url, data?, body?, status?)` | Intercept a PUT and optionally verify body |
| `expectDeleteRequest(url, data?, status?)` | Intercept a DELETE and flush a response |
| `expectRequest(method, url, data?, status?)` | Generic method for any HTTP verb |
| `verifyRequestParams(url, params)` | Assert query parameters on a pending request |
| `verifyRequestHeaders(url, headers)` | Assert headers on a pending request |
| `verifyNoOutstandingRequests()` | Assert all expected requests were handled |
| `createErrorResponse(status, message?)` | Create a reusable error response object |
| `createSuccessResponse(data, status?)` | Create a reusable success response object |

### Examples

```typescript
// Success GET
builder.expectGetRequest('/api/v2/projects', [{id: 'p1', name: 'My Project'}]);

// 404 Not Found
builder.expectGetRequest('/api/v2/projects/missing', null, 404);

// POST with body verification
builder.expectPostRequest('/api/v2/projects', {id: 'new'}, {name: 'New Project'});

// PATCH via generic method
builder.expectRequest('PATCH', '/api/v2/clusters/abc', {status: 'updated'});

// Verify query params
builder.verifyRequestParams('/api/v2/clusters?page=2', {page: '2'});
```

---

## FixtureHelper

**File:** `fixture-helper.ts`

Static utilities for querying DOM elements and triggering events on `ComponentFixture`.

### Methods

| Method | Description |
|--------|-------------|
| `getComponent<T>(fixture)` | Returns the typed component instance |
| `querySelector(fixture, selector)` | Queries a single DOM element |
| `querySelectorAll(fixture, selector)` | Queries all matching DOM elements |
| `triggerClick(fixture, selector)` | Dispatches a click event on an element |
| `triggerInputChange(fixture, selector, value)` | Sets input value and dispatches `input` event |
| `isVisible(fixture, selector)` | Returns `true` if the element exists in DOM |
| `isDisabled(fixture, selector)` | Returns `true` if the element is disabled |

### Examples

```typescript
import {FixtureHelper} from '@test/utils/fixture-helper';

const component = FixtureHelper.getComponent(fixture);
const button = FixtureHelper.querySelector(fixture, 'button[data-cy="save"]');
const items = FixtureHelper.querySelectorAll(fixture, '.cluster-item');

FixtureHelper.triggerClick(fixture, 'button.primary');
FixtureHelper.triggerInputChange(fixture, 'input[name="name"]', 'my-cluster');

expect(FixtureHelper.isVisible(fixture, '.success-banner')).toBe(true);
expect(FixtureHelper.isDisabled(fixture, 'button[type="submit"]')).toBe(false);
```

---

## FormBuilderHelper

**File:** `form-builder-helper.ts`

Static utilities for creating and manipulating Angular reactive forms in tests.

### Methods

| Method | Description |
|--------|-------------|
| `createFormWithValidation(config)` | Creates a `FormGroup` from a config object |
| `setControlValue(form, name, value, touch?)` | Sets a control value; optionally marks touched |
| `getControlValue<T>(form, name)` | Returns a typed control value |
| `markControlAsTouched(form, name)` | Marks a single control as touched |
| `markAsTouched(form)` | Marks all controls as touched |
| `markAsDirty(form)` | Marks all controls as dirty |

### Examples

```typescript
import {FormBuilderHelper} from '@test/utils/form-builder-helper';

const form = FormBuilderHelper.createFormWithValidation({
  name:  ['', [Validators.required]],
  email: ['', [Validators.required, Validators.email]],
});

FormBuilderHelper.setControlValue(form, 'name', 'my-cluster');
FormBuilderHelper.setControlValue(form, 'email', 'bad', true); // also marks touched

FormBuilderHelper.markAsTouched(form); // simulate submit attempt

const name = FormBuilderHelper.getControlValue<string>(form, 'name');
expect(name).toBe('my-cluster');
expect(form.get('email')?.hasError('email')).toBe(true);
```

---

## ChangeDetectionHelper

**File:** `change-detection-helper.ts`

Utilities for testing `ChangeDetectionStrategy.OnPush` components and managing change detection in tests.

### Methods

| Method | Description |
|--------|-------------|
| `detectChanges(fixture, async?)` | Calls `fixture.detectChanges()`, optionally with `tick()` |
| `markForCheck(component)` | Calls `ChangeDetectorRef.markForCheck()` on the component |
| `hasOnPushStrategy(component)` | Returns `true` if the component uses `OnPush` strategy |
| `setInputAndDetect(fixture, component, inputs)` | Applies `@Input()` values and triggers detection |

### Examples

```typescript
import {ChangeDetectionHelper} from '@test/utils/change-detection-helper';

// Basic detection
ChangeDetectionHelper.detectChanges(fixture);

// With async flushing (inside fakeAsync)
it('should resolve async', fakeAsync(() => {
  component.loadData();
  ChangeDetectionHelper.detectChanges(fixture, true);
  expect(component.data).toBeDefined();
}));

// Verify OnPush
expect(ChangeDetectionHelper.hasOnPushStrategy(component)).toBe(true);

// Set inputs and detect
ChangeDetectionHelper.setInputAndDetect(fixture, component, {clusters: mockClusters});
```

---

## MockObservableBuilder

**File:** `mock-observable-builder.ts`

Factory methods for creating `Observable` mocks with controlled emission patterns.

### Methods

| Method | Description |
|--------|-------------|
| `success<T>(data, delayMs?)` | Observable that emits `data` and completes |
| `error<T>(error, delayMs?)` | Observable that emits an error |
| `timeout<T>()` | Observable that never emits (`NEVER`) |
| `createSubject<T>()` | Returns a `Subject` for manual control |

### Examples

```typescript
import {MockObservableBuilder} from '@test/utils/mock-observable-builder';

// Mock service returning data
const clusters$ = MockObservableBuilder.success([{id: 'c1'}]);
jest.spyOn(clusterService, 'projectClusterList').mockReturnValue(clusters$);

// Simulate API error
const error$ = MockObservableBuilder.error(new Error('403 Forbidden'));

// Simulate loading state (never resolves)
const loading$ = MockObservableBuilder.timeout();

// Manual control with Subject
const subject = MockObservableBuilder.createSubject<string>();
subject.next('value-1');
subject.next('value-2');
subject.complete();
```

---

## TestBedSetup

**File:** `test-bed-setup.ts`

Factory methods for common `TestBed.configureTestingModule()` configurations.

### Methods

| Method | Description |
|--------|-------------|
| `configureBasicComponentTest(config)` | Minimal setup: `BrowserModule` + `NoopAnimationsModule` |
| `configureComponentWithServices(config)` | Adds `HttpClientModule` + `HttpTestingController` support |

Both methods accept `{ imports?, declarations?, providers?, teardown? }`.

### Examples

```typescript
import {TestBedSetup} from '@test/utils/test-bed-setup';

// Simple component
TestBedSetup.configureBasicComponentTest({
  imports: [SharedModule],
  declarations: [MyComponent],
});

// Component with HTTP dependencies
TestBedSetup.configureComponentWithServices({
  imports: [SharedModule],
  declarations: [ClusterListComponent],
  providers: [
    {provide: ClusterService, useClass: ClusterServiceMock},
  ],
});

const fixture = TestBed.createComponent(MyComponent);
```

---

## click / ButtonClickEvents

**File:** `click-handler.ts`

Simple helpers for triggering click events on `DebugElement` or `HTMLElement`.

### API

```typescript
ButtonClickEvents.left  // { button: 0 }
ButtonClickEvents.right // { button: 2 }

click(el: DebugElement | HTMLElement, eventObj?)
```

### Examples

```typescript
import {click, ButtonClickEvents} from '@test/utils/click-handler';

// Left-click (default)
click(fixture.debugElement.query(By.css('button')));

// Right-click
click(fixture.debugElement.query(By.css('button')), ButtonClickEvents.right);

// Native element
click(fixture.nativeElement.querySelector('button.delete'));
```

---

## Running the Tests

All utilities have corresponding `.spec.ts` files. Run them from `modules/web/`:

```bash
# Run all util tests
npx jest --testPathPattern="src/test/utils"

# Run a specific file
npx jest --testPathPattern="http-mock-builder"
npx jest --testPathPattern="fixture-helper"
npx jest --testPathPattern="form-builder-helper"
npx jest --testPathPattern="change-detection-helper"
npx jest --testPathPattern="mock-observable-builder"
npx jest --testPathPattern="test-bed-setup"

# Run a specific describe block
npx jest --testPathPattern="http-mock-builder" -t "expectGetRequest"
npx jest --testPathPattern="http-mock-builder" -t "Integration scenarios"

# Watch mode
npx jest --testPathPattern="src/test/utils" --watch

# With coverage
npx jest --testPathPattern="src/test/utils" --coverage
```


npx jest --testPathPattern="wizard/step/applications" -t "ApplicationsStepComponent"

# Run just "Application Methods"
npx jest --testPathPattern="wizard/step/applications" -t "Application Methods"

# Run a specific nested describe
npx jest --testPathPattern="wizard/step/applications" -t "onApplicationAdded"

# Run a single test by its full description chain
npx jest --testPathPattern="wizard/step/applications" -t "Application Methods > ApplicationMethods"

npx jest --testPathPattern="wizard/step/applications" -t "ApplicationMethods"