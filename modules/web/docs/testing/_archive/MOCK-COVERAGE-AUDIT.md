---
type: reference
title: Mock Service Coverage Audit
created: 2026-03-05
tags:
  - testing
  - mocks
  - architecture
related:
  - '[[MOCK-SERVICES-REFERENCE]]'
---

# Mock Service Coverage Audit

This document provides a comprehensive audit of mock service coverage in the Kubermatic Dashboard test suite. It identifies which services have mocks, which services need mocks created, and prioritizes new mock creation based on usage frequency in tests and components.

**Last Updated:** 2026-03-05
**Audit Scope:** Angular services in `src/app/core/services/` and related service directories

---

## Executive Summary

- **Total Core Services:** 87+ services
- **Existing Mocks:** 26 mock files
- **Services with Mocks:** 20+ services (documented below)
- **Services Without Mocks:** 60+ services
- **High-Priority Missing Mocks:** 12 services (based on usage in tests)

---

## Services WITH Existing Mocks (26 Total)

### By File Location: `src/test/services/`

| Service | Mock File | Status | Usage Count | Notes |
|---------|-----------|--------|-------------|-------|
| User | user-mock.ts | ✅ Complete | 35 | Frequently used, well-mocked |
| Project | project-mock.ts | ✅ Complete | 29 | Heavily used in project tests |
| Cluster | cluster-mock.ts | ✅ Complete | 27 | Core service, well-mocked |
| AppConfig | app-config-mock.ts | ✅ Complete | 31 | Essential initialization mock |
| Auth (OIDC) | auth-mock.ts | ✅ Complete | 17 | Authentication handling |
| Datacenter | datacenter-mock.ts | ✅ Complete | 13 | Provider configuration |
| Settings | settings-mock.ts | ✅ Complete | 18 | User settings mock |
| Addon | addon-mock.ts | ✅ Complete | N/A | Cluster add-ons |
| Application | application-mock.ts | ✅ Complete | N/A | Application management |
| ClusterServiceAccount | cluster-service-account-mock.ts | ✅ Complete | N/A | Service account operations |
| ClusterTemplate | cluster-template-mock.ts | ✅ Complete | N/A | Cluster templates |
| FeatureGates | feature-gate-mock.ts | ✅ Complete | 3 | Feature flag management |
| MachineDeployment | machine-deployment-mock.ts | ✅ Complete | 3 | Node pool management |
| Member | member-mock.ts | ✅ Complete | 3 | Project member management |
| Metering | metering-mock.ts | ✅ Complete | 5 | Usage metering (EE) |
| Node | node-mock.ts | ✅ Complete | 4 | Node operations |
| Notification | notification-mock.ts | ✅ Complete | 4 | Toast notifications |
| Preset | preset-mock.ts | ✅ Complete | N/A | Credential presets |
| Quota | quota-mock.ts | ✅ Complete | 3 | Resource quota management |
| QuotaCalculation | quota-calculation-mock.ts | ✅ Complete | N/A | Quota computation |
| ServiceAccount | service-account-mock.ts | ✅ Complete | 4 | Service account management |
| SSHKey | ssh-key-mock.ts | ✅ Complete | 4 | SSH key management |

### Angular Material Mocks

| Service | Mock File | Status | Usage Count |
|---------|-----------|--------|-------------|
| MatDialog | mat-dialog-mock.ts | ✅ Complete | 6 |
| MatDialogRef | mat-dialog-ref-mock.ts | ✅ Complete | 47 |

### Router/Navigation Stubs

| Service | Mock File | Status | Usage Count |
|---------|-----------|--------|-------------|
| ActivatedRoute | activate-route-mock.ts | ✅ Complete | N/A |
| Router | router-stubs.ts | ✅ Complete | N/A |

---

## Services WITHOUT Mocks - By Priority

### 🔴 CRITICAL PRIORITY (Used in 5+ tests/components)

These services are frequently used in tests or components and should be mocked first.

| Service | File Path | Usage Count | Used In | Rationale |
|---------|-----------|-------------|---------|-----------|
| **OPAService** | `core/services/opa.ts` | 10+ | Constraint/OPA features | Gatekeeper constraint management; heavily tested |
| **MLAService** | `core/services/mla.ts` | 5+ | Monitoring/alerting features | Multi-Level Auth alerting; multiple test files |
| **RBACService** | `core/services/rbac.ts` | 3+ | RBAC features | Role-based access control; tested in cluster RBAC |
| **HistoryService** | `core/services/history.ts` | 4+ | Navigation/settings | Browser history tracking; used in nav components |
| **NotificationService** | `core/services/notification.ts` | 4+ | Multiple components | Toast/snack bar notifications (ALREADY MOCKED) |

### 🟠 HIGH PRIORITY (Used in 2-4 tests/components)

Services used in multiple places but not as critical as above.

| Service | File Path | Usage | Rationale |
|---------|-----------|-------|-----------|
| **BackupService** | `core/services/backup.ts` | Cluster features | Backup/restore operations; EE feature |
| **KyvernoService** | `core/services/kyverno.ts` | Cluster details | Policy management; advanced feature |
| **ExternalClusterService** | `core/services/external-cluster.ts` | Cluster operations | External cluster integration |
| **OperatingSystemManagerService** | `core/services/operating-system-manager.ts` | Node settings | OS image management |
| **UserClusterConfigService** | `core/services/user-cluster-config.ts` | Cluster config | User kubeconfig retrieval |
| **AuthGuard** | `core/services/auth/guard.ts` | Auth guards | Route protection (used in routing) |
| **SSHKeyGuard** | `core/services/ssh-key/guard.ts` | Auth guards | SSH key validation |

### 🟡 MEDIUM PRIORITY (Used in 1-2 places)

Less frequently used but still important for comprehensive test coverage.

| Service | File Path | Rationale |
|---------|-----------|-----------|
| **BrandingService** | `core/services/branding.ts` | UI branding/theming |
| **ClusterBackupService** | `core/services/cluster-backup.ts` | Backup management |
| **DialogModeService** | `core/services/dialog-mode.ts` | Dialog state management |
| **EOLService** | `core/services/eol.ts` | End-of-life tracking |
| **ExternalMachineDeploymentService** | `core/services/external-machine-deployment.ts` | External cluster nodes |
| **KubeOneClusterSpecService** | `core/services/kubeone-cluster-spec.ts` | KubeOne cluster spec |
| **LabelService** | `core/services/label.ts` | Label management |
| **NameGeneratorService** | `core/services/name-generator.ts` | Name generation utility |
| **OperatingSystemManagerService** | `core/services/operating-system-manager.ts` | OS management |
| **PageTitleService** | `core/services/page-title.ts` | Dynamic page titles |
| **ParamsService** | `core/services/params.ts` | Route parameter handling |
| **PreviousRouteService** | `core/services/previous-route.ts` | Route history |
| **ThemeInformerService** | `core/services/theme-informer.ts` | Theme management |
| **TokenService** | `core/services/token.ts` | Token management |
| **WebsocketService** | `core/services/websocket.ts` | Real-time updates |

### 🔵 LOW PRIORITY (Specialized/Rarely Tested)

Provider-specific services, wizard services, and other specialized services that may be tested through integration tests rather than unit tests.

#### Provider Services
- **CloudProvider Services** (13 providers): `provider/aws.ts`, `provider/azure.ts`, `provider/gcp.ts`, etc.
  - These are provider-specific and likely tested per-provider
  - Consider creating generic provider mock framework instead of individual mocks

#### Node Data Provider Services
- **NodeDataProvider Services** (13 providers): `node-data/provider/aws.ts`, etc.
  - Provider-specific node metadata
  - May share mocking strategy with general provider mocks

#### Wizard Services
- **WizardService** | `core/services/wizard/wizard.ts` | Cluster creation workflow
- **WizardPresetsService** | `core/services/wizard/presets.ts` | Provider credential presets
- **KubeOneWizardService** | `core/services/kubeone-wizard/wizard.ts` | KubeOne wizard flow
- **KubeOnePresetsService** | `core/services/kubeone-wizard/kubeone-presets.ts` | KubeOne presets
- **ExternalClusterWizardService** | `core/services/external-cluster-wizard/external-cluster-wizard.ts` | External cluster import

---

## Detailed Service-by-Service Analysis

### Critical Priority Services Detailed

#### 1. OPAService
- **File:** `core/services/opa.ts`
- **Usage:** 10+ occurrences in tests
- **Used By:**
  - `cluster/details/cluster/constraints/`
  - `cluster/details/cluster/gatekeeper-config/`
  - `settings/admin/opa/`
- **Key Methods to Mock:**
  - `constraints()` - Get constraints
  - `constraintTemplates()` - Get constraint templates
  - `gatekeeperConfig()` - Get gatekeeper config
  - `createConstraint()`
  - `deleteConstraint()`
- **Mock Type:** Observable-based CRUD operations
- **Notes:** Currently uses inline mock objects in test files; should be centralized

#### 2. MLAService
- **File:** `core/services/mla.ts`
- **Usage:** 5+ occurrences
- **Used By:**
  - `cluster/details/cluster/mla/alertmanager-config/`
  - `cluster/details/cluster/mla/rule-groups/`
  - `settings/admin/rule-groups/`
- **Key Methods to Mock:**
  - `rulGroups()`
  - `alertmanagerConfig()`
  - `createRuleGroup()`
  - `updateRuleGroup()`
  - `deleteRuleGroup()`
- **Mock Type:** Observable-based CRUD
- **Notes:** Enterprise feature for monitoring/alerting

#### 3. RBACService
- **File:** `core/services/rbac.ts`
- **Usage:** 3+ occurrences
- **Used By:**
  - `cluster/details/cluster/rbac/`
- **Key Methods to Mock:**
  - `bindings()`
  - `roles()`
  - `createBinding()`
  - `deleteBinding()`
- **Mock Type:** Observable-based access control
- **Notes:** Role-based access control operations

#### 4. HistoryService
- **File:** `core/services/history.ts`
- **Usage:** 4+ occurrences
- **Used By:**
  - `settings/admin/nav/`
  - `settings/user/`
- **Key Methods to Mock:**
  - `back()` - Navigate back
  - `init()` - Initialize history tracking
  - `previousRoute` - Get previous route
- **Mock Type:** Navigation/state management
- **Notes:** Browser history stack tracking; used in settings navigation

### High Priority Services Detailed

#### BackupService
- **File:** `core/services/backup.ts`
- **Key Methods:** CRUD operations for cluster backups
- **Used By:** Cluster backup features (EE)
- **Priority:** Create before expanding cluster tests

#### KyvernoService
- **File:** `core/services/kyverno.ts`
- **Key Methods:** Policy CRUD operations
- **Used By:** Policy management (advanced feature)
- **Priority:** Needed for policy tests

#### ExternalClusterService
- **File:** `core/services/external-cluster.ts`
- **Key Methods:** External cluster CRUD
- **Used By:** External cluster integration features
- **Priority:** Important for multi-cluster support

#### OperatingSystemManagerService
- **File:** `core/services/operating-system-manager.ts`
- **Key Methods:** OS image operations
- **Used By:** Node/machine deployment features
- **Priority:** Needed for advanced node testing

#### UserClusterConfigService
- **File:** `core/services/user-cluster-config.ts`
- **Key Methods:** Kubeconfig retrieval
- **Used By:** Cluster access/kubeconfig features
- **Priority:** Important for user workflows

---

## Mock Implementation Recommendations

### 1. Centralize Inline Mocks

**Current Issue:** Some services like OPA, MLA, RBAC have inline mock objects in test files:
```typescript
const opaMock = {
  constraints$: of([]),
  constraintTemplates$: of([]),
  // ... inline definitions
};
```

**Recommendation:** Extract these to dedicated mock service files in `src/test/services/`:
- `opa-mock.ts`
- `mla-mock.ts`
- `rbac-mock.ts`

### 2. Follow Established Mock Pattern

Use the pattern from existing mocks (e.g., `AppConfigMockService`):
```typescript
@Injectable()
export class ServiceNameMockService {
  method1(): Observable<Type> { return of(mockValue); }
  method2(): Promise<Type> { return Promise.resolve(mockValue); }
}
```

### 3. Observable Caching Pattern

Many services use Observable caching with `shareReplay()`. Mocks should support:
```typescript
private _cache$ = new Map<string, Observable<T>>();

method(id: string): Observable<T> {
  if (!this._cache$.get(id)) {
    this._cache$.set(id, of(mockData).pipe(shareReplay(1)));
  }
  return this._cache$.get(id);
}
```

### 4. Provider Services Strategy

**Option 1 - Shared Mock Factory:**
Create a generic mock provider factory:
```typescript
// src/test/utils/provider-mock-factory.ts
export class ProviderMockFactory {
  static createMock(providerName: string): any {
    return {
      flavors(): Observable<Flavor[]> { return of([]); },
      zones(): Observable<Zone[]> { return of([]); },
      // ... common provider methods
    };
  }
}
```

**Option 2 - Individual Mocks:**
Create individual mocks per provider (better isolation, more files).

**Recommendation:** Start with Option 1 for quick coverage, then specialize as needed.

---

## Implementation Priority Roadmap

### Phase 1: Critical Gap Closure (Week 1)
Focus on the 5 critical priority services:
1. OPAService
2. MLAService
3. RBACService
4. HistoryService
5. (NotificationService - already exists)

**Estimated Effort:** 1-2 days
**Impact:** ~15-20% test improvement

### Phase 2: High Priority Services (Week 2)
Add mocks for 7 high-priority services:
1. BackupService
2. KyvernoService
3. ExternalClusterService
4. OperatingSystemManagerService
5. UserClusterConfigService
6. AuthGuard
7. SSHKeyGuard

**Estimated Effort:** 2-3 days
**Impact:** ~25-30% additional test improvement

### Phase 3: Medium Priority Services (Week 3)
Add mocks for 14 medium-priority services.

**Estimated Effort:** 3-4 days
**Impact:** ~30-40% additional test improvement

### Phase 4: Provider & Wizard Services (Week 4+)
Use shared mock factory for provider services; add wizard service mocks.

**Estimated Effort:** 5-7 days (depends on strategy)
**Impact:** ~20-25% additional test improvement

---

## Testing Requirements by Mock Type

### Observable-Based Mocks
- Must return Observables that complete
- Should support `shareReplay()` subscription pattern
- Need test coverage for empty, single, and multiple emissions

### CRUD Operation Mocks
- Should track call history (how many times called, with what args)
- Support both success and error scenarios
- Handle paginated responses

### Navigation/Guard Mocks
- Should handle both resolve and reject paths
- Support parametrized routing
- Track navigation history

### Real-time/WebSocket Mocks
- Should support subscription/unsubscription
- Handle connection state changes
- Support reconnection scenarios

---

## Testing the Test Utilities

All new mocks should have corresponding test files:
- `src/test/services/opa-mock.spec.ts`
- `src/test/services/mla-mock.spec.ts`
- etc.

Each mock test should verify:
1. Service instantiation
2. Methods return correct types
3. Observable emissions complete
4. Promise resolutions work
5. Error scenarios are handled

---

## Known Issues & Limitations

1. **No WindowRefService Mock:** The task mentions WindowRefService but this service may not exist or may use different name
2. **Inline Mocks in Tests:** Some mocks are defined inline in test files rather than being centralized
3. **Provider Mock Strategy Unclear:** 13+ provider services lack clear mocking strategy
4. **Wizard Services:** Complex state management makes mocking non-trivial

---

## Related Documents

- **MOCK-SERVICES-REFERENCE.md** - Detailed documentation of all mocks
- **ADVANCED-TESTING-PATTERNS.md** - Advanced testing techniques
- **Development.md** - General testing guidelines
- **CLAUDE.md** - Architecture and patterns overview

---

## Appendix: Complete Service Inventory

### All Core Services (87 total)

```
Core (36):
  addon, application, backup, branding, cluster, cluster-backup,
  cluster-service-account, cluster-templates, datacenter, dialog-mode,
  eol, external-cluster, external-machine-deployment, feature-gate,
  history, kyverno, label, machine-deployment, member, mla,
  name-generator, node, notification, opa, operating-system-manager,
  page-title, params, previous-route, project, rbac, service-account,
  settings, theme-informer, token, user, user-cluster-config, websocket

Auth (2):
  auth/guard, auth/service

SSH Key (2):
  ssh-key/guard, ssh-key/ssh-key

Wizard (2):
  wizard/wizard, wizard/presets

KubeOne Wizard (2):
  kubeone-wizard/wizard, kubeone-wizard/kubeone-presets

External Cluster Wizard (1):
  external-cluster-wizard/external-cluster-wizard

Providers (13):
  provider/alibaba, provider/anexia, provider/aws, provider/azure,
  provider/baremetal, provider/digitalocean, provider/gcp, provider/hetzner,
  provider/kubevirt, provider/nutanix, provider/openstack,
  provider/vmware-cloud-director, provider/vsphere

Node Data Providers (13):
  node-data/provider/alibaba, node-data/provider/anexia,
  node-data/provider/aws, node-data/provider/azure,
  node-data/provider/baremetal, node-data/provider/digitalocean,
  node-data/provider/gcp, node-data/provider/hetzner,
  node-data/provider/kubevirt, node-data/provider/nutanix,
  node-data/provider/openstack, node-data/provider/vmware-cloud-director,
  node-data/provider/vsphere

Wizard Providers (13):
  wizard/provider/alibaba, wizard/provider/anexia, wizard/provider/aws,
  wizard/provider/azure, wizard/provider/digitalocean,
  wizard/provider/gcp, wizard/provider/hetzner, wizard/provider/kubevirt,
  wizard/provider/nutanix, wizard/provider/openstack,
  wizard/provider/provider, wizard/provider/vmware-cloud-director,
  wizard/provider/vsphere
```

---

**Document Metadata:**
- **Format:** Markdown with YAML front matter
- **Target Audience:** Frontend developers, QA engineers, test leads
- **Review Cycle:** Quarterly (or as Phase 02 implementation progresses)
- **Version:** 1.0 (Initial audit)
