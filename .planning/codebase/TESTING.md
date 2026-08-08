<!-- DO NOT EDIT - AUTO-GENERATED CODEBASE ANALYSIS -->

# Testing Patterns

**Analysis Date:** 2026-04-09

**Scope:** `modules/web/` - Angular frontend unit tests (Jest) and E2E tests (Cypress)

## Unit Test Framework

**Jest Setup:**
- Config file: `jest.config.cjs`
- Preset: `jest-preset-angular`
- TypeScript support via `ts-jest`
- Canvas mocking via `jest-canvas-mock` (for ngx-charts)

**Test Base Configuration:**
- Setup file: `src/test.base.ts`
- Mocks file: `src/test.base.mocks.ts`
- Timeout: 15 seconds per test (`jest.setTimeout(15000)`)
- Angular localization loaded: `@angular/localize/init`
- Zone.js test environment: `setupZoneTestEnv()`

**Run Commands:**
```bash
npm test                        # Run tests once
npm run test:watch              # Watch mode (re-run on changes)
npm run test:ci                 # Coverage report for CI
```

## Unit Test File Organization

**Location:**
- Co-located with source files
- Pattern: `[feature].spec.ts` next to component/service

**File Structure:**
```
src/app/shared/components/button/
├── component.ts
├── template.html
├── style.scss
└── component.spec.ts           # Test file co-located
```

**Test File Naming:**
- `component.spec.ts` for component tests
- `service.spec.ts` for service tests
- No separate `__tests__` directory

## Module Name Mapping for Tests

**Jest moduleNameMapper (src/test path alias):**
- `^@app/(.*)$` → `src/app/$1`
- `^@core/(.*)$` → `src/app/core/$1`
- `^@shared/(.*)$` → `src/app/shared/$1`
- `^@dynamic/(.*)$` → `src/app/dynamic/$1`
- `^@assets/(.*)$` → `src/assets/$1`
- `^@environments/(.*)$` → `src/environments/$1`
- `^@test/(.*)$` → `src/test/$1` (test data and mocks)
- d3 libraries mapped to minified dist files

**Imports in tests:**
```typescript
import {UserMockService} from '@test/services/user-mock';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {MatDialogMock} from '@test/services/mat-dialog-mock';
```

## Test Data and Factories

**Location:** `src/test/data/` - factory functions for test entities

**Pattern:**
- Function naming: `fake[EntityName]()` (e.g., `fakeDigitaloceanCluster()`, `fakeMember()`)
- Returns complete entity with sensible defaults
- Example from `src/test/data/cluster.ts`:
  ```typescript
  export function fakeDigitaloceanCluster(): Cluster {
    return {
      creationTimestamp: new Date(),
      id: '4k6txp5sq',
      name: 'nifty-haibt',
      spec: {
        cloud: {
          dc: 'do-fra1',
          digitalocean: {
            token: 'token',
          },
          providerName: 'digitalocean',
        },
        version: '1.8.5',
        // ... rest of cluster config
      },
      status: {
        url: 'https://...',
        version: '1.8.5',
        // ... status fields
      },
    };
  }
  ```

**Available Test Data:**
- `src/test/data/cluster.ts` - cluster factories
- `src/test/data/project.ts` - project data
- `src/test/data/member.ts` - user/member data
- `src/test/data/datacenter.ts` - datacenter configs
- `src/test/data/opa.ts` - OPA constraint templates
- `src/test/data/node.ts` - node data
- `src/test/data/rbac.ts` - RBAC role/binding data

**Usage in Tests:**
```typescript
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeProject} from '@test/data/project';

component.cluster = fakeDigitaloceanCluster();
component.projectID = fakeProject().id;
```

## Mock Services

**Location:** `src/test/services/` - service mock implementations

**Patterns:**
- Mock class name: `[ServiceName]MockService`
- Implement interface methods with return observables
- Use `jest.fn()` for methods that need tracking

**Example Mock Service:**
```typescript
// src/test/services/user-mock.ts
@Injectable()
export class UserMockService {
  private user: Observable<Member>;

  get currentUser(): Observable<Member> {
    this.user = of(fakeMember());
    return this.user;
  }

  get currentUserSettings(): Observable<UserSettings> {
    return of(DEFAULT_USER_SETTINGS_MOCK);
  }

  getCurrentUserGroup(_projectID: string): Observable<string> {
    return of(fakeMember().projects[0].group);
  }
}
```

**Available Mocks:**
- `UserMockService` - user/member service
- `ClusterMockService` - cluster service
- `SettingsMockService` - settings service
- `DatacenterMockService` - datacenter service
- `MatDialogMock` - Angular Material dialog
- `MatDialogRefMock` - Material dialog ref
- `ClusterServiceAccountMockService` - service account operations
- `AppConfigMockService` - app config service
- `RouterStub` - router stub for routing tests

**Dialog Mocks (Material):**
- `MatDialogMock` - provides `.open()` method returning `MatDialogRefMock`
- `MatDialogRefMock` - provides `.afterClosed()` returning observable
- Minimal implementation - extend as needed per test

## Component Test Structure

**Setup Pattern:**
```typescript
describe('ComponentName', () => {
  let fixture: ComponentFixture<ComponentName>;
  let component: ComponentName;

  beforeEach(waitForAsync(() => {
    // 1. Create service mocks
    const serviceMock = {
      method: jest.fn(),
    };
    serviceMock.method.mockReturnValue(of(null));

    // 2. Configure TestBed
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [ComponentName, ChildComponent],
      providers: [
        {provide: RealService, useClass: ServiceMockClass},
        {provide: MatDialog, useClass: MatDialogMock},
        {provide: ServiceTwo, useValue: serviceMock},
        HistoryService,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  // 3. Create component fixture
  beforeEach(() => {
    fixture = TestBed.createComponent(ComponentName);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // 4. Write tests
  it('should initialize', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));
});
```

**Key TestBed Features:**
- `imports`: Angular modules, shared modules
- `declarations`: Components under test and dependencies
- `providers`: Services (real, mocks, or stubs)
- `teardown: {destroyAfterEach: false}` - standard configuration
- `compileComponents()` - required for external templates/styles

**Test Utilities:**
- `ComponentFixture<T>` - wrapper around component instance
- `TestBed.createComponent()` - instantiate component
- `fixture.detectChanges()` - trigger initial change detection
- `fixture.componentInstance` - access component instance
- `waitForAsync()` - handle async operations

## Mocking Strategy

**When to Use Each Approach:**

1. **Class Mock (useClass):**
   - Full mock implementation with methods
   - Use when multiple tests need same mock behavior
   - Example: `{provide: UserService, useClass: UserMockService}`

2. **Value Mock (useValue):**
   - Object with specific jest.fn() mocks
   - Use for simple one-off mocks
   - Example:
     ```typescript
     const rbacMock = {
       deleteClusterBinding: jest.fn(),
       deleteBinding: jest.fn(),
     };
     rbacMock.deleteClusterBinding.mockReturnValue(of(null));
     ```

3. **Stub Class:**
   - Minimal implementation for interfaces
   - Example: `RouterStub` for routing tests
   - Location: `src/test/services/router-stubs.ts`

**Mock Return Values:**
- Observable: `mockMethod.mockReturnValue(of(data))`
- Promise: `mockMethod.mockResolvedValue(data)`
- Error: `mockMethod.mockRejectedValue(new Error('message'))`
- Spy on calls: `expect(mockMethod).toHaveBeenCalledWith(args)`

## Test DOM Interaction

**DOM Testing Patterns:**
```typescript
// Access component instance
const compiled = fixture.debugElement;

// Query by CSS selector
compiled.query(By.css('button')).nativeElement.click();

// Query all matching elements
compiled.queryAll(By.css('.item'));

// Check text content
expect(compiled.nativeElement.textContent).toContain('Expected text');

// Trigger change detection after property changes
component.property = newValue;
fixture.detectChanges();
```

## Async Testing

**waitForAsync() for Zone-based async:**
```typescript
it('should handle async operations', waitForAsync(() => {
  fixture.detectChanges();
  // Code here runs inside waitForAsync zone
  expect(component.data).toBeDefined();
}));
```

**Testing RxJS Subscriptions:**
```typescript
it('should fetch data on init', () => {
  fixture.detectChanges();
  
  expect(component.loading).toBe(true);
  
  // Service mock returns observable
  fixture.detectChanges();
  
  expect(component.data).toBeDefined();
});
```

## Coverage

**Generate Coverage Report:**
```bash
npm run test:ci              # Runs with --coverage flag
```

**Coverage Output:**
- HTML report: `coverage/` directory
- Stdout summary: coverage percentages by file
- Target: Typically 80%+ coverage

**No explicit coverage threshold** enforced in current setup, but aim for >80% coverage on critical paths.

## E2E Testing with Cypress

**Test Framework:**
- Cypress 14.x (or latest in package.json)
- Language: TypeScript
- Config file: `cypress.config.ts`

**Run Commands:**
```bash
npm run e2e                    # E2E against running dev server
npm run e2e:local              # E2E with local API proxy
npm run e2e:mock               # E2E with mocked API (json-server)
npm run cy                     # Open Cypress UI interactively
```

**Cypress Configuration:**
- `baseUrl: 'http://localhost:8000'`
- Viewport: 1920x1080
- Timeouts: 60 seconds (pageLoad, defaultCommand, response, request)
- Retries: 2 retries in run mode, 0 in interactive mode
- testIsolation: false (tests run in sequence, shared state)
- Video recording: enabled (deleted on success)
- Screenshots: on failure only

**Test Isolation:**
- `testIsolation: false` - cookies and local storage persist between tests
- Tests are sequential, not isolated
- Use `beforeEach()` for setup (e.g., `Mocks.register()`)
- Use `before()` for one-time setup (e.g., `cy.clearCookies()`)

## E2E Test File Organization

**Location:** `cypress/e2e/` - organized by category

**Directory Structure:**
```
cypress/
├── e2e/
│   ├── providers/               # Cloud provider-specific tests
│   │   ├── aws.spec.ts
│   │   ├── digitalocean.spec.ts
│   │   └── ...
│   ├── stories/                 # Feature story tests
│   │   ├── edition.spec.ts
│   │   ├── members.spec.ts
│   │   └── ...
│   ├── v2/                      # Additional test categories
│   └── ...
├── pages/                       # Page Object Models
│   ├── clusters.po.ts
│   ├── projects.po.ts
│   ├── login.po.ts
│   └── ...
├── intercept/                   # API mocking interceptors
├── fixtures/                    # JSON response fixtures
├── support/                     # Shared utilities
│   ├── e2e.ts                  # Setup and custom commands
│   ├── paths.ts                # URL path constants
│   └── paste.ts                # Paste command utility
├── utils/                       # Test utility functions
│   ├── auth.ts                 # Login/logout functions
│   ├── condition.ts            # Assertion conditions
│   ├── mocks.ts                # Mock API management
│   ├── provider.ts             # Provider constants
│   ├── view.ts                 # URL view constants
│   └── wizard.ts               # Wizard step helpers
└── config.ts                   # Configuration utility
```

## Page Object Model Pattern

**Purpose:** Encapsulate selectors and interactions, avoid raw `cy.get()` in tests

**File Pattern:** `cypress/pages/[feature].po.ts`

**Example Page Object:**
```typescript
// cypress/pages/login.po.ts
export class LoginPage {
  static getLoginBtn(): Cypress.Chainable {
    return cy.get('#login-button');
  }

  static visit(): void {
    cy.visit('/');
  }
}
```

**Usage in Tests:**
```typescript
import {LoginPage} from '../../pages/login.po';

it('should login', () => {
  LoginPage.visit();
  LoginPage.getLoginBtn().click();
  cy.url().should('include', '/projects');
});
```

**Guidelines:**
- Static methods (no instance needed)
- Method names: `get[ElementName]()`, `[action]()`
- Return `Cypress.Chainable` for chainability
- Selectors encapsulated (id, class, data-cy attributes)
- Comments separate getter methods from utils (// Utils section)

## E2E Test Writing

**Test Structure:**
```typescript
import {ClustersPage} from '../../pages/clusters.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';

describe('Feature Name', () => {
  const projectName = 'test-project';
  
  beforeEach(() => {
    if (Mocks.enabled()) {
      Mocks.register(Provider.AWS);  // Register mock for this test
    }
  });

  it('should perform action', () => {
    login();
    cy.url().should(Condition.Include, '/projects');
    
    ClustersPage.createCluster(projectName);
    ClustersPage.verifyClusterExists(projectName);
  });

  it('should cleanup', () => {
    logout();
  });
});
```

**Cypress Commands:**
- `cy.visit(path)` - navigate to URL
- `cy.get(selector)` - query DOM (avoid in specs - use page objects)
- `cy.click()` - click element
- `cy.type(text)` - type text
- `cy.should(assertion)` - assert conditions
- `cy.url()` - get current URL
- `cy.setCookie(name, value)` - set auth cookies

**Custom Commands (defined in support/e2e.ts):**
```typescript
// Custom paste command for file inputs
cy.get('input[type="file"]').paste(text);
cy.get('input[type="file"]').pasteFile(filename);
```

## API Mocking for E2E Tests

**Mock Mode:**
- Enable with environment variable: `CYPRESS_MOCKS=true`
- Command: `npm run e2e:mock`
- Uses json-server on port 8080 with fixtures and intercepts

**Mock Registration:**
- Location: `cypress/utils/mocks.ts` and `cypress/intercept/`
- Called in test `beforeEach()`: `Mocks.register(Provider.AWS)`
- Provides JSON fixtures from `cypress/fixtures/`

**Disabling Tests for Running Mode:**
- Some tests excluded based on mocks enabled/disabled
- Config: `cypress.config.ts` `excludeSpecPattern`
- Example: Provider tests only in EE and with real backend

**Test Data:**
- Fixtures: `cypress/fixtures/*.json` (response bodies)
- Routes: `cypress/fixtures/routes.json` (route definitions)
- Mock server: `json-server --watch cypress/fixtures/db.json --routes cypress/fixtures/routes.json`

## Running E2E Tests by Edition

**Enterprise Edition (default):**
```bash
npm run e2e:mock                # EE with mocks
npm run e2e                     # EE with real backend
```

**Community Edition:**
```bash
KUBERMATIC_EDITION=ce npm run e2e:mock
KUBERMATIC_EDITION=ce npm run e2e
```

**Test Filtering:**
```bash
npm run cy -- --spec "cypress/e2e/stories/*.spec.ts"  # Only stories
```

## Debugging E2E Tests

**Open Cypress UI:**
```bash
npm run cy                      # Interactive test runner
```

**Debug Single Test:**
- Run in Cypress UI
- Add `cy.debug()` or `cy.pause()` calls
- Use browser DevTools (F12 in Cypress window)

**Screenshots and Videos:**
- Failure screenshots: `cypress/screenshots/`
- Failure videos: `cypress/videos/`
- Videos of successful tests deleted automatically

## Test Utilities

**Conditions (assertions):**
- `Condition.Include` - string includes value
- `Condition.HaveValue` - input has value
- `Condition.Contain` - text contains value
- `Condition.BeEnabled` - element is enabled
- `Condition.HaveClass` - element has CSS class

**Auth Utilities (cypress/utils/auth.ts):**
- `login(email, password, isAdmin)` - authenticate user (or mock)
- `logout()` - clear auth and visit home
- Automatically mocks if `Mocks.enabled()`

**Provider Constants (cypress/utils/provider.ts):**
- `Provider.AWS`, `Provider.DigitalOcean`, etc.
- Datacenter mappings: `AWS.Frankfurt`, `AWS.NVirginia`

**View Constants (cypress/utils/view.ts):**
- URL paths: `View.Projects.Default`, `View.Clusters`

**Wizard Steps (cypress/utils/wizard.ts):**
- `WizardStep.Cluster`, `WizardStep.ProviderSettings`, `WizardStep.NodeSettings`, etc.

---

*Testing analysis: 2026-04-09*
