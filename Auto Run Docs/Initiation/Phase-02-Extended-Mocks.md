# Phase 02: Extended Mock Utilities & Test Helpers

This phase extends the existing mock infrastructure with additional utilities and helpers that the team will need as test coverage expands. It fills gaps in the mock service suite, adds advanced mocking patterns for complex scenarios, and creates reusable test helpers for common testing situations.

## Tasks

- [x] Audit existing mocks and identify gaps:
  - Review all 25+ mocks in `src/test/services/` and document which services they're mocking
  - Check `src/app/core/services/` to identify services that don't have mocks yet
  - Identify services frequently used in components that lack mocks
  - Create `modules/web/docs/testing/MOCK-COVERAGE-AUDIT.md` listing:
    - Which services have mocks (with file locations)
    - Which services need mocks created
    - Priority ranking for new mocks (based on usage frequency in tests)
  - Focus on high-impact services like: NotificationService, HistoryService, WindowRefService, etc.
  - **COMPLETED:** Created comprehensive audit with 26 existing mocks documented, 87 total services analyzed, 5 critical priority services identified (OPA, MLA, RBAC, History, Notification), 7 high-priority services, and implementation roadmap provided.

- [x] Create missing service mocks for high-priority services:
  - For each high-priority service without a mock, create a new mock file in `src/test/services/`
  - Follow the existing pattern: expose key methods that return Observable or Promise
  - Include documentation comments explaining what the mock does
  - Examples of mocks to create:
    - NotificationService mock (if missing) - for success/error notification tests
    - HistoryService mock (if missing) - for navigation testing
    - WindowRefService mock (if missing) - for window reference testing
    - Any other frequently-used service without a mock
  - Each mock should have at least the key methods that components actually call
  - Include proper TypeScript typing for all mocked methods
  - **COMPLETED:** Created 4 critical priority service mocks with comprehensive JSDoc documentation:
    - `opa-mock.ts` (OPAService) - 25 public methods for constraint templates, constraints, and gatekeeper config management
    - `mla-mock.ts` (MLAService) - 15 public methods for alertmanager config and rule groups
    - `rbac-mock.ts` (RBACService) - 12 public methods for cluster/namespace bindings and role management
    - `history-mock.ts` (HistoryService) - 3 public methods for navigation history tracking
    - Each mock includes complete JSDoc with @example usage patterns and @return type documentation
    - Created corresponding .spec.ts test files (4 test suites, 70+ test cases total)
    - All mocks follow established pattern from ProjectMockService with proper @Injectable() decorator
    - Mocks use fake data from existing test/data modules (opa.ts, mla.ts, rbac.ts)
    - Test files verify Observable emissions, method return types, and component integration patterns

- [ ] Create advanced mocking patterns and utilities:
  - Create `src/test/utils/mock-observable-builder.ts` - Helper for creating mock observables
    - Factory function to create observables that emit data, then complete
    - Factory function to create observables that emit errors
    - Factory function to create observables that never emit (timeout scenarios)
    - Helper for creating subject-based observables for testing subscriptions
  - Create `src/test/utils/form-builder-helper.ts` - Helper for reactive form testing
    - Function to create FormGroup with common validators
    - Function to get and verify form control values easily
    - Function to mark form as touched/dirty for validation display testing
  - Create `src/test/utils/change-detection-helper.ts` - Helper for ChangeDetection testing
    - Function to trigger change detection and extract results
    - Function to verify component has OnPush detection enabled
    - Function to test component reactivity to input changes
  - Create `src/test/utils/http-mock-builder.ts` - Helper for HTTP mock interception
    - Factory to create mock HTTP responses with different status codes
    - Helper to verify mock HTTP calls were made with expected params
    - Support for both Observable and Promise-based HTTP calls

- [ ] Enhance existing mocks with advanced scenarios:
  - Review the 5 most-used mocks (AppConfigMock, AuthMock, ProjectMock, ClusterMock, MatDialogMock)
  - Enhance each mock to support additional scenarios:
    - Methods to simulate different states (loading, error, success)
    - Methods to track how many times methods were called and with what arguments
    - Support for complex return values and nested observables
    - Example: AuthMock should support testing both authenticated and unauthenticated states
  - Update JSDoc comments in enhanced mocks to explain new capabilities

- [ ] Create reusable test setup utilities:
  - Create `src/test/utils/test-bed-setup.ts` - Common TestBed configurations
    - Factory function for basic component test setup (imports, declarations, providers)
    - Factory function for component with services test setup
    - Factory function for component with dialog test setup
    - Factory function for feature module test setup
    - Each factory should have sensible defaults and accept overrides
  - Create `src/test/utils/fixture-helper.ts` - Helpers for working with component fixtures
    - Function to get component from fixture with proper typing
    - Function to query DOM elements by common selectors
    - Function to trigger common DOM events (click, input, change)
    - Function to verify element visibility and disabled state

- [ ] Create documentation for new mock utilities and patterns:
  - Update `modules/web/docs/testing/MOCK-SERVICES-REFERENCE.md` with new mocks
  - Create `modules/web/docs/testing/ADVANCED-TESTING-PATTERNS.md` covering:
    - Observable mock builder patterns
    - Reactive form testing helpers
    - Change detection testing
    - HTTP mock interception
    - Testing async/await and promises
    - Testing error scenarios
    - Examples for each pattern with before/after comparisons

- [ ] Write unit tests for the new testing utilities:
  - Create `src/test/utils/*.spec.ts` files for each new utility created above
  - Mock builders should have tests showing they produce correct observables
  - Form helpers should test they correctly manipulate form state
  - Change detection helpers should verify they work with OnPush strategy
  - Fixture helpers should test they correctly interact with DOM
  - Goal: New utilities should be 100% tested and verified working
