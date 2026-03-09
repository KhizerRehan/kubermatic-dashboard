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

# Jest Setup Verification Checklist

This guide helps developers verify their Jest testing setup is correctly configured for the Kubermatic Dashboard. Use this checklist to troubleshoot any test configuration issues.

## Table of Contents

1. [Environment Verification](#environment-verification)
2. [Setup Checklist](#setup-checklist)
3. [Common Issues & Solutions](#common-issues--solutions)
4. [Running Tests](#running-tests)
5. [Verifying Test Configuration](#verifying-test-configuration)

---

## Environment Verification

### Prerequisites

Before running tests, verify your development environment:

- [ ] **Node.js Version**: Check `node --version` returns v20.0.0 or higher
  ```bash
  node --version
  # Expected output: v20.x.x or later
  ```

- [ ] **npm Version**: Check `npm --version` returns 10.0.0 or higher
  ```bash
  npm --version
  # Expected output: npm/10.x.x or later
  ```

- [ ] **Project Directory**: Confirm you're in the web module directory
  ```bash
  pwd
  # Expected output: .../modules/web
  ```

- [ ] **Dependencies Installed**: Verify node_modules exists and has content
  ```bash
  ls node_modules | head -5
  # Should show package directories
  ```

### Installing Dependencies

If node_modules is missing or incomplete:

```bash
npm ci  # Use npm ci for exact dependency versions (preferred in CI)
# OR
npm install  # Use npm install for development
```

---

## Setup Checklist

### Jest Configuration

- [ ] **jest.config.cjs exists**
  ```bash
  ls -la jest.config.cjs
  # File should exist in modules/web directory
  ```

- [ ] **Jest preset is configured**
  - Open `jest.config.cjs` and verify:
    - [ ] `preset: 'jest-preset-angular'` is set
    - [ ] `roots: ['<rootDir>/src']` is configured
    - [ ] `setupFilesAfterEnv: ['<rootDir>/src/test.base.ts']` is present

- [ ] **Module name mappings are configured**
  - Verify these path aliases in jest.config.cjs:
    - [ ] `@app` maps to `src/app`
    - [ ] `@core` maps to `src/app/core`
    - [ ] `@shared` maps to `src/app/shared`
    - [ ] `@test` maps to `src/test`
    - [ ] `@assets` maps to `src/assets`
    - [ ] `@environments` maps to `src/environments`

### Test Setup File

- [ ] **test.base.ts exists**
  ```bash
  ls -la src/test.base.ts
  # File should exist and contain test setup
  ```

- [ ] **test.base.ts imports correctly**
  - Verify the file contains:
    - [ ] `import '@angular/localize'` for i18n support
    - [ ] Zone setup configuration
    - [ ] Mock imports from test mocks file

### Mock Services

- [ ] **Test services directory exists**
  ```bash
  ls -la src/test/services/
  # Should contain mock service files
  ```

- [ ] **Core mock services are present**
  - [ ] `app-config-mock.ts`
  - [ ] `auth-mock.ts`
  - [ ] `project-mock.ts`
  - [ ] `cluster-mock.ts`
  - [ ] `mat-dialog-mock.ts`
  - [ ] `mat-dialog-ref-mock.ts`

- [ ] **Test data factories exist**
  ```bash
  ls -la src/test/data/
  # Should contain factory files for mock data
  ```

### TypeScript Configuration

- [ ] **tsconfig.json is valid**
  ```bash
  npx tsc --noEmit
  # Should complete without errors
  ```

- [ ] **tsconfig.spec.json exists** (if applicable)
  - Some projects have separate spec configuration
  - Verify it extends tsconfig.json correctly

---

## Running Tests

### Basic Test Execution

#### Run All Tests

```bash
npm test
# Runs all tests once and exits
```

#### Watch Mode (Development)

```bash
npm run test:watch
# Watches for file changes and reruns affected tests
# Press 'q' to quit
```

#### CI Mode with Coverage

```bash
npm run test:ci
# Runs all tests with coverage reporting
# Typically used in CI pipelines
```

### Running Specific Tests

#### Run Tests for Specific File

```bash
npm test -- --testPathPattern="component-name"
# Runs tests matching the file path pattern

# Example: Run only form component tests
npm test -- --testPathPattern="form"
```

#### Run Tests with Name Pattern

```bash
npm test -- --testNamePattern="should validate"
# Runs only tests with matching names
```

#### Run Only Example Tests

```bash
npm test -- --testPathPattern="example-tests"
# Runs all tests in the example-tests directory
```

#### Run Single Test File

```bash
npm test -- src/app/shared/components/simple-display/component.spec.ts
# Runs only this specific test file
```

### Running with Coverage

```bash
npm test -- --coverage
# Shows coverage summary and generates coverage report
```

View coverage in detail:

```bash
npm test -- --coverage --coverageReporters=text
# Shows detailed coverage in terminal

# Or open HTML report (if generated)
open coverage/index.html
```

---

## Common Issues & Solutions

### Issue 1: "Cannot find module '@app'"

**Symptom**: Tests fail with error like `Cannot find module '@app/...`

**Solution**:
1. Verify jest.config.cjs has moduleNameMapper configuration
2. Check that path aliases match directory structure
3. Restart Jest (stop test:watch and run npm test again)

### Issue 2: "Angular test component not found"

**Symptom**: `TestBed.createComponent()` fails with "Component is not part of any NgModule"

**Solution**:
1. Ensure component is declared in TestBed configureTestingModule
2. Verify all dependencies are provided/imported
3. Check that component imports are using correct paths
4. Example fix:
   ```typescript
   TestBed.configureTestingModule({
     declarations: [MyComponent],  // Add component here
     imports: [SharedModule],      // Import required modules
   });
   ```

### Issue 3: "Unexpected token" or "SyntaxError" in tests

**Symptom**: Jest fails to parse TypeScript or template files

**Solution**:
1. Verify TypeScript configuration in jest.config.cjs
2. Check that jest-preset-angular is installed: `npm list jest-preset-angular`
3. Reinstall dependencies: `npm ci`
4. Clear Jest cache: `npm test -- --clearCache`

### Issue 4: "waitForAsync or fakeAsync is not defined"

**Symptom**: Tests fail with "waitForAsync is not defined"

**Solution**:
1. Import from @angular/core/testing:
   ```typescript
   import {waitForAsync, fakeAsync, tick} from '@angular/core/testing';
   ```
2. Ensure test.base.ts is properly loaded
3. Check jest.config.cjs has setupFilesAfterEnv configured

### Issue 5: "Timeout of 5000ms exceeded"

**Symptom**: Tests timeout frequently

**Solution**:
1. Check if operations are truly async (may not need async wrappers)
2. Increase Jest timeout in test:
   ```typescript
   jest.setTimeout(10000);  // 10 seconds
   ```
3. Verify no infinite loops in test setup
4. Use `fakeAsync` and `tick()` instead of `waitForAsync` when possible
5. Profile slow tests: `npm test -- --detectOpenHandles`

### Issue 6: "Cannot find file" when importing components

**Symptom**: `Cannot find module 'src/app/components/my.component'`

**Solution**:
1. Verify file exists and path is correct
2. Use import paths with correct extensions if needed
3. Use configured path aliases (@app, @shared, etc.) instead of relative paths
4. Check for case sensitivity on case-sensitive systems (Linux, Mac)

### Issue 7: "MAT_DIALOG_DATA not provided"

**Symptom**: Dialog tests fail with "NullInjectorError: No provider for MAT_DIALOG_DATA"

**Solution**:
1. Provide MAT_DIALOG_DATA in TestBed:
   ```typescript
   TestBed.configureTestingModule({
     providers: [
       {provide: MAT_DIALOG_DATA, useValue: {/* mock data */}}
     ]
   });
   ```
2. Use MatDialogRefMock from test services:
   ```typescript
   import {MatDialogRefMock} from '@test/services';
   TestBed.configureTestingModule({
     providers: [
       {provide: MatDialogRef, useClass: MatDialogRefMock}
     ]
   });
   ```

### Issue 8: "Module not found: jest-preset-angular"

**Symptom**: Jest fails to load jest-preset-angular

**Solution**:
1. Verify package is installed: `npm list jest-preset-angular`
2. Reinstall if missing: `npm ci`
3. Check jest.config.cjs has correct preset name: `'jest-preset-angular'`
4. Clear npm cache: `npm cache clean --force && npm ci`

### Issue 9: "Tests pass locally but fail in CI"

**Symptom**: All tests pass with `npm test` but fail in CI environment

**Solution**:
1. Use `npm run test:ci` locally to mimic CI conditions
2. Check environment variables are set correctly
3. Ensure all files are committed (node_modules not in git)
4. Verify Node.js version matches in CI: check .nvmrc file
5. Clear Jest cache in CI: add `npm test -- --clearCache` before running tests

### Issue 10: "Observable subscription memory leak warning"

**Symptom**: Jest warns about unsubscribed observables

**Solution**:
1. Ensure components unsubscribe in ngOnDestroy:
   ```typescript
   ngOnDestroy(): void {
     if (this.subscription) {
       this.subscription.unsubscribe();
     }
   }
   ```
2. Use takeUntil pattern:
   ```typescript
   private destroy$ = new Subject<void>();

   ngOnInit() {
     this.service.data$.pipe(
       takeUntil(this.destroy$)
     ).subscribe(...);
   }

   ngOnDestroy() {
     this.destroy$.next();
     this.destroy$.complete();
   }
   ```
3. Suppress warning if expected: use fakeAsync/tick instead of waitForAsync

---

## Verifying Test Configuration

### Quick Validation Script

Run this command to verify basic configuration:

```bash
# Check Node versions
node --version && npm --version

# Check jest.config.cjs exists
ls -la jest.config.cjs

# Check test.base.ts exists
ls -la src/test.base.ts

# Check core mock services
ls -la src/test/services/app-config-mock.ts
ls -la src/test/services/auth-mock.ts
ls -la src/test/services/project-mock.ts

# Try running a simple test
npm test -- --testPathPattern="example-tests" --passWithNoTests
```

### Detailed Configuration Check

To see all Jest configuration values:

```bash
npm test -- --showConfig
# Outputs all Jest configuration settings
```

### TypeScript Compilation Check

Verify all TypeScript files compile correctly:

```bash
npx tsc --noEmit
# Should complete without errors
```

---

## Additional Resources

- **Testing Patterns Guide**: See [TESTING-PATTERNS.md](./TESTING-PATTERNS.md) for comprehensive patterns and examples
- **Mock Services Reference**: See [MOCK-SERVICES-REFERENCE.md](./MOCK-SERVICES-REFERENCE.md) for available mocks and usage
- **Example Tests**: Check `src/app/shared/components/example-tests/` for working test examples
- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Angular Testing Guide**: https://angular.io/guide/testing
- **jest-preset-angular**: https://github.com/thymikee/jest-preset-angular

---

## Getting Help

If you encounter issues not covered here:

1. Check the [TESTING-PATTERNS.md](./TESTING-PATTERNS.md) guide for similar patterns
2. Review the [example tests](../../../src/app/shared/components/example-tests/) for working implementations
3. Check Jest documentation: `npm test -- --help`
4. Run with verbose output: `npm test -- --verbose`
5. Enable debug mode: `DEBUG=* npm test`

---

**Last Updated**: March 2026
**Jest Version**: Latest (see package.json)
**Angular Version**: 20.3.x
**Node.js Requirement**: 20.0.0+
