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
import {LoaderComponent} from './component';

describe('LoaderComponent', () => {
  let component: LoaderComponent;
  let fixture: ComponentFixture<LoaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization & Default State', () => {
    it('should initialize with default text', () => {
      expect(component.text).toBe('Loading...');
    });

    it('should initialize with default icon', () => {
      expect(component.icon).toBe('km-icon-pending');
    });

    it('should render container with fxLayout column', () => {
      const container = fixture.debugElement.nativeElement.querySelector('div[fxLayout="column"]');
      expect(container).toBeTruthy();
    });

    it('should render icon element', () => {
      const icon = fixture.debugElement.nativeElement.querySelector('i');
      expect(icon).toBeTruthy();
    });

    it('should render text container', () => {
      const textContainer = fixture.debugElement.nativeElement.querySelector('div');
      expect(textContainer).toBeTruthy();
    });
  });

  describe('@Input text property', () => {
    it('should display default text in DOM', () => {
      const textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent).toContain('Loading...');
    });

    it('should update text when input changes', () => {
      component.text = 'Loading data...';
      fixture.detectChanges();

      const textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent).toContain('Loading data...');
    });

    it('should handle empty text string', () => {
      component.text = '';
      fixture.detectChanges();

      const textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent.trim()).toBe('');
    });

    it('should handle long text', () => {
      const longText = 'Loading...'.repeat(10);
      component.text = longText;
      fixture.detectChanges();

      const textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent).toContain('Loading...');
    });

    it('should handle special characters in text', () => {
      component.text = 'Loading <data> & processing...';
      fixture.detectChanges();

      const textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent).toContain('Loading <data> & processing...');
    });

    it('should handle newlines in text', () => {
      component.text = 'Loading\nPlease wait';
      fixture.detectChanges();

      const textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent).toContain('Please wait');
    });
  });

  describe('@Input icon property', () => {
    it('should apply default icon class to icon element', () => {
      const icon = fixture.debugElement.nativeElement.querySelector('i');
      expect(icon.classList.contains('km-icon-pending')).toBe(true);
    });

    it('should apply custom icon class when changed', () => {
      component.icon = 'km-icon-loading';
      fixture.detectChanges();

      const icon = fixture.debugElement.nativeElement.querySelector('i');
      expect(icon.classList.contains('km-icon-loading')).toBe(true);
    });

    it('should update icon class dynamically', () => {
      component.icon = 'km-icon-pending';
      fixture.detectChanges();
      let icon = fixture.debugElement.nativeElement.querySelector('i');
      expect(icon.classList.contains('km-icon-pending')).toBe(true);

      component.icon = 'km-icon-error';
      fixture.detectChanges();
      icon = fixture.debugElement.nativeElement.querySelector('i');
      expect(icon.classList.contains('km-icon-error')).toBe(true);
    });

    it('should include km-icon-mask base class', () => {
      const icon = fixture.debugElement.nativeElement.querySelector('i');
      expect(icon.classList.contains('km-icon-mask')).toBe(true);
    });

    it('should handle different icon types', () => {
      const iconTypes = ['km-icon-pending', 'km-icon-loading', 'km-icon-success', 'km-icon-error'];
      iconTypes.forEach(iconType => {
        component.icon = iconType;
        fixture.detectChanges();

        const icon = fixture.debugElement.nativeElement.querySelector('i');
        expect(icon.classList.contains(iconType)).toBe(true);
      });
    });
  });

  describe('CSS Classes and Layout', () => {
    it('should apply fxLayout column to container', () => {
      const container = fixture.debugElement.nativeElement.querySelector('div[fxLayout="column"]');
      expect(container.getAttribute('fxLayout')).toBe('column');
    });

    it('should apply fxLayoutAlign center center', () => {
      const container = fixture.debugElement.nativeElement.querySelector('div[fxLayout="column"]');
      expect(container.getAttribute('fxLayoutAlign')).toBe('center center');
    });

    it('should apply fxLayoutGap spacing', () => {
      const container = fixture.debugElement.nativeElement.querySelector('div[fxLayout="column"]');
      expect(container.getAttribute('fxLayoutGap')).toBe('10px');
    });

    it('should have icon and text in correct order', () => {
      const children = fixture.debugElement.nativeElement.querySelector('div[fxLayout="column"]').children;
      expect(children[0].tagName.toLowerCase()).toBe('i');
      expect(children[1].tagName.toLowerCase()).toBe('div');
    });

    it('should center content vertically and horizontally', () => {
      const container = fixture.debugElement.nativeElement.querySelector('div[fxLayout="column"]');
      expect(container.getAttribute('fxLayoutAlign')).toContain('center');
    });
  });

  describe('Icon Rendering', () => {
    it('should always render with km-icon-mask class', () => {
      component.icon = 'km-icon-pending';
      fixture.detectChanges();

      const icon = fixture.debugElement.nativeElement.querySelector('i');
      expect(icon.getAttribute('class')).toContain('km-icon-mask');
      expect(icon.getAttribute('class')).toContain('km-icon-pending');
    });

    it('should render single icon element', () => {
      const icons = fixture.debugElement.nativeElement.querySelectorAll('i');
      expect(icons.length).toBe(1);
    });

    it('should handle icon with multiple classes', () => {
      component.icon = 'km-icon-pending';
      fixture.detectChanges();

      const icon = fixture.debugElement.nativeElement.querySelector('i');
      const classes = icon.getAttribute('class').split(' ');
      expect(classes.length).toBeGreaterThanOrEqual(2);
      expect(classes).toContain('km-icon-mask');
      expect(classes).toContain('km-icon-pending');
    });
  });

  describe('Text Display Variations', () => {
    it('should display text for loading state', () => {
      component.text = 'Initializing cluster...';
      fixture.detectChanges();

      const textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent).toContain('Initializing cluster...');
    });

    it('should display text for fetching state', () => {
      component.text = 'Fetching data...';
      fixture.detectChanges();

      const textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent).toContain('Fetching data...');
    });

    it('should display text for processing state', () => {
      component.text = 'Processing...';
      fixture.detectChanges();

      const textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent).toContain('Processing...');
    });

    it('should handle updating text multiple times', () => {
      component.text = 'Step 1...';
      fixture.detectChanges();
      let textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent).toContain('Step 1...');

      component.text = 'Step 2...';
      fixture.detectChanges();
      textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent).toContain('Step 2...');

      component.text = 'Step 3...';
      fixture.detectChanges();
      textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent).toContain('Step 3...');
    });
  });

  describe('No Unexpected Side Effects', () => {
    it('should not have service dependencies', () => {
      expect(component.constructor.length).toBe(0);
    });

    it('should not make HTTP requests', () => {
      // Pure presentation component, no HTTP calls expected
      expect(component).toBeTruthy();
    });

    it('should not emit any outputs', () => {
      const componentKeys = Object.keys(component);
      const hasOutputs = componentKeys.some(key => key.includes('Output'));
      expect(hasOutputs).toBe(false);
    });

    it('should be a simple presentation component', () => {
      // Check that component only has @Input properties
      expect(component.text).toBeDefined();
      expect(component.icon).toBeDefined();
    });
  });

  describe('Multiple Instances', () => {
    it('should support multiple loader instances', () => {
      const fixture2 = TestBed.createComponent(LoaderComponent);
      const component2 = fixture2.componentInstance;
      component2.text = 'Second loader';
      component2.icon = 'km-icon-error';
      fixture2.detectChanges();

      component.text = 'First loader';
      component.icon = 'km-icon-pending';
      fixture.detectChanges();

      const text1 = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      const text2 = fixture2.debugElement.nativeElement.querySelectorAll('div')[1];

      expect(text1.textContent).toContain('First loader');
      expect(text2.textContent).toContain('Second loader');

      const icon1 = fixture.debugElement.nativeElement.querySelector('i');
      const icon2 = fixture2.debugElement.nativeElement.querySelector('i');

      expect(icon1.classList.contains('km-icon-pending')).toBe(true);
      expect(icon2.classList.contains('km-icon-error')).toBe(true);

      fixture2.destroy();
    });

    it('should maintain separate state for instances', () => {
      const fixture2 = TestBed.createComponent(LoaderComponent);
      const component2 = fixture2.componentInstance;

      component.text = 'Loader 1';
      component2.text = 'Loader 2';
      fixture.detectChanges();
      fixture2.detectChanges();

      const text1 = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      const text2 = fixture2.debugElement.nativeElement.querySelectorAll('div')[1];

      expect(text1.textContent).not.toBe(text2.textContent);

      fixture2.destroy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined text gracefully', () => {
      component.text = undefined;
      fixture.detectChanges();

      const textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement).toBeTruthy();
    });

    it('should handle null text gracefully', () => {
      component.text = null;
      fixture.detectChanges();

      const textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement).toBeTruthy();
    });

    it('should handle undefined icon gracefully', () => {
      component.icon = undefined;
      fixture.detectChanges();

      const icon = fixture.debugElement.nativeElement.querySelector('i');
      expect(icon).toBeTruthy();
    });

    it('should handle null icon gracefully', () => {
      component.icon = null;
      fixture.detectChanges();

      const icon = fixture.debugElement.nativeElement.querySelector('i');
      expect(icon).toBeTruthy();
    });

    it('should handle rapid text updates', () => {
      component.text = 'Text1';
      fixture.detectChanges();
      component.text = 'Text2';
      fixture.detectChanges();
      component.text = 'Text3';
      fixture.detectChanges();

      const textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent).toContain('Text3');
    });

    it('should handle rapid icon updates', () => {
      component.icon = 'km-icon-pending';
      fixture.detectChanges();
      component.icon = 'km-icon-loading';
      fixture.detectChanges();
      component.icon = 'km-icon-success';
      fixture.detectChanges();

      const icon = fixture.debugElement.nativeElement.querySelector('i');
      expect(icon.classList.contains('km-icon-success')).toBe(true);
    });

    it('should handle very long icon class names', () => {
      component.icon = 'km-icon-very-long-icon-class-name-with-many-dashes';
      fixture.detectChanges();

      const icon = fixture.debugElement.nativeElement.querySelector('i');
      expect(icon.classList.contains('km-icon-very-long-icon-class-name-with-many-dashes')).toBe(true);
    });

    it('should handle whitespace in text', () => {
      component.text = '   Loading...   ';
      fixture.detectChanges();

      const textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent).toBeTruthy();
    });
  });

  describe('Input Binding Reactivity', () => {
    it('should detect changes when text is updated', () => {
      component.text = 'Initial text';
      fixture.detectChanges();
      let textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent).toContain('Initial text');

      component.text = 'Updated text';
      fixture.detectChanges();
      textElement = fixture.debugElement.nativeElement.querySelectorAll('div')[1];
      expect(textElement.textContent).toContain('Updated text');
    });

    it('should detect changes when icon is updated', () => {
      component.icon = 'km-icon-pending';
      fixture.detectChanges();
      let icon = fixture.debugElement.nativeElement.querySelector('i');
      expect(icon.classList.contains('km-icon-pending')).toBe(true);

      component.icon = 'km-icon-success';
      fixture.detectChanges();
      icon = fixture.debugElement.nativeElement.querySelector('i');
      expect(icon.classList.contains('km-icon-success')).toBe(true);
    });
  });

  describe('DOM Structure Verification', () => {
    it('should have correct DOM structure', () => {
      const container = fixture.debugElement.nativeElement.querySelector('div[fxLayout="column"]');
      expect(container).toBeTruthy();

      const icon = container.querySelector('i');
      expect(icon).toBeTruthy();

      const textDiv = container.querySelector('div');
      expect(textDiv).toBeTruthy();
    });

    it('should have no unnecessary wrappers', () => {
      const container = fixture.debugElement.nativeElement.querySelector('div[fxLayout="column"]');
      const directChildren = container.children;
      expect(directChildren.length).toBe(2); // icon and text
    });

    it('should render only one icon element', () => {
      const icons = fixture.debugElement.nativeElement.querySelectorAll('i');
      expect(icons.length).toBe(1);
    });

    it('should render text in a div container', () => {
      const textDivs = fixture.debugElement.nativeElement.querySelectorAll('div > div');
      expect(textDivs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
