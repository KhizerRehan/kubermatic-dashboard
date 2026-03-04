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

import {ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {ReactiveFormsModule, FormBuilder} from '@angular/forms';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatChipsModule, MatChipInputEvent} from '@angular/material/chips';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {COMMA, ENTER, SPACE} from '@angular/cdk/keycodes';

import {ChipAutocompleteComponent} from './component';
import {SharedModule} from '../../module';

describe('ChipAutocompleteComponent', () => {
  let fixture: ComponentFixture<ChipAutocompleteComponent>;
  let component: ChipAutocompleteComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ChipAutocompleteComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatChipsModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        SharedModule,
      ],
      providers: [FormBuilder],
    });

    fixture = TestBed.createComponent(ChipAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
      expect(component.title).toBeUndefined();
      expect(component.tags).toEqual([]);
      expect(component.disabled).toBe(false);
      expect(component.required).toBe(false);
      expect(component.pattern).toBeUndefined();
      expect(component.placeholder).toBe('Select single or multiple values');
      expect(component.description).toBe('Use comma, enter or space key as the separator.');
      expect(component.patternError).toBe('Invalid pattern');
    });

    it('should initialize selectedTags as empty array', () => {
      expect(component.selectedTags).toEqual([]);
    });

    it('should initialize filteredTags as empty array', () => {
      expect(component.filteredTags).toEqual([]);
    });

    it('should create form group in ngOnInit', () => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('filter')).toBeTruthy();
      expect(component.form.get('tags')).toBeTruthy();
    });

    it('should set separator key codes', () => {
      expect(component.separatorKeysCodes).toContain(ENTER);
      expect(component.separatorKeysCodes).toContain(COMMA);
      expect(component.separatorKeysCodes).toContain(SPACE);
    });

    it('should disable tags control if disabled input is true', () => {
      component.disabled = true;
      component.ngOnInit();

      expect(component.form.get('tags').disabled).toBe(true);
    });

    it('should enable tags control if disabled input is false', () => {
      component.disabled = false;
      component.ngOnInit();

      expect(component.form.get('tags').enabled).toBe(true);
    });
  });

  describe('@Input properties', () => {
    it('should accept label input', () => {
      component.label = 'Tags';
      expect(component.label).toBe('Tags');
    });

    it('should accept title input', () => {
      component.title = 'Add Tags';
      expect(component.title).toBe('Add Tags');
    });

    it('should accept tags input', () => {
      const tags = ['tag1', 'tag2', 'tag3'];
      component.tags = tags;
      expect(component.tags).toEqual(tags);
    });

    it('should accept disabled input', () => {
      component.disabled = true;
      expect(component.disabled).toBe(true);
    });

    it('should accept required input', () => {
      component.required = true;
      expect(component.required).toBe(true);
    });

    it('should accept pattern input', () => {
      component.pattern = '^[a-z]+$';
      expect(component.pattern).toBe('^[a-z]+$');
    });

    it('should accept placeholder input', () => {
      component.placeholder = 'Enter tags...';
      expect(component.placeholder).toBe('Enter tags...');
    });

    it('should accept description input', () => {
      component.description = 'Custom description';
      expect(component.description).toBe('Custom description');
    });

    it('should accept patternError input', () => {
      component.patternError = 'Lowercase letters only';
      expect(component.patternError).toBe('Lowercase letters only');
    });
  });

  describe('Add Tag', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should add tag from input event', () => {
      const mockEvent: Partial<MatChipInputEvent> = {
        value: 'new-tag',
        chipInput: {
          clear: jasmine.createSpy('clear'),
        } as any,
      };

      component.addTag(mockEvent as MatChipInputEvent);

      expect(component.selectedTags).toContain('new-tag');
    });

    it('should trim whitespace from tag', () => {
      const mockEvent: Partial<MatChipInputEvent> = {
        value: '  tag-with-spaces  ',
        chipInput: {
          clear: jasmine.createSpy('clear'),
        } as any,
      };

      component.addTag(mockEvent as MatChipInputEvent);

      expect(component.selectedTags).toContain('tag-with-spaces');
    });

    it('should not add empty tag', () => {
      const mockEvent: Partial<MatChipInputEvent> = {
        value: '',
        chipInput: {
          clear: jasmine.createSpy('clear'),
        } as any,
      };

      component.addTag(mockEvent as MatChipInputEvent);

      expect(component.selectedTags.length).toBe(0);
    });

    it('should not add tag with only whitespace', () => {
      const mockEvent: Partial<MatChipInputEvent> = {
        value: '   ',
        chipInput: {
          clear: jasmine.createSpy('clear'),
        } as any,
      };

      component.addTag(mockEvent as MatChipInputEvent);

      expect(component.selectedTags.length).toBe(0);
    });

    it('should clear input after adding tag', () => {
      const clearSpy = jasmine.createSpy('clear');
      const mockEvent: Partial<MatChipInputEvent> = {
        value: 'new-tag',
        chipInput: {
          clear: clearSpy,
        } as any,
      };

      component.addTag(mockEvent as MatChipInputEvent);

      expect(clearSpy).toHaveBeenCalled();
    });

    it('should emit onChange after adding tag', () => {
      spyOn(component.onChange, 'emit');
      const mockEvent: Partial<MatChipInputEvent> = {
        value: 'new-tag',
        chipInput: {
          clear: jasmine.createSpy('clear'),
        } as any,
      };

      component.addTag(mockEvent as MatChipInputEvent);

      expect(component.onChange.emit).toHaveBeenCalledWith(['new-tag']);
    });

    it('should add multiple tags sequentially', () => {
      const clearSpy = jasmine.createSpy('clear');
      const mockEvent: Partial<MatChipInputEvent> = {
        value: '',
        chipInput: {
          clear: clearSpy,
        } as any,
      };

      mockEvent.value = 'tag1';
      component.addTag(mockEvent as MatChipInputEvent);

      mockEvent.value = 'tag2';
      component.addTag(mockEvent as MatChipInputEvent);

      expect(component.selectedTags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('Remove Tag', () => {
    beforeEach(() => {
      component.ngOnInit();
      component.selectedTags = ['tag1', 'tag2', 'tag3'];
    });

    it('should remove tag by value', () => {
      component.removeTag('tag2');

      expect(component.selectedTags).toEqual(['tag1', 'tag3']);
    });

    it('should emit onChange after removing tag', () => {
      spyOn(component.onChange, 'emit');
      component.removeTag('tag2');

      expect(component.onChange.emit).toHaveBeenCalled();
    });

    it('should handle removing non-existent tag', () => {
      component.removeTag('non-existent');

      expect(component.selectedTags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should remove first occurrence of duplicate tag', () => {
      component.selectedTags = ['tag1', 'tag2', 'tag1'];
      component.removeTag('tag1');

      expect(component.selectedTags).toEqual(['tag2', 'tag1']);
    });

    it('should remove last tag', () => {
      component.selectedTags = ['tag1'];
      component.removeTag('tag1');

      expect(component.selectedTags).toEqual([]);
    });
  });

  describe('Autocomplete Selection', () => {
    beforeEach(() => {
      component.ngOnInit();
      component.tagInput = {
        nativeElement: {
          value: 'some text',
        },
      };
    });

    it('should add tag from autocomplete selection', () => {
      const mockEvent: Partial<MatAutocompleteSelectedEvent> = {
        option: {
          viewValue: 'selected-tag',
        } as any,
      };

      component.selected(mockEvent as MatAutocompleteSelectedEvent);

      expect(component.selectedTags).toContain('selected-tag');
    });

    it('should clear input after autocomplete selection', () => {
      const mockEvent: Partial<MatAutocompleteSelectedEvent> = {
        option: {
          viewValue: 'selected-tag',
        } as any,
      };

      component.selected(mockEvent as MatAutocompleteSelectedEvent);

      expect(component.tagInput.nativeElement.value).toBe('');
    });

    it('should emit onChange after autocomplete selection', () => {
      spyOn(component.onChange, 'emit');
      const mockEvent: Partial<MatAutocompleteSelectedEvent> = {
        option: {
          viewValue: 'selected-tag',
        } as any,
      };

      component.selected(mockEvent as MatAutocompleteSelectedEvent);

      expect(component.onChange.emit).toHaveBeenCalled();
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      component.tags = ['apple', 'apricot', 'banana', 'cherry'];
      component.ngOnInit();
    });

    it('should filter tags case-insensitively', fakeAsync(() => {
      component.form.get('filter').setValue('APP');
      tick(250); // debounceTime

      expect(component.filteredTags).toEqual(['apple', 'apricot']);
    }));

    it('should return all tags when filter is empty', fakeAsync(() => {
      component.form.get('filter').setValue('');
      tick(250);

      expect(component.filteredTags).toEqual(['apple', 'apricot', 'banana', 'cherry']);
    }));

    it('should exclude selected tags from filtered list', fakeAsync(() => {
      component.selectedTags = ['apple'];
      component.form.get('filter').setValue('a');
      tick(250);

      expect(component.filteredTags).toContain('apricot');
      expect(component.filteredTags).not.toContain('apple');
    }));

    it('should support partial matching', fakeAsync(() => {
      component.form.get('filter').setValue('err');
      tick(250);

      expect(component.filteredTags).toEqual(['cherry'];
    }));

    it('should return empty array for non-matching filter', fakeAsync(() => {
      component.form.get('filter').setValue('xyz');
      tick(250);

      expect(component.filteredTags).toEqual([]);
    }));

    it('should apply debounce before filtering', fakeAsync(() => {
      const filterSpy = spyOn<any>(component, '_filter').and.callThrough();

      component.form.get('filter').setValue('a');
      tick(100); // Less than debounce time
      tick(100);
      tick(51); // Total: 251ms - exceeds debounce

      expect(filterSpy).toHaveBeenCalled();
    }));
  });

  describe('Tag Change Detection', () => {
    it('should update filtered tags when tags input changes', () => {
      component.ngOnInit();
      component.selectedTags = ['tag1'];
      component.tags = ['tag1', 'tag2', 'tag3'];

      component.ngOnChanges({
        tags: {
          currentValue: ['tag1', 'tag2', 'tag3'],
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.filteredTags).toEqual(['tag2', 'tag3']);
    });

    it('should not include selected tags in filtered tags', () => {
      component.ngOnInit();
      component.selectedTags = ['tag1', 'tag2'];
      component.tags = ['tag1', 'tag2', 'tag3', 'tag4'];

      component.ngOnChanges({
        tags: {
          currentValue: ['tag1', 'tag2', 'tag3', 'tag4'],
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.filteredTags).toEqual(['tag3', 'tag4']);
    });
  });

  describe('Disabled State Management', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should disable form control when disabled changes to true', () => {
      component.disabled = false;
      component.ngOnChanges({
        disabled: {
          currentValue: true,
          previousValue: false,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.form.get('tags').disabled).toBe(true);
    });

    it('should enable form control when disabled changes to false', () => {
      component.disabled = true;
      component.form.get('tags').disable();

      component.disabled = false;
      component.ngOnChanges({
        disabled: {
          currentValue: false,
          previousValue: true,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.form.get('tags').enabled).toBe(true);
    });

    it('should clear validators when disabled', () => {
      spyOn(component.form.get('tags'), 'clearValidators');
      component.disabled = true;
      component.ngOnChanges({
        disabled: {
          currentValue: true,
          previousValue: false,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.form.get('tags').clearValidators).toHaveBeenCalled();
    });

    it('should restore validators when enabled', () => {
      component.disabled = true;
      component.form.get('tags').disable();

      spyOn(component.form.get('tags'), 'setValidators');
      component.disabled = false;
      component.ngOnChanges({
        disabled: {
          currentValue: false,
          previousValue: true,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.form.get('tags').setValidators).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should validate as required when required is true and no tags selected', () => {
      component.required = true;
      component.ngOnInit();

      const control = component.form.get('tags');
      expect(control.hasError('required')).toBe(true);
    });

    it('should validate as valid when required is false', () => {
      component.required = false;
      component.ngOnInit();

      const control = component.form.get('tags');
      expect(control.hasError('required')).toBe(false);
    });

    it('should validate unique tags', () => {
      component.ngOnInit();
      component.selectedTags = ['tag1', 'tag2'];
      component.form.get('tags').setValue(['tag1', 'tag2']);

      const errors = component.validate(null);
      expect(errors).toBeNull();
    });

    it('should validate pattern when pattern is provided', () => {
      component.pattern = '^[a-z]+$';
      component.ngOnInit();

      component.form.get('tags').setValue(['validtag']);
      let errors = component.validate(null);
      expect(errors).toBeNull();

      component.form.get('tags').setValue(['InvalidTag']);
      errors = component.validate(null);
      expect(errors).toBeTruthy();
    });

    it('should return form errors from validate method', () => {
      component.required = true;
      component.ngOnInit();

      const errors = component.validate(null);
      expect(errors).toBeTruthy();
    });

    it('should return null when form is valid', () => {
      component.required = false;
      component.ngOnInit();
      component.selectedTags = ['tag1'];
      component.form.get('tags').setValue(['tag1']);

      const errors = component.validate(null);
      expect(errors).toBeNull();
    });
  });

  describe('ControlValueAccessor', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should implement writeValue method', () => {
      const tags = ['tag1', 'tag2', 'tag3'];
      component.writeValue(tags);

      expect(component.selectedTags).toEqual(tags);
    });

    it('should set form value without emitting events', () => {
      spyOn(component.onChange, 'emit');
      const tags = ['tag1', 'tag2'];
      component.writeValue(tags);

      expect(component.form.get('tags').value).toEqual(tags);
    });

    it('should handle null value in writeValue', () => {
      component.writeValue(null);

      expect(component.selectedTags).toEqual(null);
    });

    it('should register onChange callback', () => {
      const mockCallback = jasmine.createSpy('callback');
      component.registerOnChange(mockCallback);

      component.form.get('tags').setValue(['tag1']);

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should implement registerOnTouched', () => {
      const mockCallback = jasmine.createSpy('callback');
      expect(() => component.registerOnTouched(mockCallback)).not.toThrow();
    });
  });

  describe('Lifecycle Cleanup', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should complete unsubscribe on destroy', () => {
      spyOn(component['_unsubscribe'], 'next');
      spyOn(component['_unsubscribe'], 'complete');

      component.ngOnDestroy();

      expect(component['_unsubscribe'].next).toHaveBeenCalled();
      expect(component['_unsubscribe'].complete).toHaveBeenCalled();
    });

    it('should unsubscribe from filter changes on destroy', fakeAsync(() => {
      spyOn(component.onChange, 'emit');
      component.ngOnDestroy();

      component.form.get('filter').setValue('test');
      tick(300);

      expect(component.onChange.emit).not.toHaveBeenCalled();
    }));
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      component.tags = ['javascript', 'typescript', 'angular', 'react', 'vue'];
      component.ngOnInit();
    });

    it('should handle complete workflow: filter, select, add, remove', fakeAsync(() => {
      // Filter for 'script' tags
      component.form.get('filter').setValue('script');
      tick(250);

      expect(component.filteredTags).toContain('javascript');
      expect(component.filteredTags).toContain('typescript');

      // Add from list
      const mockEvent: Partial<MatChipInputEvent> = {
        value: 'javascript',
        chipInput: {clear: jasmine.createSpy('clear')} as any,
      };
      component.addTag(mockEvent as MatChipInputEvent);

      expect(component.selectedTags).toContain('javascript');

      // Clear filter
      component.form.get('filter').setValue('');
      tick(250);

      // Should exclude selected tag
      expect(component.filteredTags).not.toContain('javascript');

      // Remove tag
      component.removeTag('javascript');

      expect(component.selectedTags).not.toContain('javascript');
    }));

    it('should handle required field validation workflow', () => {
      component.required = true;
      component.pattern = '^[a-z]+$';
      component.ngOnInit();

      let errors = component.validate(null);
      expect(errors).toBeTruthy();

      // Add valid tag
      component.selectedTags = ['valid'];
      component.form.get('tags').setValue(['valid']);

      errors = component.validate(null);
      expect(errors).toBeNull();
    });

    it('should handle multiple tag addition scenarios', () => {
      spyOn(component.onChange, 'emit');

      // Add via input
      let mockEvent: Partial<MatChipInputEvent> = {
        value: 'new-tag1',
        chipInput: {clear: jasmine.createSpy('clear')} as any,
      };
      component.addTag(mockEvent as MatChipInputEvent);

      expect(component.selectedTags).toContain('new-tag1');

      // Add via autocomplete
      component.tagInput = {nativeElement: {value: 'test'}};
      let autocompleteEvent: Partial<MatAutocompleteSelectedEvent> = {
        option: {viewValue: 'angular'} as any,
      };
      component.selected(autocompleteEvent as MatAutocompleteSelectedEvent);

      expect(component.selectedTags).toContain('angular');

      // Remove one
      component.removeTag('new-tag1');

      expect(component.selectedTags).toContain('angular');
      expect(component.selectedTags).not.toContain('new-tag1');
    });

    it('should maintain form state during disable/enable', () => {
      component.selectedTags = ['tag1', 'tag2'];
      component.form.get('tags').setValue(['tag1', 'tag2']);

      component.disabled = true;
      component.ngOnChanges({
        disabled: {
          currentValue: true,
          previousValue: false,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.form.get('tags').disabled).toBe(true);
      expect(component.selectedTags).toEqual(['tag1', 'tag2']);

      component.disabled = false;
      component.ngOnChanges({
        disabled: {
          currentValue: false,
          previousValue: true,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.form.get('tags').enabled).toBe(true);
      expect(component.selectedTags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should handle empty tags array', () => {
      component.tags = [];
      component.ngOnChanges({
        tags: {
          currentValue: [],
          previousValue: ['tag1'],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.filteredTags).toEqual([]);
    });

    it('should handle special characters in tags', () => {
      component.tags = ['tag@1', 'tag#2', 'tag.3', 'tag-4'];
      component.ngOnInit();

      const mockEvent: Partial<MatChipInputEvent> = {
        value: 'tag@1',
        chipInput: {clear: jasmine.createSpy('clear')} as any,
      };
      component.addTag(mockEvent as MatChipInputEvent);

      expect(component.selectedTags).toContain('tag@1');
    });

    it('should handle very long tag values', () => {
      const longTag = 'a'.repeat(500);
      const mockEvent: Partial<MatChipInputEvent> = {
        value: longTag,
        chipInput: {clear: jasmine.createSpy('clear')} as any,
      };
      component.addTag(mockEvent as MatChipInputEvent);

      expect(component.selectedTags).toContain(longTag);
    });

    it('should handle case-insensitive filtering', fakeAsync(() => {
      component.tags = ['Tag', 'TAG', 'tag'];
      component.ngOnInit();

      component.form.get('filter').setValue('TAG');
      tick(250);

      expect(component.filteredTags.length).toBe(3);
    }));

    it('should handle null tags array gracefully', () => {
      component.tags = null as any;
      component.ngOnChanges({
        tags: {
          currentValue: null,
          previousValue: ['tag1'],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.filteredTags).toEqual([]);
    });
  });
});
