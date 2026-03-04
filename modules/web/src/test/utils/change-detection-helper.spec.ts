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
import {Component, ChangeDetectionStrategy, Input, ChangeDetectorRef, OnInit} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ChangeDetectionHelper} from './change-detection-helper';

// Test component with OnPush strategy
@Component({
  selector: 'km-test-on-push',
  template: `<div>{{ data.name }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class OnPushTestComponent implements OnInit {
  @Input() data: any;

  processedData: any;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.processedData = this.data;
  }

  manualDetection(): void {
    this.cdr.markForCheck();
  }
}

// Test component without OnPush (default strategy)
@Component({
  selector: 'km-test-default',
  template: `<div>{{ data.name }}</div>`,
})
class DefaultStrategyTestComponent {
  @Input() data: any;
}

describe('ChangeDetectionHelper', () => {
  describe('detectChanges()', () => {
    let fixture: ComponentFixture<OnPushTestComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [OnPushTestComponent],
        imports: [NoopAnimationsModule],
      }).compileComponents();

      fixture = TestBed.createComponent(OnPushTestComponent);
    });

    it('should trigger change detection', () => {
      const component = fixture.componentInstance;
      component.data = {name: 'Test'};

      ChangeDetectionHelper.detectChanges(fixture);

      expect(fixture.nativeElement.textContent).toContain('Test');
    });

    it('should support async tick', fakeAsync(() => {
      const component = fixture.componentInstance;
      component.data = {name: 'AsyncTest'};

      ChangeDetectionHelper.detectChanges(fixture, 100);
      tick(100);

      expect(fixture.nativeElement.textContent).toContain('AsyncTest');
    }));

    it('should handle multiple detections', () => {
      const component = fixture.componentInstance;

      component.data = {name: 'First'};
      ChangeDetectionHelper.detectChanges(fixture);
      expect(fixture.nativeElement.textContent).toContain('First');

      component.data = {name: 'Second'};
      ChangeDetectionHelper.detectChanges(fixture);
      expect(fixture.nativeElement.textContent).toContain('Second');
    });
  });

  describe('markForCheck()', () => {
    let fixture: ComponentFixture<OnPushTestComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [OnPushTestComponent],
        imports: [NoopAnimationsModule],
      }).compileComponents();

      fixture = TestBed.createComponent(OnPushTestComponent);
    });

    it('should mark component for check', () => {
      const component = fixture.componentInstance;
      component.data = {name: 'Marked'};

      ChangeDetectionHelper.markForCheck(component);

      expect(fixture.nativeElement.textContent).toContain('Marked');
    });

    it('should work with OnPush components', () => {
      const component = fixture.componentInstance;
      component.data = {name: 'OnPushTest'};

      ChangeDetectionHelper.markForCheck(component);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('OnPushTest');
    });
  });

  describe('hasOnPushStrategy()', () => {
    let onPushFixture: ComponentFixture<OnPushTestComponent>;
    let defaultFixture: ComponentFixture<DefaultStrategyTestComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [OnPushTestComponent, DefaultStrategyTestComponent],
        imports: [NoopAnimationsModule],
      }).compileComponents();

      onPushFixture = TestBed.createComponent(OnPushTestComponent);
      defaultFixture = TestBed.createComponent(DefaultStrategyTestComponent);
    });

    it('should detect OnPush strategy', () => {
      const component = onPushFixture.componentInstance;
      expect(ChangeDetectionHelper.hasOnPushStrategy(component)).toBe(true);
    });

    it('should detect default strategy', () => {
      const component = defaultFixture.componentInstance;
      expect(ChangeDetectionHelper.hasOnPushStrategy(component)).toBe(false);
    });

    it('should return false for non-component objects', () => {
      const obj = {someProperty: 'value'};
      expect(ChangeDetectionHelper.hasOnPushStrategy(obj)).toBe(false);
    });
  });

  describe('setInputAndDetect()', () => {
    let fixture: ComponentFixture<OnPushTestComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [OnPushTestComponent],
        imports: [NoopAnimationsModule],
      }).compileComponents();

      fixture = TestBed.createComponent(OnPushTestComponent);
    });

    it('should set input property and trigger detection', () => {
      ChangeDetectionHelper.setInputAndDetect(fixture, fixture.componentInstance, {
        data: {name: 'SetInput'},
      });

      expect(fixture.componentInstance.data.name).toBe('SetInput');
      expect(fixture.nativeElement.textContent).toContain('SetInput');
    });

    it('should set multiple inputs', () => {
      @Component({
        selector: 'km-test-multi-input',
        template: `<div>{{ first }} - {{ second }}</div>`,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class MultiInputComponent {
        @Input() first: string = '';
        @Input() second: string = '';
      }

      TestBed.configureTestingModule({
        declarations: [MultiInputComponent],
        imports: [NoopAnimationsModule],
      });

      const multiFixture = TestBed.createComponent(MultiInputComponent);
      ChangeDetectionHelper.setInputAndDetect(multiFixture, multiFixture.componentInstance, {
        first: 'Hello',
        second: 'World',
      });

      expect(multiFixture.nativeElement.textContent).toContain('Hello - World');
    });

    it('should skip detection if detectChanges is false', () => {
      fixture.componentInstance.data = {name: 'NoDetect'};

      ChangeDetectionHelper.setInputAndDetect(
        fixture,
        fixture.componentInstance,
        {data: {name: 'Test'}},
        false
      );

      // Content should not have updated without detectChanges
      expect(fixture.nativeElement.textContent).not.toContain('Test');
    });
  });

  describe('testInputReactivity()', () => {
    let fixture: ComponentFixture<OnPushTestComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [OnPushTestComponent],
        imports: [NoopAnimationsModule],
      }).compileComponents();

      fixture = TestBed.createComponent(OnPushTestComponent);
    });

    it('should verify component reacts to input changes', () => {
      const component = fixture.componentInstance;
      const inputChanges = [
        {data: {name: 'First'}},
        {data: {name: 'Second'}},
        {data: {name: 'Third'}},
      ];

      const isReactive = ChangeDetectionHelper.testInputReactivity(fixture, component, inputChanges);

      expect(isReactive).toBe(true);
    });

    it('should detect non-reactive components', () => {
      const component = fixture.componentInstance;

      // Set initial data
      fixture.componentInstance.data = {name: 'Initial'};
      fixture.detectChanges();

      // Input changes that won't trigger OnPush (same reference)
      const inputChanges = [{data: {name: 'Same'}}];

      const isReactive = ChangeDetectionHelper.testInputReactivity(fixture, component, inputChanges);

      expect(isReactive).toBe(false);
    });
  });

  describe('verifyOnPushSemantics()', () => {
    let fixture: ComponentFixture<OnPushTestComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [OnPushTestComponent],
        imports: [NoopAnimationsModule],
      }).compileComponents();

      fixture = TestBed.createComponent(OnPushTestComponent);
    });

    it('should verify OnPush semantics are respected', () => {
      fixture.componentInstance.data = {name: 'Initial'};
      fixture.detectChanges();

      const originalText = fixture.nativeElement.textContent;

      ChangeDetectionHelper.verifyOnPushSemantics(fixture, () => {
        // In-place modification (should NOT trigger detection)
        if (fixture.componentInstance.data) {
          fixture.componentInstance.data.name = 'Modified';
        }
        fixture.detectChanges();
      });

      // Verify in-place modification didn't update view
      expect(fixture.nativeElement.textContent).toBe(originalText);
    });

    it('should detect when OnPush semantics are not followed', () => {
      fixture.componentInstance.data = {name: 'Initial'};
      fixture.detectChanges();

      // This should detect the violation (new reference will cause update)
      ChangeDetectionHelper.verifyOnPushSemantics(fixture, () => {
        fixture.componentInstance.data = {name: 'NewReference'};
        fixture.detectChanges();
      });

      // New reference WILL update the view
      expect(fixture.nativeElement.textContent).toContain('NewReference');
    });
  });

  describe('getCompiledHtml()', () => {
    let fixture: ComponentFixture<OnPushTestComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [OnPushTestComponent],
        imports: [NoopAnimationsModule],
      }).compileComponents();

      fixture = TestBed.createComponent(OnPushTestComponent);
    });

    it('should get compiled HTML content', () => {
      fixture.componentInstance.data = {name: 'TestHTML'};
      fixture.detectChanges();

      const html = ChangeDetectionHelper.getCompiledHtml(fixture);

      expect(html).toContain('TestHTML');
      expect(typeof html).toBe('string');
    });

    it('should include all rendered elements', () => {
      @Component({
        selector: 'km-test-html',
        template: `
          <div class="container">
            <span>{{ data.name }}</span>
            <button>Click me</button>
          </div>
        `,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class HtmlTestComponent {
        @Input() data: any = {};
      }

      TestBed.configureTestingModule({
        declarations: [HtmlTestComponent],
        imports: [NoopAnimationsModule],
      });

      const htmlFixture = TestBed.createComponent(HtmlTestComponent);
      htmlFixture.componentInstance.data = {name: 'Content'};
      htmlFixture.detectChanges();

      const html = ChangeDetectionHelper.getCompiledHtml(htmlFixture);

      expect(html).toContain('container');
      expect(html).toContain('Content');
      expect(html).toContain('Click me');
    });
  });

  describe('getText()', () => {
    let fixture: ComponentFixture<OnPushTestComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [OnPushTestComponent],
        imports: [NoopAnimationsModule],
      }).compileComponents();

      fixture = TestBed.createComponent(OnPushTestComponent);
    });

    it('should get text content', () => {
      fixture.componentInstance.data = {name: 'TextContent'};
      fixture.detectChanges();

      const text = ChangeDetectionHelper.getText(fixture);

      expect(text).toContain('TextContent');
    });

    it('should get text with selector', () => {
      @Component({
        selector: 'km-test-selector',
        template: `
          <div class="message">{{ data.name }}</div>
          <div class="other">Other text</div>
        `,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class SelectorTestComponent {
        @Input() data: any = {};
      }

      TestBed.configureTestingModule({
        declarations: [SelectorTestComponent],
        imports: [NoopAnimationsModule],
      });

      const selectorFixture = TestBed.createComponent(SelectorTestComponent);
      selectorFixture.componentInstance.data = {name: 'SelectedText'};
      selectorFixture.detectChanges();

      const text = ChangeDetectionHelper.getText(selectorFixture, '.message');

      expect(text).toContain('SelectedText');
      expect(text).not.toContain('Other text');
    });
  });

  describe('Integration scenarios', () => {
    let fixture: ComponentFixture<OnPushTestComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [OnPushTestComponent],
        imports: [NoopAnimationsModule],
      }).compileComponents();

      fixture = TestBed.createComponent(OnPushTestComponent);
    });

    it('should verify complete OnPush component workflow', () => {
      // Verify component uses OnPush
      expect(ChangeDetectionHelper.hasOnPushStrategy(fixture.componentInstance)).toBe(true);

      // Set input and verify detection
      ChangeDetectionHelper.setInputAndDetect(fixture, fixture.componentInstance, {
        data: {name: 'Workflow'},
      });

      expect(ChangeDetectionHelper.getText(fixture)).toContain('Workflow');

      // Verify in-place modifications don't trigger detection
      fixture.componentInstance.data.name = 'Modified';
      fixture.detectChanges();

      expect(ChangeDetectionHelper.getText(fixture)).toContain('Workflow');
      expect(ChangeDetectionHelper.getText(fixture)).not.toContain('Modified');
    });

    it('should test reactive input updates', fakeAsync(() => {
      const component = fixture.componentInstance;

      // Initial set
      ChangeDetectionHelper.setInputAndDetect(fixture, component, {
        data: {name: 'Initial'},
      });
      expect(ChangeDetectionHelper.getText(fixture)).toContain('Initial');

      // Update with async
      ChangeDetectionHelper.setInputAndDetect(fixture, component, {
        data: {name: 'Updated'},
      });
      tick();

      expect(ChangeDetectionHelper.getText(fixture)).toContain('Updated');

      // Another update
      ChangeDetectionHelper.setInputAndDetect(fixture, component, {
        data: {name: 'FinalUpdate'},
      });

      expect(ChangeDetectionHelper.getText(fixture)).toContain('FinalUpdate');
    }));

    it('should handle complex data structures', () => {
      const complexData = {
        name: 'Complex',
        nested: {
          level1: {
            level2: 'DeepValue',
          },
        },
        array: [1, 2, 3],
      };

      ChangeDetectionHelper.setInputAndDetect(fixture, fixture.componentInstance, {
        data: complexData,
      });

      expect(fixture.componentInstance.data.nested.level1.level2).toBe('DeepValue');
      expect(ChangeDetectionHelper.getText(fixture)).toContain('Complex');
    });
  });
});
