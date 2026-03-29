# KKP Dashboard — Go REST API

REST API server (Go) serving as the backend for the KKP Dashboard. Manages clusters, projects, users, seeds, and other resources.

**Type**: HTTP REST API Server (Go) | **Port**: 8080 | **Framework**: Gorilla Mux + Go-Kit
**Auth**: OIDC + Service Account JWT | **Storage**: Kubernetes API (controller-runtime client)

## Build Commands

```bash
make build                          # Build binary (EE default)
make build KUBERMATIC_EDITION=ce    # Build CE edition
make kubermatic-api                 # Build API binary only
make api-test                       # Run API tests
make update-codegen                 # Regenerate code (deepcopy, swagger, API client)
make update-kkp                     # Update KKP/SDK dependencies
```

## Testing

```bash
go test -v ./pkg/handler/v2/cluster/...          # Test specific package
go test -v ./pkg/handler/v1/project -run TestName # Single test
go test -tags "ee" -v ./pkg/handler/...           # EE tests
go test -tags "ce" -v ./pkg/handler/...           # CE tests
```

Handler tests use mock providers from `pkg/test/`.

## Key Directories

- `cmd/kubermatic-api/` — Entry point, server startup, CE/EE wrapper functions
- `pkg/handler/` — HTTP handlers, routing, middleware (v1 legacy, v2 current)
- `pkg/handler/v2/` — Current API endpoint handlers
- `pkg/provider/` — Business logic interfaces (ProjectProvider, ClusterProvider, etc.)
- `pkg/provider/kubernetes/` — Provider implementations using Kubernetes API
- `pkg/api/v1/`, `pkg/api/v2/` — Request/response models
- `pkg/ee/` — Enterprise Edition features (backups, quotas, groups, kyverno, metering)
- `pkg/handler/auth/` — Authentication middleware
- `pkg/validation/` — Input validation
- `pkg/test/` — Test utilities and mock providers

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

Architecture patterns reference: @agent_docs/architecture-patterns.md

## API Versions

- **V1** (`/api/v1/*`): Legacy API in `pkg/handler/v1/` — projects, clusters, nodes, SSH keys
- **V2** (`/api/v2/*`): Current API in `pkg/handler/v2/` — 42+ resources with consistent CRUD patterns

API routing reference: @agent_docs/api-routing.md

## CE/EE Build Tags

**CRITICAL**: EE-only code must be in `pkg/ee/` with `//go:build ee` tag. CE stubs must be in `cmd/kubermatic-api/wrappers_ce.go` returning `nil`. This ensures clean separation and prevents accidental imports.

Edition handling reference: @agent_docs/edition-handling.md

## Key Concepts

- **Seeds**: K8s clusters hosting user clusters; discovered via `SeedsGetter`, accessed through seed-scoped provider getters
- **Projects**: Logical namespace for resources (clusters, SSH keys, members)
- **UserContext**: `UserInfo` struct (Email, Groups, IsAdmin) carried through request context
- **Privileged Providers**: Bypass RBAC for admin-only operations

Domain concepts reference: @agent_docs/domain-concepts.md

## Key Technologies

Gorilla Mux (routing), Go-Kit (endpoints), Controller-Runtime (K8s client/cache), Prometheus (metrics), Zap (logging), go-oidc (OIDC auth), JWT (service accounts)

## Common Workflows

Step-by-step guides for adding new endpoints, providers, and EE-only features.

Development workflows reference: @agent_docs/development-workflows.md

## Key Files

Critical files for understanding the codebase entry points and wiring. See the architecture patterns reference for the full table.

Architecture patterns reference: @agent_docs/architecture-patterns.md

## Import Aliases

Strict import aliasing enforced by golangci-lint. Key aliases: `kubermaticv1`, `apiv1`/`apiv2`, `corev1`, `metav1`, `ctrlruntimeclient`. See full reference for complete list.

Import aliases reference: @agent_docs/import-aliases.md

## Metrics

Prometheus metrics on internal address (default: `127.0.0.1:8085/metrics`). HTTP request metrics: method, path, status code, duration.

## Development Tips

Practical guidance for local dev, logging, provider usage, and edition-specific testing.

Development tips reference: @agent_docs/development-tips.md
