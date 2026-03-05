---
type: reference
title: Phase 04 Cluster Component Testing Strategy
created: 2025-03-05
tags:
  - testing
  - cluster-components
  - phase-04
related:
  - '[[Phase-04-Feature-Components-Testing]]'
---

# Phase 04: Cluster Component Testing Strategy

**Document Purpose:** Detailed analysis and implementation strategy for testing remaining cluster management components in the Kubermatic Dashboard.

## Overview

Total cluster components needing test coverage: **23 components**
- ✅ **Completed (3 components):** 69 tests
- ⏳ **Remaining (20 components):** Strategy documented below

## Completed Components (HIGH Priority, LOW Complexity)

### 1. machine-networks-display (18 tests)
**Path:** `modules/web/src/app/cluster/details/cluster/machine-networks-display/component.spec.ts`

**Status:** ✅ COMPLETE

**Test Coverage:**
- Component creation and initialization
- Input binding (@Input: cluster, projectID, isClusterRunning)
- DataSource management and updates
- DNS server string formatting (single, multiple, empty arrays)
- Dialog opening for adding networks
- Edge cases and error handling

### 2. copy-joining-script-button (18 tests)
**Path:** `modules/web/src/app/cluster/details/cluster/machine-deployment-details/copy-joining-script-button/component.spec.ts`

**Status:** ✅ COMPLETE

**Test Coverage:**
- Component creation and input binding
- Service integration (MachineDeploymentService, ClipboardService)
- Base64 decoding and clipboard operations
- Loading state management
- "Copied" state with timeout (2 seconds)
- Error handling for invalid base64
- Large payload and special character handling

### 3. external-machine-deployment-list (33 tests)
**Path:** `modules/web/src/app/cluster/details/external-cluster/external-machine-deployment-list/component.spec.ts`

**Status:** ✅ COMPLETE

**Test Coverage:**
- Component initialization and input/output bindings
- DataSource updates on input changes (ngOnChanges)
- Machine deployment navigation
- Permission checks (edit, delete, add enabled)
- Dialog operations (update, delete, add)
- Pagination setup and state checks
- AKS-specific column filtering
- Operating system handling
- Proper unsubscription lifecycle

---

## Remaining Components (Priority Order)

### PRIORITY 1: HIGH Impact, MEDIUM Effort (5 components)

#### 1. external-machine-deployment-details
**Path:** `modules/web/src/app/cluster/details/external-cluster/external-machine-deployment-details/component.ts`

**Status:** ⏳ NOT TESTED

**Test Strategy:**
- **Component Type:** Route-driven (gets params from ActivatedRoute)
- **Inputs:** None (@Input properties)
- **Route Params:** projectID, clusterID, machineDeploymentID
- **Key Services:**
  - ClusterService (externalMachineDeployment, externalMachineDeploymentNodes, etc.)
  - ExternalMachineDeploymentService
  - UserService, AppConfigService, Router, MatDialog
- **Complex Logic:**
  - forkJoin for parallel data loading
  - Timer-based auto-refresh
  - Multiple loading state flags
  - Health status calculation
- **Test Coverage (15+ tests):**
  1. Route parameter extraction
  2. forkJoin subscription and data combination
  3. Timer initialization and auto-refresh
  4. Permission methods (isEditEnabled, isDeleteEnabled)
  5. Dialog operations (update, delete, restart)
  6. Health status calculation from combined data
  7. Navigation on delete
  8. Metrics storage in map
  9. Error handling in forkJoin
  10. Loading state transitions

**Reference:** Use existing test patterns from `cluster/details/cluster/component.spec.ts`

---

#### 2. add-service-account-binding-dialog
**Path:** `modules/web/src/app/cluster/details/cluster/rbac/add-service-account-binding-dialog/component.ts`

**Status:** ⏳ NOT TESTED

**Test Strategy:**
- **Component Type:** Dialog component (@Input: cluster, projectID, clusterServiceAccount?)
- **Key Services:**
  - FormBuilder (Reactive Forms)
  - RBACService (getClusterRoleNames, getNamespaceRoleNames)
  - ClusterServiceAccountService (get, bindServiceAccountToCluster, bindServiceAccountToNamespace)
  - NotificationService, MatDialogRef
- **Form Controls:** serviceAccountID, roleID, roleNamespace (conditional)
- **Complex Logic:**
  - Binding mode switching (Cluster vs Namespace)
  - Dynamic form control add/remove based on mode
  - Dependent dropdowns (roles depend on namespace selection)
  - Three loading states (ServiceAccounts, Roles, Namespaces)
  - Service call selection based on binding mode
- **Test Coverage (20+ tests):**
  1. Form initialization with/without existing serviceAccount
  2. Binding mode switching and form control updates
  3. Service account loading with state transitions
  4. Cluster role loading and sorting
  5. Namespace role loading with mapping
  6. Form validation (required fields)
  7. getObservable() returns correct observable for each mode
  8. Dialog close with proper notification
  9. Error handling in service calls
  10. Role update on binding mode change

**References:**
- Existing tests: wizard step components for form patterns
- Test utilities: FormBuilderHelper for form testing
- Mock services: RBACMockService (may need creation)

---

#### 3. rbac/component (main RBAC display)
**Path:** `modules/web/src/app/cluster/details/cluster/rbac/component.ts`

**Status:** ⏳ NOT TESTED

**Test Strategy:**
- **Component Type:** Container component with tab navigation
- **Inputs:** cluster, projectID
- **Key Services:** RBACService, ClusterServiceAccountService, UserService
- **Conditional Tabs:**
  - Users/Groups (ClusterRole bindings)
  - Service Accounts
  - (Optional: Kyverno Policies if enterprise)
- **Test Coverage (12+ tests):**
  1. Component initialization
  2. Tab navigation
  3. Permission-based tab visibility
  4. Data loading for users/groups tab
  5. Data loading for service accounts tab
  6. Error handling in service calls
  7. Nested component communication

**Reference:** Dialog components in same directory

---

#### 4. rbac/users-or-groups
**Path:** `modules/web/src/app/cluster/details/cluster/rbac/users-or-groups/component.ts`

**Status:** ⏳ NOT TESTED

**Test Strategy:**
- **Component Type:** Data display component (no form)
- **Inputs:** clusterRoles[], namespaceRoles[], bindings[]
- **Key Methods:**
  - Role type detection (cluster vs namespace)
  - Binding filtering by role type
- **Test Coverage (8+ tests):**
  1. Component creation with inputs
  2. Role type classification
  3. Binding display and filtering
  4. Empty state handling
  5. Multiple binding display

**Reference:** Similar to service-account component

---

#### 5. rbac/service-account/component
**Path:** `modules/web/src/app/cluster/details/cluster/rbac/service-account/component.ts`

**Status:** ⏳ NOT TESTED

**Test Strategy:**
- **Component Type:** Service account list container
- **Inputs:** cluster, projectID
- **Key Methods:**
  - Service account list loading
  - Service account selection
  - Add/edit/delete operations via dialogs
- **Test Coverage (12+ tests):**
  1. Service account loading
  2. List rendering
  3. Dialog operations
  4. Permission-based button visibility
  5. Error handling

**Reference:** machine-deployment-list pattern

---

### PRIORITY 2: MEDIUM Impact, MEDIUM Effort (8 components)

#### 6. external-cluster-delete-confirmation
**Path:** `modules/web/src/app/cluster/details/external-cluster/external-cluster-delete-confirmation/component.ts`

**Status:** ⏳ NOT TESTED

**Test Strategy:**
- **Component Type:** Confirmation dialog
- **Test Coverage (6+ tests):**
  1. Dialog display
  2. Cluster name display
  3. Confirmation button
  4. Cancellation
  5. Delete confirmation event

**Estimated Effort:** LOW

---

#### 7. external-node-list
**Path:** `modules/web/src/app/cluster/details/external-cluster/external-node-list/component.ts`

**Status:** ⏳ NOT TESTED

**Test Strategy:**
- **Component Type:** Node table component
- **Inputs:** cluster, nodes[], projectID
- **Key Methods:**
  - Node list rendering with sorting/pagination
  - Health status calculation
  - OS display
- **Test Coverage (15+ tests):**
  - Similar patterns to node-list component (which already has tests)
  - Adapt for external cluster variant

**Reference:** See cluster/details/cluster/node-list/component.spec.ts for patterns

---

#### 8. external-machine-deployment-list dialog (add/update)
**Paths:**
- `external-cluster/external-cluster-add-machine-deployment/component.ts`
- `external-cluster/update-external-cluster-machine-deployment-dialog/component.ts`

**Status:** ⏳ NOT TESTED

**Test Strategy:**
- **Component Type:** Dialog form components
- **Test Coverage (10+ tests each):**
  1. Form initialization
  2. Form validation
  3. Service integration
  4. Dialog close/success
  5. Error handling

---

#### 9-11. KubeOne variants
**Paths:**
- `kubeone/machine-deployment-list/component.ts`
- `kubeone/machine-deployment-details/component.ts`
- `kubeone/machine-deployment-dialog/component.ts`

**Status:** ⏳ NOT TESTED

**Test Strategy:**
- **Similar to:** External cluster variants but for KubeOne
- **Test Coverage:** 12-15 tests per component
- **Key Difference:** KubeOne-specific service calls and data models

---

#### 12. kubeone/list
**Path:** `cluster/list/kubeone/component.ts`

**Status:** ⏳ NOT TESTED

**Test Strategy:**
- **Component Type:** KubeOne cluster list
- **Test Coverage (12+ tests):**
  - Similar to cluster/list/component (which already has tests)
  - Adapt for KubeOne variant

---

### PRIORITY 3: SPECIALIZED/INFRASTRUCTURE (7 components)

#### 13. cni-version
**Path:** `cluster/details/cluster/cni-version/component.ts`

**Status:** ⏳ NOT TESTED

**Test Coverage (10+ tests):**
- Version comparison logic
- Upgrade availability detection
- Dialog opening
- Version change handling

---

#### 14. cni-version-dialog
**Path:** `cluster/details/cluster/cni-version/cni-version-dialog/component.ts`

**Status:** ⏳ NOT TESTED

**Test Coverage (8+ tests):**
- Form for CNI version selection
- Service integration
- Validation

---

#### 15. rbac/service-account-detail
**Path:** `cluster/details/cluster/rbac/service-account/service-account-detail/component.ts`

**Status:** ⏳ NOT TESTED

**Test Coverage (8+ tests):**
- Service account details display
- Nested display component

---

#### 16. rbac/add-service-account-dialog
**Path:** `cluster/details/cluster/rbac/add-service-account-dialog/component.ts`

**Status:** ⏳ NOT TESTED

**Test Coverage (10+ tests):**
- Form for service account creation
- Email validation
- Service integration

---

#### 17. overlay-terminal
**Path:** `cluster/details/cluster/overlay-terminal/component.ts`

**Status:** ⏳ NOT TESTED

**Test Coverage (4+ tests):**
- Terminal overlay display
- Close handler
- TRIVIAL component

---

#### 18. web-terminal
**Path:** `cluster/details/cluster/web-terminal/component.ts`

**Status:** ⏳ NOT TESTED

**Test Coverage (8+ tests):**
- Terminal display
- Service integration
- Connection management

---

#### 19. revoke-token
**Path:** `cluster/details/cluster/revoke-token/component.ts`

**Status:** ⏳ NOT TESTED

**Test Coverage (8+ tests):**
- Dialog for token revocation
- Service integration
- Confirmation

---

#### 20. baremetal-provider-settings
**Path:** `cluster/details/cluster/edit-provider-settings/baremetal-provider-settings/component.ts`

**Status:** ⏳ NOT TESTED

**Test Coverage (10+ tests):**
- Provider settings form
- Baremetal-specific validation
- Service integration

---

## Implementation Guidelines

### Test File Location & Naming
```
component.ts  → component.spec.ts (in same directory)
```

### Standard Test Structure
```typescript
describe('ComponentNameComponent', () => {
  let fixture: ComponentFixture<ComponentNameComponent>;
  let component: ComponentNameComponent;

  beforeEach(waitForAsync(() => {
    // TestBed configuration with mocks
  }));

  beforeEach(() => {
    // Component creation and injection
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // Feature tests...
});
```

### Mock Service Pattern
Use existing mock services from `/modules/web/src/test/services/`:
- `AppConfigMockService`
- `AuthMockService`
- `ClusterMockService`
- `ProjectMockService`
- `UserMockService`
- `SettingsMockService`
- `DatacenterMockService`
- `MatDialogMock`
- `NotificationMockService`
- `ExternalClusterMockService`

Create new mocks as needed:
- `RBACMockService`
- `ClusterServiceAccountMockService`
- `ExternalMachineDeploymentMockService`

### Test Data Factories
Use existing factories from `/modules/web/src/test/data/`:
- `fakeAWSCluster()`, `fakeDigitaloceanCluster()`, etc.
- `fakeCustomExternalCluster()`
- `fakeHealth()`, `fakeNode()`, etc.

Create new factories as needed for external clusters and RBAC entities.

### Testing Async Operations
Use `fakeAsync()` and `tick()` for:
- Timeout-based state changes
- Observable subscriptions
- Timer-based auto-refresh

Use `waitForAsync()` for general async test setup.

## Projected Test Count

### Completed
- machine-networks-display: 18
- copy-joining-script-button: 18
- external-machine-deployment-list: 33
- **Subtotal: 69 tests**

### Priority 1 (TARGET: 75+ tests)
- external-machine-deployment-details: 15
- add-service-account-binding-dialog: 20
- rbac/component: 12
- rbac/users-or-groups: 8
- rbac/service-account: 12
- **Subtotal: 67 tests**

### Priority 2 (TARGET: 50+ tests)
- external-cluster-delete-confirmation: 6
- external-node-list: 15
- External machine deployment dialogs (2×10): 20
- KubeOne variants (3×13): 39
- kubeone-list: 12
- **Subtotal: 92 tests**

### Priority 3 (TARGET: 35+ tests)
- cni-version: 10
- cni-version-dialog: 8
- rbac/service-account-detail: 8
- rbac/add-service-account-dialog: 10
- overlay-terminal: 4
- web-terminal: 8
- revoke-token: 8
- baremetal-provider-settings: 10
- **Subtotal: 66 tests**

### **Grand Total Potential: 294 tests for complete cluster component coverage**

## Next Steps (Recommended Order)

1. **Iteration 1 (Current):** ✅ Complete - 69 tests for HIGH priority, LOW complexity components
2. **Iteration 2 (Recommended):** PRIORITY 1 - Add 67 tests for complex dialog and RBAC components
3. **Iteration 3:** PRIORITY 2 - Add 92 tests for external cluster and KubeOne variants
4. **Iteration 4:** PRIORITY 3 - Add 66 tests for specialized and infrastructure components

## Success Criteria

- ✅ All tests follow Apache 2.0 license header format
- ✅ All tests use established mock service patterns
- ✅ All tests use established test data factories
- ✅ All tests cover happy path, error cases, and edge cases
- ✅ All tests pass in CI environment
- ✅ Test count matches or exceeds target for each priority level
- ✅ Code coverage for tested components > 85%

## References

- **CLAUDE.md:** Project architecture and patterns
- **Existing Tests:** See `cluster/list/component.spec.ts` and wizard step tests
- **Testing Utilities:** `modules/web/src/test/utils/`
- **Mock Services:** `modules/web/src/test/services/`
- **Test Data:** `modules/web/src/test/data/`
