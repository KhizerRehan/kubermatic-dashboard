# Headlamp Migration Phase 1 — Direct Replacement Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the deployed Kubernetes Dashboard (archived) with Headlamp in KKP, updating all three layers — deployment (companion PR), Go API proxy, and Angular frontend.

**Architecture:** The proxy architecture remains unchanged: KKP mediates OIDC auth and port-forwards to the dashboard pod. Only the image, port, labels, CSP header, and UI labels change. The CRD fields (`kubernetesDashboard`, `enableDashboard`) keep their names to preserve API backward compatibility.

**Tech Stack:** Go 1.21+ (proxy/port-forward layer), Angular 20 + TypeScript (frontend), Gorilla Mux / Go-Kit (routing), `k8c.io/kubermatic/v2` (imported constants for AppLabel/ContainerPort)

---

## Prerequisites

Before writing any code, Phase 0 verification must be complete. These are **infrastructure experiments** — they determine whether Phase 1 works as written.

### P0.1 — Verify OIDC Bearer token acceptance

Deploy Headlamp with `-in-cluster` flag in a test cluster. Make a curl request to the proxied Headlamp with `Authorization: Bearer {oidc_token}`. Confirm Headlamp returns 200 (not a redirect to its own auth flow).

Expected: Headlamp accepts the token as-is when in-cluster mode is active.

### P0.2 — Verify React Router path stripping compatibility

Access Headlamp through the existing KKP proxy at:
`/api/v2/projects/{id}/clusters/{id}/dashboard/proxy/`

`director.go` strips everything before `proxy` → passes `/` to Headlamp. Navigate to a namespace page and verify the URL stays within the proxy path (React Router should use history relative to `window.location`).

Expected: Navigation works because the browser's base URL is the proxied URL, so relative React Router navigation stays within the proxy.

### P0.3 — Identify required CSP additions for React SPA

Open browser devtools on the proxied Headlamp. Check for CSP violations. Current CSP only allows `style-src 'self' 'unsafe-inline'`. React may need `script-src 'self'`.

Expected result feeds directly into Task 1.

---

## File Structure

### Modified in `kubermatic/dashboard` (this repo)

**Go API (`modules/api/`):**
```
pkg/handler/v2/kubernetes-dashboard/
  proxy.go              # Update CSP header for React SPA (CHANGE)
  director.go           # No change needed if P0.2 passes
  director_test.go      # NEW: tests for getBasePath path stripping
  proxy_test.go         # NEW: tests for CSP header constant
```

**Angular Frontend (`modules/web/src/app/`):**
```
shared/constants/common.ts                       # Remove KUBERNETES_DASHBOARD_DEPRECATED_MESSAGE (CHANGE)
cluster/details/cluster/component.ts             # Rename isKubernetesDashboardHealthy → isHeadlampHealthy (CHANGE)
cluster/details/cluster/template.html            # Update button text, CSS class, remove deprecation icon (CHANGE)
cluster/details/cluster/edit-cluster/template.html  # Change label "Kubernetes Dashboard" → "Headlamp" (CHANGE)
wizard/step/cluster/template.html                # Change checkbox label "Kubernetes Dashboard" → "Headlamp" (CHANGE)
settings/admin/defaults/template.html           # Change labels to "Headlamp" (CHANGE)
settings/admin/defaults/component.ts            # Rename internal method (CHANGE)
core/services/cluster.ts                         # Rename getDashboardProxyURL → getHeadlampProxyURL (CHANGE)
```

### Companion PR in `kubermatic/kubermatic` (external, tracked in Task 5)

```
pkg/resources/kubernetes-dashboard/
  constants.go      # AppLabel: "kubernetes-dashboard" → "headlamp", ContainerPort: 9090 → 4466
  deployment.go     # Image: ghcr.io/headlamp-k8s/headlamp:v0.27.0, Args: -in-cluster -plugins-dir=/headlamp/plugins
  rbac.go           # Review ClusterRole scope
  health_check.go   # Update pod label selector
  deletion.go       # No change if label changes are handled by selector update
```

---

## Chunk 1: Go API Tests and CSP Update

### Task 1: Add tests for director.go and update proxy.go CSP

**Files:**
- Create: `modules/api/pkg/handler/v2/kubernetes-dashboard/director_test.go`
- Create: `modules/api/pkg/handler/v2/kubernetes-dashboard/proxy_test.go`
- Modify: `modules/api/pkg/handler/v2/kubernetes-dashboard/proxy.go:41`

- [ ] **Step 1.1: Write failing test for director.getBasePath**

Create `modules/api/pkg/handler/v2/kubernetes-dashboard/director_test.go`:

```go
/*
Copyright 2026 The Kubermatic Kubernetes Platform contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package kubernetesdashboard

import (
	"testing"
)

func TestGetBasePath(t *testing.T) {
	director := &dashboardProxyDirector{}
	tests := []struct {
		name     string
		path     string
		expected string
	}{
		{
			name:     "strips KKP prefix before proxy",
			path:     "/api/v2/projects/abc/clusters/xyz/dashboard/proxy/namespaces",
			expected: "/namespaces",
		},
		{
			name:     "root proxy path returns slash",
			path:     "/api/v2/projects/abc/clusters/xyz/dashboard/proxy/",
			expected: "/",
		},
		{
			name:     "path without proxy returns slash",
			path:     "/api/v2/projects/abc/clusters/xyz",
			expected: "/",
		},
		{
			name:     "headlamp deep path preserved",
			path:     "/api/v2/projects/abc/clusters/xyz/dashboard/proxy/c/local/namespaces/default/pods",
			expected: "/c/local/namespaces/default/pods",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := director.getBasePath(tt.path)
			if result != tt.expected {
				t.Errorf("getBasePath(%q) = %q, want %q", tt.path, result, tt.expected)
			}
		})
	}
}
```

- [ ] **Step 1.2: Run test to verify it compiles and passes (path stripping already works)**

```bash
cd modules/api && go test ./pkg/handler/v2/kubernetes-dashboard/... -run TestGetBasePath -v
```

Expected: PASS (existing logic already handles these cases)

- [ ] **Step 1.3: Write test for CSP constant in proxy_test.go**

Create `modules/api/pkg/handler/v2/kubernetes-dashboard/proxy_test.go`:

```go
/*
Copyright 2026 The Kubermatic Kubernetes Platform contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package kubernetesdashboard

import (
	"strings"
	"testing"
)

func TestCSPHeaderIncludesScriptSrc(t *testing.T) {
	if !strings.Contains(csp, "script-src 'self'") {
		t.Errorf("CSP header %q does not include 'script-src 'self'' required for Headlamp React SPA", csp)
	}
}

func TestCSPHeaderIncludesStyleSrc(t *testing.T) {
	if !strings.Contains(csp, "style-src 'self' 'unsafe-inline'") {
		t.Errorf("CSP header %q does not include 'style-src 'self' 'unsafe-inline'' required for styled components", csp)
	}
}
```

- [ ] **Step 1.4: Run test to verify it FAILS**

```bash
cd modules/api && go test ./pkg/handler/v2/kubernetes-dashboard/... -run TestCSP -v
```

Expected: FAIL — current CSP is `"style-src 'self' 'unsafe-inline';"` (missing script-src)

- [ ] **Step 1.5: Update CSP constant in proxy.go**

File: `modules/api/pkg/handler/v2/kubernetes-dashboard/proxy.go`, line 41.

Change:
```go
const csp = "style-src 'self' 'unsafe-inline';"
```

To:
```go
const csp = "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self';"
```

> **Note**: If P0.3 revealed additional CSP requirements (e.g., `connect-src` for API calls, `img-src` for icons), add them here too.

- [ ] **Step 1.6: Run tests to verify they PASS**

```bash
cd modules/api && go test ./pkg/handler/v2/kubernetes-dashboard/... -v
```

Expected: PASS for both TestCSP tests and TestGetBasePath

- [ ] **Step 1.7: Commit**

```bash
git add modules/api/pkg/handler/v2/kubernetes-dashboard/
git commit -m "feat(api): update CSP header for Headlamp React SPA and add handler tests"
```

---

## Chunk 2: Angular Frontend — Cluster Details Page

### Task 2: Update cluster details component and template

**Files:**
- Modify: `modules/web/src/app/shared/constants/common.ts`
- Modify: `modules/web/src/app/cluster/details/cluster/component.ts`
- Modify: `modules/web/src/app/cluster/details/cluster/template.html`
- Modify: `modules/web/src/app/core/services/cluster.ts`

> Angular unit tests are co-located `.spec.ts` files. No existing spec for the cluster details component. We'll add one for the renamed getter.

- [ ] **Step 2.1: Create failing unit test for isHeadlampHealthy**

Create `modules/web/src/app/cluster/details/cluster/component.spec.ts`:

```typescript
// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ClusterDetailsComponent} from './component';
import {HealthState} from '@shared/entity/health';
import {Cluster} from '@shared/entity/cluster';

describe('ClusterDetailsComponent', () => {
  let component: Partial<ClusterDetailsComponent>;

  beforeEach(() => {
    component = {
      cluster: {spec: {kubernetesDashboard: {enabled: true}}} as Cluster,
      health: {kubernetesDashboard: HealthState.Up} as any,
    };
    // Bind the getter to the component instance
    Object.setPrototypeOf(component, ClusterDetailsComponent.prototype);
  });

  describe('isHeadlampHealthy', () => {
    it('returns true when dashboard enabled and health is Up', () => {
      component.cluster = {spec: {kubernetesDashboard: {enabled: true}}} as Cluster;
      component.health = {kubernetesDashboard: HealthState.Up} as any;
      expect((component as ClusterDetailsComponent).isHeadlampHealthy).toBe(true);
    });

    it('returns false when dashboard disabled', () => {
      component.cluster = {spec: {kubernetesDashboard: {enabled: false}}} as Cluster;
      component.health = {kubernetesDashboard: HealthState.Up} as any;
      expect((component as ClusterDetailsComponent).isHeadlampHealthy).toBe(false);
    });

    it('returns false when health is not Up', () => {
      component.cluster = {spec: {kubernetesDashboard: {enabled: true}}} as Cluster;
      component.health = {kubernetesDashboard: HealthState.Down} as any;
      expect((component as ClusterDetailsComponent).isHeadlampHealthy).toBe(false);
    });
  });
});
```

> Note: This is a lightweight getter test. A full test setup requires Angular TestBed and all dependencies — if the test runner requires it, move to an integration spec using the test helpers in `src/test/`.

- [ ] **Step 2.2: Run test to verify it FAILS**

```bash
cd modules/web && npx jest --testPathPattern="cluster/details/cluster/component.spec.ts" --no-coverage 2>&1 | tail -20
```

Expected: FAIL — `isHeadlampHealthy` does not exist yet

- [ ] **Step 2.3: Remove deprecation constant from common.ts**

File: `modules/web/src/app/shared/constants/common.ts`, lines 22-23.

Remove:
```typescript
export const KUBERNETES_DASHBOARD_DEPRECATED_MESSAGE =
  'Kubernetes Dashboard is deprecated and will be removed in future KKP versions.';
```

- [ ] **Step 2.4: Update cluster details component.ts**

File: `modules/web/src/app/cluster/details/cluster/component.ts`

a) Remove the import of `KUBERNETES_DASHBOARD_DEPRECATED_MESSAGE` (search for it in the imports section at the top of the file).

b) Remove the class property assignment (search for `KUBERNETES_DASHBOARD_DEPRECATED_MESSAGE =`).

c) Rename the getter (around line 159):

Change:
```typescript
get isKubernetesDashboardHealthy(): boolean {
  return this.cluster?.spec?.kubernetesDashboard?.enabled && this.health?.kubernetesDashboard === HealthState.Up;
}
```

To:
```typescript
get isHeadlampHealthy(): boolean {
  return this.cluster?.spec?.kubernetesDashboard?.enabled && this.health?.kubernetesDashboard === HealthState.Up;
}
```

d) Update the usage of the old getter (around line 716):

Change:
```typescript
if (!this.isKubernetesDashboardHealthy) {
```

To:
```typescript
if (!this.isHeadlampHealthy) {
```

- [ ] **Step 2.5: Update template.html for cluster details**

File: `modules/web/src/app/cluster/details/cluster/template.html`, lines 66-82.

Change:
```html
<a class="km-open-kubernetes-dashboard-btn"
   id="km-open-kubernetes-dashboard-btn"
   [href]="getProxyURL()"
   target="_blank"
   rel="noopener noreferrer"
   mat-flat-button
   [disabled]="!isKubernetesDashboardHealthy || isDeletingState"
   [matTooltip]="getOpenDashboardTooltip()">
  <i class="km-icon-mask km-icon-external-link"
     matButtonIcon></i>
  <span>Open Dashboard
    <i class="km-icon-warning km-pointer km-dashboard-deprecation-warning"
       [matTooltip]="KUBERNETES_DASHBOARD_DEPRECATED_MESSAGE"></i>
  </span>
</a>
```

To:
```html
<a class="km-open-headlamp-btn"
   id="km-open-headlamp-btn"
   [href]="getProxyURL()"
   target="_blank"
   rel="noopener noreferrer"
   mat-flat-button
   [disabled]="!isHeadlampHealthy || isDeletingState"
   [matTooltip]="getOpenDashboardTooltip()">
  <i class="km-icon-mask km-icon-external-link"
     matButtonIcon></i>
  <span>Open Headlamp</span>
</a>
```

- [ ] **Step 2.6: Rename getDashboardProxyURL in cluster.ts**

File: `modules/web/src/app/core/services/cluster.ts`, line 248.

Change method name:
```typescript
getDashboardProxyURL(projectID: string, clusterID: string): string {
```
To:
```typescript
getHeadlampProxyURL(projectID: string, clusterID: string): string {
```

Then update the caller in `component.ts` (around line 436):

Change:
```typescript
getProxyURL(): string {
  return this._clusterService.getDashboardProxyURL(this.projectID, this.cluster.id);
}
```

To:
```typescript
getProxyURL(): string {
  return this._clusterService.getHeadlampProxyURL(this.projectID, this.cluster.id);
}
```

- [ ] **Step 2.7: Run tests to verify they PASS**

```bash
cd modules/web && npx jest --testPathPattern="cluster/details/cluster/component.spec.ts" --no-coverage 2>&1 | tail -20
```

Expected: PASS

- [ ] **Step 2.8: Commit**

```bash
git add modules/web/src/app/shared/constants/common.ts \
        modules/web/src/app/cluster/details/cluster/component.ts \
        modules/web/src/app/cluster/details/cluster/component.spec.ts \
        modules/web/src/app/cluster/details/cluster/template.html \
        modules/web/src/app/core/services/cluster.ts
git commit -m "feat(web): replace K8s Dashboard with Headlamp in cluster details UI"
```

---

## Chunk 3: Angular Frontend — Edit Cluster, Wizard, Admin Settings

### Task 3: Update remaining UI label references

**Files:**
- Modify: `modules/web/src/app/cluster/details/cluster/edit-cluster/template.html`
- Modify: `modules/web/src/app/wizard/step/cluster/template.html`
- Modify: `modules/web/src/app/settings/admin/defaults/template.html`
- Modify: `modules/web/src/app/settings/admin/defaults/component.ts`

- [ ] **Step 3.1: Update edit-cluster dialog template**

File: `modules/web/src/app/cluster/details/cluster/edit-cluster/template.html`

Search for any text referencing "Kubernetes Dashboard" and change to "Headlamp".

Typical pattern — find:
```html
<span>Kubernetes Dashboard</span>
```
or similar label text and replace with:
```html
<span>Headlamp</span>
```

- [ ] **Step 3.2: Update wizard step cluster template**

File: `modules/web/src/app/wizard/step/cluster/template.html`, around line 587.

Change:
```html
<span>Kubernetes Dashboard</span>
```

To:
```html
<span>Headlamp</span>
```

- [ ] **Step 3.3: Update admin defaults template**

File: `modules/web/src/app/settings/admin/defaults/template.html`, around lines 166-168 and 175-176.

Change every occurrence of `"Kubernetes Dashboard"` in label text and tooltip to `"Headlamp"`:

```html
<span>Enable Headlamp</span>
```
```html
matTooltip='Show/Hide "Open Headlamp" button on cluster details and allow/block Headlamp access through the API.'
```
```html
id="km-enable-headlamp-setting"
```

- [ ] **Step 3.4: Update admin defaults component.ts method names**

File: `modules/web/src/app/settings/admin/defaults/component.ts`

Rename:
- `isKubernetesDashboardFeatureGatesEnabled()` → `isHeadlampFeatureGatesEnabled()`
- Update all references to `isKubernetesDashboardFeatureGatesEnabled` in the same file and template

Also rename private helper:
- `_verifyEnableKubernetesDashboardRequirements()` → `_verifyEnableHeadlampRequirements()`
- Update the call at line 100

- [ ] **Step 3.5: Run full Angular test suite**

```bash
cd modules/web && npm run test:ci 2>&1 | tail -40
```

Expected: All tests pass. If any test references the old method/constant names, update those test files too.

- [ ] **Step 3.6: Commit**

```bash
git add modules/web/src/app/cluster/details/cluster/edit-cluster/ \
        modules/web/src/app/wizard/step/cluster/ \
        modules/web/src/app/settings/admin/defaults/
git commit -m "feat(web): update all UI labels from Kubernetes Dashboard to Headlamp"
```

---

## Chunk 4: Companion PR Checklist (kubermatic/kubermatic)

This task is tracked here for completeness but implemented in the `kubermatic/kubermatic` repository. It must be merged and released before or alongside this PR.

### Task 4: Changes in kubermatic/kubermatic

> These changes make the actual Headlamp deployment happen in the seed cluster. Without this, the proxy will still try to port-forward to a `kubernetes-dashboard` pod (which no longer exists).

- [ ] **Step 4.1: Update constants**

File: `pkg/resources/kubernetes-dashboard/constants.go` (or wherever `AppLabel` and `ContainerPort` are defined)

```go
const (
    AppLabel      = "headlamp"           // was "kubernetes-dashboard"
    ContainerPort = 4466                 // was 9090
)
```

- [ ] **Step 4.2: Update deployment.go**

File: `pkg/resources/kubernetes-dashboard/deployment.go`

- Image: `ghcr.io/headlamp-k8s/headlamp:v0.27.0` (check latest stable at time of implementation)
- Container port: `4466`
- Label selector: `app=headlamp`
- Container args: `["-in-cluster", "-plugins-dir=/headlamp/plugins"]`
- Remove `--enable-insecure-login` flag
- Update liveness/readiness probe path (Headlamp serves health on `/`)

- [ ] **Step 4.3: Update RBAC**

Review `ClusterRole` bound to the dashboard service account. K8s Dashboard had read-only scope. Decide whether to grant Headlamp broader write permissions (create/delete resources) or keep read-only. Document the decision in the PR description.

- [ ] **Step 4.4: Update health check controller**

Update the pod selector label from `app=kubernetes-dashboard` to `app=headlamp`.

- [ ] **Step 4.5: Handle migration of existing clusters**

Existing clusters have `kubernetesDashboard.enabled: true` with the old K8s Dashboard deployment. The cluster controller reconciliation loop will:
1. Delete old Deployment/Service/RBAC with label `app=kubernetes-dashboard`
2. Create new resources with label `app=headlamp`

Verify the reconcile logic handles this cleanly without a manual migration step.

- [ ] **Step 4.6: Create companion PR and link to this PR**

Create the `kubermatic/kubermatic` PR and link both PRs in each PR description for reviewer context.

---

## Open Questions (resolve before merging)

1. **Base URL for React Router**: Did P0.2 confirm that React Router navigation works correctly through the proxy without setting `-base-url`? If not, a more complex solution is needed (see research section 7.2).

2. **Headlamp version**: Pin a specific version in the deployment (e.g., `v0.27.0`) or track minor releases? Recommendation: pin per KKP release, same as other embedded tools.

3. **RBAC scope**: Keep read-only (matching K8s Dashboard) or allow Headlamp's full capabilities? This must be decided in the companion PR.

4. **Route naming**: Routes stay as `/dashboard/` (no breaking change). Consider renaming to `/headlamp/` in a future minor release with a deprecation notice.

5. **Cypress E2E tests**: The button selector `km-open-kubernetes-dashboard-btn` appears in E2E tests. Search `cypress/` for this selector and update to `km-open-headlamp-btn` after template changes.
