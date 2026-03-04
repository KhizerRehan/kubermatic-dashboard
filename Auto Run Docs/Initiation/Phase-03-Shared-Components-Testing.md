# Phase 03: Shared Components Unit Tests

This phase significantly expands test coverage for the 200+ shared components that form the foundation of the Kubermatic Dashboard UI. These components are the most reusable and highest-impact targets for testing, and solid test coverage prevents regressions across the entire application.

## Tasks

- [ ] Categorize and prioritize shared components for testing:
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

- [ ] Write comprehensive tests for form control components:
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

- [ ] Write tests for display and utility components:
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
