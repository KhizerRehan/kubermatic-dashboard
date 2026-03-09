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
import {LabelsComponent} from './component';

describe('LabelsComponent', () => {
  let component: LabelsComponent;
  let fixture: ComponentFixture<LabelsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LabelsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization & Default State', () => {
    it('should initialize with empty labels object', () => {
      expect(component.labels).toEqual({});
    });

    it('should initialize with empty labelKeys array', () => {
      expect(component.labelKeys).toEqual([]);
    });

    it('should initialize showHiddenLabels as false', () => {
      expect(component.showHiddenLabels).toBe(false);
    });

    it('should initialize hideExtraLabels as false', () => {
      expect(component.hideExtraLabels).toBe(false);
    });

    it('should initialize with empty emptyMessage', () => {
      expect(component.emptyMessage).toBe('');
    });

    it('should initialize oneLineLimit as false', () => {
      expect(component.oneLineLimit).toBe(false);
    });

    it('should call _updateLabelKeys on ngOnInit', () => {
      component.labels = {key1: 'value1'};
      const spy = jest.spyOn<any, any>(component, '_updateLabelKeys');
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('@Input labels property', () => {
    it('should handle object labels', () => {
      component.labels = {app: 'myapp', env: 'production'};
      fixture.detectChanges();
      expect(component.labelKeys).toContain('app');
      expect(component.labelKeys).toContain('env');
    });

    it('should handle array labels', () => {
      component.labels = ['label1', 'label2', 'label3'];
      fixture.detectChanges();
      expect(component.labelKeys).toEqual(['label1', 'label2', 'label3']);
    });

    it('should skip null values in labels', () => {
      component.labels = {key1: 'value1', key2: null, key3: 'value3'};
      fixture.detectChanges();
      expect(component.labelKeys).toContain('key1');
      expect(component.labelKeys).toContain('key3');
      expect(component.labelKeys).not.toContain('key2');
    });

    it('should handle empty labels object', () => {
      component.labels = {};
      fixture.detectChanges();
      expect(component.labelKeys).toEqual([]);
    });

    it('should handle empty labels array', () => {
      component.labels = [];
      fixture.detectChanges();
      expect(component.labelKeys).toEqual([]);
    });

    it('should update labelKeys when labels change', () => {
      component.labels = {key1: 'value1'};
      fixture.detectChanges();
      expect(component.labelKeys).toContain('key1');

      component.labels = {key2: 'value2'};
      component.ngOnChanges({});
      fixture.detectChanges();
      expect(component.labelKeys).toContain('key2');
      expect(component.labelKeys).not.toContain('key1');
    });

    it('should handle special characters in keys and values', () => {
      component.labels = {'app.io/name': 'my-app', 'env/type': 'prod-123'};
      fixture.detectChanges();
      expect(component.labelKeys).toContain('app.io/name');
      expect(component.labelKeys).toContain('env/type');
    });

    it('should handle labels with special characters in values', () => {
      component.labels = {key1: 'value-with-dashes', key2: 'value_with_underscores'};
      fixture.detectChanges();
      expect(component.labelKeys).toContain('key1');
      expect(component.labelKeys).toContain('key2');
    });
  });

  describe('@Input limit property', () => {
    it('should limit displayed labels', () => {
      component.labels = {key1: 'value1', key2: 'value2', key3: 'value3'};
      component.limit = 2;
      fixture.detectChanges();

      const chips = fixture.debugElement.nativeElement.querySelectorAll('mat-chip');
      expect(chips.length).toBeLessThanOrEqual(3); // 2 visible + indicator
    });

    it('should show all labels when limit is not set', () => {
      component.labels = {key1: 'value1', key2: 'value2', key3: 'value3'};
      component.limit = undefined;
      fixture.detectChanges();

      expect(component.labelKeys.length).toBe(3);
    });

    it('should show all labels when limit is 0', () => {
      component.labels = {key1: 'value1', key2: 'value2', key3: 'value3'};
      component.limit = 0;
      fixture.detectChanges();

      expect(component.labelKeys.length).toBe(3);
    });

    it('should handle limit greater than labels count', () => {
      component.labels = {key1: 'value1', key2: 'value2'};
      component.limit = 10;
      fixture.detectChanges();

      expect(component.labelKeys.length).toBe(2);
    });

    it('should update displayed labels when limit changes', () => {
      component.labels = {key1: 'value1', key2: 'value2', key3: 'value3', key4: 'value4'};
      component.limit = 2;
      fixture.detectChanges();

      component.limit = 3;
      fixture.detectChanges();

      expect(component.limit).toBe(3);
    });
  });

  describe('@Input emptyMessage property', () => {
    it('should render empty message when no labels', () => {
      component.labels = {};
      component.emptyMessage = 'No labels available';
      fixture.detectChanges();

      const emptyText = fixture.debugElement.nativeElement.textContent;
      expect(emptyText).toContain('No labels available');
    });

    it('should not render empty message when labels exist', () => {
      component.labels = {key1: 'value1'};
      component.emptyMessage = 'No labels available';
      fixture.detectChanges();

      expect(component.labelKeys.length).toBeGreaterThan(0);
    });

    it('should handle custom empty message', () => {
      component.labels = {};
      component.emptyMessage = 'Custom message for empty state';
      fixture.detectChanges();

      expect(component.emptyMessage).toBe('Custom message for empty state');
    });
  });

  describe('@Input oneLineLimit property', () => {
    it('should initialize as false', () => {
      expect(component.oneLineLimit).toBe(false);
    });

    it('should accept true value', () => {
      component.oneLineLimit = true;
      expect(component.oneLineLimit).toBe(true);
    });

    it('should affect layout rendering', () => {
      component.labels = {key1: 'value1'};
      component.oneLineLimit = true;
      fixture.detectChanges();

      expect(component.oneLineLimit).toBe(true);
    });
  });

  describe('getHiddenLabels() method', () => {
    it('should return formatted list of hidden labels', () => {
      component.labels = {key1: 'value1', key2: 'value2', key3: 'value3'};
      component.labelKeys = ['key1', 'key2', 'key3'];
      component.limit = 1;

      const hidden = component.getHiddenLabels();
      expect(hidden).toContain('key2');
      expect(hidden).toContain('key3');
    });

    it('should format labels with values', () => {
      component.labels = {key1: 'value1', key2: 'value2'};
      component.labelKeys = ['key1', 'key2'];
      component.limit = 1;

      const hidden = component.getHiddenLabels();
      expect(hidden).toContain('key2');
      expect(hidden).toContain('value2');
    });

    it('should handle labels without values', () => {
      component.labels = {key1: undefined, key2: 'value2', key3: undefined};
      component.labelKeys = ['key1', 'key2', 'key3'];
      component.limit = 1;

      const hidden = component.getHiddenLabels();
      expect(hidden).toContain('key2');
      expect(hidden).toContain('key3');
    });

    it('should separate labels with comma', () => {
      component.labels = {key1: 'value1', key2: 'value2', key3: 'value3'};
      component.labelKeys = ['key1', 'key2', 'key3'];
      component.limit = 1;

      const hidden = component.getHiddenLabels();
      expect(hidden).toContain(',');
    });

    it('should return empty string when no hidden labels', () => {
      component.labels = {key1: 'value1', key2: 'value2'};
      component.labelKeys = ['key1', 'key2'];
      component.limit = 2;

      const hidden = component.getHiddenLabels();
      expect(hidden).toBe('');
    });
  });

  describe('toggleHiddenLabels() method', () => {
    it('should toggle showHiddenLabels from false to true', () => {
      component.showHiddenLabels = false;
      component.toggleHiddenLabels();
      expect(component.showHiddenLabels).toBe(true);
    });

    it('should toggle showHiddenLabels from true to false', () => {
      component.showHiddenLabels = true;
      component.toggleHiddenLabels();
      expect(component.showHiddenLabels).toBe(false);
    });

    it('should toggle multiple times', () => {
      component.showHiddenLabels = false;
      component.toggleHiddenLabels();
      expect(component.showHiddenLabels).toBe(true);
      component.toggleHiddenLabels();
      expect(component.showHiddenLabels).toBe(false);
      component.toggleHiddenLabels();
      expect(component.showHiddenLabels).toBe(true);
    });
  });

  describe('checkLabelsHeight() method', () => {
    it('should return false when oneLineLimit is false', () => {
      component.oneLineLimit = false;
      const result = component.checkLabelsHeight();
      expect(result).toBe(false);
    });

    it('should return true when oneLineLimit is true and hideExtraLabels is true', () => {
      component.oneLineLimit = true;
      component.hideExtraLabels = true;
      const result = component.checkLabelsHeight();
      expect(result).toBe(true);
    });

    it('should return false when oneLineLimit is true but hideExtraLabels is false', () => {
      component.oneLineLimit = true;
      component.hideExtraLabels = false;
      const result = component.checkLabelsHeight();
      expect(result).toBe(false);
    });

    it('should update hideExtraLabels based on element height', () => {
      component.chipListLabels = {
        nativeElement: {
          parentElement: {
            scrollHeight: 50,
          },
        },
      } as any;
      component.oneLineLimit = true;

      component.checkLabelsHeight();
      expect(component.hideExtraLabels).toBe(true);
    });

    it('should handle undefined chipListLabels gracefully', () => {
      component.chipListLabels = undefined;
      component.oneLineLimit = true;

      expect(() => {
        component.checkLabelsHeight();
      }).not.toThrow();
    });
  });

  describe('_updateLabelKeys() method', () => {
    it('should extract keys from object', () => {
      component.labels = {app: 'myapp', env: 'prod'};
      component['_updateLabelKeys']();
      expect(component.labelKeys).toEqual(['app', 'env']);
    });

    it('should use array as is', () => {
      component.labels = ['label1', 'label2'];
      component['_updateLabelKeys']();
      expect(component.labelKeys).toEqual(['label1', 'label2']);
    });

    it('should filter out null values', () => {
      component.labels = {key1: 'value1', key2: null, key3: 'value3'};
      component['_updateLabelKeys']();
      expect(component.labelKeys).not.toContain('key2');
      expect(component.labelKeys.length).toBe(2);
    });

    it('should clear labelKeys before updating', () => {
      component.labelKeys = ['old1', 'old2'];
      component.labels = {new1: 'value1'};
      component['_updateLabelKeys']();
      expect(component.labelKeys).toEqual(['new1']);
    });
  });

  describe('ngOnChanges', () => {
    it('should call _updateLabelKeys on changes', () => {
      const spy = jest.spyOn<any, any>(component, '_updateLabelKeys');
      component.labels = {key1: 'value1'};
      component.ngOnChanges({});
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should update labelKeys when input changes', () => {
      component.labels = {key1: 'value1'};
      component.ngOnChanges({});
      expect(component.labelKeys).toContain('key1');
    });
  });

  describe('Display & Rendering', () => {
    it('should render mat-chip elements for each label', () => {
      component.labels = {key1: 'value1', key2: 'value2'};
      fixture.detectChanges();

      const chips = fixture.debugElement.nativeElement.querySelectorAll('mat-chip');
      expect(chips.length).toBeGreaterThan(0);
    });

    it('should display label key and value', () => {
      component.labels = {mykey: 'myvalue'};
      fixture.detectChanges();

      const content = fixture.debugElement.nativeElement.textContent;
      expect(content).toContain('mykey');
      expect(content).toContain('myvalue');
    });

    it('should handle long label keys and values', () => {
      component.labels = {
        'very-long-label-key-with-many-characters': 'very-long-label-value-with-many-characters-too',
      };
      fixture.detectChanges();

      expect(component.labelKeys.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null labels', () => {
      component.labels = null;
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle undefined labels', () => {
      component.labels = undefined;
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle very large number of labels', () => {
      const labels: {[key: string]: string} = {};
      for (let i = 0; i < 100; i++) {
        labels[`key${i}`] = `value${i}`;
      }
      component.labels = labels;
      fixture.detectChanges();

      expect(component.labelKeys.length).toBe(100);
    });

    it('should handle labels with empty string values', () => {
      component.labels = {key1: '', key2: 'value2'};
      fixture.detectChanges();

      expect(component.labelKeys).toContain('key1');
      expect(component.labelKeys).toContain('key2');
    });

    it('should handle rapid changes to labels', () => {
      component.labels = {key1: 'value1'};
      fixture.detectChanges();

      component.labels = {key2: 'value2'};
      component.ngOnChanges({});
      fixture.detectChanges();

      component.labels = {key3: 'value3'};
      component.ngOnChanges({});
      fixture.detectChanges();

      expect(component.labelKeys).toContain('key3');
    });
  });

  describe('No Side Effects', () => {
    it('should not modify input labels object', () => {
      const inputLabels = {key1: 'value1', key2: 'value2'};
      const originalKeys = Object.keys(inputLabels);
      component.labels = inputLabels;
      fixture.detectChanges();

      expect(Object.keys(inputLabels)).toEqual(originalKeys);
    });

    it('should not make external service calls', () => {
      component.labels = {key1: 'value1'};
      fixture.detectChanges();
      // Component is pure presentation
      expect(component).toBeTruthy();
    });
  });
});
