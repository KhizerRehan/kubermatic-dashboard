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

import {ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatOptionModule} from '@angular/material/core';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';

import {FilteredComboboxComponent, ComboboxControls} from './component';
import {SharedModule} from '../../module';

describe('FilteredComboboxComponent', () => {
  let fixture: ComponentFixture<FilteredComboboxComponent>;
  let component: FilteredComboboxComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        FilteredComboboxComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatSelectModule,
        MatFormFieldModule,
        MatOptionModule,
        MatInputModule,
        MatButtonModule,
        MatDividerModule,
        MatIconModule,
        SharedModule,
      ],
      providers: [FormBuilder],
    });

    fixture = TestBed.createComponent(FilteredComboboxComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.label).toBeUndefined();
      expect(component.inputLabel).toBeUndefined();
      expect(component.required).toBe(false);
      expect(component.grouped).toBe(false);
      expect(component.isDisabled).toBe(false);
      expect(component.groups).toEqual([]);
      expect(component.options).toEqual([]);
      expect(component.selected).toBe('');
      expect(component.multiple).toBe(false);
      expect(component.enableKmValueChangedIndicator).toBe(true);
      expect(component.enableResetButton).toBe(true);
    });

    it('should create form control in ngOnInit', () => {
      component.ngOnInit();

      expect(component.form).toBeTruthy();
      expect(component.form.get(ComboboxControls.Select)).toBeTruthy();
    });

    it('should set required validator if required is true', () => {
      component.required = true;
      component.ngOnInit();

      const control = component.form.get(ComboboxControls.Select);
      expect(control.hasError('required')).toBe(true);
    });

    it('should not require value if required is false', () => {
      component.required = false;
      component.ngOnInit();

      const control = component.form.get(ComboboxControls.Select);
      expect(control.hasError('required')).toBe(false);
    });

    it('should use filterBy as selectBy if selectBy not provided', () => {
      component.filterBy = 'name';
      component.selectBy = undefined;
      component.ngOnInit();

      expect(component.selectBy).toBe('name');
    });

    it('should keep selectBy if already provided', () => {
      component.filterBy = 'name';
      component.selectBy = 'id';
      component.ngOnInit();

      expect(component.selectBy).toBe('id');
    });
  });

  describe('@Input properties', () => {
    it('should accept label input', () => {
      component.label = 'Select Option';
      expect(component.label).toBe('Select Option');
    });

    it('should accept inputLabel input', () => {
      component.inputLabel = 'Search...';
      expect(component.inputLabel).toBe('Search...');
    });

    it('should accept required input', () => {
      component.required = true;
      expect(component.required).toBe(true);
    });

    it('should accept grouped input', () => {
      component.grouped = true;
      expect(component.grouped).toBe(true);
    });

    it('should accept isDisabled input', () => {
      component.isDisabled = true;
      expect(component.isDisabled).toBe(true);
    });

    it('should accept groups input', () => {
      component.groups = ['Group1', 'Group2'];
      expect(component.groups).toEqual(['Group1', 'Group2']);
    });

    it('should accept options input', () => {
      const options = [{id: '1', name: 'Option 1'}];
      component.options = options;
      expect(component.options).toEqual(options);
    });

    it('should accept filterBy input', () => {
      component.filterBy = 'name';
      expect(component.filterBy).toBe('name');
    });

    it('should accept selectBy input', () => {
      component.selectBy = 'id';
      expect(component.selectBy).toBe('id');
    });

    it('should accept selected input', () => {
      component.selected = 'option-1';
      expect(component.selected).toBe('option-1');
    });

    it('should accept hint input', () => {
      component.hint = 'This is a hint';
      expect(component.hint).toBe('This is a hint');
    });

    it('should accept multiple input', () => {
      component.multiple = true;
      expect(component.multiple).toBe(true);
    });

    it('should accept customId input', () => {
      component.customId = 'custom-id';
      expect(component.customId).toBe('custom-id');
    });

    it('should accept enableKmValueChangedIndicator input', () => {
      component.enableKmValueChangedIndicator = false;
      expect(component.enableKmValueChangedIndicator).toBe(false);
    });

    it('should accept enableResetButton input', () => {
      component.enableResetButton = false;
      expect(component.enableResetButton).toBe(false);
    });

    it('should accept valueFormatter input', () => {
      const formatter = (val: string | string[]) => `formatted-${val}`;
      component.valueFormatter = formatter;
      expect(component.valueFormatter).toBe(formatter);
    });

    it('should accept getOptions input', () => {
      const getter = (group: string) => [{id: '1', name: 'Option'}];
      component.getOptions = getter;
      expect(component.getOptions).toBe(getter);
    });
  });

  describe('Form State Management', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should set form value to selected value', () => {
      component.selected = 'option-1';
      component.ngOnChanges();

      expect(component.form.get(ComboboxControls.Select).value).toBe('option-1');
    });

    it('should disable form when isDisabled is true', () => {
      component.isDisabled = true;
      component.ngOnChanges();

      expect(component.form.disabled).toBe(true);
    });

    it('should enable form when isDisabled is false', () => {
      component.isDisabled = false;
      component.ngOnChanges();

      expect(component.form.enabled).toBe(true);
    });

    it('should update form validity', () => {
      component.form.updateValueAndValidity();
      expect(component.form.valid).toBe(true);
    });

    it('should handle null selected value', () => {
      component.selected = null;
      component.ngOnChanges();

      expect(component.form.get(ComboboxControls.Select).value).toBe(null);
    });

    it('should handle undefined selected value', () => {
      component.selected = undefined as any;
      component.ngOnChanges();

      expect(component.form.get(ComboboxControls.Select).value).toBe(undefined);
    });

    it('should handle array of selected values', () => {
      component.multiple = true;
      component.selected = ['option-1', 'option-2'];
      component.ngOnChanges();

      expect(component.form.get(ComboboxControls.Select).value).toEqual(['option-1', 'option-2']);
    });
  });

  describe('@Output changed', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should emit changed event when value changes', fakeAsync(() => {
      spyOn(component.changed, 'emit');
      const control = component.form.get(ComboboxControls.Select);

      control.setValue('option-1');
      tick();

      expect(component.changed.emit).toHaveBeenCalledWith('option-1');
    }));

    it('should not emit when value is empty and distinctUntilChanged', fakeAsync(() => {
      spyOn(component.changed, 'emit');
      const control = component.form.get(ComboboxControls.Select);

      control.setValue('');
      tick();

      expect(component.changed.emit).not.toHaveBeenCalled();
    }));

    it('should emit only once for identical consecutive values', fakeAsync(() => {
      spyOn(component.changed, 'emit');
      const control = component.form.get(ComboboxControls.Select);

      control.setValue('option-1');
      tick();

      control.setValue('option-1');
      tick();

      expect(component.changed.emit).toHaveBeenCalledTimes(1);
    }));

    it('should emit multiple value changes', fakeAsync(() => {
      spyOn(component.changed, 'emit');
      const control = component.form.get(ComboboxControls.Select);

      control.setValue('option-1');
      tick();

      control.setValue('option-2');
      tick();

      expect(component.changed.emit).toHaveBeenCalledTimes(2);
    }));
  });

  describe('Reset Functionality', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should reset selected value to null', () => {
      component.selected = 'option-1';
      component.reset();

      expect(component.selected).toBe(null);
    });

    it('should reset form value to null', () => {
      component.form.get(ComboboxControls.Select).setValue('option-1');
      component.reset();

      expect(component.form.get(ComboboxControls.Select).value).toBe(null);
    });

    it('should emit changed event with null value', () => {
      spyOn(component.changed, 'emit');
      component.selected = 'option-1';

      component.reset();

      expect(component.changed.emit).toHaveBeenCalledWith(null);
    });
  });

  describe('Open/Close Handler', () => {
    beforeEach(() => {
      component.filterBy = 'name';
      component.ngOnInit();
    });

    it('should clear input filter when dropdown closes', () => {
      component.filterByInput['name'] = 'test value';
      component.onOpen(false);

      expect(component.filterByInput['name']).toBe('');
    });

    it('should not clear input filter when dropdown opens', () => {
      component.filterByInput['name'] = 'test value';
      component.onOpen(true);

      expect(component.filterByInput['name']).toBe('test value');
    });

    it('should clear input element value when dropdown closes', () => {
      component.ngOnInit();
      const inputEl = component['_inputEl'].nativeElement;
      inputEl.value = 'test value';

      component.onOpen(false);

      expect(inputEl.value).toBe('');
    });
  });

  describe('Format Multiple', () => {
    it('should join multiple values with comma and space', () => {
      const values = ['option-1', 'option-2', 'option-3'];
      const formatted = component.formatMultiple(values);

      expect(formatted).toBe('option-1, option-2, option-3');
    });

    it('should return empty string for empty array', () => {
      const formatted = component.formatMultiple([]);

      expect(formatted).toBe('');
    });

    it('should return empty string for null', () => {
      const formatted = component.formatMultiple(null);

      expect(formatted).toBe('');
    });

    it('should return empty string for undefined', () => {
      const formatted = component.formatMultiple(undefined);

      expect(formatted).toBe('');
    });

    it('should handle single value in array', () => {
      const formatted = component.formatMultiple(['single']);

      expect(formatted).toBe('single');
    });
  });

  describe('Has Options', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return true when select has options', () => {
      component['_matSelect'].options = [{value: 'option-1'} as any];

      expect(component.hasOptions()).toBe(true);
    });

    it('should return false when options array is empty', () => {
      component['_matSelect'].options = [];

      expect(component.hasOptions()).toBe(false);
    });

    it('should return false when matSelect is not initialized', () => {
      component['_matSelect'] = null;

      expect(component.hasOptions()).toBe(false);
    });

    it('should return false when matSelect options is undefined', () => {
      component['_matSelect'].options = undefined;

      expect(component.hasOptions()).toBe(false);
    });
  });

  describe('ControlValueAccessor', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should implement writeValue method', () => {
      component.writeValue('option-1');

      expect(component.selected).toBe('option-1');
      expect(component.form.get(ComboboxControls.Select).value).toBe('option-1');
    });

    it('should write value without triggering change event', () => {
      spyOn(component.changed, 'emit');
      component.writeValue('option-1');

      expect(component.changed.emit).not.toHaveBeenCalled();
    });

    it('should handle array value in writeValue', () => {
      component.writeValue(['option-1', 'option-2']);

      expect(component.selected).toEqual(['option-1', 'option-2']);
    });

    it('should handle null in writeValue', () => {
      component.writeValue(null);

      expect(component.selected).toBe(null);
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should complete unsubscribe subject on destroy', () => {
      spyOn(component['_unsubscribe'], 'next');
      spyOn(component['_unsubscribe'], 'complete');

      component.ngOnDestroy();

      expect(component['_unsubscribe'].next).toHaveBeenCalled();
      expect(component['_unsubscribe'].complete).toHaveBeenCalled();
    });

    it('should unsubscribe from value changes on destroy', () => {
      component.ngOnDestroy();
      spyOn(component.changed, 'emit');

      component.form.get(ComboboxControls.Select).setValue('option-1');

      expect(component.changed.emit).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should update form state on changes', () => {
      component.selected = 'new-option';
      component.ngOnChanges();

      expect(component.form.get(ComboboxControls.Select).value).toBe('new-option');
    });

    it('should update disabled state on changes', () => {
      component.isDisabled = true;
      component.ngOnChanges();

      expect(component.form.disabled).toBe(true);

      component.isDisabled = false;
      component.ngOnChanges();

      expect(component.form.enabled).toBe(true);
    });
  });

  describe('Enum and Constants', () => {
    it('should have ComboboxControls.Select', () => {
      expect(ComboboxControls.Select).toBe('select');
    });

    it('should expose controls in component', () => {
      expect(component.controls).toBe(ComboboxControls);
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should handle basic option selection flow', () => {
      spyOn(component.changed, 'emit');
      component.selected = '';
      component.required = false;
      component.options = [{id: '1', name: 'Option 1'}];
      component.filterBy = 'name';
      component.selectBy = 'id';

      component.form.get(ComboboxControls.Select).setValue('1');

      expect(component.form.get(ComboboxControls.Select).value).toBe('1');
    });

    it('should handle grouped options', () => {
      component.grouped = true;
      component.groups = ['Group A', 'Group B'];
      component.getOptions = (group: string) => {
        const groupMap = {
          'Group A': [{id: '1', name: 'Option A1'}],
          'Group B': [{id: '2', name: 'Option B1'}],
        };
        return groupMap[group] || [];
      };
      component.selectBy = 'id';

      expect(component.grouped).toBe(true);
      expect(component.getOptions('Group A')).toEqual([{id: '1', name: 'Option A1'}]);
    });

    it('should handle multiple selection', () => {
      component.multiple = true;
      component.selected = ['option-1', 'option-2'];
      component.ngOnChanges();

      const formatted = component.formatMultiple(component.selected as string[]);

      expect(formatted).toBe('option-1, option-2');
    });

    it('should handle custom value formatter', () => {
      component.valueFormatter = (val) => {
        if (Array.isArray(val)) {
          return `[${val.length} items]`;
        }
        return `Selected: ${val}`;
      };

      const single = component.valueFormatter('option-1');
      const multiple = component.valueFormatter(['opt1', 'opt2']);

      expect(single).toBe('Selected: option-1');
      expect(multiple).toBe('[2 items]');
    });

    it('should handle required field with validation', () => {
      component.required = true;
      component.ngOnInit();

      const control = component.form.get(ComboboxControls.Select);
      expect(control.hasError('required')).toBe(true);

      control.setValue('option-1');
      expect(control.hasError('required')).toBe(false);
    });

    it('should disable reset button when enableResetButton is false', () => {
      component.enableResetButton = false;
      expect(component.enableResetButton).toBe(false);
    });

    it('should handle complete workflow with filtering and selection', () => {
      component.label = 'Select Provider';
      component.inputLabel = 'Search providers...';
      component.options = [
        {id: 'aws', name: 'Amazon Web Services'},
        {id: 'azure', name: 'Microsoft Azure'},
        {id: 'gcp', name: 'Google Cloud Platform'},
      ];
      component.filterBy = 'name';
      component.selectBy = 'id';

      component.filterByInput['name'] = 'Amazon';
      component.form.get(ComboboxControls.Select).setValue('aws');

      expect(component.form.get(ComboboxControls.Select).value).toBe('aws');
      expect(component.filterByInput['name']).toBe('Amazon');
    });
  });
});
