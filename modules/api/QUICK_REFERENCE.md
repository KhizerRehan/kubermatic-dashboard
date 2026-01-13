# Kubermatic API - Quick Reference Guide

## For New Developers

### Core Concepts in 30 Seconds

1. **Providers** = Business logic interfaces (defined in `pkg/provider/types.go`)
2. **Handlers** = HTTP endpoints that call providers (in `pkg/handler/v1/...`)
3. **Middleware** = Authentication/context injection (in `pkg/handler/middleware/`)
4. **Impersonation** = User operations run as that user via Kubernetes RBAC

### The Three Layers

```
HTTP (handler/)
    ↓ calls
Provider (provider/)
    ↓ uses
Kubernetes Client (controller-runtime)
```

---

## Common Tasks

### I need to find a specific endpoint

**Search pattern:** `/api/v1/<resource>` → look in `handler/v1/<resource>/<resource>.go`

Examples:
- `/api/v1/projects` → `handler/v1/project/project.go`
- `/api/v1/clusters` → `handler/v1/cluster/cluster.go`
- `/api/v1/users` → `handler/v1/user/user.go`

### I need to understand how X is authenticated

Look in order:
1. `pkg/handler/auth/oidc.go` - OpenID Connect (primary)
2. `pkg/handler/auth/sa.go` - Service Account JWT
3. `pkg/handler/middleware/middleware.go` - SetAuthenticated middleware

### I need to find where a resource is created/updated

Pattern:
- Handler file: `pkg/handler/v1/<resource>/<resource>.go`
- Provider interface: `pkg/provider/types.go` (search for `<Resource>Provider interface`)
- Implementation: `pkg/provider/kubernetes/<resource>.go`

Example for clusters:
- Handler: `pkg/handler/v1/cluster/cluster.go` → calls `CreateEndpoint`
- Interface: `pkg/provider/types.go` → `type ClusterProvider interface`
- Impl: `pkg/provider/kubernetes/cluster.go` → `func (p *ClusterProvider) New(...)`

### I need to add a new endpoint

Checklist:
1. Add model to `pkg/api/v1/types.go`
2. Add provider interface to `pkg/provider/types.go`
3. Implement in `pkg/provider/kubernetes/<resource>.go`
4. Create handler in `pkg/handler/v1/<resource>/<resource>.go`
5. Register route in `pkg/handler/routes_v1.go`

### I need to understand permissions

Key insight: **There is NO permission checking in the handlers!**

Instead:
1. User token → extracted to get email + groups
2. Impersonated Kubernetes client created with that identity
3. All operations use impersonated client
4. Kubernetes RBAC server enforces permissions

Find impersonation code: `pkg/provider/kubernetes/impersonation.go`

### I need to understand how context works

Context carries:
- User info → `UserInfoContextKey`
- Cluster provider → `ClusterProviderContextKey`
- Auth token → `RawTokenContextKey`
- And 20+ other things

Set by: middleware in `pkg/handler/middleware/middleware.go`
Retrieved by: handlers with `ctx.Value(KeyName)`

### I need to find a specific handler function

The pattern is:
- Function name: `{Resource}{Operation}Endpoint`
- Examples: `CreateEndpoint`, `ListEndpoint`, `GetEndpoint`, `UpdateEndpoint`, `DeleteEndpoint`
- Located: `pkg/handler/v1/{resource}/{resource}.go`

---

## File Navigation

### Starting from a URL path

```
/api/v1/projects/{project_id}/clusters
    ↓
Look in: pkg/handler/v1/cluster/cluster.go
    ↓
Find: ListEndpoint (for GET), CreateEndpoint (for POST)
    ↓
Middleware adds: project provider, cluster provider, user info
    ↓
Calls: provider.List(...) or provider.New(...)
    ↓
Look in: pkg/provider/types.go for ClusterProvider interface
    ↓
Look in: pkg/provider/kubernetes/cluster.go for implementation
```

### Starting from a resource name

```
Want to understand: Clusters
    ↓
Handler logic: pkg/handler/v1/cluster/cluster.go (6-7 Endpoint functions)
    ↓
Provider interface: pkg/provider/types.go (search "ClusterProvider")
    ↓
Implementation: pkg/provider/kubernetes/cluster.go (200+ lines)
    ↓
Models: pkg/api/v1/types.go (Cluster struct)
    ↓
Routes: pkg/handler/routes_v1.go (registration)
```

---

## Code Examples

### How handlers are structured

```go
// handler/v1/cluster/cluster.go

// 1. Request struct
type CreateReq struct {
    ProjectID string
    Body      apiv1.CreateClusterSpec
}

// 2. Decode function (extract from HTTP request)
func (r CreateReq) DecodeCreateClusterRequest(ctx context.Context, 
    hr *http.Request) (interface{}, error) {
    // Parse URL path and body
}

// 3. Endpoint function (business logic)
func CreateEndpoint(projectProvider provider.ProjectProvider, ...) endpoint.Endpoint {
    return func(ctx context.Context, request interface{}) (interface{}, error) {
        req := request.(CreateReq)
        // Call provider
        return projectProvider.New(ctx, req.Body)
    }
}

// 4. Encode function (format response)
func EncodeCreateResponse(ctx context.Context, w http.ResponseWriter, 
    response interface{}) error {
    w.WriteHeader(http.StatusCreated)
    return json.NewEncoder(w).Encode(response)
}
```

### How providers are structured

```go
// provider/kubernetes/cluster.go

type ClusterProvider struct {
    createSeedImpersonatedClient ImpersonationClient
    client                       ctrlruntimeclient.Client
    // ... other fields
}

// Interface from types.go
func (p *ClusterProvider) New(ctx context.Context, 
    project *kubermaticv1.Project, 
    userInfo *provider.UserInfo, 
    cluster *kubermaticv1.Cluster) (*kubermaticv1.Cluster, error) {
    
    // Create impersonated client for user
    impersonated := createImpersonationClientWrapperFromUserInfo(userInfo, 
                                                    p.createSeedImpersonatedClient)
    
    // All operations through impersonated client
    // Kubernetes RBAC enforces permissions automatically
    return impersonated.Create(ctx, cluster)
}
```

### How middleware injects context

```go
// handler/middleware/middleware.go

func SetClusterProvider(getter ClusterProviderGetter) endpoint.Middleware {
    return func(next endpoint.Endpoint) endpoint.Endpoint {
        return func(ctx context.Context, req interface{}) (interface{}, error) {
            // Extract seed from request
            seed := extractSeedFromRequest(req)
            
            // Get provider
            provider, err := getter(seed)
            if err != nil {
                return nil, err
            }
            
            // Inject into context
            ctx = context.WithValue(ctx, ClusterProviderContextKey, provider)
            
            // Call next handler
            return next(ctx, req)
        }
    }
}
```

---

## Key Files to Know

### Provider/Data Access
- `pkg/provider/types.go` - ALL provider interfaces (bookmark this!)
- `pkg/provider/kubernetes/cluster.go` - Cluster CRUD
- `pkg/provider/kubernetes/project.go` - Project CRUD
- `pkg/provider/kubernetes/user.go` - User CRUD
- `pkg/provider/kubernetes/addon.go` - Addon CRUD

### Handlers
- `pkg/handler/routing.go` - Routing setup
- `pkg/handler/routes_v1.go` - Route registration
- `pkg/handler/middleware/middleware.go` - All middleware
- `pkg/handler/v1/<resource>/<resource>.go` - Specific endpoints

### Models/API Types
- `pkg/api/v1/types.go` - All API v1 data structures
- `cmd/kubermatic-api/main.go` - Startup/initialization
- `cmd/kubermatic-api/options.go` - Configuration

### Authentication
- `pkg/handler/auth/oidc.go` - OpenID Connect
- `pkg/handler/auth/sa.go` - Service Account
- `pkg/handler/auth/plugin.go` - Auth plugin system

---

## Debugging Tips

### "Where is this endpoint registered?"

```bash
# Search routes files
grep -r "Path.*cluster" modules/api/pkg/handler/routes*.go
```

### "What does this provider do?"

Look in `pkg/provider/types.go` for the interface definition, then grep for implementation:

```bash
grep -n "func.*ClusterProvider" modules/api/pkg/provider/kubernetes/*.go
```

### "How does user info flow?"

Trace through:
1. Middleware: `middleware.SetAuthenticated()` - extracts user
2. Middleware: `middleware.SetUserInfo()` - stores in context
3. Handler: `ctx.Value(UserInfoContextKey)` - retrieves user
4. Provider: receives user info via impersonation

### "What's using this Kubernetes resource?"

```bash
grep -r "kubermaticv1.Cluster" modules/api/pkg --include="*.go" | head -20
```

---

## Common Mistakes to Avoid

1. **❌ Writing permission checks in handlers**
   - Use impersonated clients instead
   - Kubernetes RBAC will enforce

2. **❌ Creating a new Kubernetes client instead of using context**
   - Always get provider/client from context via middleware
   - Ensures proper user impersonation

3. **❌ Bypassing the provider pattern**
   - Always call providers, never direct Kubernetes client calls
   - Providers are the abstraction layer

4. **❌ Not validating input before passing to Kubernetes**
   - Validate in handler before calling provider
   - Prevents bad data in cluster

5. **❌ Forgetting to return privileged variant**
   - Some operations need `PrivilegedClusterProvider`
   - Document when privileged access is needed

---

## Testing

### Create a test

```go
// handler/v1/cluster/cluster_test.go

func TestCreateCluster(t *testing.T) {
    // Create fake provider
    provider := &fakeProjectProvider{}
    
    // Create endpoint
    endpoint := CreateEndpoint(provider, ...)
    
    // Create request
    req := CreateReq{
        ProjectID: "proj123",
        Body: apiv1.CreateClusterSpec{...},
    }
    
    // Call endpoint
    response, err := endpoint(context.Background(), req)
    
    // Assert
    assert.NoError(t, err)
    assert.Equal(t, "proj123", response.(*kubermaticv1.Cluster).Name)
}
```

Find fakes in: `pkg/handler/test/fake_*.go`

---

## Performance Notes

- Context-runtime manager caches seed list (30 min TTL)
- Informers used for local cluster resources
- Avoid list operations in hot paths
- Use label selectors to narrow Kubernetes API calls

---

## API Versioning

- **v1** - Stable, well-tested
- **v2** - Newer, modern design
- Both exist simultaneously
- Add new features to v2 first, backport to v1 as needed

---

## Enterprise Edition (EE)

- Code in `pkg/ee/` directory
- Conditional compilation: `// +build !ce`
- Wrapped in `wrappers_ee.go` files
- Can be completely disabled with `-tags ce`

Example:
```go
// handler/auth/plugin.go

// +build !ce

// This whole file is only for EE
```

---

## Resources

- Main guide: `modules/api/ARCHITECTURE.md` (comprehensive)
- API docs: See `/api/swagger.json` endpoint
- Models: `pkg/api/v1/types.go` (start here for data structures)
- Provider interfaces: `pkg/provider/types.go` (bookmark this!)
