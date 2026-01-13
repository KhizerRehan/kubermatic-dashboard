# Kubermatic API Architecture Guide

## Overview

The Kubermatic API (located in `modules/api/`) is a comprehensive REST API built in Go that provides the backend for the Kubermatic Kubernetes Platform dashboard. It uses a well-structured, modular architecture that emphasizes separation of concerns, RBAC compliance, and impersonation-based access control.

**Key Framework Stack:**
- **HTTP Router:** Gorilla Mux
- **Transport Layer:** Go-Kit (github.com/go-kit)
- **Client Libraries:** controller-runtime, client-go
- **Versioning:** API v1 and v2 endpoints
- **Logging:** Zap with sugar layer

---

## 1. Package Structure

### Core Packages

```
modules/api/pkg/
├── api/                    # API data models and types
│   ├── v1/                 # Version 1 API types
│   │   ├── types.go        # Core model definitions
│   │   ├── time.go         # Time handling utilities
│   │   └── ...
│   └── v2/                 # Version 2 API types
│
├── handler/                # HTTP request handling
│   ├── routing.go          # Routing parameter aggregation
│   ├── handler.go          # Base handler utilities
│   ├── middleware/         # Request middleware
│   │   └── middleware.go   # Authentication, context injection
│   ├── auth/               # Authentication logic
│   │   ├── oidc.go         # OpenID Connect handler
│   │   ├── sa.go           # Service Account handler
│   │   └── plugin.go       # Auth plugin system
│   ├── v1/                 # v1 API endpoint handlers
│   │   ├── cluster/        # Cluster endpoints
│   │   ├── project/        # Project endpoints
│   │   ├── user/           # User endpoints
│   │   ├── admin/          # Admin-only endpoints
│   │   ├── common/         # Shared utilities
│   │   └── ...other resources...
│   ├── v2/                 # v2 API endpoint handlers
│   ├── common/             # Common handler logic
│   │   ├── cluster.go      # Cluster operation helpers
│   │   ├── provider/       # Cloud provider-specific logic
│   │   └── ...
│   └── test/               # Testing utilities
│       ├── fake_auth.go
│       ├── fake_provider.go
│       └── helper.go
│
├── provider/               # Business logic & data access
│   ├── types.go            # Provider interface definitions
│   ├── kubernetes/         # Kubernetes-based implementations
│   │   ├── cluster.go      # Cluster provider
│   │   ├── user.go         # User provider
│   │   ├── project.go      # Project provider
│   │   ├── addon.go        # Addon provider
│   │   ├── constraint.go   # Policy constraints
│   │   └── ...50+ files... # Other resource providers
│   ├── auth/               # Auth-related providers
│   ├── cloud/              # Cloud provider integrations
│   │   ├── aks/
│   │   ├── aws/
│   │   ├── azure/
│   │   ├── gcp/
│   │   ├── openstack/
│   │   ├── vsphere/
│   │   └── ...others...
│   └── conversions.go      # Type conversions
│
├── resources/              # Kubernetes resource reconciliation
│   ├── cluster/            # Cluster resource generation
│   ├── machine/            # Machine resource generation
│   └── reconciling/        # Reconciliation utilities
│
├── serviceaccount/         # Service Account token handling
│   └── jwt.go              # JWT token generation/validation
│
├── kubernetes/             # Kubernetes client utilities
├── machine/                # Machine/Node related logic
├── validation/             # Input validation
├── version/                # Version information
├── watcher/                # Event watchers
│   └── kubernetes/         # Kubernetes event watchers
│
├── test/                   # End-to-end test utilities
│   └── e2e/                # E2E test helpers
│
└── ee/                     # Enterprise Edition features
    ├── resource-quota/     # Resource quota management
    ├── clusterbackup/      # Cluster backup/restore
    ├── metering/           # Usage metering
    ├── kyverno/            # Policy management
    └── group-project-binding/
```

---

## 2. HTTP API Endpoint Organization

### Routing Structure

The API is organized into three main routing configurations:

#### **V1 API** (`routes_v1.go`)
Standard REST endpoints for all core resources:

```
/api/v1/
├── /healthz                                      # Health check
├── /version                                      # Version info
├── /dc                                           # Data centers
├── /seed                                         # Seeds (deployment targets)
├── /providers                                    # Cloud providers
├── /projects/{project_id}                        # Projects
│   ├── /clusters/{cluster_id}                    # Clusters
│   │   ├── /events                               # Cluster events
│   │   ├── /nodes                                # Worker nodes
│   │   ├── /machines                             # Machine deployments
│   │   ├── /addons                               # Cluster addons
│   │   ├── /kubeconfig                           # Kubeconfig generation
│   │   └── ...resource-specific endpoints...
│   ├── /users                                    # Project members
│   └── /serviceaccounts                          # Service accounts
├── /users                                        # User management
├── /admin                                        # Admin-only endpoints
├── /presets                                      # Cloud credential presets
└── /settings                                     # System settings
```

#### **V1 Admin API** (`routes_v1_admin.go`)
Admin-only endpoints for system management:

```
/api/v1/admin/
├── /seeds                                        # Seed management
├── /users                                        # User administration
├── /settings                                     # Global settings
├── /admission-plugins                            # Policy engines
└── /backup-destinations                          # Backup configuration
```

#### **V1 Optional Features** (`routes_v1_optional.go`)
Feature-gated endpoints:

```
/api/v1/
└── /kubeconfig                                   # OIDC-based kubeconfig
```

#### **WebSocket API** (`routes_v1_websocket.go`)
Real-time streaming endpoints:

```
/api/v1/
├── /projectevents                                # Project event streaming
├── /clusterevents                                # Cluster event streaming
└── /nodeevents                                   # Node event streaming
```

#### **V2 API** (`handler/v2/`)
Modern API endpoints (newer resource-focused design)

### Request Flow Pattern

```
HTTP Request
    ↓
Gorilla Mux Router
    ↓
HTTP Handler (v1/cluster/cluster.go, etc.)
    ↓
Go-Kit Endpoint (with middleware)
    ↓
Middleware Chain:
    1. Authentication
    2. Context Injection
    3. Authorization (RBAC)
    4. Resource Provider Lookup
    ↓
Handler Business Logic
    ↓
Provider Call (interface-based)
    ↓
Kubernetes Client Operations
    ↓
JSON Response
```

---

## 3. Architectural Patterns

### 3.1 Provider Pattern (Dependency Injection)

All business logic is abstracted behind provider interfaces defined in `pkg/provider/types.go`.

**Key Pattern Characteristics:**
- **Interface-driven:** All providers are interfaces, allowing for multiple implementations
- **Privilege Levels:** Providers come in unprivileged and privileged variants
- **Dependency Injection:** All providers are injected into handlers via `RoutingParams`

**Common Provider Types:**

```go
// Example from types.go

// Project-scoped, RBAC-compliant provider
type ClusterProvider interface {
    New(ctx context.Context, project *kubermaticv1.Project, 
        userInfo *UserInfo, cluster *kubermaticv1.Cluster) (*kubermaticv1.Cluster, error)
    List(ctx context.Context, options *ClusterListOptions) ([]*kubermaticv1.Cluster, error)
    Get(ctx context.Context, cluster *kubermaticv1.Cluster) (*kubermaticv1.Cluster, error)
    Update(ctx context.Context, cluster *kubermaticv1.Cluster) (*kubermaticv1.Cluster, error)
    Delete(ctx context.Context, cluster *kubermaticv1.Cluster) error
    // ... more methods
}

// Seed-scoped provider getter (factory pattern)
type ClusterProviderGetter = func(seed *kubermaticv1.Seed) (ClusterProvider, error)

// Privileged provider (bypasses RBAC)
type PrivilegedClusterProvider interface {
    New(ctx context.Context, cluster *kubermaticv1.Cluster) (*kubermaticv1.Cluster, error)
    // ... similar methods
}
```

**Provider Hierarchy:**

```
User makes request
    ↓
HTTP Handler extracts user info
    ↓
Middleware: UserInfo Context Injection
    ↓
Extract seed from request
    ↓
Provider Getter: ClusterProviderGetter(seed)
    ↓
Returns RBAC-compliant ClusterProvider
    ↓
All operations check user permissions via impersonation
```

### 3.2 Handler Structure

Each endpoint is implemented using Go-Kit patterns with three components:

#### **Request Struct**
```go
// In handler/v1/cluster/cluster.go
type CreateReq struct {
    ProjectID string
    Body      apiv1.CreateClusterSpec
}

func (r CreateReq) DecodeCreateClusterRequest(ctx context.Context, r *http.Request) (interface{}, error) {
    // Extract from URL path and request body
}
```

#### **Endpoint Function**
```go
func CreateEndpoint(
    projectProvider provider.ProjectProvider,
    privilegedProjectProvider provider.PrivilegedProjectProvider,
    seedsGetter provider.SeedsGetter,
    // ... other dependencies
) endpoint.Endpoint {
    return func(ctx context.Context, request interface{}) (interface{}, error) {
        req := request.(CreateReq)
        // Business logic
        return result, nil
    }
}
```

#### **Response Encoder**
```go
func EncodeCreateResponse(ctx context.Context, w http.ResponseWriter, 
                          response interface{}) error {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    return json.NewEncoder(w).Encode(response)
}
```

#### **Middleware Wrapping**
```go
// In routing.go
r.handler = 
    middleware.SetClusterProvider(r.clusterProviderGetter, r.seedsGetter)(
    middleware.SetUserInfo(r.userInfoGetter)(
    middleware.SetAuthenticated(r.tokenVerifiers, r.tokenExtractors)(
    endpoint_func
)))
```

### 3.3 Impersonation-Based Authorization

The API uses a sophisticated impersonation system for RBAC:

**Core Concept:** Instead of checking permissions in code, the system creates Kubernetes clients that act as the user, and lets the Kubernetes API server enforce RBAC.

**Implementation:**

```go
// NewImpersonationClient creates a client factory
func NewImpersonationClient(cfg *rest.Config, mapper meta.RESTMapper) *ImpersonationClient

// When a user makes a request, we extract their info
userInfo := extractFromOIDCToken(token)

// Create an impersonated client for this user
impersonatedClient := createImpersonationClient(userInfo.Name, userInfo.Groups)

// All API calls use this client - Kubernetes RBAC applies automatically
cluster, err := impersonatedClient.Get(ctx, clusterName)
// If user lacks permission, Kubernetes returns 403
```

**Provider Implementation:**

```go
// In pkg/provider/kubernetes/cluster.go
type ClusterProvider struct {
    createSeedImpersonatedClient ImpersonationClient
    // ... other fields
}

func (p *ClusterProvider) List(ctx context.Context, options *ClusterListOptions) {
    // Create impersonated client for the current user
    impersonatedClient := p.createSeedImpersonatedClient(userInfo)
    
    // All operations go through impersonated client
    return impersonatedClient.List(ctx, ...)
}
```

**Benefits:**
- Single source of truth for permissions: Kubernetes RBAC
- No custom permission checking logic
- Automatic support for all RBAC features (roles, rolebindings, aggregation)
- Scope limitations work correctly (namespace, cluster)

### 3.4 Context-Based Dependency Injection

Middleware injects providers and user information into request context:

```go
// In middleware/middleware.go
const (
    UserInfoContextKey kubermaticcontext.Key = "user-info"
    ClusterProviderContextKey kubermaticcontext.Key = "cluster-provider"
    AuthenticatedUserContextKey kubermaticcontext.Key = "authenticated-user"
)

// Example middleware
func SetClusterProvider(getter ClusterProviderGetter, seedsGetter SeedsGetter) endpoint.Middleware {
    return func(next endpoint.Endpoint) endpoint.Endpoint {
        return func(ctx context.Context, request interface{}) (interface{}, error) {
            // Extract seed from request
            // Get provider
            clusterProvider, ctx, err := GetClusterProvider(ctx, request, 
                                                            seedsGetter, getter)
            if err != nil {
                return nil, err
            }
            
            // Inject into context
            ctx = context.WithValue(ctx, ClusterProviderContextKey, clusterProvider)
            
            return next(ctx, request)
        }
    }
}

// In handler, retrieve from context
func ListEndpoint(ctx context.Context, request interface{}) {
    clusterProvider := ctx.Value(ClusterProviderContextKey).(provider.ClusterProvider)
    return clusterProvider.List(ctx, options)
}
```

---

## 4. Kubernetes Integration Patterns

### 4.1 Multi-Cluster Architecture

The API manages multiple Kubernetes clusters:

1. **Master Cluster:** Runs the Kubermatic control plane
   - Stores User, Project, Cluster, Seed resources
   - Uses controller-runtime manager for caching
   
2. **Seed Clusters:** Deployment targets (host user clusters)
   - Hosts the actual user clusters
   - Multiple seeds can exist for HA/multi-region
   
3. **User Clusters:** Customer workload clusters
   - Accessed via seed kubeconfig
   - Each cluster has its own namespace in a seed

**Data Flow:**

```
Request to /projects/{pid}/clusters/{cid}/...
    ↓
Routing extracts project ID and cluster ID
    ↓
Middleware: Get seeds from master cluster cache
    ↓
Find which seed hosts this cluster
    ↓
Get seed kubeconfig
    ↓
Create client scoped to that seed
    ↓
Create impersonated client for user
    ↓
Perform operation on seed cluster
    ↓
Return result
```

### 4.2 Provider Implementation Pattern

Each resource type has a corresponding Kubernetes provider:

```go
// Pattern example: ClusterProvider in pkg/provider/kubernetes/cluster.go

type ClusterProvider struct {
    // Connections
    createSeedImpersonatedClient ImpersonationClient
    userClusterConnProvider      UserClusterConnectionProvider
    client                       ctrlruntimeclient.Client
    masterClient                 ctrlruntimeclient.Client
    k8sClient                    kubernetes.Interface
    seedKubeconfig               *rest.Config
    
    // Metadata
    workerName                   string
    extractGroupPrefix           extractGroupPrefixFunc
    oidcKubeConfEndpoint         bool
    seed                         *kubermaticv1.Seed
}

// All CRUD operations follow the same pattern:
// 1. Create/get impersonated client
// 2. Validate inputs
// 3. Create Kubernetes resource
// 4. Wait for resource to be available
// 5. Return result
```

### 4.3 Event Watching

Real-time updates via watchers:

```go
// In pkg/watcher/kubernetes/

// UserWatcher watches for User resource changes
type UserWatcher struct {
    handlers []WatchHandler
}

// Integrated into main startup
userWatcher, err := NewUserWatcher(ctx, log)
userInformer, err := mgr.GetCache().GetInformer(ctx, &kubermaticv1.User{})
userInformer.AddEventHandler(userWatcher)
```

---

## 5. Authentication and Authorization Patterns

### 5.1 Authentication Methods

Supported authentication mechanisms:

#### **OIDC (OpenID Connect)** - Primary
```go
// In pkg/handler/auth/oidc.go

type OpenIDClient struct {
    oidcConfig     *authtypes.OIDCConfiguration
    tokenExtractor authtypes.TokenExtractor
    verifier       *oidc.IDTokenVerifier
    provider       *oidc.Provider
}

// Token extraction strategies
- Authorization: Bearer header
- Query parameter: ?token=...
- Cookie-based tokens
```

#### **Service Account (JWT)**
```go
// In pkg/handler/auth/sa.go

type ServiceAccountAuthClient struct {
    tokenExtractor authtypes.TokenExtractor
    authenticator  serviceaccount.TokenAuthenticator
    saProvider     provider.ServiceAccountTokenProvider
}

// Validates JWT tokens signed by service account key
```

#### **Plugin-based**
```go
// In pkg/handler/auth/plugin.go

// Extensible plugin system for custom auth methods
```

### 5.2 Token Handling

```go
// Multiple extractors tried in order
tokenExtractors := auth.NewCombinedExtractor(
    auth.NewHeaderBearerTokenExtractor("Authorization"),
    auth.NewCookieHeaderBearerTokenExtractor("token"),
    auth.NewQueryParamBearerTokenExtractor("token"),
)

// Token verification
verifier := auth.NewTokenVerifierPlugins(
    []authtypes.TokenVerifier{
        oidcVerifier,      // Try OIDC first
        jwtVerifier,       // Then try JWT
    },
)
```

### 5.3 Authorization (RBAC)

Authorization happens at Kubernetes level:

1. **User Identity Extraction**
   - Extract user claims from token (email, groups, custom claims)
   
2. **Kubernetes RBAC Application**
   - Create impersonated client with user identity
   - Kubernetes API server enforces roles/rolebindings
   - No additional logic needed in API code

3. **Context Propagation**
   - User info stored in request context
   - Passed through to all provider operations
   - Impersonation client created per-request

**Example Flow:**

```
Request with Bearer token
    ↓
Middleware: Extract and verify token
    ↓
Get OIDC claims (email: user@company.com, groups: [team-a, team-b])
    ↓
Store in context
    ↓
Create impersonated client acting as user@company.com
    ↓
API call: GET /clusters
    ↓
Kubernetes RBAC check: Does user@company.com have permission?
    ↓
User can only see clusters in projects they're assigned to
```

---

## 6. Common Handler Patterns

### 6.1 Cluster Operations (Most Complex)

```
├── Create     → cluster.CreateEndpoint → handlercommon.CreateEndpoint
├── Get        → cluster.GetEndpoint → handlercommon.GetEndpoint
├── List       → cluster.ListEndpoint
├── Update     → cluster.UpdateEndpoint
├── Delete     → cluster.DeleteEndpoint
├── Patch      → cluster.PatchEndpoint
├── Kubeconfig → kubeconfig.GetKubeconfigEndpoint
├── Events     → events.ListEndpoint
├── Nodes      → nodes.ListEndpoint
├── Machines   → machines.ListEndpoint
└── Addons     → addons.ListEndpoint
```

Cluster operations use `handler/common/cluster.go` which contains shared logic:
- Validation
- Resource creation
- Status updates
- Kubeconfig generation
- Event handling

### 6.2 Nested Resources Pattern

Endpoint organization for nested resources:

```
/projects/{project_id}/clusters/{cluster_id}/addons/{addon_id}
    ↓
Extract path params from request
    ↓
Get ClusterProvider from context
    ↓
Get ProjectProvider to validate project access
    ↓
Get AddonProvider for actual operations
    ↓
Perform operation within cluster context
```

### 6.3 Provider Lookup Pattern

For seed-based resources:

```go
// Get seeds
seeds, err := seedsGetter()

// Find right seed for resource
for _, seed := range seeds {
    // Get provider for this seed
    provider, err := providerGetter(seed)
    
    // Try operation
    result, err := provider.Get(ctx, resourceID)
    if err == nil {
        return result
    }
}
```

---

## 7. Key Design Principles

### 7.1 Separation of Concerns

- **Handlers:** HTTP request/response handling
- **Providers:** Business logic and data access
- **Models:** Data structures
- **Middleware:** Cross-cutting concerns (auth, logging, metrics)

### 7.2 Interface-Based Architecture

- All major components are interfaces
- Allows multiple implementations
- Easy to mock for testing
- Privilege variants (privileged vs unprivileged)

### 7.3 Context Threading

- Context carries user info, providers, and dependencies
- Middleware chains build up context
- Handlers retrieve what they need from context
- Clean separation between concerns

### 7.4 Go-Kit Framework Usage

Benefits:

```
Endpoint Middleware
    ↑
    HTTP Transport
        ↑
        Router
            ↑
            Handler Logic
```

Each layer can be decorated independently with:
- Logging
- Metrics
- Error handling
- Request/response encoding

### 7.5 RBAC Compliance

Every operation:
1. Extracts user information
2. Creates user-scoped Kubernetes client
3. Uses only that client for operations
4. Kubernetes enforces permissions automatically

---

## 8. Testing Architecture

### 8.1 Test Utilities

Located in `pkg/handler/test/`:

```go
// Fake implementations for testing
- fake_auth.go       // Mock authentication
- fake_provider.go   // Mock providers
- fake_schema.go     // Mock Kubernetes schema
- fake_wrapper.go    // Mock CE/EE wrappers
- helper.go          // Test helpers
```

### 8.2 Testing Pattern

```go
// Create fake providers
projectProvider := &fakeProjectProvider{}

// Create handler with fakes
handler := projectEndpoint(projectProvider)

// Create test request
req := httptest.NewRequest("GET", "/projects/123", nil)
w := httptest.NewRecorder()

// Execute
handler.ServeHTTP(w, req)

// Verify
assert.Equal(t, 200, w.Code)
```

---

## 9. Enterprise Edition (EE) Extension Pattern

EE features use a wrapper pattern:

```go
pkg/ee/
├── clusterbackup/
├── metering/
├── resource-quota/
├── kyverno/
└── group-project-binding/
```

**Extension Mechanism:**

```go
// In cmd/kubermatic-api/wrappers_ee.go

func wrapHandlers_ee(handlers) {
    // Add EE-only routes
    // Register additional providers
    // Apply EE middleware
}
```

**Conditional Compilation:**

```go
// +build !ce

// This file only builds without -tags ce (CE = Community Edition)
// EE features are included by default
```

---

## 10. Startup and Initialization

### 10.1 Main Flow

```
main()
    ↓
Parse flags and create server options
    ↓
Initialize logging (Zap)
    ↓
Create controller-runtime manager for master cluster
    ↓
Create and inject all providers
    ↓
Create auth clients (OIDC, JWT)
    ↓
Create API handler with all dependencies
    ↓
Register routes (v1, v1-admin, v2, websocket)
    ↓
Start HTTP server
```

### 10.2 Provider Initialization

```go
// In main.go createInitProviders()

providers := providers{
    // User/Auth providers
    user:                                  userProvider,
    userInfoGetter:                        userInfoGetter,
    
    // Project management
    project:                               projectProvider,
    privilegedProject:                     privilegedProjectProvider,
    projectMember:                         projectMemberProvider,
    
    // Cluster management
    clusterProviderGetter:                 clusterProviderGetter,
    addonProviderGetter:                   addonProviderGetter,
    
    // Infrastructure
    seedsGetter:                           seedsGetter,
    seedClientGetter:                      seedClientGetter,
    
    // Watchers for real-time updates
    settingsWatcher:                       settingsWatcher,
    userWatcher:                           userWatcher,
    
    // And 40+ more providers...
}
```

---

## 11. Quick Reference: Adding New Features

### Add a New Endpoint

1. **Define Models** (`pkg/api/v1/types.go`)
   ```go
   type MyResource struct {
       ID   string
       Name string
   }
   ```

2. **Create Provider Interface** (`pkg/provider/types.go`)
   ```go
   type MyResourceProvider interface {
       List(ctx context.Context) ([]MyResource, error)
       Get(ctx context.Context, id string) (*MyResource, error)
   }
   ```

3. **Implement Provider** (`pkg/provider/kubernetes/myresource.go`)
   ```go
   type MyResourceProvider struct {
       client ctrlruntimeclient.Client
   }
   ```

4. **Create Handler** (`pkg/handler/v1/myresource/myresource.go`)
   ```go
   func ListEndpoint(provider MyResourceProvider) endpoint.Endpoint {
       return func(ctx context.Context, request interface{}) {
           return provider.List(ctx)
       }
   }
   ```

5. **Register Route** (`pkg/handler/routes_v1.go`)
   ```go
   mux.Methods(http.MethodGet).
       Path("/myresources").
       Handler(r.listMyResources())
   ```

---

## 12. Dependency Graph

```
HTTP Request
    ↓
Gorilla Mux (Router)
    ↓
Go-Kit Transport
    ↓
Middleware Chain
    ├── setSecureHeaders
    ├── setAuthentication
    │   ├── TokenVerifier (OIDC/JWT)
    │   └── Extract user info
    ├── setUserInfo (context injection)
    ├── setClusterProvider (context injection)
    └── setAuthorization (impersonation)
    ↓
Handler Endpoint
    ↓
Provider Interface
    ↓
Kubernetes Client
    │ ├── Master cluster (via manager)
    │ ├── Seed cluster (via seed kubeconfig)
    │ └── User cluster (via cluster connection)
    ↓
Kubernetes API Server
    ↓
Response
    ↓
Encoder
    ↓
HTTP Response
```

---

## 13. File Organization Best Practices

### Handler Files
- `handler/v1/{resource}/{resource}.go` - main handler
- `handler/v1/{resource}/{resource}_test.go` - tests
- Handler provides only HTTP transport concerns

### Provider Files
- `provider/kubernetes/{resource}.go` - implementation
- Contains business logic
- Uses Kubernetes client underneath

### Common Code
- `handler/common/{operation}.go` - shared endpoint logic
- `provider/{operation}.go` - shared provider interfaces

### Tests
- `{component}_test.go` - unit tests
- `test/e2e/` - integration tests
- Use fake implementations for isolation

---

## Summary

The Kubermatic API represents a **mature, production-grade REST API architecture** with:

1. **Clean Separation of Concerns:** Handlers (HTTP), Providers (logic), Models (data)
2. **Interface-Driven Design:** Enables testing, extensions, and multiple implementations
3. **Context-Based Dependency Injection:** Clean middleware chain pattern
4. **RBAC-First Authorization:** Uses Kubernetes RBAC, no custom permission logic
5. **Impersonation Pattern:** User operations execute as the user, Kubernetes enforces permissions
6. **Go-Kit Framework:** Standard transport, endpoint, and middleware patterns
7. **Multi-Cluster Support:** Handles master, seed, and user clusters gracefully
8. **Enterprise-Ready:** Pluggable extensions, feature flags, comprehensive logging

This architecture makes the codebase **maintainable, testable, and scalable** for future development.
