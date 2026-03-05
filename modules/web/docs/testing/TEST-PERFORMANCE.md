---
type: reference
title: Test Performance Optimization and Monitoring
created: 2026-03-05
tags:
  - performance
  - testing
  - jest
  - optimization
  - ci-cd
  - monitoring
related:
  - '[[README]]'
  - '[[CI-CD-INTEGRATION]]'
  - '[[TESTING-PATTERNS]]'
  - '[[DEBUGGING-TESTS]]'
---

# Test Performance: Measurement, Optimization, and Monitoring

This document provides comprehensive guidance on measuring test execution performance, identifying bottlenecks, optimizing slow tests, and monitoring performance trends in the Kubermatic Dashboard test suite.

## Table of Contents

1. [Overview](#overview)
2. [Measuring Test Performance](#measuring-test-performance)
3. [Understanding Performance Metrics](#understanding-performance-metrics)
4. [Identifying Slow Tests](#identifying-slow-tests)
5. [Common Causes of Slow Tests](#common-causes-of-slow-tests)
6. [Optimization Techniques](#optimization-techniques)
7. [Performance Monitoring Tools](#performance-monitoring-tools)
8. [Setting and Maintaining Performance Targets](#setting-and-maintaining-performance-targets)
9. [Performance Anti-Patterns](#performance-anti-patterns)
10. [Troubleshooting Performance Issues](#troubleshooting-performance-issues)

---

## Overview

### Why Test Performance Matters

Fast tests provide critical benefits:

✅ **Developer Productivity** - Quick feedback loop during local development
✅ **CI/CD Efficiency** - Faster pull request validation and deployment
✅ **Cost Savings** - Fewer compute resources needed for CI runners
✅ **Morale** - Developers stay engaged when not waiting for tests
✅ **Quick Iteration** - Enable test-driven development workflows

### Current Performance Targets

**Target for Full Test Suite:**
- `npm test` (without coverage): **< 3 minutes**
- `npm run test:ci` (with coverage): **< 5 minutes**

**By Component Type:**
- Individual test file: < 30 seconds
- Shared component test: < 20 seconds
- Service test: < 10 seconds
- Utility/pipe test: < 5 seconds

### Current State (as of March 2026)

- **Total Test Files**: 50+ files
- **Total Tests**: 1000+ individual test cases
- **Average Suite Time**: ~3-4 minutes for complete suite
- **Coverage Reporting**: Adds ~1-2 minutes in CI

---

## Measuring Test Performance

### Basic Test Execution Time

#### Simple Timing
Get basic execution time with Jest's built-in output:

```bash
npm test

# Or with timestamps
npm test 2>&1 | tee test-results.log
```

Jest automatically reports timing at the end:
```
Test Suites: 15 passed, 15 total
Tests:       250 passed, 250 total
Snapshots:   0 total
Time:        125.456s, estimated 240s
```

#### Individual File Timing
Measure a single test file:

```bash
npm test -- src/app/shared/components/button/component.spec.ts

# With verbose timing
npm test -- src/app/shared/components/button/component.spec.ts --verbose
```

### Detailed Performance Analysis

#### Using Jest's maxWorkers Flag
Control parallelization to understand baseline performance:

```bash
# Serial execution (baseline)
npm test -- --maxWorkers=1 2>&1 | tee serial-performance.log

# Parallel execution (4 workers)
npm test -- --maxWorkers=4 2>&1 | tee parallel-performance.log

# Auto-detect based on CPU count
npm test -- --maxWorkers=auto
```

#### JSON Report with Timing
Generate detailed JSON report with per-test timing:

```bash
npm test -- --json --outputFile=test-results.json

# Then analyze with Node
node -e "
  const data = require('./test-results.json');
  const tests = data.testResults
    .flatMap(f => f.assertionResults)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 20);
  console.log('Top 20 Slowest Tests:');
  tests.forEach(t => console.log(\`  \${(t.duration/1000).toFixed(2)}s - \${t.fullName}\`));
"
```

#### Using Jest Reporters Plugin
Install jest-junit for detailed timing reports:

```bash
npm install --save-dev jest-junit
```

Update `jest.config.cjs`:
```javascript
module.exports = {
  // ... other config
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml',
        reportTestDuration: true,
      },
    ],
  ],
};
```

Then run:
```bash
npm test -- --coverage

# Parse the XML report to find slow tests
npm install --save-dev xml2js
node scripts/analyze-junit-report.js
```

#### Real-Time Performance Monitoring
Use Jest's built-in verbose mode with custom timing output:

```bash
npm test -- --verbose --expand 2>&1 | grep -E "PASS|FAIL|●" | tee verbose-output.log

# Watch specific component tests
npm run test:watch -- src/app/shared/components --verbose
```

### Performance Profiling with Node Inspector

For deep performance analysis:

```bash
# Run tests with Node debugging enabled
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Then open chrome://inspect in Chrome to profile
# - Pause on first test
# - Use Chrome DevTools Performance tab
# - Record execution profile
# - Analyze call stack and timings
```

---

## Understanding Performance Metrics

### Test Execution Time Components

Test execution includes several phases:

```
┌─────────────────────────────────────────────────────────────┐
│ Total Test Execution Time = Boot + Setup + Tests + Report  │
└─────────────────────────────────────────────────────────────┘

1. Jest Boot Time (~2-5s)
   - Node initialization
   - TypeScript compilation
   - Jest plugin loading

2. Test File Loading (~1-3s per file)
   - Module resolution
   - Dependency importing
   - Test discovery

3. Test Execution (~0.5-2s per test)
   - Setup (fixtures, mocks)
   - Test code execution
   - Assertions
   - Cleanup (teardown)

4. Coverage Report Generation (~30-60s)
   - Code coverage analysis
   - Report formatting
   - LCOV file creation

5. Report Output (~1-2s)
   - Console output formatting
   - File writing
```

### Metrics to Track

**Test Count Metrics:**
- Total test files
- Tests per file (average)
- Tests per component type

**Timing Metrics:**
- Total suite time
- Time per file (average)
- Time per test (average)
- Coverage report generation time

**Efficiency Metrics:**
- Tests per second (throughput)
- Time per assertion
- Parallel efficiency (how much parallelization helps)

Example analysis:

```bash
# Calculate tests per second
Tests: 1000
Time: 180 seconds
Throughput: 5.56 tests/second
```

---

## Identifying Slow Tests

### Method 1: Visual Inspection with Jest Output

Jest shows slowest tests at the end of normal output:

```bash
npm test

# Look for this section:
# PASS  src/app/shared/components/button/component.spec.ts (500ms)
# PASS  src/app/wizard/cluster/component.spec.ts (2500ms)  ← Slow!
# PASS  src/app/core/services/cluster.spec.ts (1800ms)    ← Slow!
```

### Method 2: Detailed JSON Analysis

Create a script to analyze test performance:

**scripts/find-slow-tests.js:**
```javascript
const fs = require('fs');
const path = require('path');

// Run Jest and generate JSON report
const { execSync } = require('child_process');
const output = execSync('npm test -- --json', { encoding: 'utf-8' });
const data = JSON.parse(output);

// Find slow tests (> 2 seconds)
const slowTests = data.testResults
  .filter(file => file.perfStats.end - file.perfStats.start > 2000)
  .sort((a, b) => (b.perfStats.end - b.perfStats.start) - (a.perfStats.end - a.perfStats.start));

console.log('\n🐢 Slowest Test Files (> 2 seconds):\n');
slowTests.forEach(file => {
  const duration = (file.perfStats.end - file.perfStats.start) / 1000;
  const testCount = file.numPassingTests;
  console.log(`  ${duration.toFixed(2)}s [${testCount} tests] ${file.name}`);
});

// Find slow individual tests
const slowIndividualTests = data.testResults
  .flatMap(file =>
    file.assertionResults
      .map(test => ({...test, file: file.name}))
  )
  .filter(test => test.duration > 1000)
  .sort((a, b) => b.duration - a.duration)
  .slice(0, 10);

console.log('\n⏱️  Slowest Individual Tests (Top 10):\n');
slowIndividualTests.forEach(test => {
  const duration = (test.duration / 1000).toFixed(2);
  const filename = path.basename(test.file);
  console.log(`  ${duration}s - ${test.title} (${filename})`);
});
```

Run it:
```bash
node scripts/find-slow-tests.js
```

### Method 3: CI Pipeline Analysis

Extract timing from CI build logs:

```bash
# From GitHub Actions run output
# Filter for "PASS" lines with timing
grep "PASS" test-results.log | awk '{print $NF}' | sort -rn | head -20

# Example output:
# (2500ms)
# (2100ms)
# (1950ms)
```

### Method 4: Watch Mode Analysis

In watch mode, quickly identify which tests are slow:

```bash
npm run test:watch

# When tests complete, look at timing output
# Press 'p' to filter by filename and run specific tests
# This helps isolate which component's tests are slow
```

---

## Common Causes of Slow Tests

### 1. Excessive TestBed Configuration

**Problem:** Setting up too many providers/imports for a single test

```typescript
// ❌ SLOW - Overly complex setup
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [
      BrowserModule,
      CommonModule,
      ReactiveFormsModule,
      MatButtonModule,
      MatCardModule,
      MatDialogModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatTabsModule,
      MatToolbarModule,
      // ... 20 more modules
    ],
    declarations: [ComponentToTest, 50 other components],
    providers: [
      Service1, Service2, Service3, // ... 30 services
    ],
  }).compileComponents();
});
```

**Solution:** Use TestBedSetup helper or minimal configuration

```typescript
// ✅ FAST - Minimal, focused setup
beforeEach(async () => {
  const {fixture} = await TestBedSetup.configureComponentWithServices({
    imports: [ReactiveFormsModule],
    declarations: [ComponentToTest],
    providers: [ServiceBeingTested],
  });
  component = fixture.componentInstance;
});
```

### 2. Unnecessary HTTP Mocking

**Problem:** Creating real HTTP mocks for every test when not needed

```typescript
// ❌ SLOW - Every test waits for HTTP mock setup
beforeEach(() => {
  const httpMock = TestBed.inject(HttpTestingController);
  // ... setup 10+ mock endpoints

  // Then teardown
  afterEach(() => {
    httpMock.verify(); // Takes time for each test
  });
});
```

**Solution:** Use HttpMockBuilder only when needed, use `of()` for simple cases

```typescript
// ✅ FAST - Only mock what's needed
it('should display title', () => {
  // Don't need HTTP mock for this test
  component.title = 'Test Title';
  fixture.detectChanges();
  expect(component.title).toBe('Test Title');
});

it('should load data via HTTP', () => {
  // Only this test needs HTTP mock
  const httpMock = TestBed.inject(HttpTestingController);
  // ... minimal setup
});
```

### 3. Async Operations Without Proper Handling

**Problem:** Async operations that aren't properly resolved

```typescript
// ❌ SLOW - Test might wait for timeout
it('should load data', (done) => {
  service.loadData().subscribe(data => {
    expect(data).toBeDefined();
    done();
  });
  // If observable never completes, test hangs until timeout
});
```

**Solution:** Use proper async/fakeAsync utilities

```typescript
// ✅ FAST - Properly handles async
it('should load data', fakeAsync(() => {
  service.loadData().subscribe(data => {
    expect(data).toBeDefined();
  });
  tick();
}));
```

### 4. Unnecessary Change Detection Calls

**Problem:** Calling detectChanges multiple times per test

```typescript
// ❌ SLOW - Multiple expensive change detection passes
it('should update on input change', () => {
  component.value = 'test';
  fixture.detectChanges();
  fixture.detectChanges();
  fixture.detectChanges(); // Unnecessary!
  expect(component.value).toBe('test');
});
```

**Solution:** Call detectChanges once when needed

```typescript
// ✅ FAST - Single change detection
it('should update on input change', () => {
  component.value = 'test';
  fixture.detectChanges(); // Once is enough
  expect(component.value).toBe('test');
});
```

### 5. Not Using shallow Rendering

**Problem:** Testing child components when you only care about parent

```typescript
// ❌ SLOW - Full component tree compiled
TestBed.configureTestingModule({
  imports: [BrowserModule, FormsModule, MatModule, HttpModule],
  declarations: [
    ComponentToTest,
    ChildComponent1,
    ChildComponent2,
    ChildComponent3,
    // ... 20 child components need to compile
  ],
});
```

**Solution:** Use NO_ERRORS_SCHEMA or mock child components

```typescript
// ✅ FAST - Only test parent component
TestBed.configureTestingModule({
  declarations: [ComponentToTest],
  schemas: [NO_ERRORS_SCHEMA], // Ignore unknown elements
});
```

### 6. Large Test Setup Data

**Problem:** Creating extensive mock data for every test

```typescript
// ❌ SLOW - Recreates large data structures
beforeEach(() => {
  mockData = generateLargeDataset(1000); // Expensive
});
```

**Solution:** Reuse or create minimal necessary data

```typescript
// ✅ FAST - Minimal, reusable data
const MOCK_DATA = generateLargeDataset(1000); // Once
beforeEach(() => {
  mockData = MOCK_DATA; // Reference, don't recreate
});
```

### 7. setTimeout/Timer Dependencies

**Problem:** Tests that depend on real timers

```typescript
// ❌ SLOW - Actual delay
it('should show message after delay', (done) => {
  setTimeout(() => {
    expect(component.message).toBe('Done');
    done();
  }, 1000); // 1 second delay in EVERY test
});
```

**Solution:** Use fakeAsync and tick

```typescript
// ✅ FAST - Fake timer advancement
it('should show message after delay', fakeAsync(() => {
  component.showMessageWithDelay(1000);
  tick(1000); // Instant in test time
  expect(component.message).toBe('Done');
}));
```

### 8. Unnecessary Compilation

**Problem:** compileComponents() called when not needed

```typescript
// ❌ SLOW - Unnecessary compilation
beforeEach(async () => {
  await TestBed.configureTestingModule({
    // ... simple setup that doesn't need compilation
  }).compileComponents(); // Takes time!
});
```

**Solution:** Only compile when using external templates

```typescript
// ✅ FAST - Skip compilation when possible
beforeEach(async () => {
  await TestBed.configureTestingModule({
    // ...
  });
  // No compileComponents() needed for inline templates
});
```

---

## Optimization Techniques

### Optimization 1: Use Minimal TestBed Setup

**Before:**
```typescript
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [
      BrowserModule,
      CommonModule,
      ReactiveFormsModule,
      MatModule,
      HttpClientModule,
    ],
    declarations: [
      ComponentToTest,
      MockComponents(), // 20+ mocks
    ],
    providers: [
      Service1,
      Service2,
      Service3,
      Service4,
    ],
  }).compileComponents();

  fixture = TestBed.createComponent(ComponentToTest);
  component = fixture.componentInstance;
});
```

**After:**
```typescript
const setup = await TestBedSetup.configureComponentWithServices({
  imports: [ReactiveFormsModule],
  declarations: [ComponentToTest],
  providers: [ServiceBeingTested],
});
fixture = setup.fixture;
component = fixture.componentInstance;
```

**Performance Impact:** 60-70% reduction in setup time

### Optimization 2: Leverage Shared Mock Services

**Before:**
```typescript
// Each test file recreates mocks
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      {provide: AuthService, useClass: AuthMockService},
      {provide: ProjectService, useClass: ProjectMockService},
      {provide: ClusterService, useClass: ClusterMockService},
    ],
  });
});
```

**After:**
```typescript
// Reuse pre-configured mock services from src/test/services/
import {
  AuthMockService,
  ProjectMockService,
  ClusterMockService,
} from '@test/services';

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      {provide: AuthService, useClass: AuthMockService},
      {provide: ProjectService, useClass: ProjectMockService},
      {provide: ClusterService, useClass: ClusterMockService},
    ],
  });
});
```

**Performance Impact:** Faster test file loading, better memory reuse

### Optimization 3: Use Shallow Rendering

**Before:**
```typescript
TestBed.configureTestingModule({
  declarations: [
    ButtonComponent,
    IconComponent,
    BadgeComponent,
    ContextMenuComponent,
    // ... 30+ child components
  ],
});
```

**After:**
```typescript
TestBed.configureTestingModule({
  declarations: [ButtonComponent],
  schemas: [NO_ERRORS_SCHEMA], // Ignore children
});
```

**Performance Impact:** 50-80% reduction in component compilation time

### Optimization 4: Replace Real Timers with Fake Timers

**Before:**
```typescript
it('should debounce input', (done) => {
  component.onChange('test');
  setTimeout(() => {
    expect(component.value).toBe('test');
    done();
  }, 500); // 500ms per test!
});
```

**After:**
```typescript
it('should debounce input', fakeAsync(() => {
  component.onChange('test');
  tick(500); // Instant in test time
  expect(component.value).toBe('test');
}));
```

**Performance Impact:** 100-500x faster (from ms to µs)

### Optimization 5: Cache Expensive Computations

**Before:**
```typescript
beforeEach(() => {
  mockData = generateExpensiveDataset(); // Called 100+ times
});
```

**After:**
```typescript
const MOCK_DATA = generateExpensiveDataset(); // Once

beforeEach(() => {
  mockData = MOCK_DATA; // Reference only
});
```

**Performance Impact:** Depends on data generation (often 10-100x)

### Optimization 6: Use Marble Testing for Complex Observables

**Before:**
```typescript
it('should merge streams', (done) => {
  let results = [];
  source1.merge(source2).subscribe(val => {
    results.push(val);
    if (results.length === 3) {
      expect(results).toEqual([1, 2, 3]);
      done();
    }
  });
  // Relies on timing, flaky
});
```

**After:**
```typescript
it('should merge streams', () => {
  const source1 = cold('a-b-|');
  const source2 = cold('--c-|');
  const expected = '----(abc)|';

  const result = source1.merge(source2);
  expectObservable(result).toBe(expected);
  expectSubscriptions(source1.subscriptions).toBe([]);
});
```

**Performance Impact:** Instant execution, more reliable

### Optimization 7: Parallel Test Execution

Jest automatically parallelizes tests. Optimize by:

```bash
# Run tests with specific worker count (default: CPU count)
npm test -- --maxWorkers=8

# For CI, force serial to prevent resource exhaustion
npm run test:ci  # Already uses -i (serial) flag
```

### Optimization 8: Skip Unnecessary Tests Locally

```bash
# Run only tests for changed files
npm test -- --onlyChanged

# Run tests matching pattern
npm test -- --testNamePattern="Button component"

# Run tests in specific directory
npm test -- src/app/shared/components
```

---

## Performance Monitoring Tools

### 1. Built-in Jest Performance Metrics

Jest provides basic timing with `--verbose`:

```bash
npm test -- --verbose

# Output includes:
# PASS  src/app/shared/components/button/component.spec.ts (523ms)
#   Button Component
#     ✓ should render with label (15ms)
#     ✓ should handle click (8ms)
#     ✓ should be disabled (5ms)
```

### 2. Custom Jest Performance Hooks

Create a custom Jest reporter for detailed monitoring:

**jest.config.cjs:**
```javascript
module.exports = {
  // ... other config
  reporters: ['default', '<rootDir>/scripts/performance-reporter.js'],
};
```

**scripts/performance-reporter.js:**
```javascript
class PerformanceReporter {
  onTestResult(test, testResult, aggregatedResult) {
    const duration = testResult.perfStats.end - testResult.perfStats.start;
    const testCount = testResult.numPassingTests;
    const avgTime = duration / testCount;

    if (duration > 2000) {
      console.log(`\n⚠️  Slow test file: ${testResult.testFilePath}`);
      console.log(`   Duration: ${(duration/1000).toFixed(2)}s`);
      console.log(`   Tests: ${testCount}`);
      console.log(`   Avg/test: ${(avgTime).toFixed(0)}ms`);
    }
  }
}

module.exports = PerformanceReporter;
```

### 3. Performance Tracking Dashboard

Create a script to track performance over time:

**scripts/track-performance.js:**
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run tests and get JSON output
const output = execSync('npm test -- --json 2>/dev/null', { encoding: 'utf-8' });
const results = JSON.parse(output);

// Extract metrics
const timestamp = new Date().toISOString();
const totalTime = (results.testResults.reduce((sum, file) =>
  sum + (file.perfStats.end - file.perfStats.start), 0)) / 1000;
const testCount = results.numTotalTests;
const passCount = results.numPassedTests;
const passRate = ((passCount / testCount) * 100).toFixed(1);

// Append to performance log
const entry = {
  timestamp,
  totalTime: totalTime.toFixed(2),
  testCount,
  passCount,
  passRate,
};

const logFile = 'performance-history.jsonl';
fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');

console.log(`Performance tracked: ${totalTime.toFixed(2)}s, ${testCount} tests`);
```

Run regularly (e.g., daily):
```bash
node scripts/track-performance.js
# View trends
tail -20 performance-history.jsonl
```

### 4. GitHub Actions Performance Tracking

Add to CI workflow to track performance over time:

**.github/workflows/test.yml:**
```yaml
- name: Track test performance
  if: github.event_name == 'push'
  run: |
    npm test -- --json > test-results.json
    node scripts/check-performance.js

- name: Comment performance on PR
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v6
  with:
    script: |
      const fs = require('fs');
      const results = JSON.parse(fs.readFileSync('test-results.json'));
      const totalTime = results.testResults.reduce((sum, f) =>
        sum + (f.perfStats.end - f.perfStats.start), 0) / 1000;
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `⏱️ Test execution: ${totalTime.toFixed(2)}s`
      });
```

### 5. Visual Performance Analysis

Use Chrome DevTools for detailed profiling:

```bash
# Run Jest with Node debugger
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Open chrome://inspect in Chrome
# - Click "Inspect" on the jest process
# - Go to Performance tab
# - Click record
# - Tests will run with profiling
# - Analyze call stacks and timing
```

---

## Setting and Maintaining Performance Targets

### Establishing Baselines

Create a performance baseline document:

```bash
npm test -- --json > baseline-results.json
node scripts/analyze-baseline.js
```

**scripts/analyze-baseline.js:**
```javascript
const results = require('./baseline-results.json');

console.log('📊 Test Performance Baseline\n');

const totalTime = results.testResults.reduce((sum, f) =>
  sum + (f.perfStats.end - f.perfStats.start), 0);

console.log(`Total Suite Time: ${(totalTime/1000).toFixed(2)}s`);
console.log(`Test Count: ${results.numTotalTests}`);
console.log(`Pass Rate: ${((results.numPassedTests/results.numTotalTests)*100).toFixed(1)}%`);
console.log(`Avg Time/Test: ${(totalTime/results.numTotalTests).toFixed(0)}ms\n`);

// Per-file analysis
const slowest = results.testResults
  .sort((a, b) => (b.perfStats.end - b.perfStats.start) -
                   (a.perfStats.end - a.perfStats.start))
  .slice(0, 10);

console.log('Slowest 10 Test Files:');
slowest.forEach(f => {
  const time = (f.perfStats.end - f.perfStats.start) / 1000;
  console.log(`  ${time.toFixed(2)}s - ${f.name}`);
});
```

### Performance Regression Detection

Add script to CI to detect regressions:

**scripts/check-performance-regression.js:**
```javascript
const fs = require('fs');
const { execSync } = require('child_process');

const PERFORMANCE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const MAX_TIME_INCREASE = 0.1; // 10% increase alert

// Get current performance
const output = execSync('npm test -- --json 2>/dev/null', { encoding: 'utf-8' });
const results = JSON.parse(output);

const totalTime = results.testResults.reduce((sum, f) =>
  sum + (f.perfStats.end - f.perfStats.start), 0);

// Load baseline
const baselineFile = 'performance-baseline.json';
if (!fs.existsSync(baselineFile)) {
  console.log('📌 Creating performance baseline...');
  fs.writeFileSync(baselineFile, JSON.stringify({totalTime, timestamp: Date.now()}));
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf-8'));
const percentChange = ((totalTime - baseline.totalTime) / baseline.totalTime);

console.log(`\n⏱️  Performance Check:`);
console.log(`  Previous: ${(baseline.totalTime/1000).toFixed(2)}s`);
console.log(`  Current:  ${(totalTime/1000).toFixed(2)}s`);
console.log(`  Change:   ${(percentChange*100).toFixed(1)}%`);

if (totalTime > PERFORMANCE_THRESHOLD) {
  console.error(`\n❌ ERROR: Tests exceed 5-minute target!`);
  process.exit(1);
}

if (percentChange > MAX_TIME_INCREASE) {
  console.warn(`\n⚠️  WARNING: Performance degraded by ${(percentChange*100).toFixed(1)}%`);
  console.warn(`  Consider optimizing slow tests.\n`);
}

// Update baseline
fs.writeFileSync(baselineFile, JSON.stringify({totalTime, timestamp: Date.now()}));
```

### Team Performance Goals

Create a team dashboard tracking these metrics:

```
Quarter Performance Goals:

✅ Q1 2026:
- Full test suite: < 5 minutes (CI), < 3 minutes (local)
- 95% of test files: < 30 seconds
- No individual test: > 5 seconds
- Pass rate: > 99%

🎯 Q2 2026:
- Full test suite: < 4 minutes (CI), < 2.5 minutes (local)
- 98% of test files: < 25 seconds
- No individual test: > 3 seconds
- Maintain 99%+ pass rate
```

---

## Performance Anti-Patterns

### Anti-Pattern 1: Global beforeEach with Excessive Setup

❌ **Bad:**
```typescript
beforeEach(async () => {
  // Massive setup repeated for every test
  await TestBed.configureTestingModule({
    // 50 imports
    // 30 declarations
    // 40 providers
  }).compileComponents();

  // 100+ lines of mock initialization
  mockService.setup();
  mockHttp.setup();
  mockRouter.setup();
  // ...
});
```

✅ **Good:**
```typescript
describe('Component', () => {
  // Minimal common setup
  beforeEach(async () => {
    await TestBedSetup.configureComponentWithServices({
      imports: [ReactiveFormsModule],
      declarations: [ComponentToTest],
    });
  });

  describe('specific behavior', () => {
    // Specific setup only when needed
    beforeEach(() => {
      mockService.setupSpecificBehavior();
    });
  });
});
```

### Anti-Pattern 2: Relying on Real Timers

❌ **Bad:**
```typescript
it('should handle timeout', (done) => {
  component.handleTimeout();

  setTimeout(() => {
    expect(component.completed).toBe(true);
    done();
  }, 3000); // 3 seconds per test!
});
```

✅ **Good:**
```typescript
it('should handle timeout', fakeAsync(() => {
  jest.useFakeTimers();
  component.handleTimeout();
  jest.advanceTimersByTime(3000);
  expect(component.completed).toBe(true);
  jest.runOnlyPendingTimers();
}));
```

### Anti-Pattern 3: Testing Children Unnecessarily

❌ **Bad:**
```typescript
TestBed.configureTestingModule({
  declarations: [
    ButtonComponent,
    CardComponent,
    DialogComponent,
    ModalComponent,
    TooltipComponent,
    // ... 50 child components
  ],
});
```

✅ **Good:**
```typescript
TestBed.configureTestingModule({
  declarations: [ButtonComponent],
  schemas: [NO_ERRORS_SCHEMA], // Or use shallow rendering lib
});
```

### Anti-Pattern 4: Not Cleaning Up Subscriptions

❌ **Bad:**
```typescript
it('should subscribe to changes', () => {
  component.observable.subscribe(value => {
    // Memory leak: subscription never unsubscribed
  });
  expect(component.value).toBeDefined();
});
```

✅ **Good:**
```typescript
it('should subscribe to changes', () => {
  const subscription = component.observable.subscribe(value => {
    // Properly unsubscribed
  });
  expect(component.value).toBeDefined();
  subscription.unsubscribe();
});
```

---

## Troubleshooting Performance Issues

### Issue: Tests Suddenly Became Slow

**Investigation Steps:**

1. **Check Git History for Recent Changes**
   ```bash
   git log --oneline -20 modules/web/src
   # Look for changes to test files or dependencies
   ```

2. **Compare Performance Before/After Change**
   ```bash
   git stash
   npm test -- --json > before.json
   git stash pop
   npm test -- --json > after.json
   node scripts/compare-performance.js before.json after.json
   ```

3. **Identify Which Tests Became Slow**
   ```bash
   node scripts/find-slow-tests.js | head -20
   ```

4. **Common Culprits**
   - New dependency added (check package.json)
   - New expensive mock setup
   - New large test data set
   - Accidentally committed slow test

### Issue: Parallel Tests Cause Issues but CI Requires Speed

**Solution: Use Smart Parallelization**

```bash
# Parallel for local development (faster feedback)
npm test -- --maxWorkers=4

# Serial for CI (stable, predictable)
npm run test:ci  # Already uses -i flag

# Or with specific worker count
npm test -- --maxWorkers=1
```

### Issue: Coverage Generation Takes Too Long

**Optimization Options:**

```bash
# Skip coverage during development
npm test  # Much faster

# Only generate coverage on CI
npm run test:ci  # Includes coverage

# Or customize coverage in jest.config.cjs:
module.exports = {
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/environments/**',
    '!src/assets/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    'test-base',
  ],
};
```

### Issue: One Test File Slows Down Entire Suite

**Isolate and Fix:**

```bash
# Identify the slow file
npm test -- --json | jq '.testResults | sort_by(.perfStats.end - .perfStats.start) | reverse | .[0]'

# Run it alone to confirm
npm test -- path/to/slow.spec.ts

# Profile it
npm test -- path/to/slow.spec.ts --detectOpenHandles

# Common fixes:
# 1. Reduce TestBed imports
# 2. Use NO_ERRORS_SCHEMA
# 3. Remove real timers
# 4. Check for hanging subscriptions
# 5. Cache expensive setup
```

---

## Summary

### Key Takeaways

1. **Measure First** - Use `npm test` with timing analysis
2. **Target < 5 minutes** - Full suite with coverage in CI
3. **Optimize Setup** - Minimal TestBed configurations
4. **Use Helpers** - TestBedSetup and MockObservableBuilder
5. **Fake Timers** - Never rely on real delays in tests
6. **Monitor Trends** - Track performance over time
7. **Fix Regressions** - Catch slowdowns before they compound
8. **Team Awareness** - Make performance visible to whole team

### Quick Reference Commands

```bash
# Basic timing
npm test

# Detailed analysis
npm test -- --json | node scripts/analyze-performance.js

# Find slowest tests
npm test -- --json > results.json && node scripts/find-slow-tests.js

# Parallel vs serial comparison
npm test -- --maxWorkers=4     # Parallel
npm test -- --maxWorkers=1     # Serial

# Watch specific tests
npm run test:watch -- path/to/component.spec.ts

# Profile with Chrome DevTools
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

---

**Document Last Updated:** March 2026
**Performance Target:** Full suite < 5 minutes (with coverage)
**Optimization Framework:** Jest + Angular Testing Utilities
