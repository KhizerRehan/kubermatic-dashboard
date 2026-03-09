# PRD: Shared Components

**Route:** N/A (reusable across all features)
**Location:** `src/app/shared/components/`
**Priority:** P0

## Components (54 total)

### Tested (49 components)

| Component | Spec File | Key Behaviors |
|---|---|---|
| add-cluster-from-template-dialog | YES | Dialog for cluster creation from template |
| add-external-cluster-dialog | YES | Dialog for adding external clusters |
| add-project-dialog | YES | Project creation dialog |
| add-ssh-key-dialog | YES | SSH key creation dialog |
| addon-list | YES | Add-on listing + install/edit dialogs |
| announcement-banner | YES | Banner display |
| announcements-dialog | YES | Announcements dialog |
| application-list | YES | App listing + add/edit dialogs + edge-case spec |
| autocomplete | YES | Autocomplete input |
| button | YES | Custom button component |
| chip-autocomplete | YES | Chip autocomplete input |
| chip-list | YES | Chip list display |
| chip | YES | Single chip display with variants |
| cluster-from-template (content/) | YES | Template content display |
| cluster-from-template (dialog/) | YES | Template selection dialog |
| cluster-summary | YES | Cluster details summary card |
| combobox | YES | Combobox input |
| confirmation-dialog | YES | Generic confirmation dialog |
| dialog-title | YES | Standard dialog title bar |
| editor | YES | Monaco/YAML editor component |
| eol | YES | End-of-life indicator |
| event-card | YES | Single event display card |
| event-list | YES | Event listing |
| event-rate-limit | YES | Rate limit display |
| expansion-panel | YES | Expandable panel |
| external-cluster-data-dialog | YES | External cluster data dialog |
| initials-circle | YES | User initials avatar |
| label-form | YES | Kubernetes label key/value form |
| labels | YES | Label display chips |
| loader | YES | Loading spinner |
| machine-flavor-filter | YES | Machine type filter |
| machine-networks-new | YES | Network configuration form |
| number-stepper | YES | Numeric increment/decrement |
| pagination-page-size | YES | Page size selector |
| property-boolean | YES | Boolean property display |
| property-health | YES | Health status property |
| property-usage | YES | Usage metric property |
| property | YES | Generic property display |
| relativetime | YES | Relative time display |
| save-cluster-template | YES | Save-as-template dialog |
| search-field | YES | Search input field |
| select | YES | Custom select dropdown |
| side-nav-field | YES | Side navigation item |
| spinner-with-confirmation | YES | Spinner with confirm state |
| ssh-key-list | YES | SSH key listing |
| tab-card | YES | Tabbed card layout |
| taint-form | YES | Kubernetes taint form |
| taints | YES | Taint display |
| terminal | YES | Terminal emulator |
| validate-json-or-yaml | YES | JSON/YAML validator |

### Untested (5 components)

#### 1. annotation-form — P0 (HIGH COMPLEXITY)

**Location:** `src/app/shared/components/annotation-form/component.ts` (289 lines)
**Interfaces:** `ControlValueAccessor`, `AsyncValidator`, `DoCheck`, `OnDestroy`

**User Stories:**
- User can add annotation key/value pairs dynamically
- User can remove annotation rows
- User sees validation errors for invalid keys/values
- System prevents duplicate annotation keys
- System hides protected/hidden annotation keys (from admin settings)
- System supports JSON Merge Patch for edit mode (nullifying removed annotations)

**Acceptance Criteria:**
- FormArray creates new empty row on init
- Add button appends a new key/value row
- Remove button deletes the row and marks removed keys as null in patch mode
- Invalid annotation keys show error (must match Kubernetes annotation pattern)
- Duplicate keys show validation error
- Protected keys are filtered from display
- Hidden keys are filtered from display
- `annotationsChange` emits correct Record<string, string>
- `ControlValueAccessor` writeValue/registerOnChange/registerOnTouched work correctly
- `AsyncValidator` validate method returns errors or null

**Edge Cases:**
- Empty annotations object passed as input
- Null/undefined annotations input
- Very long annotation values
- Annotation key with "/" prefix (qualified names)
- All annotations removed (should emit empty object or null patch)
- Rapid add/remove cycles

**Test Scenarios:**
1. Should create component with default empty row
2. Should populate rows from @Input annotations
3. Should add new empty row when add button clicked
4. Should remove row and emit updated annotations
5. Should validate duplicate keys and show error
6. Should filter protected annotation keys from display
7. Should filter hidden annotation keys from display
8. Should emit correct JSON Merge Patch (nullify removed keys)
9. Should validate annotation key format (Kubernetes pattern)
10. Should validate annotation value format
11. Should implement ControlValueAccessor interface correctly
12. Should implement AsyncValidator interface correctly
13. Should handle empty/null input gracefully

#### 2. openstack-credentials — P1 (MEDIUM-HIGH COMPLEXITY)

**Location:** `src/app/shared/components/openstack-credentials/component.ts` (148 lines)
**Extends:** `BaseFormValidator`
**Interfaces:** `ControlValueAccessor`, `Validator`

**User Stories:**
- User can enter OpenStack username/password credentials
- User can switch to application credential mode
- User can enter project name and project ID
- System auto-fills credentials from preset when preset selected
- System disables fields when preset is active

**Acceptance Criteria:**
- Form renders username, password, project, projectID fields
- Toggle switches between username/password and application credential modes
- Preset selection disables manual input fields
- Credential type change clears other mode's fields
- Form emits valid `OpenstackCredentials` object
- Validation requires either username/password or application credentials

**Edge Cases:**
- Switching modes rapidly
- Preset selected then deselected
- Partial credentials entered then mode switched

**Test Scenarios:**
1. Should create component with default form state
2. Should render username/password fields initially
3. Should switch to application credentials on toggle
4. Should disable fields when preset selected
5. Should enable fields when preset deselected
6. Should emit valid OpenstackCredentials
7. Should validate required fields per mode
8. Should clear opposite mode fields on switch

#### 3. cidr-form — P1 (MEDIUM COMPLEXITY)

**Location:** `src/app/shared/components/cidr-form/component.ts` (122 lines)
**Interfaces:** `ControlValueAccessor`, `AsyncValidator`

**User Stories:**
- User can add CIDR blocks to a list
- User can remove CIDR blocks
- System validates CIDR format (IPv4)
- System auto-appends empty row when last row is filled

**Acceptance Criteria:**
- FormArray starts with initial CIDR values from @Input
- New empty row auto-appended when last row gets value
- Remove button deletes CIDR row
- Invalid CIDR shows validation error (IPV4_CIDR_PATTERN_VALIDATOR)
- `cidrsChange` emits string array of valid CIDRs

**Test Scenarios:**
1. Should create component with initial CIDR values
2. Should auto-append empty row when last filled
3. Should remove CIDR row on delete
4. Should validate IPv4 CIDR format
5. Should emit updated CIDR array on change
6. Should handle empty initial input

#### 4. external-cluster-credentials — P2 (LOW COMPLEXITY)

**Location:** `src/app/shared/components/external-cluster-credentials/component.ts` (55 lines)

**User Stories:**
- Component renders provider-specific credential form based on selected provider

**Test Scenarios:**
1. Should create component
2. Should render correct sub-form when provider changes
3. Should handle no provider selected

#### 5. select-external-cluster-provider — P2 (LOW COMPLEXITY)

**Location:** `src/app/shared/components/select-external-cluster-provider/component.ts` (63 lines)

**User Stories:**
- User selects an external cluster provider from dropdown

**Test Scenarios:**
1. Should create component with empty selection
2. Should emit selected provider on change
3. Should validate required selection
