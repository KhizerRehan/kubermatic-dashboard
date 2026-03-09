# Testing Guide

## Running Tests

```bash
# Unit tests
npm test                          # Run all tests once
npm run test:watch                # Watch mode
npm run test:ci                   # CI mode with coverage report

# Run specific test file
npm test -- --testPathPattern="component.spec"

# E2E tests
npm run e2e:mock                  # Mocked (no real API needed)
npm run e2e                       # Against dev server
npm run cy                        # Cypress only (app must be running)
```

## Test File Conventions

| Convention | Location |
|---|---|
| Component test | Same directory as component: `component.spec.ts` |
| Service test | Same directory as service: `service-name.spec.ts` |
| Error scenario test | `*.error-scenarios.spec.ts` alongside service |
| Integration test | `integration.spec.ts` in feature directory |
| E2E test | `cypress/e2e/` |

## Path Aliases

Available in test files via `jest.config.cjs` and `tsconfig.spec.json`:

| Alias | Maps to |
|---|---|
| `@app/*` | `src/app/*` |
| `@core/*` | `src/app/core/*` |
| `@shared/*` | `src/app/shared/*` |
| `@test/*` | `src/test/*` |
| `@assets/*` | `src/assets/*` |
| `@environments/*` | `src/environments/*` |

## Mock Services (`src/test/services/`)

These `@Injectable()` classes replace real services in `TestBed.configureTestingModule({ providers })`:

| Mock | Replaces | Notes |
|---|---|---|
| `auth-mock.ts` | `Auth` | Call tracking, configurable auth state |
| `project-mock.ts` | `ProjectService` | Custom project data, event simulation |
| `cluster-mock.ts` | `ClusterService` | Cluster CRUD mocking |
| `user-mock.ts` | `UserService` | User state, admin flag |
| `datacenter-mock.ts` | `DatacenterService` | Datacenter config |
| `settings-mock.ts` | `SettingsService` | Admin/user settings |
| `app-config-mock.ts` | `AppConfigService` | Feature flags, config |
| `addon-mock.ts` | `AddonService` | Add-on listing |
| `application-mock.ts` | `ApplicationService` | Application listing |
| `cluster-template-mock.ts` | `ClusterTemplateService` | Template data |
| `external-cluster-mock.ts` | `ExternalClusterService` | External clusters |
| `feature-gate-mock.ts` | `FeatureGateService` | Feature toggles |
| `machine-deployment-mock.ts` | `MachineDeploymentService` | MD operations |
| `member-mock.ts` | `MemberService` | Member CRUD |
| `metering-mock.ts` | `MeteringService` | Metering data |
| `mla-mock.ts` | `MLAService` | MLA config |
| `node-mock.ts` | `NodeService` | Node operations |
| `notification-mock.ts` | `NotificationService` | Toast notifications |
| `opa-mock.ts` | `OPAService` | OPA constraints |
| `preset-mock.ts` | `PresetsService` | Provider presets |
| `quota-mock.ts` | `QuotaService` | Resource quotas |
| `quota-calculation-mock.ts` | `QuotaCalculationService` | Quota calculations |
| `rbac-mock.ts` | `RBACService` | RBAC roles |
| `service-account-mock.ts` | `ServiceAccountService` | SA operations |
| `ssh-key-mock.ts` | `SSHKeyService` | SSH key management |
| `wizard-mock.ts` | `WizardService` | Wizard state |
| `history-mock.ts` | `HistoryService` | Navigation history |
| `cluster-service-account-mock.ts` | `ClusterServiceAccountService` | Cluster SAs |
| `activate-route-mock.ts` | `ActivatedRoute` | Route params |
| `mat-dialog-mock.ts` | `MatDialog` | Dialog open/close |
| `mat-dialog-ref-mock.ts` | `MatDialogRef` | Dialog reference |
| `router-stubs.ts` | Router directives | `routerLink` stub |

## Mock Data Factories (`src/test/data/`)

Pre-built entity objects for tests:

| File | Provides |
|---|---|
| `cluster.ts` | `fakeClusters`, cluster specs |
| `cloud-spec.ts` | Cloud provider configurations |
| `datacenter.ts` | Datacenter objects |
| `project.ts` | Project objects |
| `member.ts` | Member objects |
| `node.ts` | Node objects |
| `health.ts` | Health status objects |
| `event.ts` | Event objects |
| `external-cluster.ts` | External cluster objects |
| `metering.ts` | Metering report data |
| `mla.ts` | MLA config objects |
| `opa.ts` | OPA constraint objects |
| `quota.ts` | Quota objects |
| `rbac.ts` | RBAC binding objects |
| `serviceaccount.ts` | Service account objects |
| `sshkey.ts` | SSH key objects |
| `user-group-config.ts` | User group configs |
| `cluster-with-machine-networks.ts` | Cluster + network objects |

## Test Utilities (`src/test/utils/`)

| Utility | Purpose |
|---|---|
| `test-bed-setup.ts` | Factory for `TestBed.configureTestingModule` with common imports |
| `mock-observable-builder.ts` | Create mock observables (data, error, never-emit) |
| `form-builder-helper.ts` | Reactive form test helpers |
| `change-detection-helper.ts` | OnPush change detection helpers |
| `http-mock-builder.ts` | `HttpTestingController` request mocking |
| `fixture-helper.ts` | Component fixture helpers |
| `click-handler.ts` | Click event simulation |

## Standard TestBed Setup Pattern

```typescript
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {HttpClientModule} from '@angular/common/http';
import {RouterTestingModule} from '@angular/router/testing';
import {SharedModule} from '@shared/module';
import {CoreModule} from '@core/module';
import {Auth} from '@core/services/auth/service';
import {AuthMockService} from '@test/services/auth-mock';

describe('MyComponent', () => {
  let fixture: ComponentFixture<MyComponent>;
  let component: MyComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, SharedModule, CoreModule, RouterTestingModule],
      declarations: [MyComponent],
      providers: [
        {provide: Auth, useClass: AuthMockService},
        // ... other mock providers
      ],
      teardown: {destroyAfterEach: false},
    });

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

## Important Notes

- **Use Jest APIs only** — `jest.fn()`, `jest.spyOn()`, not `jasmine.createSpyObj`
- **Types config** — `tsconfig.spec.json` sets `"types": ["jest"]` to avoid Chai type conflicts from Cypress
- **`teardown: {destroyAfterEach: false}`** — Used consistently across all tests
- **Feature PRDs** — See `docs/features/` for per-feature test plans and coverage status
- **Archived docs** — Previous testing documentation is in `docs/testing/_archive/` for reference
