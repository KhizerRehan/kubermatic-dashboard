# Restructure modules/api/CLAUDE.md Using Progressive Disclosure

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce `modules/api/CLAUDE.md` from 588 lines to ~180 lines by extracting detailed reference content into `agent_docs/` files loaded via `@` imports.

**Architecture:** The current monolithic CLAUDE.md contains both essential quick-reference content (commands, structure, how-to guides) and deep reference material (architecture patterns, domain concepts, import aliases). We split these: the index stays in CLAUDE.md with brief summaries and `@agent_docs/*.md` references; detailed explanations move to focused single-topic files.

**Tech Stack:** Markdown with `@` import syntax (Claude Code progressive disclosure)

---

## Current State Analysis

**File:** `modules/api/CLAUDE.md` (588 lines)

| Section | Lines | Action |
|---------|-------|--------|
| Header + Overview | 1-20 | **Keep** (trim slightly) |
| Common Development Commands | 22-103 | **Keep** (essential quick-ref) |
| Project Structure | 105-122 | **Keep** |
| Main Entry Point | 124-150 | **Shorten** to 5-line summary, extract startup detail |
| Core Architecture Patterns (5 patterns) | 152-296 | **Extract** to `agent_docs/architecture-patterns.md` |
| API Versions and Routing | 298-338 | **Extract** to `agent_docs/api-routing.md` |
| CE/EE Edition Handling | 340-397 | **Extract** to `agent_docs/edition-handling.md` |
| Key Concepts (Seeds, Projects, etc.) | 399-460 | **Extract** to `agent_docs/domain-concepts.md` |
| Key Technologies | 462-470 | **Keep** (already concise) |
| Configuration and Flags | 472-488 | **Extract** to `agent_docs/domain-concepts.md` |
| Common Patterns (Adding endpoints, etc.) | 490-517 | **Keep** (essential how-to) |
| Testing | 519-521 | **Keep** |
| Metrics and Monitoring | 523-525 | **Keep** |
| Key Files to Understand | 527-536 | **Keep** |
| Important Import Aliases | 538-575 | **Extract** to `agent_docs/import-aliases.md` |
| Development Tips | 577-588 | **Keep** |

## Target File Structure

```
modules/api/
├── CLAUDE.md                              # ~180 lines (concise index)
├── agent_docs/
│   ├── architecture-patterns.md           # Handler, Provider, Middleware, Auth, Impersonation
│   ├── api-routing.md                     # V1/V2 API versions, resource handlers
│   ├── edition-handling.md                # CE/EE build tags, wrappers, EE packages
│   ├── domain-concepts.md                 # Seeds, Projects, UserContext, Config flags
│   └── import-aliases.md                  # Required import aliases (enforced by linter)
```

---

## Chunk 1: Create agent_docs/ Reference Files

### Task 1: Create `agent_docs/architecture-patterns.md`

**Files:**
- Create: `modules/api/agent_docs/architecture-patterns.md`

- [ ] **Step 1: Create the architecture patterns reference file**

Extract lines 152-296 from current CLAUDE.md into this file. Content covers 5 patterns:

```markdown
# Architecture Patterns

Detailed reference for the core architecture patterns used in the KKP Dashboard API.

## 1. Handler Pattern (HTTP Request -> Response)

**Location**: `pkg/handler/`

Routes are organized in a Gorilla Mux router with layers:
- **Middleware**: Authentication, RBAC, context enrichment
- **Handlers**: HTTP request parsing, delegation to providers, response encoding

\```
HTTP Request -> Middleware Chain -> Handler Function -> Provider Call -> HTTP Response
\```

**Handler Structure**:
\```go
// Each endpoint follows Go-Kit pattern: Request -> Endpoint -> Response
func CreateEndpoint(providers...) endpoint.Endpoint {
    return func(ctx context.Context, request interface{}) (interface{}, error) {
        // Parse request, validate, call provider, return response
    }
}
\```

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

\```
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
\```

**Provider Implementation**: `pkg/provider/kubernetes/`

Most providers are implemented as Kubernetes client wrappers:
- Read/write Kubernetes custom resources (CRDs)
- Use impersonation clients for RBAC enforcement
- Query controller-runtime cache for reads

**Example**:
\```go
// ClusterProvider methods
type ClusterProvider interface {
    New(ctx, project, userInfo, cluster) (*kubermaticv1.Cluster, error)
    List(ctx, project, userInfo) ([]*kubermaticv1.Cluster, error)
    Get(ctx, project, userInfo, clusterID) (*kubermaticv1.Cluster, error)
    Update(ctx, project, userInfo, cluster) (*kubermaticv1.Cluster, error)
    Delete(ctx, project, userInfo, clusterID) error
}
\```

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
\```
Request -> TokenExtractor (from header/cookie/query)
        -> TokenVerifier (OIDC or JWT)
        -> UserInfo injection into context
        -> Handler processing
\```

## 5. Impersonation Pattern (RBAC Enforcement)

**Location**: `pkg/provider/kubernetes/impersonation_client.go`

For non-privileged operations, the API creates "impersonated" Kubernetes clients:

\```go
// Instead of API server credentials, use client impersonating the user
client := impersonationClient.CreateImpersonatedClient(userInfo.Email)
// This client's requests include: Impersonate-User: user@example.com
// Kubernetes API server enforces RBAC based on this header
\```

This ensures:
- Only users' own resources can be accessed
- RBAC policies naturally enforced by Kubernetes
- No custom authorization logic needed
```

- [ ] **Step 2: Commit**

```bash
git add modules/api/agent_docs/architecture-patterns.md
git commit -m "docs(api): extract architecture patterns to agent_docs"
```

---

### Task 2: Create `agent_docs/api-routing.md`

**Files:**
- Create: `modules/api/agent_docs/api-routing.md`

- [ ] **Step 1: Create the API routing reference file**

Extract lines 298-338 from current CLAUDE.md:

```markdown
# API Versions and Routing

Detailed reference for the REST API versioning and route organization.

## V1 API (`/api/v1/*`)

**Location**: `pkg/handler/v1/`, `pkg/api/v1/`

Legacy REST API with separate handler functions per HTTP method:
- GET `/api/v1/projects` - List user's projects
- POST `/api/v1/projects` - Create project
- GET `/api/v1/projects/{projectID}/clusters` - List clusters in project
- DELETE `/api/v1/projects/{projectID}` - Delete project
- WebSocket `/api/v1/projects/{projectID}/clusters/{clusterID}/logs` - Stream logs

**Resource Handlers**:
\```
addon/              cluster/            dc/                 label/
node/               presets/            project/            seed/
serviceaccount/     ssh/                user/
admin/              (admin-only routes)
\```

## V2 API (`/api/v2/*`)

**Location**: `pkg/handler/v2/`, `pkg/api/v2/`

Newer unified API with consistent patterns across resources:
- RESTful design with consistent CRUD operations
- Support for additional features like:
  - Cluster backups (EE only)
  - Resource quotas (EE only)
  - Kyverno policies (EE only)
  - Constraint templates
  - Applications

**Resource Handlers** (42+ resources):
\```
addon/                     alertmanager/              application_definition/
application_installation/  cluster/                   cluster_template/
clusterbackup/            constraint/                constraint_template/
etcdbackupconfig/         etcdrestore/               allowed_registry/
... (many more)
\```
```

- [ ] **Step 2: Commit**

```bash
git add modules/api/agent_docs/api-routing.md
git commit -m "docs(api): extract API routing reference to agent_docs"
```

---

### Task 3: Create `agent_docs/edition-handling.md`

**Files:**
- Create: `modules/api/agent_docs/edition-handling.md`

- [ ] **Step 1: Create the edition handling reference file**

Extract lines 340-397 from current CLAUDE.md:

```markdown
# Enterprise Edition (EE) vs Community Edition (CE)

Detailed reference for the CE/EE edition handling in the API module.

## Build Tag System

\```go
//go:build ee    // Included in EE builds only (KUBERMATIC_EDITION=ee)
//go:build !ee   // Included in CE builds only
\```

## Makefile Build

\```makefile
KUBERMATIC_EDITION ?= ee
go build -tags "$(KUBERMATIC_EDITION)" -o $@ ./cmd/$*
\```

## CE-Only Components

**Location**: `cmd/kubermatic-api/wrappers_ce.go`

In CE mode, these providers are stubbed to return `nil`:
- `resourceQuotaProviderFactory()` - Resource quota enforcement
- `groupProjectBindingFactory()` - Group-based project access
- `backupStorageProviderFactory()` - Backup storage configuration
- `policyTemplateProviderFactory()` - Policy template management

## EE-Only Components

**Location**: `pkg/ee/` and `cmd/kubermatic-api/wrappers_ee.go`

EE-specific packages:
\```
ee/
├── clusterbackup/              # Backup/restore operations
├── resource-quota/             # Quota enforcement
├── group-project-binding/      # Group-based access control
├── kyverno/                    # Policy management
├── metering/                   # Usage tracking
└── provider/                   # EE-specific providers
\```

## Implementation Pattern

Wrapper functions in `main.go` are overridden per edition:

\```go
// CE version (wrappers_ce.go)
func resourceQuotaProviderFactory(...) provider.ResourceQuotaProvider {
    return nil  // Not available
}

// EE version (wrappers_ee.go)
func resourceQuotaProviderFactory(...) provider.ResourceQuotaProvider {
    return eeapi.ResourceQuotaProviderFactory(...)  // Full implementation
}
\```
```

- [ ] **Step 2: Commit**

```bash
git add modules/api/agent_docs/edition-handling.md
git commit -m "docs(api): extract edition handling reference to agent_docs"
```

---

### Task 4: Create `agent_docs/domain-concepts.md`

**Files:**
- Create: `modules/api/agent_docs/domain-concepts.md`

- [ ] **Step 1: Create the domain concepts reference file**

Extract lines 399-488 (Key Concepts + Configuration and Flags) from current CLAUDE.md:

```markdown
# Domain Concepts and Configuration

Key domain concepts and configuration reference for the KKP Dashboard API.

## Seeds (Kubernetes Clusters)

**Definition**: A "Seed" is a Kubernetes cluster that hosts user clusters (via KubeVirt or similar).

**Location**: Kubermatic CRD `kubermaticv1.Seed`

The API needs to:
1. Discover available seeds via `SeedsGetter`
2. Get kubeconfig for each seed via `SeedKubeconfigGetter`
3. Create seed-specific providers via getters (e.g., `ClusterProviderGetter`)

**Example Flow**:
\```
Client request for clusters in project X
-> Get all seeds
-> For each seed: create ClusterProvider
-> List clusters on each seed
-> Combine and return to client
\```

## Projects

**Definition**: Logical namespace for resources owned by users/teams.

**Hierarchy**:
\```
Kubermatic Installation
└── Project (team/org)
    ├── Cluster A
    ├── Cluster B
    └── Resources (users, SSH keys, etc.)
\```

## User Context

Throughout the request, user information is maintained in context:

\```go
type UserInfo struct {
    Email         string         // User identifier
    Name          string
    Groups        []string       // OIDC groups
    IsAdmin       bool
    AdminTools    bool
}
\```

Used by middleware to:
- Enforce RBAC via impersonation clients
- Track resource ownership
- Log audit information

## Privileged Operations

Some operations bypass user RBAC (admin-only):
- Creating/deleting projects
- Modifying KubermaticConfiguration
- Accessing all users' SSH keys

These use "privileged" providers that don't impersonate the user.

## Configuration and Flags

Important command-line flags:

\```
-address                           Listen address (default: :8080)
-ca-bundle                         CA certificate bundle path (required)
-oidc-url                          OIDC provider URL
-oidc-authenticator-client-id      Client ID for user auth
-oidc-issuer-client-id             Client ID for issuer role (EE)
-oidc-issuer-client-secret         Issuer client secret (EE)
-oidc-issuer-redirect-uri          Callback URL (EE)
-service-account-signing-key       JWT signing key
-feature-gates                     Feature gate configuration
-kubermatic-configuration-file     Config file (development only)
-namespace                         Kubermatic namespace
\```
```

- [ ] **Step 2: Commit**

```bash
git add modules/api/agent_docs/domain-concepts.md
git commit -m "docs(api): extract domain concepts reference to agent_docs"
```

---

### Task 5: Create `agent_docs/import-aliases.md`

**Files:**
- Create: `modules/api/agent_docs/import-aliases.md`

- [ ] **Step 1: Create the import aliases reference file**

Extract lines 538-575 from current CLAUDE.md:

```markdown
# Required Import Aliases

This codebase enforces strict import aliasing via golangci-lint. Always use these aliases.

## KKP API Packages

\```go
import (
    apiv1 "k8c.io/kubermatic/sdk/v2/api/v1"
    apiv2 "k8c.io/kubermatic/sdk/v2/api/v2"
    appskubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/apps.kubermatic/v1"
    kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
    utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
    authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
)
\```

## Kubernetes Packages

\```go
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
\```

## Other Packages

\```go
import (
    clusterv1alpha1 "k8c.io/machine-controller/sdk/apis/cluster/v1alpha1"
    semverlib "github.com/Masterminds/semver/v3"
)
\```

**Note**: The linter enforces these aliases and will fail if you use different ones or import without aliases where required.
```

- [ ] **Step 2: Commit**

```bash
git add modules/api/agent_docs/import-aliases.md
git commit -m "docs(api): extract import aliases reference to agent_docs"
```

---

## Chunk 2: Rewrite CLAUDE.md as Concise Index

### Task 6: Rewrite `modules/api/CLAUDE.md` (~180 lines)

**Files:**
- Modify: `modules/api/CLAUDE.md` (full rewrite)

- [ ] **Step 1: Replace CLAUDE.md with concise index version**

The new file keeps all commands, project structure, how-to guides, and key files — but replaces detailed sections with brief summaries and `@` import references.

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Kubermatic Dashboard API - Architecture Guide

REST API server (Go) serving as the backend for the KKP Dashboard. Manages clusters, projects, users, seeds, and other resources.

**Type**: HTTP REST API Server (Go) | **Port**: 8080 | **Framework**: Gorilla Mux + Go-Kit
**Auth**: OIDC + Service Account JWT | **Storage**: Kubernetes API (controller-runtime client)

## Common Development Commands

### Building
\```bash
make build                    # Build for Enterprise Edition (default)
make build KUBERMATIC_EDITION=ce  # Build for Community Edition
make kubermatic-api           # Build specific command
make clean                    # Clean build artifacts
\```

### Testing
\```bash
make api-test                 # Run API tests
make build-tests              # Compile all packages without running tests
go test -v ./pkg/handler/v1/cluster/...  # Test specific package
go test -v ./pkg/handler/v1/project -run TestCreateProject  # Single test
go test -tags "ee" -v ./pkg/handler/...  # Test with EE features
go test -tags "ce" -v ./pkg/handler/...  # Test with CE features
\```

### Code Quality
\```bash
make lint                     # Run golangci-lint
make fmt                      # Format code
make vet                      # Run go vet
make verify-imports           # Verify imports order
make verify                   # Run all verification checks
\```

### Code Generation
\```bash
make update-codegen           # Update generated code (deepcopy, clientsets, swagger)
\```

### Dependency Management
\```bash
make verify-go                # Verify go.mod and go.sum
make check-dependencies       # Check dependencies are tidy
make update-kkp               # Update to latest KKP version
\```

## Project Structure

\```
.
├── cmd/kubermatic-api/          # Main entry point
├── pkg/
│   ├── api/                      # API models (v1, v2 schemas)
│   ├── handler/                  # HTTP request handlers & routing
│   ├── provider/                 # Business logic & data access layer
│   ├── ee/                       # Enterprise Edition specific code
│   ├── kubernetes/               # Kubernetes API interactions
│   ├── watcher/                  # Informer-based watchers
│   ├── serviceaccount/           # Service account token management
│   ├── validation/               # Input validation
│   ├── resources/                # Resource definitions
│   └── test/                     # Test utilities
└── hack/                         # Build & development scripts
\```

## Main Entry Point

**File**: `cmd/kubermatic-api/main.go`

Startup: Parse flags -> Setup logging -> Register K8s schemes -> Create controller manager -> Create providers (`createInitProviders()`) -> Create auth clients (`createAuthClients()`) -> Register HTTP routes (`createAPIHandler()`) -> Start server.

## Core Architecture

Five key patterns govern the codebase. Brief summaries below; full details with code examples in the reference doc.

- **Handler Pattern**: Go-Kit endpoints — Request -> Middleware -> Handler -> Provider -> Response
- **Provider Pattern**: Interfaces abstracting business logic (e.g., `ClusterProvider`, `ProjectProvider`), implemented as K8s client wrappers in `pkg/provider/kubernetes/`
- **Middleware Pattern**: Token verification, RBAC, context injection (`pkg/handler/middleware/`)
- **Authentication**: Dual-mode — OIDC for UI users, JWT for service accounts
- **Impersonation**: RBAC enforced by creating K8s clients that impersonate the requesting user

- Architecture patterns reference: @agent_docs/architecture-patterns.md

## API Versions

- **V1** (`/api/v1/*`): Legacy API in `pkg/handler/v1/` — projects, clusters, nodes, SSH keys
- **V2** (`/api/v2/*`): Current API in `pkg/handler/v2/` — 42+ resources with consistent CRUD patterns

- API routing reference: @agent_docs/api-routing.md

## CE/EE Edition Handling

Uses Go build tags (`//go:build ee` / `//go:build !ee`). CE stubs EE-only providers to `nil` via wrapper functions in `cmd/kubermatic-api/wrappers_ce.go` / `wrappers_ee.go`. EE packages live in `pkg/ee/`.

- Edition handling reference: @agent_docs/edition-handling.md

## Key Concepts

- **Seeds**: K8s clusters hosting user clusters; discovered via `SeedsGetter`, accessed through seed-scoped provider getters
- **Projects**: Logical namespace for resources (clusters, SSH keys, members)
- **UserContext**: `UserInfo` struct (Email, Groups, IsAdmin) carried through request context
- **Privileged Providers**: Bypass RBAC for admin-only operations

- Domain concepts reference: @agent_docs/domain-concepts.md

## Key Technologies

Gorilla Mux (routing), Go-Kit (endpoints), Controller-Runtime (K8s client/cache), Prometheus (metrics), Zap (logging), go-oidc (OIDC auth), JWT (service accounts)

## Common Patterns

### Adding a New Endpoint
1. Create handler in `pkg/handler/v2/resource/`
2. Define Request/Response types in `pkg/api/v2/`
3. Add route in `routing.go` or `v2.go`
4. Use appropriate middleware for auth/RBAC

### Adding a New Provider
1. Define interface in `pkg/provider/types.go`
2. Implement in `pkg/provider/kubernetes/`
3. Instantiate in `createInitProviders()` in `main.go`
4. Inject into routing parameters

### Adding EE-Only Feature
1. Create handler wrapper in `pkg/handler/v2/resource/wrappers_ee.go`
2. Create CE stub in `pkg/handler/v2/resource/wrappers_ce.go`
3. Feature gates: `options.featureGates.Enabled(features.FeatureName)`

## Key Files

| File | Purpose |
|------|---------|
| `cmd/kubermatic-api/main.go` | Server startup, provider initialization |
| `pkg/handler/routing.go` | Route registration, middleware setup |
| `pkg/handler/handler.go` | Error handling, JSON encoding |
| `pkg/provider/types.go` | Provider interfaces and function types |
| `pkg/handler/middleware/middleware.go` | Authentication and RBAC |
| `cmd/kubermatic-api/wrappers_*.go` | CE/EE feature branching |

## Import Aliases

Strict import aliasing enforced by golangci-lint. Key aliases: `kubermaticv1`, `apiv1`/`apiv2`, `corev1`, `metav1`, `ctrlruntimeclient`. See full reference for complete list.

- Import aliases reference: @agent_docs/import-aliases.md

## Metrics

Prometheus metrics on internal address (default: `127.0.0.1:8085/metrics`). HTTP request metrics: method, path, status code, duration.

## Development Tips

1. Most configuration is via CLI flags or kubeconfig
2. Use `-kubermatic-configuration-file` for local development
3. Logging is structured (zap) — grep with field names like `"error"` or `"seed"`
4. Provider calls respect context deadlines — use context with timeout
5. Always check privileged vs user-scoped operations
6. Always use correct import aliases (linter enforced)
7. Follow existing v1/v2 handler patterns when adding new endpoints
8. Test both CE and EE builds when changes affect edition-specific code
```

- [ ] **Step 2: Verify line count is under 200**

```bash
wc -l modules/api/CLAUDE.md
```

Expected: ~175-185 lines

- [ ] **Step 3: Commit**

```bash
git add modules/api/CLAUDE.md
git commit -m "docs(api): restructure CLAUDE.md with progressive disclosure via @agent_docs imports"
```

---

## Chunk 3: Verification

### Task 7: Verify `@` imports resolve correctly

- [ ] **Step 1: Check all referenced agent_docs files exist**

```bash
ls -la modules/api/agent_docs/
```

Expected: 5 files — `architecture-patterns.md`, `api-routing.md`, `edition-handling.md`, `domain-concepts.md`, `import-aliases.md`

- [ ] **Step 2: Verify no content was lost**

Compare section coverage:
- Architecture patterns (5 patterns) -> `agent_docs/architecture-patterns.md`
- V1/V2 routing -> `agent_docs/api-routing.md`
- CE/EE handling -> `agent_docs/edition-handling.md`
- Seeds, Projects, UserContext, Config flags -> `agent_docs/domain-concepts.md`
- Import aliases -> `agent_docs/import-aliases.md`
- Commands, structure, how-to, key files, tips -> kept in CLAUDE.md

- [ ] **Step 3: Final commit (if any fixes needed)**

```bash
git add modules/api/
git commit -m "docs(api): finalize progressive disclosure restructure"
```
