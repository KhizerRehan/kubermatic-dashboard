# Codebase Structure

**Analysis Date:** 2026-04-09

## Directory Layout

```
modules/web/
├── src/
│   ├── main.ts                          # Bootstrap entry point
│   ├── polyfills.ts                     # Browser polyfills
│   ├── index.html                       # HTML shell
│   ├── app/
│   │   ├── module.ts                    # AppModule (root)
│   │   ├── component.ts                 # KubermaticComponent (km-root selector, page shell)
│   │   ├── routing.ts                   # AppRoutingModule (root routes, lazy loading)
│   │   ├── dashboard/
│   │   │   ├── component.ts             # DashboardComponent (router-outlet for features)
│   │   │   └── module.ts
│   │   ├── core/
│   │   │   ├── module.ts                # CoreModule (singletons: services, guards, interceptors)
│   │   │   ├── services/                # Singleton services (50+ files)
│   │   │   │   ├── cluster.ts
│   │   │   │   ├── project.ts
│   │   │   │   ├── datacenter.ts
│   │   │   │   ├── auth/                # Auth service, guards
│   │   │   │   ├── provider/            # Cloud provider services (AWS, Azure, GCP, etc.)
│   │   │   │   └── ...
│   │   │   ├── interceptors/            # HTTP interceptors
│   │   │   │   ├── auth.ts              # Append Bearer token
│   │   │   │   ├── check-token.ts       # Validate/refresh token
│   │   │   │   ├── error-notifications.ts  # Show error snackbars
│   │   │   │   └── loader.ts            # Show/hide global spinner
│   │   │   └── components/              # Core UI shells (nav, sidenav, footer)
│   │   │       ├── navigation/
│   │   │       ├── sidenav/
│   │   │       ├── footer/
│   │   │       └── ...
│   │   ├── shared/
│   │   │   ├── module.ts                # SharedModule (Material, reusable components, pipes, directives)
│   │   │   ├── components/              # 56 reusable km-* components
│   │   │   │   ├── button/              # km-button
│   │   │   │   ├── dialog-title/        # km-dialog-title
│   │   │   │   ├── chip/                # km-chip
│   │   │   │   ├── expansion-panel/     # km-expansion-panel
│   │   │   │   ├── tab-card/            # km-tab-card with km-tab children
│   │   │   │   ├── table/               # km-table
│   │   │   │   ├── confirmation-dialog/ # km-confirmation-dialog
│   │   │   │   ├── add-project-dialog/  # km-add-project-dialog
│   │   │   │   └── ...
│   │   │   ├── entity/                  # TypeScript interfaces (Cluster, Project, Node, etc.)
│   │   │   ├── pipes/                   # Custom pipes (LinkLocation, SizeFormatter, etc.)
│   │   │   ├── directives/              # Structural/attribute directives
│   │   │   ├── validators/              # Reactive Forms validators (20+ custom validators)
│   │   │   ├── utils/                   # Utility functions (health-status helpers, etc.)
│   │   │   ├── model/                   # Models, enums
│   │   │   ├── constants/               # Constants
│   │   │   ├── animations/              # Reusable Angular animations
│   │   │   ├── functions/               # Helper functions
│   │   │   └── types/                   # Type definitions
│   │   ├── dynamic/
│   │   │   ├── module-registry.ts       # EE edition module exports (DynamicModule namespace)
│   │   │   ├── module-registry.ce.ts    # CE edition module exports (swapped at build)
│   │   │   ├── enterprise/              # EE-only modules
│   │   │   │   ├── theming/
│   │   │   │   ├── metering/
│   │   │   │   ├── quotas/
│   │   │   │   ├── group/
│   │   │   │   ├── cluster-backups/
│   │   │   │   ├── kyverno-policies/
│   │   │   │   └── allowed-registries/
│   │   │   └── community/               # CE stubs (same structure, reduced features)
│   │   │       ├── theming/
│   │   │       ├── metering/
│   │   │       ├── quotas/
│   │   │       └── ...
│   │   ├── project/                     # Feature module: Projects CRUD
│   │   │   ├── module.ts
│   │   │   ├── routing.ts
│   │   │   ├── component.ts             # Project list component
│   │   │   ├── delete-project/
│   │   │   └── edit-project/
│   │   ├── cluster/                     # Feature module: Cluster details, list, machine deployments
│   │   │   ├── module.ts
│   │   │   ├── routing.ts
│   │   │   ├── list/                    # Cluster list view
│   │   │   └── details/                 # Cluster detail pages (nested routes)
│   │   ├── wizard/                      # Feature module: Create cluster wizard
│   │   │   ├── module.ts
│   │   │   ├── routing.ts
│   │   │   ├── component.ts
│   │   │   ├── step/                    # Wizard steps (provider-settings, machine-deployment, etc.)
│   │   │   └── ...
│   │   ├── settings/                    # Feature module: User & Admin settings
│   │   │   ├── user/                    # User account settings
│   │   │   │   ├── module.ts
│   │   │   │   └── component.ts
│   │   │   └── admin/                   # Admin-only settings (OPA, users, announcements, etc.)
│   │   │       ├── module.ts
│   │   │       ├── opa/
│   │   │       ├── announcements/
│   │   │       └── ...
│   │   ├── pages/                       # Feature module: Static pages (404, frontpage, terms)
│   │   │   ├── module.ts
│   │   │   ├── routing.ts
│   │   │   └── ...
│   │   ├── member/                      # Feature module: Project members
│   │   ├── serviceaccount/              # Feature module: Service accounts
│   │   ├── sshkey/                      # Feature module: SSH keys
│   │   ├── backup/                      # Feature module: Backups (EE feature)
│   │   ├── cluster-template/            # Feature module: Cluster templates
│   │   ├── kubeone-wizard/              # Feature module: KubeOne wizard (external clusters)
│   │   ├── external-cluster-wizard/     # Feature module: External cluster wizard
│   │   ├── config.service.ts            # App config loader (branding, restRoot, git version)
│   │   ├── config.ts                    # Config constants (COOKIE token)
│   │   └── google-analytics.service.ts  # Analytics integration
│   ├── assets/
│   │   ├── css/                         # Global SCSS styles (root.scss)
│   │   ├── themes/                      # Theme bundles (light.scss, dark.scss, custom.scss)
│   │   ├── images/
│   │   └── ...
│   ├── environments/
│   │   ├── environment.ts               # Dev config
│   │   ├── environment.prod.ts          # Prod config
│   │   ├── environment.e2e.ts           # E2E config
│   │   └── environment.e2e.local.ts     # E2E local config
│   ├── tsconfig.ee.json                 # TypeScript config (includes enterprise/, excludes community/)
│   ├── tsconfig.ce.json                 # TypeScript config (includes community/, excludes enterprise/)
│   └── test/
│       ├── services/                    # Mock services (AuthMockService, ClusterMockService, etc.)
│       ├── data/                        # Fake data for tests (fakeCluster, fakeProject, etc.)
│       ├── components/                  # Test utilities
│       └── utils/                       # Test helper functions
├── angular.json                         # Build config, fileReplacements for CE/EE
├── tsconfig.json                        # Root TypeScript config
├── tsconfig.spec.json                   # Spec/test config
└── package.json                         # npm dependencies
```

## Directory Purposes

**`src/app/core/`:**
- Purpose: Application-wide singleton services, guards, interceptors
- Contains: Stateful services (API clients), HTTP middleware, route guards, auth logic
- Key files: `src/app/core/module.ts` exports CoreModule; `src/app/core/services/` has 50+ services

**`src/app/shared/`:**
- Purpose: Reusable components, pipes, directives, and Material design system
- Contains: 56 `km-*` prefixed components (MaterialButton, Dialog, Table, Tab, etc.), custom pipes, validators, utility functions
- Key files: `src/app/shared/module.ts` imports all Material modules and exports shared components/pipes

**`src/app/dynamic/`:**
- Purpose: CE/EE feature-flag loading via build-time module swapping
- Contains: Two module registries (EE and CE) with Promise-based dynamic imports, two subdirectories (enterprise/, community/)
- Mechanism: `angular.json` fileReplacements swaps module-registry.ts with module-registry.ce.ts in CE builds

**Feature Modules (project, cluster, wizard, settings, etc.):**
- Purpose: Encapsulated feature domains with own routing, components, and local services
- Pattern: Each has module.ts, routing.ts, nested subdirectories per feature view
- Lazy-loaded: AppRoutingModule uses loadChildren to lazy-load feature modules on demand

**`src/test/`:**
- Purpose: Test utilities, mock services, and fake data
- Contains: Mock implementations of real services (ClusterMockService, ProjectMockService, etc.), test fixtures (fakeCluster, fakeProject, fakeDatacenter)
- Import pattern: `import {...} from '@test/services/...` (alias defined in tsconfig.json)

## Key File Locations

**Entry Points:**
- `src/main.ts`: Bootstrap Angular platform, load AppModule
- `src/app/module.ts`: AppModule (root declarations, Core/Shared imports, providers)
- `src/app/component.ts`: KubermaticComponent (km-root, page shell with sidenav)
- `src/app/dashboard/component.ts`: DashboardComponent (feature router-outlet)

**Configuration:**
- `src/app/config.ts`: App constants (COOKIE token name)
- `src/app/config.service.ts`: Load config from backend (restRoot, branding, git version)
- `angular.json`: Build configuration, fileReplacements for CE/EE, styles bundles (themes)
- `src/tsconfig.ee.json` / `src/tsconfig.ce.json`: TypeScript paths, module exclusions

**Core Logic:**
- `src/app/core/services/`: 50+ API client services (cluster.ts, project.ts, datacenter.ts, etc.)
- `src/app/core/interceptors/`: HTTP middleware (auth token, error handling, loader, token check)
- `src/app/core/services/auth/`: Authentication service and route guards

**Shared Components:**
- `src/app/shared/components/`: 56 components with km- prefix, organized by feature (button, dialog, chip, table, etc.)
- Each component has: component.ts, template.html, style.scss, optional spec.ts

**Testing:**
- Test mocks: `src/test/services/*.ts` (mock services for DI override)
- Fake data: `src/test/data/*.ts` (factory functions for test objects)
- Co-located specs: `src/app/**/*.spec.ts` (same directory as component)

## Naming Conventions

**Files:**
- Component: `component.ts`, `component.spec.ts`
- Module: `module.ts`
- Routing: `routing.ts`
- Service: `service-name.ts` (e.g., cluster.ts, project.ts)
- Guard: `guard.ts` in feature folder (e.g., `auth/guard.ts`)
- Interceptor: `feature.ts` (e.g., auth.ts, error-notifications.ts)
- Template: `template.html`
- Style: `style.scss` or inline via styleUrls
- Spec: `component.spec.ts`, `interceptor.spec.ts`

**Directories:**
- Feature modules: kebab-case (project, cluster, wizard, settings)
- Component directories: kebab-case (button, dialog-title, chip)
- Service directories: kebab-case with domain (auth/, provider/, kubeone-wizard/)

**Components:**
- Selector: `km-` prefix (e.g., km-button, km-tab-card, km-chip)
- Class name: PascalCase (ButtonComponent, TabCardComponent)

**Services:**
- Class name: PascalCase with Service suffix (ClusterService, ProjectService, AuthService)
- Singleton: Provided in CoreModule or feature module providers
- File name: kebab-case (cluster.ts, project.ts, cluster-backup.ts)

**Models/Entities:**
- Interfaces: PascalCase (Cluster, Project, Node, Datacenter)
- Location: `src/app/shared/entity/` 
- Exported: Named exports, not default exports

## Where to Add New Code

**New Feature (e.g., new resource type):**
- Primary code: Create directory `src/app/new-feature/` with module.ts, routing.ts, component.ts
- Module: Use ng generate or manually create NgModule with imports [SharedModule, CommonModule]
- Routing: Add loadChildren in AppRoutingModule → `src/app/routing.ts`
- Lazy-load: Route loads feature module on demand via dynamic import
- Tests: Co-locate `component.spec.ts` next to component.ts

**New Shared Component:**
- Location: `src/app/shared/components/new-component/`
- Files: component.ts, template.html, style.scss (optional spec.ts)
- Selector: Follow `km-` prefix: km-new-component
- Export: Declare in SharedModule in `src/app/shared/module.ts`
- Use: Import SharedModule in any feature module to use the component

**New Service:**
- Location: `src/app/core/services/` for singletons; feature folder for local services
- File name: kebab-case (e.g., new-service.ts)
- Singleton: Provide in CoreModule if global, or feature module if local
- API: Inject HttpClient, return Observables from HTTP methods

**New API Client Service:**
- Location: `src/app/core/services/resource-name.ts`
- Pattern: Class with methods returning `Observable<ResourceType[]>` or `Observable<ResourceType>`
- Methods: get(), list(), create(entity), update(id, entity), delete(id)
- Base URL: Use `environment.restRoot` + endpoint path

**New Utility Function:**
- Location: `src/app/shared/utils/feature/` (e.g., health-status.ts, label-utils.ts)
- Export: Named function, not default
- Usage: Import where needed, no service wrapper needed

**New Validator:**
- Location: `src/app/shared/validators/` (e.g., custom-validator.ts)
- Pattern: Function returning ValidatorFn (takes AbstractControl, returns ValidationErrors | null)
- Use: Apply to FormControl via Validators.compose([customValidator])

**New Pipe:**
- Location: `src/app/shared/pipes/`
- File name: kebab-case (e.g., size-formatter.pipe.ts)
- Class: PascalCase (SizeFormatterPipe)
- Export: Declare in SharedModule

**New Guard:**
- Location: `src/app/core/services/auth/guard.ts` (global) or feature module (local)
- Pattern: Implement CanActivate, CanDeactivate, or CanActivateChild interface
- Use: Apply to routes via canActivate/canDeactivate metadata

## Special Directories

**`src/app/dynamic/`:**
- Purpose: CE/EE feature switching
- Generated: No (manually maintained)
- Committed: Yes
- How it works: Two module-registry files (EE and CE) export DynamicModule namespace. angular.json fileReplacements selects which to use at build time. TypeScript configs (tsconfig.ee.json, tsconfig.ce.json) exclude opposite edition code.

**`src/test/`:**
- Purpose: Test utilities and mock data
- Generated: No
- Committed: Yes
- Used: Import mocks via @test alias: `import {ClusterMockService} from '@test/services/cluster-mock'`

**`src/environments/`:**
- Purpose: Environment-specific configuration (dev, prod, e2e)
- Generated: No
- Committed: Yes
- Used: Import in component/service via `import {environment} from '@environments/environment'`

**`src/assets/themes/`:**
- Purpose: CSS theme bundles (light.scss, dark.scss, custom.scss)
- Generated: No
- Committed: Yes (source), No (compiled CSS - built via `npm run build:themes`)
- How used: Dynamically loaded at runtime based on user theme selection

---

*Structure analysis: 2026-04-09*
