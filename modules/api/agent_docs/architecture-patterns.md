# Architecture Patterns

Detailed reference for the core architecture patterns used in the KKP Dashboard API.

## 1. Handler Pattern (HTTP Request -> Response)

**Location**: `pkg/handler/`

Routes are organized in a Gorilla Mux router with layers:
- **Middleware**: Authentication, RBAC, context enrichment
- **Handlers**: HTTP request parsing, delegation to providers, response encoding

```
HTTP Request -> Middleware Chain -> Handler Function -> Provider Call -> HTTP Response
```

**Handler Structure**:
```go
// Each endpoint follows Go-Kit pattern: Request -> Endpoint -> Response
func CreateEndpoint(providers...) endpoint.Endpoint {
    return func(ctx context.Context, request interface{}) (interface{}, error) {
        // Parse request, validate, call provider, return response
    }
}
```

**Key Components**:
- `routing.go` - Main route registration and parameter passing
- `routes_v1.go` - v1 API endpoint definitions
- `routes_v1_websocket.go` - WebSocket handlers for logs/events
- `routes_v1_admin.go` - Admin-only endpoints
- Handlers organized by resource: `v1/cluster/`, `v1/user/`, `v1/project/`, etc.

## 2. Provider Pattern (Business Logic Abstraction)

**Location**: `pkg/provider/`

Providers are interfaces that abstract data access and business logic. They enable:
- Dependency injection
- Easy mocking for tests
- Separation of HTTP concerns from business logic

**Provider Types**:

```
Top-level Providers:
├── ProjectProvider - CRUD operations on projects (user-scoped)
├── ClusterProvider - CRUD operations on clusters (via Getter function per seed)
├── UserProvider - User management
├── SSHKeyProvider - SSH key management (user-scoped)
├── ServiceAccountProvider - Service account management
├── PresetProvider - Cloud credential presets
├── SeedsGetter - List available seeds
├── SettingsProvider - Global/admin settings
├── AdminProvider - Admin-only operations

Getter Functions (return provider-per-seed):
├── ClusterProviderGetter - Returns ClusterProvider for a seed
├── AddonProviderGetter - Returns AddonProvider for a seed
├── AlertmanagerProviderGetter - Returns AlertmanagerProvider for a seed
├── ConstraintProviderGetter - Returns ConstraintProvider for a seed
└── ... (12+ additional getters for seed-scoped providers)

Privileged Providers (bypass RBAC for admin operations):
├── PrivilegedProjectProvider
├── PrivilegedSSHKeyProvider
├── PrivilegedServiceAccountProvider
└── PrivilegedServiceAccountTokenProvider
```

**Provider Implementation**: `pkg/provider/kubernetes/`

Most providers are implemented as Kubernetes client wrappers:
- Read/write Kubernetes custom resources (CRDs)
- Use impersonation clients for RBAC enforcement
- Query controller-runtime cache for reads

**Example**:
```go
// ClusterProvider methods
type ClusterProvider interface {
    New(ctx, project, userInfo, cluster) (*kubermaticv1.Cluster, error)
    List(ctx, project, userInfo) ([]*kubermaticv1.Cluster, error)
    Get(ctx, project, userInfo, clusterID) (*kubermaticv1.Cluster, error)
    Update(ctx, project, userInfo, cluster) (*kubermaticv1.Cluster, error)
    Delete(ctx, project, userInfo, clusterID) error
}
```

## 3. Middleware Pattern (Request Enhancement)

**Location**: `pkg/handler/middleware/middleware.go`

Middleware functions wrap HTTP handlers to:
- Extract and verify tokens
- Perform RBAC checks
- Inject context values (user info, cluster provider, etc.)
- Validate request parameters

**Key Middleware**:
- Token extraction/verification (OIDC + JWT service accounts)
- User context injection
- RBAC evaluation
- Cluster provider attachment
- Admin checks

## 4. Authentication Pattern

**Location**: `pkg/handler/auth/` and `pkg/provider/auth/`

Two authentication mechanisms:
1. **OIDC (OpenID Connect)**: For UI users
   - Token issued by external provider
   - Verified against issuer's public key
   - Also supports issuer role (internal KKP OAuth provider)

2. **Service Account JWT**: For programmatic access
   - Signed with shared secret
   - Token embedded in bearer Authorization header
   - Custom claims include service account name/namespace

**Flow**:
```
Request -> TokenExtractor (from header/cookie/query)
        -> TokenVerifier (OIDC or JWT)
        -> UserInfo injection into context
        -> Handler processing
```

## 5. Impersonation Pattern (RBAC Enforcement)

**Location**: `pkg/provider/kubernetes/impersonation_client.go`

For non-privileged operations, the API creates "impersonated" Kubernetes clients:

```go
// Instead of API server credentials, use client impersonating the user
client := impersonationClient.CreateImpersonatedClient(userInfo.Email)
// This client's requests include: Impersonate-User: user@example.com
// Kubernetes API server enforces RBAC based on this header
```

This ensures:
- Only users' own resources can be accessed
- RBAC policies naturally enforced by Kubernetes
- No custom authorization logic needed

## Key Files

| File | Purpose |
|------|---------|
| `cmd/kubermatic-api/main.go` | Server startup, provider initialization |
| `pkg/handler/routing.go` | Route registration, middleware setup |
| `pkg/handler/handler.go` | Error handling, JSON encoding |
| `pkg/provider/types.go` | Provider interfaces and function types |
| `pkg/handler/middleware/middleware.go` | Authentication and RBAC |
| `cmd/kubermatic-api/wrappers_*.go` | CE/EE feature branching |
