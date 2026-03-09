# Error Scenario Testing Research Report
## Kubermatic Dashboard - Comprehensive API Error & State Error Testing

**Date:** March 5, 2026
**Project:** Kubermatic Dashboard (Angular 20.3.x)
**Testing Framework:** Jest with HttpTestingController
**Purpose:** Identify critical services, error scenarios, and components requiring error handling tests

---

## Executive Summary

This research identifies **5 critical services** handling API operations, **8 major error scenarios** to test (network, HTTP, validation, state, permission), and **3 key components** displaying errors to users. The analysis reveals existing error handling patterns and provides a structured testing approach for creating 40+ comprehensive error scenario tests.

---

## Part 1: Critical Services Analysis

### 1.1 ClusterService
**Location:** `/modules/web/src/app/core/services/cluster.ts`

**Primary Responsibility:** Cluster CRUD operations and lifecycle management

**Key Methods (API-facing):**
| Method | Type | Current Error Handling |
|--------|------|----------------------|
| `projectClusterList()` | GET | No error handling - uses `shareReplay` |
| `clusters()` | Derived | Inherits from projectClusterList |
| `create()` | POST | No error handling - direct HTTP response |
| `patch()` | PATCH | No error handling - direct HTTP response |
| `delete()` | DELETE | No error handling - direct HTTP response |
| `externalClusters()` | GET | No error handling - uses `shareReplay` |
| `cluster()` | GET | No error handling - uses `shareReplay` |
| `upgrades()` | GET | **Has error handling** - returns empty array on error |
| `cniVersions()` | GET | **Has error handling** - returns empty object on error |
| `metrics()` | GET | **Has error handling** - returns empty object on error |
| `events()` | GET | **Has error handling** - returns empty array on error |

**Error Handling Pattern:**
```typescript
// Methods with error handling (graceful degradation)
upgrades(): Observable<MasterVersion[]> {
  return this._http.get<MasterVersion[]>(url).pipe(
    catchError(() => of<MasterVersion[]>([]))
  );
}

// Methods without explicit error handling (pass through)
create(): Observable<Cluster> {
  return this._http.post<Cluster>(url, model);  // Throws on error
}
```

**Refresh Mechanism:**
- Uses timer-based refresh: `timer(0, refreshTimeBase * 10)`
- Merge with manual update subjects for triggering refreshes
- `shareReplay()` with `refCount: true` for automatic cleanup

**Critical Error Scenarios:**
1. Network timeout on cluster list fetch
2. 401 Unauthorized (invalid/expired token)
3. 403 Forbidden (insufficient permissions)
4. 404 Not Found (cluster/project doesn't exist)
5. 409 Conflict (concurrent modification)
6. 500 Server error during cluster creation
7. Cascading failures (cluster exists but metrics/events fail)
8. Malformed response (invalid JSON)

---

### 1.2 ProjectService
**Location:** `/modules/web/src/app/core/services/project.ts`

**Primary Responsibility:** Project CRUD operations and project lifecycle

**Key Methods:**
| Method | Type | Current Error Handling |
|--------|------|----------------------|
| `projects` (getter) | GET | **Has error handling** - returns empty array on error |
| `myProjects` (getter) | GET | **Has error handling** - returns empty array on error |
| `allProjects` (getter) | GET | **Has error handling** - returns empty array on error |
| `selectedProject` (getter) | GET | **Has error handling** - returns empty array on error |
| `create()` | POST | No error handling - direct HTTP response |
| `edit()` | PUT | No error handling - direct HTTP response |
| `delete()` | DELETE | No error handling - direct HTTP response |
| `searchProjects()` | GET | **Has error handling** - returns empty array on error |

**Error Handling Pattern:**
```typescript
// Methods with error handling
get projects(): Observable<Project[]> {
  return merge(this.onProjectsUpdate, this._refreshTimer$)
    .pipe(switchMap(_ => this._getProjects(this._displayAll)))
    .pipe(shareReplay({refCount: true, bufferSize: 1}));
}

private _getProjects(displayAll: boolean): Observable<Project[]> {
  return this._http.get<Project[]>(url).pipe(
    map(projects => _.sortBy(projects, ...)),
    catchError(() => of<Project[]>())  // Graceful degradation
  );
}

// Method without error handling
delete(projectID: string): Observable<Project> {
  return this._http.delete<Project>(url);  // Throws on error
}
```

**State Management:**
- Uses `_displayAll` flag to track admin project visibility
- Observable caching with multiple sources (projects, myProjects, allProjects)
- Sorting applied via map operator

**Critical Error Scenarios:**
1. User lacks permissions to view projects (403)
2. Backend service timeout
3. Session expired during project operations (401)
4. Project deletion with active clusters (409/500)
5. Search query failure with special characters
6. Offline mode - no connectivity
7. Race condition: fetch during project creation/deletion
8. Server error with partial data (invalid JSON)

---

### 1.3 MachineDeploymentService
**Location:** `/modules/web/src/app/core/services/machine-deployment.ts`

**Primary Responsibility:** Machine deployment (node pool) operations

**Key Methods:**
| Method | Type | Current Error Handling |
|--------|------|----------------------|
| `create()` | POST | No error handling |
| `list()` | GET | **Has error handling** - returns empty array |
| `get()` | GET | No error handling |
| `patch()` | PATCH | No error handling |
| `restart()` | POST | No error handling |
| `delete()` | DELETE | No error handling |
| `getNodes()` | GET | No error handling |
| `getNodesMetrics()` | GET | No error handling |
| `getNodesEvents()` | GET | No error handling |

**Error Handling Pattern:**
```typescript
// Minimal error handling
list(cluster: string, projectID: string): Observable<MachineDeployment[]> {
  return this._httpClient.get<MachineDeployment[]>(url)
    .pipe(catchError(() => of<MachineDeployment[]>([])));
}

// No error handling
get(mdId: string, cluster: string, projectID: string): Observable<MachineDeployment> {
  return this._httpClient.get<MachineDeployment>(url);  // Throws
}
```

**Data Manipulation:**
- Filters out nullified keys from labels/annotations/taints before POST/PATCH
- Separates spec.template from other properties in patch operations

**Critical Error Scenarios:**
1. Invalid cloud provider flavor selection (400 validation)
2. Insufficient cloud resources (quota exceeded - 500)
3. Network failure during node provisioning
4. Invalid node configuration (conflicting settings)
5. Concurrent machine deployment creation/deletion (409)
6. Node scale failure (insufficient disk space, memory)
7. Cloud provider credential expiration mid-deployment
8. Metadata mutation failure (labels/annotations/taints rejected)

---

### 1.4 MemberService
**Location:** `/modules/web/src/app/core/services/member.ts`

**Primary Responsibility:** Project member management (add, edit, remove)

**Key Methods:**
| Method | Type | Current Error Handling | Special Behavior |
|--------|------|----------------------|------------------|
| `add()` | POST | No error handling | Direct HTTP |
| `list()` | GET | **Retry logic** | `retry({delay, count: 5})` |
| `edit()` | PUT | No error handling | Direct HTTP |
| `remove()` | DELETE | No error handling | Direct HTTP |

**Error Handling Pattern - UNIQUE:**
```typescript
list(projectID: string): Observable<Member[]> {
  return this._httpClient
    .get<Member[]>(url)
    .pipe(retry({
      delay: this._retryTime * this._appConfigService.getRefreshTimeBase(),
      count: this._maxRetries  // 5 retries with 3-second delay
    }));
}
```

**Retry Configuration:**
- Retry Time: 3 * refreshTimeBase (typically ~3 seconds)
- Max Retries: 5 attempts
- No exponential backoff - fixed delay only

**Critical Error Scenarios:**
1. Member email already exists in project (400/409)
2. Member not found when editing (404)
3. Insufficient permissions to manage members (403)
4. LDAP/OIDC user lookup failure (500)
5. Concurrent member removal (409)
6. Transient network error (triggers 5 retries)
7. Backend member service timeout
8. Invalid email format validation failure

---

### 1.5 NodeService
**Location:** `/modules/web/src/app/core/services/node.ts`

**Primary Responsibility:** Node data operations (not direct HTTP, wraps MachineDeploymentService)

**Key Methods (Wrapper Pattern):**
| Method | Wrapped Service | Error Handling |
|--------|-----------------|----------------|
| `createMachineDeployment()` | MachineDeploymentService.create() | Inherits from MD service |
| `editMachineDeployment()` | MachineDeploymentService.patch() | Inherits from MD service |
| `deleteMachineDeployment()` | MachineDeploymentService.delete() | Inherits from MD service |

**Error Handling Pattern:**
```typescript
createMachineDeployment(nodeData: NodeData, projectID: string, clusterID: string): Observable<MachineDeployment> {
  return this._machineDeploymentService.create(
    NodeService._getMachineDeploymentEntity(nodeData),
    clusterID,
    projectID
  );  // No error handling - passes through
}
```

**Special Operations:**
- Node state mutations (patches with custom payload)
- Taint/label/annotation filtering before submission
- Operating system profile annotation handling
- Null-field merging for PUT operations

**Critical Error Scenarios:**
1. Node configuration validation errors (400)
2. Operating system profile conflicts (400)
3. Taint/label format errors
4. Replicas bounds violation (min/max replicas)
5. Dynamic config conflict with static settings (400)
6. Concurrent machine deployment updates (409)
7. Node scale-up failure due to cloud quota
8. OS profile not supported by cloud provider

---

## Part 2: Error Scenarios Classification

### 2.1 Network/Connectivity Errors

**Category:** Infrastructure-level failures

| Scenario | Root Cause | Expected Behavior | Affected Services |
|----------|-----------|-------------------|-------------------|
| **Timeout** | Request exceeds 60s default | Service-level timeout error | All |
| **Connection Refused** | Backend unreachable | Network error event | All |
| **Offline Mode** | No internet connectivity | Network error event | All |
| **Slow Network** | Degraded connection | Partial timeouts, retry behavior | MemberService (retries), Others (fail) |
| **DNS Resolution Failure** | Invalid host | Network error event | All |
| **TLS/SSL Handshake Failure** | Certificate issues | Network error event | HTTPS endpoints |

**Test Implementation:**
```typescript
// Timeout simulation
req.error(new ErrorEvent('Timeout'), {status: 0});

// Connection refused
httpController.expectOne(...).error(new ErrorEvent('Connection refused'));

// Partial response (slow network)
// Timeout before response completes
```

---

### 2.2 HTTP 4xx Client Errors

**Category:** Request validation and authorization failures

#### 400 Bad Request
**Cause:** Invalid request payload, malformed JSON, missing required fields

| Service | Scenario | Example |
|---------|----------|---------|
| ClusterService | Invalid cluster spec | Missing provider configuration |
| ProjectService | Invalid project name | Empty string, special chars |
| MachineDeploymentService | Conflicting node settings | Min replicas > max replicas |
| MemberService | Invalid email format | "not-an-email" |
| NodeService | OS profile incompatible | Profile not available for cloud provider |

#### 401 Unauthorized
**Cause:** Missing or invalid authentication token

| Service | Scenario | Expected Action |
|---------|----------|-----------------|
| All Services | Expired token | Auth interceptor triggers re-auth |
| All Services | Missing Authorization header | Request rejected at interceptor |
| All Services | Malformed Bearer token | Request rejected at interceptor |

#### 403 Forbidden
**Cause:** Insufficient permissions/authorization

| Service | Scenario | Example |
|---------|----------|---------|
| ProjectService | Non-admin accessing all projects | Denied at project list |
| ClusterService | Member deleting cluster without permission | Delete rejected |
| MemberService | Non-owner managing members | Add/edit/remove rejected |
| ProjectService | User deleting project they don't own | Delete rejected |

#### 404 Not Found
**Cause:** Resource doesn't exist

| Service | Scenario | Example |
|---------|----------|---------|
| ClusterService | Fetch deleted cluster | projectClusterList includes stale ID |
| ProjectService | Access deleted project | selectedProject query fails |
| MachineDeploymentService | Get MD with invalid ID | Returns 404 |
| MemberService | Remove already-removed member | 404 error |

#### 409 Conflict
**Cause:** Concurrent modification or state conflict

| Service | Scenario | Example |
|---------|----------|---------|
| ProjectService | Delete project with active clusters | Conflict: clusters must be deleted first |
| MachineDeploymentService | Concurrent MD creation | Two requests create same MD |
| ClusterService | Upgrade attempt during upgrade | Conflict: upgrade already in progress |
| MemberService | Add member that already exists | Email already in project |

---

### 2.3 HTTP 5xx Server Errors

**Category:** Backend service failures

| Status | Scenario | Service Impact |
|--------|----------|-----------------|
| 500 Internal Error | Unhandled backend exception | All services affected |
| 502 Bad Gateway | Backend service down | Upstream proxy error |
| 503 Service Unavailable | Maintenance/overload | Temporary unavailability |
| 504 Gateway Timeout | Backend timeout | Slow backend response |

---

### 2.4 Validation Errors (Application-level)

**Category:** Data validation before/after API calls

| Type | Service | Example |
|------|---------|---------|
| **Pre-request** | MachineDeploymentService | Null key filtering in labels |
| **Pre-request** | NodeService | OS profile validation |
| **Post-response** | All | JSON parse error on malformed response |
| **Business Logic** | ProjectService | Search query with SQL-like injection |
| **Data Format** | All | Missing required fields in response |

---

### 2.5 State/Concurrency Errors

**Category:** Race conditions and state management issues

| Scenario | Services | Manifestation |
|----------|----------|----------------|
| **Cache invalidation** | ClusterService, ProjectService | Stale data displayed after mutation |
| **Multiple subscribers** | All (via shareReplay) | Shared error propagation |
| **Retry exhaustion** | MemberService | After 5 retries, error thrown |
| **Observable completion** | All | Unexpected complete before data |
| **Race condition** | ClusterService | projectClusterList updates during delete |

---

### 2.6 Permission/Authorization Errors

**Category:** Role-based access control (RBAC)

| Error Type | Scenario | Detection |
|------------|----------|-----------|
| **403 Forbidden** | User lacks role | API response |
| **Role Mismatch** | User expected permission not found | Frontend logic |
| **Member Status** | Removed member still active | Frontend cache |
| **Project Status** | Terminating project operations | Frontend state check |

---

## Part 3: Components Displaying Errors

### 3.1 Cluster List Component
**Location:** `/modules/web/src/app/cluster/list/component.ts`

**Responsibilities:**
- Display clusters, external clusters, KubeOne clusters
- Route based on resource type
- Integrate with admin settings (external cluster import toggle)

**Error Display Points:**
- Empty state when cluster list is empty
- Loading spinner during fetch
- Error notification (via ErrorNotificationsInterceptor)
- Disabled "Create Cluster" button on permission error

**Current Error Handling:**
```typescript
// No explicit error handling in component
// Relies on:
// 1. ErrorNotificationsInterceptor for user notifications
// 2. Service fallback (empty arrays on error)
// 3. Loading state indicator
```

**Tested Scenarios:**
- Cluster list timeout
- 403 Forbidden (permission denied)
- Empty cluster list (0 clusters)
- Network error during fetch
- Invalid external cluster configuration

---

### 3.2 Project Component (Project List)
**Location:** `/modules/web/src/app/project/component.ts`

**Responsibilities:**
- Display all projects in table or card view
- Handle search with debouncing (500ms)
- Sort by name, ID, role, cluster count
- Add/Edit/Delete projects with RBAC checks

**Error Display Points:**
- `isInitializing` flag for loading state
- `isProjectsLoading` flag for search loading
- Empty state message (isEmpty method)
- Add/Edit/Delete operation notifications
- Quota widget display (EE only)

**Current Error Handling:**
```typescript
// Search operation (line 359)
this._projectService.searchProjects(query, displayAll)
  .pipe(take(1))
  .subscribe(projects => {
    this.dataSource.data = projects;  // Graceful: empty array on error
    this.isProjectsLoading = false;
  });

// Delete operation (line 619-625)
this._projectService.delete(project.id)
  .subscribe(() => {
    this._notificationService.success(...);  // Only on success
    // No explicit error handling - ErrorNotificationsInterceptor handles it
  });
```

**Tested Scenarios:**
- Project list 401 Unauthorized
- Search timeout with complex query
- Delete project with active clusters (409)
- Permission denied for edit/delete (403)
- Empty projects list (initialization)
- Search with special characters (XSS prevention)

---

### 3.3 Machine Deployment Details Component
**Location:** `/modules/web/src/app/cluster/details/cluster/machine-deployment-details/component.ts`

**Responsibilities:**
- Display machine deployments (node pools)
- Show nodes, metrics, events for each MD
- Provide edit/delete/restart operations

**Error Display Points:**
- Machine deployment list loading state
- Nodes metrics loading
- Events list loading
- Operation result notifications

**Tested Scenarios:**
- MD list fetch timeout (403)
- Node metrics unavailable (500)
- Events list empty (normal state)
- Concurrent MD deletion (409)
- Invalid MD ID in URL (404)

---

## Part 4: Existing Error Handling Patterns

### 4.1 HttpInterceptor Pattern: ErrorNotificationsInterceptor
**Location:** `/modules/web/src/app/core/interceptors/error-notifications.ts`

**Behavior:**
- Catches ALL HTTP errors
- Maps error messages via regex patterns
- Silences specific error messages (user-facing)
- Shows user-friendly notifications
- Special handling for credential validation errors

**Error Message Mapping:**
```typescript
private readonly _errorMap = new Map<string, string>([
  ['"AccessKeyId" is not valid', 'Invalid credentials provided'],
  ['InvalidAccessKeySecret', 'Invalid credentials provided'],
  ['Unauthorized', 'Invalid credentials provided'],
  ['Authentication failed', 'Invalid credentials provided'],
  // ... 10+ more mappings
]);
```

**Silenced Error Messages:**
```typescript
private readonly _silenceErrArr = [
  'external cluster functionality',
  'configs.config.gatekeeper.sh "config" not found',
];

private readonly _silencedEndpoints = [
  'providers/gke/validatecredentials',
  'presets?name=',
  'applicationdefinitions/...',
];
```

**Notification Service Integration:**
- Shows toast notifications for errors
- Error notifications auto-dismiss after timeout
- Multiple errors queue in notification center

---

### 4.2 Service-Level Error Handling: catchError Pattern

**Pattern 1: Graceful Degradation (Empty Result)**
```typescript
// ClusterService.upgrades()
upgrades(): Observable<MasterVersion[]> {
  return this._http.get<MasterVersion[]>(url).pipe(
    catchError(() => of<MasterVersion[]>([]))
  );
}

// Result: Error silently returned as empty array
```

**Pattern 2: Pass-Through (No Error Handling)**
```typescript
// ClusterService.create()
create(): Observable<Cluster> {
  return this._http.post<Cluster>(url, model);
}

// Result: Error propagates to component
```

**Pattern 3: Retry Logic (MemberService)**
```typescript
list(): Observable<Member[]> {
  return this._httpClient
    .get<Member[]>(url)
    .pipe(retry({delay: 3000, count: 5}));
}

// Result: Retries 5 times on error, then throws
```

---

### 4.3 RxJS Operator Patterns for Error Handling

**Used Operators:**
- `catchError()` - Replace error with fallback observable
- `retry()` - Retry on error (fixed count/delay)
- `shareReplay()` - Cache results, share among subscribers
- `switchMapTo()` - Flatten nested observables
- `tap()` - Side effects (logging)

**Observable Caching with Error:**
```typescript
// In ClusterService, MachineDeploymentService
private _cluster$ = new Map<string, Observable<Cluster>>();

cluster(projectID: string, clusterID: string): Observable<Cluster> {
  if (!this._cluster$.get(id)) {
    const cluster$ = merge(this.onClusterUpdate, this._refreshTimer$)
      .pipe(switchMapTo(this._getCluster(projectID, clusterID)))
      .pipe(shareReplay({refCount: true, bufferSize: 1}));
    this._cluster$.set(id, cluster$);
  }
  return this._cluster$.get(id);
}

// Issue: Error cached in shareReplay, propagates to all subscribers
// No per-subscriber error handling
```

---

## Part 5: Test File Organization Plan

### 5.1 Directory Structure
```
modules/web/src/app/core/services/
├── cluster.spec.ts (existing: 15 tests)
│   ├── [NEW] Network Errors (4 tests)
│   ├── [NEW] HTTP 4xx/5xx Errors (8 tests)
│   ├── [NEW] Concurrent Operations (3 tests)
│   └── [NEW] Cache/Observable Errors (3 tests)
│
├── project.spec.ts (to create)
│   ├── HTTP Errors (5 tests)
│   ├── Search Error Scenarios (3 tests)
│   ├── Permission Errors (3 tests)
│   └── State Management Errors (2 tests)
│
├── machine-deployment.spec.ts (to create)
│   ├── Creation Validation Errors (4 tests)
│   ├── Concurrent Operations (3 tests)
│   ├── Network/Timeout Errors (3 tests)
│   └── Cloud Provider Errors (3 tests)
│
├── member.spec.ts (existing: basic tests)
│   ├── [NEW] Retry Exhaustion (2 tests)
│   ├── [NEW] Permission Errors (3 tests)
│   ├── [NEW] Duplicate Member Error (2 tests)
│   └── [NEW] Transient Network Errors (3 tests)
│
└── node.spec.ts (to create)
    ├── Validation Errors (4 tests)
    ├── Operating System Profile Errors (3 tests)
    ├── Concurrent Modifications (2 tests)
    └── Cloud Quota Errors (2 tests)

modules/web/src/app/cluster/list/
├── component.spec.ts (existing)
│   ├── [NEW] Cluster List Load Errors (3 tests)
│   ├── [NEW] Permission Denied (2 tests)
│   └── [NEW] Partial Load (1 test)

modules/web/src/app/project/
├── component.spec.ts (existing)
│   ├── [NEW] Project List Errors (3 tests)
│   ├── [NEW] Search Error Handling (2 tests)
│   └── [NEW] Delete Operation Errors (2 tests)

modules/web/src/app/cluster/details/cluster/machine-deployment-details/
└── component.spec.ts (existing)
    ├── [NEW] MD Load Errors (2 tests)
    └── [NEW] Node Metrics Errors (2 tests)
```

---

### 5.2 Test Categories by Service

#### ClusterService Error Tests (18 total)
**Existing:** 15 tests
**To Add:** 18 new tests

1. Network Timeout (4 tests)
   - projectClusterList timeout
   - Single cluster fetch timeout
   - Metrics fetch timeout
   - Events fetch timeout

2. HTTP 4xx Errors (8 tests)
   - 400 Bad Request (invalid cluster spec)
   - 401 Unauthorized (expired token)
   - 403 Forbidden (insufficient permissions)
   - 404 Not Found (cluster doesn't exist)
   - 409 Conflict (concurrent creation)
   - 400 + retry exhaustion
   - 401 on refresh timer trigger
   - 403 on specific endpoint

3. Concurrent Operations (3 tests)
   - Cache invalidation during update
   - Multiple subscribers receive error
   - Refresh timer fires during error state

4. Observable/Caching Errors (3 tests)
   - Error in shareReplay (affects multiple subscribers)
   - switchMapTo cancels pending request
   - refCount cleanup on unsubscribe

#### ProjectService Error Tests (13 total)

1. HTTP Errors (5 tests)
   - 401 Unauthorized
   - 403 Forbidden (project access denied)
   - 404 Not Found (project deleted)
   - 409 Conflict (delete with active clusters)
   - 500 Server Error

2. Search Error Scenarios (3 tests)
   - Search timeout
   - Special character injection attempt
   - Empty search results (no match)

3. Permission Errors (3 tests)
   - Non-admin accessing all projects
   - Non-owner deleting project
   - Member removing self

4. State Management Errors (2 tests)
   - displayAll flag race condition
   - Refresh timer conflict with manual update

#### MachineDeploymentService Error Tests (13 total)

1. Creation Validation Errors (4 tests)
   - Invalid cloud provider flavor
   - Min replicas > max replicas
   - Conflicting node configuration
   - Missing required metadata

2. Concurrent Operations (3 tests)
   - Two simultaneous creates of same MD
   - Delete during patch operation
   - Restart during scale

3. Network/Timeout Errors (3 tests)
   - Create MD timeout
   - Get nodes metrics timeout
   - List nodes events timeout

4. Cloud Provider Errors (3 tests)
   - Insufficient cloud quota
   - Credential expiration during provisioning
   - Unsupported node flavor

#### MemberService Error Tests (10 total)

1. Retry Exhaustion (2 tests)
   - List fails 5 times and throws
   - Verify retry count and delay

2. Permission Errors (3 tests)
   - Non-owner adding member
   - Non-owner removing member
   - Member edit without permission

3. Duplicate Member Error (2 tests)
   - Add member that already exists
   - Invalid email format

4. Transient Network Errors (3 tests)
   - First attempt fails, second succeeds (retry)
   - Random transient errors (3 retries)
   - Timeout on list with retry

#### NodeService Error Tests (11 total)

1. Validation Errors (4 tests)
   - Min/max replica validation
   - OS profile incompatibility
   - Taint format validation
   - Label format validation

2. Operating System Profile Errors (3 tests)
   - Profile not supported by cloud provider
   - Conflicting profile settings
   - Profile annotation parsing error

3. Concurrent Modifications (2 tests)
   - Patch during edit
   - Delete during scale operation

4. Cloud Quota Errors (2 tests)
   - Insufficient resources for scale-up
   - Provider quota exceeded

#### Component Error Tests (11 total)

**ClusterListComponent (3 tests)**
1. Cluster list timeout with error notification
2. 403 Permission denied - disabled create button
3. Empty cluster list (0 clusters) with message

**ProjectComponent (4 tests)**
1. Project list 401 Unauthorized with redirect
2. Search timeout with loading state reset
3. Delete project 409 Conflict (active clusters)
4. Permission denied for delete (403)

**MachineDeploymentDetailsComponent (2 tests)**
1. MD list load timeout
2. Node metrics 500 error (graceful degradation)

---

## Part 6: Test Data & Mocks

### 6.1 Test Utilities Available
```
modules/web/src/test/utils/
├── mock-observable-builder.ts
│   └── .success(), .error(), .timeout(), .successArray()
├── http-mock-builder.ts
│   └── .expectGetRequest(), .expectPostRequest(), etc.
├── test-bed-setup.ts
│   └── .configureBasicComponentTest(), etc.
├── fixture-helper.ts
│   └── .querySelector(), .triggerClick(), .detectChanges(), etc.
└── form-builder-helper.ts
    └── .createFormWithValidation(), .setControlValue(), etc.
```

### 6.2 Mock Data Available
```
modules/web/src/test/data/
├── cluster.ts - fakeDigitaloceanCluster(), fakeAWSCluster(), etc.
├── project.ts - fakeProject()
├── member.ts - fakeMember()
├── node.ts - fakeNode(), machineDeploymentsFake()
└── ... (15+ mock data files)
```

### 6.3 Recommended HttpTestingController Pattern
```typescript
describe('Service Error Scenarios', () => {
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServiceUnderTest],
      imports: [HttpClientTestingModule, ...]
    });
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();  // Ensures all requests are handled
  });

  it('should handle 401 Unauthorized', async () => {
    const result = lastValueFrom(service.method());
    const req = httpController.expectOne(url);

    req.error(new ErrorEvent('Unauthorized'), {status: 401});

    try {
      await result;
      fail('Should have thrown error');
    } catch (error: any) {
      expect(error.status).toBe(401);
    }
  });
});
```

---

## Part 7: Key Findings & Recommendations

### 7.1 Inconsistent Error Handling
**Finding:** Services use different error handling patterns:
- Some return empty arrays (graceful degradation)
- Some pass errors through
- MemberService uses retry logic
- No unified error handling strategy

**Impact:** Components must handle errors independently

**Recommendation:**
- Standardize error handling per service
- Document error contract per method
- Consider centralized error handling layer

---

### 7.2 Observable Caching Issues
**Finding:** `shareReplay()` caches errors, affecting all subscribers

**Example:**
```typescript
// If first subscriber encounters error, cached error affects subsequent subscribers
private _cluster$ = new Map<string, Observable<Cluster>>();
// Once error occurs, all new subscribers get cached error
```

**Impact:** Cascading failures across application

**Recommendation:**
- Clear cache on error
- Implement per-subscriber error handling
- Add error recovery logic

---

### 7.3 Retry Logic Gap
**Finding:** Only MemberService implements retry logic (5x with 3s delay)

**Impact:**
- Transient network errors fail immediately for other services
- No exponential backoff (fixed delay only)
- Affects cluster list, project list, etc.

**Recommendation:**
- Implement retry for critical operations (cluster list, project list)
- Use exponential backoff for sustained failures
- Make retry configurable per service

---

### 7.4 Error Message Mapping
**Finding:** ErrorNotificationsInterceptor maps 13+ error patterns to user-friendly messages

**Impact:** Credential errors properly communicated to users

**Recommendation:**
- Extend error mapping for new scenarios (409, validation errors)
- Test error message customization
- Add provider-specific error messages

---

### 7.5 Silent Failures
**Finding:** Some methods silently fail (return empty arrays)

**Services Affected:**
- ClusterService: upgrades(), cniVersions(), metrics(), events()
- ProjectService: searchProjects()
- MachineDeploymentService: list()

**Impact:** Users don't know why data is missing

**Recommendation:**
- Add error flags to component state
- Show "error loading" message instead of empty state
- Log errors for debugging

---

## Summary Table

| Service | Critical Methods | Error Handling | Test Gap | Priority |
|---------|-----------------|----------------|----------|----------|
| ClusterService | projectClusterList, create, patch, delete | Inconsistent | High | **HIGH** |
| ProjectService | projects, create, delete, search | Inconsistent | Medium | **HIGH** |
| MachineDeploymentService | create, list, patch, delete | Minimal | High | **HIGH** |
| MemberService | list, add, edit, remove | Retry logic | Medium | **MEDIUM** |
| NodeService | Wrapper service | Inherits | Medium | **MEDIUM** |

---

## Conclusion

**Total Recommended Test Cases: 65+ tests**

- **Service Tests:** 54 tests across 5 core services
- **Component Tests:** 11 tests across 3 display components
- **Coverage:** 8 error categories (network, HTTP 4xx, HTTP 5xx, validation, state, permission, concurrency, caching)

**Implementation Approach:**
1. Create new spec files for project, machine-deployment, and node services
2. Add error scenarios to existing cluster and member service tests
3. Enhance component tests with error display validation
4. Use HttpTestingController with ErrorEvent for network errors
5. Leverage MockObservableBuilder for timeout/error scenarios
6. Document error handling contract per service method

**Expected Benefits:**
- Improved error resilience
- Better user error messaging
- Reduced runtime failures in production
- Clear error handling patterns for future development
