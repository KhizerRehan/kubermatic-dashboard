---
type: reference
title: Test Troubleshooting and Debugging Guide
created: 2026-03-05
tags:
  - testing
  - debugging
  - jest
  - troubleshooting
  - error-handling
related:
  - '[[README]]'
  - '[[TESTING-PATTERNS]]'
  - '[[TEST-PERFORMANCE]]'
  - '[[EXAMPLE-SNIPPETS]]'
---

# Test Troubleshooting and Debugging Guide

This document provides practical solutions for diagnosing and fixing common test failures, debugging techniques, and strategies for addressing intermittent or flaky tests in the Kubermatic Dashboard test suite.

## Table of Contents

1. [Overview](#overview)
2. [Common Test Failures and Solutions](#common-test-failures-and-solutions)
3. [Using Chrome DevTools to Debug Tests](#using-chrome-devtools-to-debug-tests)
4. [Using Jest Debugging with VS Code](#using-jest-debugging-with-vs-code)
5. [Console Logging and Debugging Techniques](#console-logging-and-debugging-techniques)
6. [Common Mistakes and How to Fix Them](#common-mistakes-and-how-to-fix-them)
7. [Flaky and Intermittent Test Failures](#flaky-and-intermittent-test-failures)
8. [When to Reach Out for Help](#when-to-reach-out-for-help)

---

## Overview

### Why Tests Fail

Test failures can occur for many reasons:
- ✅ **Missing Dependencies** - Services, modules, or utilities not provided
- ✅ **Timing Issues** - Async operations not properly awaited
- ✅ **Change Detection** - Components not re-rendering on data changes
- ✅ **Routing Problems** - Routes not configured correctly
- ✅ **DOM Queries** - Elements not found or in unexpected state
- ✅ **Mock Data Issues** - Incorrect mock return values or incomplete mocks
- ✅ **Environmental Issues** - Global state, browser APIs, or timing

### Debugging Process

Follow this systematic approach:

1. **Read the Error Message** - Often the first line tells you what's wrong
2. **Check the Stack Trace** - Find the exact line causing the issue
3. **Reproduce Locally** - Run the test in isolation
4. **Add Logging** - Use console.log or debugger to inspect state
5. **Check Dependencies** - Verify all required services are mocked
6. **Review Test Setup** - Ensure TestBed configuration is complete
7. **Ask for Help** - Reach out if stuck for more than 15 minutes

---

## Common Test Failures and Solutions

### 1. "Cannot find module" Errors

#### Symptoms

```
Error: Cannot find module '@app/shared/entity/cluster'
  at Module._resolveFilename (internal/modules/commonjs/loader.js:...)
```

#### Common Causes

- **Path aliases not configured** - TypeScript path aliases missing or misconfigured
- **Incorrect import path** - Wrong path or module not exported
- **Module not installed** - Missing npm dependency
- **Wrong file extension** - Missing `.ts` extension or importing directory without `index.ts`

#### Solutions

**Check TypeScript Path Aliases:**

```typescript
// ❌ DON'T - Use relative paths
import { ClusterEntity } from '../../../shared/entity/cluster';

// ✅ DO - Use configured path aliases
import { Cluster } from '@shared/entity/cluster';
```

Path aliases configured in `jest.config.cjs`:
```javascript
moduleNameMapper: {
  '^@app/(.*)$': '<rootDir>/src/app/$1',
  '^@core/(.*)$': '<rootDir>/src/app/core/$1',
  '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
  '^@test/(.*)$': '<rootDir>/src/test/$1',
  '^@environments/(.*)$': '<rootDir>/src/environments/$1',
}
```

**Verify Module Exports:**

```typescript
// ✅ CORRECT - Named export
export class ClusterService { }

// ✅ CORRECT - Re-export from index.ts
export * from './cluster.service';

// ❌ INCORRECT - Missing export
class ClusterService { }
```

**Check npm Dependencies:**

```bash
# List installed dependencies
npm list @angular/core

# Install missing dependencies
npm install

# Clean install if cache is corrupted
rm -rf node_modules package-lock.json && npm install
```

**Verify File Exists:**

```bash
# Check if file exists
ls -la src/app/shared/entity/cluster.ts

# List directory contents
ls src/app/shared/entity/
```

---

### 2. "Cannot Match Any Routes" Errors

#### Symptoms

```
Error: Cannot match any routes.
  URL Segment: 'projects/test-project/clusters'
```

#### Common Causes

- **Routes not configured in TestBed** - RouterTestingModule not set up
- **Route parameters missing** - activatedRoute.params not mocked
- **Lazy-loaded modules not provided** - Child routes not loaded in test
- **Incorrect route path** - Route definition doesn't match navigation

#### Solutions

**Configure RouterTestingModule:**

```typescript
// ❌ BEFORE
TestBed.configureTestingModule({
  imports: [MyComponent],
});

// ✅ AFTER
TestBed.configureTestingModule({
  imports: [MyComponent, RouterTestingModule],
});
```

**Mock Route Parameters:**

```typescript
import { ActivatedRoute } from '@angular/router';

// ❌ BEFORE - No route parameters
let component: ClusterListComponent;

// ✅ AFTER - Route parameters mocked
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [ClusterListComponent, RouterTestingModule],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          params: of({ projectID: 'test-project' }),
          snapshot: { params: { projectID: 'test-project' } },
        },
      },
    ],
  });
});
```

**Test Navigation:**

```typescript
it('should navigate to cluster details', fakeAsync(() => {
  const router = TestBed.inject(Router);
  const navigateSpy = spyOn(router, 'navigate');

  component.navigateToCluster('cluster-1');

  expect(navigateSpy).toHaveBeenCalledWith(
    ['/projects', 'test-project', 'clusters', 'cluster-1']
  );
}));
```

**Check Route Configuration:**

```typescript
// In your component/module
{
  path: 'clusters',
  component: ClusterListComponent,
},
{
  path: 'clusters/:clusterID',
  component: ClusterDetailComponent,
}
```

---

### 3. "No Provider For Service" Errors

#### Symptoms

```
Error: NullInjectorError: R3InjectorError(DynamicTestModule)
  [ClusterService -> HttpClient -> HttpClient]:
  NullInjectorError: No provider for HttpClient!
```

#### Common Causes

- **Required dependency not provided** - Service needs HttpClient but it's not in TestBed
- **Module import missing** - HttpClientModule not imported
- **Wrong mock provided** - Real service used instead of mock
- **Service not added to providers** - Service not registered in TestBed

#### Solutions

**Identify Missing Dependencies:**

When you see "NullInjectorError", the format is: `[ServiceA -> ServiceB -> ServiceC]`, showing the dependency chain.

**Add Required Modules:**

```typescript
// ❌ BEFORE
TestBed.configureTestingModule({
  declarations: [MyComponent],
});

// ✅ AFTER
TestBed.configureTestingModule({
  declarations: [MyComponent],
  imports: [HttpClientModule],
  providers: [ClusterService],
});
```

**Mock Dependencies Properly:**

```typescript
@Injectable()
export class ClusterServiceMock {
  getClusters() {
    return of([]);
  }
}

// In TestBed
TestBed.configureTestingModule({
  providers: [
    { provide: ClusterService, useClass: ClusterServiceMock },
  ],
});
```

**Use TestBedSetup Helper:**

```typescript
import { TestBedSetup } from '@test/utils/test-bed-setup';

beforeEach(() => {
  TestBedSetup.configureComponentWithServices({
    declarations: [MyComponent],
    providers: [
      { provide: ClusterService, useClass: ClusterServiceMock },
    ],
  });
});
```

**Check Circular Dependencies:**

```typescript
// ❌ PROBLEM - Circular dependency
// auth.service.ts
constructor(private http: HttpClient, private appConfig: AppConfigService) {}

// app-config.service.ts
constructor(private auth: AuthService) {}  // Circular!

// ✅ SOLUTION - Use lazy injection or refactor
constructor(
  private http: HttpClient,
  private injector: Injector
) {
  // Lazy inject to break cycle
  this.auth = () => this.injector.get(AuthService);
}
```

---

### 4. Timeout Errors in Async Tests

#### Symptoms

```
TypeError: Expected async test to complete within 5000 ms
```

or

```
FAIL src/app/component.spec.ts
  ● should fetch data
    Timeout - Async callback was not invoked within 5000ms
```

#### Common Causes

- **Async operation not awaited** - Promise or Observable not properly handled
- **Change detection not triggered** - `fixture.detectChanges()` or `tick()` missing
- **HTTP request not flushed** - `httpController.flush()` not called
- **Missing timer advancement** - `fakeAsync` and `tick()` needed
- **Unresolved Promises** - Promise-based operations not completed

#### Solutions

**Use waitForAsync for async operations:**

```typescript
// ❌ BEFORE - Test completes before async operation
it('should load data', () => {
  component.loadData();
  expect(component.data).toBeDefined();  // Fails! Data not loaded yet
});

// ✅ AFTER - Wait for async operation
import { waitForAsync } from '@angular/core/testing';

it('should load data', waitForAsync(() => {
  component.loadData();
  tick();  // Advance async queue
  expect(component.data).toBeDefined();
}));
```

**Use fakeAsync and tick for timers:**

```typescript
import { fakeAsync, tick } from '@angular/core/testing';

it('should debounce search', fakeAsync(() => {
  component.searchText = 'cluster';
  component.onSearchInput();

  tick(300);  // Advance timer by 300ms

  expect(component.searchResults.length).toBeGreaterThan(0);
  expect(apiService.search).toHaveBeenCalled();
}));
```

**Flush HTTP requests properly:**

```typescript
import { HttpTestingController } from '@angular/common/http/testing';

it('should fetch clusters', () => {
  const httpController = TestBed.inject(HttpTestingController);

  service.getClusters().subscribe(clusters => {
    expect(clusters.length).toBe(2);
  });

  // ✅ Respond to HTTP request
  const req = httpController.expectOne('/api/clusters');
  req.flush([{ id: '1' }, { id: '2' }]);

  httpController.verify();
});
```

**Verify all async operations completed:**

```typescript
it('should complete all async operations', fakeAsync(() => {
  component.initialize();

  tick();  // Tick once to process initial async
  fixture.detectChanges();

  tick(1000);  // Tick for timers
  fixture.detectChanges();

  // Verify state
  expect(component.isLoaded).toBe(true);
}));
```

**Increase timeout for slow operations:**

```typescript
it('should handle slow operations', waitForAsync(() => {
  service.slowOperation().subscribe(result => {
    expect(result).toBeDefined();
  });

  tick(10000);  // 10 second timeout
}), 15000);  // Test timeout of 15 seconds
```

---

### 5. Flaky and Intermittent Test Failures

#### Symptoms

- Tests pass sometimes, fail other times
- No change to code but tests fail randomly
- Tests pass individually but fail in full suite run
- Timing-dependent failures (race conditions)

#### Common Causes

- **Uninitialized variables** - Global state or shared test data
- **Async operations not properly sequenced** - Race conditions
- **Dependent tests** - Tests relying on execution order
- **Timing assumptions** - Hardcoded delays or timeout values
- **Missing unsubscribes** - Observable subscriptions leak between tests
- **DOM state not cleared** - HTML changes persisting between tests
- **Random test ordering** - Tests passing in one order but not another

#### Solutions

**Isolate test state with beforeEach:**

```typescript
// ❌ PROBLEM - Shared state between tests
describe('ClusterService', () => {
  let service: ClusterService;
  let clusters = [];  // Shared state!

  it('should add cluster', () => {
    clusters.push({ id: '1' });
    expect(clusters.length).toBe(1);
  });

  it('should have empty clusters', () => {
    expect(clusters.length).toBe(0);  // Fails! State from previous test
  });
});

// ✅ SOLUTION - Reset state in beforeEach
describe('ClusterService', () => {
  let service: ClusterService;
  let clusters: any[];

  beforeEach(() => {
    clusters = [];
    service = new ClusterService();
  });

  it('should add cluster', () => {
    clusters.push({ id: '1' });
    expect(clusters.length).toBe(1);
  });

  it('should have empty clusters', () => {
    expect(clusters.length).toBe(0);  // Passes! Fresh state
  });
});
```

**Unsubscribe from Observables:**

```typescript
// ❌ PROBLEM - Subscriptions leak between tests
describe('ClusterService', () => {
  it('should emit updates', () => {
    service.clusters$.subscribe(clusters => {
      // Subscription never unsubscribed!
    });
  });
});

// ✅ SOLUTION - Unsubscribe in afterEach
describe('ClusterService', () => {
  const destroy$ = new Subject<void>();

  afterEach(() => {
    destroy$.next();
    destroy$.complete();
  });

  it('should emit updates', () => {
    service.clusters$
      .pipe(takeUntil(destroy$))
      .subscribe(clusters => {
        // Cleanup handled automatically
      });
  });
});
```

**Use async/waitForAsync instead of hardcoded delays:**

```typescript
// ❌ PROBLEM - Hardcoded delay (unreliable)
it('should load data', (done) => {
  component.loadData();
  setTimeout(() => {
    expect(component.data).toBeDefined();
    done();
  }, 100);
});

// ✅ SOLUTION - Use async helpers
it('should load data', waitForAsync(() => {
  component.loadData();
  tick();
  expect(component.data).toBeDefined();
}));
```

**Test randomization awareness:**

```bash
# Run tests in random order to catch order dependencies
npm test -- --testSequencer='jest-sequencer-random'

# Or use Jest's randomization
npm test -- --randomizeTests
```

**Use marble testing for complex async scenarios:**

```typescript
import { hot, cold, expectObservable, expectSubscriptions } from 'jest-marbles';

it('should handle concurrent requests correctly', () => {
  const request1$ = cold('-a|', { a: 'cluster1' });
  const request2$ = cold('-b|', { b: 'cluster2' });

  const result$ = merge(request1$, request2$);

  expectObservable(result$).toBe('-(ab)|');
});
```

**Document timing-critical expectations:**

```typescript
// Clearly document why specific timing is needed
it('should debounce search input', fakeAsync(() => {
  // Search is debounced for 300ms to reduce API calls
  // This must be tested with fakeAsync to avoid timing issues

  component.searchText = 'test';
  component.onSearchInput();

  expect(apiService.search).not.toHaveBeenCalled();

  tick(300);  // Advance past debounce delay

  expect(apiService.search).toHaveBeenCalled();
}));
```

---

## Using Chrome DevTools to Debug Tests

### Running Tests with Chrome DevTools Integration

Jest can run tests in Chromium and pause execution, allowing you to use Chrome DevTools for debugging.

#### Setup Browser Debugging

```bash
# Run tests with browser debugging enabled
node --inspect-brk node_modules/jest/bin/jest.js --runInBand

# Then open Chrome and navigate to: chrome://inspect
```

#### Step-by-Step Debugging

1. **Start with inspect flag:**
   ```bash
   node --inspect-brk node_modules/jest/bin/jest.js --runInBand --testPathPattern=cluster.spec.ts
   ```

2. **Open Chrome DevTools:**
   - Navigate to `chrome://inspect` in Chrome
   - Click "inspect" under the Jest process

3. **Use DevTools Inspector:**
   - Set breakpoints by clicking line numbers
   - View local variables in scope panel
   - Execute expressions in Console tab
   - Step through code (F10, F11, Shift+F11)

#### Debugging with VS Code Integrated Terminal

If debugging in VS Code:

1. **Set breakpoint** - Click left margin in editor
2. **Start debugging** - Use Run > Start Debugging
3. **Configure launch.json:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Jest Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--testPathPattern=${relativeFile}"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Inspecting Component State

Use browser console to inspect component state during debugging:

```typescript
// In test or console during debugging
const component = fixture.componentInstance;
console.log('Component data:', component.data);
console.log('Form value:', component.form.getRawValue());
console.log('Component inputs:', component.clusters);

// Check Angular properties
console.log('Change detector status:', fixture.debugElement.componentInstance);
```

### Debugging DOM State

```typescript
// Get rendered HTML
const html = fixture.nativeElement.innerHTML;
console.log('Rendered HTML:', html);

// Check specific element
const button = fixture.nativeElement.querySelector('[data-cy="submit-btn"]');
console.log('Button disabled:', button.disabled);
console.log('Button text:', button.textContent);
console.log('Button visible:', window.getComputedStyle(button).display !== 'none');
```

---

## Using Jest Debugging with VS Code

### Debugging Tests in VS Code

#### Method 1: Using debugger statement

```typescript
it('should handle form submission', () => {
  component.form.patchValue({ name: 'Test' });

  debugger;  // Execution pauses here

  component.onSubmit();

  expect(apiService.create).toHaveBeenCalled();
});
```

#### Method 2: Using VS Code Debugger

**Configure .vscode/launch.json:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Debug",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--testPathPattern=${relativeFile}",
        "--runInBand",
        "--no-coverage"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

**Set breakpoints:**
1. Click on line number to set breakpoint (red dot appears)
2. Press F5 or Run > Start Debugging
3. Test execution pauses at breakpoint
4. Use Debug sidebar to:
   - Step over (F10)
   - Step into (F11)
   - Step out (Shift+F11)
   - Continue (F5)

#### Method 3: Using npm script with inspect

```bash
# Add to package.json
"test:debug": "node --inspect-brk node_modules/.bin/jest --testPathPattern=cluster --runInBand"

# Run and inspect in DevTools
npm run test:debug
```

### Debugging Specific Test Files

```typescript
// Run single test with focus
describe.only('ClusterService', () => {
  // Only this describe block runs
});

it.only('should load clusters', () => {
  // Only this test runs
});

// Temporarily skip tests during debugging
it.skip('should handle errors', () => {
  // This test is skipped
});
```

---

## Console Logging and Debugging Techniques

### Strategic Logging

Place logs at key points to understand execution flow:

```typescript
it('should process clusters', () => {
  console.log('Test start');

  component.clusters = mockClusters;
  console.log('Mock clusters set:', component.clusters);

  fixture.detectChanges();
  console.log('Change detection triggered');

  component.onClusterSelect('cluster-1');
  console.log('Cluster selected:', component.selectedCluster);

  expect(component.selectedCluster.id).toBe('cluster-1');
  console.log('Test passed');
});
```

### Logging Observable Values

```typescript
it('should emit cluster updates', () => {
  service.clusters$.subscribe(clusters => {
    console.log('Received clusters:', clusters);
  });

  service.refresh();
});
```

### Logging Form State

```typescript
it('should validate form', () => {
  const form = component.form;

  // Log initial state
  console.log('Initial form value:', form.getRawValue());
  console.log('Initial valid:', form.valid);

  // Set values and log
  form.patchValue({ name: 'Test' });
  console.log('After patch:', form.getRawValue());
  console.log('Name control status:', form.get('name')?.status);

  // Log all errors
  Object.keys(form.controls).forEach(key => {
    const control = form.get(key);
    if (control?.errors) {
      console.log(`${key} errors:`, control.errors);
    }
  });
});
```

### Logging HTTP Requests/Responses

```typescript
it('should fetch with correct headers', () => {
  const httpController = TestBed.inject(HttpTestingController);

  service.getClusters().subscribe();

  const req = httpController.expectOne('/api/clusters');
  console.log('Request method:', req.request.method);
  console.log('Request headers:', req.request.headers.keys());
  console.log('Request body:', req.request.body);

  req.flush([{ id: '1' }]);
});
```

### Structured Logging for Complex Scenarios

```typescript
function logTestState(label: string, component: any, service: any) {
  console.group(label);
  console.log('Component state:', {
    data: component.data,
    isLoading: component.isLoading,
    error: component.error,
  });
  console.log('Service state:', {
    cacheSize: service._cache?.size,
    lastRequest: service._lastRequest,
  });
  console.groupEnd();
}

it('should handle loading states', () => {
  logTestState('Initial state', component, service);

  component.loadData();
  logTestState('After loadData', component, service);

  tick();
  fixture.detectChanges();
  logTestState('After tick and detectChanges', component, service);
});
```

### Clean Logging Output

```typescript
// Format objects for better console readability
console.table(clusters);  // Table format for arrays

// Use console groups for organization
console.group('API Service Tests');
console.log('GET request test');
console.log('POST request test');
console.groupEnd();

// Use console styles in some environments
console.log('%cTest passed', 'color: green; font-weight: bold;');
console.log('%cTest failed', 'color: red; font-weight: bold;');
```

---

## Common Mistakes and How to Fix Them

### Mistake 1: Forgetting fixture.detectChanges()

**Problem:**
```typescript
// ❌ Component initialization skipped
it('should render cluster name', () => {
  component.cluster = { id: '1', name: 'Test' };

  const name = fixture.nativeElement.querySelector('.name');
  expect(name.textContent).toBe('Test');  // FAILS: Text is empty
});
```

**Solution:**
```typescript
// ✅ Trigger change detection
it('should render cluster name', () => {
  component.cluster = { id: '1', name: 'Test' };

  fixture.detectChanges();  // ← Add this

  const name = fixture.nativeElement.querySelector('.name');
  expect(name.textContent).toBe('Test');  // PASSES
});
```

### Mistake 2: Not handling Observable subscriptions

**Problem:**
```typescript
// ❌ Observable subscription never completes
it('should load on init', () => {
  spyOn(service, 'getClusters').and.returnValue(of([{ id: '1' }]));

  component.ngOnInit();

  expect(component.clusters).toEqual([{ id: '1' }]);  // May fail if timing off
});
```

**Solution:**
```typescript
// ✅ Use waitForAsync and tick
it('should load on init', waitForAsync(() => {
  spyOn(service, 'getClusters').and.returnValue(of([{ id: '1' }]));

  component.ngOnInit();
  tick();  // Wait for Observable to emit

  expect(component.clusters).toEqual([{ id: '1' }]);  // PASSES
}));
```

### Mistake 3: Incomplete mocks

**Problem:**
```typescript
// ❌ Mock doesn't implement all methods
class ClusterServiceMock {
  getClusters() {
    return of([]);
  }
  // Missing: updateCluster(), deleteCluster(), etc.
}

// Component calls updateCluster()
it('should update cluster', () => {
  component.updateCluster({ id: '1', name: 'Updated' });
  // FAILS: updateCluster is not a function
});
```

**Solution:**
```typescript
// ✅ Complete mock with all methods
class ClusterServiceMock {
  getClusters = jasmine.createSpy('getClusters').and.returnValue(of([]));
  updateCluster = jasmine.createSpy('updateCluster').and.returnValue(of({}));
  deleteCluster = jasmine.createSpy('deleteCluster').and.returnValue(of(void 0));
}
```

### Mistake 4: Testing implementation instead of behavior

**Problem:**
```typescript
// ❌ Testing internal details
it('should call _refreshData', () => {
  spyOn(service, '_refreshData');

  component.onRefresh();

  expect(service._refreshData).toHaveBeenCalled();
});
```

**Solution:**
```typescript
// ✅ Test observable behavior
it('should emit refreshed data', () => {
  const mockClusters = [{ id: '1' }];
  spyOn(service, 'getClusters').and.returnValue(of(mockClusters));

  component.onRefresh();

  expect(component.clusters).toEqual(mockClusters);
});
```

### Mistake 5: Async test timeout

**Problem:**
```typescript
// ❌ Async test without proper handling
it('should load async data', (done) => {
  service.getClusters().subscribe(clusters => {
    expect(clusters.length).toBeGreaterThan(0);
    // Forgot to call done()!
  });
});
```

**Solution:**
```typescript
// ✅ Use waitForAsync or proper async handling
it('should load async data', waitForAsync(() => {
  service.getClusters().subscribe(clusters => {
    expect(clusters.length).toBeGreaterThan(0);
  });
  tick();
}));

// Or properly call done()
it('should load async data', (done) => {
  service.getClusters().subscribe(clusters => {
    expect(clusters.length).toBeGreaterThan(0);
    done();  // ← Don't forget!
  });
});
```

---

## When to Reach Out for Help

### Troubleshooting Checklist

Before asking for help, work through this checklist:

- [ ] Read error message fully and search for the exact error text online
- [ ] Check test file has all required imports
- [ ] Verify TestBed has all required providers and imports
- [ ] Try running test in isolation: `npm test -- specific.spec.ts`
- [ ] Check if test passes when run alone but fails in full suite
- [ ] Try clearing node_modules and reinstalling: `rm -rf node_modules && npm install`
- [ ] Review similar tests in codebase for patterns
- [ ] Check TESTING-PATTERNS.md for relevant patterns
- [ ] Add console.log statements to understand execution flow
- [ ] Use debugger statement and inspect state

### Getting Help

**For questions about testing:**
- Check the [Kubermatic Dashboard Testing Documentation](README.md)
- Review example tests in [EXAMPLE-SNIPPETS.md](EXAMPLE-SNIPPETS.md)
- Study patterns in [TESTING-PATTERNS.md](TESTING-PATTERNS.md)

**For specific issues:**

1. **Gather information:**
   - Full error message (with stack trace)
   - Steps to reproduce
   - Test file content
   - Related source code
   - Environment (Node version, npm version, OS)

2. **Create minimal example:**
   ```typescript
   // Simplified test that shows the issue
   describe('Issue', () => {
     it('reproduces the problem', () => {
       // Minimal code to show failure
     });
   });
   ```

3. **Share in appropriate channel:**
   - Slack: #testing-questions
   - Email: testing-team@kubermatic.com
   - GitHub Issue: With `[test]` label
   - PR Review: If found during code review

### Common Support Scenarios

**Scenario 1: "My test works locally but fails in CI"**
- Check environment differences (Node version, npm cache)
- Run with `--maxWorkers=1` to simulate serial execution
- Check for hardcoded paths or file assumptions
- Verify all mock data is deterministic (no random values)

**Scenario 2: "Test passes when run alone but fails with others"**
- Check for shared state (global variables, singleton state)
- Ensure beforeEach/afterEach cleanup is complete
- Use `beforeAll`/`afterAll` only for expensive setup
- Check test isolation settings

**Scenario 3: "Flaky test that fails intermittently"**
- Add logging to understand race conditions
- Check for uncontrolled async operations
- Use `fakeAsync`/`tick` instead of real timers
- Check subscription cleanup

**Scenario 4: "Performance - tests run slowly"**
- Check [TEST-PERFORMANCE.md](TEST-PERFORMANCE.md) guide
- Review TestBed configuration
- Check for unnecessary imports or compilation
- Look for slow mocks or network operations

---

## Quick Reference

### Common Test Patterns

```bash
# Run single test file
npm test -- src/app/cluster/component.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="should load"

# Debug test
node --inspect-brk node_modules/.bin/jest --testPathPattern=cluster --runInBand

# Generate coverage report
npm run test:ci

# Update snapshots
npm test -- --updateSnapshot
```

### Import Common Test Utilities

```typescript
import { TestBed, ComponentFixture, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TestBedSetup } from '@test/utils/test-bed-setup';
import { FixtureHelper } from '@test/utils/fixture-helper';
```

### Common Assertions

```typescript
// Existence
expect(component).toBeTruthy();
expect(component.clusters).toBeDefined();

// Equality
expect(component.selectedId).toBe('123');
expect(component.clusters).toEqual([{ id: '1' }]);

// Collections
expect(component.clusters).toContain({ id: '1' });
expect(component.clusters.length).toBe(1);

// Functions
expect(service.refresh).toHaveBeenCalled();
expect(service.refresh).toHaveBeenCalledWith('cluster-1');

// DOM
expect(fixture.nativeElement.querySelector('.name')).toBeTruthy();
expect(button.disabled).toBe(false);
```

---

## Summary

Effective debugging requires:
1. **Understanding the error** - Read error messages carefully
2. **Isolating the problem** - Run test in isolation, add logging
3. **Knowing your tools** - Master VS Code debugger, Chrome DevTools, console logging
4. **Following patterns** - Use established testing patterns from codebase
5. **Getting help** - Know when to reach out with complete information

Remember: Good test code is debuggable code. Write clear tests with good names and comments that make failures obvious when they occur.
