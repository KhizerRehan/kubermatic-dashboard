# Headlamp Migration: Complete Explanation & Rationale

## Why Are We Doing This?

The Kubernetes Dashboard project has been **officially retired and archived** by the Kubernetes community. The repository (`github.com/kubernetes-retired/dashboard`) receives no security patches, no bug fixes, and no new features. Every day KKP continues to deploy it to user clusters, we are shipping a known-dead component with growing security exposure.

Headlamp (`github.com/kubernetes-sigs/headlamp`) is the community's chosen successor — a modern, extensible Kubernetes web UI maintained under the `kubernetes-sigs` organization with active CNCF backing.

---

## The Two Approaches We Evaluated

We evaluated two fundamentally different architectures before settling on one. Understanding why we rejected the first is critical to understanding why the chosen approach is correct.

### Approach A: Application Framework (REJECTED)

This was proposed in the earlier plans (`ai/plans/deprecated/headlamp-migration.plan.md` and `headlamp-migration-v2.plan.md`).

```
REJECTED: Application Framework Approach

                    Seed Cluster
                    ┌────────────────────────────┐
                    │ ApplicationDefinition      │
                    │   name: headlamp           │
                    │   method: helm             │
                    │   default: true            │
                    │                            │
                    │ ApplicationInstallation    │
                    │   (one per user cluster)   │─────── Helm Install ──┐
                    └────────────────────────────┘                       │
                                                                        ▼
                    User Cluster
                    ┌────────────────────────────┐
                    │ headlamp namespace         │
                    │   ├── Deployment (Helm)    │  ◄── Dashboard runs HERE
                    │   ├── Service (Helm)       │
                    │   ├── RBAC (Helm)          │
                    │   └── OIDC config (Helm)   │
                    └────────────────────────────┘
```

**Why was this rejected?**

1. **Architecture change too large.** The current Kubernetes Dashboard runs on the **seed cluster**. Moving to the Application Framework would mean moving the dashboard into the **user cluster**. This fundamentally changes the security model, access patterns, and how users reach the dashboard.

2. **Security model regression.** With the current approach, dashboard credentials (kubeconfig) stay on the seed cluster — the user cluster never sees them. With Application Framework, the dashboard would run inside the user cluster with direct API access. This is a weaker security boundary.

3. **Core component on optional framework.** The Application Framework is designed for optional add-ons (cert-manager, ArgoCD, nginx). Making a core platform component (the cluster dashboard) dependent on it creates a coupling that doesn't exist today. If the Application Framework has issues, the dashboard breaks.

4. **Harder migration path.** Migrating from seed-side to user-cluster-side requires changing how every existing cluster's dashboard is accessed. The old resources need to be cleaned up across two different locations. With the seed-side approach, you're just swapping one seed deployment for another.

5. **CRD field rename required.** The Application Framework approach demanded renaming `kubernetesDashboard` to `headlamp` immediately, affecting every Cluster CRD object. This is a breaking change that requires careful orchestration with the frontend.

### Approach B: Seed-Side Go Reconcilers (CHOSEN)

This is documented in `docs/superpowers/specs/2026-03-31-headlamp-integration-design.md` and implemented via `ai/plans/headlamp-seed-side-impl.plan.md`.

```
 Seed-Side Approach

                    Seed Cluster (cluster-xyz namespace)
                    ┌────────────────────────────┐
                    │ Deployment: headlamp       │  ◄── Dashboard runs HERE
                    │   (2 replicas)             │      (same as current k8s-dash)
                    │   Image: headlamp:v0.26.0  │
                    │   Port: 4466               │
                    │                            │
                    │ Secret: headlamp-kubeconfig │
                    │   (cert: kubermatic:headlamp)│
                    └──────────────┬─────────────┘
                                   │ kubeconfig
                                   ▼
                    User Cluster
                    ┌────────────────────────────┐
                    │ Namespace: headlamp        │
                    │ ClusterRole: system:headlamp│  ◄── MUCH simpler
                    │ ClusterRoleBinding          │      (no deployments,
                    │                            │       no secrets,
                    │ That's it. Nothing else.   │       no services)
                    └────────────────────────────┘
```

---

## Why Seed-Side Was Chosen: The Full Rationale

### 1. Minimal blast radius — "Same pattern, different binary"

The current Kubernetes Dashboard is deployed as a **Go-reconciled Deployment in the seed cluster's per-user-cluster namespace**. By using the exact same pattern for Headlamp, we change only **what** is deployed, not **how** or **where**.

```
What changes:                      What stays the same:
─────────────────                  ──────────────────────
Container image                    Deployment location (seed)
Container port (9090 → 4466)      Access model (kubeconfig to user cluster)
Binary command                     Security boundary (creds on seed)
Resource requirements              Health check pattern
                                   Reconciler integration points
                                   User-facing access via KKP proxy
```

This means:
- **No architectural migration** — just a component swap
- **No security model change** — credentials stay on the seed
- **No access pattern change** — users reach the dashboard the same way
- **Existing monitoring/alerting works** — just a different health field name
### 3. Simpler user-cluster footprint

The current Kubernetes Dashboard requires **11 Go files** to manage user-cluster resources:
- metrics-scraper Deployment (2 replicas)
- metrics-scraper Service
- metrics-scraper ServiceAccount
- Role + RoleBinding
- ClusterRole + ClusterRoleBinding
- key-holder Secret + CSRF Secret
- Namespace

Headlamp needs only **4 Go files**:
- Namespace
- ClusterRole (read access)
- ClusterRoleBinding
- Deletion list

```
Resource Count Comparison:

kubernetes-dashboard (user cluster):     headlamp (user cluster):
┌────────────────────────────────┐       ┌──────────────────────┐
│ 1 Namespace                    │       │ 1 Namespace          │
│ 1 Deployment (metrics-scraper) │       │ 1 ClusterRole        │
│ 1 Service                      │       │ 1 ClusterRoleBinding │
│ 1 ServiceAccount               │       │                      │
│ 1 Role                         │       │ Total: 3 resources   │
│ 1 RoleBinding                  │       └──────────────────────┘
│ 1 ClusterRole                  │
│ 1 ClusterRoleBinding           │
│ 2 Secrets (key-holder, csrf)   │
│                                │
│ Total: 10 resources            │
└────────────────────────────────┘
```

**Why is Headlamp simpler?**
- **Built-in resource browsing** — Headlamp doesn't need a separate metrics-scraper. It reads the Kubernetes metrics API directly.
- **Auth via kubeconfig** — Headlamp authenticates using the mounted kubeconfig secret. No JWE key-holder or CSRF token needed.
- **No in-cluster service** — Since Headlamp runs on the seed, there's no service to expose inside the user cluster.


