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

import {AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators} from '@angular/forms';

/**
 * Helper class for simplifying reactive form testing in Angular components.
 *
 * Provides utility methods to create common form configurations, manipulate form state,
 * and verify form control values without verbose boilerplate code.
 *
 * @example
 * ```typescript
 * // Create form with common validators
 * const form = FormBuilderHelper.createFormWithValidation({
 *   username: ['', [Validators.required]],
 *   email: ['', [Validators.required, Validators.email]]
 * });
 *
 * // Update control value
 * FormBuilderHelper.setControlValue(form, 'username', 'john_doe');
 *
 * // Mark form as touched for validation display testing
 * FormBuilderHelper.markAsTouched(form);
 *
 * // Get control value with type safety
 * const username = FormBuilderHelper.getControlValue<string>(form, 'username');
 * ```
 */
export class FormBuilderHelper {
  private static readonly _formBuilder = new FormBuilder();

  /**
   * Creates a FormGroup with specified controls and validators.
   *
   * Simplifies form creation for test setup. Combines FormBuilder functionality
   * with configuration object syntax.
   *
   * @param {Object} config - Configuration object mapping control names to [value, validators]
   * @returns {FormGroup} Configured form group ready for testing
   *
   * @example
   * ```typescript
   * const form = FormBuilderHelper.createFormWithValidation({
   *   username: ['', [Validators.required, Validators.minLength(3)]],
   *   email: ['test@example.com', [Validators.required, Validators.email]],
   *   age: [null, [Validators.required]]
   * });
   *
   * expect(form.get('username')?.value).toBe('');
   * expect(form.get('email')?.value).toBe('test@example.com');
   * ```
   */
  static createFormWithValidation(config: {[key: string]: [any, ValidatorFn | ValidatorFn[]]}): FormGroup {
    const formConfig: {[key: string]: any} = {};
    Object.entries(config).forEach(([key, [value, validators]]) => {
      formConfig[key] = [value, validators];
    });
    return this._formBuilder.group(formConfig);
  }

  /**
   * Sets value of a form control and optionally marks it as touched.
   *
   * Simulates user interaction: value change via user input and touching the control
   * (typically happens when user leaves the field).
   *
   * @param {FormGroup} form - Form group containing the control
   * @param {string} controlName - Name of control to update
   * @param {any} value - New value to set
   * @param {boolean} [markTouched=false] - Whether to mark control as touched (shows validation errors)
   *
   * @example
   * ```typescript
   * FormBuilderHelper.setControlValue(form, 'username', 'john_doe');
   * FormBuilderHelper.setControlValue(form, 'email', 'john@example.com', true); // Also mark touched
   *
   * expect(form.get('username')?.value).toBe('john_doe');
   * expect(form.get('email')?.touched).toBe(true);
   * ```
   */
  static setControlValue(form: FormGroup, controlName: string, value: any, markTouched: boolean = false): void {
    const control = form.get(controlName);
    if (control) {
      control.setValue(value);
      if (markTouched) {
        control.markAsTouched();
      }
    }
  }

  /**
   * Gets the value of a form control with optional type casting.
   *
   * Provides type-safe access to control values without casting at each usage site.
   *
   * @template T - Expected type of control value
   * @param {FormGroup} form - Form group containing the control
   * @param {string} controlName - Name of control to retrieve
   * @returns {T | null} Control value with specified type, or null if control not found
   *
   * @example
   * ```typescript
   * FormBuilderHelper.setControlValue(form, 'username', 'john_doe');
   * const username = FormBuilderHelper.getControlValue<string>(form, 'username');
   * expect(username).toBe('john_doe');
   *
   * const age = FormBuilderHelper.getControlValue<number>(form, 'age') ?? 0;
   * expect(typeof age).toBe('number');
   * ```
   */
  static getControlValue<T>(form: FormGroup, controlName: string): T | null {
    const control = form.get(controlName);
    return control ? (control.value as T) : null;
  }

  /**
   * Marks a form control as touched (simulates blur event).
   *
   * Required to display validation error messages, as most Angular apps
   * only show errors for touched/dirty fields to avoid early validation feedback.
   *
   * @param {FormGroup} form - Form group containing the control
   * @param {string} controlName - Name of control to mark as touched
   *
   * @example
   * ```typescript
   * FormBuilderHelper.setControlValue(form, 'email', 'invalid');
   * expect(form.get('email')?.touched).toBe(false); // Not touched yet
   *
   * FormBuilderHelper.markControlAsTouched(form, 'email');
   * expect(form.get('email')?.touched).toBe(true); // Now shows errors
   * expect(form.get('email')?.hasError('email')).toBe(true);
   * ```
   */
  static markControlAsTouched(form: FormGroup, controlName: string): void {
    const control = form.get(controlName);
    if (control) {
      control.markAsTouched();
    }
  }

  /**
   * Marks all controls in a form as touched.
   *
   * Useful for testing validation display after form submission or initial validation check.
   * Simulates user attempting to submit form.
   *
   * @param {FormGroup} form - Form group to mark as touched
   *
   * @example
   * ```typescript
   * // Set invalid values
   * FormBuilderHelper.setControlValue(form, 'email', 'invalid');
   * FormBuilderHelper.setControlValue(form, 'username', '');
   *
   * // Mark all as touched (like user submitting empty form)
   * FormBuilderHelper.markAsTouched(form);
   *
   * // Now all errors should display
   * expect(form.get('email')?.touched).toBe(true);
   * expect(form.get('username')?.touched).toBe(true);
   * expect(form.invalid).toBe(true);
   * ```
   */
  static markAsTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsTouched();
    });
  }

  /**
   * Marks all controls in a form as dirty.
   *
   * Simulates user interaction by marking all controls as modified (setValue not good enough).
   * Some forms only enable submit when dirty to detect actual user changes.
   *
   * @param {FormGroup} form - Form group to mark as dirty
   *
   * @example
   * ```typescript
   * FormBuilderHelper.markAsDirty(form);
   *
   * expect(form.dirty).toBe(true);
   * expect(form.pristine).toBe(false);
   * ```
   */
  static markAsDirty(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsDirty();
    });
  }

  /**
   * Resets form to initial state (untouched, pristine, cleared values).
   *
   * Simulates form reset after successful submission or explicit reset action.
   *
   * @param {FormGroup} form - Form group to reset
   * @param {Object} [values] - Optional object with new values after reset
   *
   * @example
   * ```typescript
   * FormBuilderHelper.setControlValue(form, 'username', 'john_doe');
   * FormBuilderHelper.markAsDirty(form);
   * expect(form.dirty).toBe(true);
   *
   * FormBuilderHelper.reset(form);
   * expect(form.get('username')?.value).toBeNull();
   * expect(form.dirty).toBe(false);
   * expect(form.touched).toBe(false);
   * ```
   */
  static reset(form: FormGroup, values?: {[key: string]: any}): void {
    form.reset(values);
  }

  /**
   * Verifies that a control is in expected state.
   *
   * Helper to reduce verbosity in assertions about form control state.
   *
   * @param {AbstractControl} control - Control to verify
   * @param {Object} expectedState - Object with expected properties: valid, dirty, touched, etc.
   * @returns {boolean} True if all expectedState properties match control's actual state
   *
   * @example
   * ```typescript
   * const username = form.get('username');
   * FormBuilderHelper.setControlValue(form, 'username', 'john', true);
   *
   * const isValid = FormBuilderHelper.verifyControlState(username!, {
   *   valid: true,
   *   touched: true,
   *   dirty: true
   * });
   * expect(isValid).toBe(true);
   * ```
   */
  static verifyControlState(
    control: AbstractControl,
    expectedState: {valid?: boolean; invalid?: boolean; touched?: boolean; dirty?: boolean}
  ): boolean {
    return Object.entries(expectedState).every(([key, value]) => {
      return (control as any)[key] === value;
    });
  }

  /**
   * Gets all errors from a form or specific control.
   *
   * Useful for testing that correct validation errors appear for invalid controls.
   *
   * @param {FormGroup | AbstractControl} formOrControl - Form or control to get errors from
   * @returns {Object} Object mapping error names to true, or null if no errors
   *
   * @example
   * ```typescript
   * FormBuilderHelper.setControlValue(form, 'email', 'invalid');
   * const errors = FormBuilderHelper.getErrors(form.get('email')!);
   * expect(errors?.['email']).toBe(true);
   * ```
   */
  static getErrors(formOrControl: FormGroup | AbstractControl): {[key: string]: boolean} | null {
    return formOrControl.errors;
  }

  /**
   * Enables or disables a form control.
   *
   * Useful for testing conditional enable/disable logic based on other control values
   * or application state.
   *
   * @param {FormGroup} form - Form group containing the control
   * @param {string} controlName - Name of control to enable/disable
   * @param {boolean} enabled - True to enable, false to disable
   *
   * @example
   * ```typescript
   * FormBuilderHelper.setControlValue(form, 'agreeToTerms', false);
   * FormBuilderHelper.setControlEnabled(form, 'submitButton', false);
   *
   * expect(form.get('submitButton')?.enabled).toBe(false);
   *
   * FormBuilderHelper.setControlValue(form, 'agreeToTerms', true);
   * FormBuilderHelper.setControlEnabled(form, 'submitButton', true);
   * expect(form.get('submitButton')?.enabled).toBe(true);
   * ```
   */
  static setControlEnabled(form: FormGroup, controlName: string, enabled: boolean): void {
    const control = form.get(controlName);
    if (control) {
      if (enabled) {
        control.enable();
      } else {
        control.disable();
      }
    }
  }
}
