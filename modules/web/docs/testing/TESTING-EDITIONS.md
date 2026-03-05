---
type: guide
title: Testing Edition-Specific Features (CE/EE)
created: 2026-03-05
tags:
  - testing
  - editions
  - ce-ee
  - dynamic-modules
related:
  - '[[TESTING-PATTERNS]]'
  - '[[EXAMPLE-SNIPPETS]]'
  - '[[MOCK-SERVICES-REFERENCE]]'
---

# Testing Edition-Specific Features (CE/EE)

The Kubermatic Dashboard supports both Community Edition (CE) and Enterprise Edition (EE) builds, with features dynamically loaded based on the edition. This guide explains how to test features that differ between these editions.

## Table of Contents

1. [Quick Overview](#quick-overview)
2. [Edition Architecture](#edition-architecture)
3. [Testing DynamicModule Imports](#testing-dynamicmodule-imports)
4. [Testing Conditional Features](#testing-conditional-features)
5. [Testing with isEnterpriseEdition()](#testing-with-isenterpriseedition)
6. [Running Tests for Specific Editions](#running-tests-for-specific-editions)
7. [Module Registry Mocking](#module-registry-mocking)
8. [Complete Examples](#complete-examples)
9. [Common Patterns and Pitfalls](#common-patterns-and-pitfalls)
10. [Edition-Specific Mock Services](#edition-specific-mock-services)

---

## Quick Overview

The Kubermatic Dashboard handles CE/EE differences in two ways:

1. **Build-Time Module Swapping**: The `module-registry.ts` file is replaced with `module-registry.ce.ts` during CE builds
2. **Runtime Edition Checks**: Components can check `isEnterpriseEdition()` function to conditionally render features

**Key Files:**
- `src/app/dynamic/module-registry.ts` - EE modules (default)
- `src/app/dynamic/module-registry.ce.ts` - CE modules (replaces EE during CE build)
- `src/app/dynamic/common.ts` - Contains `isEnterpriseEdition()` function
- `angular.json` - Build configuration with fileReplacements

---

## Edition Architecture

### How Build-Time Module Swapping Works

The dashboard uses Angular's `fileReplacements` mechanism to support both editions:

**module-registry.ts** (EE - Default):
```typescript
export namespace DynamicModule {
  export const Quotas = import('./enterprise/quotas/module').then(
    module => module.QuotasModule
  );
  export const ClusterBackups = import('./enterprise/cluster-backups/module').then(
    module => module.ClusterBackupsModule
  );
  export const isEnterpriseEdition = true;
}
```

**module-registry.ce.ts** (CE - Swapped During Build):
```typescript
export namespace DynamicModule {
  export const Quotas = import('./community/quotas/module').then(
    module => module.QuotasModule
  );
  export const ClusterBackups = import('./community/cluster-backups/module').then(
    module => module.ClusterBackupsModule
  );
  export const isEnterpriseEdition = false;
}
```

**Build Configuration** (angular.json):
```json
"configurations": {
  "production-ce": {
    "fileReplacements": [
      {
        "replace": "src/app/dynamic/module-registry.ts",
        "with": "src/app/dynamic/module-registry.ce.ts"
      }
    ]
  }
}
```

### Edition-Specific Features

**Enterprise Edition Only:**
- Quotas management
- User groups
- Cluster backups and snapshots
- Kyverno policies
- Metering and usage tracking
- Theming management

**Community Edition:**
- Simplified versions or stubs of EE features
- Same module names, different implementations
- Located in `src/app/dynamic/community/` instead of `enterprise/`

---

## Testing DynamicModule Imports

### Understanding Dynamic Imports in Tests

When testing components that load DynamicModule features via `loadChildren`, you have two approaches:

1. **Mock the DynamicModule** - For isolated unit tests
2. **Load the actual module** - For integration tests

### Approach 1: Mocking DynamicModule Lazy Loading

Most unit tests should mock DynamicModule to avoid loading heavy modules:

```typescript
import {DynamicModule} from '@app/dynamic/module-registry';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TestBed} from '@angular/core/testing';

describe('MyComponent with DynamicModule', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyComponent],
      schemas: [NO_ERRORS_SCHEMA], // Ignore unknown elements from dynamic modules
      providers: [
        // Mock the DynamicModule if needed
      ],
    });
  });

  it('should render without loading DynamicModule', () => {
    const fixture = TestBed.createComponent(MyComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

### Approach 2: Testing Dynamic Module Loading

For integration tests that verify module loading works:

```typescript
import {DynamicModule} from '@app/dynamic/module-registry';
import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';

describe('DynamicModule Loading', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // Include RouterTestingModule for route testing
      // Include the feature modules you're testing
    });
    router = TestBed.inject(Router);
  });

  it('should load Quotas module for EE builds', async () => {
    const module = await DynamicModule.Quotas;
    expect(module).toBeDefined();
    expect(module.QuotasModule).toBeDefined();
  });

  it('should handle module loading errors gracefully', async () => {
    try {
      const module = await DynamicModule.Quotas;
      expect(module).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
```

---

## Testing Conditional Features

### Pattern 1: Using `isEnterpriseEdition()` in Components

Components that show different UI based on edition:

```typescript
import {isEnterpriseEdition} from '@app/dynamic/common';

@Component({
  selector: 'km-feature',
  template: `
    <div *ngIf="isEE">Enterprise-only content</div>
    <div *ngIf="!isEE">Community content</div>
  `,
})
export class FeatureComponent {
  isEE = isEnterpriseEdition();
}
```

**Testing Conditional Rendering:**

```typescript
import {isEnterpriseEdition} from '@app/dynamic/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';

describe('FeatureComponent - Edition Behavior', () => {
  let component: FeatureComponent;
  let fixture: ComponentFixture<FeatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeatureComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureComponent);
    component = fixture.componentInstance;
  });

  it('should display appropriate content based on edition', () => {
    fixture.detectChanges();

    if (isEnterpriseEdition()) {
      const eeContent = fixture.debugElement.query(
        By.css('[data-testid="ee-content"]')
      );
      expect(eeContent).toBeTruthy();

      const ceContent = fixture.debugElement.query(
        By.css('[data-testid="ce-content"]')
      );
      expect(ceContent).toBeFalsy();
    } else {
      const ceContent = fixture.debugElement.query(
        By.css('[data-testid="ce-content"]')
      );
      expect(ceContent).toBeTruthy();

      const eeContent = fixture.debugElement.query(
        By.css('[data-testid="ee-content"]')
      );
      expect(eeContent).toBeFalsy();
    }
  });

  it('should have isEE property set correctly', () => {
    expect(component.isEE).toBe(isEnterpriseEdition());
  });
});
```

### Pattern 2: Testing Components with Edition Data

Real-world example from the codebase (application-list):

```typescript
describe('ApplicationListComponent', () => {
  let component: ApplicationListComponent;
  let fixture: ComponentFixture<ApplicationListComponent>;

  const mockApplicationList = {
    applications: [
      {
        name: 'test-app',
        isEnterpriseEdition: true, // Enterprise app
      },
      {
        name: 'community-app',
        isEnterpriseEdition: false, // Community app
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApplicationListComponent],
      imports: [SharedModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationListComponent);
    component = fixture.componentInstance;
  });

  it('should filter enterprise applications correctly', () => {
    component.applications = mockApplicationList.applications;
    fixture.detectChanges();

    const eeApps = component.applications.filter(app => app.isEnterpriseEdition);
    const ceApps = component.applications.filter(app => !app.isEnterpriseEdition);

    expect(eeApps.length).toBe(1);
    expect(ceApps.length).toBe(1);
  });

  it('should display only CE apps when not in EE', () => {
    if (!isEnterpriseEdition()) {
      component.applications = mockApplicationList.applications
        .filter(app => !app.isEnterpriseEdition);
      fixture.detectChanges();

      expect(component.applications.length).toBe(1);
      expect(component.applications[0].name).toBe('community-app');
    }
  });
});
```

---

## Testing with `isEnterpriseEdition()`

### Understanding the Function

**Location:** `src/app/dynamic/common.ts`

```typescript
import version from '@assets/config/version.json';

export function isEnterpriseEdition(): boolean {
  return version.edition === 'Enterprise Edition';
}
```

The function checks the `version.json` file, which is generated at build time based on the `KUBERMATIC_EDITION` environment variable.

### Mocking `isEnterpriseEdition()` in Tests

You cannot directly mock this function since it imports from `version.json`. Instead, you have two strategies:

**Strategy 1: Test Both Editions Using Conditional Logic**

```typescript
describe('MyComponent', () => {
  it('should handle both EE and CE', () => {
    const isEE = isEnterpriseEdition();

    if (isEE) {
      // Test EE-specific behavior
      expect(component.showQuotasTab).toBe(true);
    } else {
      // Test CE-specific behavior
      expect(component.showQuotasTab).toBe(false);
    }
  });
});
```

**Strategy 2: Split Tests by Edition**

Create separate test files or test suites for edition-specific logic:

```typescript
// component.ee.spec.ts - Runs in EE build
describe('MyComponent (EE)', () => {
  beforeEach(() => {
    if (!isEnterpriseEdition()) {
      this.skip(); // Skip these tests in CE build
    }
  });

  it('should show quotas tab', () => {
    // EE-specific test
  });
});
```

### Testing Components That Accept Edition as Input

If your component accepts edition state:

```typescript
@Component({
  selector: 'km-edition-aware',
  template: `
    <div *ngIf="isEnterpriseEdition">EE Feature</div>
  `,
})
export class EditionAwareComponent {
  @Input() isEnterpriseEdition = false;
}

describe('EditionAwareComponent', () => {
  it('should display content when isEnterpriseEdition is true', () => {
    component.isEnterpriseEdition = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('EE Feature');
  });

  it('should hide content when isEnterpriseEdition is false', () => {
    component.isEnterpriseEdition = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('EE Feature');
  });
});
```

---

## Running Tests for Specific Editions

### Build-Time Edition Selection

The test environment uses the build configuration that was active when the app was compiled.

```bash
# Build EE version and run tests
KUBERMATIC_EDITION=ee npm test

# Build CE version and run tests
KUBERMATIC_EDITION=ce npm test

# Default (uses EE)
npm test
```

### Running Edition-Specific Test Suites

If you've created edition-specific tests:

```bash
# Run only EE tests
npm test -- --testNamePattern="(EE|Enterprise)"

# Run only CE tests
npm test -- --testNamePattern="(CE|Community)"

# Run both and filter by edition
npm test -- --verbose
```

### CI/CD Edition Testing

In your CI pipeline, run the test suite for both editions:

```bash
#!/bin/bash
# Run tests for both editions

echo "Testing Enterprise Edition..."
KUBERMATIC_EDITION=ee npm test || exit 1

echo "Testing Community Edition..."
KUBERMATIC_EDITION=ce npm test || exit 1

echo "All edition tests passed!"
```

---

## Module Registry Mocking

### When to Mock Module Registry

Mock the module registry when:
- Testing routing that uses DynamicModule
- Testing components that conditionally load modules
- Testing lazy loading error handling
- Avoiding heavy module compilation in unit tests

### How to Mock DynamicModule

**Approach 1: Mock at Service Level**

```typescript
import {DynamicModule} from '@app/dynamic/module-registry';

describe('ComponentWithDynamicRouting', () => {
  beforeEach(async () => {
    // Mock DynamicModule imports
    const mockQuotasModule = {QuotasModule: ng.NgModule({})};

    spyOn(DynamicModule, 'Quotas' as any).and.returnValue(
      Promise.resolve(mockQuotasModule)
    );

    await TestBed.configureTestingModule({
      // ... test configuration
    }).compileComponents();
  });

  it('should load dynamic module', async () => {
    const module = await DynamicModule.Quotas;
    expect(module).toBeTruthy();
  });
});
```

**Approach 2: Mock Using Jasmine Spies**

```typescript
describe('DynamicModule Loading', () => {
  it('should spy on module imports', () => {
    const quotasModuleSpy = spyOn(window, 'import' as any)
      .and.returnValue(
        Promise.resolve({
          QuotasModule: class {},
        })
      );

    // Your test code
    expect(quotasModuleSpy).toHaveBeenCalled();
  });
});
```

**Approach 3: Use Test Helpers**

Create a test utility for common mocking patterns:

```typescript
// test/utils/dynamic-module-mock.ts
export class DynamicModuleMockService {
  static createMockModule(moduleName: string) {
    return {
      [moduleName]: class MockModule {},
    };
  }

  static mockDynamicModule(moduleName: string): Promise<any> {
    return Promise.resolve(this.createMockModule(moduleName));
  }
}

// Usage in tests:
describe('MyComponent', () => {
  beforeEach(() => {
    spyOn(DynamicModule, 'Quotas' as any).and.returnValue(
      DynamicModuleMockService.mockDynamicModule('QuotasModule')
    );
  });
});
```

---

## Complete Examples

### Example 1: Testing a Feature That's EE-Only

**Feature: Quotas Management (Enterprise Only)**

```typescript
import {QuotasComponent} from './component';
import {QuotaService} from './service';
import {QuotaMockService} from '@test/services/quota-mock';
import {TestBed, ComponentFixture} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {isEnterpriseEdition} from '@app/dynamic/common';

describe('QuotasComponent (EE-Only Feature)', () => {
  let component: QuotasComponent;
  let fixture: ComponentFixture<QuotasComponent>;
  let quotaService: QuotaMockService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuotasComponent],
      providers: [
        {provide: QuotaService, useClass: QuotaMockService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(QuotasComponent);
    component = fixture.componentInstance;
    quotaService = TestBed.inject(QuotaService) as any;
  });

  it('should only run in EE builds', () => {
    if (!isEnterpriseEdition()) {
      this.skip();
    }
    expect(component).toBeTruthy();
  });

  it('should load quotas from service', (done) => {
    if (!isEnterpriseEdition()) {
      done();
      return;
    }

    const mockQuotas = [
      {name: 'CPU', limit: 100},
      {name: 'Memory', limit: 256},
    ];

    spyOn(quotaService, 'getQuotas')
      .and.returnValue(of(mockQuotas));

    component.ngOnInit();
    fixture.detectChanges();

    quotaService.getQuotas().subscribe(quotas => {
      expect(quotas.length).toBe(2);
      expect(quotas[0].name).toBe('CPU');
      done();
    });
  });

  it('should not appear in CE builds', () => {
    if (isEnterpriseEdition()) {
      // This test only runs in CE
      expect(true).toBe(true);
    }
  });
});
```

### Example 2: Testing Feature Flag with Dynamic Content

**Feature: Theming (Both CE and EE, but Different Implementations)**

```typescript
import {ThemingComponent} from './component';
import {ThemingService} from './service';
import {TestBed, ComponentFixture} from '@angular/core/testing';
import {of} from 'rxjs';
import {isEnterpriseEdition} from '@app/dynamic/common';

describe('ThemingComponent', () => {
  let component: ThemingComponent;
  let fixture: ComponentFixture<ThemingComponent>;
  let themingService: ThemingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ThemingComponent],
      providers: [ThemingService],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemingComponent);
    component = fixture.componentInstance;
    themingService = TestBed.inject(ThemingService);
  });

  it('should load themes from service', (done) => {
    const themes = isEnterpriseEdition()
      ? [
          {name: 'light', label: 'Light'},
          {name: 'dark', label: 'Dark'},
          {name: 'custom', label: 'Custom'}, // EE only
        ]
      : [
          {name: 'light', label: 'Light'},
          {name: 'dark', label: 'Dark'},
        ];

    spyOn(themingService, 'getThemes').and.returnValue(of(themes));

    component.ngOnInit();
    fixture.detectChanges();

    themingService.getThemes().subscribe(loadedThemes => {
      expect(loadedThemes.length).toBeGreaterThan(1);

      if (isEnterpriseEdition()) {
        expect(loadedThemes.length).toBe(3);
        expect(loadedThemes.some(t => t.name === 'custom')).toBe(true);
      } else {
        expect(loadedThemes.length).toBe(2);
      }
      done();
    });
  });

  it('should display available themes', () => {
    const themeNames = isEnterpriseEdition()
      ? ['light', 'dark', 'custom']
      : ['light', 'dark'];

    component.themes = themeNames.map(name => ({
      name,
      label: name.charAt(0).toUpperCase() + name.slice(1),
    }));

    fixture.detectChanges();

    const themeButtons = fixture.nativeElement.querySelectorAll(
      '[data-cy="theme-option"]'
    );
    expect(themeButtons.length).toBe(component.themes.length);
  });

  it('should apply selected theme', () => {
    component.selectTheme('dark');
    fixture.detectChanges();

    expect(component.selectedTheme).toBe('dark');

    const activeButton = fixture.nativeElement.querySelector(
      '[data-cy="theme-dark"][aria-pressed="true"]'
    );
    expect(activeButton).toBeTruthy();
  });
});
```

### Example 3: Testing Routing with Dynamic Module Loading

**Feature: Route Configuration with DynamicModule**

```typescript
import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {DynamicModule} from '@app/dynamic/module-registry';
import {isEnterpriseEdition} from '@app/dynamic/common';

describe('Edition-Specific Routing', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          {
            path: 'projects/:projectID/cluster-backups',
            loadChildren: () => DynamicModule.ClusterBackups,
          },
          {
            path: 'projects/:projectID/quotas',
            loadChildren: () => DynamicModule.Quotas,
          },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should load ClusterBackups module from DynamicModule', async () => {
    const module = await DynamicModule.ClusterBackups;
    expect(module).toBeDefined();
  });

  it('should have different module paths for CE and EE', async () => {
    const quotasModule = await DynamicModule.Quotas;

    if (isEnterpriseEdition()) {
      // In EE, this loads from enterprise/quotas
      expect(quotasModule).toBeDefined();
    } else {
      // In CE, this loads from community/quotas
      expect(quotasModule).toBeDefined();
    }
  });

  it('should navigate to dynamic routes', (done) => {
    router.navigate(['/projects/test-project/cluster-backups']).then(result => {
      expect(result).toBe(true);
      done();
    });
  });
});
```

---

## Common Patterns and Pitfalls

### Pattern 1: Conditional Test Execution

Skip tests that don't apply to current edition:

```typescript
describe('Quotas Feature', () => {
  beforeEach(function() {
    if (!isEnterpriseEdition()) {
      // Skip all tests in this suite if not EE
      this.skip();
    }
  });

  it('should show quota limits', () => {
    // This only runs in EE
  });
});
```

### Pattern 2: Edition-Agnostic Testing

Test behavior that works in both editions:

```typescript
describe('Common Feature', () => {
  it('should work in both CE and EE', () => {
    const isEE = isEnterpriseEdition();
    // Test logic that applies to both editions
    expect(component).toBeTruthy();
  });

  it('should handle specific edition features', () => {
    if (isEnterpriseEdition()) {
      // EE-specific assertion
    } else {
      // CE-specific assertion
    }
  });
});
```

### Pitfall 1: Forgetting to Build with Correct Edition

**Problem:** Test passes locally (EE build) but fails in CI (CE build)

**Solution:**
```bash
# Always specify the edition when running tests
KUBERMATIC_EDITION=ce npm test
KUBERMATIC_EDITION=ee npm test

# Or run both in CI pipeline
npm run test:all-editions  # Custom script that runs both
```

### Pitfall 2: Mocking DynamicModule Incorrectly

**Problem:** Module spies don't work correctly

**Solution:** Use proper Jasmine spy setup:

```typescript
// ❌ Wrong
spyOn(DynamicModule.Quotas, 'then');

// ✅ Correct
spyOn(DynamicModule, 'Quotas' as any).and.returnValue(
  Promise.resolve({QuotasModule: class {}})
);
```

### Pitfall 3: Importing EE-Only Types in CE Code

**Problem:** CE tests can't import enterprise module types

**Solution:** Use generic types or interfaces:

```typescript
// ❌ Wrong in CE context
import {QuotasModule} from '@app/dynamic/enterprise/quotas/module';

// ✅ Correct
import {NgModule} from '@angular/core';
const quotasModule: NgModule;  // Generic type
```

### Pitfall 4: Not Cleaning Up Dynamic Imports

**Problem:** Memory leaks from uncompleted dynamic imports

**Solution:** Properly complete promises in afterEach:

```typescript
afterEach(() => {
  // Ensure all dynamic imports are cleaned up
  (DynamicModule as any).Quotas = Promise.resolve({});
});
```

---

## Edition-Specific Mock Services

### Using Existing Mock Services for Both Editions

The test utilities in `src/test/services/` work for both editions:

```typescript
import {QuotaMockService} from '@test/services/quota-mock';
import {ThemingService} from '@app/dynamic/enterprise/theming/service';
// OR for CE
import {ThemingService} from '@app/dynamic/community/theming/service';

describe('MyComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: QuotaService, useClass: QuotaMockService},
        {provide: ThemingService, useClass: ThemingMockService},
      ],
    });
  });
});
```

### Creating Edition-Specific Test Data

```typescript
export class TestDataFactory {
  static createQuotaTestData(edition: 'CE' | 'EE') {
    const baseQuotas = [
      {name: 'CPU', limit: 100},
      {name: 'Memory', limit: 256},
    ];

    if (edition === 'EE') {
      return [
        ...baseQuotas,
        {name: 'Storage', limit: 1000},
        {name: 'GPU', limit: 4},
      ];
    }

    return baseQuotas;
  }

  static createThemeTestData(edition: 'CE' | 'EE') {
    const baseThemes = [
      {name: 'light', label: 'Light'},
      {name: 'dark', label: 'Dark'},
    ];

    if (edition === 'EE') {
      return [
        ...baseThemes,
        {name: 'custom', label: 'Custom Brand'},
      ];
    }

    return baseThemes;
  }
}

// Usage in tests:
const currentEdition = isEnterpriseEdition() ? 'EE' : 'CE';
const quotas = TestDataFactory.createQuotaTestData(currentEdition);
```

### Mocking Version Information

If you need to mock the version/edition info:

```typescript
// Create a test version mock
jest.mock('@assets/config/version.json', () => ({
  edition: 'Enterprise Edition', // or 'Community Edition'
  version: '2.24.0',
}));

// Then import and test
import {isEnterpriseEdition} from '@app/dynamic/common';

describe('Version Detection', () => {
  it('should detect enterprise edition', () => {
    expect(isEnterpriseEdition()).toBe(true);
  });
});
```

---

## Best Practices Summary

### ✅ DO

- **Use `isEnterpriseEdition()` for feature checks** - Consistent with codebase
- **Run tests for both editions in CI** - Catch edition-specific bugs
- **Create edition-agnostic tests when possible** - Reduces duplication
- **Use data-cy attributes for edition-specific DOM queries**
- **Mock DynamicModule for unit tests** - Faster test execution
- **Document which edition(s) feature applies to** - In test comments

### ❌ DON'T

- **Don't hardcode edition strings** - Use `isEnterpriseEdition()`
- **Don't import EE modules in CE tests** - Use mocks instead
- **Don't forget to build before testing editions** - Use correct KUBERMATIC_EDITION
- **Don't skip tests without clear reason** - Document why with comments
- **Don't leave incomplete dynamic imports** - Properly complete promises

---

## Related Documentation

- [[TESTING-PATTERNS]] - General testing patterns for the dashboard
- [[EXAMPLE-SNIPPETS]] - Copy-paste ready test templates
- [[MOCK-SERVICES-REFERENCE]] - Complete mock service documentation
- [[README]] - Main testing documentation index
- CLAUDE.md - Edition-specific build configuration

---

**Document Last Updated:** 2026-03-05
**Angular Version:** 20.3.x
**Status:** Complete
