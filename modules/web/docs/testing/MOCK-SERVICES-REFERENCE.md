<!-- Copyright 2020 The Kubermatic Kubernetes Platform contributors. -->

# Mock Services Reference Guide

A comprehensive guide to the mock services available in the Kubermatic Dashboard test suite.

## Table of Contents

1. [Overview](#overview)
2. [Core Mock Services](#core-mock-services)
   - [AppConfigMock](#appconfigmock)
   - [AuthMock](#authmock)
   - [ProjectMock](#projectmock)
   - [ClusterMock](#clustermock)
   - [MatDialogMock & MatDialogRefMock](#matdialogmock--matdialogrefmock)
3. [Critical Priority Mocks](#critical-priority-mocks)
   - [OPAMock](#opamock)
   - [MLAMock](#llamock)
   - [RBACMock](#rbacmock)
   - [HistoryMock](#historymock)
4. [Complete Mock Inventory](#complete-mock-inventory)
4. [TestBed Configuration Patterns](#testbed-configuration-patterns)
5. [Common Mock Patterns](#common-mock-patterns)
6. [Creating New Mocks](#creating-new-mocks)
7. [Advanced Techniques](#advanced-techniques)

## Overview

Mock services replace real service implementations during testing, allowing you to:

- **Isolate components** from their dependencies
- **Control test data** and responses
- **Test error handling** without real API failures
- **Speed up tests** by avoiding HTTP calls
- **Predictable behavior** for reliable test execution

All mock services are located in `src/test/services/` and are designed to match the interfaces of their real counterparts while returning fake data.

## Core Mock Services

### AppConfigMock

**Location:** `src/test/services/app-config-mock.ts`

**Purpose:** Provides application configuration, version info, and feature flags.

**Key Methods:**

```typescript
getConfig(): Config
// Returns application settings (e.g., OpenStack wizard configuration)

getUserGroupConfig(): UserGroupConfig
// Returns RBAC user group configuration

getGitVersion(): VersionInfo
// Returns build version and git metadata

getCustomLinks(): CustomLink[]
// Returns custom navigation links

getRefreshTimeBase(): number
// Returns base refresh interval (in test: 200ms)

getEndOfLifeConfig(): EndOfLife
// Returns end-of-life information for versions
```

**Usage Example:**

```typescript
import {AppConfigMockService} from '@test/services';

describe('MyComponent', () => {
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyComponent],
      providers: [
        {provide: AppConfigService, useClass: AppConfigMockService}
      ]
    });

    fixture = TestBed.createComponent(MyComponent);
  });

  it('should use mock configuration', () => {
    const mockConfig = TestBed.inject(AppConfigService);
    expect(mockConfig.getRefreshTimeBase()).toBe(200);
  });
});
```

**Mock Data Sources:**
- Uses `fakeUserGroupConfig()` from `test/data/user-group-config`
- Hardcoded VersionInfo for consistency across tests

---

### AuthMock

**Location:** `src/test/services/auth-mock.ts`

**Purpose:** Simulates authentication state and OIDC integration.

**Key Methods:**

```typescript
authenticated(): boolean
// Returns whether user is logged in (default: true)

getBearerToken(): string
// Returns mock JWT token for API requests

getUsername(): string
// Returns authenticated username (default: 'testUser')

getOIDCProviderURL(): string
// Returns empty string (no real OIDC provider in tests)

logout(): Observable<boolean>
// Returns observable that emits true on logout

setNonce(): void
// No-op in tests

oidcProviderLogout(): void
// No-op in tests
```

**Important Properties:**

```typescript
isAuth = true
// Public property to control authentication state
```

**Usage Example:**

```typescript
import {AuthMockService} from '@test/services';

describe('LoginComponent', () => {
  let authMock: AuthMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LoginComponent],
      providers: [
        {provide: Auth, useClass: AuthMockService}
      ]
    });

    authMock = TestBed.inject(Auth) as AuthMockService;
  });

  it('should show content when authenticated', () => {
    authMock.isAuth = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.dashboard')).toBeTruthy();
  });

  it('should show login when not authenticated', () => {
    authMock.isAuth = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.login-form')).toBeTruthy();
  });
});
```

**Common Patterns:**

- **Test authenticated state:** Set `isAuth = true` before detectChanges()
- **Test unauthenticated state:** Set `isAuth = false`
- **Test logout flow:** Spy on `logout()` observable

---

### ProjectMock

**Location:** `src/test/services/project-mock.ts`

**Purpose:** Provides project CRUD operations and project list management.

**Key Methods:**

```typescript
create(model: ProjectModel): Observable<Project>
// Creates a new project (returns fake project)

get projects(): Observable<Project[]>
// Returns list of all projects (default: 2 fake projects)

get selectedProject(): Observable<Project>
// Returns the currently selected project

delete(projectID: string): Observable<Project>
// Deletes a project (returns null)

get allProjects(): Observable<Project[]>
// Returns all available projects

searchProjects(query: string, displayAll: boolean): Observable<Project[]>
// Filters projects by name or ID (case-insensitive)
```

**Important Properties:**

```typescript
onProjectChange = new EventEmitter<Project>()
// Emitted when project selection changes

onProjectsUpdate = new Subject<void>()
// Emitted when project list is updated
```

**Usage Example:**

```typescript
import {ProjectMockService} from '@test/services';

describe('ProjectListComponent', () => {
  let projectMock: ProjectMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProjectListComponent],
      providers: [
        {provide: ProjectService, useClass: ProjectMockService}
      ]
    });

    projectMock = TestBed.inject(ProjectService) as ProjectMockService;
  });

  it('should display all projects', fakeAsync(() => {
    const component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    expect(component.projects.length).toBe(2);
  }));

  it('should search projects by name', fakeAsync(() => {
    projectMock.searchProjects('my-project', false).subscribe(results => {
      expect(results.length).toBeGreaterThan(0);
    });
    tick();
  }));

  it('should emit event on project selection', () => {
    const project = fakeProject();
    spyOn(projectMock.onProjectChange, 'emit');

    projectMock.onProjectChange.emit(project);

    expect(projectMock.onProjectChange.emit).toHaveBeenCalledWith(project);
  });
});
```

**Test Data Sources:**
- Uses `fakeProject()` for single project
- Uses `fakeProjects()` for project arrays
- Located in `test/data/project.ts`

---

### ClusterMock

**Location:** `src/test/services/cluster-mock.ts`

**Purpose:** Provides cluster CRUD operations, health monitoring, and node management.

**Key Methods:**

```typescript
cluster(clusterId: string, dc: string, projectID: string): Observable<Cluster>
// Fetches single cluster details

clusters(projectID: string): Observable<Cluster[]>
// Lists all clusters in project

health(cluster: string, dc: string, projectID: string): Observable<Health>
// Gets cluster health status

sshKeys(): Observable<SSHKey[]>
// Lists SSH keys

deleteSSHKey(fingerprint: string): Observable<any>
// Deletes an SSH key

create(model: CreateClusterModel, dc: string, projectID: string): Observable<Cluster>
// Creates new cluster

delete(clusterName: string, dc: string, projectID: string): Observable<any>
// Deletes cluster

edit(cluster: Cluster, dc: string, projectID: string): Observable<Cluster>
// Edits cluster configuration

patch(projectID: string, clusterId: string, datacenter: string, patch: ClusterPatch): Observable<Cluster>
// Applies partial cluster update

getNodes(cluster: string, dc: string, projectID: string): Observable<Node[]>
// Lists cluster nodes

events(projectID: string, clusterId: string, datacenter: string): Observable<Event[]>
// Gets cluster events

metrics(projectID: string, clusterId: string, datacenter: string): Observable<ClusterMetrics>
// Gets cluster metrics

upgrades(cluster: string): Observable<MasterVersion[]>
// Gets available master version upgrades
```

**Important Properties:**

```typescript
providerSettingsPatchChanges$ = new Subject<ProviderSettingsPatch>().asObservable()
// Observable for provider settings changes

changeProviderSettingsPatch(): void
// Method to trigger settings change event
```

**Utility Function:**

```typescript
export function asyncData<T>(data: T): Observable<T>
// Wraps data in observable with async scheduling for realistic timing
// Use this to wrap test data for async verification
```

**Usage Example:**

```typescript
import {ClusterMockService, asyncData} from '@test/services';
import {fakeDigitaloceanCluster} from '@test/data/cluster';

describe('ClusterDetailComponent', () => {
  let clusterMock: ClusterMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ClusterDetailComponent],
      providers: [
        {provide: ClusterService, useClass: ClusterMockService}
      ]
    });

    clusterMock = TestBed.inject(ClusterService) as ClusterMockService;
  });

  it('should load cluster details', fakeAsync(() => {
    const component = fixture.componentInstance;
    const clusterId = 'test-cluster';

    fixture.detectChanges();
    tick();

    clusterMock.cluster(clusterId, 'dc-1', 'project-1').subscribe(cluster => {
      expect(cluster).toBeTruthy();
      expect(cluster.name).toBeDefined();
    });
    tick();
  }));

  it('should handle cluster deletion', () => {
    spyOn(clusterMock, 'delete').and.callThrough();

    clusterMock.delete('test-cluster', 'dc-1', 'project-1').subscribe(() => {
      expect(clusterMock.delete).toHaveBeenCalled();
    });
  });
});
```

**Test Data Sources:**
- Uses `fakeDigitaloceanCluster()` for single cluster
- Uses `fakeClusters()` for cluster arrays
- Uses `nodesFake()` for node data
- Uses `fakeHealth()`, `fakeEvents()`, `fakeSSHKeys()`
- Located in `test/data/cluster.ts` and related files

---

### MatDialogMock & MatDialogRefMock

**Location:**
- `src/test/services/mat-dialog-mock.ts`
- `src/test/services/mat-dialog-ref-mock.ts`

**Purpose:** Mocks Angular Material dialog service for testing dialog-heavy components.

**MatDialogMock - Key Methods:**

```typescript
// Currently empty - extend as needed for specific tests
```

**MatDialogRefMock - Key Methods:**

```typescript
close(dialogResult?: any): void
// Closes dialog and returns data to caller

open(cmp: any, config: any): void
// Opens a dialog (no-op in tests)
```

**Usage Example:**

```typescript
import {MatDialogMock, MatDialogRefMock} from '@test/services';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

describe('UserManagementComponent', () => {
  let dialogMock: MatDialogMock;
  let dialogRefMock: MatDialogRefMock;

  beforeEach(() => {
    dialogRefMock = new MatDialogRefMock();

    TestBed.configureTestingModule({
      declarations: [UserManagementComponent],
      providers: [
        {provide: MatDialog, useValue: dialogMock},
        {provide: MatDialogRef, useValue: dialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: {userId: 'test'}}
      ]
    });

    fixture = TestBed.createComponent(UserManagementComponent);
  });

  it('should close dialog with user data', () => {
    const userData = {userId: '123', name: 'John'};
    spyOn(dialogRefMock, 'close');

    dialogRefMock.close(userData);

    expect(dialogRefMock.close).toHaveBeenCalledWith(userData);
  });
});
```

**Note:** MatDialogMock is intentionally minimal. For dialog testing, consider:
1. Using `MAT_DIALOG_DATA` token to inject test data
2. Directly testing dialog components in isolation
3. Extending MatDialogMock with custom methods as needed (see [Creating New Mocks](#creating-new-mocks))

---

## Critical Priority Mocks

### OPAMock

**Location:** `src/test/services/opa-mock.ts`

**Purpose:** Mocks OPA (Open Policy Agent) service for constraint templates and policy management.

**Key Methods:**

```typescript
// Constraint Template Operations
constraintTemplates(datacenter: string): Observable<ConstraintTemplate[]>
// Lists all OPA constraint templates

constraintTemplate(datacenter: string, name: string): Observable<ConstraintTemplate>
// Fetches a specific constraint template

createConstraintTemplate(datacenter: string, ct: ConstraintTemplate): Observable<ConstraintTemplate>
// Creates a new constraint template

patchConstraintTemplate(datacenter: string, name: string, patch: ConstraintTemplatePatch): Observable<ConstraintTemplate>
// Updates an existing constraint template

deleteConstraintTemplate(datacenter: string, name: string): Observable<void>
// Deletes a constraint template

// Constraint Operations (cluster-specific)
constraints(projectID: string, clusterId: string, datacenter: string): Observable<Constraint[]>
// Lists all OPA constraints in a cluster

createConstraint(projectID: string, clusterId: string, datacenter: string, constraint: Constraint): Observable<Constraint>
// Creates a new OPA constraint in cluster

patchConstraint(projectID: string, clusterId: string, datacenter: string, name: string, patch: ConstraintPatch): Observable<Constraint>
// Updates a constraint in cluster

deleteConstraint(projectID: string, clusterId: string, datacenter: string, name: string): Observable<void>
// Deletes a constraint from cluster
```

**Usage Example:**

```typescript
import {OPAMockService} from '@test/services';

describe('OPAPolicyComponent', () => {
  let opaMock: OPAMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OPAPolicyComponent],
      providers: [
        {provide: OPAService, useClass: OPAMockService}
      ]
    });

    opaMock = TestBed.inject(OPAService) as OPAMockService;
  });

  it('should display constraint templates', fakeAsync(() => {
    opaMock.constraintTemplates('dc-1').subscribe(templates => {
      expect(templates).toBeTruthy();
      expect(templates.length).toBeGreaterThan(0);
    });
    tick();
  }));

  it('should create new constraint', fakeAsync(() => {
    const newConstraint = fakeConstraint();
    opaMock.createConstraint('proj-1', 'cluster-1', 'dc-1', newConstraint)
      .subscribe(created => {
        expect(created.metadata.name).toBe(newConstraint.metadata.name);
      });
    tick();
  }));
});
```

---

### MLAMock

**Location:** `src/test/services/mla-mock.ts`

**Purpose:** Mocks MLA (Multi-Level Authentication) service for alertmanager and rule management.

**Key Methods:**

```typescript
// Alertmanager Configuration
alertmanagerConfig(projectID: string, clusterId: string, datacenter: string): Observable<AlertmanagerConfig>
// Fetches alertmanager configuration

createAlertmanagerConfig(projectID: string, clusterId: string, datacenter: string, config: AlertmanagerConfig): Observable<AlertmanagerConfig>
// Creates or updates alertmanager configuration

deleteAlertmanagerConfig(projectID: string, clusterId: string, datacenter: string): Observable<void>
// Deletes alertmanager configuration

// Rule Group Operations
ruleGroups(projectID: string, clusterId: string, datacenter: string): Observable<RuleGroup[]>
// Lists all alerting rule groups

createRuleGroup(projectID: string, clusterId: string, datacenter: string, ruleGroup: RuleGroup): Observable<RuleGroup>
// Creates a new rule group

patchRuleGroup(projectID: string, clusterId: string, datacenter: string, name: string, patch: RuleGroupPatch): Observable<RuleGroup>
// Updates a rule group

deleteRuleGroup(projectID: string, clusterId: string, datacenter: string, name: string): Observable<void>
// Deletes a rule group
```

**Usage Example:**

```typescript
import {MLAMockService} from '@test/services';

describe('AlertmanagerConfigComponent', () => {
  let mlaMock: MLAMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AlertmanagerConfigComponent],
      providers: [
        {provide: MLAService, useClass: MLAMockService}
      ]
    });

    mlaMock = TestBed.inject(MLAService) as MLAMockService;
  });

  it('should load alertmanager config', fakeAsync(() => {
    mlaMock.alertmanagerConfig('proj-1', 'cluster-1', 'dc-1')
      .subscribe(config => {
        expect(config).toBeTruthy();
      });
    tick();
  }));

  it('should create rule group', fakeAsync(() => {
    const newRuleGroup = fakeRuleGroup();
    mlaMock.createRuleGroup('proj-1', 'cluster-1', 'dc-1', newRuleGroup)
      .subscribe(created => {
        expect(created.name).toBe(newRuleGroup.name);
      });
    tick();
  }));
});
```

---

### RBACMock

**Location:** `src/test/services/rbac-mock.ts`

**Purpose:** Mocks RBAC (Role-Based Access Control) service for role binding management.

**Key Methods:**

```typescript
// Cluster Role Bindings
clusterRoleBindings(projectID: string, clusterId: string, datacenter: string): Observable<ClusterRoleBinding[]>
// Lists cluster role bindings

createClusterRoleBinding(projectID: string, clusterId: string, datacenter: string, binding: ClusterRoleBinding): Observable<ClusterRoleBinding>
// Creates a cluster role binding

deleteClusterRoleBinding(projectID: string, clusterId: string, datacenter: string, name: string): Observable<void>
// Deletes a cluster role binding

// Namespace Role Bindings
namespaceRoleBindings(projectID: string, clusterId: string, datacenter: string, namespace: string): Observable<NamespaceRoleBinding[]>
// Lists namespace role bindings

createNamespaceRoleBinding(projectID: string, clusterId: string, datacenter: string, namespace: string, binding: NamespaceRoleBinding): Observable<NamespaceRoleBinding>
// Creates a namespace role binding

deleteNamespaceRoleBinding(projectID: string, clusterId: string, datacenter: string, namespace: string, name: string): Observable<void>
// Deletes a namespace role binding
```

**Usage Example:**

```typescript
import {RBACMockService} from '@test/services';

describe('RoleBindingComponent', () => {
  let rbacMock: RBACMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RoleBindingComponent],
      providers: [
        {provide: RBACService, useClass: RBACMockService}
      ]
    });

    rbacMock = TestBed.inject(RBACService) as RBACMockService;
  });

  it('should list cluster role bindings', fakeAsync(() => {
    rbacMock.clusterRoleBindings('proj-1', 'cluster-1', 'dc-1')
      .subscribe(bindings => {
        expect(bindings).toBeTruthy();
        expect(Array.isArray(bindings)).toBe(true);
      });
    tick();
  }));

  it('should create namespace role binding', fakeAsync(() => {
    const newBinding = fakeNamespaceRoleBinding();
    rbacMock.createNamespaceRoleBinding('proj-1', 'cluster-1', 'dc-1', 'default', newBinding)
      .subscribe(created => {
        expect(created.metadata.name).toBe(newBinding.metadata.name);
      });
    tick();
  }));
});
```

---

### HistoryMock

**Location:** `src/test/services/history-mock.ts`

**Purpose:** Mocks browser history service for navigation testing.

**Key Methods:**

```typescript
// Navigation History
back(): void
// Navigates to previous page in history

forward(): void
// Navigates to next page in history

pushItem(item: HistoryItem): void
// Adds item to navigation history stack
```

**Usage Example:**

```typescript
import {HistoryMockService} from '@test/services';
import {HistoryService} from '@core/services';

describe('NavigationComponent', () => {
  let historyMock: HistoryMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NavigationComponent],
      providers: [
        {provide: HistoryService, useClass: HistoryMockService}
      ]
    });

    historyMock = TestBed.inject(HistoryService) as HistoryMockService;
  });

  it('should navigate back', () => {
    spyOn(historyMock, 'back');

    fixture.componentInstance.goBack();
    fixture.detectChanges();

    expect(historyMock.back).toHaveBeenCalled();
  });

  it('should add to history on navigation', () => {
    const item = {url: '/clusters', title: 'Clusters'};

    historyMock.pushItem(item);

    expect(historyMock.pushItem).toHaveBeenCalledWith(item);
  });
});
```

---

## Complete Mock Inventory

| Mock Service | Location | Purpose | Primary Method |
|---|---|---|---|
| **Core Mocks** | | | |
| AppConfigMock | `app-config-mock.ts` | Application configuration | `getConfig()` |
| AuthMock | `auth-mock.ts` | Authentication state | `authenticated()` |
| ProjectMock | `project-mock.ts` | Project management | `projects` |
| ClusterMock | `cluster-mock.ts` | Cluster operations | `cluster()` |
| MatDialogMock | `mat-dialog-mock.ts` | Material dialogs | `open()` |
| MatDialogRefMock | `mat-dialog-ref-mock.ts` | Dialog reference | `close()` |
| **Critical Priority Mocks** | | | |
| OPAMock | `opa-mock.ts` | OPA policy management | `constraintTemplates()` |
| MLAMock | `mla-mock.ts` | Alertmanager & rules | `alertmanagerConfig()` |
| RBACMock | `rbac-mock.ts` | Role binding management | `clusterRoleBindings()` |
| HistoryMock | `history-mock.ts` | Browser history | `back()` |
| **Other Mocks** | | | |
| AddonMock | `addon-mock.ts` | Cluster add-ons management | `create()` |
| ApplicationMock | `application-mock.ts` | Application deployments | `list()` |
| ClusterServiceAccountMock | `cluster-service-account-mock.ts` | Service accounts | `list()` |
| ClusterTemplateMock | `cluster-template-mock.ts` | Cluster templates | `list()` |
| DatacenterMock | `datacenter-mock.ts` | Datacenter configuration | `datacenters()` |
| FeatureGateMock | `feature-gate-mock.ts` | Feature gates | `getFeatureGates()` |
| MachineDeploymentMock | `machine-deployment-mock.ts` | Machine deployments | `list()` |
| MemberMock | `member-mock.ts` | Project members | `list()` |
| MeteringMock | `metering-mock.ts` | Usage metering | `getMeteringReport()` |
| NodeMock | `node-mock.ts` | Node operations | `list()` |
| NotificationMock | `notification-mock.ts` | Notifications | `success()` |
| PresetMock | `preset-mock.ts` | Cloud provider presets | `list()` |
| QuotaMock | `quota-mock.ts` | Resource quotas | `quotas()` |
| QuotaCalculationMock | `quota-calculation-mock.ts` | Quota calculations | `calculate()` |
| ServiceAccountMock | `service-account-mock.ts` | Service accounts | `list()` |
| SSHKeyMock | `ssh-key-mock.ts` | SSH key management | `list()` |
| UserMock | `user-mock.ts` | User information | `currentUser` |
| SettingsMock | `settings-mock.ts` | User settings | `DEFAULT_USER_SETTINGS_MOCK` |
| ActivateRouteMock | `activate-route-mock.ts` | Route activation | `params` |

---

## TestBed Configuration Patterns

### Pattern 1: Basic Service Mocking

```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    declarations: [MyComponent],
    providers: [
      {provide: SomeService, useClass: SomeMockService}
    ]
  });

  fixture = TestBed.createComponent(MyComponent);
});
```

### Pattern 2: Multiple Service Mocks

```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    declarations: [MyComponent],
    imports: [
      NoopAnimationsModule,
      MatDialogModule,
      HttpClientTestingModule
    ],
    providers: [
      {provide: AppConfigService, useClass: AppConfigMockService},
      {provide: ProjectService, useClass: ProjectMockService},
      {provide: ClusterService, useClass: ClusterMockService},
      {provide: AuthService, useClass: AuthMockService}
    ]
  });

  fixture = TestBed.createComponent(MyComponent);
});
```

### Pattern 3: Injecting and Configuring Mocks

```typescript
let projectMock: ProjectMockService;
let clusterMock: ClusterMockService;

beforeEach(() => {
  TestBed.configureTestingModule({
    declarations: [MyComponent],
    providers: [
      {provide: ProjectService, useClass: ProjectMockService},
      {provide: ClusterService, useClass: ClusterMockService}
    ]
  });

  fixture = TestBed.createComponent(MyComponent);

  // Inject mocks for use in tests
  projectMock = TestBed.inject(ProjectService) as ProjectMockService;
  clusterMock = TestBed.inject(ClusterService) as ClusterMockService;
});

it('should handle project changes', () => {
  // Configure mock behavior
  spyOn(projectMock.onProjectChange, 'emit');

  // Trigger action
  projectMock.onProjectChange.emit(fakeProject());

  // Assert
  expect(projectMock.onProjectChange.emit).toHaveBeenCalled();
});
```

### Pattern 4: Dialog Service Mocking

```typescript
let dialogRefMock: MatDialogRefMock;

beforeEach(() => {
  dialogRefMock = new MatDialogRefMock();

  TestBed.configureTestingModule({
    declarations: [MyDialogComponent],
    providers: [
      {provide: MatDialog, useValue: {}},
      {provide: MatDialogRef, useValue: dialogRefMock},
      {provide: MAT_DIALOG_DATA, useValue: {testData: 'value'}}
    ]
  });

  fixture = TestBed.createComponent(MyDialogComponent);
});
```

---

## Common Mock Patterns

### Pattern: Spying on Mock Methods

Test that components call service methods correctly:

```typescript
it('should call service method on button click', () => {
  const projectMock = TestBed.inject(ProjectService) as ProjectMockService;
  spyOn(projectMock, 'delete').and.callThrough();

  // Trigger action in component
  fixture.debugElement.query(By.css('.delete-btn')).nativeElement.click();
  fixture.detectChanges();

  expect(projectMock.delete).toHaveBeenCalledWith('project-id');
});
```

### Pattern: Returning Custom Data from Mocks

```typescript
it('should display custom project data', fakeAsync(() => {
  const projectMock = TestBed.inject(ProjectService) as ProjectMockService;
  const customProject = {id: 'custom', name: 'Custom Project'} as Project;

  spyOn(projectMock, 'projects', 'get').and.returnValue(of([customProject]));

  fixture.detectChanges();
  tick();

  expect(fixture.componentInstance.projects).toContain(customProject);
}));
```

### Pattern: Simulating Observable Chains

```typescript
it('should handle async operations', fakeAsync(() => {
  const clusterMock = TestBed.inject(ClusterService) as ClusterMockService;

  clusterMock.cluster('id', 'dc', 'project')
    .pipe(
      switchMap(cluster => clusterMock.health(cluster.id, 'dc', 'project'))
    )
    .subscribe(health => {
      expect(health).toBeTruthy();
    });

  tick();
}));
```

### Pattern: Testing Subject/EventEmitter Updates

```typescript
it('should react to project updates', fakeAsync(() => {
  const projectMock = TestBed.inject(ProjectService) as ProjectMockService;

  projectMock.onProjectsUpdate.next();
  tick();

  expect(fixture.componentInstance.isRefreshing).toBe(true);
}));
```

---

## Creating New Mocks

### Step 1: Understand the Service Interface

Before creating a mock, examine the real service:

```typescript
// Real service (e.g., cluster.ts)
@Injectable({providedIn: 'root'})
export class ClusterService {
  cluster(projectID: string, clusterId: string): Observable<Cluster> {
    return this._http.get<Cluster>(`/api/${projectID}/clusters/${clusterId}`);
  }

  deleteCluster(projectID: string, clusterId: string): Observable<void> {
    return this._http.delete<void>(`/api/${projectID}/clusters/${clusterId}`);
  }
}
```

### Step 2: Create Mock with Same Public Interface

```typescript
// Mock version
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {Cluster} from '@shared/entity/cluster';
import {fakeCluster} from '../data/cluster';

@Injectable()
export class ClusterMockService {
  cluster(projectID: string, clusterId: string): Observable<Cluster> {
    return of(fakeCluster());
  }

  deleteCluster(projectID: string, clusterId: string): Observable<void> {
    return of(void 0);
  }
}
```

### Step 3: Add Observable Behavior

For realistic async behavior, use `asyncData()`:

```typescript
import {ClusterService} from '@core/services';
import {defer, Observable, of} from 'rxjs';
import {async} from 'rxjs-compat/scheduler/async';

export function asyncData<T>(data: T): Observable<T> {
  return defer(() => of(data, async));
}

@Injectable()
export class ClusterMockService {
  cluster(projectID: string, clusterId: string): Observable<Cluster> {
    return asyncData(fakeCluster());
  }
}
```

### Step 4: Add EventEmitters/Subjects for Reactive Updates

```typescript
@Injectable()
export class ProjectMockService {
  onProjectChange = new EventEmitter<Project>();
  onProjectsUpdate = new Subject<void>();

  selectProject(project: Project): void {
    this.onProjectChange.emit(project);
  }
}
```

### Step 5: Provide Configurable State (Optional)

```typescript
@Injectable()
export class UserMockService {
  private _currentUser: Member = fakeMember();

  get currentUser(): Observable<Member> {
    return of(this._currentUser);
  }

  setCurrentUser(user: Member): void {
    this._currentUser = user;
  }
}
```

### Complete Mock Example

```typescript
// Copyright header...

import {EventEmitter, Injectable} from '@angular/core';
import {Observable, of, Subject} from 'rxjs';
import {Cluster} from '@shared/entity/cluster';
import {ClusterPatch} from '@shared/entity/cluster';
import {fakeCluster, fakeClusters} from '../data/cluster';

export function asyncData<T>(data: T): Observable<T> {
  return defer(() => of(data, async));
}

/**
 * Mock implementation of ClusterService for testing.
 *
 * Provides fake cluster data and simulates API responses.
 * Use this in TestBed configuration to isolate components from
 * the real cluster service.
 *
 * Example:
 * ```
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: ClusterService, useClass: ClusterMockService}
 *   ]
 * });
 * ```
 */
@Injectable()
export class ClusterMockService {
  private _cluster: Cluster = fakeCluster();
  private _clusters: Cluster[] = fakeClusters();

  onClusterUpdate = new Subject<Cluster>();

  cluster(projectID: string, clusterId: string): Observable<Cluster> {
    return asyncData(this._cluster);
  }

  clusters(projectID: string): Observable<Cluster[]> {
    return asyncData(this._clusters);
  }

  updateCluster(projectID: string, clusterId: string, patch: ClusterPatch): Observable<Cluster> {
    return asyncData(this._cluster);
  }

  setMockCluster(cluster: Cluster): void {
    this._cluster = cluster;
    this.onClusterUpdate.next(cluster);
  }
}
```

---

## Advanced Techniques

### Technique 1: Extending Mocks for Custom Behavior

```typescript
// Create a custom mock extending the base mock
class CustomClusterMockService extends ClusterMockService {
  cluster(projectID: string, clusterId: string): Observable<Cluster> {
    // Custom logic: return error after 3 calls
    if (this.callCount++ > 3) {
      return throwError(() => new Error('Rate limited'));
    }
    return super.cluster(projectID, clusterId);
  }

  private callCount = 0;
}

// Use in tests
TestBed.configureTestingModule({
  providers: [
    {provide: ClusterService, useClass: CustomClusterMockService}
  ]
});
```

### Technique 2: Conditional Mock Behavior Based on Parameters

```typescript
@Injectable()
export class ProjectMockService {
  projects(filters?: {archived?: boolean}): Observable<Project[]> {
    if (filters?.archived) {
      return of([fakeProject({id: 'archived-1', name: 'Archived Project'})]);
    }
    return of(fakeProjects());
  }
}
```

### Technique 3: Tracking Mock Calls for Test Assertions

```typescript
@Injectable()
export class ClusterMockService {
  private _callHistory: {method: string; args: any[]}[] = [];

  cluster(projectID: string, clusterId: string): Observable<Cluster> {
    this._callHistory.push({method: 'cluster', args: [projectID, clusterId]});
    return of(fakeCluster());
  }

  getCallHistory() {
    return this._callHistory;
  }
}

// In test:
it('should call cluster service correctly', () => {
  const mock = TestBed.inject(ClusterService) as ClusterMockService;
  mock.cluster('proj-1', 'cluster-1').subscribe();

  const history = mock.getCallHistory();
  expect(history[0].args).toEqual(['proj-1', 'cluster-1']);
});
```

### Technique 4: Simulating Different Response Scenarios

```typescript
@Injectable()
export class ClusterMockService {
  private _scenario: 'success' | 'error' | 'empty' = 'success';

  setScenario(scenario: 'success' | 'error' | 'empty'): void {
    this._scenario = scenario;
  }

  clusters(projectID: string): Observable<Cluster[]> {
    switch (this._scenario) {
      case 'error':
        return throwError(() => new Error('API Error'));
      case 'empty':
        return of([]);
      default:
        return of(fakeClusters());
    }
  }
}

// In test:
it('should handle cluster load errors gracefully', fakeAsync(() => {
  const mock = TestBed.inject(ClusterService) as ClusterMockService;
  mock.setScenario('error');

  fixture.detectChanges();
  tick();

  expect(fixture.componentInstance.errorMessage).toBeTruthy();
}));
```

---

## Best Practices

1. **Keep Mocks Simple:** Only implement methods used by the component under test
2. **Use Fake Data:** Leverage existing `test/data/` factories for consistency
3. **Match Real Service Interface:** Mock signatures should be identical to real services
4. **Return Realistic Types:** Don't return `null` when the real service would return objects
5. **Use AsyncData for Observable Tests:** Wrap responses in `asyncData()` for realistic timing
6. **Spy on Mocks:** Use `spyOn()` to verify component-service interactions
7. **Document Configuration:** Add comments explaining mock dependencies
8. **Extend When Needed:** Create custom mocks by extending base mocks rather than duplicating code
9. **Test Isolation:** Each test should be independent and not rely on mock state from other tests
10. **Reset Mocks Between Tests:** Clear spy calls and reset state in `afterEach()` if needed

---

## Related Documentation

- [Testing Patterns Guide](./TESTING-PATTERNS.md) - Comprehensive testing patterns and examples
- [Advanced Testing Patterns](./ADVANCED-TESTING-PATTERNS.md) - Observable builders, form helpers, change detection, and HTTP mocking patterns
- [Setup Verification Checklist](./SETUP-VERIFICATION.md) - Jest configuration and troubleshooting
- Test Data Factories: `src/test/data/` - Fake object generators
- Real Services: `src/app/core/services/` - Service implementations to mock
- Testing Utilities: `src/test/utils/` - Reusable helper classes and factories

---

**Last Updated:** March 2026
**Angular Version:** 20.3.x
**Jest Version:** Latest
