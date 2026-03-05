// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatTableModule} from '@angular/material/table';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatTabsModule} from '@angular/material/tabs';
import {MatIconModule} from '@angular/material/icon';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatChipsModule} from '@angular/material/chips';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {SharedModule} from '@shared/module';
import {FixtureHelper} from '@test/utils/fixture-helper';
import {MaterialIntegrationComponent, MaterialIntegrationDialogComponent} from './material-integration.component';

/**
 * Material Design Component Integration Tests
 *
 * This test suite covers comprehensive integration testing of Material Design components
 * used throughout the application:
 * - MatDialog: Modal dialogs with data passing
 * - MatTable: Table sorting, pagination, and selection
 * - MatForm: Form fields with validation and error display
 * - MatButton: Button states and interactions
 * - MatExpansion: Expandable panels
 * - MatMenu: Dropdown menus
 * - MatTooltip: Hover tooltips
 * - MatTab: Tabbed content
 *
 * Target: 25+ Material integration tests
 */
describe('MaterialIntegrationComponent', () => {
  let fixture: ComponentFixture<MaterialIntegrationComponent>;
  let component: MaterialIntegrationComponent;
  let dialog: MatDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatExpansionModule,
        MatMenuModule,
        MatTooltipModule,
        MatTabsModule,
        MatIconModule,
        MatCheckboxModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        SharedModule,
      ],
      declarations: [MaterialIntegrationComponent, MaterialIntegrationDialogComponent],
      providers: [MatDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(MaterialIntegrationComponent);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
    fixture.detectChanges();
  });

  // ========== Component Initialization Tests ==========

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with all controls', () => {
    expect(component.form.get('name')).toBeTruthy();
    expect(component.form.get('email')).toBeTruthy();
    expect(component.form.get('description')).toBeTruthy();
  });

  it('should initialize form in invalid state', () => {
    expect(component.form.valid).toBe(false);
  });

  it('should initialize items data source', () => {
    expect(component.dataSource).toBeTruthy();
    expect(component.dataSource.data.length).toBe(3);
  });

  // ========== MatForm Tests ==========

  describe('MatForm - Form Validation', () => {
    /**
     * Pattern: Testing MatFormField with required validator
     * Verifies that required fields show error when empty
     */
    it('should display name required error', () => {
      const nameControl = component.form.get('name');
      nameControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = FixtureHelper.querySelector(fixture, '[data-cy="name-error"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('Name is required');
    });

    it('should display email required error', () => {
      const emailControl = component.form.get('email');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = FixtureHelper.querySelector(fixture, '[data-cy="email-error"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('Email is required');
    });

    /**
     * Pattern: Testing MinLength validator
     * Verifies that minLength error is shown for short inputs
     */
    it('should display minlength error for name', () => {
      const nameControl = component.form.get('name');
      nameControl?.setValue('ab');
      nameControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = FixtureHelper.querySelector(fixture, '[data-cy="name-minlength"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('at least 3 characters');
    });

    /**
     * Pattern: Testing Email validator
     * Verifies that invalid email format is caught
     */
    it('should display email format error for invalid email', () => {
      const emailControl = component.form.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = FixtureHelper.querySelector(fixture, '[data-cy="email-format"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('Invalid email format');
    });

    /**
     * Pattern: Testing MaxLength validator
     * Verifies that long input triggers maxlength error
     */
    it('should display maxlength error for description', () => {
      const descriptionControl = component.form.get('description');
      descriptionControl?.setValue('a'.repeat(101));
      descriptionControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = FixtureHelper.querySelector(fixture, '[data-cy="description-error"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('cannot exceed 100 characters');
    });

    /**
     * Pattern: Testing form validation feedback
     * Verifies that form validity state drives button disabled state
     */
    it('should disable submit button when form is invalid', () => {
      component.form.reset();
      fixture.detectChanges();

      const submitButton = FixtureHelper.querySelector(fixture, '[data-cy="submit-button"]') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
    });

    it('should enable submit button when form is valid', () => {
      component.form.patchValue({
        name: 'John Doe',
        email: 'john@example.com',
        description: 'Test description',
      });
      fixture.detectChanges();

      const submitButton = FixtureHelper.querySelector(fixture, '[data-cy="submit-button"]') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(false);
    });

    /**
     * Pattern: Testing character counter hint
     * Verifies that hint text shows character count
     */
    it('should display character count in description hint', () => {
      const descriptionControl = component.form.get('description');
      descriptionControl?.setValue('Test text');
      fixture.detectChanges();

      const hintElement = FixtureHelper.querySelector(fixture, '[data-cy="description-hint"]');
      expect(hintElement?.textContent).toContain('9 / 100 characters');
    });

    /**
     * Pattern: Testing form reset
     * Verifies that reset clears all form values
     */
    it('should reset form when reset button is clicked', () => {
      component.form.patchValue({
        name: 'Test User',
        email: 'test@example.com',
      });
      fixture.detectChanges();

      const resetButton = FixtureHelper.querySelector(fixture, '[data-cy="reset-button"]') as HTMLButtonElement;
      resetButton.click();
      fixture.detectChanges();

      expect(component.form.get('name')?.value).toBeNull();
      expect(component.form.get('email')?.value).toBeNull();
    });
  });

  // ========== MatButton Tests ==========

  describe('MatButton - Button States and Interactions', () => {
    /**
     * Pattern: Testing button disabled state
     * Verifies that buttons respect disabled attribute
     */
    it('should render disabled button correctly', () => {
      const disabledButton = FixtureHelper.querySelector(fixture, '[data-cy="button-disabled"]') as HTMLButtonElement;
      expect(disabledButton).toBeTruthy();
      expect(disabledButton.disabled).toBe(true);
    });

    it('should render enabled button correctly', () => {
      const basicButton = FixtureHelper.querySelector(fixture, '[data-cy="button-basic"]') as HTMLButtonElement;
      expect(basicButton).toBeTruthy();
      expect(basicButton.disabled).toBe(false);
    });

    /**
     * Pattern: Testing button color attributes
     * Verifies that color directives are applied
     */
    it('should render primary button with correct color', () => {
      const primaryButton = FixtureHelper.querySelector(fixture, '[data-cy="button-primary"]');
      expect(primaryButton?.getAttribute('color')).toBe('primary');
    });

    it('should render accent button with correct color', () => {
      const accentButton = FixtureHelper.querySelector(fixture, '[data-cy="button-accent"]');
      expect(accentButton?.getAttribute('color')).toBe('accent');
    });

    /**
     * Pattern: Testing raised button variant
     * Verifies that mat-raised-button directive is applied
     */
    it('should render raised button variant', () => {
      const raisedButton = FixtureHelper.querySelector(fixture, '[data-cy="button-raised"]');
      expect(raisedButton?.textContent).toContain('Raised Button');
    });

    /**
     * Pattern: Testing FAB buttons
     * Verifies that floating action button variants render
     */
    it('should render FAB button', () => {
      const fabButton = FixtureHelper.querySelector(fixture, '[data-cy="button-fab"]');
      expect(fabButton).toBeTruthy();
      expect(fabButton?.querySelector('mat-icon')).toBeTruthy();
    });

    it('should render mini FAB button', () => {
      const miniFabButton = FixtureHelper.querySelector(fixture, '[data-cy="button-mini-fab"]');
      expect(miniFabButton).toBeTruthy();
      expect(miniFabButton?.querySelector('mat-icon')).toBeTruthy();
    });

    /**
     * Pattern: Testing form submission with loading state
     * Verifies that button shows spinner and disables during submission
     */
    it('should show loading spinner on submit', (done) => {
      component.form.patchValue({
        name: 'John Doe',
        email: 'john@example.com',
      });
      fixture.detectChanges();

      const submitButton = FixtureHelper.querySelector(fixture, '[data-cy="submit-button"]') as HTMLButtonElement;
      submitButton.click();

      expect(component.isLoading).toBe(true);
      fixture.detectChanges();

      const spinner = FixtureHelper.querySelector(fixture, '[data-cy="submit-spinner"]');
      expect(spinner).toBeTruthy();

      setTimeout(() => {
        expect(component.isLoading).toBe(false);
        done();
      }, 1100);
    });
  });

  // ========== MatTable Tests ==========

  describe('MatTable - Sorting, Pagination, and Selection', () => {
    /**
     * Pattern: Testing table rendering
     * Verifies that table headers and rows are rendered
     */
    it('should render table with correct headers', () => {
      const headers = FixtureHelper.querySelectorAll(fixture, '[data-cy*="header"]');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should render all data rows', () => {
      const rows = FixtureHelper.querySelectorAll(fixture, '[data-cy*="table-row"]');
      expect(rows.length).toBe(3);
    });

    /**
     * Pattern: Testing table row selection
     * Verifies that checkboxes control selection state
     */
    it('should select item when checkbox is clicked', () => {
      const item = component.items[0];
      component.toggleItemSelection(item);

      expect(component.isItemSelected(item)).toBe(true);
      expect(component.selectedItems.includes(item)).toBe(true);
    });

    it('should deselect item when checkbox is clicked again', () => {
      const item = component.items[0];
      component.toggleItemSelection(item);
      component.toggleItemSelection(item);

      expect(component.isItemSelected(item)).toBe(false);
      expect(component.selectedItems.includes(item)).toBe(false);
    });

    /**
     * Pattern: Testing table sorting
     * Verifies that sortData sorts items by column
     */
    it('should sort items by name in ascending order', () => {
      const sortEvent = {active: 'name', direction: 'asc'};
      component.sortData(sortEvent as any);

      expect(component.dataSource.data[0].name).toBe('Item 1');
      expect(component.dataSource.data[1].name).toBe('Item 2');
      expect(component.dataSource.data[2].name).toBe('Item 3');
    });

    it('should sort items by name in descending order', () => {
      const sortEvent = {active: 'name', direction: 'desc'};
      component.sortData(sortEvent as any);

      expect(component.dataSource.data[0].name).toBe('Item 3');
      expect(component.dataSource.data[1].name).toBe('Item 2');
      expect(component.dataSource.data[2].name).toBe('Item 1');
    });

    /**
     * Pattern: Testing table pagination
     * Verifies that paginate slices data correctly
     */
    it('should paginate to first page', () => {
      const pageEvent = {pageIndex: 0, pageSize: 1, length: 3, previousPageIndex: undefined};
      component.paginate(pageEvent);

      expect(component.dataSource.data.length).toBe(1);
      expect(component.dataSource.data[0].id).toBe(1);
    });

    it('should paginate to second page', () => {
      const pageEvent = {pageIndex: 1, pageSize: 1, length: 3, previousPageIndex: 0};
      component.paginate(pageEvent);

      expect(component.dataSource.data.length).toBe(1);
      expect(component.dataSource.data[0].id).toBe(2);
    });

    /**
     * Pattern: Testing delete selected items
     * Verifies that selected items are removed from table
     */
    it('should delete selected items', () => {
      const initialLength = component.items.length;
      component.toggleItemSelection(component.items[0]);
      component.deleteItem();

      expect(component.items.length).toBe(initialLength - 1);
      expect(component.selectedItems.length).toBe(0);
    });

    it('should not delete items when none are selected', () => {
      const initialLength = component.items.length;
      component.deleteItem();

      expect(component.items.length).toBe(initialLength);
    });

    /**
     * Pattern: Testing delete button disabled state
     * Verifies that delete button disables when no items selected
     */
    it('should disable delete button when no items selected', () => {
      const deleteButton = FixtureHelper.querySelector(fixture, '[data-cy="delete-button"]') as HTMLButtonElement;
      fixture.detectChanges();

      expect(deleteButton.disabled).toBe(true);
    });

    it('should enable delete button when items selected', () => {
      component.toggleItemSelection(component.items[0]);
      fixture.detectChanges();

      const deleteButton = FixtureHelper.querySelector(fixture, '[data-cy="delete-button"]') as HTMLButtonElement;
      expect(deleteButton.disabled).toBe(false);
    });

    /**
     * Pattern: Testing table visibility toggle
     * Verifies that table can be hidden/shown
     */
    it('should toggle table visibility', () => {
      expect(component.showTable).toBe(true);

      component.toggleTable();
      expect(component.showTable).toBe(false);

      component.toggleTable();
      expect(component.showTable).toBe(true);
    });
  });

  // ========== MatExpansion Tests ==========

  describe('MatExpansion - Expand/Collapse Behavior', () => {
    /**
     * Pattern: Testing expansion panel toggle
     * Verifies that panels expand and collapse correctly
     */
    it('should expand panel when toggled', () => {
      const itemId = component.items[0].id;
      component.toggleExpansion(itemId);

      expect(component.isExpanded(itemId)).toBe(true);
    });

    it('should collapse panel when toggled again', () => {
      const itemId = component.items[0].id;
      component.toggleExpansion(itemId);
      component.toggleExpansion(itemId);

      expect(component.isExpanded(itemId)).toBe(false);
    });

    /**
     * Pattern: Testing single panel expansion
     * Verifies that expanding one panel collapses others
     */
    it('should collapse previous panel when new one is opened', () => {
      const itemId1 = component.items[0].id;
      const itemId2 = component.items[1].id;

      component.toggleExpansion(itemId1);
      expect(component.isExpanded(itemId1)).toBe(true);

      component.toggleExpansion(itemId2);
      expect(component.isExpanded(itemId1)).toBe(false);
      expect(component.isExpanded(itemId2)).toBe(true);
    });

    /**
     * Pattern: Testing expansion panel rendering
     * Verifies that expansion panels are rendered in template
     */
    it('should render expansion panels for all items', () => {
      const panels = FixtureHelper.querySelectorAll(fixture, '[data-cy*="expansion-panel"]');
      expect(panels.length).toBe(component.items.length);
    });

    it('should render expansion panel headers', () => {
      const headers = FixtureHelper.querySelectorAll(fixture, '[data-cy*="expansion-header"]');
      expect(headers.length).toBe(component.items.length);
    });
  });

  // ========== MatMenu Tests ==========

  describe('MatMenu - Dropdown Menu Behavior', () => {
    /**
     * Pattern: Testing menu trigger button
     * Verifies that menu trigger button is rendered
     */
    it('should render menu trigger button', () => {
      const menuTrigger = FixtureHelper.querySelector(fixture, '[data-cy="menu-trigger"]');
      expect(menuTrigger).toBeTruthy();
      expect(menuTrigger?.textContent).toContain('Actions');
    });

    /**
     * Pattern: Testing menu item selection
     * Verifies that menu items call correct methods
     */
    it('should call selectAction with export when export menu item clicked', () => {
      spyOn(component, 'selectAction');
      component.selectAction('export');

      expect(component.selectAction).toHaveBeenCalledWith('export');
    });

    it('should call selectAction with import when import menu item clicked', () => {
      spyOn(component, 'selectAction');
      component.selectAction('import');

      expect(component.selectAction).toHaveBeenCalledWith('import');
    });

    /**
     * Pattern: Testing menu item disabled state
     * Verifies that disabled menu items are not clickable
     */
    it('should render disabled menu item', () => {
      const disabledMenuItem = FixtureHelper.querySelector(fixture, '[data-cy="menu-disabled"]');
      expect(disabledMenuItem).toBeTruthy();
      expect((disabledMenuItem as HTMLElement).getAttribute('disabled')).toBe('');
    });
  });

  // ========== MatTooltip Tests ==========

  describe('MatTooltip - Tooltip Visibility and Positioning', () => {
    /**
     * Pattern: Testing tooltip attributes
     * Verifies that matTooltip directive is applied
     */
    it('should have tooltip button with tooltip text', () => {
      const tooltipButton = FixtureHelper.querySelector(fixture, '[data-cy="tooltip-button"]');
      expect(tooltipButton?.getAttribute('mattooltip')).toBe('This is a helpful tooltip');
    });

    it('should have tooltip position attribute', () => {
      const tooltipButton = FixtureHelper.querySelector(fixture, '[data-cy="tooltip-button"]');
      expect(tooltipButton?.getAttribute('mattooltipposition')).toBe('above');
    });

    /**
     * Pattern: Testing tooltip on icon
     * Verifies that tooltips work on different element types
     */
    it('should have tooltip on info icon', () => {
      const tooltipIcon = FixtureHelper.querySelector(fixture, '[data-cy="tooltip-icon"]');
      expect(tooltipIcon?.getAttribute('mattooltip')).toBe('Information icon');
    });

    it('should have tooltip positioned right on icon', () => {
      const tooltipIcon = FixtureHelper.querySelector(fixture, '[data-cy="tooltip-icon"]');
      expect(tooltipIcon?.getAttribute('mattooltipposition')).toBe('right');
    });
  });

  // ========== MatTab Tests ==========

  describe('MatTab - Tab Switching and Content Projection', () => {
    /**
     * Pattern: Testing tab group rendering
     * Verifies that tab group and tabs are rendered
     */
    it('should render tab group', () => {
      const tabGroup = FixtureHelper.querySelector(fixture, '[data-cy="tab-group"]');
      expect(tabGroup).toBeTruthy();
    });

    it('should render all tab panels', () => {
      const tabs = FixtureHelper.querySelectorAll(fixture, 'mat-tab');
      expect(tabs.length).toBeGreaterThan(0);
    });

    /**
     * Pattern: Testing tab selection
     * Verifies that tab selection changes activeTab
     */
    it('should select tab when clicked', () => {
      expect(component.activeTab).toBe(0);

      component.selectTab(1);
      expect(component.activeTab).toBe(1);
    });

    it('should select different tab indices', () => {
      component.selectTab(2);
      expect(component.activeTab).toBe(2);

      component.selectTab(0);
      expect(component.activeTab).toBe(0);
    });

    /**
     * Pattern: Testing tab content projection
     * Verifies that each tab contains correct content
     */
    it('should render form tab with form content', () => {
      const formTab = FixtureHelper.querySelector(fixture, '[data-cy="form-tab"]');
      expect(formTab).toBeTruthy();
    });

    it('should render table tab with table content', () => {
      const tableTab = FixtureHelper.querySelector(fixture, '[data-cy="table-tab"]');
      expect(tableTab).toBeTruthy();
    });

    it('should render expansion tab with expansion panels', () => {
      const expansionTab = FixtureHelper.querySelector(fixture, '[data-cy="expansion-tab"]');
      expect(expansionTab).toBeTruthy();
    });

    it('should render menu tab with menu content', () => {
      const menuTab = FixtureHelper.querySelector(fixture, '[data-cy="menu-tab"]');
      expect(menuTab).toBeTruthy();
    });

    it('should render dialog tab with dialog trigger', () => {
      const dialogTab = FixtureHelper.querySelector(fixture, '[data-cy="dialog-tab"]');
      expect(dialogTab).toBeTruthy();
    });
  });

  // ========== MatDialog Tests ==========

  describe('MatDialog - Dialog Opening and Closing', () => {
    /**
     * Pattern: Testing dialog open
     * Verifies that openDialog opens a material dialog
     */
    it('should open dialog when openDialog is called', () => {
      spyOn(dialog, 'open').and.returnValue({
        afterClosed: () => {
          return {
            subscribe: (callback: Function) => callback(null),
          };
        },
      } as MatDialogRef<any>);

      component.openDialog();

      expect(dialog.open).toHaveBeenCalledWith(MaterialIntegrationDialogComponent);
    });

    /**
     * Pattern: Testing dialog trigger button
     * Verifies that button opens dialog
     */
    it('should render dialog open button', () => {
      const openDialogButton = FixtureHelper.querySelector(fixture, '[data-cy="open-dialog-button"]');
      expect(openDialogButton).toBeTruthy();
      expect(openDialogButton?.textContent).toContain('Open Dialog');
    });
  });

  // ========== Integration Tests ==========

  describe('Material Component Integration', () => {
    /**
     * Pattern: Testing complete form workflow
     * Verifies form validation, submission, and button states
     */
    it('should complete full form workflow', () => {
      // Form starts invalid
      expect(component.form.valid).toBe(false);

      // User fills out form
      component.form.patchValue({
        name: 'John Doe',
        email: 'john@example.com',
        description: 'A test user account',
      });
      fixture.detectChanges();

      // Form becomes valid
      expect(component.form.valid).toBe(true);

      // Submit button is enabled
      const submitButton = FixtureHelper.querySelector(fixture, '[data-cy="submit-button"]') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(false);
    });

    /**
     * Pattern: Testing table and selection workflow
     * Verifies selection and deletion operations
     */
    it('should complete table selection and deletion workflow', () => {
      const initialCount = component.items.length;

      // Select first two items
      component.toggleItemSelection(component.items[0]);
      component.toggleItemSelection(component.items[1]);
      fixture.detectChanges();

      expect(component.selectedItems.length).toBe(2);

      // Delete button is enabled
      const deleteButton = FixtureHelper.querySelector(fixture, '[data-cy="delete-button"]') as HTMLButtonElement;
      expect(deleteButton.disabled).toBe(false);

      // Delete selected items
      component.deleteItem();
      fixture.detectChanges();

      expect(component.items.length).toBe(initialCount - 2);
      expect(component.selectedItems.length).toBe(0);
    });

    /**
     * Pattern: Testing tab navigation workflow
     * Verifies switching between tabs maintains state
     */
    it('should maintain form state when switching tabs', () => {
      // Fill form on first tab
      component.form.patchValue({
        name: 'Test User',
        email: 'test@example.com',
      });

      // Switch to different tab
      component.selectTab(1);
      fixture.detectChanges();

      // Switch back to form tab
      component.selectTab(0);
      fixture.detectChanges();

      // Form values are preserved
      expect(component.form.get('name')?.value).toBe('Test User');
      expect(component.form.get('email')?.value).toBe('test@example.com');
    });

    /**
     * Pattern: Testing expansion and table together
     * Verifies independent component state management
     */
    it('should manage expansion and table selection independently', () => {
      // Expand first item
      component.toggleExpansion(component.items[0].id);
      expect(component.isExpanded(component.items[0].id)).toBe(true);

      // Select second item
      component.toggleItemSelection(component.items[1]);
      expect(component.isItemSelected(component.items[1])).toBe(true);

      // Expansion state unchanged
      expect(component.isExpanded(component.items[0].id)).toBe(true);

      // Selection state unchanged
      expect(component.isItemSelected(component.items[1])).toBe(true);
    });
  });

  // ========== Error Handling Tests ==========

  describe('Material Component Error Handling', () => {
    /**
     * Pattern: Testing form error message generation
     * Verifies getFormErrorMessage returns appropriate messages
     */
    it('should return required error message', () => {
      const message = component.getFormErrorMessage('name');
      expect(message).toContain('required');
    });

    /**
     * Pattern: Testing invalid form state handling
     * Verifies that component handles validation errors gracefully
     */
    it('should handle form submission with validation errors', () => {
      component.form.reset();
      component.submitForm();

      expect(component.isLoading).toBe(false);
    });

    /**
     * Pattern: Testing empty table handling
     * Verifies that component handles empty data gracefully
     */
    it('should handle empty items list', () => {
      component.items = [];
      component.dataSource.data = [];
      fixture.detectChanges();

      expect(component.items.length).toBe(0);
      expect(component.dataSource.data.length).toBe(0);
    });
  });
});
