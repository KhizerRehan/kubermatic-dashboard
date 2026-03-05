---
type: reference
title: CI/CD Test Execution and Coverage Reporting
created: 2026-03-05
tags:
  - ci-cd
  - github-actions
  - coverage
  - quality-gates
  - continuous-integration
related:
  - '[[README]]'
  - '[[TESTING-PATTERNS]]'
  - '[[CODE-REVIEW-CHECKLIST]]'
  - '[[DEBUGGING-TESTS]]'
---

# CI/CD Integration: Test Execution and Coverage Reporting

This document explains how test execution is integrated into the Kubermatic Dashboard's continuous integration pipeline, how coverage reports are generated, and how to interpret and act on coverage metrics.

## Table of Contents

1. [Overview](#overview)
2. [CI Pipeline Setup](#ci-pipeline-setup)
3. [Test Execution in CI](#test-execution-in-ci)
4. [Coverage Report Generation](#coverage-report-generation)
5. [Understanding Coverage Reports](#understanding-coverage-reports)
6. [Coverage Thresholds and Gates](#coverage-thresholds-and-gates)
7. [Interpreting Coverage Drops](#interpreting-coverage-drops)
8. [Handling CI Test Failures](#handling-ci-test-failures)
9. [Local Verification Before Push](#local-verification-before-push)
10. [CI Configuration Reference](#ci-configuration-reference)

---

## Overview

The Kubermatic Dashboard uses GitHub Actions for continuous integration. The test suite is executed on every pull request and commit to ensure code quality, prevent regressions, and maintain adequate test coverage.

### CI Workflow Goals

✅ **Prevent breaking changes** - Tests catch regressions early
✅ **Enforce quality standards** - Coverage gates ensure adequate testing
✅ **Provide fast feedback** - Test results available within minutes
✅ **Track quality metrics** - Coverage trends visible over time
✅ **Support team confidence** - Reviewers know code is tested

### Key Metrics Tracked

- **Test Execution Time**: How long the full test suite takes
- **Pass/Fail Status**: Whether all tests pass
- **Code Coverage %**: Percentage of code covered by tests
- **Coverage Changes**: Coverage increase/decrease in PR
- **Test Count**: Number of unit and e2e tests

---

## CI Pipeline Setup

### GitHub Actions Workflow File

The CI pipeline is configured in `.github/workflows/test.yml` (or similar). Here's the typical structure:

```yaml
name: Test Suite
on:
  pull_request:
    branches: [main]
  push:
    branches: [main, testing-task]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3
        with:
          files: ./modules/web/coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: true
```

### Key Features

**Triggers:**
- Pull requests to `main` branch
- Pushes to `main` and `testing-task` branches

**Environment:**
- Ubuntu latest
- Node 20.x (matches project `engines.node` requirement)

**Steps:**
1. Check out code
2. Set up Node.js environment
3. Install dependencies (`npm ci` - clean install)
4. Run tests with coverage (`npm run test:ci`)
5. Upload coverage reports to Codecov

---

## Test Execution in CI

### Running Tests in CI Environment

The CI pipeline executes tests using the `test:ci` npm script:

```bash
npm run test:ci
```

This script runs Jest in CI mode:

```bash
# From package.json
"test:ci": "jest --coverage -i"
```

**Flags Explanation:**
- `--coverage` - Generate coverage reports in `coverage/` directory
- `-i` (or `--runInBand`) - Run tests serially instead of parallel
  - Ensures stable/predictable test execution
  - Prevents race conditions in CI environment
  - Reduces memory pressure on CI runners

### Test Environment Specifics

**CI Differences from Local:**
- Tests run in serial mode (no parallel execution)
- Coverage reports are always generated
- HTML reports available in artifacts
- Stricter timeout settings (30s per test)
- No watch mode or interactive features

### Coverage Report Locations

After `npm run test:ci` completes, coverage reports are generated:

```
modules/web/coverage/
├── lcov.info                      # LCOV format (for Codecov)
├── lcov-report/
│   ├── index.html                 # Interactive HTML report
│   ├── [feature]/                 # Per-directory reports
│   └── ...
├── coverage-summary.json          # JSON summary
└── clover.xml                     # Clover format
```

**Key Files:**
- `lcov.info` - Used by Codecov for badge and history
- `lcov-report/index.html` - Local coverage visualization
- `coverage-summary.json` - Programmatic access to metrics

---

## Coverage Report Generation

### What Gets Measured

Jest's coverage measurement includes:

- **Statements**: Percentage of statements executed
- **Branches**: Percentage of conditional branches tested
- **Functions**: Percentage of functions called
- **Lines**: Percentage of lines executed

### Example Coverage Report

```
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|------------------
All files          |   78.5  |   72.3   |  81.2   |  78.5   |
  shared/          |   89.2  |   85.5   |  90.1   |  89.2   |
  core/services/   |   76.4  |   68.9   |  78.3   |  76.4   |
  wizard/          |   65.2  |   61.3   |  67.8   |  65.2   |
```

### Interpreting the Metrics

**Statements Coverage (% Stmts)**
- Measures if each statement in the code was executed at least once
- Most fundamental coverage metric
- Target: >80% for most projects

**Branch Coverage (% Branch)**
- Measures if all conditional branches (if/else, switch cases) were tested
- More strict than statement coverage
- Important for error handling paths
- Target: >75% for good coverage

**Function Coverage (% Funcs)**
- Measures if each function/method was called at least once
- Helps identify dead code
- Target: >80% for most projects

**Line Coverage (% Lines)**
- Similar to statements but more granular
- Target: >80% for consistency

### Coverage Report Interpretation Guide

**High Coverage (>85%)**
- ✅ Code is well-tested
- ✅ Confident in refactoring
- ⚠️ May be over-testing (diminishing returns on 100% coverage)

**Good Coverage (75-85%)**
- ✅ Adequate testing for most projects
- ✅ Covers main paths and error scenarios
- ⚠️ Some edge cases may not be tested
- 🎯 **Target for this project**

**Low Coverage (<60%)**
- ❌ Code quality risk
- ❌ Difficult to refactor safely
- 🔴 **Indicates testing gaps**

**Very Low Coverage (<40%)**
- 🔴 **Critical issue - block merge**
- ❌ Major portions of code are untested
- ❌ Regression risk is high

---

## Coverage Thresholds and Gates

### Global Coverage Thresholds

Jest can enforce minimum coverage with configuration in `jest.config.cjs`:

```javascript
module.exports = {
  // ... other config
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!src/main.ts',
    '!src/polyfills.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Per-file thresholds can also be set
    './src/app/core/services/': {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
```

### Current Project Thresholds

**Global Minimums:**
- Statements: 80%
- Branches: 70%
- Functions: 80%
- Lines: 80%

**Core Services (Higher Standards):**
- Statements: 85%
- Branches: 75%
- Functions: 85%
- Lines: 85%

**Shared Components:**
- Statements: 85%
- Branches: 80%
- Functions: 85%
- Lines: 85%

### What Happens if Thresholds Aren't Met

If a PR introduces code that drops below coverage thresholds:

1. **Local Development**: Jest test fails with error
2. **CI Pipeline**: Test job fails, blocks PR merge
3. **Coverage Reports**: Shows which files/areas are below threshold
4. **Developer Action Required**: Either increase coverage or update thresholds

### Updating Coverage Thresholds

**When to Update Thresholds:**
- ❌ **Never lower** thresholds to make tests pass
- ✅ **Raise gradually** as team improves test coverage
- ✅ **Adjust per-file** for legacy code that's hard to test

**Process to Update:**
1. Review current coverage metrics
2. Propose threshold changes in PR description
3. Get code review approval
4. Update `jest.config.cjs`
5. Update corresponding tests
6. Document rationale in commit message

Example commit message:
```
Raise core services coverage threshold from 80% to 85%

The team has improved testing practices for core services.
Coverage has consistently exceeded 85% for the last quarter,
so raising the threshold ensures continued quality.
```

---

## Interpreting Coverage Drops

### What Causes Coverage Drops

Coverage can drop in a PR for several reasons:

**Code Addition Without Tests**
```typescript
// New code without tests
export function newFeature() {
  return expensiveCalculation();
}
```

**Untested Error Paths**
```typescript
// Tested happy path, but error handling not tested
getData().catch(err => {
  logError(err);  // ❌ Not tested
  return null;
});
```

**Conditional Features**
```typescript
// Code for EE only
if (isEnterpriseEdition()) {
  enableFeature();  // ❌ Not tested in CE builds
}
```

### Identifying the Problem

**Step 1: Review the Report**
- Open the CI coverage report artifact
- Find files with coverage decrease
- Check which lines are uncovered

**Step 2: Understand the Context**
```bash
# Local reproduction
npm run test:ci
# Check modules/web/coverage/lcov-report/index.html
```

**Step 3: Common Patterns**

**Pattern A: New Code Without Tests**
```typescript
// In PR: Added new validation function
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);  // ❌ Coverage drop!
}
```

**Solution:** Add corresponding test file
```typescript
describe('validateEmail', () => {
  it('should return true for valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should return false for invalid emails', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

**Pattern B: Refactored Code**
Sometimes refactoring changes line numbers, making old coverage data inaccurate.

**Solution:** Regenerate coverage locally and commit
```bash
npm run test:ci
# Verify coverage looks correct
```

**Pattern C: Feature Flag Code**
```typescript
// Code for EE edition
if (isEnterpriseEdition()) {
  this.showPremiumFeature();  // ❌ Not covered in CE tests
}
```

**Solution:** Test both code paths or accept edition-specific coverage
```typescript
describe('Feature', () => {
  it('should show premium feature in EE', () => {
    // Mock isEnterpriseEdition to return true
    // Test that feature is shown
  });
});
```

### Acceptable Coverage Drops

**Small Drops Are Usually Fine:**
- Coverage drop < 1% - Not concerning
- Affected files have tests for new code
- Existing tests still pass

**Drops That Need Attention:**
- Coverage drop > 2% - Needs explanation
- Large file with minimal tests
- Critical business logic uncovered

**Unacceptable Drops:**
- Coverage drop > 5% on critical paths
- New code with zero test coverage
- Error handling completely untested

### Discussing Coverage in PR Reviews

**Reviewer Perspective:**
```
"I see coverage dropped by 3% in src/app/wizard/.
Can you add tests for the new validation logic?
The new buildClusterSpec() function at lines 45-67
needs at least happy-path and error tests."
```

**Developer Response:**
```
"Added tests for the wizard validation step:
- Happy path: cluster spec builds correctly ✓
- Error path: handles invalid input ✓
- Edge case: handles empty machine deployments ✓

Coverage back to baseline + 2% improvement 📈"
```

---

## Handling CI Test Failures

### Types of Test Failures

**Type 1: Logic Errors (Most Common)**
```
FAIL modules/web/src/app/cluster/cluster.service.spec.ts
  ClusterService
    getCluster
      ✗ should return cluster when API succeeds

Expected: {id: "c1", name: "Production"}
Received: undefined
```

**Type 2: Timeout Errors**
```
FAIL modules/web/src/app/wizard/wizard.component.spec.ts
  WizardComponent
    ✗ should validate cluster creation form (async)

Timeout - Async callback was not invoked within 5000ms
```

**Type 3: Module Resolution Errors**
```
FAIL modules/web/src/app/shared/component.spec.ts

Cannot find module '@app/core/services/auth.service'
```

**Type 4: Flaky Tests**
```
Tests pass locally but fail randomly in CI
- Race conditions with async code
- Timing-dependent logic
- Non-deterministic mocks
```

### Step-by-Step Debugging

**Step 1: Analyze Error Message**

```bash
# Run tests locally with same config as CI
npm run test:ci

# Search for the failing test
npm test -- path/to/failing.spec.ts

# Run with verbose output
npm test -- --verbose
```

**Step 2: Reproduce Locally**

```bash
# Clear node_modules and reinstall (match CI behavior)
rm -rf node_modules && npm ci

# Run the specific failing test
npm test -- src/app/wizard/wizard.component.spec.ts
```

**Step 3: Common Fixes by Error Type**

**Logic Errors:**
```typescript
// ❌ Bug in test
it('should return cluster', () => {
  const cluster = service.getCluster('id');
  expect(cluster).toEqual({id: 'id', name: 'Test'});
  // But service returns Observable, not direct value!
});

// ✅ Fixed
it('should return cluster', (done) => {
  service.getCluster('id').subscribe(cluster => {
    expect(cluster).toEqual({id: 'id', name: 'Test'});
    done();
  });
});
```

**Timeout Errors:**
```typescript
// ❌ Async operation not completed
it('should load data', (done) => {
  component.loadData();
  expect(component.data).toBeDefined();
  done();
  // ❌ Doesn't wait for loadData() to complete
});

// ✅ Fixed with proper async handling
it('should load data', (done) => {
  component.loadData().subscribe(() => {
    expect(component.data).toBeDefined();
    done();
  });
});
```

**Module Errors:**
```typescript
// ❌ Wrong import path
import { AuthService } from '../../services/auth.service';

// ✅ Use path aliases (defined in jest.config.cjs)
import { AuthService } from '@core/services/auth/service';
```

**Flaky Tests:**
```typescript
// ❌ Race condition - setTimeout not guaranteed
it('should update after delay', () => {
  service.delayedUpdate();
  setTimeout(() => {
    expect(service.isUpdated).toBe(true);
  }, 100);
});

// ✅ Use proper async testing
it('should update after delay', (done) => {
  service.delayedUpdate().subscribe(() => {
    expect(service.isUpdated).toBe(true);
    done();
  });
});

// ✅ Or mock timers
it('should update after delay', () => {
  jest.useFakeTimers();
  service.delayedUpdate();
  jest.advanceTimersByTime(100);
  expect(service.isUpdated).toBe(true);
  jest.useRealTimers();
});
```

### CI-Specific Issues

**Issue: Tests Pass Locally but Fail in CI**

Possible causes:
1. Environment differences (Node version, OS)
2. Test isolation issues (tests affecting each other)
3. Timing-dependent code
4. File system differences

**Solution:**
```bash
# Reproduce CI conditions exactly
# 1. Run tests in serial mode (like CI)
npm test -- --runInBand

# 2. Run tests in order they run in CI
npm test:ci

# 3. Clear any cached state
rm -rf node_modules package-lock.json
npm ci
npm run test:ci
```

**Issue: Coverage Thresholds Fail in CI but Pass Locally**

Possible causes:
1. Different source files included/excluded
2. Configuration differences
3. Node modules not synchronized

**Solution:**
```bash
# Verify configuration
npm run test:ci

# Check coverage-summary.json
cat modules/web/coverage/coverage-summary.json

# Compare to thresholds in jest.config.cjs
```

### Reporting and Escalating CI Failures

**If Tests Fail and You Can't Fix Locally:**

1. **Check if it's a known issue**
   ```bash
   # Review recent commits that might have caused it
   git log --oneline -10

   # Search DEBUGGING-TESTS.md for similar issues
   ```

2. **Create detailed bug report**
   - Full error message from CI log
   - Local reproduction steps
   - Expected vs actual behavior
   - Environment details (Node version, OS)

3. **Example Bug Report**
   ```
   Title: CI test failure in ClusterService.spec.ts

   Error: "Cannot find module '@app/core/services/auth'"

   Reproduction:
   1. npm ci
   2. npm run test:ci

   The auth service import path is incorrect.
   Works locally because node_modules is cached.

   Solution: Use correct path alias from jest.config.cjs
   ```

---

## Local Verification Before Push

### Pre-Push Checklist

Before pushing to GitHub, verify locally that CI will pass:

```bash
# 1. Install fresh dependencies
npm ci

# 2. Run all quality checks
npm run check

# 3. Run tests with coverage (like CI)
npm run test:ci

# 4. Verify no coverage drops
# Check modules/web/coverage/coverage-summary.json

# 5. Fix any linting issues
npm run fix

# 6. Run affected tests one more time
npm test
```

### Using Husky Pre-Commit Hooks

The project uses Husky for automatic checks:

```bash
# Husky runs before commit
# If it fails, commit is blocked until fixed
npm run fix:ts && npm run fix:scss && npm run fix:html

# Allows you to fix and retry
git add .
git commit -m "Fix linting issues"
```

### Simulating CI Locally

**Exact CI Simulation Script:**

```bash
#!/bin/bash
# scripts/simulate-ci.sh

set -e  # Exit on first error

cd modules/web

echo "🔄 Cleaning and reinstalling dependencies..."
rm -rf node_modules coverage
npm ci

echo "🧪 Running tests with coverage (CI mode)..."
npm run test:ci

echo "✅ All checks passed! Ready to push."
```

Usage:
```bash
chmod +x scripts/simulate-ci.sh
./scripts/simulate-ci.sh
```

---

## CI Configuration Reference

### Coverage Thresholds Configuration

**File:** `modules/web/jest.config.cjs`

```javascript
collectCoverageFrom: [
  'src/**/*.ts',
  '!src/**/*.spec.ts',         // Exclude tests
  '!src/**/index.ts',           // Exclude barrel exports
  '!src/main.ts',               // Exclude entry point
  '!src/polyfills.ts',          // Exclude polyfills
  '!src/environments/**',        // Exclude environment configs
],

coverageThreshold: {
  global: {
    branches: 70,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  './src/app/core/services/': {
    branches: 75,
    functions: 85,
    lines: 85,
    statements: 85,
  },
  './src/app/shared/components/': {
    branches: 80,
    functions: 85,
    lines: 85,
    statements: 85,
  },
},
```

### GitHub Actions Configuration

**File:** `.github/workflows/test.yml`

Key configuration options:

```yaml
# Trigger conditions
on:
  pull_request:
    branches: [main]        # Run on PRs to main
  push:
    branches: [main]        # Run on pushes to main

# Fail if any step fails
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x]

# Coverage upload
- uses: codecov/codecov-action@v3
  with:
    files: ./modules/web/coverage/lcov.info
    fail_ci_if_error: true  # Fail if upload fails
```

### Codecov Configuration

**File:** `codecov.yml` (optional, in project root)

```yaml
coverage:
  precision: 2
  round: down
  range: "70..100"

# Require coverage for pull requests
require:
  changes: 80
  patch: 80
  project: 75

# Don't fail if PR coverage detection fails
flag_carryforward: true
```

### Test Execution Environment Variables

**Available in CI:**
```bash
# Set by GitHub Actions
CI=true
GITHUB_ACTIONS=true
GITHUB_WORKSPACE=/home/runner/work/dashboard
GITHUB_REF=refs/pull/123/merge

# Set in workflow file
NODE_ENV=test
KUBERMATIC_EDITION=ee
```

**Using in Tests:**
```typescript
// Jest setup file or test
if (process.env.CI) {
  // Adjust timeouts for CI environment
  jest.setTimeout(10000);
}

if (process.env.KUBERMATIC_EDITION === 'ce') {
  // Run community edition specific tests
}
```

---

## Troubleshooting Common CI/CD Issues

### Issue: "Jest has detected the following incompatible versions"

```
jest@29 seems to be installed in a way that it doesn't find the
jest-preset-angular package
```

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm ci
npm run test:ci
```

### Issue: "Cannot find module '@app/...'"

The module alias isn't resolved correctly.

**Solution:**
1. Verify path alias in `jest.config.cjs`:
   ```javascript
   '^@app/(.*)$': '<rootDir>/src/app/$1',
   ```

2. Clear Jest cache:
   ```bash
   npm test -- --clearCache
   ```

3. Use absolute imports:
   ```typescript
   // Instead of
   import { Service } from '../../core/services/service';

   // Use
   import { Service } from '@core/services/service';
   ```

### Issue: Coverage Report Not Generated

```bash
# Verify coverage config in jest.config.cjs
# Re-run with coverage flag
npm run test:ci

# Check if coverage directory was created
ls -la modules/web/coverage/
```

### Issue: Timeout Errors Only in CI

Tests pass locally but timeout in CI.

**Solutions:**
1. Increase timeouts for async operations:
   ```typescript
   jest.setTimeout(10000);  // 10 seconds
   ```

2. Use `fakeTimers` for time-dependent tests:
   ```typescript
   jest.useFakeTimers();
   // ... test code
   jest.useRealTimers();
   ```

3. Ensure mocks complete immediately:
   ```typescript
   service.method.mockReturnValue(of(data));  // Immediate
   ```

---

## Best Practices Summary

✅ **DO:**
- Run `npm run test:ci` locally before pushing
- Review coverage reports to understand gaps
- Add tests when coverage drops significantly
- Use path aliases for consistency
- Run tests in CI exactly as configured
- Keep CI configuration in version control

❌ **DON'T:**
- Lower coverage thresholds to make tests pass
- Ignore coverage drop warnings in PRs
- Commit without running local tests
- Modify CI configuration without testing locally
- Leave failing tests in branches
- Test-hunt (randomly changing code to make tests pass)

---

## Additional Resources

- [[README]] - Testing documentation overview
- [[DEBUGGING-TESTS]] - Detailed test debugging guide
- [[TESTING-PATTERNS]] - Common testing patterns
- [[CODE-REVIEW-CHECKLIST]] - What reviewers check
- Jest Documentation: https://jestjs.io/docs/getting-started
- GitHub Actions: https://docs.github.com/en/actions

---

**Last Updated:** March 2026
**Maintained By:** Engineering Team
**Review Cycle:** Quarterly
