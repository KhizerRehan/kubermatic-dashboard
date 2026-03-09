<!-- Copyright 2020 The Kubermatic Kubernetes Platform contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. -->

# Team Onboarding: Testing Framework & Best Practices

Welcome to the Kubermatic Dashboard team! This document guides new developers through learning our testing framework step-by-step. Whether you're new to Angular testing or just need to get up to speed on our patterns, this guide will help you become a testing expert.

**Estimated Learning Time:** 2.5 hours (complete learning path)

---

## Table of Contents

1. [Learning Path Overview](#learning-path-overview)
2. [Beginner Path](#beginner-path--foundational-knowledge)
3. [Intermediate Path](#intermediate-path--advanced-patterns)
4. [Advanced Path](#advanced-path--expert-level)
5. [Hands-On Exercises](#hands-on-exercises)
6. [Developer Verification Checklist](#developer-verification-checklist)
7. [Example Test Files to Study](#example-test-files-to-study)
8. [Getting Help](#getting-help)

---

## Learning Path Overview

Our testing curriculum is structured in three levels:

| Level | Target Audience | Time | Focus |
|-------|-----------------|------|-------|
| **Beginner** | New developers, testing newcomers | 1 hour | Fundamentals, basic patterns, setup |
| **Intermediate** | Regular developers contributing features | 1 hour | Advanced patterns, complex scenarios, forms |
| **Advanced** | Tech leads, testing architects | 30 min | Performance, debugging, custom utilities |

Each level builds on the previous one. We recommend completing levels in order, but you can skip ahead if you already have experience.

---

## Beginner Path 🚀 Foundational Knowledge

**Target Time:** 1 hour
**Goal:** Write your first passing test and understand basic testing concepts

### Step 1: Understand Jest & Angular Testing Basics (15 minutes)

**Read:** [TESTING-PATTERNS.md](./TESTING-PATTERNS.md) → Sections: "Jest Setup & Configuration"

**Key Concepts to Understand:**
- Jest is our test runner (similar to Karma/Jasmine, but faster)
- TestBed is Angular's testing utility for component testing
- `@angular/core/testing` provides testing utilities
- Path aliases (`@app/`, `@core/`, `@shared/`) make imports cleaner

**Action Item:**
```bash
# Verify Jest is installed and working
npm test -- --version
```

### Step 2: Learn Component Testing Basics (15 minutes)

**Read:** [TESTING-PATTERNS.md](./TESTING-PATTERNS.md) → Sections: "Component Testing Patterns" → "Basic Component Setup"

**Key Patterns:**
```typescript
describe('MyComponent', () => {
  let fixture: ComponentFixture<MyComponent>;
  let component: MyComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyComponent],
      imports: [/* necessary modules */],
      providers: [/* mock services */],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // trigger initial change detection
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
```

**Key Takeaways:**
- `beforeEach` sets up test environment before each test
- `TestBed.configureTestingModule()` is like Angular's module configuration for tests
- `fixture.detectChanges()` triggers Angular's change detection
- Test names should clearly describe what's being tested

### Step 3: Run Your First Test (10 minutes)

**Hands-On:**
```bash
# Run a single test file to see it passing
npm test -- src/app/shared/components/button/button.component.spec.ts

# Watch the test run - you should see ✓ (passing tests)
# If you see ✗, that's OK - we'll debug those next
```

**Verify:**
- Tests complete without errors
- You see green checkmarks (✓) for passing tests
- Output shows test execution time

### Step 4: Learn Service Testing Basics (15 minutes)

**Read:** [TESTING-PATTERNS.md](./TESTING-PATTERNS.md) → Sections: "Service Testing Patterns" → "Basic Service Testing"

**Key Patterns:**
```typescript
describe('MyService', () => {
  let service: MyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MyService]
    });
    service = TestBed.inject(MyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // ensure no unhandled requests
  });

  it('should fetch data', () => {
    service.getData().subscribe(data => {
      expect(data).toBeDefined();
    });
    const req = httpMock.expectOne('/api/data');
    req.flush({id: 1}); // mock response
  });
});
```

**Key Takeaways:**
- Services are tested in isolation (no UI)
- `HttpTestingController` mocks HTTP requests
- `httpMock.verify()` ensures all mocked requests were used
- Services should never make real HTTP calls in tests

**Action Item:**
```bash
# Run a service test to see the pattern
npm test -- --testNamePattern="should" | head -50
```

### Step 5: Understand Our Mock Services (10 minutes)

**Read:** [MOCK-SERVICES-REFERENCE.md](./MOCK-SERVICES-REFERENCE.md) → Sections: "Available Mock Services"

**Key Understanding:**
- We have pre-built mocks for common services (Auth, Project, User, etc.)
- Use mocks instead of creating your own in tests
- Mocks are in `src/test/services/`

**Example:**
```typescript
import {AuthMockService} from '@test/services/auth-mock.service';

TestBed.configureTestingModule({
  providers: [
    {provide: AuthService, useClass: AuthMockService}
  ]
});
```

---

## Intermediate Path 📚 Advanced Patterns

**Target Time:** 1 hour
**Prerequisites:** Complete Beginner Path
**Goal:** Write comprehensive tests with advanced patterns and debugging

### Step 1: Master Component Testing with Inputs & Outputs (15 minutes)

**Read:** [TESTING-PATTERNS.md](./TESTING-PATTERNS.md) → Sections: "Component Testing Patterns" → "Testing Inputs & Outputs"

**Key Patterns:**
```typescript
// Testing @Input properties
beforeEach(() => {
  component.inputValue = 'test value';
  fixture.detectChanges(); // apply new input
});

it('should display input value', () => {
  expect(component.displayedValue).toEqual('test value');
});

// Testing @Output events
it('should emit event on click', () => {
  spyOn(component.clickEvent, 'emit');
  component.handleClick();
  expect(component.clickEvent.emit).toHaveBeenCalledWith(expectedValue);
});
```

**Hands-On Exercise:**
Find `src/app/shared/components/button/component.spec.ts` and:
1. Add a test for @Input property changes
2. Add a test for @Output event emission
3. Run the test and verify it passes

### Step 2: Form Testing - Reactive Forms (15 minutes)

**Read:** [TESTING-PATTERNS.md](./TESTING-PATTERNS.md) → Sections: "Form Testing Patterns"

**Key Patterns:**
```typescript
beforeEach(() => {
  component.form = new FormBuilder().group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
});

it('should validate email field', () => {
  const emailControl = component.form.get('email');
  emailControl?.setValue('invalid-email');
  expect(emailControl?.hasError('email')).toBeTruthy();
});

it('should be valid when all fields are filled', () => {
  component.form.patchValue({
    email: 'test@example.com',
    password: 'password123'
  });
  expect(component.form.valid).toBeTruthy();
});
```

**Key Takeaways:**
- Form controls have validators
- `hasError()` checks specific validation errors
- `patchValue()` sets form values without triggering full validation
- `setValue()` requires all controls to be set

**Hands-On Exercise:**
Create a simple form test:
1. Create `src/app/shared/components/form-example/component.spec.ts`
2. Test required validation
3. Test email validation
4. Test form submission

### Step 3: Async & Observable Testing (15 minutes)

**Read:** [TESTING-PATTERNS.md](./TESTING-PATTERNS.md) → Sections: "Async & Observable Testing Patterns"

**Key Patterns:**
```typescript
// Using fakeAsync & tick for async code
it('should load data after delay', fakeAsync(() => {
  let result: any;
  service.getDataWithDelay().subscribe(data => {
    result = data;
  });

  expect(result).toBeUndefined(); // not yet
  tick(1000); // fast-forward time
  expect(result).toBeDefined(); // now it's loaded
}));

// Using waitForAsync for promise-based code
it('should handle promise', waitForAsync(() => {
  let result: any;
  service.getDataAsPromise().then(data => {
    result = data;
  });

  fixture.whenStable().then(() => {
    expect(result).toBeDefined();
  });
}));
```

**Key Takeaways:**
- `fakeAsync` & `tick()` control time in tests
- `waitForAsync` for promise-based code
- Observables can be tested with `.subscribe()`
- `HttpTestingController` is best for mocking HTTP observables

### Step 4: Testing Dialog Components (10 minutes)

**Read:** [TESTING-PATTERNS.md](./TESTING-PATTERNS.md) → Sections: "Dialog & Material Component Testing"

**Key Patterns:**
```typescript
it('should open dialog with correct data', () => {
  const dialogSpy = spyOn(matDialog, 'open').and.returnValue({
    afterClosed: () => of({id: 1, name: 'Test'})
  } as any);

  component.openDialog();

  expect(dialogSpy).toHaveBeenCalled();
  expect(dialogSpy).toHaveBeenCalledWith(MyDialogComponent, {
    data: expectedData
  });
});
```

### Step 5: Error Handling & Edge Cases (5 minutes)

**Read:** [TESTING-BEST-PRACTICES.md](./TESTING-BEST-PRACTICES.md) → Sections: "Testing Error Scenarios"

**Best Practices:**
- Test both success and failure paths
- Test edge cases (empty data, null values, etc.)
- Test error messages displayed to users
- Never hide errors in tests - they should fail loudly

**Example:**
```typescript
it('should display error message on API failure', () => {
  const req = httpMock.expectOne('/api/data');
  req.flush({message: 'Server error'}, {status: 500, statusText: 'Internal Server Error'});

  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('Server error');
});
```

---

## Advanced Path 🎓 Expert-Level

**Target Time:** 30 minutes
**Prerequisites:** Complete Intermediate Path
**Goal:** Optimize tests, debug complex issues, and lead testing discussions

### Step 1: Performance Testing & Optimization (10 minutes)

**Read:** [TESTING-BEST-PRACTICES.md](./TESTING-BEST-PRACTICES.md) → Sections: "Performance Considerations"

**Key Metrics:**
- Individual test should complete in < 100ms
- Full test suite should complete in < 5 minutes
- Watch for tests that take > 500ms - they likely have issues

**Command to Check Performance:**
```bash
npm test -- --verbose
# Look for tests taking > 500ms and investigate
```

### Step 2: Advanced Mocking Strategies (10 minutes)

**Read:** [MOCK-SERVICES-REFERENCE.md](./MOCK-SERVICES-REFERENCE.md) → Sections: "Advanced Mocking Techniques"

**Advanced Patterns:**
```typescript
// Spying on real methods
const service = TestBed.inject(RealService);
spyOn(service, 'methodName').and.returnValue(of({data: 'mocked'}));

// Creating custom observables
const subject = new Subject<Data>();
spyOn(service, 'getData').and.returnValue(subject.asObservable());

// Later in test
subject.next({id: 1}); // emit value
subject.error(new Error('Test error')); // emit error
subject.complete(); // complete stream
```

### Step 3: Debugging Failing Tests (10 minutes)

**Read:** [DEBUGGING-TESTS.md](./DEBUGGING-TESTS.md) (create this in next phase)

**Key Debugging Techniques:**
```bash
# Run single test with output
npm test -- src/app/path/component.spec.ts --verbose

# Run with watch mode and debug
npm run test:watch

# In VS Code: Set breakpoint, then run with debugger
npm test -- --inspect-brk
```

**In Test Code:**
```typescript
// Check intermediate values
console.log('Form value:', component.form.value);
console.log('Component state:', component.state);

// Use debugger statement
debugger; // browser will pause here when debugging

// Check Angular internals
console.log('Change detection:', component._changeDetectorRef);
```

---

## Hands-On Exercises

### Exercise 1: Component with Form (Beginner)

**Time:** 20 minutes

**Task:** Create a test for a login form component:
1. Create `src/app/shared/components/login-form/component.spec.ts`
2. Test that form is created
3. Test email validation (required, valid format)
4. Test password validation (required, minimum length)
5. Test form submission with valid data
6. Test form submission with invalid data

**Verification:**
```bash
npm test -- login-form.component.spec.ts
# Should have 5 passing tests
```

### Exercise 2: Service with HTTP & Mocking (Intermediate)

**Time:** 25 minutes

**Task:** Create comprehensive test for a data service:
1. Create `src/app/core/services/data-test.service.spec.ts`
2. Test successful data fetch
3. Test error handling (500 error)
4. Test caching (same request made twice, only 1 HTTP call)
5. Test data transformation
6. Test request parameters

**Verification:**
```bash
npm test -- data-test.service.spec.ts
# Should have 5+ passing tests
# httpMock.verify() should pass in afterEach
```

### Exercise 3: Debugging a Failing Test (Advanced)

**Time:** 15 minutes

**Task:** Analyze and fix a failing test:
1. Modify one of your passing tests to make it fail intentionally
2. Run the test and observe the error message
3. Use debugging techniques to understand the failure
4. Fix the test
5. Verify it passes again

**Debugging Checklist:**
- [ ] Read error message carefully
- [ ] Check console output for hints
- [ ] Use `console.log` to inspect values
- [ ] Verify test setup (imports, providers, etc.)
- [ ] Check that mocks are properly configured
- [ ] Ensure `fixture.detectChanges()` is called when needed

---

## Developer Verification Checklist

Use this checklist to verify you've mastered the testing framework:

### Beginner Level ✓

- [ ] I understand the difference between Jest, TestBed, and Jasmine
- [ ] I can create a basic component test with TestBed
- [ ] I can run tests using `npm test` and `npm run test:watch`
- [ ] I understand what a fixture, component, and detectChanges() mean
- [ ] I can create a basic service test with HttpTestingController
- [ ] I can run an existing test file and understand its structure
- [ ] I know where mock services are located (`src/test/services/`)
- [ ] I can import and use a mock service in a test

### Intermediate Level ✓

- [ ] I can test component @Input and @Output properties
- [ ] I can create tests for Reactive Forms with validation
- [ ] I can test async code using `fakeAsync`, `tick`, or `waitForAsync`
- [ ] I can test form submission and error scenarios
- [ ] I can test dialog components
- [ ] I can verify HTTP requests were made with correct parameters
- [ ] I can write meaningful test names that describe the behavior
- [ ] I understand the difference between `fixture.detectChanges()` and `fixture.whenStable()`

### Advanced Level ✓

- [ ] I can identify slow tests and optimize them
- [ ] I can create custom mock services when needed
- [ ] I can spy on service methods and control return values
- [ ] I can test complex observable chains
- [ ] I can debug failing tests using Chrome DevTools or VS Code debugger
- [ ] I can measure and report test coverage
- [ ] I understand the difference between unit, integration, and e2e tests
- [ ] I can explain testing trade-offs (speed vs. coverage, isolation vs. realism)

### Complete ✅ Checklist

Complete this final verification:
- [ ] I have completed the Beginner Path (1 hour)
- [ ] I have completed the Intermediate Path (1 hour)
- [ ] I have completed the Advanced Path (30 minutes)
- [ ] I have completed Exercise 1 (Component with Form)
- [ ] I have completed Exercise 2 (Service with HTTP)
- [ ] I have completed Exercise 3 (Debugging a Test)
- [ ] I have reviewed at least 3 example test files
- [ ] I can explain the purpose of each testing utility file
- [ ] I understand our edition-specific testing requirements (CE/EE)
- [ ] I know who to ask for help on my team

**Once complete:** Share this checklist with your tech lead. They'll review your test implementations and provide feedback.

---

## Example Test Files to Study

Here are excellent examples to study at each level:

### Beginner Level Examples

**Start here for simple, clear patterns:**

1. **Button Component** (Basic component test)
   - Location: `src/app/shared/components/button/component.spec.ts`
   - Topics: Basic setup, simple assertions, event handling
   - Lines to focus on: Component creation, detecting changes, event emission

2. **Input Component** (Input/output properties)
   - Location: `src/app/shared/components/input/component.spec.ts`
   - Topics: @Input properties, @Output events, value changes
   - Time to study: 10 minutes

### Intermediate Level Examples

3. **Form Component** (Reactive forms testing)
   - Location: `src/app/shared/components/form-component/component.spec.ts`
   - Topics: FormBuilder, validators, form state, submission
   - Complexity: Medium
   - Time to study: 15 minutes

4. **Service with HTTP** (Service + HttpTestingController)
   - Location: `src/app/core/services/cluster.service.spec.ts`
   - Topics: HttpTestingController, error handling, request verification
   - Complexity: Medium
   - Time to study: 15 minutes

### Advanced Level Examples

5. **Dialog Component** (Dialog testing with Material)
   - Location: `src/app/shared/components/*/dialog/component.spec.ts`
   - Topics: MatDialog, dialog data, afterClosed
   - Complexity: Advanced
   - Time to study: 20 minutes

6. **Async Observable Service** (Complex async patterns)
   - Location: `src/app/core/services/user.service.spec.ts`
   - Topics: Observables, subscriptions, shareReplay, error handling
   - Complexity: Advanced
   - Time to study: 20 minutes

### Study Method

For each example file:
1. **Read** the test file completely (ignore boilerplate, focus on unique patterns)
2. **Understand** what each test is verifying
3. **Run** the tests: `npm test -- path/to/component.spec.ts`
4. **Modify** one test to understand what breaks
5. **Ask** questions if something doesn't make sense

---

## Getting Help

### Common Questions

**Q: How do I run a single test?**
```bash
npm test -- src/path/to/component.spec.ts
```

**Q: How do I debug a failing test?**
```bash
# Option 1: Add console.log and look at output
npm test -- --verbose

# Option 2: Use Chrome DevTools
npm run test:watch  # Then look at Chrome tab that opens
# Set breakpoints, then refresh the page

# Option 3: Use VS Code debugger (see DEBUGGING-TESTS.md)
```

**Q: Do I need to test private methods?**
A: Generally no. Test the public interface. If you need to test private logic, it might belong in a separate service instead.

**Q: How do I test code that depends on another service?**
A: Inject a mock of that service using TestBed.configureTestingModule() providers.

**Q: How do I know if my test coverage is good enough?**
A: Run `npm run test:ci` to see coverage report. Aim for >80% coverage in shared components.

### Contact & Support

**Testing Questions:**
- Slack channel: `#testing-help` (if available on your team)
- Peer review: Ask in code review for patterns you don't understand

**For Testing Framework Issues:**
- Check [DEBUGGING-TESTS.md](./DEBUGGING-TESTS.md) for solutions
- Review similar tests in the codebase for patterns

**Testing Champions** (experts on your team):
- These are developers who have deep testing knowledge
- Ask your tech lead who the testing champions are
- They can help with complex testing scenarios

### Next Steps After Onboarding

1. **Apply Knowledge:**
   - Add tests to your next feature
   - Review team member's tests
   - Ask questions during code review

2. **Deepen Understanding:**
   - Read [TESTING-BEST-PRACTICES.md](./TESTING-BEST-PRACTICES.md)
   - Study [ADVANCED-TESTING-PATTERNS.md](./ADVANCED-TESTING-PATTERNS.md)
   - Explore edge cases in your own code

3. **Share Knowledge:**
   - Mentor other team members
   - Create reusable test utilities
   - Document new patterns you discover

---

## Document Roadmap

Related documentation for deeper learning:

```
TEAM-ONBOARDING.md (you are here)
├── TESTING-PATTERNS.md (detailed pattern reference)
├── TESTING-BEST-PRACTICES.md (quality guidelines)
├── ADVANCED-TESTING-PATTERNS.md (expert patterns)
├── MOCK-SERVICES-REFERENCE.md (mock service catalog)
├── DEBUGGING-TESTS.md (troubleshooting guide)
└── README.md (documentation index)
```

---

**Last Updated:** March 2026
**Version:** 1.0
**Estimated Learning Time:** 2.5 hours (complete path)
**Maintenance:** Update annually or when major testing patterns change
