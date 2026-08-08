# Headlamp Integration Design — Seed-Side Per-User-Cluster Deployment

**Date:** 2026-03-31
**Issue:** https://github.com/kubermatic/kubermatic/issues/15287
**Status:** Draft

## Context

The Kubernetes Dashboard project has been retired (`kubernetes-retired/dashboard`). KKP needs to migrate to [Headlamp](https://github.com/kubernetes-sigs/headlamp), a modern Kubernetes web UI under `kubernetes-sigs`.

Previous plans proposed deploying Headlamp via the KKP Application Framework (Helm chart in user clusters). This design takes a different approach: deploy Headlamp on the **seed cluster** in the per-user-cluster namespace, mirroring the exact pattern used by the current kubernetes-dashboard implementation.

### Design Decisions

1. **Per-user-cluster deployment on seed** — not Application Framework, not shared instance
2. **Add `Headlamp` API field alongside deprecated `KubernetesDashboard`** — backward-compatible migration
3. **Use existing cluster reconciler** — not a new standalone controller
4. **Scope: Add Headlamp only** — old dashboard code remains intact for now

---

## Architecture

```
SEED CLUSTER (per user cluster namespace: cluster-xxx)
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Deployment: headlamp (2 replicas)                   │
│    image: ghcr.io/headlamp-k8s/headlamp:v0.26.0     │
│    args: -kubeconfig /etc/kubernetes/kubeconfig        │
│          -html-static-dir /headlamp/frontend         │
│    port: 4466                                        │
│    volumes:                                          │
│      - headlamp-kubeconfig (Secret)                  │
│      - tmp-volume (EmptyDir)                         │
│    security: runAsUser 1001, readOnlyRootFilesystem   │
│                                                      │
│  Secret: headlamp-kubeconfig                         │
│    (auto-generated via GetInternalKubeconfigReconciler│
│     cert username: kubermatic:headlamp)              │
│                                                      │
└──────────────┬───────────────────────────────────────┘
               │ kubeconfig → user cluster API server
               ▼
USER CLUSTER
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Namespace: headlamp (PSA baseline labels)           │
│                                                      │
│  ClusterRole: system:headlamp                        │
│    - read access to cluster-scoped resources         │
│    - (namespaces, nodes, CRDs, etc.)                 │
│                                                      │
│  ClusterRoleBinding: system:headlamp                 │
│    subject: User "kubermatic:headlamp"               │
│    roleRef: ClusterRole "system:headlamp"            │
│                                                      │
│  NO deployments, services, or secrets in user cluster│
│                                                      │
└──────────────────────────────────────────────────────┘
```

### How It Differs from kubernetes-dashboard

| Aspect | kubernetes-dashboard | headlamp |
|--------|---------------------|----------|
| Seed Deployment | `kubernetes-dashboard` (v2.7.0) | `headlamp` (v0.26.0) |
| Container Port | 9090 | 4466 |
| User-cluster Deployments | `dashboard-metrics-scraper` | None |
| User-cluster RBAC | Namespaced Role + ClusterRole for metrics | ClusterRole only (full cluster browsing) |
| User-cluster Secrets | JWE key-holder + CSRF token | None |
| User-cluster ServiceAccount | `dashboard-metrics-scraper` | None |
| User-cluster Service | `dashboard-metrics-scraper:8000` | None |
| Container Image | `kubernetesui/dashboard` | `ghcr.io/headlamp-k8s/headlamp` |

Headlamp is simpler on the user-cluster side because:
- It has built-in resource browsing (no metrics-scraper sidecar needed)
- It handles auth via the kubeconfig (no JWE/CSRF secrets needed)
- It needs cluster-wide read access (ClusterRole) since it's a full cluster browser

---

## API Changes

### New Types (`sdk/apis/kubermatic/v1/cluster.go`)

```go
// Headlamp contains settings for the Headlamp component as part of the cluster control plane.
type Headlamp struct {
    // Controls whether Headlamp is deployed to the user cluster or not.
    // Enabled by default.
    Enabled bool `json:"enabled,omitempty"`
}
```

### New Field on ClusterSpec

```go
// Headlamp holds the configuration for the Headlamp web UI component.
Headlamp *Headlamp `json:"headlamp,omitempty"`
```

### New Method on ClusterSpec

```go
func (c ClusterSpec) IsHeadlampEnabled() bool {
    return c.Headlamp == nil || c.Headlamp.Enabled
}
```

### New Health Field on ClusterHealth

```go
Headlamp *HealthStatus `json:"headlamp,omitempty"`
```

### Deprecation of KubernetesDashboard

The existing `KubernetesDashboard` field and `IsKubernetesDashboardEnabled()` method remain unchanged. They are NOT removed in this scope. Deprecation will be handled in a future task.

---

## New Constants (`pkg/resources/resources.go`)

```go
HeadlampDeploymentName          = "headlamp"
HeadlampKubeconfigSecretName    = "headlamp-kubeconfig"
HeadlampCertUsername            = "kubermatic:headlamp"
HeadlampClusterRoleName         = "system:headlamp"
HeadlampClusterRoleBindingName  = "system:headlamp"
```

> **Note:** The namespace constant `"headlamp"` lives in the user-cluster package `constants.go` (matching the kubernetes-dashboard pattern), NOT in `resources.go`.

---

## Files to Create

### Seed-Side Resources: `pkg/resources/headlamp/`

**`deployment.go`** — Mirrors `pkg/resources/kubernetes-dashboard/deployment.go`
- `headlampData` interface: `Cluster() *kubermaticv1.Cluster`, `RewriteImage(string) (string, error)`
- `DeploymentReconciler(data headlampData)` returning `NamedDeploymentReconcilerFactory`
- Image: `registry.Must(data.RewriteImage("ghcr.io/headlamp-k8s/headlamp:v0.26.0"))` (supports custom registries)
- Command: `["/headlamp/headlamp-server"]`
- Args: `["-kubeconfig", "/etc/kubernetes/kubeconfig/kubeconfig", "-html-static-dir", "/headlamp/frontend"]`
- Port: 4466
- 2 replicas with `HostnameAntiAffinity(name, AntiAffinityTypePreferred)`
- SecurityContext: `runAsUser: 1001`, `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false`
- Resource requirements:
  ```go
  Requests: cpu=100m, memory=128Mi
  Limits:   cpu=250m, memory=256Mi
  ```
- `apiserver.IsRunningWrapper` to wait for user cluster API server
- kubeconfig secret volume mount at `/etc/kubernetes/kubeconfig`
- `ImagePullSecrets: []corev1.LocalObjectReference{{Name: resources.ImagePullSecretName}}`
- Annotations: `ClusterLastRestartAnnotation`, `ClusterAutoscalerSafeToEvictVolumesAnnotation` for tmp-volume
- `HeadlampVersion()` function for version mapping

**`deletion.go`** — Mirrors `pkg/resources/kubernetes-dashboard/deletion.go`
- `ResourcesForDeletion(namespace string) []ctrlruntimeclient.Object` — takes namespace parameter (the per-user-cluster namespace on seed)
- Returns Deployment and kubeconfig Secret in the given namespace

### User-Cluster Resources: `pkg/controller/user-cluster-controller-manager/resources/resources/headlamp/`

**`constants.go`**
```go
const (
    Namespace = "headlamp"
    AppName   = "headlamp"
)
```

**`namespace.go`** — Creates `headlamp` namespace with PSA baseline labels

**`clusterrole.go`** — ClusterRole `system:headlamp` granting read access to cluster resources

> **Security note:** Headlamp is a full cluster browser, so it requires broad read access. The `rbac.authorization.k8s.io` group grants read access to roles and bindings — this is intentional for Headlamp's RBAC visibility feature but should be reviewed if more restrictive access is needed.

```go
Rules: []rbacv1.PolicyRule{
    {
        APIGroups: []string{"", "apps", "batch", "networking.k8s.io",
                            "rbac.authorization.k8s.io", "storage.k8s.io",
                            "apiextensions.k8s.io", "policy", "autoscaling"},
        Resources: []string{"*"},
        Verbs:     []string{"get", "list", "watch"},
    },
    {
        APIGroups: []string{"metrics.k8s.io"},
        Resources: []string{"pods", "nodes"},
        Verbs:     []string{"get", "list", "watch"},
    },
}
```

**`clusterrolebinding.go`** — Binds ClusterRole to User `kubermatic:headlamp`

**`deletion.go`** — `ResourcesForDeletion() []ctrlruntimeclient.Object` (no parameters — uses package constants)
- Returns: ClusterRole, ClusterRoleBinding, Namespace

---

## Reconciler Integration Points

### Seed Controller Manager

**`pkg/controller/seed-controller-manager/kubernetes/resources.go`:**

1. In `GetDeploymentReconcilers` (~line 440):
   ```go
   if data.Cluster().Spec.IsHeadlampEnabled() {
       deployments = append(deployments, headlamp.DeploymentReconciler(data))
   }
   ```

2. In `ensureSecrets` (~line 555):
   ```go
   if data.Cluster().Spec.IsHeadlampEnabled() {
       creators = append(creators,
           resources.GetInternalKubeconfigReconciler(
               namespace,
               resources.HeadlampKubeconfigSecretName,
               resources.HeadlampCertUsername,
               nil, data, r.log,
           ),
       )
   }
   ```

3. In `ensureResourcesAreDeployed` (~line 207):
   ```go
   if !cluster.Spec.IsHeadlampEnabled() {
       if err := r.ensureHeadlampResourcesAreRemoved(ctx, data); err != nil {
           return nil, err
       }
   }
   ```

**`pkg/controller/seed-controller-manager/kubernetes/health.go`:**

Add `headlampHealthCheck` method (same pattern as `kubernetesDashboardHealthCheck`):
```go
if cluster.Spec.IsHeadlampEnabled() {
    status, err := r.headlampHealthCheck(ctx, cluster, ns)
    // ...
    extendedHealth.Headlamp = &status
}
```

### User-Cluster Controller Manager

**`pkg/controller/user-cluster-controller-manager/resources/reconciler.go`:**

1. Add `headlampEnabled bool` to `reconcileData` struct
2. Set from `cluster.Spec.IsHeadlampEnabled()` during data init
3. Wire into existing reconcile methods following the exact same pattern as `kubernetesDashboardEnabled`:

   **Methods that NEED headlamp wiring:**
   - `reconcileNamespaces`: append `headlamp.NamespaceReconciler`
   - `reconcileClusterRoles`: append `headlamp.ClusterRoleReconciler()`
   - `reconcileClusterRoleBindings`: append `headlamp.ClusterRoleBindingReconciler()`
   - Cleanup block (~line 297): `ensureHeadlampResourcesAreRemoved` when disabled

   **Methods that do NOT need headlamp wiring (intentionally omitted — headlamp has no user-cluster deployments, services, secrets, roles, role bindings, or service accounts):**
   - `reconcileDeployments` — no in-cluster deployment (unlike metrics-scraper)
   - `reconcileServices` — no in-cluster service
   - `reconcileServiceAccounts` — no in-cluster service account
   - `reconcileRoles` — using ClusterRole instead of namespaced Role
   - `reconcileRoleBindings` — using ClusterRoleBinding instead
   - `reconcileSecrets` — no JWE/CSRF secrets needed

### Defaulting

**`pkg/defaulting/cluster.go`:**
```go
if spec.Headlamp == nil {
    spec.Headlamp = &kubermaticv1.Headlamp{
        Enabled: true,
    }
}
```

### Image Registration

**`pkg/install/images/images.go`:**
Add headlamp image to the list of images to mirror/preload.

---

## Verification Plan

1. **CRD generation** — Run CRD generation to include the new `headlamp` field in cluster CRD schemas
2. **Unit tests** — Add deployment reconciler golden tests (like existing `deployment-*-kubernetes-dashboard.yaml` fixtures)
3. **Manual testing** — Deploy a user cluster with `headlamp.enabled: true`, verify:
   - Headlamp deployment appears in seed cluster namespace
   - Headlamp kubeconfig secret is created
   - ClusterRole and ClusterRoleBinding exist in user cluster
   - Health check reports healthy
4. **Disable testing** — Set `headlamp.enabled: false`, verify all resources cleaned up
5. **Coexistence** — Verify both kubernetes-dashboard and headlamp can run simultaneously during migration period

---

## Validated: Headlamp Server Flags and Out-of-Cluster Behavior

**Tested 2026-03-31** — Docker container with mounted kubeconfig, validated against live dev cluster.

### Confirmed Flags (from `/headlamp/headlamp-server -help`)

| Flag | Default | Our Usage |
|------|---------|-----------|
| `-kubeconfig` | `""` | `/etc/kubernetes/kubeconfig/kubeconfig` (mount path) |
| `-in-cluster` | `false` | Leave as default (don't set) |
| `-port` | `4466` | Use default |
| `-plugins-dir` | `~/.config/Headlamp/plugins` | `/headlamp/plugins` |
| `-html-static-dir` | `""` | `/headlamp/frontend` |
| `-base-url` | `""` | May set for routing |
| `-insecure-ssl` | `false` | May need for self-signed API server certs |

### Container Details

- **Binary**: `/headlamp/headlamp-server`
- **Image**: `ghcr.io/headlamp-k8s/headlamp:v0.26.0`
- **Static dir**: `/headlamp/frontend` (already in the container)
- **Plugins dir**: `/headlamp/plugins` (already in the container)
- **RunAs**: user `headlamp` (UID 100, GID 101 per Helm chart defaults)

### Test Results

```
✓ Starts with -kubeconfig /etc/kubernetes/kubeconfig/kubeconfig
✓ Proxy setup to external cluster API server
✓ 34 namespaces, 12 nodes, deployments all browsable via API proxy
✓ No auth prompt (kubeconfig provides authentication)
✓ Port 4466 works
✓ No -in-cluster flag needed (defaults to false)
```

### Deployment Command for Seed

```
Command: ["/headlamp/headlamp-server"]
Args:
  - "-kubeconfig"
  - "/etc/kubernetes/kubeconfig/kubeconfig"
  - "-html-static-dir"
  - "/headlamp/frontend"
```

## Remaining Open Questions (Follow-up)

1. **Plugin support** — Headlamp supports plugins (Cert Manager, KEDA, Flux). How/whether to configure plugin loading on the seed-side deployment should be investigated as a follow-up
2. **OIDC integration** — How Headlamp's OIDC auth integrates with KKP's OIDC setup — defer to follow-up
3. **RunAs UID** — Helm chart defaults to UID 100/GID 101, but our spec uses 1001 (matching k8s-dashboard). Need to verify which UID the container image supports
