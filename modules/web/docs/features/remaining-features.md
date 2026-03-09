# PRD: Project Overview

**Route:** `projects/:projectID/overview`
**Location:** `src/app/project-overview/`
**Priority:** P2
**Test Coverage:** 0/5 components tested

## Components

| # | Component | Purpose |
|---|---|---|
| 1 | component.ts | Root overview page layout |
| 2 | clusters-overview/component.ts | Cluster count/status summary card |
| 3 | create-resource-panel/component.ts | Quick-create buttons panel |
| 4 | members-overview/component.ts | Member count summary card |
| 5 | providers-overview/component.ts | Provider usage summary card |

## User Stories

1. User sees project dashboard with cluster summary
2. User sees member count and recent members
3. User sees which providers are in use
4. User can quickly create cluster/member/SSH key from panel

## Test Scenarios

1. Should render all overview cards
2. Should display correct cluster count
3. Should display correct member count
4. Should show provider icons for active providers
5. Should navigate to wizard on create-cluster click
6. Should handle empty project (no clusters/members)

---

# PRD: External Cluster Wizard

**Route:** `projects/:projectID/external-cluster-wizard`
**Location:** `src/app/external-cluster-wizard/`
**Priority:** P2
**Test Coverage:** 0/10 components tested

## Components

| # | Component | Purpose |
|---|---|---|
| 1 | component.ts | Main wizard stepper |
| 2 | steps/external-cluster/component.ts | Cluster config step |
| 3 | steps/external-cluster/provider/aks/component.ts | AKS credentials |
| 4 | steps/external-cluster/provider/eks/component.ts | EKS credentials |
| 5 | steps/external-cluster/provider/gke/component.ts | GKE credentials |
| 6 | steps/summary/component.ts | Summary step |
| 7 | steps/summary/external-cluster-details/component.ts | Detail display |
| 8-10 | steps/summary/external-cluster-details/provider/{aks,eks,gke}/component.ts | Provider summaries |

## User Stories

1. User selects external cluster provider (AKS/EKS/GKE)
2. User enters provider credentials
3. User reviews summary and imports cluster
4. System validates credentials before import

## Test Scenarios (per component)

**Wizard root:** Should manage step flow, should skip to summary on valid data
**Provider steps:** Should render provider-specific fields, should validate credentials
**Summary:** Should display collected data, should submit import

---

# PRD: KubeOne Wizard

**Route:** `projects/:projectID/kubeone-wizard`
**Location:** `src/app/kubeone-wizard/`
**Priority:** P2
**Test Coverage:** 0/14 components tested

## Components

| # | Component | Purpose |
|---|---|---|
| 1 | component.ts | Main wizard stepper |
| 2 | steps/provider/component.ts | Provider selection |
| 3 | steps/cluster/component.ts | Cluster configuration |
| 4 | steps/credentials/component.ts | Credential root |
| 5 | steps/credentials/preset/component.ts | Preset selector |
| 6 | steps/credentials/provider/basic/component.ts | Basic provider root |
| 7-13 | steps/credentials/provider/basic/{aws,azure,digitalocean,gcp,hetzner,openstack,vsphere}/component.ts | Provider credentials |
| 14 | steps/summary/component.ts | Summary and create |

## User Stories

1. User selects KubeOne-supported provider
2. User configures cluster settings
3. User enters provider credentials (manual or preset)
4. User reviews summary and creates cluster

## Test Scenarios

Same pattern as main wizard — step navigation, provider-specific forms, validation, submit.

---

# PRD: Cluster Template

**Route:** `projects/:projectID/clustertemplates`
**Location:** `src/app/cluster-template/`
**Priority:** P2
**Test Coverage:** 0/1 components tested

## Components

| Component | Purpose |
|---|---|
| component.ts | Template listing table |

## User Stories

1. User views list of cluster templates
2. User can create cluster from template
3. User can delete template

## Test Scenarios

1. Should display template list table
2. Should handle empty template list
3. Should open create-from-template dialog
4. Should confirm template deletion

---

# PRD: Admin Settings

**Route:** `settings`
**Location:** `src/app/settings/admin/`
**Priority:** P2
**Test Coverage:** 8/55 components tested

## Tested Components

accounts, admins, root component, customization, defaults, opa/constraint-templates (and dialog), opa/default-constraints/dialog

## Major Untested Areas

1. **Presets** (16 components) — Provider preset management with per-provider settings dialogs
2. **Dynamic Datacenters** (3 components) — Datacenter CRUD
3. **Seed Configurations** (3 components) — Seed cluster management
4. **Announcements** (2 components) — Announcement management
5. **Bucket Settings** (4 components) — Backup destination config
6. **Applications** (1 component) — Application catalog
7. **Rule Groups** (2 components) — Alerting rule management
8. **OPA** (2 components) — OPA root + default constraints list
9. **Navigation, Limits, Global Viewer, Custom Link Form** — Small components

## Test Strategy

Given 47 untested components, prioritize presets (most complex, 16 components) and dynamic datacenters (admin-critical) for P1 testing. The rest are P2.

---

# PRD: User Settings

**Route:** `account`
**Location:** `src/app/settings/user/`
**Priority:** P2 (already tested)
**Test Coverage:** 1/1 tested

No gaps.

---

# PRD: Dynamic/Enterprise Features

**Location:** `src/app/dynamic/enterprise/`
**Priority:** P2
**Test Coverage:** 8 specs across metering (5) and quotas (3)

## Untested Enterprise Features

1. **allowed-registries** (2 components) — Registry allowlist management
2. **cluster-backups** (12+ components) — Velero-based backup/restore/schedule
3. **group** (3 components) — User group management
4. **kyverno-policies** (5 components) — Kyverno policy management
5. **theming** (2 components) — Theme picker and service

## Test Strategy

Enterprise features are P2 for unit testing since they're partially covered by E2E tests (edition.spec.ts) and are CE/EE-conditional code paths.
