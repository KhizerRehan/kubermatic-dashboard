# Import Ordering, Aliases, and Package Repositories

This codebase enforces both **import ordering** (via [gimps](https://github.com/xrstf/gimps)) and **strict import aliasing** (via golangci-lint).

## Import Ordering

Imports must be grouped in this order, separated by blank lines (configured in `.gimps.yaml`):

1. **std** — Go standard library (`fmt`, `context`, `net/http`, etc.)
2. **external** — Third-party packages (`github.com/gorilla/mux`, `github.com/Masterminds/semver/v3`, etc.)
3. **kubermatic** — Kubermatic ecosystem: `k8c.io/**`, `github.com/kubermatic/**`
4. **kubernetes** — Upstream Kubernetes: `k8s.io/**`, `*.k8s.io/**` (e.g., `sigs.k8s.io`)

## Kubermatic Ecosystem (`k8c.io/**`)

All `k8c.io` packages belong to the Kubermatic organization. When debugging issues or tracing code from these packages, look in the corresponding GitHub repo:

| Import Module | GitHub Repository | Purpose |
|---|---|---|
| `k8c.io/dashboard` | `kubermatic/dashboard` | This repo (self-reference) |
| `k8c.io/kubermatic` | `kubermatic/kubermatic` | Core KKP platform (APIs, SDK, controllers, resources) |
| `k8c.io/machine-controller` | `kubermatic/machine-controller` | Node provisioning and machine management |
| `k8c.io/operating-system-manager` | `kubermatic/operating-system-manager` | OS profiles for machine provisioning |
| `k8c.io/kubeone` | `kubermatic/kubeone` | Cluster lifecycle management |
| `k8c.io/kubelb` | `kubermatic/kubelb` | Load balancer management |
| `k8c.io/reconciler` | `kubermatic/reconciler` | Generic Kubernetes reconciler utilities |

### Required Aliases (Kubermatic)

```go
import (
    apiv1 "k8c.io/kubermatic/sdk/v2/api/v1"
    apiv2 "k8c.io/kubermatic/sdk/v2/api/v2"
    appskubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/apps.kubermatic/v1"
    kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
    utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
    authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
    clusterv1alpha1 "k8c.io/machine-controller/sdk/apis/cluster/v1alpha1"
)
```

## Kubernetes Ecosystem (`k8s.io/**`, `sigs.k8s.io/**`)

All `k8s.io` and `sigs.k8s.io` packages are upstream Kubernetes projects. Issues in these packages are upstream — file bugs at `kubernetes/kubernetes` or the respective SIG repo, not at Kubermatic.

| Import Module | GitHub Repository | Purpose |
|---|---|---|
| `k8s.io/api` | `kubernetes/api` | Core API types (core, batch, rbac, networking, storage) |
| `k8s.io/apimachinery` | `kubernetes/apimachinery` | Shared types, utilities, runtime, serialization |
| `k8s.io/apiextensions-apiserver` | `kubernetes/apiextensions-apiserver` | CRD support |
| `k8s.io/apiserver` | `kubernetes/apiserver` | API server libraries (storage, auth) |
| `k8s.io/client-go` | `kubernetes/client-go` | Kubernetes Go client, informers, REST config |
| `k8s.io/kubectl` | `kubernetes/kubectl` | kubectl utilities (scheme, port-forward) |
| `k8s.io/metrics` | `kubernetes/metrics` | Metrics API types (v1beta1) |
| `k8s.io/klog/v2` | `kubernetes/klog` | Structured logging |
| `k8s.io/utils` | `kubernetes/utils` | General utilities (`ptr`, etc.) |
| `sigs.k8s.io/controller-runtime` | `kubernetes-sigs/controller-runtime` | Controller framework (client, cache, manager, reconcile) |
| `sigs.k8s.io/controller-tools` | `kubernetes-sigs/controller-tools` | Code generation for controllers |
| `sigs.k8s.io/yaml` | `kubernetes-sigs/yaml` | YAML serialization |

### Required Aliases (Kubernetes)

```go
import (
    corev1 "k8s.io/api/core/v1"
    appsv1 "k8s.io/api/apps/v1"
    rbacv1 "k8s.io/api/rbac/v1"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
    apierrors "k8s.io/apimachinery/pkg/api/errors"
    kerrors "k8s.io/apimachinery/pkg/util/errors"
    ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)
```

## External Packages

### Required Aliases (External)

```go
import (
    semverlib "github.com/Masterminds/semver/v3"
)
```

**Note**: The linter enforces these aliases and will fail if you use different ones or import without aliases where required.
