# Development Workflows

Step-by-step guides for common development tasks in the KKP Dashboard API.

## Adding a New Endpoint

1. Create handler in `pkg/handler/v2/<resource>/`
2. Define request/response types in `pkg/api/v2/`
3. Register route in `pkg/handler/routing.go`
4. Use middleware for auth/RBAC

## Adding a New Provider

1. Define interface in `pkg/provider/types.go`
2. Implement in `pkg/provider/kubernetes/`
3. Instantiate in `createInitProviders()` in `main.go`
4. Inject into routing parameters

## Adding EE-Only Feature

1. Create EE handler wrapper in `wrappers_ee.go`
2. Create CE stub in `wrappers_ce.go` (return `nil`)
3. Implement in `pkg/ee/`
4. Use feature gates if needed: `options.featureGates.Enabled(features.FeatureName)`
