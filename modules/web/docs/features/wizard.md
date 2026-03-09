# PRD: Cluster Creation Wizard

**Route:** `projects/:projectID/wizard`
**Location:** `src/app/wizard/`
**Priority:** P0

## Overview

Multi-step wizard for creating KKP clusters. Uses Angular Material Stepper with reactive forms. Steps can be dynamically enabled/disabled based on context (e.g., creating from template skips Provider step).

## Components

### Main Wizard
- `component.ts` — Root wizard component, manages stepper and step visibility
- `config.ts` — Step definitions and registry
- `component.edge-case.spec.ts` — EXISTS (edge case tests)

### Steps (all 7 have specs)

| Step | Spec? | Purpose |
|---|---|---|
| step/provider-datacenter/ | YES | Select cloud provider and datacenter |
| step/cluster/ | YES | Cluster name, version, network settings |
| step/cluster/ssh-keys/ | YES | SSH key selection |
| step/cluster/cilium-application-values-dialog/ | — | Cilium config dialog |
| step/provider-settings/ | YES | Provider-specific credentials/config |
| step/network/ | YES | Network configuration (CIDR, CNI) |
| step/node-settings/ | YES | Initial node pool configuration |
| step/applications/ | YES | Application selection |
| step/summary/ | YES | Review and create |

### Provider Sub-Steps (covered by parent specs)

**Basic providers (13):** alibaba, anexia, aws, azure, baremetal, digitalocean, gcp, hetzner, kubevirt, nutanix, openstack, vmware-cloud-director, vsphere

**Extended providers (8):** aws, azure, gcp, hetzner, nutanix, openstack, vmware-cloud-director, vsphere

**Preset:** Provider credential preset selection

## Current Coverage

All 7 main steps have unit tests. Coverage is reasonable for the wizard flow.

## Test Gaps

### P0 — Step Interaction & Flow

**1. Wizard Step Navigation**
- Test Scenarios:
  1. Should initialize with all default steps enabled
  2. Should skip Provider step when creating from template
  3. Should prevent advancing to next step when current step invalid
  4. Should allow going back to previous step
  5. Should collect data from all steps on submit

**2. Provider-Datacenter Step**
- Current spec covers basic creation. Missing:
  1. Should filter datacenters by selected provider
  2. Should handle provider change (reset subsequent steps)
  3. Should load preset datacenters

**3. Cluster Step**
- Missing:
  1. Should validate cluster name format
  2. Should load available Kubernetes versions
  3. Should handle SSH key selection/deselection

### P1 — Provider-Specific Steps

**4. Individual Provider Sub-Steps (not individually tested)**
- Each provider basic step should test:
  1. Should create form with required provider fields
  2. Should validate required credentials
  3. Should load machine types / instance types from API
  4. Should handle preset credential injection
  5. Should handle API errors for type loading

Priority providers for testing: AWS, GCP, Azure, OpenStack (most used)

### P2 — Summary Step

**5. Summary Step**
- Current spec covers basic creation. Missing:
  1. Should display all collected wizard data
  2. Should handle cluster creation API call
  3. Should show error on creation failure
  4. Should redirect on success
