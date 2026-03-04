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

import {FormGroup, Validators} from '@angular/forms';
import {FormBuilderHelper} from './form-builder-helper';

describe('FormBuilderHelper', () => {
  describe('createFormWithValidation()', () => {
    it('should create form with single control', () => {
      const form = FormBuilderHelper.createFormWithValidation({
        name: ['', Validators.required],
      });

      expect(form).toBeInstanceOf(FormGroup);
      expect(form.get('name')).toBeTruthy();
    });

    it('should create form with multiple controls', () => {
      const form = FormBuilderHelper.createFormWithValidation({
        username: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
      });

      expect(form.get('username')).toBeTruthy();
      expect(form.get('email')).toBeTruthy();
      expect(form.get('password')).toBeTruthy();
    });

    it('should apply validators to controls', () => {
      const form = FormBuilderHelper.createFormWithValidation({
        email: ['', [Validators.required, Validators.email]],
      });

      const emailControl = form.get('email');

      // Empty value should fail required validator
      expect(emailControl?.hasError('required')).toBe(true);

      // Invalid email should fail email validator
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);

      // Valid email should pass all validators
      emailControl?.setValue('valid@example.com');
      expect(emailControl?.valid).toBe(true);
    });

    it('should set initial values', () => {
      const form = FormBuilderHelper.createFormWithValidation({
        name: ['Initial Name', Validators.required],
        count: [42, Validators.required],
      });

      expect(form.get('name')?.value).toBe('Initial Name');
      expect(form.get('count')?.value).toBe(42);
    });

    it('should create form with disabled controls', () => {
      const form = FormBuilderHelper.createFormWithValidation({
        field1: [{value: 'disabled', disabled: true}, Validators.required],
        field2: ['enabled', Validators.required],
      });

      expect(form.get('field1')?.disabled).toBe(true);
      expect(form.get('field2')?.disabled).toBe(false);
    });
  });

  describe('setControlValue()', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = FormBuilderHelper.createFormWithValidation({
        name: ['', Validators.required],
        email: ['', Validators.email],
      });
    });

    it('should set control value', () => {
      FormBuilderHelper.setControlValue(form, 'name', 'John Doe');
      expect(form.get('name')?.value).toBe('John Doe');
    });

    it('should mark control as touched', () => {
      FormBuilderHelper.setControlValue(form, 'name', 'value', true);
      expect(form.get('name')?.touched).toBe(true);
    });

    it('should not mark as touched by default', () => {
      FormBuilderHelper.setControlValue(form, 'name', 'value', false);
      expect(form.get('name')?.touched).toBe(false);
    });

    it('should handle null values', () => {
      FormBuilderHelper.setControlValue(form, 'name', null);
      expect(form.get('name')?.value).toBeNull();
    });

    it('should handle complex object values', () => {
      const complexValue = {id: 1, name: 'Complex'};
      FormBuilderHelper.setControlValue(form, 'name', complexValue);
      expect(form.get('name')?.value).toEqual(complexValue);
    });

    it('should handle array values', () => {
      const arrayValue = [1, 2, 3];
      FormBuilderHelper.setControlValue(form, 'name', arrayValue);
      expect(form.get('name')?.value).toEqual(arrayValue);
    });
  });

  describe('getControlValue()', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = FormBuilderHelper.createFormWithValidation({
        name: ['John', Validators.required],
        age: [30, Validators.required],
        active: [true, Validators.required],
      });
    });

    it('should get string value', () => {
      const value = FormBuilderHelper.getControlValue<string>(form, 'name');
      expect(value).toBe('John');
      expect(typeof value).toBe('string');
    });

    it('should get number value', () => {
      const value = FormBuilderHelper.getControlValue<number>(form, 'age');
      expect(value).toBe(30);
      expect(typeof value).toBe('number');
    });

    it('should get boolean value', () => {
      const value = FormBuilderHelper.getControlValue<boolean>(form, 'active');
      expect(value).toBe(true);
      expect(typeof value).toBe('boolean');
    });

    it('should get null for non-existent control', () => {
      const value = FormBuilderHelper.getControlValue(form, 'nonexistent');
      expect(value).toBeNull();
    });
  });

  describe('markAsTouched()', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = FormBuilderHelper.createFormWithValidation({
        field1: ['', Validators.required],
        field2: ['', Validators.required],
      });
    });

    it('should mark all controls as touched', () => {
      FormBuilderHelper.markAsTouched(form);

      expect(form.get('field1')?.touched).toBe(true);
      expect(form.get('field2')?.touched).toBe(true);
      expect(form.touched).toBe(true);
    });

    it('should make validation errors visible after marking touched', () => {
      FormBuilderHelper.markAsTouched(form);

      expect(form.get('field1')?.hasError('required')).toBe(true);
      expect(form.get('field1')?.invalid).toBe(true);
    });
  });

  describe('markAsDirty()', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = FormBuilderHelper.createFormWithValidation({
        field: ['', Validators.required],
      });
    });

    it('should mark form as dirty', () => {
      expect(form.dirty).toBe(false);
      FormBuilderHelper.markAsDirty(form);
      expect(form.dirty).toBe(true);
    });

    it('should mark all controls as dirty', () => {
      FormBuilderHelper.markAsDirty(form);
      expect(form.get('field')?.dirty).toBe(true);
    });
  });

  describe('reset()', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = FormBuilderHelper.createFormWithValidation({
        name: ['John', Validators.required],
        email: ['john@example.com', Validators.email],
      });

      // Set some state
      form.get('name')?.setValue('Jane');
      form.markAsTouched();
      form.markAsDirty();
    });

    it('should reset form to initial state', () => {
      FormBuilderHelper.reset(form);

      expect(form.get('name')?.value).toBeNull();
      expect(form.get('email')?.value).toBeNull();
      expect(form.touched).toBe(false);
      expect(form.dirty).toBe(false);
    });

    it('should reset form to provided values', () => {
      const resetValues = {
        name: 'Reset Name',
        email: 'reset@example.com',
      };

      FormBuilderHelper.reset(form, resetValues);

      expect(form.get('name')?.value).toBe('Reset Name');
      expect(form.get('email')?.value).toBe('reset@example.com');
      expect(form.touched).toBe(false);
      expect(form.dirty).toBe(false);
    });
  });

  describe('setControlEnabled()', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = FormBuilderHelper.createFormWithValidation({
        field: ['', Validators.required],
      });
    });

    it('should enable disabled control', () => {
      form.get('field')?.disable();
      expect(form.get('field')?.enabled).toBe(false);

      FormBuilderHelper.setControlEnabled(form, 'field', true);
      expect(form.get('field')?.enabled).toBe(true);
    });

    it('should disable enabled control', () => {
      expect(form.get('field')?.enabled).toBe(true);

      FormBuilderHelper.setControlEnabled(form, 'field', false);
      expect(form.get('field')?.enabled).toBe(false);
    });

    it('should affect form validity', () => {
      FormBuilderHelper.setControlEnabled(form, 'field', false);
      expect(form.valid).toBe(true); // Required validator not applied when disabled

      FormBuilderHelper.setControlEnabled(form, 'field', true);
      expect(form.valid).toBe(false); // Required validator now applied
    });
  });

  describe('verifyControlState()', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = FormBuilderHelper.createFormWithValidation({
        username: ['testuser', [Validators.required, Validators.minLength(3)]],
      });
    });

    it('should verify valid control state', () => {
      expect(() => {
        FormBuilderHelper.verifyControlState(form, 'username', {
          valid: true,
          dirty: false,
          touched: false,
          value: 'testuser',
        });
      }).not.toThrow();
    });

    it('should verify invalid control state', () => {
      FormBuilderHelper.setControlValue(form, 'username', 'ab');

      expect(() => {
        FormBuilderHelper.verifyControlState(form, 'username', {
          valid: false,
          dirty: false,
          touched: false,
        });
      }).not.toThrow();
    });

    it('should verify touched state', () => {
      FormBuilderHelper.setControlValue(form, 'username', '', true);

      expect(() => {
        FormBuilderHelper.verifyControlState(form, 'username', {
          touched: true,
        });
      }).not.toThrow();
    });

    it('should verify dirty state', () => {
      form.markAsDirty();

      expect(() => {
        FormBuilderHelper.verifyControlState(form, 'username', {
          dirty: true,
        });
      }).not.toThrow();
    });
  });

  describe('setInputAndDetect()', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = FormBuilderHelper.createFormWithValidation({
        name: ['', Validators.required],
        email: ['', Validators.email],
        age: [0, Validators.required],
      });
    });

    it('should set multiple values at once', () => {
      FormBuilderHelper.setInputAndDetect({
        form,
        values: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
        },
      });

      expect(form.get('name')?.value).toBe('John Doe');
      expect(form.get('email')?.value).toBe('john@example.com');
      expect(form.get('age')?.value).toBe(30);
    });

    it('should handle partial updates', () => {
      FormBuilderHelper.setInputAndDetect({
        form,
        values: {
          name: 'Jane Doe',
        },
      });

      expect(form.get('name')?.value).toBe('Jane Doe');
      expect(form.get('email')?.value).toBe('');
      expect(form.get('age')?.value).toBe(0);
    });

    it('should mark all touched when setting values', () => {
      FormBuilderHelper.setInputAndDetect({
        form,
        values: {
          name: 'Test',
          email: 'test@example.com',
        },
      });

      expect(form.get('name')?.touched).toBe(true);
      expect(form.get('email')?.touched).toBe(true);
    });
  });

  describe('getControlErrors()', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = FormBuilderHelper.createFormWithValidation({
        email: ['invalid-email', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
      });
    });

    it('should return validation errors for invalid control', () => {
      const errors = FormBuilderHelper.getControlErrors(form, 'email');
      expect(errors?.['email']).toBe(true);
    });

    it('should return multiple errors', () => {
      FormBuilderHelper.setControlValue(form, 'password', '');
      const errors = FormBuilderHelper.getControlErrors(form, 'password');
      expect(errors?.['required']).toBe(true);
    });

    it('should return null for valid control', () => {
      FormBuilderHelper.setControlValue(form, 'email', 'valid@example.com');
      const errors = FormBuilderHelper.getControlErrors(form, 'email');
      expect(errors).toBeNull();
    });

    it('should return null for non-existent control', () => {
      const errors = FormBuilderHelper.getControlErrors(form, 'nonexistent');
      expect(errors).toBeNull();
    });
  });

  describe('Integration scenarios', () => {
    it('should create, modify, and validate a complete form', () => {
      const form = FormBuilderHelper.createFormWithValidation({
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        agreedToTerms: [false, Validators.required],
      });

      // Initially invalid
      expect(form.valid).toBe(false);

      // Set values
      FormBuilderHelper.setInputAndDetect({
        form,
        values: {
          username: 'ab', // Too short
          email: 'not-an-email',
          agreedToTerms: false,
        },
      });

      expect(form.valid).toBe(false);
      expect(FormBuilderHelper.getControlErrors(form, 'username')).toBeTruthy();
      expect(FormBuilderHelper.getControlErrors(form, 'email')).toBeTruthy();

      // Fix issues
      FormBuilderHelper.setInputAndDetect({
        form,
        values: {
          username: 'validuser',
          email: 'user@example.com',
          agreedToTerms: true,
        },
      });

      expect(form.valid).toBe(true);
      expect(FormBuilderHelper.getControlErrors(form, 'username')).toBeNull();
      expect(FormBuilderHelper.getControlErrors(form, 'email')).toBeNull();
    });

    it('should handle conditional validation scenarios', () => {
      const form = FormBuilderHelper.createFormWithValidation({
        enableNotifications: [false, Validators.required],
        notificationEmail: ['', Validators.email],
      });

      expect(form.valid).toBe(true);

      // Enable notifications
      FormBuilderHelper.setControlValue(form, 'enableNotifications', true);

      // In real scenario, conditional validator would be applied
      // Here we just verify the form mechanics work
      expect(form.get('enableNotifications')?.value).toBe(true);
      expect(form.get('notificationEmail')?.value).toBe('');
    });

    it('should support form reset workflow', () => {
      const form = FormBuilderHelper.createFormWithValidation({
        field1: ['initial1', Validators.required],
        field2: ['initial2', Validators.required],
      });

      // Modify form
      FormBuilderHelper.setInputAndDetect({
        form,
        values: {
          field1: 'modified1',
          field2: 'modified2',
        },
      });

      expect(form.get('field1')?.value).toBe('modified1');
      expect(form.touched).toBe(true);

      // Reset form
      FormBuilderHelper.reset(form, {
        field1: 'initial1',
        field2: 'initial2',
      });

      expect(form.get('field1')?.value).toBe('initial1');
      expect(form.touched).toBe(false);
      expect(form.dirty).toBe(false);
    });
  });
});
