---
type: reference
title: Test Maintenance Process Guide
created: 2026-03-05
tags:
  - testing
  - maintenance
  - ci-cd
  - team-processes
related:
  - '[[TESTING-BEST-PRACTICES]]'
  - '[[TESTING-PATTERNS]]'
  - '[[COMPREHENSIVE-COVERAGE-REPORT]]'
---

# Test Maintenance Process Guide

This guide establishes processes and responsibilities for keeping the Kubermatic Dashboard test suite healthy, up-to-date, and effective as the codebase evolves.

**Target Audience:** All developers, QA engineers, and technical leads
**Scope:** Unit tests (Jest), E2E tests (Cypress), and test infrastructure maintenance

---

## Table of Contents

1. [Overview](#overview)
2. [Daily Development Tasks](#daily-development-tasks)
3. [Code Review Checklist for Tests](#code-review-checklist-for-tests)
4. [Handling Test Failures](#handling-test-failures)
5. [Refactoring & Test Updates](#refactoring--test-updates)
6. [Regular Coverage Reviews](#regular-coverage-reviews)
7. [Team Responsibilities](#team-responsibilities)
8. [Tools & Commands Reference](#tools--commands-reference)
9. [Common Maintenance Scenarios](#common-maintenance-scenarios)
10. [Test Health Monitoring](#test-health-monitoring)

---

## Overview

The test suite is a critical asset that prevents regressions, documents behavior, and enables refactoring. Maintaining it requires:

- **Consistency:** Tests should follow established patterns (see `TESTING-BEST-PRACTICES.md`)
- **Accuracy:** Tests verify actual behavior, not implementation details
- **Efficiency:** Tests run quickly and provide clear failure messages
- **Coverage:** New code includes corresponding tests; existing tests are updated when behavior changes
- **Clarity:** Test names and logic are self-documenting

**Key Principle:** A broken test is a broken requirement. Always treat test failures with the same urgency as broken code.

---

## Daily Development Tasks

### When Writing New Code

1. **Create Tests First** (TDD Preferred)
   - Write test(s) before implementing feature
   - Test documents expected behavior
   - Implementation should make test pass

2. **Colocate Test Files**
   ```
   src/app/features/my-feature/
   ├── my-component.ts
   ├── my-component.html
   ├── my-component.scss
   └── my-component.spec.ts         ← Same directory
   ```

3. **Follow Naming Conventions**
   - Test file: `component-name.spec.ts` (not `component-name.test.ts`)
   - Test suite: `describe('ComponentName', () => { ... })`
   - Test case: `it('should [expected behavior]', () => { ... })`

4. **Minimum Coverage Requirements**
   - Components: Test rendered output, user interactions, lifecycle
   - Services: Test methods, error handling, subscription cleanup
   - Pipes: Test transformations for normal and edge cases
   - Directives: Test DOM manipulation, input binding

### When Modifying Existing Code

1. **Run Related Tests First**
   ```bash
   # Run tests for specific feature
   npm test -- path/to/feature

   # Run specific test file
   npm test -- component-name.spec.ts

   # Watch mode while developing
   npm run test:watch
   ```

2. **Update Tests When Behavior Changes**
   - If you change what a component/service does, update its tests
   - If tests fail, **don't skip or ignore them** — understand why
   - Update test data mocks if API response format changes

3. **Check Test Coverage**
   ```bash
   # Generate coverage for current changes
   npm run test:ci -- --coverage src/app/features/my-feature
   ```

4. **Before Committing**
   ```bash
   # Verify all tests pass
   npm test

   # Verify linting and code quality
   npm run check

   # Review coverage impact
   npm run test:ci -- --coverage
   ```

---

## Code Review Checklist for Tests

### For Code Reviewers

When reviewing pull requests, check test quality:

**Test Coverage**
- [ ] New functionality has corresponding tests
- [ ] Test names describe expected behavior (not implementation)
- [ ] Tests cover happy path AND error cases
- [ ] Edge cases and boundary conditions are tested
- [ ] Accessibility features tested (ARIA labels, keyboard nav)

**Test Quality**
- [ ] Tests use existing mocks/utilities (see `src/test/utils/`)
- [ ] Mock data is realistic and representative
- [ ] Tests don't check implementation details (private methods)
- [ ] No hard-coded delays or `setTimeout()`
- [ ] Proper cleanup in `afterEach()` (subscriptions, timers)

**Following Patterns**
- [ ] Component tests use `FixtureHelper` for DOM queries
- [ ] Service tests use `HttpTestingController` with `verify()`
- [ ] Form tests mark controls as touched before checking errors
- [ ] Observable tests use proper subscription cleanup
- [ ] Tests call `fixture.detectChanges()` after input changes

**Common Issues to Flag**
- ❌ Tests that always pass (no assertions, wrong expectations)
- ❌ Tests that ignore errors or use `catch(() => {})`
- ❌ Circular dependencies between tests
- ❌ Tests that depend on execution order
- ❌ Hard-coded timeouts (use `fakeAsync` and `tick()` instead)
- ❌ Tests with inconsistent data format (sometimes array, sometimes object)

### For Test Authors

Before submitting tests for review:

1. **Run Tests Locally**
   ```bash
   npm test -- your-feature.spec.ts
   npm run test:ci -- --coverage
   ```

2. **Verify Tests Pass in Isolation**
   ```bash
   # Check with focused test
   npm test -- --testNamePattern="your specific test"
   ```

3. **Review Coverage Report**
   - Look for uncovered branches
   - Ensure you're testing logic, not just happy paths

4. **Check for Common Mistakes**
   ```bash
   grep -n "setTimeout\|fit\|fdescribe\|\.only\|\.skip" your-feature.spec.ts
   ```

---

## Handling Test Failures

### Test Fails Locally During Development

**1. Understand the Failure**
```bash
# Run with verbose output
npm test -- your-feature.spec.ts --verbose

# Run specific test
npm test -- -t "should handle error correctly"

# Use debug output
npm test -- --detectOpenHandles
```

**2. Common Causes & Solutions**

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Expected undefined to be..." | Missing `fixture.detectChanges()` | Add after setting `@Input()` |
| Validation error shows but test fails | Control not marked as touched | Add `control.markAsTouched()` |
| "Cannot read property 'x' of undefined" | Mock not returning expected structure | Check mock implementation |
| "Async operation did not complete" | Subscription not completed in test | Use `fakeAsync()` or proper cleanup |
| "1 timer(s) still in the queue" | Interval/timer not cleared | Use `tick()` or cleanup timer |

**3. Debug Techniques**

```typescript
// Add logging
it('should handle state change', () => {
  const initialState = component.currentState;
  console.log('Initial:', initialState);  // ← Debug log

  component.updateState();
  fixture.detectChanges();

  console.log('After update:', component.currentState);  // ← Debug log
  expect(component.currentState).toBe('updated');
});

// Use fit() to run single test
fit('should handle state change', () => {  // ← Only this test runs
  // ...
});

// Use fdescribe() to run single suite
fdescribe('StateComponent', () => {  // ← Only this describe block runs
  // ...
});

// Inspect fixture
it('should render correctly', () => {
  fixture.detectChanges();
  console.log(fixture.debugElement.nativeElement.innerHTML);  // ← See HTML
});
```

**4. When Tests Pass Locally But Fail in CI**

Common causes:
- Different execution order in CI (tests depend on each other)
- Timing issues (async operations)
- Mocking not set up properly
- Environment-specific issues

Fix:
```bash
# Run in CI-like mode
npm run test:ci

# Run tests sequentially (CI default)
npm test -- -i

# Run single test file multiple times
for i in {1..5}; do npm test -- your-feature.spec.ts || break; done
```

### Test Fails in CI/CD Pipeline

**1. Investigate the Failure**
```bash
# Reproduce locally first
git checkout <branch-with-failure>
npm ci  # Use lock file exactly like CI
npm test

# If still failing, add debug output
# If passes locally, check CI environment differences
```

**2. Check CI Logs**
- Look for setup errors (missing mocks, environment variables)
- Check for timing-dependent issues
- Verify all dependencies installed (`npm ci` vs `npm install`)

**3. Temporary Workarounds (Avoid!)**
- ❌ Don't use `.skip()` to disable tests
- ❌ Don't increase timeouts to hide async issues
- ❌ Don't ignore errors in tests

**4. Proper Fixes**
- Fix the underlying issue (code or test)
- Add environment-specific setup if needed
- Improve test isolation/cleanup

### Test Flakiness (Intermittent Failures)

Flaky tests fail randomly without code changes. Root causes:
- Improper async handling (promises, observables not awaited)
- Race conditions (state changes before assertions)
- Timer-based logic without proper control
- Mocks returning inconsistent data

**Fix Flaky Tests**

```typescript
// ❌ Flaky: Async operation might not complete
it('should load data', (done) => {
  service.getData().subscribe(() => {
    expect(component.data).toBeDefined();
    done();
  });
});

// ✅ Fixed: Proper async handling
it('should load data', (done) => {
  service.getData().subscribe(
    (data) => {
      expect(data).toBeDefined();
      done();
    },
    (error) => {
      fail(`Should not error: ${error}`);
      done();
    }
  );
});

// ✅ Better: Using fakeAsync/tick
it('should load data', fakeAsync(() => {
  service.getData();
  tick();  // Wait for async operations
  expect(component.data).toBeDefined();
}));

// ❌ Flaky: Random delay
it('should update after request', (done) => {
  service.update().then(() => {
    setTimeout(() => {  // ← Random delay!
      expect(component.updated).toBe(true);
      done();
    }, 100);  // ← Might timeout on slow CI
  });
});

// ✅ Fixed: Deterministic timing
it('should update after request', (done) => {
  service.update().then(() => {
    fixture.detectChanges();  // ← Trigger change detection
    expect(component.updated).toBe(true);
    done();
  });
});
```

---

## Refactoring & Test Updates

### When Renaming Components/Services

1. **Update Import Statements in Tests**
   ```bash
   # Find all test files importing old name
   grep -r "import.*OldComponentName" src/app --include="*.spec.ts"

   # Update each file
   # from: import { OldComponentName } from './old-component.ts'
   # to:   import { NewComponentName } from './new-component.ts'
   ```

2. **Update Selector/Provider References**
   ```typescript
   // ❌ Old
   TestBed.configureTestingModule({
     declarations: [OldComponentName],
     providers: [{ provide: OldService, useClass: OldServiceMockService }],
   });

   // ✅ New
   TestBed.configureTestingModule({
     declarations: [NewComponentName],
     providers: [{ provide: NewService, useClass: NewServiceMockService }],
   });
   ```

3. **Run Tests to Verify Updates**
   ```bash
   npm test  # Verify all tests still pass
   ```

### When Changing API/Service Methods

1. **Update Mock Services**
   ```typescript
   // In src/test/services/mock-service.ts

   // ❌ Old signature
   getData(): Observable<Data> {
     return of(mockData);
   }

   // ✅ New signature (if changed in real service)
   getData(filter?: DataFilter): Observable<Data[]> {
     return of([mockData1, mockData2]);
   }
   ```

2. **Update Tests Using the Service**
   ```typescript
   // ❌ Old test
   it('should fetch data', () => {
     const data = service.getData();
     expect(data.name).toBe('Test');
   });

   // ✅ Updated test
   it('should fetch data', () => {
     const data$ = service.getData();
     data$.subscribe((data) => {
       expect(data[0].name).toBe('Test');
     });
   });
   ```

3. **Update HTTP Mocks**
   ```typescript
   // In tests using HttpTestingController

   // ❌ Old
   const req = httpMock.expectOne('/api/data');
   req.flush(mockData);

   // ✅ New (if endpoint changed)
   const req = httpMock.expectOne('/api/v2/data?filter=active');
   req.flush([mockData1, mockData2]);
   ```

### When Refactoring HTML Templates

1. **Update DOM Selectors in Tests**
   ```typescript
   // In component.spec.ts

   // ❌ Old (brittle CSS selector)
   const button = fixture.debugElement.query(By.css('div > button'));

   // ✅ New (robust data-cy attribute)
   const button = fixture.debugElement.query(By.css('[data-cy="submit-btn"]'));

   // Or use FixtureHelper
   const button = FixtureHelper.querySelector(fixture, '[data-cy="submit-btn"]');
   ```

2. **Verify All DOM Queries Still Work**
   ```bash
   # Run affected component tests
   npm test -- component-name.spec.ts
   ```

### When Modifying Form Validation

1. **Update Form Control Setup**
   ```typescript
   // ❌ Old
   form = this.fb.group({
     email: ['', Validators.required],
   });

   // ✅ New (added minLength)
   form = this.fb.group({
     email: ['', [Validators.required, Validators.minLength(5)]],
   });
   ```

2. **Add Tests for New Validation**
   ```typescript
   it('should validate email minLength', () => {
     const emailControl = component.form.get('email');
     emailControl.setValue('a@b');
     emailControl.markAsTouched();
     expect(emailControl.hasError('minlength')).toBe(true);
   });

   it('should accept valid email', () => {
     const emailControl = component.form.get('email');
     emailControl.setValue('user@example.com');
     expect(emailControl.valid).toBe(true);
   });
   ```

---

## Regular Coverage Reviews

### Weekly Coverage Check

Every week, check test health:

```bash
# Run full test suite with coverage
npm run test:ci

# Check coverage report in terminal output
# Look for files below 70% coverage
```

**Actions if Coverage Drops:**
1. Identify which files lost coverage
2. Review changes made that week
3. Add missing tests for new code
4. Update existing tests if behavior changed

### Monthly Coverage Review

1. **Generate Detailed Report**
   ```bash
   npm run test:ci -- --coverage

   # Output in: coverage/lcov-report/index.html
   # Open in browser to see visual coverage
   ```

2. **Identify Coverage Gaps**
   - Files below 70% coverage
   - Complex logic with low branch coverage
   - Error paths not tested

3. **Plan Test Additions**
   - Create tickets for low-coverage areas
   - Prioritize by risk (critical features first)
   - Estimate effort for test improvements

4. **Track Trend Over Time**
   ```bash
   # Create coverage-history.txt
   date >> coverage-history.txt
   npm run test:ci -- --coverage 2>&1 | grep "TOTAL" >> coverage-history.txt
   ```

### Quarterly Coverage Goals

| Phase | Coverage Target | Focus |
|-------|-----------------|-------|
| Q1 | 50%+ | Core services and critical components |
| Q2 | 65%+ | Error scenarios and edge cases |
| Q3 | 75%+ | User interactions and integration |
| Q4 | 80%+ | Accessibility, responsiveness, complex scenarios |

---

## Team Responsibilities

### Individual Developer
- Write tests for own code before submitting PR
- Update tests when modifying behavior
- Keep test failures as "stop-the-line" priority
- Review test feedback in code reviews

### Code Reviewer
- Check test completeness (coverage, edge cases)
- Verify test quality (patterns, mocks, clarity)
- Flag missing tests for new functionality
- Request test updates if behavior changed

### QA Engineer
- Identify gaps between unit tests and E2E tests
- Create E2E tests for critical user flows
- Report flaky tests and regressions
- Verify test coverage matches risk areas

### Tech Lead
- Monitor overall test health (coverage, flakiness)
- Update testing guidelines as patterns evolve
- Conduct monthly coverage reviews
- Address systemic test issues

### DevOps/CI/CD Team
- Ensure test execution in CI/CD pipeline
- Monitor test execution time and optimize
- Configure test environment to match development
- Track test metrics (pass rate, execution time)

---

## Tools & Commands Reference

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run specific test file
npm test -- component-name.spec.ts

# Run tests matching pattern
npm test -- -t "should handle errors"

# Run with coverage report
npm run test:ci

# Run E2E tests
npm run e2e              # Against e2e server
npm run e2e:local        # Against local backend
npm run e2e:mock         # With mocked API
```

### Checking Test Quality

```bash
# Verify linting and code quality
npm run check

# Auto-fix issues
npm run fix

# Check specific areas
npm run check:ts         # TypeScript/ESLint
npm run check:scss       # SCSS
```

### Coverage Analysis

```bash
# Generate coverage report
npm run test:ci

# View coverage in browser
open coverage/lcov-report/index.html

# Check coverage for specific path
npm run test:ci -- --coverage src/app/features/my-feature
```

### Test Utilities

**Location:** `src/test/utils/`

Available helpers:
- `FormBuilderHelper` - Reactive forms testing
- `FixtureHelper` - DOM queries and events
- `ChangeDetectionHelper` - OnPush strategy testing
- `HttpMockBuilder` - HTTP mocking
- `MockObservableBuilder` - Observable testing
- `TestBedSetup` - TestBed configuration

Example:
```typescript
import { FixtureHelper } from '@test/utils/fixture-helper';

it('should handle button click', () => {
  const button = FixtureHelper.querySelector(fixture, '[data-cy="submit"]');
  FixtureHelper.triggerClick(fixture, button);
  expect(component.submitted).toBe(true);
});
```

### Debugging Tools

```bash
# Find test files with skip/focus markers
grep -r "\.skip\|\.only\|fit\|fdescribe" src --include="*.spec.ts"

# Find tests with no assertions
grep -B5 "it('should" src --include="*.spec.ts" | grep -A5 "});"

# Find missing detectChanges calls (common issue)
grep -B3 "fixture.detectChanges()" src --include="*.spec.ts" | head -20
```

---

## Common Maintenance Scenarios

### Scenario 1: Test Fails After Merging Main Branch

**Problem:** Tests pass locally but fail after pulling latest main

**Steps:**
1. Pull latest main: `git pull origin main`
2. Reinstall dependencies: `npm ci`
3. Run tests: `npm test`
4. If still failing, check what changed:
   ```bash
   git log --oneline origin/main~5..origin/main
   ```
5. Check git diff for recent changes:
   ```bash
   git diff main your-branch -- src/app/features/affected-feature
   ```
6. Update tests to match new behavior or revert conflicting changes

### Scenario 2: Coverage Dropped But No Tests Were Removed

**Problem:** Coverage report shows 5% drop without obvious reason

**Steps:**
1. Check what code was added:
   ```bash
   git diff main -- src/app/core/services/my-service.ts | grep "^+" | wc -l
   ```
2. Compare new lines with test coverage:
   ```bash
   npm run test:ci -- --coverage src/app/core/services/my-service.ts
   ```
3. Add tests for uncovered lines:
   - New methods need tests
   - New error cases need tests
   - New branches need test coverage

### Scenario 3: E2E Test Fails But Unit Tests Pass

**Problem:** All unit tests pass, but E2E test fails in staging

**Steps:**
1. Check if E2E test matches latest unit tests:
   ```bash
   npm run e2e -- --spec "cypress/e2e/features/my-feature.cy.ts"
   ```
2. Compare unit test mocks with actual API responses:
   - Does mock data match real API format?
   - Are required fields present in mock?
   - Are error responses tested?

3. Update mocks if needed:
   ```bash
   # In cypress/intercept/
   # Update mock responses to match actual API
   ```

### Scenario 4: New Team Member Breaks Tests

**Problem:** New developer added code without tests, breaks test suite

**Steps:**
1. Guide them to `TESTING-BEST-PRACTICES.md`
2. Review their code:
   - Does it have corresponding tests?
   - Do tests use established patterns?
   - Is coverage adequate?
3. Provide example from codebase:
   - Show similar component's test
   - Highlight key patterns they missed
4. Pair programming session if needed

### Scenario 5: Circular Dependencies in Tests

**Problem:** Test files importing from each other cause infinite loops

**Steps:**
1. Identify circular dependency:
   ```bash
   npm test -- --detectOpenHandles 2>&1 | grep "circular"
   ```
2. Refactor shared test setup:
   - Move common setup to `src/test/utils/`
   - Use factory functions instead of direct imports
3. Example fix:
   ```typescript
   // ❌ Circular: A imports B, B imports A
   // a.spec.ts imports mockService from b.spec.ts
   // b.spec.ts imports mockService from a.spec.ts

   // ✅ Fixed: Extract to shared utils
   // src/test/services/common-mocks.ts
   export const mockService = { ... };

   // Both a.spec.ts and b.spec.ts import from shared location
   import { mockService } from '@test/services/common-mocks';
   ```

---

## Test Health Monitoring

### Key Metrics to Track

1. **Test Execution Time**
   - Target: Total test suite < 1 minute
   - Monitor for slowdowns
   - Profile slow tests:
     ```bash
     npm test -- --logHeapUsage
     ```

2. **Test Pass Rate**
   - Target: 100% (not 99.9%, not 99%)
   - Flaky tests indicate issues
   - Track trends over time

3. **Code Coverage**
   - Statements: Target 80%+
   - Branches: Target 75%+
   - Lines: Target 80%+
   - Functions: Target 75%+

4. **Test Maintenance Burden**
   - Ratio of test changes to code changes (should be ~1:1)
   - Number of tests marked as `.skip` (should be 0)
   - Number of tests marked as `.only` (should be 0)

### Monitoring Tools

**Built-in Commands:**
```bash
# See execution time per test file
npm test -- --verbose

# Track memory usage
npm test -- --logHeapUsage

# Generate HTML coverage report
npm run test:ci
# Open coverage/lcov-report/index.html
```

**Automated Checks (Add to CI):**
```bash
# Fail if coverage drops
npm run test:ci -- --coverage --coverageThreshold='{"global":{"branches":75,"functions":75,"lines":80,"statements":80}}'

# Fail if tests take too long
timeout 60 npm test || echo "Tests took too long"

# Fail if any test is skipped
grep -r "\.skip\|\.only" src --include="*.spec.ts" && exit 1 || exit 0
```

### Monthly Health Report Template

```markdown
## Test Health Report - [MONTH]

### Metrics
- Total Tests: X
- Pass Rate: Y%
- Average Execution Time: Z seconds
- Coverage: Statements X%, Branches Y%, Lines Z%

### Issues Found
- [ ] Flaky tests identified
- [ ] Coverage dropped
- [ ] Execution time increased

### Actions Taken
- Fixed X flaky tests
- Added Y tests for new code
- Optimized Z slow tests

### Next Month Goals
- Target coverage: X%
- Target execution time: Y seconds
- Priority fixes: Z
```

---

## Related Documentation

- **Testing Best Practices:** `TESTING-BEST-PRACTICES.md`
- **Testing Patterns:** `TESTING-PATTERNS.md`
- **Mock Services Reference:** `MOCK-SERVICES-REFERENCE.md`
- **Advanced Patterns:** `ADVANCED-TESTING-PATTERNS.md`
- **Coverage Report:** `COMPREHENSIVE-COVERAGE-REPORT.md`

---

## Quick Reference: Decision Tree

**"Should I write a test?"**
```
├─ Is it a public API method? → YES: Add test
├─ Is it a component behavior visible to users? → YES: Add test
├─ Is it error handling? → YES: Add test
├─ Is it a private implementation detail? → NO: Skip (test public behavior instead)
├─ Is it third-party library code? → NO: Skip (trust library has tests)
└─ Is it obviously working? → NO: Add test anyway (prevents regressions)
```

**"Test is failing, what do I do?"**
```
├─ Does the test accurately describe expected behavior?
│  ├─ NO: Fix test to match actual behavior
│  └─ YES: Continue
├─ Did the code change intentionally?
│  ├─ YES: Update code to match test
│  └─ NO: Revert code change or fix bug
├─ Is this a new/edge case?
│  ├─ YES: Fix code logic
│  └─ NO: Investigate why regression occurred
└─ Always: Understand root cause before moving forward
```

**"Which testing helper should I use?"**
```
├─ Testing DOM queries? → Use FixtureHelper
├─ Testing form values? → Use FormBuilderHelper
├─ Testing HTTP requests? → Use HttpMockBuilder
├─ Testing observables? → Use MockObservableBuilder
├─ Testing OnPush strategy? → Use ChangeDetectionHelper
└─ Testing full component setup? → Use TestBedSetup
```

---

## Conclusion

Maintaining a healthy test suite requires:
1. **Consistency:** Follow established patterns
2. **Discipline:** Write tests before/with code, update when behavior changes
3. **Communication:** Review tests thoroughly, flag issues early
4. **Monitoring:** Track metrics, address issues proactively
5. **Documentation:** Update guides as patterns evolve

By following this maintenance process, the Kubermatic Dashboard test suite will remain a valuable asset that enables confident refactoring, catches regressions early, and documents expected behavior for all team members.

