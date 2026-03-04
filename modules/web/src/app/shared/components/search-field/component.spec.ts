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

import {SharedModule} from '@shared/module';
import {SearchFieldComponent} from './component';

describe('SearchFieldComponent', () => {
  let component: SearchFieldComponent;
  let fixture: ComponentFixture<SearchFieldComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize form group with query control', () => {
      expect(component.formGroup).toBeTruthy();
      expect(component.formGroup.get('query')).toBeTruthy();
    });

    it('should initialize query control with empty value', () => {
      expect(component.formGroup.get('query').value).toBe('');
    });

    it('should be marked as empty initially', () => {
      expect(component.isEmpty()).toBe(true);
    });
  });

  describe('isEmpty() method', () => {
    it('should return true when query control is empty', () => {
      component.formGroup.get('query').setValue('');
      expect(component.isEmpty()).toBe(true);
    });

    it('should return false when query control has value', () => {
      component.formGroup.get('query').setValue('search term');
      expect(component.isEmpty()).toBe(false);
    });

    it('should return true when query control value is null', () => {
      component.formGroup.get('query').setValue(null);
      expect(component.isEmpty()).toBe(true);
    });
  });

  describe('clear() method', () => {
    it('should reset query control value to empty string', () => {
      component.formGroup.get('query').setValue('search term');
      component.clear();
      expect(component.formGroup.get('query').value).toBe('');
    });

    it('should mark field as empty after clear', () => {
      component.formGroup.get('query').setValue('search term');
      component.clear();
      expect(component.isEmpty()).toBe(true);
    });
  });

  describe('queryChange EventEmitter', () => {
    it('should emit queryChange when value changes', (done) => {
      const testValue = 'test query';
      component.queryChange.subscribe((value) => {
        expect(value).toBe(testValue);
        done();
      });

      component.formGroup.get('query').setValue(testValue);
    });

    it('should emit empty string when value is null', (done) => {
      component.queryChange.subscribe((value) => {
        expect(value).toBe('');
        done();
      });

      component.formGroup.get('query').setValue(null);
    });

    it('should emit on each value change', (done) => {
      const emittedValues: string[] = [];
      const subscription = component.queryChange.subscribe((value) => {
        emittedValues.push(value);
        if (emittedValues.length === 2) {
          expect(emittedValues).toEqual(['first', 'second']);
          subscription.unsubscribe();
          done();
        }
      });

      component.formGroup.get('query').setValue('first');
      component.formGroup.get('query').setValue('second');
    });
  });

  describe('Clear button', () => {
    it('should render clear button when not empty', () => {
      component.formGroup.get('query').setValue('search');
      fixture.detectChanges();

      const clearButton = fixture.debugElement.nativeElement.querySelector(
        'button[matSuffix]'
      );
      expect(clearButton).toBeTruthy();
    });

    it('should not render clear button when empty', () => {
      component.formGroup.get('query').setValue('');
      fixture.detectChanges();

      const clearButton = fixture.debugElement.nativeElement.querySelector(
        'button[matSuffix]'
      );
      expect(clearButton).toBeFalsy();
    });

    it('should clear value when clear button clicked', () => {
      component.formGroup.get('query').setValue('search');
      fixture.detectChanges();

      const clearButton = fixture.debugElement.nativeElement.querySelector(
        'button[matSuffix]'
      );
      clearButton.click();
      fixture.detectChanges();

      expect(component.formGroup.get('query').value).toBe('');
      expect(component.isEmpty()).toBe(true);
    });
  });

  describe('Input field', () => {
    it('should have search input field', () => {
      const input = fixture.debugElement.nativeElement.querySelector(
        'input[matInput]'
      );
      expect(input).toBeTruthy();
    });

    it('should have correct input attributes', () => {
      const input = fixture.debugElement.nativeElement.querySelector(
        'input[matInput]'
      );
      expect(input.getAttribute('type')).toBe('text');
      expect(input.getAttribute('placeholder')).toBe('Search');
      expect(input.getAttribute('autocomplete')).toBe('off');
    });

    it('should update form control value when input changes', () => {
      const input = fixture.debugElement.nativeElement.querySelector(
        'input[matInput]'
      );
      input.value = 'test search';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(component.formGroup.get('query').value).toBe('test search');
    });

    it('should display form control value in input', () => {
      component.formGroup.get('query').setValue('displayed value');
      fixture.detectChanges();

      const input = fixture.debugElement.nativeElement.querySelector(
        'input[matInput]'
      );
      expect(input.value).toBe('displayed value');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on clear button', () => {
      component.formGroup.get('query').setValue('search');
      fixture.detectChanges();

      const clearButton = fixture.debugElement.nativeElement.querySelector(
        'button[matSuffix]'
      );
      expect(clearButton.getAttribute('aria-label')).toBe('Clear');
    });

    it('should have search icon with appropriate classes', () => {
      const icon = fixture.debugElement.nativeElement.querySelector(
        'i[matPrefix]'
      );
      expect(icon).toBeTruthy();
      expect(icon.classList.contains('km-icon-mask')).toBe(true);
      expect(icon.classList.contains('km-icon-search')).toBe(true);
    });
  });

  describe('Component cleanup', () => {
    it('should unsubscribe from form changes on destroy', () => {
      const subscription = component['_subscription'];
      jest.spyOn(subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscription.unsubscribe).toHaveBeenCalled();
    });

    it('should not emit after component destroyed', (done) => {
      const subscription = component.queryChange.subscribe(() => {
        done.fail('Should not emit after destroy');
      });

      component.ngOnDestroy();
      component.formGroup.get('query').setValue('after destroy');

      // Give async operations time to fail
      setTimeout(() => {
        subscription.unsubscribe();
        done();
      }, 100);
    });
  });
});
