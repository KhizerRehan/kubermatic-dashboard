# Migration Proposal: Kubernetes Dashboard to Headlamp

**Kubermatic Kubernetes Platform (KKP) v2.31**

- **Issue:** [github.com/kubermatic/kubermatic/issues/15287](https://github.com/kubermatic/kubermatic/issues/15287)
- **Date:** April 2026
- **Status:** Draft Proposal
- **Design Spec:** `docs/superpowers/specs/2026-03-31-headlamp-integration-design.md`
- **Implementation Plan:** `ai/plans/headlamp-seed-side-impl.plan.md`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Background & Motivation](#2-background--motivation)
3. [Current Architecture (Before)](#3-current-architecture-before)
4. [Proposed Architecture (After)](#4-proposed-architecture-after)
5. [Architecture Comparison](#5-architecture-comparison)
6. [Migration Strategy](#6-migration-strategy)
7. [API Changes](#7-api-changes)
8. [Implementation Plan](#8-implementation-plan)
9. [File Change Map](#9-file-change-map)
10. [Risk Assessment](#10-risk-assessment)
11. [Pre-Implementation Blockers](#11-pre-implementation-blockers)
12. [Verification & Testing Plan](#12-verification--testing-plan)
13. [Timeline & Milestones](#13-timeline--milestones)
14. [Open Questions](#14-open-questions)
15. [Appendix: Validated Server Flags](#15-appendix-validated-server-flags)

---

## 1. Executive Summary

The upstream Kubernetes Dashboard project (`github.com/kubernetes-retired/dashboard`) has been officially retired and archived. Continued use poses security risks due to lack of maintenance and security patches. This proposal outlines the migration to Headlamp (`github.com/kubernetes-sigs/headlamp`), a modern, extensible Kubernetes web UI maintained under the kubernetes-sigs organization.

### Approach: Seed-Side Deployment

**We chose seed-side Go reconcilers**, mirroring the current Kubernetes Dashboard pattern. The earlier Application Framework approach (deprecated plans v1/v2) was rejected.

### Key Decisions

- Deploy Headlamp on the **seed cluster** (per-user-cluster namespace), mirroring the current Kubernetes Dashboard pattern
- Add new `Headlamp` API field **alongside** the deprecated `KubernetesDashboard` field for backward compatibility
- Use existing **cluster reconciler infrastructure** (Go reconcilers), not the Application Framework
- **Scope: Add Headlamp only** — old dashboard code remains intact during migration period

### Requirements (from Issue #15287)

- Enable end-users to deploy and expose Headlamp through KKP
- Plugin support for: Cert Manager, KEDA, Flux (follow-up investigation)
- Migration strategy to remove old Kubernetes Dashboard
- OIDC integration support (follow-up investigation)

---

## 2. Background & Motivation

### Why Migrate?

- Kubernetes Dashboard repository is **archived** (`kubernetes-retired/dashboard`)
- No security patches or maintenance since retirement
- Headlamp is **actively maintained** under `kubernetes-sigs`
- Headlamp provides modern UI, plugin system, and native OIDC support
- CNCF community backing ensures long-term viability



### Why Seed-Side Deployment (Not Application Framework)?

Earlier proposals (deprecated plans v1/v2) suggested deploying Headlamp via the KKP Application Framework using Helm charts installed directly into user clusters. After analysis, the **seed-side approach** was chosen:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    APPROACH COMPARISON                                    │
│                                                                          │
│  Application Framework (REJECTED)     Seed-Side Reconcilers (CHOSEN)     │
│  ┌─────────────────────────────┐      ┌─────────────────────────────┐   │
│  │ - Helm chart in user cluster│      │ - Go code on seed cluster   │   │
│  │ - AppDef + AppInstallation  │      │ - Mirrors current k8s-dash  │   │
│  │ - New deployment pattern    │      │ - Proven, existing pattern  │   │
│  │ - Dashboard in user cluster │      │ - Credentials stay on seed  │   │
│  │ - Depends on App Framework  │      │ - No new dependencies       │   │
│  │ - Harder migration path     │      │ - Parallel coexistence      │   │
│  └─────────────────────────────┘      └─────────────────────────────┘   │
│                                                                          │
│  Why rejected:                        Why chosen:                        │
│  - Architecture change too risky      - Minimal blast radius             │
│  - Security model changes             - Same access model                │
│  - Core component on framework        - Simpler migration                │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Current Architecture (Before)

### 3.1 Deployment Topology

The Kubernetes Dashboard is deployed as a split architecture: the main dashboard runs on the seed cluster, while supporting components (metrics-scraper, RBAC, secrets) are deployed in the user cluster.

```
SEED CLUSTER (per-user-cluster namespace: cluster-xyz)
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Deployment: kubernetes-dashboard (2 replicas)       │
│    Image: kubernetesui/dashboard:v2.7.0              │
│    Port: 9090                                        │
│    Command: /dashboard                               │
│                                                      │
│  Secret: kubernetes-dashboard-kubeconfig              │
│    Cert user: kubermatic:kubernetes-dashboard         │
│                                                      │
│  Seed Controller Manager:                            │
│    - DeploymentReconciler (creates dashboard)        │
│    - KubeconfigReconciler (creates kubeconfig)       │
│    - HealthCheck (monitors deployment health)        │
└───────────────────┬──────────────────────────────────┘
                    │ kubeconfig (cert auth)
                    ▼
USER CLUSTER
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Namespace: kubernetes-dashboard                     │
│    ├── dashboard-metrics-scraper (2 replicas)        │
│    │   Image: kubernetesui/metrics-scraper:v1.0.8    │
│    │   Port: 8000                                    │
│    ├── Service: dashboard-metrics-scraper            │
│    ├── ServiceAccount                                │
│    ├── Role + RoleBinding                            │
│    └── Secrets: key-holder, csrf                     │
│                                                      │
│  ClusterRole: system:dashboard-metrics-scraper       │
│  ClusterRoleBinding                                  │
│                                                      │
│  User Cluster Controller Manager:                    │
│    Reconciles all above resources                    │
└──────────────────────────────────────────────────────┘
```

### 3.2 Control Flow

```
                 Cluster Creation / Reconciliation
                              │
                              ▼
              ┌───────────────────────────────┐
              │ ClusterSpec.KubernetesDashboard│
              │         .Enabled?              │
              └───────────────┬───────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
               Enabled=true        Enabled=false
                    │                   │
           ┌────────┴────────┐          │
           │                 │          ▼
           ▼                 ▼     Delete All
    Seed Controller    User Cluster  Resources
    Manager            Controller
           │                 │
           ▼                 ▼
    - Deploy dashboard  - Create namespace
      deployment          (kubernetes-dashboard)
    - Create kubeconfig - Deploy metrics-scraper
      secret            - Create RBAC
    - Health check      - Create secrets
                        - Create service
```

### 3.3 Current File Structure

```
pkg/
├── resources/
│   └── kubernetes-dashboard/          ◄── SEED-SIDE
│       ├── deployment.go              │   Dashboard deployment reconciler
│       └── deletion.go                │   Cleanup when disabled
│
├── controller/
│   ├── seed-controller-manager/
│   │   └── kubernetes/
│   │       ├── resources.go           │   Wires dashboard reconcilers
│   │       └── health.go              │   Dashboard health check
│   │
│   └── user-cluster-controller-manager/
│       └── resources/
│           ├── reconciler.go          │   Wires user-cluster reconcilers
│           └── resources/
│               └── kubernetes-dashboard/  ◄── USER-CLUSTER (11 files)
│                   ├── constants.go       │   Namespace, AppName
│                   ├── namespace.go       │   Namespace with PSA labels
│                   ├── deployment.go      │   Metrics-scraper
│                   ├── service.go         │   Metrics-scraper service
│                   ├── serviceaccount.go  │   SA
│                   ├── role.go            │   RBAC role
│                   ├── rolebinding.go     │   RBAC binding
│                   ├── clusterrole.go     │   Metrics ClusterRole
│                   ├── clusterrolebinding.go
│                   ├── secret.go          │   Key-holder + CSRF
│                   └── deletion.go        │   Cleanup list
│
├── resources/resources.go             │   Resource name constants
├── defaulting/cluster.go              │   Default: enabled=true
├── install/images/images.go           │   Image collection
└── resources/test/fixtures/           │   ~66 deployment fixtures
```

---

## 4. Proposed Architecture (After)

### 4.1 Headlamp Deployment Topology

Headlamp is deployed on the seed cluster in the per-user-cluster namespace, using a kubeconfig secret to connect to the user cluster API server. This mirrors the exact pattern of the current Kubernetes Dashboard but with a **dramatically simpler user-cluster footprint** (no metrics-scraper, no secrets, no services).

```
SEED CLUSTER (per-user-cluster namespace: cluster-xyz)
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Deployment: headlamp (2 replicas)                   │
│    Image: ghcr.io/headlamp-k8s/headlamp:v0.26.0     │
│    Command: /headlamp/headlamp-server                │
│    Args: -kubeconfig /etc/kubernetes/kubeconfig       │
│          -html-static-dir /headlamp/frontend         │
│    Port: 4466                                        │
│    Security: runAsUser 1001, readOnlyRootFilesystem  │
│    Resources: 100m/128Mi request, 250m/256Mi limit   │
│                                                      │
│  Secret: headlamp-kubeconfig                         │
│    (cert user: kubermatic:headlamp)                  │
│    Generated via GetInternalKubeconfigReconciler      │
│                                                      │
│  Seed Controller Manager:                            │
│    - DeploymentReconciler (creates headlamp)         │
│    - KubeconfigReconciler (creates kubeconfig)       │
│    - HealthCheck (monitors deployment health)        │
└───────────────────┬──────────────────────────────────┘
                    │ kubeconfig → user cluster API
                    ▼
USER CLUSTER
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Namespace: headlamp (PSA baseline labels)           │
│                                                      │
│  ClusterRole: system:headlamp                        │
│    - Read access to cluster-scoped resources          │
│    - (namespaces, nodes, CRDs, workloads, etc.)      │
│                                                      │
│  ClusterRoleBinding: system:headlamp                 │
│    Subject: User "kubermatic:headlamp"               │
│    RoleRef: ClusterRole "system:headlamp"            │
│                                                      │
│  NO deployments, services, or secrets                │
│  (Headlamp reads metrics API directly)               │
└──────────────────────────────────────────────────────┘
```

### 4.2 User Access Flow

```
End User
   │
   │ (KKP Dashboard UI exposes proxy URL,
   │  same pattern as current k8s-dashboard)
   ▼
KKP API Server / Proxy
   │
   │ route to seed cluster
   ▼
Headlamp Service (seed, cluster-xyz ns)
   │
   │ port 4466
   ▼
Headlamp Pod
   │
   │ uses kubeconfig secret
   ▼
User Cluster API Server
   │
   ▼
Cluster Resources (namespaces, pods, etc.)
```

---

## 5. Architecture Comparison

### 5.1 Before vs After

| Aspect | BEFORE (Kubernetes Dashboard) | AFTER (Headlamp) |
|--------|-------------------------------|-------------------|
| **Tool** | kubernetes-dashboard v2.7.0 (archived) | Headlamp v0.26.0 (active, kubernetes-sigs) |
| **Seed Deployment** | kubernetes-dashboard (2 replicas) | headlamp (2 replicas) |
| **Container Port** | 9090 | 4466 |
| **User-cluster Deployments** | dashboard-metrics-scraper | None |
| **User-cluster RBAC** | Role + ClusterRole (metrics only) | ClusterRole only (full browsing) |
| **User-cluster Secrets** | JWE key-holder + CSRF token | None |
| **User-cluster ServiceAccount** | dashboard-metrics-scraper | None |
| **User-cluster Service** | dashboard-metrics-scraper:8000 | None |
| **Container Image** | kubernetesui/dashboard | ghcr.io/headlamp-k8s/headlamp |
| **Plugin Support** | Not possible | Native plugin system |
| **OIDC Support** | Not implemented | Native support (follow-up) |
| **Health Check** | ExtendedHealth.KubernetesDashboard | ExtendedHealth.Headlamp |
| **Go files (seed)** | 2 files | 2 files (same pattern) |
| **Go files (user cluster)** | 11 files | 4 files (much simpler) |

### 5.2 Why Headlamp is Simpler on the User-Cluster Side

- **Built-in resource browsing** — no metrics-scraper sidecar needed
- **Auth via kubeconfig** — no JWE/CSRF secrets needed
- **Cluster-wide read access** — single ClusterRole since it's a full cluster browser
- **No in-cluster service/deployment/SA** — everything runs on seed

---

## 6. Migration Strategy

### 6.1 Phased Approach

The migration uses a **parallel-deployment strategy**: Headlamp is added alongside the existing Kubernetes Dashboard. Both can run simultaneously during the transition period. The old dashboard code is NOT removed in this scope.

```
Migration Timeline

KKP v2.30 (current)     KKP v2.31 (this work)    KKP v2.32+ (future)
┌───────────────────┐   ┌───────────────────┐    ┌───────────────────┐
│                   │   │                   │    │                   │
│ k8s-dashboard     │   │ k8s-dashboard     │    │                   │
│ (deployed)        │   │ (still deployed)  │    │ (REMOVED)         │
│                   │   │                   │    │                   │
│                   │   │ + Headlamp        │    │ Headlamp          │
│                   │   │   (NEW, deployed) │    │ (sole dashboard)  │
│                   │   │                   │    │                   │
│ API field:        │   │ API fields:       │    │ API field:        │
│ kubernetesDashboard│   │ kubernetesDashboard│    │ headlamp          │
│                   │   │ + headlamp (NEW)  │    │ (old removed)     │
└───────────────────┘   └───────────────────┘    └───────────────────┘
```

### 6.2 CRD Field Migration Flow

```
Defaulting Webhook Logic (KKP v2.31)

┌── Is spec.headlamp set? ──┐
│                            │
NO                          YES
│                            │
▼                            ▼
Set spec.headlamp =        Use as-is
{ enabled: true }          (user explicitly configured)
(default for all clusters)

Note: spec.kubernetesDashboard remains untouched.
Both fields coexist. Old field deprecated in v2.32+.
```

### 6.3 IsHeadlampEnabled() Logic

```
func IsHeadlampEnabled() bool:

  ┌── spec.Headlamp != nil? ──┐
  │                            │
 YES                          NO
  │                            │
  ▼                            ▼
return                     return TRUE
spec.Headlamp.Enabled      (default: enabled)
```

---

## 7. API Changes

### 7.1 New Types

**File:** `sdk/apis/kubermatic/v1/cluster.go`

```go
// Headlamp contains settings for the Headlamp component
// as part of the cluster control plane.
type Headlamp struct {
    // Controls whether Headlamp is deployed.
    // Enabled by default.
    Enabled bool `json:"enabled,omitempty"`
}

// Added to ClusterSpec:
Headlamp *Headlamp `json:"headlamp,omitempty"`

// New method:
func (c ClusterSpec) IsHeadlampEnabled() bool {
    return c.Headlamp == nil || c.Headlamp.Enabled
}
```

### 7.2 Health Status

**File:** `sdk/apis/kubermatic/v1/cluster_status.go`

```go
// Added to ExtendedClusterHealth:
Headlamp *HealthStatus `json:"headlamp,omitempty"`
```

### 7.3 New Constants

**File:** `pkg/resources/resources.go`

| Constant | Value |
|----------|-------|
| `HeadlampDeploymentName` | `"headlamp"` |
| `HeadlampKubeconfigSecretName` | `"headlamp-kubeconfig"` |
| `HeadlampCertUsername` | `"kubermatic:headlamp"` |
| `HeadlampClusterRoleName` | `"system:headlamp"` |
| `HeadlampClusterRoleBindingName` | `"system:headlamp"` |

### 7.4 Backward Compatibility

The existing `KubernetesDashboard` field and `IsKubernetesDashboardEnabled()` method **remain unchanged**. They are NOT removed in this scope. Both dashboards coexist. Deprecation and removal of the old field will be handled in KKP v2.32+.

---

## 8. Implementation Plan

### Phase 1: API Types & Constants

- Add `Headlamp` struct and field to `ClusterSpec`
- Add `IsHeadlampEnabled()` method
- Add `Headlamp` health status to `ExtendedClusterHealth`
- Add new constants to `resources.go`
- Add defaulting logic in `cluster.go`
- Run deepcopy + CRD generation

### Phase 2: Seed-Side Resources

- Create `pkg/resources/headlamp/deployment.go` (deployment reconciler)
- Create `pkg/resources/headlamp/deletion.go` (cleanup resources)

### Phase 3: User-Cluster Resources

- Create `pkg/controller/.../headlamp/constants.go`
- Create `pkg/controller/.../headlamp/namespace.go` (PSA baseline)
- Create `pkg/controller/.../headlamp/clusterrole.go` (read access)
- Create `pkg/controller/.../headlamp/clusterrolebinding.go`
- Create `pkg/controller/.../headlamp/deletion.go`

### Phase 4: Wire Into Seed Controller Manager

- Wire `DeploymentReconciler` into `resources.go` (~line 440)
- Wire kubeconfig secret reconciler (~line 555)
- Add cleanup when `IsHeadlampEnabled() == false` (~line 207)
- Add `headlampHealthCheck` to `health.go` (~line 113)

### Phase 5: Wire Into User-Cluster Controller Manager

- Add `headlampEnabled bool` to `reconcileData` struct
- Wire into `reconcileNamespaces`, `reconcileClusterRoles`, `reconcileClusterRoleBindings`
- Add cleanup method `ensureHeadlampResourcesAreRemoved`

### Phase 6: Image Registration & Versions

- Add headlamp image to `pkg/install/images/images.go`
- Add headlamp entry to `hack/versions.yaml`

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION FLOW                       │
│                                                             │
│  Phase 1        Phase 2        Phase 3        Phase 4       │
│  ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐       │
│  │ API  │─────▶│ Seed │─────▶│ User │─────▶│ Wire │       │
│  │Types │      │ Res  │      │Clust │      │ Seed │       │
│  │Const │      │      │      │ Res  │      │ Ctrl │       │
│  └──────┘      └──────┘      └──────┘      └──────┘       │
│      │                                          │           │
│      │         Phase 5        Phase 6           │           │
│      │        ┌──────┐      ┌──────┐            │           │
│      └───────▶│ Wire │─────▶│Image │────────────┘           │
│               │ User │      │ Reg  │                        │
│               │ Ctrl │      │      │                        │
│               └──────┘      └──────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. File Change Map

### 9.1 New Files to Create

```
NEW FILES (7 files):

pkg/resources/headlamp/
├── deployment.go              Headlamp deployment reconciler
└── deletion.go                Seed-side cleanup resources

pkg/controller/user-cluster-controller-manager/
└── resources/resources/headlamp/
    ├── constants.go            Namespace & AppName constants
    ├── namespace.go            Headlamp namespace with PSA
    ├── clusterrole.go          Read-access ClusterRole
    ├── clusterrolebinding.go   Bind to kubermatic:headlamp user
    └── deletion.go             User-cluster cleanup resources
```

### 9.2 Files to Modify

| File | Change |
|------|--------|
| `sdk/apis/kubermatic/v1/cluster.go` | Add Headlamp struct, field, IsHeadlampEnabled() |
| `sdk/apis/kubermatic/v1/cluster_status.go` | Add Headlamp to ExtendedClusterHealth |
| `pkg/resources/resources.go` | Add Headlamp constants |
| `pkg/defaulting/cluster.go` | Add Headlamp defaulting (enabled=true) |
| `pkg/controller/seed-controller-manager/kubernetes/resources.go` | Wire deployment + kubeconfig reconcilers |
| `pkg/controller/seed-controller-manager/kubernetes/health.go` | Add headlampHealthCheck |
| `pkg/controller/user-cluster-controller-manager/resources/reconciler.go` | Wire namespace, ClusterRole, ClusterRoleBinding, cleanup |
| `pkg/install/images/images.go` | Add headlamp image for mirroring |
| `hack/versions.yaml` | Add headlamp version entry |

### 9.3 Auto-Generated Files (via `make generate`)

- `pkg/crd/k8c.io/kubermatic.k8c.io_clusters.yaml`
- `pkg/crd/k8c.io/kubermatic.k8c.io_clustertemplates.yaml`
- `sdk/apis/kubermatic/v1/zz_generated.deepcopy.go`

### 9.4 Files NOT Changed (Old Dashboard Intact)

- `pkg/resources/kubernetes-dashboard/` — remains as-is
- `pkg/controller/.../kubernetes-dashboard/` — remains as-is
- All existing k8s-dashboard test fixtures — remain as-is

---

## 10. Risk Assessment

| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|------------|------------|
| 1 | ClusterRole grants broad read access | HIGH | CERTAIN | Review RBAC rules; restrict if needed |
| 2 | Headlamp image compatibility (UID/GID) | MEDIUM | MEDIUM | Helm defaults UID 100; spec uses 1001. Test both |
| 3 | Plugin support not in initial scope | MEDIUM | CERTAIN | Documented as follow-up; plugins need investigation |
| 4 | OIDC integration not in initial scope | MEDIUM | CERTAIN | Documented as follow-up; native support exists |
| 5 | Health check monitoring gap during transition | LOW | LOW | Both health checks run in parallel |
| 6 | Image not mirrored for air-gap environments | HIGH | CERTAIN | Add to quay.io/kubermatic-mirror pipeline |
| 7 | Frontend (KKP Dashboard) needs updates | MEDIUM | CERTAIN | Coordinate with frontend team for v2.31 |
| 8 | Coexistence issues (both dashboards) | LOW | LOW | Different namespaces, no resource conflicts |

### Risk Matrix

```
                          RISK MATRIX
HIGH    |                                              |
IMPACT  |  [6] Air-gap       [1] RBAC scope           |
        |  mirroring                                   |
        |                                              |
MEDIUM  |  [3] Plugins       [2] Image UID/GID        |
IMPACT  |  [4] OIDC          [7] Frontend updates     |
        |                                              |
LOW     |                    [8] Coexistence           |
IMPACT  |                    [5] Health gap            |
        +----------------------------------------------+
          LOW LIKELIHOOD      MEDIUM          HIGH
```

---

## 11. Pre-Implementation Blockers

| # | Item | Priority | Status |
|---|------|----------|--------|
| 1 | Verify headlamp container image works with UID 1001 | BLOCKER | Needs testing |
| 2 | Add headlamp image to quay.io/kubermatic-mirror | HIGH | Not started |
| 3 | Define exact ClusterRole RBAC rules | HIGH | Draft in design spec |
| 4 | Frontend team coordination for API field | MEDIUM | Not started |
| 5 | Plugin investigation (Cert Manager, KEDA, Flux) | FOLLOW-UP | Deferred |
| 6 | OIDC integration investigation | FOLLOW-UP | Deferred |

---

## 12. Verification & Testing Plan

### Testing Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Unit Tests      │     │  CRD Generation  │     │  Manual Testing  │
│                  │────▶│                  │────▶│                  │
│  go test         │     │  make generate   │     │  Deploy cluster  │
│  ./pkg/resources │     │  Verify CRD YAML │     │  Check headlamp  │
│  ./pkg/controller│     │  Check deepcopy  │     │  Check health    │
│  ./sdk/...       │     │                  │     │  Check RBAC      │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                         │
                                                         ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Coexistence      │     │ Disable Testing  │     │ Upgrade Testing  │
│                  │◀────│                  │◀────│                  │
│ Both dashboards  │     │ Set enabled=false│     │ Existing cluster │
│ run side-by-side │     │ Verify cleanup   │     │ gets headlamp    │
│ No conflicts     │     │ No orphans       │     │ k8s-dash intact  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Test Checklist

- [ ] **Unit:** `go test ./pkg/resources/... ./pkg/controller/... ./sdk/...`
- [ ] **CRD:** `make generate` produces valid CRD YAML with headlamp field
- [ ] **Golden tests:** New deployment fixtures for headlamp added
- [ ] **Create cluster:** headlamp deployment appears in seed namespace
- [ ] **Kubeconfig:** headlamp-kubeconfig secret is created
- [ ] **User cluster:** ClusterRole and ClusterRoleBinding exist
- [ ] **Health:** ExtendedHealth.Headlamp reports healthy
- [ ] **Disable:** spec.headlamp.enabled=false removes all resources
- [ ] **Coexistence:** Both kubernetes-dashboard and headlamp run simultaneously
- [ ] **Air-gap:** headlamp image available in mirrored registry

---

## 13. Timeline & Milestones

```
Implementation Timeline

Phase 1: API Types & Constants           [  ####  ]         ~1 day
Phase 2: Seed-Side Resources             [  ########  ]     ~2 days
Phase 3: User-Cluster Resources          [  ######  ]       ~1.5 days
Phase 4: Wire Seed Controller            [  ####  ]         ~1 day
Phase 5: Wire User-Cluster Controller    [  ####  ]         ~1 day
Phase 6: Image & Version Registration    [  ##  ]           ~0.5 day
──────────────────────────────────────────────────────────
Total estimated effort:                  ~7 working days

Target: KKP v2.31

Future (v2.32+):
  - Remove old kubernetes-dashboard code
  - Remove deprecated kubernetesDashboard API field
  - Add plugin support (Cert Manager, KEDA, Flux)
  - Add OIDC integration
  - Update KKP Dashboard frontend
```

---

## 14. Open Questions

| # | Question | Impact | Notes |
|---|----------|--------|-------|
| 1 | UID: Helm chart defaults to UID 100/GID 101, but design uses 1001 (matching k8s-dashboard). Which does the container support? | HIGH | Needs testing before implementation |
| 2 | Plugin support: How to configure Cert Manager, KEDA, Flux plugins in seed-side deployment? | MEDIUM | Deferred to follow-up |
| 3 | OIDC: How does Headlamp OIDC integrate with KKP OIDC setup? | MEDIUM | Deferred to follow-up |
| 4 | `-insecure-ssl` flag: Needed for self-signed API server certs? | LOW | Test with actual clusters |
| 5 | Base URL: Does Headlamp need `-base-url` for KKP proxy routing? | MEDIUM | Test with KKP proxy |

---

## 15. Appendix: Validated Server Flags

The following flags were validated against a live dev cluster on 2026-03-31 using Docker with a mounted kubeconfig.

| Flag | Default | Our Usage |
|------|---------|-----------|
| `-kubeconfig` | `""` | `/etc/kubernetes/kubeconfig/kubeconfig` |
| `-in-cluster` | `false` | Leave as default (do not set) |
| `-port` | `4466` | Use default |
| `-plugins-dir` | `~/.config/Headlamp/plugins` | `/headlamp/plugins` |
| `-html-static-dir` | `""` | `/headlamp/frontend` |
| `-base-url` | `""` | May set for routing |
| `-insecure-ssl` | `false` | May need for self-signed certs |

### Validated Test Results

- Starts with `-kubeconfig` pointing to external cluster
- Proxy setup to external cluster API server works
- 34 namespaces, 12 nodes, deployments all browsable via API proxy
- No auth prompt (kubeconfig provides authentication)
- Port 4466 works out of the box
- No `-in-cluster` flag needed (defaults to false)

### Container Details

- **Binary:** `/headlamp/headlamp-server`
- **Image:** `ghcr.io/headlamp-k8s/headlamp:v0.26.0`
- **Static dir:** `/headlamp/frontend` (in container)
- **Plugins dir:** `/headlamp/plugins` (in container)
- **Default RunAs:** user headlamp (UID 100, GID 101 per Helm chart)

---

## Document History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-31 | Design Spec | - | Initial design document |
| 2026-04-06 | Proposal v1 | - | Consolidated proposal with codebase verification |

### Related Documents

| Document | Location | Status |
|----------|----------|--------|
| Design Spec | `docs/superpowers/specs/2026-03-31-headlamp-integration-design.md` | Authoritative |
| Implementation Plan | `ai/plans/headlamp-seed-side-impl.plan.md` | Active |
| Migration Plan v1 | `ai/plans/deprecated/headlamp-migration.plan.md` | Deprecated (App Framework) |
| Migration Plan v2 | `ai/plans/deprecated/headlamp-migration-v2.plan.md` | Deprecated (App Framework) |
| Dev Testing Plan | `ai/plans/deprecated/headlamp-dev-testing.plan.md` | Reference only |
