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
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '@shared/module';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {DialogContentComponent} from './dialog-content.component';

/**
 * Example Test: Material Dialog Component
 *
 * This test demonstrates how to test a component that:
 * - Uses MatDialogRef for dialog control
 * - Injects data via MAT_DIALOG_DATA
 * - Closes the dialog with return data
 * - Handles button interactions within the dialog
 *
 * Key Testing Patterns:
 * - Testing MAT_DIALOG_DATA injection
 * - Testing dialog close operations
 * - Mocking MatDialogRef and its methods
 * - Testing button interactions that trigger dialog close
 * - Verifying data returned from dialog
 */
describe('DialogContentComponent', () => {
  let fixture: ComponentFixture<DialogContentComponent>;
  let component: DialogContentComponent;
  let dialogRef: MatDialogRefMock;

  const mockDialogData = {
    title: 'Test Dialog',
    message: 'This is a test message',
    userId: 123,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [DialogContentComponent],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: mockDialogData},
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogContentComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as any;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ========== MAT_DIALOG_DATA Injection Tests ==========

  /**
   * Pattern: Testing MAT_DIALOG_DATA injection
   * Verifies that data passed to dialog is correctly injected into component
   */
  it('should receive dialog data via MAT_DIALOG_DATA', () => {
    expect(component.data).toBeDefined();
    expect(component.data.title).toBe('Test Dialog');
    expect(component.data.message).toBe('This is a test message');
    expect(component.data.userId).toBe(123);
  });

  it('should display injected data in template', () => {
    const titleElement = fixture.nativeElement.querySelector('[data-cy="dialog-title"]');
    const messageElement = fixture.nativeElement.querySelector('[data-cy="dialog-message"]');

    expect(titleElement?.textContent).toContain('Test Dialog');
    expect(messageElement?.textContent).toContain('This is a test message');
  });

  it('should handle undefined dialog data gracefully', () => {
    // Reconfigure with undefined data
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [DialogContentComponent],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: undefined},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.data).toBeUndefined();
  });

  // ========== Dialog Close Tests ==========

  /**
   * Pattern: Testing dialog close with data
   * Verifies that dialog closes correctly and returns data to parent
   */
  it('should close dialog with confirm data when confirm button clicked', () => {
    spyOn(dialogRef, 'close');

    fixture.detectChanges();

    const confirmButton = fixture.nativeElement.querySelector('[data-cy="confirm-button"]');
    confirmButton.click();

    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('should return correct data on confirm', () => {
    spyOn(dialogRef, 'close');

    component.confirmAction();

    expect(dialogRef.close).toHaveBeenCalledWith({
      confirmed: true,
      userId: mockDialogData.userId,
    });
  });

  it('should close dialog on cancel without returning data', () => {
    spyOn(dialogRef, 'close');

    fixture.detectChanges();

    const cancelButton = fixture.nativeElement.querySelector('[data-cy="cancel-button"]');
    cancelButton.click();

    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });

  it('should close dialog when close method is called', () => {
    spyOn(dialogRef, 'close');

    component.closeDialog();

    expect(dialogRef.close).toHaveBeenCalled();
  });

  // ========== Button Interaction Tests ==========

  /**
   * Pattern: Testing button interactions within dialog
   * Verifies that dialog buttons trigger correct actions
   */
  it('should have confirm button enabled by default', () => {
    const confirmButton = fixture.nativeElement.querySelector('[data-cy="confirm-button"]');
    expect(confirmButton.disabled).toBe(false);
  });

  it('should have cancel button always enabled', () => {
    const cancelButton = fixture.nativeElement.querySelector('[data-cy="cancel-button"]');
    expect(cancelButton.disabled).toBe(false);
  });

  it('should disable confirm button when form is invalid', () => {
    component.isFormValid = false;
    fixture.detectChanges();

    const confirmButton = fixture.nativeElement.querySelector('[data-cy="confirm-button"]');
    expect(confirmButton.disabled).toBe(true);
  });

  it('should enable confirm button when form is valid', () => {
    component.isFormValid = true;
    fixture.detectChanges();

    const confirmButton = fixture.nativeElement.querySelector('[data-cy="confirm-button"]');
    expect(confirmButton.disabled).toBe(false);
  });

  /**
   * Pattern: Testing conditional button display
   * Verifies that buttons are shown/hidden based on dialog state
   */
  it('should show delete button only in delete mode', () => {
    component.mode = 'delete';
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector('[data-cy="delete-button"]');
    expect(deleteButton).toBeTruthy();
  });

  it('should hide delete button in edit mode', () => {
    component.mode = 'edit';
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector('[data-cy="delete-button"]');
    expect(deleteButton).toBeFalsy();
  });

  // ========== Dialog Action Tests ==========

  /**
   * Pattern: Testing complex dialog actions
   * Verifies that dialog handles multiple user interactions correctly
   */
  it('should handle edit dialog workflow', () => {
    spyOn(dialogRef, 'close');

    component.mode = 'edit';
    fixture.detectChanges();

    // User edits form
    component.formData = {name: 'Updated Name'};

    // User confirms
    component.confirmAction();

    expect(dialogRef.close).toHaveBeenCalledWith({
      confirmed: true,
      userId: mockDialogData.userId,
    });
  });

  it('should handle delete dialog workflow', () => {
    spyOn(dialogRef, 'close');

    component.mode = 'delete';
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector('[data-cy="delete-button"]');
    deleteButton.click();

    expect(dialogRef.close).toHaveBeenCalledWith({
      confirmed: true,
      action: 'delete',
      userId: mockDialogData.userId,
    });
  });

  // ========== Error Handling Tests ==========

  /**
   * Pattern: Testing error states in dialog
   * Verifies that dialog handles and displays errors correctly
   */
  it('should display error message when present', () => {
    component.error = 'An error occurred';
    fixture.detectChanges();

    const errorElement = fixture.nativeElement.querySelector('[data-cy="dialog-error"]');
    expect(errorElement).toBeTruthy();
    expect(errorElement?.textContent).toContain('An error occurred');
  });

  it('should clear error message', () => {
    component.error = 'An error occurred';
    fixture.detectChanges();

    let errorElement = fixture.nativeElement.querySelector('[data-cy="dialog-error"]');
    expect(errorElement).toBeTruthy();

    component.error = null;
    fixture.detectChanges();

    errorElement = fixture.nativeElement.querySelector('[data-cy="dialog-error"]');
    expect(errorElement).toBeFalsy();
  });

  it('should disable confirm button when error exists', () => {
    component.error = 'Cannot proceed';
    fixture.detectChanges();

    const confirmButton = fixture.nativeElement.querySelector('[data-cy="confirm-button"]');
    expect(confirmButton.disabled).toBe(true);
  });

  // ========== Template Structure Tests ==========

  /**
   * Pattern: Testing dialog structure and layout
   * Verifies that dialog contains required elements
   */
  it('should have dialog header', () => {
    const header = fixture.nativeElement.querySelector('[data-cy="dialog-header"]');
    expect(header).toBeTruthy();
  });

  it('should have dialog content area', () => {
    const content = fixture.nativeElement.querySelector('[data-cy="dialog-content"]');
    expect(content).toBeTruthy();
  });

  it('should have dialog actions footer', () => {
    const footer = fixture.nativeElement.querySelector('[data-cy="dialog-footer"]');
    expect(footer).toBeTruthy();
  });

  // ========== Integration Tests ==========

  /**
   * Pattern: Integration test for complete dialog workflow
   * Tests entire lifecycle from data injection through close
   */
  it('should complete full dialog lifecycle', () => {
    spyOn(dialogRef, 'close');

    // Verify data was injected
    expect(component.data.title).toBe('Test Dialog');

    // User interacts with dialog
    component.formData = {input: 'test value'};
    fixture.detectChanges();

    // User confirms
    component.confirmAction();

    // Verify dialog closed with correct data
    expect(dialogRef.close).toHaveBeenCalledWith({
      confirmed: true,
      userId: mockDialogData.userId,
    });
  });

  it('should handle complete cancel workflow', () => {
    spyOn(dialogRef, 'close');

    // User enters data
    component.formData = {input: 'test value'};

    // User cancels
    const cancelButton = fixture.nativeElement.querySelector('[data-cy="cancel-button"]');
    cancelButton.click();

    // Dialog should close without data
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });
});
