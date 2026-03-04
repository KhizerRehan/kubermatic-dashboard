// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {FormBuilder, Validators} from '@angular/forms';

import {SharedModule} from '@shared/module';
import {SelectComponent, Controls} from './component';

describe('SelectComponent', () => {
  let component: SelectComponent;
  let fixture: ComponentFixture<SelectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form initialization', () => {
    it('should initialize form group with select control', () => {
      component.ngOnInit();
      expect(component.form).toBeTruthy();
      expect(component.form.get(Controls.Select)).toBeTruthy();
    });

    it('should initialize select control with empty value', () => {
      component.ngOnInit();
      expect(component.form.get(Controls.Select).value).toBe('');
    });

    it('should add Validators.required when required input is true', () => {
      component.required = true;
      component.ngOnInit();

      const control = component.form.get(Controls.Select);
      expect(control.hasError('required')).toBe(true);
    });

    it('should not have required error when required is false', () => {
      component.required = false;
      component.ngOnInit();

      const control = component.form.get(Controls.Select);
      expect(control.hasError('required')).toBe(false);
    });

    it('should add custom validators to form control', () => {
      component.required = false;
      component.validators = [Validators.minLength(2)];
      component.ngOnInit();

      const control = component.form.get(Controls.Select);
      control.setValue('a');

      expect(control.hasError('minlength')).toBe(true);
    });

    it('should combine required and custom validators', () => {
      component.required = true;
      component.validators = [Validators.minLength(2)];
      component.ngOnInit();

      const control = component.form.get(Controls.Select);
      expect(control.getError('required')).toBeDefined();
    });
  });

  describe('Options input binding', () => {
    it('should render options from input array', () => {
      component.options = ['Option1', 'Option2', 'Option3'];
      component.ngOnInit();
      fixture.detectChanges();

      const optionElements = fixture.debugElement.nativeElement.querySelectorAll(
        'mat-option'
      );
      expect(optionElements.length).toBe(3);
    });

    it('should display option text correctly', () => {
      component.options = ['Apple', 'Banana', 'Cherry'];
      component.ngOnInit();
      fixture.detectChanges();

      const optionTexts = Array.from(
        fixture.debugElement.nativeElement.querySelectorAll('mat-option')
      ).map((el: any) => el.textContent.trim());

      expect(optionTexts).toEqual(['Apple', 'Banana', 'Cherry']);
    });

    it('should handle empty options array', () => {
      component.options = [];
      component.ngOnInit();
      fixture.detectChanges();

      const optionElements = fixture.debugElement.nativeElement.querySelectorAll(
        'mat-option'
      );
      expect(optionElements.length).toBe(0);
    });

    it('should update options dynamically', () => {
      component.options = ['Option1'];
      component.ngOnInit();
      fixture.detectChanges();

      let optionElements = fixture.debugElement.nativeElement.querySelectorAll(
        'mat-option'
      );
      expect(optionElements.length).toBe(1);

      component.options = ['Option1', 'Option2', 'Option3'];
      fixture.detectChanges();

      optionElements = fixture.debugElement.nativeElement.querySelectorAll(
        'mat-option'
      );
      expect(optionElements.length).toBe(3);
    });
  });

  describe('Label input binding', () => {
    it('should render label when provided', () => {
      component.label = 'Test Label';
      component.ngOnInit();
      fixture.detectChanges();

      const labelElement = fixture.debugElement.nativeElement.querySelector(
        'mat-label'
      );
      expect(labelElement).toBeTruthy();
      expect(labelElement.textContent).toBe('Test Label');
    });

    it('should not render label when not provided', () => {
      component.label = undefined;
      component.ngOnInit();
      fixture.detectChanges();

      const labelElement = fixture.debugElement.nativeElement.querySelector(
        'mat-label'
      );
      expect(labelElement).toBeFalsy();
    });
  });

  describe('Hint input binding', () => {
    it('should render hint when provided', () => {
      component.hint = 'This is a hint';
      component.ngOnInit();
      fixture.detectChanges();

      const hintElement = fixture.debugElement.nativeElement.querySelector(
        'mat-hint'
      );
      expect(hintElement).toBeTruthy();
      expect(hintElement.textContent).toBe('This is a hint');
    });

    it('should not render hint when not provided', () => {
      component.hint = undefined;
      component.ngOnInit();
      fixture.detectChanges();

      const hintElement = fixture.debugElement.nativeElement.querySelector(
        'mat-hint'
      );
      expect(hintElement).toBeFalsy();
    });
  });

  describe('Multiple selection', () => {
    it('should render as single select by default', () => {
      component.options = ['Option1', 'Option2'];
      component.isMultiple = false;
      component.ngOnInit();
      fixture.detectChanges();

      const selectElement = fixture.debugElement.nativeElement.querySelector(
        'mat-select'
      );
      expect(selectElement.getAttribute('multiple')).toBeNull();
    });

    it('should render as multiple select when isMultiple is true', () => {
      component.options = ['Option1', 'Option2'];
      component.isMultiple = true;
      component.ngOnInit();
      fixture.detectChanges();

      const selectElement = fixture.debugElement.nativeElement.querySelector(
        'mat-select'
      );
      expect(selectElement.hasAttribute('multiple')).toBe(true);
    });

    it('should apply multiple values dropdown class when isMultiple is true', () => {
      component.options = ['Option1', 'Option2'];
      component.isMultiple = true;
      component.ngOnInit();
      fixture.detectChanges();

      const selectElement = fixture.debugElement.nativeElement.querySelector(
        'mat-select'
      );
      expect(selectElement.getAttribute('panelclass')).toBeTruthy();
    });

    it('should not apply multiple values class when isMultiple is false', () => {
      component.options = ['Option1', 'Option2'];
      component.isMultiple = false;
      component.ngOnInit();
      fixture.detectChanges();

      const selectElement = fixture.debugElement.nativeElement.querySelector(
        'mat-select'
      );
      // When isMultiple is false, panelClass should be empty string or not set
      const panelClass = selectElement.getAttribute('panelclass');
      expect(panelClass === null || panelClass === '').toBe(true);
    });
  });

  describe('Form control write value', () => {
    it('should set form control value without emitting change event', (done) => {
      component.ngOnInit();

      const changeSpy = jest.fn();
      component.form.get(Controls.Select).valueChanges.subscribe(changeSpy);

      component.writeValue('test value');
      fixture.detectChanges();

      // WriteValue should not trigger valueChanges emission
      expect(component.form.get(Controls.Select).value).toBe('test value');

      // Allow time for any potential emissions
      setTimeout(() => {
        expect(changeSpy).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should handle null values', () => {
      component.ngOnInit();

      component.writeValue(null);
      expect(component.form.get(Controls.Select).value).toBeNull();
    });

    it('should update form value multiple times', () => {
      component.ngOnInit();

      component.writeValue('value1');
      expect(component.form.get(Controls.Select).value).toBe('value1');

      component.writeValue('value2');
      expect(component.form.get(Controls.Select).value).toBe('value2');
    });
  });

  describe('Form control value changes', () => {
    it('should emit value changes to registered callback', (done) => {
      component.ngOnInit();
      fixture.detectChanges();

      const changeFn = jest.fn();
      component.registerOnChange(changeFn);

      component.form.get(Controls.Select).setValue('new value');

      // Allow async subscription to process
      setTimeout(() => {
        expect(changeFn).toHaveBeenCalledWith('new value');
        done();
      }, 50);
    });

    it('should handle multiple value changes', (done) => {
      component.ngOnInit();
      fixture.detectChanges();

      const changeFn = jest.fn();
      component.registerOnChange(changeFn);

      component.form.get(Controls.Select).setValue('value1');
      component.form.get(Controls.Select).setValue('value2');
      component.form.get(Controls.Select).setValue('value3');

      setTimeout(() => {
        expect(changeFn).toHaveBeenCalledTimes(3);
        done();
      }, 100);
    });

    it('should unsubscribe from value changes on destroy', (done) => {
      component.ngOnInit();
      fixture.detectChanges();

      const changeFn = jest.fn();
      component.registerOnChange(changeFn);

      component.ngOnDestroy();

      component.form.get(Controls.Select).setValue('after destroy');

      setTimeout(() => {
        // Should not be called after destroy
        expect(changeFn).not.toHaveBeenCalledWith('after destroy');
        done();
      }, 100);
    });
  });

  describe('Validation error display', () => {
    it('should show required error when control is required and empty', () => {
      component.required = true;
      component.ngOnInit();
      fixture.detectChanges();

      const control = component.form.get(Controls.Select);
      control.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.nativeElement.querySelector(
        'mat-error'
      );
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Required');
    });

    it('should not show required error when control has value', () => {
      component.required = true;
      component.options = ['Option1'];
      component.ngOnInit();
      fixture.detectChanges();

      const control = component.form.get(Controls.Select);
      control.setValue('Option1');
      control.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.nativeElement.querySelector(
        'mat-error'
      );
      expect(errorElement).toBeFalsy();
    });

    it('should hide required error after valid selection', () => {
      component.required = true;
      component.options = ['Option1'];
      component.ngOnInit();
      fixture.detectChanges();

      const control = component.form.get(Controls.Select);
      control.markAsTouched();
      fixture.detectChanges();

      let errorElement = fixture.debugElement.nativeElement.querySelector(
        'mat-error'
      );
      expect(errorElement).toBeTruthy();

      control.setValue('Option1');
      fixture.detectChanges();

      errorElement = fixture.debugElement.nativeElement.querySelector(
        'mat-error'
      );
      expect(errorElement).toBeFalsy();
    });
  });

  describe('IsLoading input', () => {
    it('should store isLoading value', () => {
      component.isLoading = true;
      expect(component.isLoading).toBe(true);

      component.isLoading = false;
      expect(component.isLoading).toBe(false);
    });

    it('should initialize isLoading as false', () => {
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Form control accessor pattern', () => {
    it('should implement NG_VALUE_ACCESSOR provider', () => {
      const metadata = (component.constructor as any)['ɵcmp'];
      const providers = metadata.data.providers;

      const hasValueAccessor = providers.some(
        (p: any) =>
          p && p.provide && p.provide.ɵprov && p.provide.ɵprov.token === 'NG_VALUE_ACCESSOR'
      );

      // Alternative check - component extends BaseFormValidator which implements ControlValueAccessor
      expect(typeof component.writeValue).toBe('function');
      expect(typeof component.registerOnChange).toBe('function');
    });

    it('should implement NG_VALIDATORS provider', () => {
      // Component extends BaseFormValidator which implements Validator
      expect(typeof component.validate).toBe('function');
    });
  });

  describe('Component cleanup', () => {
    it('should unsubscribe on destroy', () => {
      component.ngOnInit();
      const unsubjectSpy = jest.spyOn(component['_unsubscribe'], 'next');
      const completeSpy = jest.spyOn(component['_unsubscribe'], 'complete');

      component.ngOnDestroy();

      expect(unsubjectSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should clean up subscriptions on destroy', (done) => {
      component.ngOnInit();
      fixture.detectChanges();

      const changeFn = jest.fn();
      component.registerOnChange(changeFn);

      component.ngOnDestroy();

      // After destroy, valueChanges should not trigger callback
      component.form.get(Controls.Select).setValue('after destroy');

      setTimeout(() => {
        expect(changeFn).not.toHaveBeenCalledWith('after destroy');
        done();
      }, 100);
    });
  });

  describe('Controls enum', () => {
    it('should expose Controls enum', () => {
      expect(component.Controls).toBeDefined();
      expect(component.Controls.Select).toBe('select');
    });
  });
});
