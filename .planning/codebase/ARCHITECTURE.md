# Architecture

**Analysis Date:** 2026-04-09

## Pattern Overview

**Overall:** Layered Angular SPA with feature modules and shared services

**Key Characteristics:**
- Angular 20.x with standalone false (traditional NgModule pattern)
- Lazy-loaded feature modules (Project, Cluster, Wizard, Settings, etc.)
- Singleton services in CoreModule for state and API communication
- Shared component library with Material Design UI
- Dynamic CE/EE module loading via build-time fileReplacements
- RxJS-driven reactive data flow with Observables

## Layers

**Presentation (Components):**
- Purpose: Angular components render UI, bind data from services via async pipe, emit user actions
- Location: `src/app/shared/components/`, `src/app/cluster/`, `src/app/project/`, feature module components
- Contains: Component classes with @Input/@Output, templates (.html), styles (.scss)
- Depends on: SharedModule (Material, common directives/pipes), CoreModule services (via DI)
- Used by: Routing module lazy-loads feature modules containing presentation components

**Shared Component Library:**
- Purpose: Reusable UI components with `km-` prefix (Material-based)
- Location: `src/app/shared/components/`
- Contains: 56 components like km-button, km-chip, km-dialog, km-table, km-tabs, km-expansion-panel
- Depends on: Angular Material, @angular/cdk, shared pipes/directives, validation utilities
- Used by: All feature modules and pages

**Core (Services & Interceptors):**
- Purpose: Singleton services for state management, HTTP communication, guards, and global services
- Location: `src/app/core/services/`, `src/app/core/interceptors/`, `src/app/core/components/` (core UI like navigation, sidenav)
- Contains: API client services (ClusterService, ProjectService, etc.), auth/RBAC guards, HTTP interceptors, theme/settings services
- Depends on: HttpClient, Router, RxJS Observables, local storage (ngx-cookie-service)
- Used by: AppModule (global providers), all feature modules via dependency injection

**Feature Modules (with own routing and services):**
- Purpose: Encapsulated domain logic per feature (Project, Cluster, Wizard, Settings, Backup, etc.)
- Location: `src/app/project/`, `src/app/cluster/`, `src/app/wizard/`, `src/app/settings/`, `src/app/backup/`
- Contains: Feature routing, components, local services (if any), nested child routes
- Depends on: SharedModule, CoreModule, Angular Material, RxJS
- Used by: AppRoutingModule lazy-loads via `loadChildren`

**Dynamic Modules (CE/EE swapping):**
- Purpose: Enterprise vs Community edition features loaded conditionally at build time
- Location: `src/app/dynamic/enterprise/`, `src/app/dynamic/community/`, module-registry files
- Contains: EE-only modules (Theming, Metering, Quotas, Group, ClusterBackups, KyvernoPolicies, AllowedRegistries) with CE stubs
- Depends on: DynamicModule namespace from module-registry.ts or module-registry.ce.ts
- Used by: AppRoutingModule, feature module routing (e.g., Project routing loads `DynamicModule.Quotas`)

## Data Flow

**HTTP Request/Response Cycle:**

1. **Component action** - User clicks button, form submitted
2. **Service call** - Component calls service method (e.g., `clusterService.create(cluster)`)
3. **HTTP request** - Service builds request, calls `http.post(endpoint)` or similar
4. **Interceptors** - Stack of interceptors run in order:
   - `ErrorNotificationsInterceptor` - Catches errors, dispatches notifications
   - `CheckTokenInterceptor` - Validates token expiration, refreshes if needed
   - `LoaderInterceptor` - Shows/hides global loader spinner
   - `AuthInterceptor` - Appends Bearer token to Authorization header for requests to `restRoot`
5. **HTTP response** - Server responds
6. **Observable chain** - Service applies RxJS operators (map, tap, catchError, etc.), returns Observable
7. **Component subscribes** - Component uses async pipe in template: `{{ observable$ | async }}` or subscribes in component
8. **View update** - Angular change detection marks component dirty, re-renders

**State Management:**
- Stateless services with streaming data via Observables
- Component local state: `@Input/@Output`, local variables, `OnPush` change detection
- Global singleton services hold application state (current user, project, datacenter, settings)
- RxJS `Subject` used for event streams (e.g., `_unsubscribe` Subject for lifecycle)
- No NgRx or centralized store; services are the source of truth

## Key Abstractions

**API Client Services:**
- Purpose: Encapsulate HTTP calls to Go API backend (`environment.restRoot`)
- Examples: `src/app/core/services/cluster.ts`, `src/app/core/services/project.ts`, `src/app/core/services/machine-deployment.ts`
- Pattern: Service class with methods returning `Observable<T>`. Methods use `http.get/post/put/delete` with environment.restRoot base URL.

**Auth & RBAC:**
- Purpose: Protect routes, verify tokens, inject current user context
- Examples: `src/app/core/services/auth/` (Auth service, guards), `src/app/core/services/rbac.ts`
- Pattern: AuthGuard/AdminGuard on routes, Auth service stores/validates Bearer token, RBAC service checks user permissions

**Dialog/Modal Components:**
- Purpose: Reusable confirmation, form dialogs with parent component communication
- Examples: `src/app/shared/components/confirmation-dialog/`, `src/app/shared/components/add-project-dialog/`
- Pattern: MatDialog.open(ComponentClass, {data: {...}}), component receives data in constructor via MAT_DIALOG_DATA

**Providers (Infrastructure):**
- Purpose: Wrap cloud provider credentials, validate provider-specific settings
- Location: `src/app/core/services/provider/` (AWS, Azure, GCP, Hetzner, DigitalOcean, vSphere, etc.)
- Pattern: Provider service per cloud type, manages provider presets, validates sizing/machine types

## Entry Points

**Bootstrap:**
- Location: `src/main.ts`
- Triggers: Browser loads index.html, Angular platform boots AppModule
- Responsibilities: Enable prod mode if environment.production, bootstrap AppModule via platformBrowserDynamic()

**App Module:**
- Location: `src/app/module.ts`
- Triggers: main.ts calls bootstrapModule(AppModule)
- Responsibilities: Import CoreModule, SharedModule, declare root components (KubermaticComponent, DashboardComponent), set up global providers (APP_INITIALIZER, Material defaults, CookieService)

**App Component (Root):**
- Location: `src/app/component.ts` (selector: `km-root`)
- Triggers: AppModule bootstrap
- Responsibilities: Render page shell (sidenav, navigation, footer), manage layout state for menu visibility, inject settings/version from AppConfigService, subscribe to router events to control menu display

**Dashboard Component:**
- Location: `src/app/dashboard/component.ts`
- Triggers: AppRoutingModule root path
- Responsibilities: Parent container for feature views, renders `<router-outlet>` for lazy-loaded child routes (projects, clusters, settings, etc.)

**App Routing Module:**
- Location: `src/app/routing.ts`
- Triggers: AppModule import
- Responsibilities: Define root routes, lazy-load feature modules, custom SelectedPreloadingStrategy for selective bundle preloading, guard routes with AuthGuard/AdminGuard

**App Initializer:**
- Location: `src/app/module.ts`, appInitializerFn
- Triggers: APP_INITIALIZER provider at app startup
- Responsibilities: Load app config (restRoot, branding, feature gates), user groups, git version before any route renders

## Error Handling

**Strategy:** Centralized error interception with user-facing notifications

**Patterns:**
- `ErrorNotificationsInterceptor` - Catches HTTP errors, extracts error message, dispatches to NotificationService
- Component-level try/catch for sync errors (form validation)
- Service methods use `catchError` RxJS operator to transform errors into Observables with fallback/error state
- User sees snackbar notification or dialog confirmation for errors
- No global error boundary; errors logged to console and sent to Google Analytics (if enabled)

## Cross-Cutting Concerns

**Logging:** 
- No centralized logging service; components/services log to console via `console.log()`
- Google Analytics integration via `GoogleAnalyticsService` (tracks page views, user actions)

**Validation:**
- Form validation: Reactive Forms (FormControl/FormGroup) with custom Validators in `src/app/shared/validators/`
- API input validation happens on backend; frontend validates UI constraints
- Entity models in `src/app/shared/entity/` define types; no class-based validation

**Authentication:**
- Bearer token stored in Auth service (obtained from OIDC provider or generated by backend for service accounts)
- AuthGuard checks token validity, redirects to login if missing
- AuthInterceptor appends token to all requests to restRoot
- Token refresh handled by CheckTokenInterceptor when expired

---

*Architecture analysis: 2026-04-09*
