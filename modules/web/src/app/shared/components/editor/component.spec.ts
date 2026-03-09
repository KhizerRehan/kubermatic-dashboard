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
import {FormsModule} from '@angular/forms';
import {BehaviorSubject} from 'rxjs';

import {EditorComponent, EditorHeaderClass} from './component';
import {ThemeInformerService} from '@core/services/theme-informer';

describe('EditorComponent', () => {
  let fixture: ComponentFixture<EditorComponent>;
  let component: EditorComponent;
  let themeService: jasmine.SpyObj<ThemeInformerService>;
  let isDarkSubject: BehaviorSubject<boolean>;

  beforeEach(() => {
    isDarkSubject = new BehaviorSubject<boolean>(false);
    const themeSpy = jasmine.createSpyObj('ThemeInformerService', [''], {
      isCurrentThemeDark$: isDarkSubject.asObservable(),
    });

    TestBed.configureTestingModule({
      imports: [EditorComponent, FormsModule],
      providers: [{provide: ThemeInformerService, useValue: themeSpy}],
    });

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeInformerService) as jasmine.SpyObj<ThemeInformerService>;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.header).toBe('');
      expect(component.height).toBe('300px');
      expect(component.language).toBe('yaml');
      expect(component.readonly).toBe(false);
      expect(component.placeholder).toBe('');
      expect(component.isFocused).toBe(false);
    });

    it('should initialize with EditorHeaderClass.Dialog as default', () => {
      expect(component.headerClass).toBe(EditorHeaderClass.Dialog);
    });

    it('should set up default options', () => {
      expect(component.options.contextmenu).toBe(false);
      expect(component.options.fontSize).toBe(12);
      expect(component.options.lineNumbersMinChars).toBe(4);
      expect(component.options.minimap.enabled).toBe(false);
      expect(component.options.scrollbar.vertical).toBe('hidden');
      expect(component.options.hideCursorInOverviewRuler).toBe(true);
      expect(component.options.renderLineHighlight).toBe('none');
      expect(component.options.autoIndent).toBe('full');
      expect(component.options.automaticLayout).toBe(true);
      expect(component.options.padding.top).toBe(8);
    });

    it('should apply input values in ngOnInit', () => {
      component.header = 'Edit Configuration';
      component.height = '500px';
      component.language = 'json';
      component.readonly = true;
      component.placeholder = 'Enter JSON here';

      component.ngOnInit();

      expect(component.options.language).toBe('json');
      expect(component.options.readOnly).toBe(true);
      expect(component.options.placeholder).toBe('Enter JSON here');
    });

    it('should convert language to lowercase', () => {
      component.language = 'YAML';
      component.ngOnInit();

      expect(component.options.language).toBe('yaml');
    });

    it('should convert uppercase language code to lowercase', () => {
      component.language = 'JSON';
      component.ngOnInit();

      expect(component.options.language).toBe('json');
    });

    it('should subscribe to theme changes on init', () => {
      component.ngOnInit();

      isDarkSubject.next(true);

      expect(component.options.theme).toBe('vs-dark');

      isDarkSubject.next(false);

      expect(component.options.theme).toBe('vs');
    });

    it('should apply dark theme when theme service emits dark', () => {
      component.ngOnInit();
      isDarkSubject.next(true);

      expect(component.options.theme).toBe('vs-dark');
    });

    it('should apply light theme when theme service emits light', () => {
      component.ngOnInit();
      isDarkSubject.next(false);

      expect(component.options.theme).toBe('vs');
    });
  });

  describe('@Input properties', () => {
    it('should accept header input', () => {
      component.header = 'My Header';
      expect(component.header).toBe('My Header');
    });

    it('should accept height input', () => {
      component.height = '600px';
      expect(component.height).toBe('600px');
    });

    it('should accept language input', () => {
      component.language = 'typescript';
      expect(component.language).toBe('typescript');
    });

    it('should accept readonly input', () => {
      component.readonly = true;
      expect(component.readonly).toBe(true);
    });

    it('should accept placeholder input', () => {
      const placeholder = 'Enter your code here';
      component.placeholder = placeholder;
      expect(component.placeholder).toBe(placeholder);
    });

    it('should accept model input', () => {
      const code = 'console.log("hello")';
      component.model = code;
      expect(component.model).toBe(code);
    });

    it('should accept headerClass input', () => {
      component.headerClass = EditorHeaderClass.Card;
      expect(component.headerClass).toBe(EditorHeaderClass.Card);
    });
  });

  describe('Header Classes', () => {
    it('should return headerClass when not focused', () => {
      component.headerClass = EditorHeaderClass.Dialog;
      component.isFocused = false;

      const classes = component.getHeaderClasses();

      expect(classes).toBe('dialog');
    });

    it('should return headerClass with focused class when focused', () => {
      component.headerClass = EditorHeaderClass.Dialog;
      component.isFocused = true;

      const classes = component.getHeaderClasses();

      expect(classes).toBe('dialog focused');
    });

    it('should return card class when not focused', () => {
      component.headerClass = EditorHeaderClass.Card;
      component.isFocused = false;

      const classes = component.getHeaderClasses();

      expect(classes).toBe('card');
    });

    it('should return card class with focused when focused', () => {
      component.headerClass = EditorHeaderClass.Card;
      component.isFocused = true;

      const classes = component.getHeaderClasses();

      expect(classes).toBe('card focused');
    });

    it('should include focused class only when isFocused is true', () => {
      component.headerClass = EditorHeaderClass.Dialog;
      component.isFocused = false;
      let classes = component.getHeaderClasses();
      expect(classes).not.toContain('focused');

      component.isFocused = true;
      classes = component.getHeaderClasses();
      expect(classes).toContain('focused');
    });
  });

  describe('Editor Events', () => {
    it('should set isFocused to true on focus', () => {
      const mockEditor = {
        onDidFocusEditorText: jasmine.createSpy('onDidFocusEditorText').and.callFake(
          (callback: Function) => {
            callback();
          }
        ),
        onDidBlurEditorText: jasmine.createSpy('onDidBlurEditorText'),
      };

      component.isFocused = false;
      component.onInit(mockEditor);

      expect(component.isFocused).toBe(true);
    });

    it('should set isFocused to false on blur', () => {
      const mockEditor = {
        onDidFocusEditorText: jasmine.createSpy('onDidFocusEditorText'),
        onDidBlurEditorText: jasmine.createSpy('onDidBlurEditorText').and.callFake(
          (callback: Function) => {
            callback();
          }
        ),
      };

      component.isFocused = true;
      component.onInit(mockEditor);

      expect(component.isFocused).toBe(false);
    });

    it('should register focus and blur event listeners', () => {
      const mockEditor = {
        onDidFocusEditorText: jasmine.createSpy('onDidFocusEditorText'),
        onDidBlurEditorText: jasmine.createSpy('onDidBlurEditorText'),
      };

      component.onInit(mockEditor);

      expect(mockEditor.onDidFocusEditorText).toHaveBeenCalled();
      expect(mockEditor.onDidBlurEditorText).toHaveBeenCalled();
    });

    it('should handle focus and blur in sequence', () => {
      const mockEditor = {
        onDidFocusEditorText: jasmine.createSpy('onDidFocusEditorText').and.callFake(
          (callback: Function) => {
            callback();
          }
        ),
        onDidBlurEditorText: jasmine.createSpy('onDidBlurEditorText').and.callFake(
          (callback: Function) => {
            callback();
          }
        ),
      };

      component.isFocused = false;
      component.onInit(mockEditor);

      expect(component.isFocused).toBe(true);

      // Simulate blur by re-registering with blur callback
      component.onInit(mockEditor);
      expect(component.isFocused).toBe(false);
    });
  });

  describe('@Output modelChange', () => {
    it('should emit modelChange event when onChange is called', () => {
      spyOn(component.modelChange, 'emit');
      component.model = 'console.log("test")';

      component.onChange();

      expect(component.modelChange.emit).toHaveBeenCalledWith('console.log("test")');
    });

    it('should emit current model value', () => {
      spyOn(component.modelChange, 'emit');
      const testCode = 'const x = 5;';
      component.model = testCode;

      component.onChange();

      expect(component.modelChange.emit).toHaveBeenCalledWith(testCode);
    });

    it('should emit empty string when model is empty', () => {
      spyOn(component.modelChange, 'emit');
      component.model = '';

      component.onChange();

      expect(component.modelChange.emit).toHaveBeenCalledWith('');
    });

    it('should emit model change with multiline code', () => {
      spyOn(component.modelChange, 'emit');
      const multilineCode = 'function test() {\n  return true;\n}';
      component.model = multilineCode;

      component.onChange();

      expect(component.modelChange.emit).toHaveBeenCalledWith(multilineCode);
    });

    it('should emit updated model after value changes', () => {
      spyOn(component.modelChange, 'emit');
      component.model = 'first';
      component.onChange();

      component.model = 'second';
      component.onChange();

      expect(component.modelChange.emit).toHaveBeenCalledTimes(2);
      expect(component.modelChange.emit).toHaveBeenCalledWith('first');
      expect(component.modelChange.emit).toHaveBeenCalledWith('second');
    });
  });

  describe('Language Support', () => {
    it('should support yaml language', () => {
      component.language = 'yaml';
      component.ngOnInit();

      expect(component.options.language).toBe('yaml');
    });

    it('should support json language', () => {
      component.language = 'json';
      component.ngOnInit();

      expect(component.options.language).toBe('json');
    });

    it('should support typescript language', () => {
      component.language = 'typescript';
      component.ngOnInit();

      expect(component.options.language).toBe('typescript');
    });

    it('should support javascript language', () => {
      component.language = 'javascript';
      component.ngOnInit();

      expect(component.options.language).toBe('javascript');
    });

    it('should support html language', () => {
      component.language = 'html';
      component.ngOnInit();

      expect(component.options.language).toBe('html');
    });

    it('should convert mixed case language to lowercase', () => {
      component.language = 'TyPeScRiPt';
      component.ngOnInit();

      expect(component.options.language).toBe('typescript');
    });
  });

  describe('Readonly Mode', () => {
    it('should apply readonly when readonly is true', () => {
      component.readonly = true;
      component.ngOnInit();

      expect(component.options.readOnly).toBe(true);
    });

    it('should not apply readonly when readonly is false', () => {
      component.readonly = false;
      component.ngOnInit();

      expect(component.options.readOnly).toBe(false);
    });

    it('should update readonly option in ngOnInit', () => {
      component.readonly = false;
      component.ngOnInit();
      expect(component.options.readOnly).toBe(false);

      component.readonly = true;
      component.ngOnInit();
      expect(component.options.readOnly).toBe(true);
    });
  });

  describe('Placeholder', () => {
    it('should set placeholder in options', () => {
      component.placeholder = 'Enter YAML configuration';
      component.ngOnInit();

      expect(component.options.placeholder).toBe('Enter YAML configuration');
    });

    it('should support multiline placeholder', () => {
      const placeholder = 'Line 1\nLine 2\nLine 3';
      component.placeholder = placeholder;
      component.ngOnInit();

      expect(component.options.placeholder).toBe(placeholder);
    });

    it('should handle empty placeholder', () => {
      component.placeholder = '';
      component.ngOnInit();

      expect(component.options.placeholder).toBe('');
    });
  });

  describe('Height Configuration', () => {
    it('should use provided height', () => {
      component.height = '500px';
      expect(component.height).toBe('500px');
    });

    it('should support percentage height', () => {
      component.height = '100%';
      expect(component.height).toBe('100%');
    });

    it('should support em height', () => {
      component.height = '20em';
      expect(component.height).toBe('20em');
    });

    it('should support viewport height', () => {
      component.height = '50vh';
      expect(component.height).toBe('50vh');
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from theme changes on destroy', () => {
      spyOn(component['_unsubscribe'], 'next');
      spyOn(component['_unsubscribe'], 'complete');

      component.ngOnDestroy();

      expect(component['_unsubscribe'].next).toHaveBeenCalled();
      expect(component['_unsubscribe'].complete).toHaveBeenCalled();
    });

    it('should not receive theme updates after destruction', () => {
      component.ngOnInit();
      const initialTheme = component.options.theme;

      component.ngOnDestroy();
      isDarkSubject.next(true);

      // The options.theme should not have been updated due to takeUntil
      expect(component.options.theme).toBe(initialTheme);
    });
  });

  describe('Options Preservation', () => {
    it('should preserve existing options when updating language', () => {
      component.ngOnInit();
      const originalFontSize = component.options.fontSize;

      component.language = 'json';
      component.ngOnInit();

      expect(component.options.fontSize).toBe(originalFontSize);
    });

    it('should preserve existing options when updating readonly', () => {
      component.ngOnInit();
      const originalPadding = component.options.padding.top;

      component.readonly = true;
      component.ngOnInit();

      expect(component.options.padding.top).toBe(originalPadding);
    });

    it('should merge new options with existing options', () => {
      component.ngOnInit();
      const initialOptions = {...component.options};

      component.language = 'json';
      component.ngOnInit();

      // Verify that original options are preserved
      expect(component.options.fontSize).toBe(initialOptions.fontSize);
      expect(component.options.contextmenu).toBe(initialOptions.contextmenu);
    });
  });

  describe('EnumEditorHeaderClass', () => {
    it('should have Card enum value', () => {
      expect(EditorHeaderClass.Card).toBe('card');
    });

    it('should have Dialog enum value', () => {
      expect(EditorHeaderClass.Dialog).toBe('dialog');
    });

    it('should use enum values correctly', () => {
      component.headerClass = EditorHeaderClass.Card;
      expect(component.headerClass).toBe('card');

      component.headerClass = EditorHeaderClass.Dialog;
      expect(component.headerClass).toBe('dialog');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle configuration for YAML editing', () => {
      component.header = 'Edit Manifest';
      component.language = 'yaml';
      component.height = '400px';
      component.readonly = false;
      component.headerClass = EditorHeaderClass.Card;

      component.ngOnInit();

      expect(component.options.language).toBe('yaml');
      expect(component.options.readOnly).toBe(false);
      expect(component.header).toBe('Edit Manifest');
    });

    it('should handle configuration for JSON viewing', () => {
      component.header = 'View Configuration';
      component.language = 'json';
      component.height = '300px';
      component.readonly = true;
      component.headerClass = EditorHeaderClass.Dialog;

      component.ngOnInit();

      expect(component.options.language).toBe('json');
      expect(component.options.readOnly).toBe(true);
    });

    it('should handle theme switching during editing', () => {
      component.ngOnInit();
      component.model = 'test code';

      isDarkSubject.next(false);
      expect(component.options.theme).toBe('vs');

      isDarkSubject.next(true);
      expect(component.options.theme).toBe('vs-dark');

      component.onChange();
      expect(component.model).toBe('test code');
    });

    it('should handle focus state during theme changes', () => {
      component.ngOnInit();
      component.isFocused = false;

      isDarkSubject.next(true);
      let classes = component.getHeaderClasses();
      expect(classes).not.toContain('focused');

      component.isFocused = true;
      classes = component.getHeaderClasses();
      expect(classes).toContain('focused');

      isDarkSubject.next(false);
      classes = component.getHeaderClasses();
      expect(classes).toContain('focused');
    });
  });
});
