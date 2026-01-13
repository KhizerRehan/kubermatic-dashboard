# Kubermatic Web UI - Angular Application Architecture Summary

## Overview
The Kubermatic web UI is a sophisticated Angular-based cluster management platform. It follows a modular, feature-based architecture with strong separation of concerns between core services, shared utilities, and feature modules.

## Directory Structure Overview

```
modules/web/src/app/
├── core/                          # Core module with central services
├── shared/                        # Shared utilities, components, and models
├── wizard/                        # Cluster creation wizard flow
├── node-data/                     # Node configuration and provider-specific UI
├── cluster/                       # Cluster management features
├── project/                       # Project management
├── settings/                      # User and admin settings
├── external-cluster-wizard/       # External cluster integration
├── kubeone-wizard/               # KubeOne cluster provisioning
├── dashboard/                     # Main dashboard view
├── pages/                         # Static pages (login, 404, etc.)
└── dynamic/                       # Feature flagging and enterprise modules
```

---

## 1. Main Application Structure

### App Module (`app/module.ts`)
- **Root Module**: Entry point for the entire Angular application
- **Initialization**: Uses `APP_INITIALIZER` to bootstrap core services
- **Key Services Initialized**:
  - `UserService`: User authentication and profile management
  - `DatacenterService`: Datacenter configuration
  - `HistoryService`: Navigation history tracking
  - `AppConfigService`: Application configuration loading

### App Routing (`app/routing.ts`)
- **Strategy**: Lazy-loaded feature modules for performance optimization
- **Preloading**: Custom `SelectedPreloadingStrategy` for selective module preloading
- **Key Routes**:
  - `/projects/*` - Project management
  - `/projects/:projectID/wizard` - Cluster creation wizard
  - `/projects/:projectID/clusters` - Cluster list/management
  - `/projects/:projectID/members` - Project membership
  - `/projects/:projectID/serviceaccounts` - Kubernetes service accounts
  - `/projects/:projectID/sshkeys` - SSH key management (guarded by `SSHKeyGuard`)

### App Component (`app/component.ts`)
- **Role**: Root component serving as main layout container
- **Responsibilities**: 
  - Navigation bar and sidenav
  - Notification panel
  - Theme management
  - User panel

---

## 2. Core Module Architecture

### Location: `core/`

#### Core Services (`core/services/`)
**~41 TypeScript service files** providing business logic and API communication

**Key Service Categories**:

1. **Cluster Management**
   - `cluster.ts` - Cluster CRUD operations
   - `cluster-spec.ts` - Cluster specification state (critical for wizard)
   - `cluster-templates.ts` - Cluster template handling
   - `cluster-backup.ts` - Backup management

2. **Provider Services** (`core/services/provider/`)
   - `aws.ts`, `azure.ts`, `gcp.ts`, `openstack.ts`, etc.
   - Fetch provider-specific resources (sizes, subnets, zones)
   - ~15 provider-specific service files

3. **Node/Machine Deployment**
   - `node-data/service.ts` - Central node data state management
   - `node-data/provider/*` - Provider-specific node data handlers
   - `machine-deployment.ts` - Machine deployment management

4. **Cluster Configuration**
   - `datacenter.ts` - Datacenter metadata
   - `settings.ts` - Global application settings
   - `feature-gate.ts` - Feature flag management

5. **User & Authorization**
   - `user.ts` - Current user information
   - `auth/` - Authentication guards and service
   - `rbac.ts` - Role-based access control

6. **Wizard-Specific**
   - `wizard/wizard.ts` - Wizard state and step navigation
   - `wizard/presets.ts` - Provider preset configurations

#### Core Components (`core/components/`)
- Navigation, Sidenav, Project Selector
- Notification Panel, User Panel, Footer
- Help Panel

#### Authentication & Interceptors (`core/interceptors/`)
- `auth.ts` - Authentication token injection
- `check-token.ts` - Token validity checking
- `error-notifications.ts` - Error message handling
- `loader.ts` - HTTP loading indicator

#### Global Module (`core/services/global/`)
- Shared global configuration accessible across services

---

## 3. Shared Module Architecture

### Location: `shared/`

#### Shared Module (`shared/module.ts`)
- **Purpose**: Centralized export of all shared components, directives, and pipes
- **Exports**: 
  - 57+ components
  - 3+ directives
  - Multiple pipes
  - All Material Design modules

#### Key Subdirectories

##### Components (`shared/components/`)
**~57 reusable components** organized by feature:

**Form Components**:
- `label-form/`, `annotation-form/`, `taint-form/` - Configuration forms
- `chip-autocomplete/`, `chip-list/` - Tag/chip inputs
- `cidr-form/` - Network CIDR inputs
- `machine-flavor-filter/` - Machine type filtering
- `machine-type-selector/` - Machine selection UI

**Dialog/Modal Components**:
- `add-project-dialog/`, `add-ssh-key-dialog/`
- `confirmation-dialog/`, `announcements-dialog/`
- `add-external-cluster-dialog/`, `add-cluster-from-template-dialog/`

**Provider-Specific**:
- `openstack-credentials/` - OpenStack credential configuration
- `external-cluster-credentials/` - Multi-cloud external cluster creds
- `external-cluster-data-dialog/` - External cluster management

**Utility Components**:
- `event-list/`, `event-card/` - Cluster events
- `addon-list/` - Kubernetes addon management
- `application-list/` - Application catalog (KKP Apps)
- `cluster-summary/`, `cluster-from-template/` - Cluster display/creation
- `terminal/` - Terminal/console access
- `loader/`, `spinner-with-confirmation/` - Loading states
- `property/`, `property-boolean/`, `property-health/` - Data display

##### Entity Models (`shared/entity/`)
**TypeScript interfaces/classes** mirroring backend API structures:
- `cluster.ts` - Cluster entity and specs
- `node.ts` - Node specifications (NodeSpec, NodeCloudSpec)
- `project.ts` - Project entity
- `machine-deployment.ts` - Machine deployment specs
- `provider/*` - Provider-specific entities (AWS, Azure, GCP, etc.)
- `settings.ts`, `opa.ts`, `mla.ts` - Feature-specific entities

##### Models (`shared/model/`)
- `NodeSpecChange.ts` - NodeData class (central data transfer object)
- `NodeProviderConstants.ts` - Provider enums and utilities
- `Config.ts` - Configuration constants
- `Terminal.ts` - Terminal session state

##### Validators (`shared/validators/`)
- `base-form.validator.ts` - Abstract base validator for forms
- `async.validators.ts` - Async validation (DNS, unique names, etc.)
- `others.ts` - Regex validators for naming, CIDR, IP addresses

##### Utilities (`shared/utils/`)
- Common functions for data transformation
- Provider-specific helper functions

##### Directives (`shared/directives/`)
- `autofocus/` - Auto-focus form elements
- `input-password/` - Password visibility toggle
- `throttle-click/` - Click debouncing
- `value-changed-indicator/` - Form change indication

##### Pipes (`shared/pipes/`)
- `relativetime/` - Human-readable relative timestamps
- `linklocation/` - Link transformation
- `size/` - Byte size formatting

---

## 4. Wizard & Cluster Creation Flow

### Architecture: Multi-Step Stepper Pattern

#### Wizard Component (`wizard/component.ts`)
**Role**: Main orchestrator for cluster creation workflow

**Key Responsibilities**:
- FormGroup management for the entire wizard
- Step registry and navigation using Material Stepper
- Cluster template handling
- Quota calculation integration
- Cluster creation submission

**Form Structure**:
- Reactive Forms with multiple nested FormGroups (one per step)
- ControlValueAccessor integration for custom value binding

**Wizard Steps** (`wizard/config.ts`):
```
1. Provider Selection - Choose cloud provider (AWS, Azure, etc.)
2. Cluster Settings - Name, version, network configuration
3. Provider Settings - Cloud-specific credentials and configuration
4. Initial Nodes - Machine deployment and sizing
5. Machine Network (Optional) - Advanced networking (VSphere only)
6. Applications - Select and configure cluster applications
7. Summary - Review before creation
```

#### Wizard Steps (`wizard/step/`)

**Base Step** (`step/base.ts`):
- Abstract base class for all steps
- Common validation logic
- Form control access patterns

**Step Components**:
1. **Provider Datacenter** (`provider-datacenter/`)
   - Provider selection UI
   - Datacenter selection
   - Credential input (basic provider settings)

2. **Cluster Settings** (`cluster/`)
   - Cluster name, version
   - Network configuration (CIDR ranges)
   - SSH key selection
   - Feature flag toggles (RBAC, Pod Security Policies, etc.)

3. **Provider Settings** (`provider-settings/`)
   - Dynamic provider-specific forms
   - Network/VPC selection
   - Advanced cloud configuration
   - Preset credential loading

4. **Node Settings** (`node-settings/`)
   - Initial machine deployment configuration
   - Delegates to `NodeDataComponent`

5. **Machine Network** (`network/`)
   - Advanced networking for VSphere
   - Static IP configuration

6. **Applications** (`applications/`)
   - Application selection from catalog
   - Application value configuration

7. **Summary** (`summary/`)
   - Read-only cluster configuration review
   - Template saving option

#### Wizard Service (`core/services/wizard/wizard.ts`)
- **State Management**: Manages which steps are visible based on provider
- **Step Handler**: Hides/shows steps based on provider and OS selection
- **EventEmitter**: `stepsChanges` emits when step visibility changes
- **Conditional Steps**:
  - BringYourOwn: Hides ProviderSettings and NodeSettings
  - Edge: Hides ProviderSettings only
  - Most Providers: Shows all standard steps

---

## 5. Node Data & Provider Integration Architecture

### Node Data Component (`node-data/`)

**Central Component** (`node-data/component.ts`):
- **~30KB file**: Implements ControlValueAccessor for two-way binding
- **Purpose**: Unified interface for configuring node/machine deployment specs
- **Key Features**:
  - Operating system selection (Ubuntu, RHEL, Flatcar, Rocky Linux, Amazon Linux 2)
  - Node count, taints, labels configuration
  - Provider-specific basic and extended settings
  - Cluster autoscaling configuration
  - Kubelet version selection
  - Operating system profile selection
  - Quota calculation integration

**Form Controls**:
```
- name: Machine deployment name
- count: Node replica count
- operatingSystem: Selected OS
- upgradeOnBoot: Auto-update flag
- disableAutoUpdate: Disable updates flag
- providerBasic: Basic provider settings
- providerExtended: Extended provider settings
- kubelet: Kubelet configuration
- operatingSystemProfile: OS profile reference
- enableClusterAutoscalingApp: Autoscaling flag
- maxReplicas/minReplicas: Autoscaling bounds
- DNSServers/gateway/CIDR: Static network config
- RhelSubscriptionManager: RHEL subscription info
```

### Provider-Specific Node Data (`node-data/basic/provider/`)

**Pattern**: Each provider has its own component implementing ControlValueAccessor

**Providers** (~18 total):
- AWS, Azure, GCP, OpenStack, VSphere, vSphere Cloud, Baremetal
- Alibaba, Anexia, DigitalOcean, Hetzner, Nutanix, KubeVirt, Edge

**Example: AWS** (`node-data/basic/provider/aws/component.ts`):
```typescript
Controls:
- size: Instance type selection (t3.medium, etc.)
- diskSize: Root volume size
- diskType: EBS volume type (gp2, gp3, io1, etc.)
- subnetId: Subnet and AZ selection
- ami: Custom AMI (optional)

Data Flows:
- PresetService: Loads AWS credentials
- AWSService: Fetches available sizes and subnets
- NodeDataService: Notifies global node data changes
```

### Node Data Service (`core/services/node-data/service.ts`)

**Responsibilities**:
- Centralized NodeData state management
- Provider instance management for 15+ cloud providers
- Operating system change tracking
- NodeData validation and subscription system

**Key Pattern**:
```typescript
private _nodeData: NodeData = NodeData.NewEmptyNodeData();
readonly nodeDataChanges = new ReplaySubject<NodeData>();

// For each update:
this._nodeData = updateNodeData(...);
this.nodeDataChanges.next(this._nodeData);
```

**Provider Integration**:
- Injects all provider services (AWSService, AzureService, etc.)
- Manages provider-specific NodeDataProviders:
  - NodeDataAWSProvider
  - NodeDataGCPProvider
  - NodeDataVSphereProvider
  - etc.

### Provider Services Architecture (`core/services/provider/`)

**Pattern**: Simple REST API wrappers

**Each provider service**:
- HTTP calls to backend API
- Type-safe responses (e.g., `Observable<AWSSize[]>`)
- Credential handling via PresetService

**Example - AWS Service** (`core/services/provider/aws.ts`):
```typescript
getSubnets(projectID, clusterID): Observable<AWSSubnet[]>
getSizes(projectID, clusterID): Observable<AWSSize[]>
```

**Backend Integration Points**:
```
/projects/{projectID}/clusters/{clusterID}/providers/{provider}/subnets
/projects/{projectID}/clusters/{clusterID}/providers/{provider}/sizes
/projects/{projectID}/clusters/{clusterID}/providers/{provider}/...
```

---

## 6. State Management Patterns

### Service-Based State Management (No NgRx/NGRX)

**Pattern**: Observable-based services with EventEmitters and ReplaySubjects

#### Key State Holders:

1. **ClusterSpecService** (`core/services/cluster-spec.ts`)
   - **Purpose**: Central cluster configuration state
   - **State**:
     ```typescript
     _cluster: Cluster
     _sshKeys: SSHKey[]
     _encryptionAtRestKey: string
     ```
   - **Events**: `clusterChanges`, `providerChanges`, `datacenterChanges`, etc.
   - **Pattern**: EventEmitter for discrete changes, getter/setter for updates

2. **NodeDataService** (`core/services/node-data/service.ts`)
   - **Purpose**: Current node/machine deployment configuration
   - **State**: 
     ```typescript
     _nodeData: NodeData
     _operatingSystemChanges = new ReplaySubject<OperatingSystem>()
     nodeDataChanges = new ReplaySubject<NodeData>()
     ```

3. **WizardService** (`core/services/wizard/wizard.ts`)
   - **Purpose**: Wizard navigation and step visibility
   - **State**: 
     ```typescript
     _stepper: MatStepper
     _steps: WizardStep[]
     stepsChanges: EventEmitter<StepRegistry>
     ```

#### Data Flow Pattern:

```
User Input
   ↓
Component (FormControl)
   ↓
Service (setState, emit event)
   ↓
Other components subscribe to changes
   ↓
UI updates via async pipe or subscribe()
```

**Example - Wizard Provider Change**:
```
1. User selects AWS provider
2. ProviderComponent emits selection
3. ClusterSpecService.provider = AWS
4. Triggers providerChanges event
5. WizardService subscribes → shows/hides steps
6. NodeDataService updates available provider fields
```

---

## 7. Key Architectural Patterns

### 1. ControlValueAccessor Pattern
**Used by**: NodeDataComponent, provider components, form sections
**Purpose**: Create reusable form components that integrate seamlessly with reactive forms
**Implementation**:
```typescript
@Component({
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyComponent) }
  ]
})
export class MyComponent implements ControlValueAccessor {
  writeValue(value) { }
  registerOnChange(fn) { }
  registerOnTouched(fn) { }
}
```

### 2. Lazy Module Loading
**Used by**: All feature modules (wizard, cluster, project, etc.)
**Benefit**: Reduces initial bundle size, loads features on-demand
**Configuration**: Routes with `loadChildren` in `app/routing.ts`

### 3. Provider-Specific Component Injection
**Pattern**: Dynamic component loading based on selected provider
**Used in**:
- `wizard/step/provider-settings/provider/` - Provider credential forms
- `node-data/basic/provider/` - Node configuration forms
**Implementation**: `*ngIf` switching or dynamic component loading

### 4. Configuration Injection
**Pattern**: Use of Angular InjectionToken for configuration
**Example**: `NODE_DATA_CONFIG` token in NodeDataService
**Benefits**: Testability, configuration isolation

### 5. Reactive Forms + Validation
**Pattern**: Heavy use of FormBuilder, FormGroup, FormArray
**Validators**: Built-in + custom async validators
**Integration**: Forms are the single source of truth for data

### 6. Service Injection with Dependency Injection
**Pattern**: Constructor-based DI across all services
**Ordering**: Critical services initialized in AppModule via APP_INITIALIZER
**Example**:
```typescript
constructor(
  private userService: UserService,
  private clusterService: ClusterService,
  private nodeDataService: NodeDataService
) { }
```

---

## 8. Component Organization Patterns

### Feature Module Structure
Each major feature follows this pattern:

```
feature/
├── component.ts - Main feature component
├── module.ts - Feature NgModule with declarations/providers
├── routing.ts - Feature-specific routes (lazy-loaded)
├── template.html - Main template
├── style.scss - Feature styles
└── sub-features/
    ├── component.ts
    ├── template.html
    └── style.scss
```

### Shared Component Structure
```
shared/components/component-name/
├── component.ts - Component class
├── template.html - Component template
├── style.scss - Component styles
├── component.spec.ts - Unit tests
└── sub-components/ (if applicable)
```

---

## 9. Material Design Integration

**Material Modules Used**:
- MatStepper - Wizard step UI
- MatDialog - Modals and dialogs
- MatTable - Data tables
- MatSelect, MatAutocomplete - Dropdowns
- MatCard, MatExpansion - Layout
- MatTabs - Tabbed interfaces
- MatChips - Tag inputs
- MatSlideToggle, MatCheckbox - Boolean inputs
- MatProgressSpinner, MatProgressBar - Loading indicators

**Configuration** (`shared/module.ts`):
- Default dialog options (660px width)
- Default form field appearance (outline)
- Paginator configuration

---

## 10. API Communication

### REST API Pattern

**Root Endpoint**: Environment-based (development, production)

**Key API Paths**:
```
/projects/{projectID}/clusters
/projects/{projectID}/clusters/{clusterID}
/projects/{projectID}/clusters/{clusterID}/providers/{provider}/sizes
/projects/{projectID}/clusters/{clusterID}/providers/{provider}/subnets
/projects/{projectID}/clusters/{clusterID}/machinedeployments
/projects/{projectID}/sshkeys
/projects/{projectID}/members
```

**HTTP Interceptors** (`core/interceptors/`):
1. **AuthInterceptor** - Adds auth tokens
2. **CheckTokenInterceptor** - Validates token freshness
3. **ErrorNotificationsInterceptor** - Shows error notifications
4. **LoaderInterceptor** - Shows/hides loading indicator

---

## 11. Dynamic/Enterprise Features

### Location: `dynamic/`

**Purpose**: Feature flagging for enterprise-specific functionality

**Structure**:
```
dynamic/
├── community/ - Open-source features
├── enterprise/ - Licensed features
│   ├── quotas/ - Resource quota management
│   ├── metering/ - Usage tracking
│   └── ...
├── module-registry.ts - Dynamic module loading
└── module.ts - Feature module selection
```

**Usage**: Components can conditionally include enterprise features via DynamicModule

---

## 12. Key Development Concepts

### Understanding NodeData Flow
1. **Creation**: User creates machine deployment in wizard step
2. **Configuration**: NodeDataComponent captures all settings
3. **Provider-Specific**: ProviderComponent adds cloud-specific config
4. **Submission**: Form submission sends NodeData to ClusterService
5. **Backend**: API converts to MachineDeployment CRD

### Understanding Wizard State
1. **Provider Change**: ClusterSpecService.provider updated
2. **Wizard Response**: WizardService updates visible steps
3. **Component Update**: Steps reflect conditional visibility
4. **Node Data Sync**: NodeDataService resets/updates available fields

### Understanding Cluster Creation
1. **Form Completion**: All wizard steps valid
2. **Form Submission**: Aggregates all form data
3. **Template Handling**: Applies template if provided
4. **API Call**: ClusterService.createCluster()
5. **Redirect**: Routes to cluster details on success

---

## 13. Key Files Quick Reference

| Purpose | Location |
|---------|----------|
| Root module setup | `app/module.ts` |
| Application routing | `app/routing.ts` |
| Cluster creation orchestration | `wizard/component.ts` |
| Wizard step registry | `wizard/config.ts` |
| Cluster configuration state | `core/services/cluster-spec.ts` |
| Node configuration state | `core/services/node-data/service.ts` |
| Wizard navigation | `core/services/wizard/wizard.ts` |
| All shared components | `shared/module.ts` |
| Node data component | `node-data/component.ts` |
| AWS-specific node config | `node-data/basic/provider/aws/component.ts` |
| NodeData model | `shared/model/NodeSpecChange.ts` |
| Provider constants | `shared/model/NodeProviderConstants.ts` |
| AWS provider API | `core/services/provider/aws.ts` |

---

## 14. Best Practices for Future Development

### When Adding New Features
1. Create feature module in `app/feature-name/`
2. Add routing in feature routing.ts (lazy-loaded)
3. Use SharedModule for common components
4. Implement service in `core/services/` for business logic
5. Inject via constructor, use typed services

### When Adding New Provider
1. Create `core/services/provider/provider-name.ts` for API calls
2. Create `node-data/basic/provider/provider-name/` for node configuration UI
3. Create `wizard/step/provider-settings/provider/provider-name/` for cluster setup
4. Add provider entity in `shared/entity/provider/provider-name.ts`
5. Add provider constant in `NodeProviderConstants`

### For Form Components
1. Extend `BaseFormValidator`
2. Implement `ControlValueAccessor` if reusable
3. Use Reactive Forms with FormBuilder
4. Add async validators for API validation
5. Export in SharedModule

### For Services
1. Mark as `@Injectable()`
2. Use dependency injection for other services
3. Expose Observables/Subjects for state changes
4. Keep services lean - delegate to HTTP for API calls
5. Use proper typing (avoid `any`)

---

## Summary

The Kubermatic web UI is a well-architected Angular application with:
- **Clear separation** of concerns (core, shared, features)
- **Service-based state management** without external state libraries
- **Provider-agnostic design** supporting 18+ cloud providers
- **Multi-step wizard** for complex cluster creation
- **Reactive forms** for data management
- **Lazy-loaded modules** for performance
- **Material Design** for consistent UI
- **Extensible architecture** for new providers and features

This architecture makes it easy for developers to understand the codebase structure and add new features while maintaining consistency with existing patterns.
