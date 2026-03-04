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
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '@shared/module';
import {FormExampleComponent} from './form-component.component';

/**
 * Example Test: Component with Reactive Form
 *
 * This test demonstrates how to test a component that:
 * - Initializes a reactive form with FormBuilder
 * - Validates form inputs (required, pattern, custom validators)
 * - Handles form submission
 * - Displays error messages based on validation state
 *
 * Key Testing Patterns:
 * - Testing form initialization and default values
 * - Testing form validation (required validators, pattern validators)
 * - Testing form submission and data handling
 * - Testing error message display
 * - Testing form state changes (touched, dirty, valid)
 */
describe('FormExampleComponent', () => {
  let fixture: ComponentFixture<FormExampleComponent>;
  let component: FormExampleComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, ReactiveFormsModule],
      declarations: [FormExampleComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormExampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ========== Form Initialization Tests ==========

  /**
   * Pattern: Testing form initialization
   * Verifies that the form is created with correct controls and default values
   */
  it('should initialize form with all required controls', () => {
    expect(component.form).toBeDefined();
    expect(component.form.get('username')).toBeDefined();
    expect(component.form.get('email')).toBeDefined();
    expect(component.form.get('age')).toBeDefined();
  });

  it('should set default values for form controls', () => {
    expect(component.form.get('username')?.value).toBe('');
    expect(component.form.get('email')?.value).toBe('');
    expect(component.form.get('age')?.value).toBe(null);
  });

  // ========== Validation Tests ==========

  /**
   * Pattern: Testing required validator
   * Verifies that required fields are marked as invalid when empty
   */
  it('should mark username as invalid when empty', () => {
    const usernameControl = component.form.get('username');
    usernameControl?.setValue('');
    usernameControl?.markAsTouched();

    expect(usernameControl?.hasError('required')).toBe(true);
    expect(usernameControl?.invalid).toBe(true);
  });

  it('should mark username as valid when filled', () => {
    const usernameControl = component.form.get('username');
    usernameControl?.setValue('testuser');

    expect(usernameControl?.hasError('required')).toBe(false);
    expect(usernameControl?.valid).toBe(true);
  });

  /**
   * Pattern: Testing pattern validator
   * Verifies that email field validates email format
   */
  it('should mark email as invalid with incorrect format', () => {
    const emailControl = component.form.get('email');
    emailControl?.setValue('invalid-email');

    expect(emailControl?.hasError('email')).toBe(true);
    expect(emailControl?.invalid).toBe(true);
  });

  it('should mark email as valid with correct format', () => {
    const emailControl = component.form.get('email');
    emailControl?.setValue('test@example.com');

    expect(emailControl?.hasError('email')).toBe(false);
    expect(emailControl?.valid).toBe(true);
  });

  /**
   * Pattern: Testing custom validator
   * Verifies that age field validates age range (18-120)
   */
  it('should mark age as invalid when below minimum', () => {
    const ageControl = component.form.get('age');
    ageControl?.setValue(10);

    expect(ageControl?.hasError('ageRange')).toBe(true);
    expect(ageControl?.invalid).toBe(true);
  });

  it('should mark age as invalid when above maximum', () => {
    const ageControl = component.form.get('age');
    ageControl?.setValue(150);

    expect(ageControl?.hasError('ageRange')).toBe(true);
    expect(ageControl?.invalid).toBe(true);
  });

  it('should mark age as valid within range', () => {
    const ageControl = component.form.get('age');
    ageControl?.setValue(25);

    expect(ageControl?.hasError('ageRange')).toBe(false);
    expect(ageControl?.valid).toBe(true);
  });

  // ========== Form State Tests ==========

  /**
   * Pattern: Testing form state properties
   * Verifies that form tracks touched, dirty, and valid states correctly
   */
  it('should track touched state when control is accessed', () => {
    const usernameControl = component.form.get('username');
    expect(usernameControl?.touched).toBe(false);

    usernameControl?.markAsTouched();
    expect(usernameControl?.touched).toBe(true);
  });

  it('should track dirty state when control is modified', () => {
    const usernameControl = component.form.get('username');
    expect(usernameControl?.dirty).toBe(false);

    usernameControl?.setValue('changed');
    expect(usernameControl?.dirty).toBe(true);
  });

  it('should mark form as invalid when any control is invalid', () => {
    component.form.get('username')?.setValue('');
    component.form.get('email')?.setValue('valid@example.com');
    component.form.get('age')?.setValue(25);

    expect(component.form.valid).toBe(false);
  });

  it('should mark form as valid when all controls are valid', () => {
    component.form.get('username')?.setValue('testuser');
    component.form.get('email')?.setValue('test@example.com');
    component.form.get('age')?.setValue(25);

    expect(component.form.valid).toBe(true);
  });

  // ========== Form Submission Tests ==========

  /**
   * Pattern: Testing form submission
   * Verifies that form data is correctly processed on submission
   */
  it('should not submit invalid form', () => {
    spyOn(component, 'onSubmit');

    // Set invalid data
    component.form.get('username')?.setValue('');
    component.form.get('email')?.setValue('invalid');
    fixture.detectChanges();

    // Try to submit
    const submitButton = fixture.nativeElement.querySelector('[data-cy="submit-button"]');
    submitButton.click();

    // Submission should not have occurred
    expect(component.onSubmit).not.toHaveBeenCalled();
  });

  it('should submit valid form and reset', () => {
    spyOn(component, 'onSubmit').and.callThrough();

    // Set valid data
    component.form.get('username')?.setValue('testuser');
    component.form.get('email')?.setValue('test@example.com');
    component.form.get('age')?.setValue(25);
    fixture.detectChanges();

    // Submit form
    const submitButton = fixture.nativeElement.querySelector('[data-cy="submit-button"]');
    submitButton.click();

    // Verify submission occurred
    expect(component.onSubmit).toHaveBeenCalled();

    // Verify form was reset
    expect(component.form.get('username')?.value).toBe('');
  });

  // ========== Error Message Display Tests ==========

  /**
   * Pattern: Testing error message display
   * Verifies that error messages appear only when appropriate
   */
  it('should display required error for username when touched and empty', () => {
    const usernameControl = component.form.get('username');
    usernameControl?.markAsTouched();
    fixture.detectChanges();

    const errorMessage = fixture.nativeElement.querySelector('[data-cy="username-error"]');
    expect(errorMessage?.textContent).toContain('Username is required');
  });

  it('should not display error message when control is untouched', () => {
    const usernameControl = component.form.get('username');
    usernameControl?.setValue('');
    // Don't mark as touched
    fixture.detectChanges();

    const errorMessage = fixture.nativeElement.querySelector('[data-cy="username-error"]');
    expect(errorMessage).toBeFalsy();
  });

  it('should display email format error when invalid', () => {
    const emailControl = component.form.get('email');
    emailControl?.setValue('invalid-email');
    emailControl?.markAsTouched();
    fixture.detectChanges();

    const errorMessage = fixture.nativeElement.querySelector('[data-cy="email-error"]');
    expect(errorMessage?.textContent).toContain('Please enter a valid email');
  });

  it('should hide error message when control becomes valid', () => {
    const emailControl = component.form.get('email');
    emailControl?.setValue('invalid');
    emailControl?.markAsTouched();
    fixture.detectChanges();

    let errorMessage = fixture.nativeElement.querySelector('[data-cy="email-error"]');
    expect(errorMessage).toBeTruthy();

    // Fix the value
    emailControl?.setValue('valid@example.com');
    fixture.detectChanges();

    errorMessage = fixture.nativeElement.querySelector('[data-cy="email-error"]');
    expect(errorMessage).toBeFalsy();
  });

  // ========== Integration Tests ==========

  /**
   * Pattern: Integration test for complete form flow
   * Tests form initialization, validation, and submission together
   */
  it('should handle complete form workflow', () => {
    spyOn(component, 'onSubmit').and.callThrough();

    // Initial state - form should be invalid
    expect(component.form.valid).toBe(false);

    // User fills in the form
    component.form.get('username')?.setValue('john_doe');
    component.form.get('email')?.setValue('john@example.com');
    component.form.get('age')?.setValue(30);
    fixture.detectChanges();

    // Form should now be valid
    expect(component.form.valid).toBe(true);

    // User submits
    const submitButton = fixture.nativeElement.querySelector('[data-cy="submit-button"]');
    submitButton.click();

    // Verify submission
    expect(component.onSubmit).toHaveBeenCalled();

    // Form should be reset
    expect(component.form.get('username')?.value).toBe('');
  });
});
