# Headlamp Migration Research

**Issue:** https://github.com/kubermatic/kubermatic/issues/15287
**Date:** 2026-04-06

## Background

The Kubernetes Dashboard (`kubernetes-retired/dashboard`) is archived and unmaintained — no security updates, no bug fixes. KKP currently ships v2.7.0 into user clusters. [Headlamp](https://github.com/kubernetes-sigs/headlamp) is the officially recommended successor under `kubernetes-sigs` and a CNCF Sandbox project (since May 2023).

---

## Current Architecture: Kubernetes Dashboard

The dashboard is deployed per user cluster via the user-cluster-controller-manager:

```
SEED CLUSTER (namespace: cluster-xxx)
┌─────────────────────────────────────────────────┐
│  Deployment: kubernetes-dashboard (2 replicas)  │
│    image: kubernetesui/dashboard:v2.7.0         │
│    port: 9090                                   │
│    volumes: dashboard-kubeconfig (Secret)        │
└──────────────┬──────────────────────────────────┘
               │ kubeconfig -> user cluster API
               v
USER CLUSTER (namespace: kubernetes-dashboard)
┌─────────────────────────────────────────────────┐
│  Deployment: dashboard-metrics-scraper (2 repl) │
│  Service: dashboard-metrics-scraper:8000        │
│  Secrets: kubeconfig, JWE key-holder, CSRF      │
│  ServiceAccount, Role, RoleBinding              │
│  ClusterRole (metrics), ClusterRoleBinding      │
│  Namespace: kubernetes-dashboard                │
└─────────────────────────────────────────────────┘
```

**Key files:**
- `pkg/resources/kubernetes-dashboard/deployment.go` — Seed-side deployment
- `pkg/controller/user-cluster-controller-manager/resources/resources/kubernetes-dashboard/` — User-cluster resources (11 files)
- `sdk/apis/kubermatic/v1/cluster.go` — `KubernetesDashboard` API type and `IsKubernetesDashboardEnabled()`
- `pkg/resources/resources.go` — Resource name constants

**API endpoint:** `/api/v2/projects/{project_id}/clusters/{cluster_id}/dashboard/proxy`

**Configuration:** Enabled by default via `spec.kubernetesDashboard.enabled` on the Cluster spec.

---

## Proposed Architecture: Headlamp (Seed-Side)

Deploy Headlamp on the seed cluster per user-cluster namespace, with minimal user-cluster footprint:

```
SEED CLUSTER (namespace: cluster-xxx)
┌─────────────────────────────────────────────────┐
│  Deployment: headlamp (2 replicas)              │
│    image: ghcr.io/headlamp-k8s/headlamp:v0.26  │
│    port: 4466                                   │
│    volumes: headlamp-kubeconfig (Secret)         │
│    security: runAsUser 1001, readOnlyRoot        │
└──────────────┬──────────────────────────────────┘
               │ kubeconfig -> user cluster API
               v
USER CLUSTER
┌─────────────────────────────────────────────────┐
│  ClusterRole: system:headlamp (read-only)       │
│  ClusterRoleBinding: system:headlamp            │
│  Namespace: headlamp                            │
│                                                 │
│  NO deployments, services, secrets, or SAs      │
└─────────────────────────────────────────────────┘
```

**Design spec:** `docs/superpowers/specs/2026-03-31-headlamp-integration-design.md`

---

## Pros / Benefits

### 1. Official Successor & Active Maintenance
- Kubernetes SIG UI project, CNCF Sandbox
- Regular releases with security patches
- Kubernetes docs officially recommend Headlamp over the retired dashboard

### 2. Dramatically Simpler User-Cluster Footprint
| Resource Type           | Kubernetes Dashboard | Headlamp |
|------------------------|---------------------|----------|
| User-cluster Deployments | 2 (dashboard + scraper) | 0 |
| User-cluster Secrets     | 3 (kubeconfig, JWE, CSRF) | 0 |
| User-cluster Services    | 1 (metrics-scraper) | 0 |
| User-cluster SAs         | 1 | 0 |
| Cluster-scoped RBAC      | ClusterRole (metrics only) | ClusterRole (read-only browse) |
| Namespaced RBAC          | Role + RoleBinding | None |

### 3. Lower Resource Consumption
| Metric | Kubernetes Dashboard (total) | Headlamp |
|--------|------------------------------|----------|
| Memory Requests | 512Mi | 128Mi |
| CPU Requests | 200m | 100m |
| Memory Limits | 1Gi | 256Mi |
| CPU Limits | 500m | 250m |

### 4. Full CRD Auto-Discovery
- Automatically discovers and displays all Custom Resources
- Kubernetes Dashboard has limited/no CRD browsing

### 5. Plugin Extensibility
- TypeScript/React plugin architecture
- Existing plugins: Cert Manager, KEDA, Flux, Knative, Karpenter
- Potential for KKP-specific plugins in the future

### 6. Better Authentication Model
- Works directly with kubeconfig (no JWE/CSRF token dance)
- Native OIDC support (Keycloak, Azure Entra ID, etc.)
- Fully respects Kubernetes RBAC without custom auth layer

### 7. Modern UI Features
- Application topology "Map" view per namespace
- Web-based terminal and log viewing
- Built-in port forwarding from UI
- Inline YAML editing
- Enhanced search with label and multi-item support

### 8. Multi-Cluster Capable
- First-class multi-cluster support (future potential for KKP)
- Desktop app option for local development workflows

### 9. AI Assistant (2025+)
- Natural language queries: "Is my app healthy?", "Why is my pod not running?"

---

## Cons / Risks

### 1. CNCF Sandbox Maturity
- Not yet Incubating or Graduated
- Smaller community than some alternatives (Lens, Rancher UI)
- Mitigated by official SIG UI backing

### 2. Broader RBAC Requirements
- Needs cluster-wide read access (`get/list/watch` on `*` across many API groups)
- Kubernetes Dashboard used narrower namespaced Role + limited ClusterRole
- **Trade-off:** More user visibility but wider permission surface

### 3. Known Bugs & Edge Cases
- TypeError crashes on network tab with undefined service ports
- Limited error handling for restricted token scenarios

### 4. Migration Complexity
- Both dashboards must coexist during transition period
- API type changes (`Headlamp` struct alongside `KubernetesDashboard`)
- Proxy endpoint changes for KKP UI integration
- OIDC integration with KKP's existing auth flow is an open question

### 5. Open Questions
- **RunAs UID:** Helm chart defaults to UID 100/GID 101; KKP spec uses 1001 — needs verification
- **Plugin loading:** How to configure/load plugins in seed-side deployment is undefined
- **No built-in LDAP:** Organizations using LDAP need an OIDC bridge (Dex, Keycloak)

---

## Side-by-Side Comparison

```
+---------------------------+------------------------+------------------------+
| Aspect                    | Kubernetes Dashboard   | Headlamp               |
+---------------------------+------------------------+------------------------+
| Project Status            | RETIRED / Archived     | ACTIVE / SIG UI        |
| Security Updates          | None                   | Regular                |
| CNCF Status               | N/A                    | Sandbox                |
| User-Cluster Deployments  | 2 (dashboard + scraper)| 0 (seed-side only)     |
| User-Cluster Secrets      | 3                      | 0                      |
| User-Cluster Services     | 1                      | 0                      |
| Container Port            | 9090                   | 4466                   |
| CRD Support               | Limited                | Full auto-discovery    |
| Plugin System             | No                     | Yes (TypeScript/React) |
| OIDC Native               | No                     | Yes                    |
| Multi-Cluster             | No                     | Yes                    |
| RBAC Scope                | Narrow (namespaced)    | Broad (cluster-wide)   |
| Memory Requests (total)   | 512Mi                  | 128Mi                  |
| CPU Requests (total)      | 200m                   | 100m                   |
+---------------------------+------------------------+------------------------+
```

---

## Recommendation

**Migrate to Headlamp.** The benefits clearly outweigh the risks:

1. The current dashboard is a dead project with no security patches
2. Headlamp reduces user-cluster resource footprint to near zero
3. The seed-side deployment pattern is already designed and validated
4. Both dashboards can coexist during migration, minimizing disruption
5. ~75% reduction in memory requests, ~50% reduction in CPU requests

**Key items to resolve before production:**
1. OIDC integration with KKP's auth flow
2. RunAs UID verification (100 vs 1001)
3. Plugin loading strategy for seed-side deployment
4. Proxy endpoint implementation for KKP UI
