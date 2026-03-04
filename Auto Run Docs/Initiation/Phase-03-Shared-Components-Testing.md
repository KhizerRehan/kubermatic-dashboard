# Phase 03: Shared Components Unit Tests

This phase significantly expands test coverage for the 200+ shared components that form the foundation of the Kubermatic Dashboard UI. These components are the most reusable and highest-impact targets for testing, and solid test coverage prevents regressions across the entire application.

## Tasks

- [x] Categorize and prioritize shared components for testing:
  - Audit all components in `src/app/shared/components/` directory
  - Categorize into groups:
    - Form controls (inputs, selects, checkboxes, radio buttons, etc.)
    - Display components (cards, chips, badges, status indicators)
    - Dialogs and modals
    - Data visualization (tables, charts, grids)
    - Layout components (headers, sidebars, expansion panels)
    - Utility components (loaders, spinners, notifications)
  - Create `modules/web/docs/testing/SHARED-COMPONENTS-COVERAGE-PLAN.md` with:
    - Complete inventory of shared components (100+ components)
    - Categorization list with component names
    - Test priority ranking (essential → important → nice-to-have)
    - Estimated test cases per component type
    - Track progress as tests are written

  **COMPLETED:** Created comprehensive SHARED-COMPONENTS-COVERAGE-PLAN.md
  - Audited 55 shared components in src/app/shared/components/
  - Categorized into 6 functional groups: Form Controls (14), Display (14), Dialogs (10), Data Visualization (8), Layout (7), Utilities (2)
  - Prioritized 34 Essential, 18 Important, 3 Nice-to-Have components
  - Estimated ~422 total test cases across all components
  - Created detailed progress tracking tables for each category
  - Provided test case breakdown patterns for each component type

- [x] Write comprehensive tests for form control components:
  - Identify all form control components (inputs, selects, checkboxes, date pickers, etc.)
  - For each form control component, create/enhance .spec.ts file with tests for:
    - Component initialization and default state
    - @Input property binding and updates
    - @Output event emission on user interaction
    - Form control integration (ControlValueAccessor if applicable)
    - Validation state and error message display
    - Disabled and readonly states
    - Focus and blur event handling
    - Accessibility features (aria labels, keyboard navigation)
  - Target: At least 40+ form component tests created/improved
  - Ensure each test follows the patterns established in Phase 1

  **COMPLETED:** Created comprehensive form control component tests
  - search-field component: 13 tests (initialization, isEmpty/clear methods, queryChange event emission, clear button rendering, input field behavior, accessibility, cleanup)
  - button component: 18 tests (input binding, button rendering modes, loading states, observable integration, error handling, throttling behavior, change detection, OnPush strategy, cleanup, accessibility)
  - select component: 23 tests (form initialization with validators, options binding, label/hint rendering, multiple selection mode, single selection, form control value accessor pattern, validation error display, required validator, cleanup)
  - autocomplete component: 19 tests (form initialization, dropdown state management, disabled handling via ngOnChanges, input properties management, form control accessor pattern, validator combinations, form value management, edge cases)
  - number-stepper component: 30 tests (input properties, value getter/setter with type conversion, decimal/integer parsing, increment/decrement with bounds checking, pattern validation, focus state, ID binding, ControlValueAccessor and Validator interface, mode property, OnPush change detection with manual detectChanges, component cleanup)
  - pagination-page-size component: 23 tests (options exposure, initialization from UserService, debounced settings updates (500ms), notification triggers, isSettingEqual comparison, component cleanup with proper unsubscribe, settings synchronization, edge cases, service dependency mocking)

  **Summary:**
  - **Total: 126 tests created** (exceeds 40+ target by 215%)
  - 6 form control components fully tested
  - All tests follow established Phase 1/2 patterns using TestBed, SharedModule, jest
  - Advanced testing techniques: ControlValueAccessor, Validator interface, OnPush change detection, RxJS debounce/throttle, service mocking, fakeAsync/tick
  - Comprehensive coverage: input binding, event emission, form integration, validation, disabled states, accessibility, lifecycle cleanup

  **Created test files:**
    - modules/web/src/app/shared/components/search-field/component.spec.ts
    - modules/web/src/app/shared/components/button/component.spec.ts
    - modules/web/src/app/shared/components/select/component.spec.ts
    - modules/web/src/app/shared/components/autocomplete/component.spec.ts
    - modules/web/src/app/shared/components/number-stepper/component.spec.ts
    - modules/web/src/app/shared/components/pagination-page-size/component.spec.ts

  **Testing techniques demonstrated:**
    - ControlValueAccessor integration (writeValue, registerOnChange, registerOnTouched, setDisabledState)
    - Validator interface implementation (validate method)
    - OnPush change detection strategy with manual detectChanges and markForCheck
    - RxJS observable testing with throttleTime and debounceTime
    - Service mocking with BehaviorSubject and jasmine.SpyObj
    - Component lifecycle testing (ngOnInit, ngOnDestroy, ngAfterViewInit)
    - Form control validation (required, min/max, pattern, custom validators)
    - Material component integration (mat-select, mat-form-field, mat-option, etc.)
    - Accessibility testing (aria labels, keyboard navigation)

- [x] Write tests for display and utility components:
  - Identify display components (cards, chips, badges, status indicators, etc.)
  - For each display component, create/enhance .spec.ts file with tests for:
    - Component renders with required @Input values
    - Component renders correctly based on different input states
    - Conditional rendering (optional content, status-based display)
    - CSS class application based on input (status colors, sizes, etc.)
    - No unexpected side effects or subscriptions
    - Memory cleanup (no unsubscribed observables)
  - Identify utility components (loaders, spinners, notifications, etc.)
  - For each utility component, test:
    - Visibility toggling
    - Message display variations
    - Animation trigger and cleanup
    - Interaction handlers if applicable
  - Target: At least 60+ display/utility component tests created/improved

  **COMPLETED:** Created comprehensive display and utility component tests
  - **9 display/utility components fully tested with 364 total tests**
  - **Total: 364 tests created (exceeds 60+ target by 607%)**
  - chip component: 28 tests (type enum, input properties, CSS classes, edge cases, multiple instances)
  - initials-circle component: 41 tests (owners array, limit property, initials generation, conditional rendering)
  - eol (End-of-Life) component: 40 tests (service integration, type variants, version handling, tooltip content)
  - announcement-banner component: 37 tests (router navigation, user service, dialog integration, banner visibility)
  - labels component: 56 tests (object/array labels, limit property, getHiddenLabels, toggleHiddenLabels methods)
  - dialog-title component: 36 tests (disableClose property, content projection, Material integration)
  - tab-card component: 46 tests (context enum, verticalMargin, content projection, lifecycle hooks)
  - loader (utility) component: 41 tests (text display, icon management, layout verification, multiple instances)
  - spinner-with-confirmation (utility) component: 39 tests (isSaved property, confirmationTimeout, timeout behavior)

  **Key testing patterns demonstrated:**
  - Conditional rendering based on @Input properties and state
  - CSS class application and styling verification
  - Service dependency mocking (@Injectable services, jasmine.SpyObj)
  - Router event handling and navigation filtering (NavigationEnd, routerEventsSubject)
  - Async testing with fakeAsync/tick for timeout behavior
  - Content projection and ng-content handling
  - Lifecycle hooks (ngOnInit, ngOnChanges, ngAfterContentInit, ngOnDestroy)
  - RxJS subscription management and takeUntil cleanup patterns
  - Memory cleanup and unsubscribe verification
  - Edge case handling (null, undefined, special characters, long content, rapid changes)
  - Multiple instance state isolation
  - Material component integration (@angular/material directives)
  - OnPush change detection strategy testing

- [ ] Write tests for dialog and modal components:
  - Identify all dialog content components in shared folder
  - For each dialog component, create/enhance .spec.ts file with tests for:
    - Proper MAT_DIALOG_DATA injection and usage
    - Dialog close with correct return data
    - Button click handling and actions
    - Form submission within dialog
    - Cancel/close behavior
    - Error handling and user feedback
  - Target: At least 20+ dialog component tests created/improved

- [ ] Write tests for data visualization components:
  - Identify table, chart, grid, and other data visualization components
  - For each component, create/enhance .spec.ts file with tests for:
    - Component renders with input data
    - Sorting and pagination if supported
    - Event emission on row/item selection
    - Empty state handling
    - Loading state display
    - Conditional column rendering
    - Data transformation (if any)
  - Target: At least 30+ data visualization component tests created/improved

- [ ] Write tests for layout and container components:
  - Identify layout components (headers, sidebars, expansion panels, tabs, etc.)
  - For each layout component, create/enhance .spec.ts file with tests for:
    - Basic structure and template projection (@ViewChild, ng-content)
    - State management (expanded/collapsed, active tab, etc.)
    - Click handlers for state changes
    - Content projection and transcription
    - Responsive behavior if applicable
  - Target: At least 30+ layout component tests created/improved

- [ ] Run test coverage analysis and identify gaps:
  - Execute `npm run test:ci` to get coverage report for shared components
  - Generate coverage report: `npm test -- --coverage --testPathPattern="shared/components"`
  - Create `modules/web/docs/testing/SHARED-COMPONENTS-COVERAGE-REPORT.md` with:
    - Overall coverage percentage for shared components
    - Coverage by component category
    - List of components below 80% coverage
    - List of components with no tests yet
    - Recommendations for Phase 4 coverage improvements
  - Target: Achieve at least 70% coverage for shared components tested in this phase

- [ ] Document testing patterns specific to shared components:
  - Update `modules/web/docs/testing/TESTING-PATTERNS.md` with new sections:
    - Testing form controls with ControlValueAccessor
    - Testing Material components (@angular/material)
    - Testing components with @ContentChild and @ViewChild
    - Testing components with complex change detection scenarios
    - Testing components with animations and transitions
    - Common pitfalls and how to avoid them in shared component testing
  - Add examples for each pattern using real components from the codebase
