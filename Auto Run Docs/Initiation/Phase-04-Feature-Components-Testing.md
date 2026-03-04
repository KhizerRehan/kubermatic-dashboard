# Phase 04: Feature Components & Services Testing

This phase expands test coverage to feature-specific components and the core services they depend on. Feature modules like wizard, cluster management, project management, and settings contain complex logic that benefits significantly from comprehensive unit testing to prevent regressions in critical user flows.

## Tasks

- [ ] Create comprehensive tests for wizard step components:
  - Identify all wizard step components in `src/app/wizard/step/` directory
  - For each step component, create/enhance .spec.ts file with tests for:
    - Step initialization with required inputs and services
    - Form validation rules and error states
    - Required field validation before progressing to next step
    - Dynamic field enabling/disabling based on state
    - Step-specific business logic (e.g., provider selection affecting settings)
    - Navigation handlers (next, previous, skip if applicable)
    - Subscription to wizard service and proper cleanup
    - Integration with preset service and credential management
  - Steps to test: Provider, Cluster, ProviderSettings, NodeSettings, MachineNetwork, Applications, Summary
  - Target: Complete test coverage for all 7+ wizard steps with 5-8 tests per step

- [ ] Create tests for cluster management feature components:
  - Identify components in `src/app/cluster/` directory (cluster list, cluster details, etc.)
  - For each major cluster component, create/enhance .spec.ts file with tests for:
    - Component initialization with cluster data from service
    - List rendering with cluster items and status indicators
    - Filtering and sorting functionality
    - Action buttons (edit, delete, add node, etc.) and event emission
    - Status display and health indicator logic
    - Conditional rendering based on cluster state
    - Integration with ClusterService observables
    - Error handling and retry logic if applicable
    - Loading states during data fetch
  - Target: Cover cluster list, cluster details, cluster actions, and node management components

- [ ] Create tests for project management feature components:
  - Identify components in `src/app/project/` directory
  - For each project component, create/enhance .spec.ts file with tests for:
    - Project list rendering and filtering
    - Project creation form with validation
    - Project details display
    - Project member management (add/remove/role change)
    - Project settings and configuration changes
    - Integration with ProjectService and MemberService
    - Permission-based visibility (admin vs. regular user)
    - Error handling and user feedback
  - Target: At least 15+ project-related component tests

- [ ] Create tests for member/RBAC feature components:
  - Identify components in `src/app/member/` directory and RBAC-related components
  - For each member/RBAC component, create/enhance .spec.ts file with tests for:
    - Member list display with role indicators
    - Member addition form with email validation
    - Role assignment and modification
    - Permission checking and feature visibility
    - Deletion and confirmation dialogs
    - Service integration and permission fetching
  - Target: At least 10+ member/RBAC component tests

- [ ] Create tests for settings and admin feature components:
  - Identify components in `src/app/settings/` directory
  - For each settings component, create/enhance .spec.ts file with tests for:
    - Settings form rendering with current values
    - Form validation and submission
    - Configuration persistence (API calls)
    - Notification on success/error
    - Admin vs. user settings distinction
    - Feature flag-based visibility
  - Target: At least 10+ settings component tests

- [ ] Create comprehensive service unit tests:
  - Focus on core services that multiple features depend on
  - For each major service, create/enhance .spec.ts file with tests for:
    - **ClusterService**: projectClusterList(), getCluster(), createCluster(), deleteCluster()
      - Test observable caching and refresh behavior
      - Test merge pattern with refresh timer
      - Test error handling and recovery
    - **ProjectService**: list(), get(), create(), update(), delete()
      - Test data transformation and normalization
      - Test subscription lifecycle
    - **MemberService**: list(), add(), update(), delete()
      - Test role-based operations
      - Test permission validation
    - **AuthService**: login(), logout(), refreshToken(), isAuthenticated()
      - Test authentication state management
      - Test token refresh logic
    - **DatacenterService**: datacenter list and provider configuration
      - Test provider settings availability
      - Test provider capability checking
    - Other critical services: NotificationService, HistoryService, PresetsService
  - Target: At least 30+ service unit tests with good coverage of happy paths and error cases

- [ ] Test RxJS patterns and observable interactions:
  - Focus on components/services that use complex RxJS patterns
  - Create tests for:
    - switchMap and switchMapTo patterns (common in service methods)
    - shareReplay caching behavior
    - Error handling with catchError
    - merging multiple observables
    - Subject event emission and subscription
    - Observable cleanup on component destroy (unsubscribe patterns)
  - Example test patterns:
    - Test that duplicate requests are deduplicated (shareReplay)
    - Test that refresh events trigger new requests
    - Test that errors are properly caught and handled
    - Test that subscriptions are cleaned up to prevent memory leaks
  - Target: At least 20+ tests covering RxJS patterns

- [ ] Create tests for async operations and HTTP interactions:
  - Focus on components/services that make HTTP calls
  - For each HTTP-using service, create tests for:
    - Successful HTTP response handling
    - HTTP error response handling (401, 403, 404, 500, etc.)
    - Network error handling
    - Request cancellation behavior
    - Request parameter validation
    - Response transformation
  - Use HttpClientTestingModule and HttpTestingController patterns
  - Target: At least 25+ HTTP-related tests

- [ ] Create and run integration-style tests:
  - Create tests that verify component + service interactions:
    - Test component displays data fetched from service
    - Test component actions update service state and reflect in UI
    - Test error from service propagates to component UI
    - Test loading spinner shows/hides correctly with async operations
  - Target: At least 15+ integration-style tests combining multiple classes

- [ ] Generate feature testing coverage report:
  - Execute coverage report for feature components and services
  - Create `modules/web/docs/testing/FEATURE-COVERAGE-REPORT.md` with:
    - Coverage by feature module (wizard, cluster, project, member, settings, etc.)
    - Coverage by service (ClusterService, ProjectService, etc.)
    - List of components/services below 80% coverage
    - Recommendations for Phase 5 improvements
  - Target: Achieve at least 75% coverage for feature components and services tested
