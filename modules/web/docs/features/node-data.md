# PRD: Node Data Module

**Route:** N/A (embedded in wizard and cluster detail views)
**Location:** `src/app/node-data/`
**Priority:** P1
**Test Coverage:** 0/35 components tested

## Overview

The node-data module provides forms for configuring machine deployments (initial nodes in wizard, new MDs in cluster details). It's the largest untested feature module with 35 components spanning a root form, per-provider basic settings (15 providers), per-provider extended settings (8 providers), a dialog, and a kubelet version selector.

## Components

### Core Components

| # | Component | Lines (est.) | Complexity |
|---|---|---|---|
| 1 | component.ts | HIGH | Root node data form — orchestrates provider sub-forms |
| 2 | dialog/component.ts | MEDIUM | MD creation dialog wrapper |
| 3 | kubelet-version/component.ts | LOW | Version selector dropdown |

### Basic Provider Components (`basic/provider/`)

| # | Component | Key Inputs |
|---|---|---|
| 4 | component.ts | Root — delegates to provider-specific sub-form |
| 5 | alibaba/component.ts | Instance type, disk type/size, vSwitch/zone |
| 6 | anexia/component.ts | Template, vlan, disk, CPU/memory |
| 7 | aws/component.ts | Instance type, disk, subnet, AZ, AMI |
| 8 | aws/machine-type-selector/component.ts | AWS instance type picker with filtering |
| 9 | azure/component.ts | VM size, OS disk, zone, image |
| 10 | azure/machine-type-selector/component.ts | Azure VM size picker |
| 11 | baremetal/component.ts | Minimal baremetal config |
| 12 | digitalocean/component.ts | Droplet size |
| 13 | edge/component.ts | Edge node config |
| 14 | gcp/component.ts | Machine type, disk, zone, image |
| 15 | gcp/machine-type-selector/component.ts | GCP machine type picker |
| 16 | hetzner/component.ts | Server type, network |
| 17 | hetzner/machine-type-selector/component.ts | Hetzner server type picker |
| 18 | kubevirt/component.ts | CPU, memory, PVC, storage class |
| 19 | kubevirt/instance-details/component.ts | Instance detail display |
| 20 | kubevirt/machine-type-selector/component.ts | KubeVirt type picker |
| 21 | kubevirt/topology-spread-constraint-form/component.ts | Topology constraints |
| 22 | nutanix/component.ts | Subnet, image, CPU/memory/disk |
| 23 | openstack/component.ts | Flavor, image, AZ, network |
| 24 | openstack/machine-type-selector/component.ts | OpenStack flavor picker |
| 25 | vmware-cloud-director/component.ts | Catalog, template, network |
| 26 | vsphere/component.ts | CPU, memory, disk, template, folder |

### Extended Provider Components (`extended/provider/`)

| # | Component | Key Inputs |
|---|---|---|
| 27 | component.ts | Root extended — delegates to provider |
| 28 | alibaba/component.ts | Extended Alibaba settings |
| 29 | aws/component.ts | Extended AWS (tags, security groups) |
| 30 | azure/component.ts | Extended Azure settings |
| 31 | digitalocean/component.ts | Extended DO settings |
| 32 | gcp/component.ts | Extended GCP (tags, labels) |
| 33 | openstack/component.ts | Extended OpenStack settings |
| 34 | vsphere/component.ts | Extended vSphere settings |
| 35 | vsphere/tag-categories/component.ts | vSphere tag category selector |

## User Stories

1. User configures initial machine deployment in cluster creation wizard
2. User creates new machine deployment for existing cluster (via dialog)
3. User selects provider-specific machine type/size
4. User configures disk type and size
5. User selects availability zone / region
6. User sets replicas count
7. User selects kubelet version
8. User configures operating system
9. System loads machine types from cloud provider API
10. System validates provider-specific required fields
11. System supports preset credentials for auto-filling provider fields

## Test Strategy

Given the size (35 components), prioritize by usage frequency and complexity:

### P0 — Core + Top Providers (12 tests)

**1. Root component (component.ts)**
- Test Scenarios:
  1. Should create component with default form
  2. Should delegate to correct provider sub-form
  3. Should emit valid node data on form completion
  4. Should handle provider change (reset form)

**2. Dialog component**
- Test Scenarios:
  1. Should open with cluster context
  2. Should pass provider info to node-data form
  3. Should submit MD creation on confirm

**3. Kubelet version selector**
- Test Scenarios:
  1. Should list available versions
  2. Should select matching cluster version by default

**4. AWS basic provider** (most used cloud provider)
- Test Scenarios:
  1. Should create form with AWS-specific fields
  2. Should load instance types from API
  3. Should validate required fields (instance type, disk, subnet)
  4. Should handle API error loading instance types
  5. Should work with preset credentials

**5. GCP basic provider**
- Test Scenarios: Same pattern as AWS

**6. Azure basic provider**
- Test Scenarios: Same pattern as AWS

**7. OpenStack basic provider**
- Test Scenarios: Same pattern as AWS + flavor selection

### P1 — Remaining Providers (13 tests)

**8-18. Other basic providers** (alibaba, anexia, baremetal, digitalocean, edge, hetzner, kubevirt, nutanix, vmware-cloud-director, vsphere)
- Each needs at minimum:
  1. Should create with provider fields
  2. Should validate required fields
  3. Should emit valid config

### P2 — Extended Provider Settings (8 tests)

**19-26. Extended providers** (alibaba, aws, azure, digitalocean, gcp, openstack, vsphere, vsphere/tag-categories)
- Each needs:
  1. Should render extended fields
  2. Should emit extended config

### P2 — Machine Type Selectors (6 tests)

**27-32. Machine type selectors** (aws, azure, gcp, hetzner, kubevirt, openstack)
- Each needs:
  1. Should load types from API
  2. Should filter/search types
  3. Should emit selected type
