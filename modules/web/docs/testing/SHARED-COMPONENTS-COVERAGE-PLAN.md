---
type: reference
title: Shared Components Test Coverage Plan
created: 2026-03-05
tags:
  - testing
  - shared-components
  - coverage-planning
related:
  - '[[TESTING-PATTERNS]]'
  - '[[Phase-03-Shared-Components-Testing]]'
---

# Shared Components Test Coverage Plan

## Overview

This document provides a comprehensive inventory and testing strategy for the 55+ shared components that form the foundation of the Kubermatic Dashboard UI. These reusable components are critical for maintaining consistency across the application and preventing regressions.

**Document Purpose:**
- Complete inventory of all shared components
- Categorization into 6 functional groups
- Test priority ranking (Essential → Important → Nice-to-Have)
- Estimated test cases per component type
- Progress tracking for test implementation

---

## Component Inventory & Categorization

### 1. Form Control Components (14 components)

Form controls are **ESSENTIAL** for testing as they handle user input, validation, and state management throughout the application.

| Component | Type | Purpose | ControlValueAccessor | Priority | Est. Tests |
|-----------|------|---------|----------------------|----------|-----------|
| autocomplete | Input | Custom autocomplete with filtering | ✓ Yes | Essential | 8 |
| button | Button | Reusable button with Material styling | ✗ No | Essential | 5 |
| chip-autocomplete | Input | Chip-based autocomplete for multi-select | ✓ Yes | Essential | 8 |
| combobox | Input/Select | Combined input + dropdown | ✓ Yes | Important | 8 |
| number-stepper | Input | Numeric input with increment/decrement | ✓ Yes | Essential | 7 |
| pagination-page-size | Select | Page size selector with persistence | ✗ No | Essential | 6 |
| search-field | Input | Search with clear button | ✓ Yes | Essential | 6 |
| select | Select | Custom select wrapper | ✓ Yes | Essential | 8 |
| taint-form | Form | Taint key-value pair form | ✓ Yes | Important | 8 |
| cidr-form | Form | CIDR input with validation | ✓ Yes | Essential | 9 |
| label-form | Form | Key-value label form | ✓ Yes | Important | 8 |
| annotation-form | Form | Key-value annotation form | ✓ Yes | Important | 8 |
| machine-networks-new | Form | Network configuration form | ✓ Yes | Important | 10 |
| validate-json-or-yaml | Form | JSON/YAML validator | ✗ No | Important | 6 |

**Subtotal: 14 components | ~112 test cases**

---

### 2. Display Components (14 components)

Display components present information in various visual formats and are **IMPORTANT** for UI consistency testing.

| Component | Type | Purpose | Priority | Est. Tests |
|-----------|------|---------|----------|-----------|
| chip | Badge | Inline tag/label chip | Essential | 6 |
| chip-list | List | Container for multiple chips | Essential | 5 |
| initials-circle | Avatar | User avatar with initials | Essential | 5 |
| property | Display | Label + value pair | Essential | 5 |
| property-boolean | Display | Boolean value display with icon | Essential | 4 |
| property-health | Display | Health status indicator | Essential | 5 |
| property-usage | Display | Usage bar with percentage | Important | 6 |
| relativetime | Display | Relative time formatter (5 mins ago) | Important | 7 |
| eol | Display | End-of-life indicator | Important | 5 |
| announcement-banner | Banner | Top banner for announcements | Important | 6 |
| event-card | Card | Individual event display | Important | 6 |
| labels | Display | Multiple labels/tags display | Important | 6 |
| dialog-title | Header | Dialog title component | Essential | 4 |
| tab-card | Card | Card with tab interface | Important | 7 |

**Subtotal: 14 components | ~87 test cases**

---

### 3. Dialog & Modal Components (10 components)

Dialog components handle user interactions with modal windows and are **ESSENTIAL** for functional testing.

| Component | Type | Purpose | Priority | Est. Tests |
|-----------|------|---------|----------|-----------|
| announcements-dialog | Dialog | View/manage announcements | Important | 8 |
| add-project-dialog | Dialog | Create new project | Essential | 10 |
| add-ssh-key-dialog | Dialog | Add SSH key credential | Essential | 9 |
| add-external-cluster-dialog | Dialog | Multi-step external cluster wizard | Essential | 15 |
| add-cluster-from-template-dialog | Dialog | Create cluster from template | Essential | 10 |
| confirmation-dialog | Dialog | Yes/No confirmation | Essential | 7 |
| external-cluster-data-dialog | Dialog | Display cluster connection data | Important | 8 |
| save-cluster-template | Dialog | Save cluster as template | Important | 8 |
| select-external-cluster-provider | Dialog | Provider selection | Important | 7 |
| external-cluster-credentials | Dialog/Form | Multi-provider credentials | Essential | 12 |

**Subtotal: 10 components | ~94 test cases**

---

### 4. Data Visualization Components (8 components)

Data visualization components display collections and tables, **IMPORTANT** for functional correctness.

| Component | Type | Purpose | Priority | Est. Tests |
|-----------|------|---------|----------|-----------|
| addon-list | List/Table | Addon management table | Important | 12 |
| application-list | List | Application list with filters | Important | 10 |
| event-list | List | Event log display | Important | 8 |
| event-rate-limit | Display | Rate limit visualization | Nice-to-Have | 5 |
| cluster-summary | Card/Display | Cluster info summary | Important | 8 |
| cluster-from-template | Selection | Template selection interface | Important | 8 |
| machine-flavor-filter | Filter | Machine flavor selection | Important | 9 |
| ssh-key-list | List | SSH key management | Important | 10 |

**Subtotal: 8 components | ~70 test cases**

---

### 5. Layout & Container Components (7 components)

Layout components structure page and content layout, **IMPORTANT** for responsive design testing.

| Component | Type | Purpose | Priority | Est. Tests |
|-----------|------|---------|----------|-----------|
| expansion-panel | Container | Expandable/collapsible panel | Important | 7 |
| side-nav-field | Navigation | Sidebar navigation item | Important | 6 |
| editor | Editor | Code editor wrapper | Nice-to-Have | 8 |
| terminal | Terminal | Terminal emulator | Nice-to-Have | 8 |
| taints | Display/List | Kubernetes taints display | Important | 6 |
| openstack-credentials | Form | Multi-variant form component | Important | 12 |
| spinner-with-confirmation | Utility | Spinner with confirmation message | Important | 7 |

**Subtotal: 7 components | ~54 test cases**

---

### 6. Utility Components (2 components)

Utility components provide essential app-wide functionality.

| Component | Type | Purpose | Priority | Est. Tests |
|-----------|------|---------|----------|-----------|
| loader | Spinner | Global loading indicator | Essential | 5 |
| example-tests | Reference | Test pattern examples | N/A | — |

**Subtotal: 2 components | 5 test cases**

---

## Summary Statistics

| Category | Count | Total Est. Tests | Status |
|----------|-------|------------------|--------|
| Form Controls | 14 | 112 | Not Started |
| Display Components | 14 | 87 | Not Started |
| Dialogs & Modals | 10 | 94 | Not Started |
| Data Visualization | 8 | 70 | Not Started |
| Layout & Containers | 7 | 54 | Not Started |
| Utilities | 2 | 5 | Not Started |
| **TOTALS** | **55** | **~422 test cases** | **0% Complete** |

---

## Test Priority Ranking

### Phase 1: Essential Components (Priority 1) - 34 components
These components are critical for core functionality and should be tested first.

**Form Controls (Essential):**
- autocomplete, number-stepper, pagination-page-size, search-field, select, cidr-form

**Display Components (Essential):**
- chip, chip-list, initials-circle, property, property-boolean, property-health, dialog-title

**Dialog Components (Essential):**
- add-project-dialog, add-ssh-key-dialog, add-external-cluster-dialog, add-cluster-from-template-dialog, confirmation-dialog, external-cluster-credentials, button

**Utilities:**
- loader

**Count: 34 components | ~187 test cases**

---

### Phase 2: Important Components (Priority 2) - 18 components
Important components enhance core functionality and UI consistency.

**Form Controls:**
- combobox, taint-form, label-form, annotation-form, machine-networks-new, validate-json-or-yaml

**Display Components:**
- property-usage, relativetime, eol, announcement-banner, event-card, labels, tab-card

**Data Visualization:**
- addon-list, application-list, event-list, cluster-summary, cluster-from-template, machine-flavor-filter, ssh-key-list

**Layout & Containers:**
- expansion-panel, side-nav-field, taints, openstack-credentials, spinner-with-confirmation

**Count: 18 components | ~188 test cases**

---

### Phase 3: Nice-to-Have Components (Priority 3) - 3 components
Advanced or less frequently used components.

**Data Visualization:**
- event-rate-limit

**Layout & Containers:**
- editor, terminal

**Count: 3 components | ~21 test cases**

---

## Test Case Breakdown by Component Type

### Form Control Components

Each form control should include:

1. **Initialization & Default State** (2 tests)
   - Component initializes with default values
   - Default validators applied

2. **@Input Property Binding** (2 tests)
   - Input properties update component state
   - Changes detect via ChangeDetectionStrategy.OnPush

3. **@Output Event Emission** (2 tests)
   - User interaction emits correct events
   - Event data is accurate

4. **ControlValueAccessor Integration** (2 tests)
   - Form control value write/read
   - Model changes propagate to form

5. **Validation** (2 tests)
   - Validation errors display correctly
   - Custom validators work properly

6. **Disabled & ReadOnly States** (1 test)
   - Component respects disabled/readonly attributes

7. **Focus & Blur Handling** (1 test)
   - Focus/blur events work correctly

8. **Accessibility** (1 test)
   - ARIA labels present, keyboard navigation works

---

### Display Components

Each display component should include:

1. **Render with Input Values** (2 tests)
   - Component renders with provided data
   - Template correctly displays input

2. **Input State Variations** (2 tests)
   - Component handles empty/null values
   - Component handles edge case values

3. **Conditional Rendering** (1 test)
   - Optional content shows/hides based on conditions
   - CSS classes applied based on state

4. **CSS Classes & Styling** (1 test)
   - Correct Material classes applied
   - Status-based styling works

5. **No Side Effects** (1 test)
   - Component doesn't emit events unexpectedly
   - No external service calls

---

### Dialog Components

Each dialog should include:

1. **Dialog Data Injection** (2 tests)
   - MAT_DIALOG_DATA injected correctly
   - Dialog state initialized from data

2. **Dialog Close Behavior** (2 tests)
   - Close button closes dialog
   - Correct return data on close

3. **Form Submission** (2 tests)
   - Submit button processes form
   - Validation prevents submit

4. **User Interaction** (2 tests)
   - Button clicks trigger actions
   - Form state changes work

5. **Error Handling** (1 test)
   - Errors display to user
   - Dialog remains open on error

6. **Cancel/Close** (1 test)
   - Cancel button closes without data
   - ESC key closes dialog

---

### Data Visualization Components

Each visualization should include:

1. **Render with Data** (2 tests)
   - Component renders provided data
   - Items display correctly

2. **Pagination/Sorting** (2 tests)
   - Pagination controls work
   - Sorting updates display

3. **Selection Events** (1 test)
   - Row/item selection emits events
   - Selection state tracked

4. **Empty State** (1 test)
   - Empty message displays when no data
   - Loading state different from empty

5. **Loading State** (1 test)
   - Spinner shows while loading
   - Spinner hides when done

6. **Conditional Rendering** (1 test)
   - Columns show/hide based on config
   - Optional features toggle

---

### Layout Components

Each layout component should include:

1. **Structure & Projection** (2 tests)
   - ng-content projects correctly
   - Component structure correct

2. **State Management** (1 test)
   - Expanded/collapsed state toggles
   - Active tab changes

3. **Click Handlers** (1 test)
   - Click events trigger state changes
   - Events emit correctly

4. **Content Projection** (1 test)
   - Child content renders
   - Multiple projection slots work

5. **Responsive Behavior** (1 test)
   - Component adapts to screen size
   - Breakpoint styles apply

---

## Testing Utilities & Patterns

All component tests should use the testing utilities from `src/test/utils/`:

- **FixtureHelper** - DOM queries, event triggering, change detection
- **TestBedSetup** - Component test configuration
- **FormBuilderHelper** - Reactive forms testing
- **ChangeDetectionHelper** - OnPush strategy verification
- **HttpMockBuilder** - HTTP mocking for data-fetching components

See [[TESTING-PATTERNS]] for detailed examples.

---

## Progress Tracking

### Legend
- ⬜ Not Started
- 🟨 In Progress
- 🟩 Complete (>80% coverage)
- ❌ Blocked/On Hold

### Form Controls Progress
| Component | Status | Tests | Coverage |
|-----------|--------|-------|----------|
| autocomplete | ⬜ | 0/8 | 0% |
| button | ⬜ | 0/5 | 0% |
| chip-autocomplete | ⬜ | 0/8 | 0% |
| combobox | ⬜ | 0/8 | 0% |
| number-stepper | ⬜ | 0/7 | 0% |
| pagination-page-size | ⬜ | 0/6 | 0% |
| search-field | ⬜ | 0/6 | 0% |
| select | ⬜ | 0/8 | 0% |
| taint-form | ⬜ | 0/8 | 0% |
| cidr-form | ⬜ | 0/9 | 0% |
| label-form | ⬜ | 0/8 | 0% |
| annotation-form | ⬜ | 0/8 | 0% |
| machine-networks-new | ⬜ | 0/10 | 0% |
| validate-json-or-yaml | ⬜ | 0/6 | 0% |

### Display Components Progress
| Component | Status | Tests | Coverage |
|-----------|--------|-------|----------|
| chip | ⬜ | 0/6 | 0% |
| chip-list | ⬜ | 0/5 | 0% |
| initials-circle | ⬜ | 0/5 | 0% |
| property | ⬜ | 0/5 | 0% |
| property-boolean | ⬜ | 0/4 | 0% |
| property-health | ⬜ | 0/5 | 0% |
| property-usage | ⬜ | 0/6 | 0% |
| relativetime | ⬜ | 0/7 | 0% |
| eol | ⬜ | 0/5 | 0% |
| announcement-banner | ⬜ | 0/6 | 0% |
| event-card | ⬜ | 0/6 | 0% |
| labels | ⬜ | 0/6 | 0% |
| dialog-title | ⬜ | 0/4 | 0% |
| tab-card | ⬜ | 0/7 | 0% |

### Dialog Components Progress
| Component | Status | Tests | Coverage |
|-----------|--------|-------|----------|
| announcements-dialog | ⬜ | 0/8 | 0% |
| add-project-dialog | ⬜ | 0/10 | 0% |
| add-ssh-key-dialog | ⬜ | 0/9 | 0% |
| add-external-cluster-dialog | ⬜ | 0/15 | 0% |
| add-cluster-from-template-dialog | ⬜ | 0/10 | 0% |
| confirmation-dialog | ⬜ | 0/7 | 0% |
| external-cluster-data-dialog | ⬜ | 0/8 | 0% |
| save-cluster-template | ⬜ | 0/8 | 0% |
| select-external-cluster-provider | ⬜ | 0/7 | 0% |
| external-cluster-credentials | ⬜ | 0/12 | 0% |

### Data Visualization Progress
| Component | Status | Tests | Coverage |
|-----------|--------|-------|----------|
| addon-list | ⬜ | 0/12 | 0% |
| application-list | ⬜ | 0/10 | 0% |
| event-list | ⬜ | 0/8 | 0% |
| event-rate-limit | ⬜ | 0/5 | 0% |
| cluster-summary | ⬜ | 0/8 | 0% |
| cluster-from-template | ⬜ | 0/8 | 0% |
| machine-flavor-filter | ⬜ | 0/9 | 0% |
| ssh-key-list | ⬜ | 0/10 | 0% |

### Layout Components Progress
| Component | Status | Tests | Coverage |
|-----------|--------|-------|----------|
| expansion-panel | ⬜ | 0/7 | 0% |
| side-nav-field | ⬜ | 0/6 | 0% |
| editor | ⬜ | 0/8 | 0% |
| terminal | ⬜ | 0/8 | 0% |
| taints | ⬜ | 0/6 | 0% |
| openstack-credentials | ⬜ | 0/12 | 0% |
| spinner-with-confirmation | ⬜ | 0/7 | 0% |

### Utilities Progress
| Component | Status | Tests | Coverage |
|-----------|--------|-------|----------|
| loader | ⬜ | 0/5 | 0% |

---

## Estimated Timeline

| Phase | Components | Tests | Estimated Duration | Target Completion |
|-------|-----------|-------|-------------------|------------------|
| Phase 1 (Essential) | 34 | 187 | 3-4 weeks | Week 4 |
| Phase 2 (Important) | 18 | 188 | 2-3 weeks | Week 7 |
| Phase 3 (Nice-to-Have) | 3 | 21 | 1 week | Week 8 |
| Coverage Analysis & Gaps | — | — | 1 week | Week 8 |
| Documentation & Patterns | — | — | 1 week | Week 9 |
| **TOTAL** | **55** | **~422** | **8-9 weeks** | **Week 9** |

---

## Next Steps

1. **Start with Form Controls** (Phase 1, Essential)
   - These are foundational for other tests
   - Highest impact on overall application stability
   - Most reusable test patterns

2. **Then Display Components** (Phase 2)
   - Build on form control test patterns
   - Verify UI consistency

3. **Then Dialogs** (Phase 1, Essential)
   - Often depend on form controls
   - Critical user interaction points

4. **Then Data Visualization** (Phase 2)
   - More complex, but patterns established

5. **Finally Layout & Utilities** (Phase 2-3)
   - Less critical but important for integration

---

## Related Documentation

- [[TESTING-PATTERNS]] - Detailed testing patterns for shared components
- [[SHARED-COMPONENTS-COVERAGE-REPORT]] - Coverage analysis (to be created)
- Development.md - Testing guidelines from main docs
- CLAUDE.md - Architectural overview

---

**Document Status:** ✅ Complete (Phase 03 Task 1)
**Last Updated:** 2026-03-05
**Component Count:** 55 (verified)
**Estimated Tests:** ~422 test cases
