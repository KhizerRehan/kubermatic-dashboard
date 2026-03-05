---
type: reference
title: Kubermatic Dashboard Testing Documentation
created: 2026-03-05
tags:
  - testing
  - documentation
  - jest
  - cypress
  - quality-assurance
related:
  - '[[TESTING-PATTERNS]]'
  - '[[TESTING-BEST-PRACTICES]]'
  - '[[MAINTENANCE-PROCESS]]'
---

# Kubermatic Dashboard Testing Documentation

Welcome to the comprehensive testing documentation for the Kubermatic Dashboard. This is your central hub for learning about our testing practices, strategies, and tools.

**Quick Navigation:**
- ⚡ [New to testing?](#getting-started-for-new-developers) → Start with the Getting Started section
- 📚 [Need help?](#frequently-asked-questions) → Check the FAQ
- 🔍 [Looking for something specific?](#documentation-index) → Browse the full documentation index

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Getting Started for New Developers](#getting-started-for-new-developers)
4. [Documentation Index](#documentation-index)
5. [Quick Reference](#quick-reference)
6. [Common Tasks](#common-tasks)
7. [Frequently Asked Questions](#frequently-asked-questions)
8. [Tools & Resources](#tools--resources)
9. [Getting Help](#getting-help)

---

## Overview

The Kubermatic Dashboard is a complex Angular application that requires comprehensive testing across multiple levels:

- **Unit Tests (Jest)** - Test individual components, services, and utilities
- **E2E Tests (Cypress)** - Test complete user workflows and integrations
- **Mock Services** - Standardized mocks for consistent testing
- **Performance Testing** - Ensure tests run efficiently

### Key Testing Metrics (as of March 2026)

- **Unit Test Coverage**: Comprehensive coverage of shared components and core services
- **Test Files**: 50+ test files with 1000+ individual test cases
- **Execution Time**: Full test suite runs in ~3-5 minutes
- **Coverage**: Focus areas include shared components (100+ components), core services, and critical business logic

### Why Testing Matters

The Kubermatic Dashboard supports both Community Edition (CE) and Enterprise Edition (EE) with complex feature interactions. Testing ensures:

✅ Prevents regressions in critical cluster management features
✅ Enables safe refactoring of legacy code
✅ Documents expected behavior through living test specifications
✅ Maintains consistency across CE/EE editions
✅ Supports continuous integration and deployment

---

## Testing Strategy

### Level 1: Unit Tests (Jest)

**What:** Individual components, services, directives, and pipes
**When:** During development
**Duration:** ~3 minutes for full suite
**Coverage:** ~200+ files with comprehensive patterns

**Key Patterns:**
- Component testing with TestBed and ChangeDetection strategies
- Service testing with mocked HTTP calls
- Form testing with Reactive Forms
- RxJS observable testing

**Best For:**
- Fast feedback during development
- Testing business logic and edge cases
- Testing error handling and validation
- Documenting expected behavior

### Level 2: E2E Tests (Cypress)

**What:** Complete user workflows and integrations
**When:** Before release
**Duration:** ~5-10 minutes per test run
**Coverage:** Critical user journeys (project creation, cluster management, etc.)

**Best For:**
- Testing real user workflows
- Cross-browser testing
- Integration testing with mock/real APIs
- Regression testing before releases

### Level 3: Manual QA

**What:** Visual inspection, edge cases, accessibility
**When:** Release candidates

**Best For:**
- Visual validation
- Accessibility testing
- Performance profiling
- User experience validation

---

## Getting Started for New Developers

### 1. First Time Setup (5 minutes)

```bash
# Install dependencies (if not already done)
npm install

# Verify the testing environment
npm run test:ci -- --listTests | head -10
```

### 2. Running Your First Test (10 minutes)

```bash
# Run a single test file
npm test -- src/app/shared/components/component-name.spec.ts

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests matching a pattern
npm test -- --testNamePattern="should display"
```

### 3. Understanding Test Structure (15 minutes)

Read: **[TESTING-PATTERNS.md](./TESTING-PATTERNS.md)** → Section: "Test File Structure"

A typical test file structure:

```typescript
describe('ComponentName', () => {
  let fixture: ComponentFixture<ComponentName>;
  let component: ComponentName;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [/* ... */],
      declarations: [ComponentName],
      providers: [/* ... */]
    });
    fixture = TestBed.createComponent(ComponentName);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // More tests...
});
```

### 4. Writing Your First Test (20 minutes)

Follow the step-by-step guide in **[TESTING-BEST-PRACTICES.md](./TESTING-BEST-PRACTICES.md)** → Section: "Writing Maintainable Tests"

**Tips for success:**
- Use descriptive test names (e.g., "should display error message when form is invalid")
- Test behavior, not implementation details
- Keep tests focused on a single concept
- Always call `fixture.detectChanges()` after changing inputs

### 5. Using Mock Services (15 minutes)

Read: **[MOCK-SERVICES-REFERENCE.md](./MOCK-SERVICES-REFERENCE.md)** → Section: "Getting Started"

Key mock services available:
- `AppConfigMockService` - App configuration and settings
- `AuthMockService` - Authentication state
- `ProjectMockService` - Project list and operations
- `ClusterMockService` - Cluster operations
- `UserMockService` - User information
- And 20+ more...

### 6. Debugging Tests (10 minutes)

When tests fail, consult **[TESTING-BEST-PRACTICES.md](./TESTING-BEST-PRACTICES.md)** → Section: "Debugging Failing Tests"

**Quick debug checklist:**
- [ ] Check test output for clear error message
- [ ] Verify `fixture.detectChanges()` is called
- [ ] Check if mocks are configured correctly
- [ ] Use `console.log()` to inspect values
- [ ] Use VS Code debugger with `node --inspect-brk`

### Estimated Learning Timeline

| Phase | Duration | Topics | Documents |
|-------|----------|--------|-----------|
| **Setup** | 5 min | Environment, Commands | This README |
| **Basics** | 30 min | Test structure, Jest patterns | TESTING-PATTERNS.md (Basics section) |
| **Components** | 45 min | Component testing, OnPush | TESTING-BEST-PRACTICES.md |
| **Services** | 30 min | HTTP testing, Mocks | MOCK-SERVICES-REFERENCE.md |
| **Advanced** | 1-2 hrs | Complex patterns, Performance | ADVANCED-TESTING-PATTERNS.md |
| **Total** | ~2.5 hours | Core concepts | All documents |

---

## Documentation Index

### 📋 Fundamentals & Getting Started

#### [TESTING-PATTERNS.md](./TESTING-PATTERNS.md)
**Comprehensive guide to testing patterns used in the Kubermatic Dashboard**
- Test file structure and conventions
- Component testing (with OnPush strategy)
- Service testing with HTTP mocking
- Form and reactive testing
- Observable and async testing
- Dialog testing patterns
- Directive testing
- Real-world examples and case studies

📌 **Start here** if you're new to the codebase or Angular testing.

#### [TESTING-BEST-PRACTICES.md](./TESTING-BEST-PRACTICES.md)
**Lessons learned from testing 200+ components and services**
- Common mistakes to avoid (with before/after examples)
- Anti-patterns in component testing
- Writing maintainable tests
- Stubs vs Spies vs Mocks
- Performance tips and optimization
- Debugging failing tests
- Code review checklist

📌 **Read this** to level up your testing skills and avoid common pitfalls.

#### [SETUP-VERIFICATION.md](./SETUP-VERIFICATION.md)
**Verify your testing environment is correctly configured**
- Step-by-step setup verification
- Environment checks
- Dependency verification
- Initial test run

📌 **Use this** to troubleshoot if your tests aren't running.

---

### 🔧 Reference & Advanced Topics

#### [MOCK-SERVICES-REFERENCE.md](./MOCK-SERVICES-REFERENCE.md)
**Complete reference for 25+ mock services used throughout the test suite**
- Service-by-service reference with signatures
- Call tracking and state management
- Error simulation patterns
- Examples for each mock service
- Testing with complex scenarios
- Advanced mock setup patterns

📌 **Consult this** when writing tests that depend on services.

#### [ADVANCED-TESTING-PATTERNS.md](./ADVANCED-TESTING-PATTERNS.md)
**Advanced testing scenarios and sophisticated patterns**
- Testing complex observables with marble testing
- Testing dynamic module loading
- Testing provider-specific features
- Testing wizard/multi-step flows
- Testing theme switching
- Testing authentication flows
- Testing error handling and recovery
- Performance testing patterns

📌 **Use this** for testing complex, non-standard scenarios.

---

### 📊 Coverage & Reports

#### [COMPREHENSIVE-COVERAGE-REPORT.md](./COMPREHENSIVE-COVERAGE-REPORT.md)
**Overall testing coverage and metrics across the entire codebase**
- Coverage summary by module
- Test count and distribution
- Coverage gaps and recommendations
- Coverage trends
- High-priority components for testing

📌 **Review this** to understand overall testing coverage and priorities.

#### [FEATURE-COVERAGE-REPORT.md](./FEATURE-COVERAGE-REPORT.md)
**Testing coverage for major features and user workflows**
- Feature-by-feature coverage breakdown
- Test inventory for each feature
- Coverage gaps for features
- Priority recommendations
- Edition-specific feature testing (CE/EE)

📌 **Use this** to understand feature coverage and identify testing gaps.

#### [SHARED-COMPONENTS-COVERAGE-REPORT.md](./SHARED-COMPONENTS-COVERAGE-REPORT.md)
**Detailed coverage report for 100+ shared UI components**
- Component-by-component coverage status
- Test count per component
- Testing priority recommendations
- Component categories and dependencies

📌 **Check this** for shared component testing status and priorities.

#### [SHARED-COMPONENTS-COVERAGE-PLAN.md](./SHARED-COMPONENTS-COVERAGE-PLAN.md)
**Strategic plan for testing shared UI components**
- Testing roadmap for shared components
- Priority tiers and testing strategy
- Dependencies and testing order
- Resource allocation

📌 **Reference this** when planning shared component testing work.

#### [MOCK-COVERAGE-AUDIT.md](./MOCK-COVERAGE-AUDIT.md)
**Audit of mock services and testing utility coverage**
- Mock service implementation status
- Advanced feature coverage in mocks
- Testing utilities status
- Recommendations for mock enhancements

📌 **Use this** to understand mock service completeness.

---

### 🛠️ Operations & Maintenance

#### [MAINTENANCE-PROCESS.md](./MAINTENANCE-PROCESS.md)
**Processes for keeping the test suite healthy and effective**
- Daily development tasks
- Code review checklist for tests
- Handling test failures
- Refactoring and test updates
- Regular coverage reviews
- Team responsibilities
- Test health monitoring
- Common maintenance scenarios

📌 **Follow this** as your guide for day-to-day testing responsibilities.

#### [CI-CD-INTEGRATION.md](./CI-CD-INTEGRATION.md)
**Continuous Integration setup and coverage reporting**
- CI pipeline configuration and execution
- Coverage report generation and interpretation
- Coverage thresholds and quality gates
- Interpreting and responding to coverage drops
- Debugging CI test failures
- Local verification before pushing
- GitHub Actions workflow setup

📌 **Reference this** to understand how tests run in CI and how coverage is measured.

---

## Quick Reference

### Essential Commands

```bash
# Run tests
npm test                    # Run all tests once
npm run test:watch        # Run tests in watch mode
npm run test:ci           # Run tests with coverage (CI mode)

# Run specific test
npm test -- fileName.spec.ts

# Run tests matching a pattern
npm test -- --testNamePattern="my test"

# E2E tests
npm run e2e:mock          # Against mock API
npm run e2e               # Against e2e server
npm run e2e:local         # Against local backend

# Coverage
npm run test:ci           # Generates coverage in coverage/ directory
```

### Common Test Imports

```typescript
// Core testing utilities
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

// Testing helpers
import { FixtureHelper } from '@test/utils/fixture-helper';
import { FormBuilderHelper } from '@test/utils/form-builder-helper';

// Mock services
import { AuthMockService } from '@test/services/auth-mock';
import { ProjectMockService } from '@test/services/project-mock';
import { ClusterMockService } from '@test/services/cluster-mock';

// Test utilities
import { TestBedSetup } from '@test/utils/test-bed-setup';
import { MockObservableBuilder } from '@test/utils/mock-observable-builder';
```

### TestBed Setup (Quick Snippet)

```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [BrowserModule, HttpClientModule, SharedModule],
    declarations: [MyComponent],
    providers: [
      { provide: MyService, useClass: MyServiceMock }
    ]
  });
  fixture = TestBed.createComponent(MyComponent);
  component = fixture.componentInstance;
});
```

### Common Assertions

```typescript
// Component state
expect(component.isLoading).toBe(true);
expect(component.items.length).toBe(3);

// DOM queries
expect(fixture.nativeElement.querySelector('.error')).toBeTruthy();
expect(component.displayName).toContain('John');

// Observable testing
service.getData().subscribe(data => {
  expect(data).toEqual(expectedData);
});

// Form validation
expect(form.controls['email'].valid).toBe(true);
expect(form.valid).toBe(false);
```

---

## Common Tasks

### Task: Writing a Component Test

**Path:** [TESTING-PATTERNS.md](./TESTING-PATTERNS.md) → "Component Testing" section

**Steps:**
1. Create `component.spec.ts` next to component
2. Set up TestBed with required imports and mocks
3. Write tests for user interactions and outputs
4. Use `FixtureHelper` for DOM queries
5. Test error states and edge cases

### Task: Writing a Service Test

**Path:** [TESTING-PATTERNS.md](./TESTING-PATTERNS.md) → "Service Testing" section

**Steps:**
1. Create `service.spec.ts` next to service
2. Inject HttpTestingController for HTTP testing
3. Write tests for each service method
4. Mock HTTP responses
5. Verify HTTP requests and responses

### Task: Debugging a Failing Test

**Path:** [TESTING-BEST-PRACTICES.md](./TESTING-BEST-PRACTICES.md) → "Debugging Failing Tests"

**Steps:**
1. Read the error message carefully
2. Check for common mistakes (detectChanges, mocks, etc.)
3. Add `console.log()` to inspect values
4. Use VS Code debugger with `--inspect-brk`
5. Consult the debugging guide for specific error types

### Task: Adding Tests for a New Component

**Path:** [MAINTENANCE-PROCESS.md](./MAINTENANCE-PROCESS.md) → "Code Review Checklist for Tests"

**Steps:**
1. Create component with `.spec.ts` file
2. Write tests for primary functionality
3. Cover user interactions and edge cases
4. Verify coverage targets (70%+ for new components)
5. Follow code review checklist before PR

### Task: Updating Tests After Refactoring

**Path:** [MAINTENANCE-PROCESS.md](./MAINTENANCE-PROCESS.md) → "Refactoring & Test Updates"

**Steps:**
1. Make code changes first
2. Run affected tests to identify failures
3. Update tests to match new behavior
4. Verify no regression in other tests
5. Update documentation if needed

### Task: Testing Edition-Specific Features (CE/EE)

**Path:** [FEATURE-COVERAGE-REPORT.md](./FEATURE-COVERAGE-REPORT.md) → Search for "Edition"

**Steps:**
1. Check which tests apply to CE/EE
2. Use mocks for DynamicModule
3. Test conditional visibility/behavior
4. Verify both editions work correctly
5. Document edition-specific test logic

---

## Frequently Asked Questions

### Q1: How do I run tests for a specific file?

**A:** Use the `--testPathPattern` flag:
```bash
npm test -- --testPathPattern=component-name
```

Or specify the full path:
```bash
npm test -- src/app/shared/components/my-component.spec.ts
```

See: [TESTING-PATTERNS.md](./TESTING-PATTERNS.md#running-tests)

---

### Q2: My test is failing with "Cannot find module" error

**A:** Common causes:
1. **Missing imports** - Check TestBed configuration
2. **Path alias issues** - Use `@app/`, `@core/`, `@shared/` aliases
3. **Module not exported** - Verify module exports the component/service

Solution: Consult [TESTING-BEST-PRACTICES.md](./TESTING-BEST-PRACTICES.md) → "Cannot find module" section

---

### Q3: How do I test a component with `ChangeDetectionStrategy.OnPush`?

**A:** Always call `fixture.detectChanges()` after:
- Changing `@Input` properties
- Triggering events
- Any code that should update the view

```typescript
component.inputProp = newValue;
fixture.detectChanges();  // Required for OnPush!
expect(component.computed).toBe(expectedValue);
```

See: [TESTING-BEST-PRACTICES.md](./TESTING-BEST-PRACTICES.md#onpush-detection)

---

### Q4: How do I mock a service?

**A:** Use the provided mock service:

```typescript
TestBed.configureTestingModule({
  providers: [
    { provide: MyService, useClass: MyServiceMockService }
  ]
});
```

See: [MOCK-SERVICES-REFERENCE.md](./MOCK-SERVICES-REFERENCE.md#getting-started)

---

### Q5: How do I test a form?

**A:** Use the `FormBuilderHelper`:

```typescript
const form = formHelper.createFormWithValidation({
  email: ['', Validators.required],
  password: ['', Validators.minLength(8)]
});

formHelper.setControlValue(form, 'email', 'test@example.com');
formHelper.markAsTouched(form, 'email');

expect(form.valid).toBe(true);
```

See: [TESTING-PATTERNS.md](./TESTING-PATTERNS.md#form-testing)

---

### Q6: How do I test HTTP calls?

**A:** Use `HttpTestingController`:

```typescript
const httpController = TestBed.inject(HttpTestingController);

service.getUser(1).subscribe(user => {
  expect(user.name).toBe('John');
});

const req = httpController.expectOne('/api/users/1');
expect(req.request.method).toBe('GET');
req.flush({ id: 1, name: 'John' });

httpController.verify();
```

See: [TESTING-PATTERNS.md](./TESTING-PATTERNS.md#http-testing)

---

### Q7: How do I test observables?

**A:** Use the `MockObservableBuilder`:

```typescript
const mockData = { id: 1, name: 'Test' };
const observable$ = MockObservableBuilder.success(mockData);

observable$.subscribe(data => {
  expect(data).toEqual(mockData);
});
```

See: [TESTING-PATTERNS.md](./TESTING-PATTERNS.md#observable-testing)

---

### Q8: What should my test coverage be?

**A:** Target 70%+ for new code, higher for critical paths:
- **Core services**: 80%+
- **Shared components**: 75%+
- **Feature modules**: 70%+
- **Utilities**: 80%+

See: [COMPREHENSIVE-COVERAGE-REPORT.md](./COMPREHENSIVE-COVERAGE-REPORT.md)

---

### Q9: How do I debug a test?

**A:** Use VS Code debugger:

```bash
# Terminal 1: Start debug mode
node --inspect-brk ./node_modules/.bin/jest --testPathPattern=my-test --runInBand

# Terminal 2: Open chrome://inspect in Chrome
# Click "inspect" next to the node process
# Set breakpoints and debug as normal
```

See: [TESTING-BEST-PRACTICES.md](./TESTING-BEST-PRACTICES.md#debugging-with-vs-code)

---

### Q10: How do I test async operations?

**A:** Use `fakeAsync` and `tick`:

```typescript
it('should load data', fakeAsync(() => {
  service.loadData();
  expect(component.loading).toBe(true);

  tick(1000);  // Advance time

  expect(component.loading).toBe(false);
  expect(component.data).toBeDefined();
}));
```

See: [TESTING-PATTERNS.md](./TESTING-PATTERNS.md#async-testing)

---

## Tools & Resources

### IDE Setup

**VS Code Recommended Extensions:**
- Jest Runner - Run/debug tests from editor
- JavaScript Debugger - Debug tests in editor
- Angular Language Service - Angular-specific assistance

**VS Code Settings (`.vscode/settings.json`):**
```json
{
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "jest.showCoverageOnLoad": true,
  "jest.runMode": "on-demand"
}
```

### Local Development

```bash
# Terminal 1: Run app
npm run start:local

# Terminal 2: Run tests in watch mode
npm run test:watch

# Terminal 3: (Optional) Chrome DevTools debugging
open "chrome://inspect"
```

### CI/CD Integration

Tests are automatically run on:
- Every push to PR
- Pre-commit hooks (use `npm run fix` to auto-fix issues)

See: [MAINTENANCE-PROCESS.md](./MAINTENANCE-PROCESS.md#ci--cd-integration)

### Code Coverage Tools

```bash
# Generate coverage report
npm run test:ci

# View coverage report
open coverage/index.html
```

### External Resources

- **Angular Testing Guide**: https://angular.io/guide/testing
- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Cypress Documentation**: https://docs.cypress.io
- **RxJS Testing**: https://rxjs.dev/guide/testing

---

## Getting Help

### For Different Questions

**Question Type** → **Where to Look** → **Escalation**

| Question | Primary Resource | Secondary Resource | Ask Person |
|----------|------------------|-------------------|-----------|
| How do I test a component? | TESTING-PATTERNS.md | TESTING-BEST-PRACTICES.md | Senior QA Engineer |
| Why is my test failing? | TESTING-BEST-PRACTICES.md | Console output | Debugging guide |
| How do I use this mock? | MOCK-SERVICES-REFERENCE.md | Example in doc | Team lead |
| Test is too slow | TESTING-BEST-PRACTICES.md → Performance | ADVANCED-TESTING-PATTERNS.md | Performance specialist |
| Coverage is dropping | COMPREHENSIVE-COVERAGE-REPORT.md | MAINTENANCE-PROCESS.md | Tech lead |
| How should I refactor this? | TESTING-BEST-PRACTICES.md | ADVANCED-TESTING-PATTERNS.md | Senior developer |

### Quick Help Checklist

1. **Read the error message carefully** - Most Jest errors are self-explanatory
2. **Check the relevant documentation** - 80% of questions answered in docs
3. **Search for similar test** - Look for existing tests that do similar things
4. **Use the debugging guide** - TESTING-BEST-PRACTICES.md has a dedicated section
5. **Ask in team chat** - Share the error and what you've tried

### Documentation Categories

- **Learning**: Start with TESTING-PATTERNS.md
- **Problem-Solving**: Check TESTING-BEST-PRACTICES.md
- **Reference**: Use MOCK-SERVICES-REFERENCE.md
- **Advanced**: See ADVANCED-TESTING-PATTERNS.md
- **Operations**: Check MAINTENANCE-PROCESS.md

---

## Document Map & Cross-References

```
README.md (YOU ARE HERE)
├── Fundamentals
│   ├── TESTING-PATTERNS.md
│   ├── TESTING-BEST-PRACTICES.md
│   └── SETUP-VERIFICATION.md
├── Reference
│   ├── MOCK-SERVICES-REFERENCE.md
│   └── ADVANCED-TESTING-PATTERNS.md
├── Reports & Analytics
│   ├── COMPREHENSIVE-COVERAGE-REPORT.md
│   ├── FEATURE-COVERAGE-REPORT.md
│   ├── SHARED-COMPONENTS-COVERAGE-REPORT.md
│   ├── SHARED-COMPONENTS-COVERAGE-PLAN.md
│   └── MOCK-COVERAGE-AUDIT.md
└── Operations
    └── MAINTENANCE-PROCESS.md
```

### Recommended Reading Order

**For New Developers (2.5 hours):**
1. This README (Quick navigation)
2. TESTING-PATTERNS.md (Fundamentals)
3. TESTING-BEST-PRACTICES.md (Practices)
4. MOCK-SERVICES-REFERENCE.md (Mock reference)

**For Code Review (1 hour):**
1. MAINTENANCE-PROCESS.md (Code review checklist)
2. TESTING-BEST-PRACTICES.md (Quality checklist)
3. COMPREHENSIVE-COVERAGE-REPORT.md (Coverage expectations)

**For Team Leads (2 hours):**
1. COMPREHENSIVE-COVERAGE-REPORT.md (Coverage summary)
2. FEATURE-COVERAGE-REPORT.md (Feature gaps)
3. MAINTENANCE-PROCESS.md (Processes)

---

## Continuous Improvement

This documentation is a living resource. As you:
- Learn new testing patterns → Update TESTING-PATTERNS.md
- Find common mistakes → Add to TESTING-BEST-PRACTICES.md
- Encounter issues → Update MAINTENANCE-PROCESS.md

See [MAINTENANCE-PROCESS.md](./MAINTENANCE-PROCESS.md) → "Documentation Updates" for how to contribute improvements.

---

**Last Updated:** March 2026
**Maintained By:** Kubermatic Dashboard Team
**Related Files:** `src/test/`, `src/**/*.spec.ts`, `cypress/e2e/`

