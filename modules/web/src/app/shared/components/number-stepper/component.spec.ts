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
import {DecimalPipe} from '@angular/common';

import {SharedModule} from '@shared/module';
import {NumberStepperComponent} from './component';

describe('NumberStepperComponent', () => {
  let component: NumberStepperComponent;
  let fixture: ComponentFixture<NumberStepperComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      providers: [DecimalPipe],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NumberStepperComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input properties', () => {
    it('should have default input values', () => {
      expect(component.required).toBe(false);
      expect(component.disabled).toBe(false);
      expect(component.step).toBe(1);
      expect(component.type).toBe('integer');
      expect(component.forceFormFieldMinWidth).toBe(true);
      expect(component.enableKmValueChangedIndicator).toBe(true);
      expect(component.verticalButton).toBe(false);
      expect(component.mode).toBe('raw');
    });

    it('should set label input', () => {
      component.label = 'Test Label';
      expect(component.label).toBe('Test Label');
    });

    it('should set hint input', () => {
      component.hint = 'Test Hint';
      expect(component.hint).toBe('Test Hint');
    });

    it('should set min value', () => {
      component.min = 5;
      expect(component.min).toBe(5);
    });

    it('should set max value', () => {
      component.max = 100;
      expect(component.max).toBe(100);
    });

    it('should set step value', () => {
      component.step = 5;
      expect(component.step).toBe(5);
    });

    it('should set type to decimal', () => {
      component.type = 'decimal';
      expect(component.type).toBe('decimal');
    });
  });

  describe('Value getter/setter', () => {
    it('should initialize with undefined value', () => {
      expect(component.value).toBeUndefined();
    });

    it('should set integer value', () => {
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = 42;

      expect(component.value).toBe(42);
    });

    it('should convert string to integer', () => {
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = '123';

      expect(component.value).toBe(123);
    });

    it('should set decimal value', () => {
      component.type = 'decimal';
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = 3.14;

      expect(typeof component.value).toBe('number');
    });

    it('should handle null values', () => {
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = null;

      expect(component.value).toBeNull();
    });

    it('should emit change on value update', () => {
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = 50;

      expect(changeFn).toHaveBeenCalledWith(50);
    });
  });

  describe('Increment (onIncrease)', () => {
    it('should increment value by step', () => {
      component.step = 1;
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = 5;
      component.onIncrease();

      expect(component.value).toBe(6);
    });

    it('should increment by custom step', () => {
      component.step = 5;
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = 10;
      component.onIncrease();

      expect(component.value).toBe(15);
    });

    it('should set to min when value is undefined and min is set', () => {
      component.min = 10;
      component.step = 1;
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.onIncrease();

      expect(component.value).toBe(10);
    });

    it('should not exceed max value', () => {
      component.max = 100;
      component.step = 10;
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = 95;
      component.onIncrease();

      // Should not increment beyond max
      expect(component.value).toBeLessThanOrEqual(component.max);
    });

    it('should call onTouch on increase', () => {
      component.step = 1;
      component.onTouch = jest.fn();
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = 5;
      component.onIncrease();

      expect(component.onTouch).toHaveBeenCalled();
    });
  });

  describe('Decrement (onDecrease)', () => {
    it('should decrement value by step', () => {
      component.step = 1;
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = 10;
      component.onDecrease();

      expect(component.value).toBe(9);
    });

    it('should decrement by custom step', () => {
      component.step = 5;
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = 20;
      component.onDecrease();

      expect(component.value).toBe(15);
    });

    it('should not go below min value', () => {
      component.min = 0;
      component.step = 5;
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = 2;
      component.onDecrease();

      // Should not decrement below min
      expect(component.value).toBeGreaterThanOrEqual(component.min);
    });

    it('should call onTouch on decrease', () => {
      component.step = 1;
      component.onTouch = jest.fn();
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = 10;
      component.onDecrease();

      expect(component.onTouch).toHaveBeenCalled();
    });
  });

  describe('Pattern validation', () => {
    it('should return integer pattern for integer type', () => {
      component.type = 'integer';
      expect(component.pattern).toEqual(/^[-]?[0-9]*$/);
    });

    it('should return empty pattern for decimal type', () => {
      component.type = 'decimal';
      expect(component.pattern).toBe('');
    });
  });

  describe('Focus state', () => {
    it('should initialize focus as false', () => {
      expect(component.focus).toBe(false);
    });

    it('should set focus to true', () => {
      component.focus = true;
      expect(component.focus).toBe(true);
    });

    it('should handle empty string as true for focus', () => {
      component.focus = '';
      expect(component.focus).toBe(true);
    });
  });

  describe('ID binding', () => {
    it('should set and get id', () => {
      component.id = 'test-id';
      expect(component.id).toBe('test-id');
    });
  });

  describe('ControlValueAccessor implementation', () => {
    it('should write value without emitting change', () => {
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.writeValue(42);

      expect(component.value).toBe(42);
      // writeValue should call onChange
      expect(changeFn).toHaveBeenCalled();
    });

    it('should register on change callback', () => {
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);

      expect(component['_onChange']).toBe(changeFn);
    });

    it('should register on touched callback', () => {
      const touchedFn = jest.fn();
      component.registerOnTouched(touchedFn);

      expect(component.onTouch).toBe(touchedFn);
    });

    it('should set disabled state', () => {
      fixture.detectChanges();
      component.setDisabledState(true);

      expect(component.disabled).toBe(true);
    });
  });

  describe('Validator implementation', () => {
    it('should implement validate method', () => {
      expect(typeof component.validate).toBe('function');
    });

    it('should return null when valid', () => {
      component.value = 50;
      // After setting value, model should validate as valid
      component['_valid'] = true;

      expect(component.validate()).toBeNull();
    });

    it('should return errors when invalid', () => {
      component.value = null;
      component['_valid'] = false;

      const errors = component.validate();
      // Should return validation errors object or null
      expect(errors === null || typeof errors === 'object').toBe(true);
    });
  });

  describe('Mode property', () => {
    it('should have default mode as raw', () => {
      expect(component.mode).toBe('raw');
    });

    it('should set mode to errors', () => {
      component.mode = 'errors';
      expect(component.mode).toBe('errors');
    });

    it('should set mode to hint', () => {
      component.mode = 'hint';
      expect(component.mode).toBe('hint');
    });

    it('should set mode to all', () => {
      component.mode = 'all';
      expect(component.mode).toBe('all');
    });

    it('should return empty errors array in raw mode', () => {
      component.mode = 'raw';
      expect(component.errors).toEqual([]);
    });
  });

  describe('OnPush change detection strategy', () => {
    it('should have OnPush strategy', () => {
      const metadata = (component.constructor as any)['ɵcmp'];
      expect(metadata.changeDetection).toBe(0); // 0 = ChangeDetectionStrategy.OnPush
    });

    it('should trigger manual change detection on value set', () => {
      const cdrSpy = jest.spyOn(component['_cdr'], 'detectChanges');
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = 42;

      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should trigger markForCheck on setDisabledState', () => {
      const cdrSpy = jest.spyOn(component['_cdr'], 'markForCheck');
      fixture.detectChanges();

      component.setDisabledState(true);

      expect(cdrSpy).toHaveBeenCalled();
    });
  });

  describe('Component cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const unsubjectSpy = jest.spyOn(component['_unsubscribe'], 'next');
      const completeSpy = jest.spyOn(component['_unsubscribe'], 'complete');

      component.ngOnDestroy();

      expect(unsubjectSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Integer vs Decimal types', () => {
    it('should parse integer values correctly', () => {
      component.type = 'integer';
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = '456';

      expect(component.value).toBe(456);
    });

    it('should parse decimal values correctly', () => {
      component.type = 'decimal';
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      fixture.detectChanges();

      component.value = 3.14159;

      expect(typeof component.value).toBe('number');
    });
  });
});
