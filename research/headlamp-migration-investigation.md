# Headlamp Migration Investigation

> Investigation into how Kubernetes Dashboard is currently deployed per user cluster in KKP,
> and the challenges of switching to Headlamp.
>
> Tracking Issue: [kubermatic/kubermatic#15287](https://github.com/kubermatic/kubermatic/issues/15287)

---

## Table of Contents

1. [Current Architecture Overview](#1-current-architecture-overview)
2. [Deployment Layer (kubermatic/kubermatic)](#2-deployment-layer)
3. [API Proxy Layer (kubermatic/dashboard)](#3-api-proxy-layer)
4. [Frontend Layer (Angular)](#4-frontend-layer)
5. [End-to-End Flow: Opening the Dashboard](#5-end-to-end-flow)
6. [Headlamp Overview](#6-headlamp-overview)
7. [Migration Challenges](#7-migration-challenges)
8. [Required Changes Per Repository](#8-required-changes-per-repository)
9. [Recommended Approach](#9-recommended-approach)
10. [Open Questions](#10-open-questions)

---

## 1. Current Architecture Overview

The Kubernetes Dashboard integration in KKP operates across **three layers** spanning **two repositories**:

```mermaid
graph TB
    subgraph "kubermatic/dashboard (this repo)"
        subgraph "Angular Frontend"
            UI["Cluster Details Page<br/>'Open Dashboard' button"]
        end
        subgraph "Go API Server"
            LOGIN["/api/v2/dashboard/login<br/>OIDC Login Handler"]
            PROXY["/api/v2/projects/{id}/clusters/{id}/dashboard/proxy<br/>Reverse Proxy Handler"]
            DIR["Director<br/>Path rewriting + Auth header"]
        end
    end

    subgraph "kubermatic/kubermatic (external repo)"
        subgraph "Seed Cluster (per user cluster namespace)"
            DEPLOY["Deployment<br/>kubernetesui/dashboard:v2.7.0<br/>2 replicas, port 9090"]
            SVC["Service<br/>app=kubernetes-dashboard"]
            RBAC_RES["RBAC Resources<br/>ClusterRole/Binding"]
            HEALTH["Health Check Controller<br/>ClusterHealth.KubernetesDashboard"]
        end
    end

    subgraph "User's Browser"
        BROWSER["New Tab"]
    end

    UI -->|"1. Click 'Open Dashboard'"| LOGIN
    LOGIN -->|"2. OIDC redirect + callback"| PROXY
    PROXY -->|"3. Port-forward to pod"| DEPLOY
    DIR -->|"4. Strip path, set Bearer token"| DEPLOY
    PROXY -->|"5. Reverse proxy response"| BROWSER

    style UI fill:#4CAF50,color:white
    style LOGIN fill:#2196F3,color:white
    style PROXY fill:#2196F3,color:white
    style DEPLOY fill:#FF9800,color:white
    style HEALTH fill:#FF9800,color:white
```

### Key Configuration Points

| Setting | Location | Default | Purpose |
|---------|----------|---------|---------|
| `GlobalSettings.EnableDashboard` | Admin Settings | `true` | Global on/off for all clusters |
| `ClusterSpec.KubernetesDashboard.Enabled` | Per-Cluster | `true` | Per-cluster deployment toggle |
| `ClusterHealth.KubernetesDashboard` | Health Status | - | Tracks pod health |

---

## 2. Deployment Layer

> Repository: `kubermatic/kubermatic` -- Package: `pkg/resources/kubernetes-dashboard/`

The Kubernetes Dashboard is deployed **per user cluster** in the **seed cluster's namespace** for that cluster.

```mermaid
graph LR
    subgraph "Seed Cluster"
        subgraph "Namespace: cluster-xyz-abc"
            DEP["Deployment<br/>kubernetes-dashboard<br/>2 replicas"]
            POD1["Pod 1<br/>:9090"]
            POD2["Pod 2<br/>:9090"]
            SECRET["Secret<br/>kubernetes-dashboard-kubeconfig"]
            SA["ServiceAccount"]
            CR["ClusterRole"]
            CRB["ClusterRoleBinding"]
        end
        subgraph "Namespace: cluster-def-ghi"
            DEP2["Deployment<br/>kubernetes-dashboard<br/>(another user cluster)"]
        end
    end

    DEP --> POD1
    DEP --> POD2
    POD1 -.->|"mounts"| SECRET
    POD2 -.->|"mounts"| SECRET
    SA --> CRB
    CR --> CRB
```

### Deployment Specification

| Property | Value |
|----------|-------|
| **Image** | `kubernetesui/dashboard:v2.7.0` |
| **Container Port** | `9090` (HTTP, insecure login) |
| **Label Selector** | `app=kubernetes-dashboard` |
| **Replicas** | 2 (with anti-affinity) |
| **Auth** | Mounted kubeconfig secret (`kubernetes-dashboard-kubeconfig`) |
| **Flags** | `--enable-insecure-login` |
| **Health Tracking** | `ClusterHealth.KubernetesDashboard` |
| **Enabled by Default** | Yes (`ClusterSpec.KubernetesDashboard.Enabled = true`) |

### How it gets deployed

The cluster controller in the kubermatic repo reconciles the `Cluster` CR. When `KubernetesDashboard.Enabled` is true, it creates the Deployment, Service, RBAC, and Secret resources in the cluster's seed namespace. When the cluster is deleted, `deletion.go` cleans up these resources.

---

## 3. API Proxy Layer

> Repository: `kubermatic/dashboard` -- Package: `modules/api/pkg/handler/v2/kubernetes-dashboard/`

The Go API acts as a **reverse proxy** between the user's browser and the Kubernetes Dashboard pod running in the seed cluster. This involves OIDC authentication and port-forwarding.

### Handler Files

```
modules/api/pkg/handler/v2/kubernetes-dashboard/
    handler.go      -- Base handler interface, isEnabled() global settings check
    login.go        -- OIDC login redirect and callback endpoints
    proxy.go        -- Reverse proxy via port-forward to dashboard pod
    director.go     -- Strips KKP API prefix, sets Authorization header
    request.go      -- Request types (InitialRequest, OIDCCallbackRequest, ProxyRequest)
    response.go     -- Response types carrying tokens and OIDC state
```

### Route Registration

File: `modules/api/pkg/handler/v2/routes_v2.go` (lines 1137-1157)

```
Login Handler:
  GET /api/v2/dashboard/login?projectID={}&clusterID={}    --> OIDC redirect
  GET /api/v2/dashboard/login?state={}&code={}             --> OIDC callback

Proxy Handler:
  GET /api/v2/projects/{id}/clusters/{id}/dashboard/proxy?token={}  --> Store token in cookie
  *   /api/v2/projects/{id}/clusters/{id}/dashboard/proxy/**        --> Reverse proxy
```

### Port-Forward Mechanism

From `proxy.go` (lines 219-251):

```mermaid
sequenceDiagram
    participant Browser
    participant KKP API
    participant Seed K8s API
    participant Dashboard Pod

    Browser->>KKP API: GET /dashboard/proxy/...
    Note over KKP API: Read token from "proxy" cookie
    KKP API->>Seed K8s API: Create port-forward tunnel<br/>label: app=kubernetes-dashboard<br/>port: 9090
    Seed K8s API->>Dashboard Pod: TCP tunnel established
    Note over KKP API: proxyURL = http://127.0.0.1:{localPort}
    KKP API->>Dashboard Pod: Reverse proxy request<br/>Authorization: Bearer {OIDC token}<br/>Path: stripped after "proxy"
    Dashboard Pod->>KKP API: Response (HTML/JS/API)
    Note over KKP API: Override CSP: style-src 'self' 'unsafe-inline'
    KKP API->>Browser: Proxied response
    Note over KKP API: Close port-forward
```

**Important**: A new port-forward is opened **per request**. There is a TODO comment in the code to cache these for better performance.

### Path Rewriting (director.go)

The `getBasePath()` function strips everything before "proxy" in the URL path:

```
Input:  /api/v2/projects/abc/clusters/xyz/dashboard/proxy/api/v1/pods
Output: /api/v1/pods

Input:  /api/v2/projects/abc/clusters/xyz/dashboard/proxy/
Output: /
```

### Key Constants (imported from kubermatic repo)

```go
import kubernetesdashboard "k8c.io/kubermatic/v2/pkg/resources/kubernetes-dashboard"

// Used to find and port-forward to the dashboard pod:
kubernetesdashboard.AppLabel      // "kubernetes-dashboard" (pod label selector)
kubernetesdashboard.ContainerPort // 9090 (HTTP port)
```

---

## 4. Frontend Layer

> Repository: `kubermatic/dashboard` -- Module: `modules/web/`

### Components Involved

```mermaid
graph TD
    subgraph "Cluster Details Page"
        BTN["'Open Dashboard' Button<br/>template.html:66-82"]
        HEALTH_CHECK["isKubernetesDashboardHealthy<br/>component.ts:159-161"]
        PROXY_URL["getProxyURL()<br/>component.ts:435-437"]
    end

    subgraph "Cluster Service"
        SVC_METHOD["getDashboardProxyURL()<br/>cluster.ts:248-250"]
    end

    subgraph "Shared Entities"
        CLUSTER_ENTITY["KubernetesDashboard class<br/>entity/cluster.ts"]
        HEALTH_ENTITY["HealthStatusKey.KubernetesDashboard<br/>entity/health.ts"]
        SETTINGS_ENTITY["enableDashboard: boolean<br/>entity/settings.ts"]
    end

    subgraph "Other Touchpoints"
        EDIT["Edit Cluster Dialog<br/>KubernetesDashboardEnabled control"]
        WIZARD["Cluster Creation Wizard<br/>Dashboard toggle"]
        ADMIN["Admin Settings<br/>Global enable/disable"]
        DEPRECATION["Deprecation Warning<br/>constants/common.ts"]
    end

    BTN --> HEALTH_CHECK
    BTN --> PROXY_URL
    PROXY_URL --> SVC_METHOD
    BTN -.->|"shows if"| SETTINGS_ENTITY
    HEALTH_CHECK --> CLUSTER_ENTITY
    HEALTH_CHECK --> HEALTH_ENTITY

    style BTN fill:#4CAF50,color:white
    style DEPRECATION fill:#f44336,color:white
```

### File-by-File Details

| File | What it does |
|------|-------------|
| `cluster/details/cluster/template.html:66-82` | "Open Dashboard" button with `[href]="getProxyURL()"`, `target="_blank"`, disabled when unhealthy. Shows deprecation warning icon. |
| `cluster/details/cluster/component.ts:159-161` | `isKubernetesDashboardHealthy` getter: checks `cluster.spec.kubernetesDashboard.enabled && health.kubernetesDashboard === HealthState.Up` |
| `cluster/details/cluster/component.ts:435-437` | `getProxyURL()` delegates to `ClusterService.getDashboardProxyURL()` |
| `core/services/cluster.ts:248-250` | `getDashboardProxyURL()` returns `${restRoot}/dashboard/login?projectID=...&clusterID=...` |
| `shared/entity/cluster.ts` | `KubernetesDashboard` class with `enabled?: boolean` field |
| `shared/entity/health.ts` | `kubernetesDashboard?: HealthState` in health entity |
| `shared/entity/settings.ts:36` | `enableDashboard: boolean` in `AdminSettings` |
| `shared/constants/common.ts:22-23` | `KUBERNETES_DASHBOARD_DEPRECATED_MESSAGE` constant |
| `cluster/details/cluster/edit-cluster/` | Form control for enabling/disabling dashboard per cluster |
| `wizard/step/cluster/component.ts` | Dashboard toggle in cluster creation wizard |
| `settings/admin/defaults/` | Global admin toggle (requires OIDC kubeconfig endpoint + OpenID auth plugin) |

---

## 5. End-to-End Flow

Complete flow from user click to seeing the Kubernetes Dashboard:

```mermaid
sequenceDiagram
    actor User
    participant Angular as KKP Frontend<br/>(Angular)
    participant API as KKP API<br/>(Go)
    participant OIDC as OIDC Provider<br/>(Dex/External)
    participant SeedAPI as Seed K8s API
    participant DashPod as K8s Dashboard Pod<br/>(in user cluster ns)

    Note over User,DashPod: Phase 1: OIDC Authentication
    User->>Angular: Click "Open Dashboard"
    Angular->>User: Open new tab:<br/>/api/v2/dashboard/login?projectID=X&clusterID=Y

    User->>API: GET /dashboard/login?projectID=X&clusterID=Y
    Note over API: Generate nonce (10-15 chars)<br/>Encode state: {nonce, projectID, clusterID}<br/>Set encrypted nonce cookie (3min TTL)
    API->>User: 303 Redirect to OIDC provider<br/>+ nonce cookie

    User->>OIDC: Authenticate (login page)
    OIDC->>User: 303 Redirect to callback<br/>/dashboard/login?state=...&code=...

    User->>API: GET /dashboard/login?state=...&code=...
    Note over API: Decode state, verify nonce vs cookie<br/>Exchange code for tokens<br/>Verify ID token has email claim<br/>Require refresh token
    API->>OIDC: Exchange auth code for tokens
    OIDC->>API: ID token + refresh token
    API->>User: 303 Redirect to proxy endpoint<br/>/projects/X/clusters/Y/dashboard/proxy?token={idToken}<br/>+ clear nonce cookie

    Note over User,DashPod: Phase 2: Token Storage
    User->>API: GET /projects/X/clusters/Y/dashboard/proxy?token={idToken}
    Note over API: Store token in "proxy" cookie
    API->>User: 303 Redirect to /proxy/<br/>+ proxy cookie with token

    Note over User,DashPod: Phase 3: Reverse Proxy (every request)
    User->>API: GET /projects/X/clusters/Y/dashboard/proxy/{path}
    Note over API: Read token from "proxy" cookie
    API->>SeedAPI: Port-forward to pod<br/>label=app=kubernetes-dashboard<br/>port=9090
    SeedAPI->>DashPod: TCP tunnel
    Note over API: Create reverse proxy<br/>Strip path prefix after "proxy"<br/>Set Authorization: Bearer {token}<br/>Set X-Forwarded-Host
    API->>DashPod: Proxied request
    DashPod->>API: Response
    Note over API: Override CSP header<br/>Close port-forward
    API->>User: Dashboard UI (HTML/JS/CSS)
```

---

## 6. Headlamp Overview

[Headlamp](https://github.com/kubernetes-sigs/headlamp) is the actively maintained successor to Kubernetes Dashboard under `kubernetes-sigs`.

### Architecture Comparison

```mermaid
graph LR
    subgraph "Kubernetes Dashboard (Retired)"
        KD_FE["Angular Frontend"]
        KD_BE["Go Backend<br/>Port 9090"]
        KD_AUTH["Token/Kubeconfig Auth"]
    end

    subgraph "Headlamp (Active)"
        HL_FE["React + MUI Frontend"]
        HL_BE["Go Proxy Backend<br/>Port 4466"]
        HL_AUTH["OIDC + Token + Kubeconfig"]
        HL_PLUGIN["Plugin System<br/>@kinvolk/headlamp-plugin SDK"]
    end

    style KD_FE fill:#9E9E9E,color:white
    style KD_BE fill:#9E9E9E,color:white
    style KD_AUTH fill:#9E9E9E,color:white
    style HL_FE fill:#4CAF50,color:white
    style HL_BE fill:#4CAF50,color:white
    style HL_AUTH fill:#4CAF50,color:white
    style HL_PLUGIN fill:#FF9800,color:white
```

### Feature Comparison

| Aspect | K8s Dashboard (Retired) | Headlamp (Active) |
|--------|------------------------|-------------------|
| **Status** | Archived, unmaintained | Active SIG project |
| **Frontend** | Angular | React + MUI |
| **Backend** | Go | Go (proxy-based) |
| **Default Port** | 9090 | 4466 |
| **Multi-cluster** | Single cluster only | Native multi-cluster |
| **Extensibility** | No plugin system | Rich plugin API |
| **Auth** | Token/kubeconfig | OIDC, tokens, kubeconfig |
| **RBAC** | Basic view | Enhanced visualization |
| **Helm Chart** | N/A | Official chart available |
| **Container Args** | `--enable-insecure-login` | `-in-cluster`, `-plugins-dir` |

---

## 7. Migration Challenges

### Challenge Map

```mermaid
graph TD
    subgraph "HIGH Severity"
        C1["OIDC Token Compatibility<br/>Will Headlamp accept KKP-issued<br/>OIDC ID tokens as Bearer tokens?"]
    end

    subgraph "MEDIUM Severity"
        C2["Path Rewriting<br/>React Router (client-side) vs<br/>current path stripping approach"]
        C3["Port-Forward Scalability<br/>New port-forward per request<br/>(pre-existing issue)"]
        C4["Two-Repo Coordination<br/>Changes in kubermatic/kubermatic<br/>+ kubermatic/dashboard"]
        C5["Backward Compatibility<br/>Existing clusters with<br/>kubernetesDashboard.enabled: true"]
        C6["RBAC Scope<br/>Headlamp can create/delete<br/>resources by default"]
        C7["Plugin API Stability<br/>Headlamp plugin API<br/>is still evolving"]
    end

    subgraph "LOW Severity"
        C8["CSP Header Differences<br/>React SPA may need<br/>script-src 'self'"]
        C9["Resource Overhead<br/>Different CPU/memory<br/>profile per cluster"]
    end

    style C1 fill:#f44336,color:white
    style C2 fill:#FF9800,color:white
    style C3 fill:#FF9800,color:white
    style C4 fill:#FF9800,color:white
    style C5 fill:#FF9800,color:white
    style C6 fill:#FF9800,color:white
    style C7 fill:#FF9800,color:white
    style C8 fill:#4CAF50,color:white
    style C9 fill:#4CAF50,color:white
```

### Detailed Challenge Breakdown

#### 1. OIDC Token Compatibility (HIGH)

**Current flow**: KKP API performs OIDC login, obtains ID token, stores it in a cookie, and passes it as `Authorization: Bearer {token}` to the K8s Dashboard.

**Challenge**: Headlamp has its own OIDC support. When KKP mediates auth and passes a Bearer token, Headlamp must accept it without trying to do its own OIDC flow. Need to verify Headlamp's token acceptance behavior in proxy/passthrough mode.

**Mitigation**: Prototype early -- deploy Headlamp in a test cluster, verify the existing OIDC flow works with Headlamp's token acceptance.

#### 2. Path Rewriting Compatibility (MEDIUM)

**Current approach**: `director.go` strips everything before "proxy" in the URL path. The K8s Dashboard (Angular, server-side routing) handles this fine.

**Challenge**: Headlamp uses React Router (client-side routing). When the browser requests `/some/deep/path`, Headlamp needs to serve its `index.html` and let React Router handle the path. This requires Headlamp's `-base-url` flag to match the proxy path prefix.

**Mitigation**: Configure Headlamp with `-base-url` matching the KKP proxy prefix. Test navigation within the proxied Headlamp.

#### 3. Port-Forward Scalability (MEDIUM)

**Current code** (`proxy.go:220-221`):
```go
// Ideally we would cache these to not open a port for every single request
portforwarder, closeChan, err := common.GetPortForwarder(...)
```

Each proxied request opens a new port-forward to the dashboard pod and closes it after the response. This is inefficient for SPAs that make many API calls.

**Mitigation**: Implement port-forward caching/pooling. This is a pre-existing issue not introduced by migration, but Headlamp's more API-heavy frontend may make it more noticeable.

#### 4. Two-Repo Coordination (MEDIUM)

Changes must be synchronized across:
- `kubermatic/kubermatic`: Deployment manifests, image, labels, ports, RBAC, health checks, deletion
- `kubermatic/dashboard`: Proxy handler, login flow, frontend UI

Both PRs need to be merged and released together.

#### 5. Backward Compatibility (MEDIUM)

Existing clusters have `kubernetesDashboard.enabled: true` with the old K8s Dashboard deployed. On KKP upgrade, the cluster controller needs to:
- Clean up old K8s Dashboard resources (Deployment, Service, RBAC)
- Deploy new Headlamp resources
- Update health check labels/selectors

#### 6. RBAC Scope Expansion (MEDIUM)

K8s Dashboard in KKP is read-oriented. Headlamp by default allows creating/deleting resources through its UI. The RBAC setup may need review:
- Should we keep the same restrictive RBAC as K8s Dashboard?
- Or allow broader permissions matching Headlamp's capabilities?

#### 7. CSP Header Differences (LOW)

Current CSP in `proxy.go:41`:
```go
const csp = "style-src 'self' 'unsafe-inline';"
```

Headlamp's React SPA may additionally need `script-src 'self'` in the Content-Security-Policy header.

---

## 8. Required Changes Per Repository

### 8.1 kubermatic/kubermatic

```mermaid
graph TD
    subgraph "Deployment Changes"
        D1["deployment.go<br/>Image: ghcr.io/headlamp-k8s/headlamp:VERSION<br/>Port: 4466<br/>Label: app=headlamp<br/>Args: -in-cluster, -plugins-dir"]
        D2["RBAC resources<br/>Review ClusterRole scope<br/>for Headlamp capabilities"]
        D3["Health check controller<br/>Update label selector<br/>app=headlamp"]
        D4["deletion.go<br/>Clean up Headlamp resources<br/>instead of K8s Dashboard"]
    end

    subgraph "Constants Package"
        C1["AppLabel: kubernetes-dashboard --> headlamp"]
        C2["ContainerPort: 9090 --> 4466"]
    end

    D1 --> C1
    D1 --> C2
```

| File | Change |
|------|--------|
| `pkg/resources/kubernetes-dashboard/deployment.go` | Change image, port, labels, container args, volume mounts, probes |
| `pkg/resources/kubernetes-dashboard/` (constants) | `AppLabel`: `kubernetes-dashboard` -> `headlamp`, `ContainerPort`: `9090` -> `4466` |
| RBAC resources | Review and update ClusterRole/ClusterRoleBinding scope |
| Health check controller | Update label selector for pod health monitoring |
| `deletion.go` | Update resource cleanup for Headlamp |
| Liveness/readiness probes | Update path (Headlamp serves on `/`) |

### 8.2 kubermatic/dashboard - Go API

```mermaid
graph TD
    subgraph "Handler Changes"
        P1["proxy.go<br/>- Update import (if constants renamed)<br/>- Update CSP header<br/>- Consider port-forward caching"]
        P2["director.go<br/>- Verify path stripping works<br/>- May need base-url awareness"]
        P3["login.go<br/>- Verify OIDC flow unchanged<br/>- Confirm Headlamp accepts Bearer token"]
    end

    subgraph "Route Changes"
        R1["routes_v2.go<br/>- Consider renaming /dashboard/ to /headlamp/<br/>- Or keep generic name"]
    end

    subgraph "Type Changes"
        T1["api/v1/types.go<br/>- KubernetesDashboard struct rename?<br/>- ClusterHealth field rename?"]
        T2["api/v2/types.go<br/>- EnableDashboard field rename?"]
        T3["resources/cluster/cluster.go<br/>- Update defaulting logic"]
    end

    subgraph "Codegen"
        CG["Swagger/OpenAPI spec<br/>regeneration required"]
    end
```

| File | Change |
|------|--------|
| `pkg/handler/v2/kubernetes-dashboard/proxy.go` | Update CSP header, consider port-forward caching |
| `pkg/handler/v2/kubernetes-dashboard/director.go` | Verify path stripping compatibility with React Router |
| `pkg/handler/v2/kubernetes-dashboard/login.go` | Verify OIDC flow works with Headlamp |
| `pkg/handler/v2/routes_v2.go:1137-1157` | Consider renaming routes from `/dashboard/` to `/headlamp/` |
| `pkg/api/v1/types.go` | Consider renaming `KubernetesDashboard` struct |
| `pkg/api/v2/types.go:2225` | Consider renaming `EnableDashboard` field |
| `pkg/resources/cluster/cluster.go:44-68` | Update defaulting logic |
| Swagger spec | Regenerate with `make update-codegen` |

### 8.3 kubermatic/dashboard - Angular Frontend

| File | Change |
|------|--------|
| `shared/entity/cluster.ts` | Rename `KubernetesDashboard` class or add `Headlamp` alongside |
| `shared/entity/health.ts` | Update `HealthStatusKey.KubernetesDashboard` enum |
| `shared/entity/settings.ts` | Rename `enableDashboard` or add `enableHeadlamp` |
| `cluster/details/cluster/component.ts` | Update `isKubernetesDashboardHealthy`, `getProxyURL()`, remove deprecation |
| `cluster/details/cluster/template.html:66-82` | Rename button text, update CSS classes, remove deprecation icon |
| `cluster/details/cluster/edit-cluster/` | Update form control and spec patch |
| `wizard/step/cluster/component.ts` | Update cluster creation toggle |
| `settings/admin/defaults/` | Update label from "Enable Kubernetes Dashboard" to "Enable Headlamp" |
| `core/services/cluster.ts:248-250` | Update `getDashboardProxyURL()` method and path |
| `shared/constants/common.ts:22-23` | Remove `KUBERNETES_DASHBOARD_DEPRECATED_MESSAGE` |
| Cypress E2E tests | Update selectors, page objects, fixture data |
| Swagger client models | Regenerate from updated swagger.json |

---

## 9. Recommended Approach

Based on the proposal document, the **Hybrid approach (Approach C)** with **feature-flag rollout** is recommended:

```mermaid
gantt
    title Migration Timeline
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Phase 0: Investigation
    Deploy Headlamp in test cluster          :p0a, 2026-04-01, 7d
    Verify proxy compatibility               :p0b, after p0a, 4d
    Verify OIDC token acceptance             :p0c, after p0a, 4d
    Test CSP and path rewriting              :p0d, after p0a, 4d
    Compatibility report                      :milestone, after p0d, 0d

    section Phase 1: Direct Replacement
    Update kubermatic/kubermatic deployment  :p1a, after p0d, 14d
    Update API proxy handlers               :p1b, after p0d, 10d
    Update Angular frontend                  :p1c, after p1b, 7d
    Implement feature flag                   :p1d, after p1a, 5d
    PRs for both repos                        :milestone, after p1d, 0d

    section Phase 2: KKP Plugins
    KKP Project Context plugin               :p2a, after p1d, 14d
    Cloud Provider Info plugin               :p2b, after p2a, 14d
    MLA Integration plugin                   :p2c, after p2b, 14d

    section Phase 3: Cleanup
    Remove K8s Dashboard code paths          :p3a, after p2c, 5d
    Remove feature flag                      :p3b, after p3a, 2d
    Update documentation                     :p3c, after p3b, 3d
```

### Rollout Strategy: Feature Flag

```mermaid
stateDiagram-v2
    [*] --> ReleaseN: Feature flag introduced

    state ReleaseN {
        [*] --> K8sDashboard: Default
        K8sDashboard --> Headlamp: Admin opts-in
        Headlamp --> K8sDashboard: Admin opts-out (rollback)
    }

    ReleaseN --> ReleaseN1: Switch default

    state ReleaseN1 {
        [*] --> Headlamp2: Default
        Headlamp2 --> K8sDashboard2: Admin opts-out (legacy)
    }

    ReleaseN1 --> ReleaseN2: Remove K8s Dashboard

    state ReleaseN2 {
        [*] --> HeadlampOnly: Only option
    }

    ReleaseN2 --> [*]
```

**Feature flag options** (pick one):
- **Option A**: `dashboardType` field in AdminSettings: `'kubernetes-dashboard' | 'headlamp'`
- **Option B**: Separate `enableHeadlamp` boolean alongside `enableDashboard`
- **Option C**: KKP `FeatureGates` configuration (e.g., `HeadlampDashboard`)

---

## 10. Open Questions

1. **API route naming**: Should `/dashboard/` change to `/headlamp/`, stay as-is, or use a generic name like `/cluster-ui/`?

2. **CRD field naming**: Should `KubernetesDashboard` in the CRD/API types be renamed to `ClusterDashboard` (generic) or `Headlamp` (specific)?

3. **OIDC mediation**: Does Headlamp's native OIDC support mean KKP could stop mediating auth? Or should KKP continue to control the login flow for consistency?

4. **Version pinning**: What Headlamp version should KKP target? Track latest, or pin per KKP release?

5. **Plugin distribution**: Bake KKP plugins into a custom container image (simpler) or load dynamically via ConfigMap (more flexible)?

6. **Deployment model**: Keep per-cluster deployment? Or move to a single Headlamp instance per seed with multi-cluster support?

7. **RBAC scope**: What are the RBAC implications of Headlamp's built-in capabilities (it can create/delete resources by default)?

---

## References

- Kubernetes Dashboard (Retired): https://github.com/kubernetes-retired/dashboard
- Headlamp Project: https://github.com/kubernetes-sigs/headlamp
- Headlamp Documentation: https://headlamp.dev/docs/latest/
- Headlamp Helm Chart: https://artifacthub.io/packages/helm/headlamp/headlamp
- Headlamp Plugin Development: https://headlamp.dev/docs/latest/development/plugins/
- KKP Documentation: https://docs.kubermatic.com/kubermatic/
- Tracking Issue: https://github.com/kubermatic/kubermatic/issues/15287
