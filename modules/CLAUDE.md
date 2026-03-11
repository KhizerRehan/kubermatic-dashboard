# KKP Dashboard - Application Modules

Main application code for the Kubermatic Kubernetes Platform Dashboard. Contains two independent sub-modules that can be built and deployed separately.

## Structure

```
modules/
├── api/    # Go REST API backend
└── web/    # Angular frontend SPA
```

---

## modules/api - Go Backend

### Overview
REST API server providing endpoints for dashboard functionality. Middleware between the Angular UI and Kubernetes clusters.

### Entry Point
`cmd/kubermatic-api/main.go`

### Tech Stack
- Go 1.25.7
- gorilla/mux (HTTP router)
- Swagger/OpenAPI 2.0
- Multi-cloud SDKs (AWS, Azure, GCP, DigitalOcean, Alibaba, Nutanix)
- OIDC authentication (go-oidc)
- WebSocket support

### Key Directories
- `pkg/handler/v1/`, `pkg/handler/v2/` - API route handlers (v2 is current)
- `pkg/handler/websocket/` - WebSocket handlers (logs, terminal, events)
- `pkg/provider/` - Cloud provider integrations
- `pkg/api/` - API models and definitions
- `pkg/ee/` - Enterprise Edition features
- Route definitions: `pkg/handler/routes_v1.go`, `routes_v2.go`, `routes_v1_admin.go`

### Commands
```bash
make build              # Compile Go binary
make lint               # Run golangci-lint
make api-test           # Run API tests
make fmt                # Format code
make vet                # Vet code
make check-dependencies # Tidy and verify go.mod
make update-kkp         # Update KKP/SDK dependencies
```

---

## modules/web - Angular Frontend

### Overview
Angular-based SPA providing the user interface. Supports CE and EE editions via separate TypeScript configs.

### Entry Point
`src/main.ts`

### Tech Stack
- Angular 20.x, TypeScript 5.9.3
- Angular Material + CDK (UI components)
- RxJS 7.8.2 (reactive programming)
- ngx-charts (charting), xterm (terminal), monaco-editor (code editor)
- Jest 29.7.0 (unit tests), Cypress 14.3.3 (E2E tests)
- ESLint + GTS, StyleLint, Prettier (code quality)

### Key Directories
- `src/app/core/services/` - API client services (53+ files)
- `src/app/core/interceptors/` - HTTP interceptors (auth, error, loader)
- `src/app/shared/components/` - Reusable UI components (56+)
- `src/app/shared/entity/` - Entity type definitions
- `src/app/shared/constants/` - App-wide constants
- `src/app/cluster/` - Cluster management feature
- `src/app/project/` - Project management
- `src/app/wizard/` - Cluster creation wizards
- `src/app/node-data/` - Node/machine deployment config
- `src/app/backup/` - Cluster backup feature
- `cypress/` - E2E test suite

### Commands
```bash
# Development
npm start               # Dev server at localhost:8000
npm start:local         # Dev with local proxy

# Testing
npm test                # Jest unit tests (watch)
npm run test:ci         # CI unit tests with coverage
npm run e2e             # Cypress E2E tests
npm run e2e:mock        # E2E with mocked API

# Build
npm run build           # Production build
npm run build:themes    # Extract theme bundles

# Code Quality
npm run check           # All checks (TS, SCSS, licenses)
npm run check:ts        # TypeScript linting (gts)
npm run check:scss      # SCSS validation
npm run fix             # Auto-fix all issues
```

### Architecture Patterns
- Feature-based module organization
- Core services with cached RxJS observables (no Redux)
- HTTP interceptors for auth token injection and error handling
- Route guards for authentication/authorization
- Dynamic theme switching (light/dark/custom via SCSS)
- CE/EE editions via `tsconfig.ce.json` / `tsconfig.ee.json`
- Path aliases: `@app`, `@core`, `@shared`, `@assets`, `@environments`, `@test`

### Edition Builds
- CE: `default-ce`, `production-ce`, `e2e-ce`
- EE: `default-ee`, `production-ee`, `e2e-ee` (default)
