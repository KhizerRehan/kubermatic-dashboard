# PRD: Cluster Module

**Route:** `projects/:projectID/clusters`, `projects/:projectID/externalclusters`, `projects/:projectID/kubeoneclusters`
**Location:** `src/app/cluster/`
**Priority:** P0

## Overview

The cluster module is the largest feature module, handling KKP clusters, external clusters, and KubeOne clusters. It includes list views, detail views, and extensive provider-specific settings editors.

## Components (63 total)

### List Views

| Component | Spec? | Key Behaviors |
|---|---|---|
| list/ (root component) | YES | Tab container for cluster types |
| list/cluster/ | YES + error-scenarios | Main cluster table: status, name, provider, version, region, machines, created, actions. Sort/paginate. Delete dialog. Create-from-template. |
| list/external-cluster/ | YES | External cluster table |
| **list/kubeone/** | **NO** | KubeOne cluster table |

### Cluster Detail Views

| Component | Spec? | Key Behaviors |
|---|---|---|
| details/cluster/ | YES + edge-case | Cluster detail page: info panel, MD list, node list, events, rbac, mla, constraints |
| details/cluster/add-machine-network/ | YES | Add machine network dialog |
| details/cluster/cluster-delete-confirmation/ | YES | Cluster deletion confirmation dialog |
| details/cluster/edit-cluster/ | YES | Edit cluster name/labels/settings |
| details/cluster/edit-sshkeys/ | YES | Edit SSH keys assigned to cluster |
| details/cluster/share-kubeconfig/ | YES | Share kubeconfig dialog |
| details/cluster/machine-deployment-details/ | YES | Machine deployment detail view |
| details/cluster/machine-deployment-details/copy-joining-script-button/ | YES | Copy join command button |
| details/cluster/machine-deployment-list/ | YES | Machine deployment table |
| details/cluster/machine-networks-display/ | YES | Machine network display |
| details/cluster/node-list/ | YES | Node table |
| **details/cluster/cni-version/** | **NO** | CNI version display |
| **details/cluster/cni-version/cni-version-dialog/** | **NO** | CNI version change dialog |
| **details/cluster/overlay-terminal/** | **NO** | Terminal overlay |
| **details/cluster/revoke-token/** | **NO** | Token revocation dialog |
| **details/cluster/web-terminal/** | **NO** | Web terminal component |

### Provider Settings Editors

| Component | Spec? |
|---|---|
| details/cluster/edit-provider-settings/ (root) | YES |
| edit-provider-settings/alibaba | YES |
| edit-provider-settings/anexia | YES |
| edit-provider-settings/aws | YES |
| edit-provider-settings/azure | YES |
| edit-provider-settings/digitalocean | YES |
| edit-provider-settings/gcp | YES |
| edit-provider-settings/hetzner | YES |
| edit-provider-settings/kubevirt | YES |
| edit-provider-settings/nutanix | YES |
| edit-provider-settings/openstack | YES |
| edit-provider-settings/vmware-cloud-director | YES |
| edit-provider-settings/vsphere | YES |
| **edit-provider-settings/baremetal** | **NO** |

### RBAC Components

| Component | Spec? |
|---|---|
| details/cluster/rbac/ | YES |
| details/cluster/rbac/add-binding-dialog/ | YES |
| details/cluster/rbac/add-service-account-dialog/ | YES |
| details/cluster/rbac/service-account/ | YES |
| details/cluster/rbac/users-or-groups/ | YES |
| **details/cluster/rbac/add-service-account-binding-dialog/** | **NO** |
| **details/cluster/rbac/service-account/service-account-detail/** | **NO** |

### MLA Components

| Component | Spec? |
|---|---|
| details/cluster/mla/ (root + sub-components) | YES (multiple specs) |

### OPA Components

| Component | Spec? |
|---|---|
| details/cluster/constraints/ | YES |
| details/cluster/constraints/constraint-dialog/ | YES |
| details/cluster/constraints/violation-details/ | YES |
| details/cluster/gatekeeper-config/ | YES |
| details/cluster/gatekeeper-config/gatekeeper-config-dialog/ | YES |

### External Cluster Detail Views

| Component | Spec? |
|---|---|
| details/external-cluster/ | YES |
| details/external-cluster/external-machine-deployment-list/ | YES |
| **details/external-cluster/external-cluster-add-machine-deployment/** | **NO** |
| **details/external-cluster/external-cluster-delete-confirmation/** | **NO** |
| **details/external-cluster/external-machine-deployment-details/** | **NO** |
| **details/external-cluster/external-node-list/** | **NO** |
| **details/external-cluster/update-external-cluster-machine-deployment-dialog/** | **NO** |

### KubeOne Detail Views

| Component | Spec? |
|---|---|
| details/kubeone/ | YES |
| **details/kubeone/machine-deployment-details/** | **NO** |
| **details/kubeone/machine-deployment-dialog/** | **NO** |
| **details/kubeone/machine-deployment-list/** | **NO** |

### Shared Detail Components

| Component | Spec? |
|---|---|
| details/shared/cluster-metrics/ | YES |
| details/shared/cluster-panel/ | YES |
| details/shared/version-change-dialog/ | YES |
| details/shared/version-picker/ | YES |

## Test Gaps — Prioritized

### P0 — Write First

**1. list/kubeone/ — KubeOne Cluster List**
- User Stories: Display KubeOne clusters in table, show status/provider/version, delete cluster
- Test Scenarios:
  1. Should create and display table
  2. Should load clusters on project change
  3. Should display correct columns
  4. Should handle empty cluster list
  5. Should open delete confirmation dialog

**2. Cluster List Edge Cases (rewrite of deleted component.edge-case.spec.ts)**
- Test Scenarios:
  1. Should handle API errors loading clusters
  2. Should handle empty project
  3. Should sort by columns
  4. Should paginate large cluster lists
  5. Should filter clusters by search
  6. Should handle cluster health status transitions

### P1 — Important Gaps

**3. External Cluster Details (5 untested components)**
- Test Scenarios per component:
  - external-cluster-add-machine-deployment: Should open dialog, validate form, submit creation
  - external-cluster-delete-confirmation: Should confirm deletion, call API
  - external-machine-deployment-details: Should display MD details
  - external-node-list: Should display node table
  - update-external-cluster-machine-deployment-dialog: Should edit MD, validate, submit

**4. KubeOne Detail Views (3 untested components)**
- machine-deployment-details: Should display MD info
- machine-deployment-dialog: Should create/edit MD
- machine-deployment-list: Should display MD table

**5. CNI Version (2 untested components)**
- Should display current CNI version
- Should open upgrade dialog
- Should validate version selection

### P2 — Lower Priority

**6. overlay-terminal, web-terminal** — Complex DOM/xterm interaction, hard to unit test
**7. revoke-token** — Simple confirmation dialog
**8. baremetal-provider-settings** — Single provider variant
**9. add-service-account-binding-dialog, service-account-detail** — Minor RBAC sub-components
