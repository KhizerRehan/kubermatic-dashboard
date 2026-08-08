# External Integrations — Angular Frontend

**Analysis Date:** 2026-04-09

## APIs & External Services

**KKP Go API (Primary Backend):**
- REST API endpoints at `/api/v1/` and `/api/v2/`
- Base paths configured in environment files
- Proxy routes:
  - Dev: `https://dev.kubermatic.io/api/**` (via `proxy.conf.cjs`)
  - Local: `http://127.0.0.1:8080/api/**` (via `proxy-local.conf.cjs`)
- HTTP Client: Angular's `HttpClient` (`@angular/common/http`)
- Service layer: `src/app/core/services/` with typed endpoints

**API Service Examples:**
- `ClusterService` (`src/app/core/services/cluster.ts`) - Cluster CRUD and management
- `ProjectService` - Project management
- `MachineDeploymentService` - Machine deployment configuration
- `AddonService` - Cluster add-ons
- `UserService` - User management
- `ClusterBackupService` - Cluster backups
- Provider services: `AWSService`, `GCPService`, `AzureService`, etc. (in `src/app/core/services/provider/`)

**API Response Models:**
- Request/response DTOs defined in `src/app/shared/entity/`
- Typed with TypeScript interfaces

## WebSocket Connections

**Terminal & Real-time Updates:**
- WebSocket Root: `ws://host/api/v1/ws` (from environment config)
- Configured via `environment.wsRoot` in environment files
- Service: `WebTerminalSocketService` (`src/app/core/services/websocket.ts`)
- Uses RxJS WebSocket subject for bidirectional communication
- Path-based routing: Connect to `/api/v1/ws/{path}`

**Message Format:**
- Terminal frames via `ITerminalFrame` interface
- RxJS operators: `switchAll()`, `catchError()` for stream management

**Fallback:**
- `avoidWebsockets` environment flag allows disabling WebSocket (falls back to polling)

## Authentication & Identity

**OIDC Provider:**
- Dex-based OIDC (via environment config)
- Dev: `https://dev.kubermatic.io/dex/auth`
- Production: Derived from `window.location.host + /dex/auth`
- Client ID: `kubermatic`
- Response type: `id_token`
- Scopes: `openid email profile groups` (customizable via config)
- Nonce validation for security

**Implementation:**
- Auth service: `src/app/core/services/auth/service.ts`
- Auth guard: `src/app/core/services/auth/guard.ts`
- Token extraction from URL fragment post-login redirect
- JWT token decoding and validation
- Cookie storage of bearer token (via `ngx-cookie-service`)

**Token Management:**
- Bearer token in Authorization header
- Token validation: `TokenService` (`src/app/core/services/token.ts`)
- Cookie names configurable via `COOKIE` config in `src/app/config.ts`

**HTTP Interceptors:**
- `AuthInterceptor` - Attaches bearer token to requests
- `CheckTokenInterceptor` - Validates token expiration
- `ErrorNotificationsInterceptor` - Handles API errors
- `LoaderInterceptor` - Global loading indicator
- Location: `src/app/core/interceptors/`

## Data Storage

**Remote Storage (API-managed):**
- All persistent data via KKP Go API
- Clusters, projects, machine deployments, SSH keys, backups
- Configuration stored on API server

**Browser Storage:**
- **Cookies:** Token, nonce, auto-redirect flag (via `ngx-cookie-service`)
  - Max size enforced: 4000 bytes per cookie
  - Config in `src/app/config.ts`
- **localStorage:** Not explicitly used for API data (relies on cookies/API)
- **sessionStorage:** Not used

**Cloud File Storage (Enterprise Feature):**
- AWS S3 bucket integration for cluster backups (EE only)
- Location: `src/app/dynamic/enterprise/cluster-backups/`
- SDK: `@aws-sdk/client-s3` (v3.808.0)
- Operations: Upload/import backups via multipart upload
- Credentials: Provided by backend (backend manages AWS auth)
- Max file size: 1TB per upload
- Multipart chunk size: 100MB

## Caching

**Strategy:** Not explicitly implemented. Reliance on:
- RxJS `shareReplay()` operator for HTTP request memoization in services
- Angular's HTTP cache headers (if server provides them)
- Example in `ClusterService`: Multiple subscribers share single HTTP request via `Map<string, Observable<T>>`

## Monitoring & Observability

**Error Tracking:** Not detected. Errors handled via:
- Error notifications service (in-app toast notifications)
- HTTP error interceptor logs to console
- No remote error tracking (Sentry, LogRocket, etc.)

**Logs:** Console logging only. No centralized logging service detected.

**Google Analytics (Optional):**
- `GoogleAnalyticsService` (`src/app/google-analytics.service`)
- Conditional integration if enabled via configuration
- Tracks page views and user interactions

## External APIs Called from Frontend

**No direct external API calls detected** except:

1. **Configuration Loading:**
   - `GET /config/config.json` - Dynamic app configuration
   - `GET /config/userGroupConfig.json` - User group mappings
   - `GET /config/version.json` - Git version info

2. **S3 (Enterprise Backups):**
   - Direct S3 API calls for upload/download
   - Credentials provided by backend
   - Bucket name from configuration

3. **Country/Flag Data:**
   - `flag-icons` package (bundled, no external calls)
   - `country-code-lookup` package (bundled, no external calls)

## CI/CD & Deployment

**Hosting:** Served as static SPA
- Build output: `dist/` directory
- Can be hosted on any static file server (nginx, Apache, S3, CDN)
- Routing: All paths should fallback to `index.html` for SPA routing

**Build Artifacts:**
- Main bundle + lazy-loaded chunks
- Separate theme bundles: `light.js`, `dark.js`, `custom.js`
- Monaco editor assets in `/assets/monaco/`

**E2E Testing Environment:**
- Mock API server: `json-server` on port 8080
- Fixtures in `cypress/fixtures/db.json`
- Route definitions in `cypress/fixtures/routes.json`
- Command: `npm run e2e:mock` or `npm run e2e:local`

## Environment Configuration

**Runtime Configuration Files:**
- Located in `src/assets/config/` at build output
- Loaded on startup by `AppConfigService`

**config.json Structure:**
```typescript
interface Config {
  oidc_provider_url?: string;     // OIDC endpoint override
  oidc_connector_id?: string;     // Dex connector
  oidc_provider_scope?: string;   // OIDC scopes
  oidc_provider_client_id?: string; // OIDC client ID
  branding?: BrandingConfig;      // Theme/logo configuration
  [key: string]: any;             // Other config options
}
```

**Environment Variables:**
- `KUBERMATIC_EDITION` - Build edition (ee/ce)
- `KUBERMATIC_HOST` - Dev server hostname (default: localhost)
- `CYPRESS_MOCKS` - Enable E2E mocks (true/false)

**Environment Configurations (TypeScript):**
- `src/environments/environment.ts` - Development
- `src/environments/environment.prod.ts` - Production
- `src/environments/environment.e2e.ts` - E2E tests
- `src/environments/environment.e2e.local.ts` - E2E local API
- `src/environments/environment.e2e.mock.ts` - E2E mock API

**Key Environment Settings:**
- `restRoot` - REST API v1 base path (`/api/v1`)
- `newRestRoot` - REST API v2 base path (`/api/v2`)
- `wsRoot` - WebSocket root URL
- `oidcProviderUrl` - OIDC provider endpoint
- `avoidWebsockets` - Disable WebSocket (use polling instead)
- `configUrl` - Location of dynamic config.json
- `refreshTimeBase` - Base refresh interval in ms (default: 1000)
- `animations` - Enable/disable Angular animations

## Webhooks & Callbacks

**Incoming:** None

**Outgoing:**
- OIDC redirect after authentication: User redirected to `/projects` after token received from OIDC provider

## Third-Party Libraries with Remote Endpoints

**None explicitly configured.** All remote calls go through the KKP API proxy.

## Integration Patterns

**HTTP Service Pattern:**
- Services use `HttpClient` to make requests
- Environment-based URL construction (`environment.restRoot`, `environment.newRestRoot`)
- TypeScript interfaces for request/response typing
- RxJS operators for request management (retry, cache, etc.)
- Base URLs and headers controlled via app configuration

**WebSocket Pattern:**
- RxJS `webSocket()` for connection management
- `WebSocketSubject` for bidirectional streaming
- Automatic reconnection via error handling
- Message subjects for upstream and downstream flows

**Error Handling:**
- HTTP errors caught by `ErrorNotificationsInterceptor`
- User-facing notifications via `NotificationService`
- Console error logging
- Graceful degradation (e.g., WebSocket fallback to polling)

**Data Binding:**
- Components subscribe to service observables
- RxJS operators: `map()`, `switchMap()`, `shareReplay()`, `tap()`
- Unsubscribe via `takeUntil()` pattern with Subject

---

*Integration audit: 2026-04-09*
