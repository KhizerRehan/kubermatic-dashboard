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
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SimpleChange} from '@angular/core';
import {Validators} from '@angular/forms';

import {SharedModule} from '@shared/module';
import {AutocompleteComponent, AutocompleteControls} from './component';

describe('AutocompleteComponent', () => {
  let component: AutocompleteComponent;
  let fixture: ComponentFixture<AutocompleteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AutocompleteComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize form with main control', () => {
      component.ngOnInit();
      expect(component.form).toBeTruthy();
      expect(component.form.get(AutocompleteControls.Main)).toBeTruthy();
    });

    it('should initialize with empty search string', () => {
      component.ngOnInit();
      expect(component.search).toBe('');
    });

    it('should initialize dropdown as closed', () => {
      component.ngOnInit();
      expect(component.isDropdownOpen).toBeUndefined();
    });

    it('should add required validator when required is true', () => {
      component.required = true;
      component.ngOnInit();

      const control = component.form.get(AutocompleteControls.Main);
      expect(control.hasError('required')).toBe(true);
    });

    it('should not add required validator when required is false', () => {
      component.required = false;
      component.ngOnInit();

      const control = component.form.get(AutocompleteControls.Main);
      control.setValue('');
      expect(control.hasError('required')).toBe(false);
    });

    it('should add custom validators', () => {
      component.required = false;
      component.validators = [Validators.minLength(2)];
      component.ngOnInit();

      const control = component.form.get(AutocompleteControls.Main);
      control.setValue('a');
      expect(control.hasError('minlength')).toBe(true);
    });

    it('should disable form control when disabled input is true', () => {
      component.disabled = true;
      component.ngOnInit();

      const control = component.form.get(AutocompleteControls.Main);
      expect(control.disabled).toBe(true);
    });

    it('should not disable form control when disabled input is false', () => {
      component.disabled = false;
      component.ngOnInit();

      const control = component.form.get(AutocompleteControls.Main);
      expect(control.disabled).toBe(false);
    });
  });

  describe('Dropdown state', () => {
    it('should open dropdown and clear search', () => {
      component.ngOnInit();
      component.search = 'old search';

      component.onDropdownOpened();

      expect(component.isDropdownOpen).toBe(true);
      expect(component.search).toBe('');
    });

    it('should close dropdown', () => {
      component.ngOnInit();
      component.isDropdownOpen = true;

      component.onDropdownClosed();

      expect(component.isDropdownOpen).toBe(false);
    });

    it('should handle multiple open/close cycles', () => {
      component.ngOnInit();

      component.onDropdownOpened();
      expect(component.isDropdownOpen).toBe(true);

      component.onDropdownClosed();
      expect(component.isDropdownOpen).toBe(false);

      component.onDropdownOpened();
      expect(component.isDropdownOpen).toBe(true);
    });
  });

  describe('Disabled state via ngOnChanges', () => {
    it('should disable control when disabled changes to true', () => {
      component.ngOnInit();
      const control = component.form.get(AutocompleteControls.Main);

      component.disabled = true;
      component.ngOnChanges({
        disabled: new SimpleChange(false, true, false),
      });

      expect(control.disabled).toBe(true);
    });

    it('should enable control when disabled changes to false', () => {
      component.disabled = true;
      component.ngOnInit();
      const control = component.form.get(AutocompleteControls.Main);
      expect(control.disabled).toBe(true);

      component.disabled = false;
      component.ngOnChanges({
        disabled: new SimpleChange(true, false, false),
      });

      expect(control.disabled).toBe(false);
    });

    it('should not enable already enabled control', () => {
      component.disabled = false;
      component.ngOnInit();
      const control = component.form.get(AutocompleteControls.Main);

      component.ngOnChanges({
        disabled: new SimpleChange(false, false, false),
      });

      expect(control.disabled).toBe(false);
    });

    it('should not affect control if no changes provided', () => {
      component.ngOnInit();
      const control = component.form.get(AutocompleteControls.Main);

      component.ngOnChanges(null);

      expect(control.disabled).toBe(false);
    });
  });

  describe('Input properties', () => {
    it('should have label input', () => {
      component.label = 'Test Label';
      expect(component.label).toBe('Test Label');
    });

    it('should have options input', () => {
      component.options = ['Option1', 'Option2'];
      expect(component.options).toEqual(['Option1', 'Option2']);
    });

    it('should initialize options as empty array', () => {
      expect(component.options).toEqual([]);
    });

    it('should have isLoading input', () => {
      component.isLoading = true;
      expect(component.isLoading).toBe(true);
    });

    it('should initialize isLoading as false', () => {
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Form control accessor pattern', () => {
    it('should implement ControlValueAccessor', () => {
      expect(typeof component.writeValue).toBe('function');
      expect(typeof component.registerOnChange).toBe('function');
    });

    it('should implement Validator interface', () => {
      expect(typeof component.validate).toBe('function');
    });
  });

  describe('Controls enum', () => {
    it('should expose AutocompleteControls', () => {
      component.ngOnInit();
      expect(component.controls).toBe(AutocompleteControls);
      expect(component.controls.Main).toBe('main');
    });
  });

  describe('Form value management', () => {
    it('should update form value', () => {
      component.ngOnInit();
      const control = component.form.get(AutocompleteControls.Main);

      control.setValue('test value');
      expect(control.value).toBe('test value');
    });

    it('should clear form value', () => {
      component.ngOnInit();
      const control = component.form.get(AutocompleteControls.Main);

      control.setValue('test value');
      control.setValue('');
      expect(control.value).toBe('');
    });

    it('should mark control as touched', () => {
      component.ngOnInit();
      const control = component.form.get(AutocompleteControls.Main);

      control.markAsTouched();
      expect(control.touched).toBe(true);
    });

    it('should mark control as dirty after value change', () => {
      component.ngOnInit();
      const control = component.form.get(AutocompleteControls.Main);

      control.setValue('new value');
      expect(control.dirty).toBe(true);
    });
  });

  describe('Validator combinations', () => {
    it('should combine required and custom validators', () => {
      component.required = true;
      component.validators = [Validators.minLength(3)];
      component.ngOnInit();

      const control = component.form.get(AutocompleteControls.Main);

      // Required error
      expect(control.hasError('required')).toBe(true);

      // Set value that satisfies required but not minLength
      control.setValue('ab');
      expect(control.hasError('required')).toBe(false);
      expect(control.hasError('minlength')).toBe(true);

      // Set value that satisfies both
      control.setValue('abc');
      expect(control.hasError('required')).toBe(false);
      expect(control.hasError('minlength')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle ngOnChanges before ngOnInit', () => {
      component.disabled = true;
      expect(() => {
        component.ngOnChanges({
          disabled: new SimpleChange(false, true, false),
        });
      }).not.toThrow();
    });

    it('should handle multiple property updates', () => {
      component.required = true;
      component.label = 'Test';
      component.options = ['A', 'B'];
      component.isLoading = true;
      component.disabled = false;

      component.ngOnInit();

      expect(component.form).toBeTruthy();
      expect(component.label).toBe('Test');
      expect(component.options).toEqual(['A', 'B']);
      expect(component.isLoading).toBe(true);
    });
  });
});
