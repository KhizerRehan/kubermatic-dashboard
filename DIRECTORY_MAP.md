# Kubermatic Web UI - Complete Directory Map

## Full Application Structure

```
modules/web/src/app/
│
├── 📦 Core Module Services & Components
├── core/
│   ├── components/
│   │   ├── footer/
│   │   ├── help-panel/
│   │   ├── navigation/          # Main navigation bar
│   │   ├── notification-panel/  # Error/success notifications
│   │   ├── sidenav/            # Sidebar navigation
│   │   └── user-panel/         # User menu
│   │
│   ├── interceptors/
│   │   ├── auth.ts              # JWT token injection
│   │   ├── check-token.ts       # Token validation
│   │   ├── error-notifications.ts
│   │   └── loader.ts            # Loading indicator
│   │
│   ├── services/
│   │   ├── 📌 CORE STATE MANAGEMENT
│   │   ├── cluster.ts           # Cluster CRUD operations
│   │   ├── cluster-spec.ts      # Cluster config state (KEY)
│   │   ├── node-data/
│   │   │   ├── service.ts       # Node data state (KEY)
│   │   │   └── provider/        # Provider-specific node handlers
│   │   │       ├── alibaba.ts
│   │   │       ├── aws.ts
│   │   │       ├── azure.ts
│   │   │       ├── baremetal.ts
│   │   │       ├── gcp.ts
│   │   │       ├── kubevirt.ts
│   │   │       ├── openstack.ts
│   │   │       ├── vsphere.ts
│   │   │       └── ... (15 total)
│   │   │
│   │   ├── 📌 WIZARD & NAVIGATION
│   │   ├── wizard/
│   │   │   ├── wizard.ts        # Step visibility & navigation
│   │   │   ├── presets.ts       # Provider credential presets
│   │   │   └── provider/        # Provider wizard steps
│   │   │       ├── alibaba/
│   │   │       ├── aws/
│   │   │       ├── azure/
│   │   │       ├── gcp/
│   │   │       ├── openstack/
│   │   │       └── ... (15 total)
│   │   │
│   │   ├── 📌 CLUSTER MANAGEMENT
│   │   ├── cluster-templates.ts
│   │   ├── cluster-backup.ts
│   │   ├── machine-deployment.ts
│   │   │
│   │   ├── 📌 PROVIDER API SERVICES
│   │   ├── provider/
│   │   │   ├── aws.ts
│   │   │   ├── azure.ts
│   │   │   ├── gcp.ts
│   │   │   ├── openstack.ts
│   │   │   ├── vsphere.ts
│   │   │   ├── alibaba.ts
│   │   │   ├── anexia.ts
│   │   │   ├── digitalocean.ts
│   │   │   ├── hetzner.ts
│   │   │   ├── kubevirt.ts
│   │   │   ├── nutanix.ts
│   │   │   ├── vmware-cloud-director.ts
│   │   │   └── baremetal.ts
│   │   │
│   │   ├── 📌 CONFIGURATION & METADATA
│   │   ├── datacenter.ts        # Datacenter info & selection
│   │   ├── settings.ts          # Global app settings
│   │   ├── feature-gate.ts      # Feature flags
│   │   │
│   │   ├── 📌 USER & AUTHORIZATION
│   │   ├── user.ts
│   │   ├── auth/
│   │   │   ├── service.ts
│   │   │   └── guard.ts
│   │   ├── rbac.ts
│   │   │
│   │   ├── 📌 OTHER SERVICES
│   │   ├── addon.ts
│   │   ├── application.ts
│   │   ├── backup.ts
│   │   ├── kyverno.ts
│   │   ├── mla.ts
│   │   ├── opa.ts
│   │   ├── label.ts
│   │   ├── name-generator.ts    # Intelligent cluster naming
│   │   └── ... (41 total)
│   │
│   └── module.ts                # CoreModule definition
│
│
├── 📦 Shared Module - Reusable Components & Utils
├── shared/
│   ├── components/              # 57+ Reusable Components
│   │   ├── form-related/
│   │   │   ├── label-form/
│   │   │   ├── annotation-form/
│   │   │   ├── taint-form/
│   │   │   ├── chip-autocomplete/
│   │   │   ├── cidr-form/
│   │   │   └── machine-flavor-filter/
│   │   │
│   │   ├── machine-type-selector/  # ACTIVELY DEVELOPED - New UI
│   │   │   ├── component.ts
│   │   │   ├── template.html
│   │   │   └── style.scss
│   │   │
│   │   ├── dialogs/
│   │   │   ├── add-project-dialog/
│   │   │   ├── add-ssh-key-dialog/
│   │   │   ├── confirmation-dialog/
│   │   │   ├── add-external-cluster-dialog/
│   │   │   └── announcements-dialog/
│   │   │
│   │   ├── cluster-related/
│   │   │   ├── cluster-summary/
│   │   │   ├── cluster-from-template/
│   │   │   ├── external-cluster-credentials/
│   │   │   └── external-cluster-data-dialog/
│   │   │
│   │   ├── provider-specific/
│   │   │   ├── openstack-credentials/
│   │   │   └── external-cluster-credentials/
│   │   │
│   │   ├── utility-components/
│   │   │   ├── event-list/
│   │   │   ├── addon-list/
│   │   │   ├── application-list/
│   │   │   ├── terminal/
│   │   │   ├── loader/
│   │   │   ├── property/
│   │   │   └── ... (20+ total)
│   │   │
│   │   └── module.ts            # Shared module exports all
│   │
│   ├── entity/                  # TypeScript Entity Types
│   │   ├── cluster.ts           # Cluster, CloudSpec, ClusterSpec
│   │   ├── node.ts              # NodeSpec, NodeCloudSpec
│   │   ├── project.ts
│   │   ├── machine-deployment.ts
│   │   ├── ssh-key.ts
│   │   ├── settings.ts
│   │   ├── provider/            # Provider-specific types
│   │   │   ├── aws.ts
│   │   │   ├── azure.ts
│   │   │   ├── gcp.ts
│   │   │   ├── openstack.ts
│   │   │   └── ... (16 total)
│   │   └── ... (30+ entity files)
│   │
│   ├── model/
│   │   ├── NodeSpecChange.ts    # NodeData class (CRITICAL)
│   │   ├── NodeProviderConstants.ts  # Provider enum & utilities
│   │   ├── Config.ts
│   │   └── Terminal.ts
│   │
│   ├── validators/
│   │   ├── base-form.validator.ts    # Base class for all validators
│   │   ├── async.validators.ts       # Async validation rules
│   │   └── others.ts                 # Regex validators (CIDR, IP, etc.)
│   │
│   ├── utils/
│   │   └── common.ts            # Shared utility functions
│   │
│   ├── directives/
│   │   ├── autofocus/
│   │   ├── input-password/
│   │   ├── throttle-click/
│   │   └── value-changed-indicator/
│   │
│   ├── pipes/
│   │   ├── relativetime.ts
│   │   ├── linklocation.ts
│   │   └── size.ts
│   │
│   ├── animations/
│   │   └── ... animation utilities
│   │
│   ├── constants/
│   │   └── ... shared constants
│   │
│   ├── types/
│   │   └── ... shared TypeScript types
│   │
│   └── module.ts                # SharedModule
│
│
├── 📦 Cluster Creation Wizard
├── wizard/                      # MAIN WIZARD FEATURE
│   ├── component.ts             # Main wizard orchestrator (~14KB)
│   ├── template.html
│   ├── style.scss
│   ├── module.ts
│   ├── routing.ts
│   │
│   ├── config.ts                # Step registry & configuration
│   │   └── Steps: Provider, Cluster, Settings, Nodes, Network, Apps, Summary
│   │
│   ├── types/
│   │   └── wizard-mode.ts
│   │
│   └── step/                    # Wizard Step Components
│       ├── base.ts              # Base step class
│       ├── provider-datacenter/
│       │   ├── component.ts
│       │   └── template.html
│       ├── cluster/
│       │   ├── component.ts
│       │   ├── ssh-keys/
│       │   └── ...
│       ├── provider-settings/
│       │   ├── component.ts
│       │   ├── preset/
│       │   └── provider/         # Provider-specific settings
│       │       ├── basic/
│       │       │   ├── component.ts
│       │       │   ├── aws/
│       │       │   ├── azure/
│       │       │   ├── openstack/
│       │       │   └── ...
│       │       └── extended/     # Extended settings per provider
│       ├── node-settings/
│       │   ├── component.ts
│       │   └── template.html
│       ├── network/
│       │   ├── component.ts
│       │   └── template.html
│       ├── applications/
│       │   ├── component.ts
│       │   └── template.html
│       └── summary/
│           ├── component.ts
│           └── template.html
│
│
├── 📦 Node Data Configuration
├── node-data/                   # NODE CONFIGURATION FEATURE
│   ├── component.ts             # Main node data component (~30KB)
│   ├── template.html
│   ├── style.scss
│   ├── module.ts
│   ├── config.ts
│   │
│   ├── basic/
│   │   ├── component.ts
│   │   └── provider/            # Provider-specific node UI
│   │       ├── aws/
│   │       │   ├── component.ts
│   │       │   └── template.html
│   │       ├── azure/
│   │       ├── gcp/
│   │       ├── openstack/
│   │       ├── vsphere/
│   │       ├── alibaba/
│   │       ├── anexia/
│   │       ├── digitalocean/
│   │       ├── hetzner/
│   │       ├── kubevirt/
│   │       ├── nutanix/
│   │       ├── vmware-cloud-director/
│   │       ├── baremetal/
│   │       ├── edge/
│   │       └── ... (18 total)
│   │
│   ├── extended/
│   │   └── provider/            # Extended settings per provider
│   │       ├── aws/
│   │       ├── gcp/
│   │       └── ...
│   │
│   ├── kubelet-version/
│   │   └── ... kubelet version selection
│   │
│   └── dialog/
│       └── ... node data dialogs
│
│
├── 📦 Other Feature Modules
├── cluster/
│   ├── module.ts
│   ├── routing.ts
│   ├── list/
│   │   └── Cluster list view
│   └── details/
│       └── Cluster detail view
│
├── project/
│   ├── module.ts
│   ├── edit-project/
│   └── delete-project/
│
├── project-overview/
│   ├── clusters-overview/
│   ├── members-overview/
│   ├── providers-overview/
│   └── create-resource-panel/
│
├── member/
│   ├── add-member/
│   └── edit-member/
│
├── serviceaccount/
│   ├── create-dialog/
│   ├── edit-dialog/
│   └── token/
│
├── sshkey/
│   └── SSH key management
│
├── settings/
│   ├── admin/
│   │   └── Admin configuration
│   └── user/
│       └── User preferences
│
├── external-cluster-wizard/
│   ├── module.ts
│   ├── steps/
│   │   ├── provider-selection/
│   │   ├── credentials/
│   │   └── ...
│   └── ... external cluster setup
│
├── kubeone-wizard/
│   ├── module.ts
│   ├── steps/
│   │   └── KubeOne provisioning steps
│   └── ... KubeOne setup
│
├── cluster-template/
│   └── Cluster template management
│
├── backup/
│   ├── list/
│   └── details/
│
├── dynamic/
│   ├── community/               # Open-source features
│   ├── enterprise/
│   │   ├── quotas/              # Resource quota management
│   │   ├── metering/            # Usage tracking
│   │   └── ...
│   ├── module-registry.ts       # Dynamic module loading
│   └── module.ts
│
├── pages/
│   ├── frontpage/
│   ├── api-docs/
│   ├── terms-of-service/
│   └── page-not-found/
│
├── dashboard/
│   ├── component.ts
│   └── Main application dashboard
│
├── machine-networks/
│   └── Machine network configuration
│
│
├── 📌 ROOT APP FILES
├── component.ts                 # Root app component
├── component.spec.ts
├── module.ts                    # App module
├── config.ts                    # App configuration
├── app-config.ts               # Config service
├── config.service.ts
├── routing.ts                  # App routing
├── template.html
├── style.scss
├── google-analytics.service.ts
├── index.ts
├── json-typings.d.ts
│
└── 📌 OTHER FILES
    └── ... additional app files
```

## File Organization Patterns

### 1. Feature Module Pattern
```
feature-name/
├── component.ts          # Main component class
├── template.html        # Component template
├── style.scss          # Component styles
├── module.ts           # NgModule declaration
├── routing.ts          # Feature routes (optional)
├── service.ts          # Feature service (optional)
└── sub-feature/
    ├── component.ts
    ├── template.html
    └── style.scss
```

### 2. Service Pattern
```
services/
├── feature.ts           # Main service
├── feature.spec.ts     # Unit tests
└── provider/           # Provider-specific services
    ├── provider1.ts
    ├── provider2.ts
    └── ...
```

### 3. Shared Component Pattern
```
shared/components/
├── component-name/
│   ├── component.ts           # Component class
│   ├── template.html          # Template
│   ├── style.scss            # Styles
│   ├── component.spec.ts      # Tests
│   └── sub-component/         # Nested components (optional)
```

## Key Statistics

- **Total Services**: ~41 in core/services/
- **Shared Components**: 57+
- **Provider Support**: 18+ cloud providers
- **Entity Types**: 30+ entity definitions
- **Wizard Steps**: 7 main steps
- **Lazy-Loaded Modules**: All feature modules
- **Material Modules**: 25+ used

## Navigation Graph

```
App Module (root)
├── CoreModule (eager)
│   ├── 41 Services
│   ├── Navigation Components
│   └── Interceptors
│
├── SharedModule (eager)
│   ├── 57+ Components
│   ├── Directives & Pipes
│   └── All Material Modules
│
└── Feature Modules (lazy)
    ├── WizardModule → wizard/
    ├── ClusterModule → cluster/
    ├── ProjectModule → project/
    ├── SettingsModule → settings/
    └── ... other features
```

## Critical Paths for Development

1. **Adding New Provider**:
   - `core/services/provider/provider-name.ts`
   - `node-data/basic/provider/provider-name/`
   - `shared/entity/provider/provider-name.ts`
   - `shared/model/NodeProviderConstants.ts`

2. **Modifying Wizard**:
   - `wizard/config.ts` (step visibility)
   - `wizard/step/*/component.ts` (step implementation)
   - `core/services/wizard/wizard.ts` (navigation)

3. **Node Configuration**:
   - `node-data/component.ts` (main)
   - `node-data/basic/provider/*/component.ts` (provider-specific)
   - `core/services/node-data/service.ts` (state)

