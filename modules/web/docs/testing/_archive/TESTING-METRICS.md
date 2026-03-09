---
type: reference
title: Testing Metrics & Monitoring Guide
created: 2026-03-05
tags:
  - metrics
  - monitoring
  - coverage
  - testing
  - quality-assurance
related:
  - '[[CI-CD-INTEGRATION]]'
  - '[[TEST-PERFORMANCE]]'
  - '[[COMPREHENSIVE-COVERAGE-REPORT]]'
  - '[[MAINTENANCE-PROCESS]]'
---

# Testing Metrics & Monitoring Guide

## Overview

This guide helps you understand, measure, and track the key metrics that indicate the health and effectiveness of our testing suite. Effective metric tracking enables data-driven decisions about testing priorities and resource allocation.

**Key Metrics:**
- **Coverage %** - Code lines/branches covered by tests
- **Test Count** - Total number of test cases
- **Pass Rate** - Percentage of tests passing
- **Execution Time** - Duration to run full test suite

---

## Table of Contents

1. [Key Metrics Explained](#key-metrics-explained)
2. [Measuring Metrics](#measuring-metrics)
3. [Reporting & Dashboards](#reporting--dashboards)
4. [Coverage Goals by Component](#coverage-goals-by-component)
5. [Identifying Trends](#identifying-trends)
6. [Metric Dashboard Setup](#metric-dashboard-setup)
7. [Monitoring Tools](#monitoring-tools)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Key Metrics Explained

### 1. Code Coverage

**Definition:** The percentage of source code lines executed by tests.

**Why It Matters:**
- Indicates test completeness
- Higher coverage = fewer undetected bugs
- Helps identify untested edge cases
- Shows which areas need attention

**Coverage Types:**

| Type | Measures | Target |
|------|----------|--------|
| **Statements** | Individual statements executed | 75%+ |
| **Branches** | If/else paths taken | 70%+ |
| **Functions** | Functions called | 75%+ |
| **Lines** | Lines of code executed | 75%+ |

**Example:**
```typescript
// This function has 3 branches (if, else if, else)
export function calculateDiscount(price: number): number {
  if (price > 1000) {
    return price * 0.2;  // Branch 1: 20% discount
  } else if (price > 500) {
    return price * 0.1;  // Branch 2: 10% discount
  }
  return price;           // Branch 3: no discount
}

// To achieve 100% branch coverage, you need tests for all 3 branches
```

**How to Interpret:**
- **90%+ coverage** - Excellent, most code paths tested
- **75-90% coverage** - Good, acceptable for most projects
- **60-75% coverage** - Needs improvement, focus on critical code
- **< 60% coverage** - Red flag, systematic testing gaps

### 2. Test Count

**Definition:** Total number of individual test cases in the suite.

**Why It Matters:**
- Indicates test scope and depth
- Higher count = more scenarios covered
- Helps estimate suite maintenance burden
- Shows growth/shrinkage of test suite

**Metric Breakdown:**

```
Total Tests = Unit Tests + Integration Tests + E2E Tests

Unit Tests:        1000+
Integration Tests: 200+
E2E Tests:         50+
─────────────────────
Total:             1250+
```

**Healthy Test Distribution:**
- **Unit tests**: 80% (fast, isolated, many)
- **Integration tests**: 15% (moderate speed, some dependencies)
- **E2E tests**: 5% (slow, end-to-end workflows)

**Example Monitoring:**
```
Week 1: 1,200 tests
Week 2: 1,250 tests (✓ grew by 50 tests)
Week 3: 1,240 tests (⚠ declined by 10, investigate removed tests)
Week 4: 1,290 tests (✓ grew by 50 tests)
```

### 3. Pass Rate

**Definition:** Percentage of tests passing in the latest test run.

**Why It Matters:**
- Indicates test suite health
- High pass rate = reliable suite
- Drops indicate regressions or flaky tests
- Helps identify problematic test periods

**Healthy Pass Rate:**
- **99%+ pass rate** - Excellent, only occasional failures
- **95-99% pass rate** - Good, occasional flaky tests
- **90-95% pass rate** - Concerning, investigate failures
- **< 90% pass rate** - Critical, halt deployment

**Calculating Pass Rate:**
```
Pass Rate = (Passing Tests / Total Tests) × 100

Example:
Passing Tests: 1,245
Total Tests:   1,250
Pass Rate:     (1,245 / 1,250) × 100 = 99.6%
```

**Tracking Patterns:**
```
Monday:    99.2% pass rate (post-merge)
Tuesday:   98.5% pass rate (1 flaky test)
Wednesday: 99.8% pass rate (✓ fixed)
Thursday:  99.6% pass rate (✓ stable)
Friday:    99.1% pass rate (new tests added)
```

### 4. Execution Time

**Definition:** Time required to run the complete test suite.

**Why It Matters:**
- Affects developer feedback loop
- Slow tests reduce productivity
- Shows performance trends
- Impacts CI/CD pipeline efficiency

**Target Execution Times:**
- **Unit test suite**: < 5 minutes
- **Integration tests**: < 2 minutes (if separated)
- **Full test suite**: < 7 minutes
- **Single test file**: < 30 seconds

**Breaking Down Test Duration:**
```
Total: 4 min 52 sec

Breakdown:
- Jest initialization:     15 sec
- Module loading:          20 sec
- Component tests:       2 min 45 sec (56% of time)
- Service tests:         1 min 12 sec (25% of time)
- Utility tests:            12 sec (4% of time)
- Coverage reporting:       48 sec (16% of time)
```

**Example Monitoring:**
```
Week 1: 4:52 (baseline)
Week 2: 5:15 (+23 sec) ⚠ investigate new slow tests
Week 3: 5:10 (stable, +18 sec overall)
Week 4: 5:35 (+45 sec) 🔴 critical, optimize tests
```

---

## Measuring Metrics

### Method 1: Coverage Report Output

**Location:** `coverage/` directory after running tests

```bash
# Generate coverage report
npm run test:ci

# Coverage report created at: coverage/index.html
```

**Reading Coverage Summary:**
```
------------------------|----------|----------|----------|----------|
File                    | % Stmts  | % Branch | % Funcs  | % Lines  |
------------------------|----------|----------|----------|----------|
All files               |    75.23 |    72.14 |    76.45 |    75.23 |
 src/app/core/services |    82.34 |    78.90 |    84.12 |    82.34 |
 src/app/shared        |    71.45 |    68.23 |    72.11 |    71.45 |
 src/app/wizard        |    65.23 |    61.45 |    66.78 |    65.23 |
------------------------|----------|----------|----------|----------|
```

**Key Sections:**
- **File column** - Module or service
- **% Stmts** - Statement coverage
- **% Branch** - Branch coverage (critical)
- **% Funcs** - Function coverage
- **% Lines** - Line coverage

### Method 2: Jest JSON Report

**File:** `coverage/coverage-final.json`

```bash
# Pretty-print coverage JSON
cat coverage/coverage-final.json | jq '.' | head -50
```

**Extract Specific Metrics:**
```bash
# Get statements coverage percentage
cat coverage/coverage-final.json | jq '.total.statements.pct'
# Output: 75.23

# Get branch coverage
cat coverage/coverage-final.json | jq '.total.branches.pct'
# Output: 72.14
```

### Method 3: Jest Test Report

**Command:**
```bash
# Run tests with detailed output
npm test -- --listTests --verbose

# Count total test files
npm test -- --listTests | wc -l

# Count total test cases (estimates)
npm test -- --testNamePattern="should" --verbose 2>&1 | grep "✓\|✕" | wc -l
```

**Parse Test Output:**
```bash
# Extract pass/fail counts
npm run test:ci 2>&1 | grep -E "Tests:|PASS|FAIL"
```

### Method 4: Extract Metrics from CI Logs

**For GitHub Actions:**

1. Go to your GitHub Actions workflow run
2. Click on the test job
3. Check logs for summary:
   ```
   PASS  src/app/shared/components/card.spec.ts
   PASS  src/app/core/services/auth.spec.ts
   ✓ 1245 passed
   ✗ 5 failed (0.4% failure rate)
   ⏱ Execution time: 4m 52s
   Coverage: 75.23%
   ```

### Method 5: CLI Parsing Script

**Create: `scripts/extract-metrics.sh`**

```bash
#!/bin/bash
# Extract testing metrics from Jest output

echo "=== Testing Metrics ===" > metrics.txt
date >> metrics.txt

# Run tests and capture output
npm run test:ci 2>&1 | tee test-output.log

# Extract coverage
echo "" >> metrics.txt
echo "Coverage Metrics:" >> metrics.txt
grep "Global Coverage" test-output.log >> metrics.txt || cat coverage/coverage-summary.json >> metrics.txt

# Count tests
echo "" >> metrics.txt
echo "Test Count:" >> metrics.txt
grep -E "Tests:|tests" test-output.log >> metrics.txt

# Execution time
echo "" >> metrics.txt
echo "Execution Time:" >> metrics.txt
grep -E "took.*seconds|time" test-output.log >> metrics.txt

# Display results
cat metrics.txt
```

**Usage:**
```bash
bash scripts/extract-metrics.sh
```

---

## Reporting & Dashboards

### Format 1: Weekly Report Template

**File:** `docs/testing/WEEKLY-METRICS-REPORT.md` (template)

```markdown
# Testing Metrics Report - Week of [DATE]

## Summary
- **Total Tests**: 1,245 (+5 from last week)
- **Pass Rate**: 99.6% (↑ from 99.2%)
- **Coverage**: 75.23% (→ stable)
- **Execution Time**: 4:52 (→ stable)

## Breakdown

### Coverage by Component
| Component | % Coverage | Target | Status |
|-----------|-----------|--------|--------|
| Core Services | 82.34% | 80% | ✓ On Target |
| Shared Components | 71.45% | 75% | ⚠ Below Target |
| Wizards | 65.23% | 70% | ✗ Below Target |

### Test Execution Time
| Phase | Time | Target | Status |
|-------|------|--------|--------|
| Jest Initialization | 15s | < 20s | ✓ Good |
| Module Loading | 20s | < 25s | ✓ Good |
| Component Tests | 2:45 | < 3:00 | ✓ Good |
| Service Tests | 1:12 | < 1:30 | ✓ Good |
| **Total** | **4:52** | **< 5:00** | ✓ Good |

### Test Distribution
```
Unit Tests:    1000 (80%)
Integration:     200 (16%)
E2E:             45 (4%)
─────────────────────────
Total:         1245
```

## Changes This Week
- ✓ Added 15 new component tests
- ✓ Refactored 3 slow tests (reduced duration by 8 sec)
- ⚠ Shared components coverage still below target
- 🎯 Action item: Focus on shared components next week

## Trend Analysis
- Coverage trending: Stable (↔)
- Test count trending: Growing (↑)
- Execution time trending: Stable (↔)
- Pass rate trending: Improving (↑)

## Recommendations
1. Address wizard coverage gap (currently 65%, target 70%)
2. Continue focusing on component testing
3. Monitor and optimize slow tests

---
**Generated:** [Date]
**Reviewed By:** [Team Lead]
```

### Format 2: CSV for Spreadsheet Tracking

**File:** `metrics-history.csv`

```csv
Date,Total Tests,Pass Rate (%),Coverage (%),Execution Time (sec),Components Tested,Failed Tests
2026-03-01,1240,99.2,74.8,292,85,10
2026-03-02,1245,99.6,75.1,295,87,5
2026-03-03,1250,99.4,75.2,298,89,7
2026-03-04,1248,99.8,75.3,291,88,3
2026-03-05,1255,99.6,75.5,294,90,5
```

**Usage:**
```bash
# Append metrics to history
DATE=$(date +%Y-%m-%d)
TESTS=$(npm test -- --listTests | wc -l)
COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.statements.pct')
TIME=$(npm run test:ci 2>&1 | grep -o "[0-9]*m [0-9]*s" | tail -1)

echo "$DATE,$TESTS,99.6,$COVERAGE,$TIME,90,5" >> metrics-history.csv
```

### Format 3: HTML Dashboard

**Template: `docs/testing/metrics-dashboard.html`**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Testing Metrics Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial; margin: 20px; }
        .card { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; }
        .good { color: green; }
        .warning { color: orange; }
        .critical { color: red; }
        canvas { margin-top: 20px; }
    </style>
</head>
<body>
    <h1>Testing Metrics Dashboard</h1>

    <div class="card">
        <h2>Current Metrics</h2>
        <div class="metric">
            <h3>Coverage</h3>
            <p class="good">75.23% ✓</p>
        </div>
        <div class="metric">
            <h3>Pass Rate</h3>
            <p class="good">99.6% ✓</p>
        </div>
        <div class="metric">
            <h3>Test Count</h3>
            <p class="good">1,245 ✓</p>
        </div>
        <div class="metric">
            <h3>Exec Time</h3>
            <p class="good">4:52 ✓</p>
        </div>
    </div>

    <div class="card">
        <h2>Coverage Trend (Last 4 Weeks)</h2>
        <canvas id="coverageChart"></canvas>
    </div>

    <div class="card">
        <h2>Test Count Growth</h2>
        <canvas id="testCountChart"></canvas>
    </div>

    <div class="card">
        <h2>Coverage by Component</h2>
        <canvas id="componentChart"></canvas>
    </div>

    <script>
        // Coverage trend
        new Chart(document.getElementById('coverageChart'), {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Coverage %',
                    data: [73.2, 74.1, 75.0, 75.23],
                    borderColor: 'green',
                    tension: 0.1
                }]
            }
        });

        // Test count growth
        new Chart(document.getElementById('testCountChart'), {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Test Count',
                    data: [1200, 1225, 1240, 1245],
                    backgroundColor: 'steelblue'
                }]
            }
        });

        // Coverage by component
        new Chart(document.getElementById('componentChart'), {
            type: 'horizontalBar',
            data: {
                labels: ['Core Services', 'Shared', 'Wizards'],
                datasets: [{
                    label: 'Coverage %',
                    data: [82.34, 71.45, 65.23],
                    backgroundColor: ['green', 'orange', 'red']
                }]
            }
        });
    </script>
</body>
</html>
```

---

## Coverage Goals by Component

### Core Services

**Target:** 80%+ coverage

**Rationale:** Business-critical logic, used across entire app

**Includes:**
- `src/app/core/services/*.ts` (Auth, User, Project, etc.)
- `src/app/core/interceptors/*.ts`
- `src/app/core/guards/*.ts`

**Current Status:**
```
Auth Service:         85% ✓
Project Service:      82% ✓
Cluster Service:      88% ✓
User Service:         80% ✓
Datacenter Service:   79% ⚠ (1 point from target)
```

**Action Items:**
- [ ] Add 1-2 tests to Datacenter Service
- [ ] Review untested paths in Auth Service
- [ ] Ensure error handling fully covered

### Shared Components

**Target:** 75%+ coverage

**Rationale:** Reusable UI components used throughout app

**Includes:**
- `src/app/shared/components/**/*.ts` (100+ components)
- `src/app/shared/directives/**/*.ts`
- `src/app/shared/pipes/**/*.ts`

**Current Status:**
```
Card Component:       78% ✓
Dialog Component:     82% ✓
Form Components:      72% ⚠
Table Component:      68% ✗
Input Component:      75% ✓
```

**Action Items:**
- [ ] Add tests for table column sorting
- [ ] Increase form component coverage
- [ ] Test accessibility features in all components

### Feature Modules

**Target:** 70%+ coverage

**Rationale:** Feature-specific logic, lower priority than core

**Includes:**
- `src/app/cluster/**/*.ts`
- `src/app/project/**/*.ts`
- `src/app/wizard/**/*.ts`

**Current Status:**
```
Cluster Feature:      72% ✓
Project Feature:      70% ✓
Wizard Feature:       65% ✗
Member Feature:       68% ⚠
```

**Action Items:**
- [ ] Increase wizard coverage to 70%
- [ ] Add tests for member invite flow
- [ ] Focus on critical user paths

### Utilities & Helpers

**Target:** 85%+ coverage

**Rationale:** Pure functions, high ROI on testing

**Includes:**
- `src/app/shared/utils/**/*.ts`
- `src/app/shared/validators/**/*.ts`
- `src/app/shared/functions/**/*.ts`

**Current Status:**
```
Validators:           90% ✓
String Utils:         88% ✓
Array Utils:          92% ✓
Date Utils:           85% ✓
Custom Validators:    82% ✓
```

**Action Items:**
- [ ] Maintain high coverage in this category
- [ ] Use as reference implementation for other modules

---

## Identifying Trends

### Trend 1: Coverage Decline

**Signal:** Coverage drops by 2%+ week-over-week

```
Week 1: 75.5%
Week 2: 75.3% (↓ 0.2%)
Week 3: 74.8% (↓ 0.5%) ⚠ Investigate
Week 4: 73.2% (↓ 1.6%) 🔴 Critical
```

**Root Causes:**
1. **New code without tests** - Review PRs for untested code
2. **Deleted tests** - Investigate why tests were removed
3. **Coverage calculation changes** - Usually not an issue
4. **Increased codebase size** - Need more tests to maintain %

**Response Protocol:**
```
1. Review PR history for past 2 weeks
2. Identify new files with low/no coverage
3. Check git blame for deleted test files
4. Schedule catch-up testing session
5. Set aggressive coverage targets for next sprint
```

### Trend 2: Flaky Tests (Pass Rate Drop)

**Signal:** Pass rate drops below 99%

```
Monday:   99.5% ✓
Tuesday:  98.8% ⚠ (1.7% drop)
Wednesday: 98.1% 🔴 (further decline)
```

**Root Causes:**
1. **Async/timing issues** - Tests race with async operations
2. **Mock data inconsistency** - Mock service returns different data
3. **Environment changes** - Network, permissions, OS-related
4. **Interdependent tests** - One test affects another
5. **Resource exhaustion** - System running out of memory

**Response Protocol:**
```
1. Identify failing tests
2. Run failing tests in isolation (local)
3. Check if fails consistently or intermittently
4. Review test for async/timing issues
5. Re-run in CI with verbose logging
6. Fix root cause (usually add await or .fakeAsync())
7. Mark as flaky in JIRA for monitoring
```

### Trend 3: Slow Test Execution

**Signal:** Execution time increases by 10%+ week-over-week

```
Week 1: 4:30 (baseline)
Week 2: 4:42 (+12 sec) ↑
Week 3: 4:58 (+16 sec) ⚠ Investigate
Week 4: 5:15 (+37 sec) 🔴 Critical
```

**Root Causes:**
1. **New slow tests** - Tests with poor mock setup or real HTTP calls
2. **No parallel execution** - Tests running sequentially
3. **Large data structures** - Tests creating massive objects
4. **Excessive mocking overhead** - Complex mock setups
5. **Compilation slowdown** - Angular/TypeScript compilation time increasing

**Response Protocol:**
```
1. Compare test files between weeks
2. Identify newly added test files
3. Profile slow tests with: npm test -- --detectOpenHandles
4. Review for unnecessary HTTP calls or delays
5. Split long test suites
6. Enable parallel execution: npm test -- --maxWorkers=4
7. Archive old test data/fixtures
```

### Trend 4: Increasing Test Count

**Signal:** Monitoring healthy growth

```
Week 1: 1,200 tests
Week 2: 1,225 tests (+25) ✓
Week 3: 1,250 tests (+25) ✓
Week 4: 1,290 tests (+40) ✓✓
```

**Good Growth:**
- 20-40 new tests per week
- Growing with new features
- Replacing deleted tests

**Concerning Growth:**
```
Week 1: 1,200 tests
Week 2: 1,100 tests (↓ 100) 🔴 Investigate test removal
```

**Response:**
```
1. Review PR history for test removals
2. Identify deprecated/merged features
3. Ensure no accidentally deleted tests
4. Plan replacement tests if needed
```

---

## Metric Dashboard Setup

### Option 1: Google Sheets Dashboard

**Setup:**
1. Create Google Sheet: "Testing Metrics Dashboard"
2. Tabs:
   - **Daily** - Daily metrics snapshot
   - **Weekly** - Aggregated weekly data
   - **Components** - By-component breakdown
   - **Trends** - Graphs and charts

**Daily Tab Columns:**
```
Date | Coverage % | Pass Rate % | Test Count | Exec Time (sec) | Notes
2026-03-05 | 75.23 | 99.6 | 1245 | 292 | Added 5 new tests
```

**Weekly Tab Columns:**
```
Week | Avg Coverage | Avg Pass Rate | Total Tests | Avg Exec Time | Trend
W1 2026 | 75.0 | 99.4 | 1240 | 290 | ↑
W2 2026 | 75.1 | 99.5 | 1245 | 291 | ↑
W3 2026 | 75.3 | 99.6 | 1250 | 293 | ↔
```

**Components Tab:**
```
Component | Coverage % | Target % | Status | Last Updated | Notes
Core Services | 82.34 | 80 | ✓ | 2026-03-05 | On target
Shared Components | 71.45 | 75 | ⚠ | 2026-03-05 | 3.55% below target
```

**Benefits:**
- Shareable with team
- Real-time editing
- Easy charting
- Mobile-friendly

### Option 2: GitHub Project Board

**Setup:**
1. Create GitHub Project: "Testing Metrics"
2. Views:
   - **Coverage Tracking** - Current vs target
   - **Performance** - Execution time monitoring
   - **Test Health** - Pass rate and flakiness

**Columns:**
```
Metric → Target → Current → Status → Action Items
Coverage (Core) → 80% → 82.34% → ✓ On Track → None
Coverage (Shared) → 75% → 71.45% → ⚠ Below Target → Add 10 tests
```

**Integration:**
- Link to CI/CD runs
- Automated status updates
- Comments with context

### Option 3: Custom Node.js Dashboard Server

**Create: `scripts/metrics-server.js`**

```javascript
const express = require('express');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
const PORT = 3000;

// Collect metrics
function collectMetrics() {
  try {
    const coverageJson = JSON.parse(
      fs.readFileSync('./coverage/coverage-summary.json', 'utf8')
    );

    const testOutput = execSync('npm test -- --listTests 2>&1', {
      encoding: 'utf8'
    });

    return {
      timestamp: new Date().toISOString(),
      coverage: coverageJson.total.statements.pct,
      tests: (testOutput.match(/passed|failed/g) || []).length,
      executionTime: new Date() - startTime
    };
  } catch (err) {
    console.error('Error collecting metrics:', err);
    return null;
  }
}

// API endpoint
app.get('/api/metrics', (req, res) => {
  res.json(collectMetrics());
});

// HTML Dashboard
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Testing Metrics</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width">
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body { font-family: Arial; padding: 20px; }
        .metric { display: inline-block; padding: 20px; background: #f5f5f5; margin: 10px; border-radius: 5px; min-width: 150px; }
        .good { color: green; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        canvas { margin-top: 20px; max-width: 500px; }
      </style>
    </head>
    <body>
      <h1>Testing Metrics Dashboard</h1>
      <div id="metrics"></div>
      <canvas id="chart"></canvas>
      <script>
        fetch('/api/metrics').then(r => r.json()).then(data => {
          document.getElementById('metrics').innerHTML = \`
            <div class="metric">
              <h3>Coverage</h3>
              <p class="good">\${data.coverage.toFixed(2)}%</p>
            </div>
            <div class="metric">
              <h3>Tests</h3>
              <p class="good">\${data.tests}</p>
            </div>
            <div class="metric">
              <h3>Exec Time</h3>
              <p class="good">\${data.executionTime}ms</p>
            </div>
          \`;
        });
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Metrics dashboard at http://localhost:${PORT}`);
});
```

**Usage:**
```bash
node scripts/metrics-server.js
# Visit http://localhost:3000
```

---

## Monitoring Tools

### Tool 1: Codecov Integration

**Setup GitHub Actions:**

```yaml
# .github/workflows/coverage.yml
name: Coverage Reports

on: [push, pull_request]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v2
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella
```

**Benefits:**
- Historical coverage tracking
- Per-PR coverage reports
- Coverage badges for README
- Trend graphs

### Tool 2: Jest HTML Reporter

**Install:**
```bash
npm install --save-dev jest-html-reporter
```

**Configure Jest:**
```javascript
// jest.config.cjs
module.exports = {
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Test Report',
        outputPath: 'test-report.html',
        includeFailureMsg: true,
        includeConsoleLog: true,
        theme: 'darkTheme'
      }
    ]
  ]
};
```

**Usage:**
```bash
npm test -- --json --outputFile=test-results.json
# HTML report at: test-report.html
```

### Tool 3: Grafana + InfluxDB (Advanced)

**Setup:** (For production teams)

```bash
# Install InfluxDB
brew install influxdb
influxdb --version

# Install Grafana
brew install grafana
```

**Store Metrics:**
```javascript
const InfluxDB = require('influx').InfluxDB;

const influx = new InfluxDB({
  host: 'localhost',
  database: 'testing_metrics'
});

influx.writePoints([
  {
    measurement: 'test_metrics',
    tags: { project: 'dashboard' },
    fields: {
      coverage: 75.23,
      passRate: 99.6,
      testCount: 1245,
      executionTime: 292
    }
  }
]);
```

**Benefits:**
- Real-time dashboards
- Historical analysis
- Alerts and notifications
- Team collaboration

---

## Best Practices

### Practice 1: Track Trends, Not Just Numbers

**❌ Wrong:**
- Only look at current coverage %
- Ignore if coverage is stable

**✓ Right:**
- Track coverage over time (weekly/monthly)
- Alert on sudden drops
- Celebrate improvements

```
# Good tracking
Week 1: 75.0% ✓
Week 2: 75.1% ✓ (small increase)
Week 3: 75.3% ✓ (consistent growth)
Week 4: 73.2% 🔴 (sudden drop - investigate!)
```

### Practice 2: Context-Aware Targets

**❌ Wrong:**
- Universal 90% coverage target for all code
- Ignore critical vs non-critical paths

**✓ Right:**
- Different targets for different components:
  - Core services: 80%+
  - Shared components: 75%+
  - Utilities: 85%+
  - Feature code: 70%+

### Practice 3: Lead with Quality, Not Quantity

**❌ Wrong:**
```javascript
it('should work', () => {
  expect(component).toBeTruthy();  // Meaningless test
});
// High test count, low quality
```

**✓ Right:**
```javascript
it('should display error when email is invalid', () => {
  component.email = 'invalid-email';
  fixture.detectChanges();
  expect(component.emailError).toContain('valid email');
});
// Lower test count, high quality
```

### Practice 4: Regular Review Cadence

**Weekly (Monday 10am):**
- [ ] Review coverage report
- [ ] Check for flaky tests
- [ ] Identify slow tests

**Monthly (First Friday):**
- [ ] Deep dive analysis
- [ ] Update goals
- [ ] Plan improvements

**Quarterly (Sprint Planning):**
- [ ] Strategic review
- [ ] Update testing strategy
- [ ] Team training needs

### Practice 5: Communicate Changes

**When Coverage Changes:**
```
📊 Metrics Update:
- Coverage: 75.1% → 75.3% ✓
- Tests: 1,240 → 1,250 ✓
- Pass Rate: 99.5% (stable)

Action: Added 10 tests to shared components
```

---

## Troubleshooting

### Issue 1: Coverage Drops After Refactor

**Symptoms:**
- Coverage was 76%, now 72%
- No new tests added
- Code refactored

**Solutions:**
```
1. Identify refactored files:
   git diff main...HEAD --name-only

2. Check if tests still cover paths:
   npm test -- --testPathPattern=refactored-file

3. Review coverage report for refactored code:
   open coverage/index.html
   Search for file in report

4. Understand new code paths introduced

5. Add tests for new uncovered paths
```

### Issue 2: Inconsistent Coverage Reports

**Symptoms:**
- Coverage is 75% locally
- Coverage is 72% in CI
- Different results each run

**Solutions:**
```
1. Verify all tests pass:
   npm test -- --passWithNoTests

2. Run with same settings as CI:
   npm run test:ci

3. Check for platform differences:
   npm test -- --bail  # Stop on first failure

4. Verify coverage includes all files:
   npm test -- --collectCoverageFrom='src/**/*.ts'

5. Clear cache and retry:
   npm test -- --clearCache
   npm run test:ci
```

### Issue 3: High Pass Rate But Failing Tests

**Symptoms:**
- Pass rate shows 99%
- But specific tests fail in CI
- Tests pass locally

**Solutions:**
```
1. Run tests in CI mode locally:
   npm run test:ci

2. Check for environment-dependent tests:
   grep -r "process.env\|window\|document" src/**/*.spec.ts

3. Verify mock setup is consistent:
   npm test -- --testNamePattern="failing-test"

4. Check for timing/async issues:
   npm test -- --bail --detectOpenHandles

5. Enable verbose logging:
   npm test -- --verbose
```

### Issue 4: Metrics Reporting Breaks

**Symptoms:**
- Cannot parse coverage report
- Metric scripts fail
- Dashboard stops updating

**Solutions:**
```
1. Verify coverage file exists:
   ls -la coverage/coverage-final.json

2. Check file format:
   cat coverage/coverage-final.json | jq .

3. Run tests to regenerate:
   npm run test:ci

4. Verify Jest config is correct:
   npx jest --showConfig | grep coverage

5. Check for permissions issues:
   chmod +x scripts/extract-metrics.sh
```

---

## Summary

**Key Takeaways:**

1. **Track 4 Core Metrics:**
   - Coverage %
   - Test Count
   - Pass Rate
   - Execution Time

2. **Use Context-Aware Targets:**
   - Core services: 80%+
   - Shared components: 75%+
   - Utilities: 85%+
   - Features: 70%+

3. **Monitor Trends, Not Just Numbers:**
   - Weekly reviews
   - Alert on significant changes
   - Investigate root causes

4. **Automate Reporting:**
   - CI/CD integration
   - Automated dashboards
   - Regular summaries

5. **Act on Insights:**
   - Coverage drops = add tests
   - Flaky tests = fix root cause
   - Slow tests = optimize
   - Declining quality = pause features

---

**Additional Resources:**
- [[CI-CD-INTEGRATION]] - Coverage configuration in CI
- [[TEST-PERFORMANCE]] - Performance monitoring
- [[COMPREHENSIVE-COVERAGE-REPORT]] - Current coverage status
- [[MAINTENANCE-PROCESS]] - Regular review processes

---

**Last Updated:** March 2026
**Maintained By:** Kubermatic Dashboard Team
**Related Files:** `coverage/`, `jest.config.cjs`, `.github/workflows/`
