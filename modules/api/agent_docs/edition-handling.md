# Enterprise Edition (EE) vs Community Edition (CE)

Detailed reference for the CE/EE edition handling in the API module.

## Build Tag System

```go
//go:build ee    // Included in EE builds only (KUBERMATIC_EDITION=ee)
//go:build !ee   // Included in CE builds only
```

## Makefile Build

```makefile
KUBERMATIC_EDITION ?= ee
go build -tags "$(KUBERMATIC_EDITION)" -o $@ ./cmd/$*
```

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
```
ee/
├── clusterbackup/              # Backup/restore operations
├── resource-quota/             # Quota enforcement
├── group-project-binding/      # Group-based access control
├── kyverno/                    # Policy management
├── metering/                   # Usage tracking
└── provider/                   # EE-specific providers
```

## Implementation Pattern

Wrapper functions in `main.go` are overridden per edition:

```go
// CE version (wrappers_ce.go)
func resourceQuotaProviderFactory(...) provider.ResourceQuotaProvider {
    return nil  // Not available
}

// EE version (wrappers_ee.go)
func resourceQuotaProviderFactory(...) provider.ResourceQuotaProvider {
    return eeapi.ResourceQuotaProviderFactory(...)  // Full implementation
}
```
