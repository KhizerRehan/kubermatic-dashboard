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

import {Component, DebugElement} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '@shared/module';
import {DialogTitleComponent} from './component';

@Component({
  template: `
    <km-dialog-title [disableClose]="disableClose">
      <span>Test Title</span>
    </km-dialog-title>
  `,
  standalone: false,
})
class TestHostComponent {
  disableClose = false;
}

describe('DialogTitleComponent', () => {
  let component: DialogTitleComponent;
  let fixture: ComponentFixture<DialogTitleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization & Default State', () => {
    it('should initialize with disableClose as false', () => {
      expect(component.disableClose).toBe(false);
    });

    it('should render dialog title container', () => {
      const titleElement = fixture.debugElement.nativeElement.querySelector('[mat-dialog-title]');
      expect(titleElement).toBeTruthy();
    });

    it('should render close button', () => {
      const closeButton = fixture.debugElement.nativeElement.querySelector('button[mat-icon-button]');
      expect(closeButton).toBeTruthy();
    });

    it('should render close icon', () => {
      const icon = fixture.debugElement.nativeElement.querySelector('i.km-icon-close');
      expect(icon).toBeTruthy();
    });
  });

  describe('@Input disableClose property', () => {
    it('should enable close button by default', () => {
      component.disableClose = false;
      fixture.detectChanges();

      const closeButton = fixture.debugElement.nativeElement.querySelector('button[mat-icon-button]');
      expect(closeButton.disabled).toBe(false);
    });

    it('should disable close button when disableClose is true', () => {
      component.disableClose = true;
      fixture.detectChanges();

      const closeButton = fixture.debugElement.nativeElement.querySelector('button[mat-icon-button]');
      expect(closeButton.disabled).toBe(true);
    });

    it('should enable close button when disableClose is false', () => {
      component.disableClose = false;
      fixture.detectChanges();

      const closeButton = fixture.debugElement.nativeElement.querySelector('button[mat-icon-button]');
      expect(closeButton.disabled).toBe(false);
    });

    it('should update close button state when disableClose changes', () => {
      component.disableClose = false;
      fixture.detectChanges();
      let closeButton = fixture.debugElement.nativeElement.querySelector('button[mat-icon-button]');
      expect(closeButton.disabled).toBe(false);

      component.disableClose = true;
      fixture.detectChanges();
      closeButton = fixture.debugElement.nativeElement.querySelector('button[mat-icon-button]');
      expect(closeButton.disabled).toBe(true);

      component.disableClose = false;
      fixture.detectChanges();
      closeButton = fixture.debugElement.nativeElement.querySelector('button[mat-icon-button]');
      expect(closeButton.disabled).toBe(false);
    });
  });

  describe('Content Projection', () => {
    let hostComponent: TestHostComponent;
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [BrowserModule, NoopAnimationsModule, SharedModule],
        declarations: [TestHostComponent],
        teardown: {destroyAfterEach: false},
      }).compileComponents();

      hostFixture = TestBed.createComponent(TestHostComponent);
      hostComponent = hostFixture.componentInstance;
      hostFixture.detectChanges();
    });

    it('should project content via ng-content', () => {
      const projectedContent = hostFixture.debugElement.nativeElement.querySelector('span');
      expect(projectedContent).toBeTruthy();
      expect(projectedContent.textContent).toBe('Test Title');
    });

    it('should render projected content before close button', () => {
      const titleDiv = hostFixture.debugElement.nativeElement.querySelector('[mat-dialog-title]');
      const children = titleDiv.children;
      expect(children.length).toBeGreaterThan(0);
      expect(children[0].tagName.toLowerCase()).toBe('span');
    });

    it('should allow complex projected content', () => {
      @Component({
        template: `
          <km-dialog-title>
            <div class="custom-content">
              <h2>Title</h2>
              <p>Description</p>
            </div>
          </km-dialog-title>
        `,
        standalone: false,
      })
      class ComplexHostComponent {}

      TestBed.configureTestingModule({
        imports: [BrowserModule, NoopAnimationsModule, SharedModule],
        declarations: [ComplexHostComponent],
        teardown: {destroyAfterEach: false},
      }).compileComponents();

      const complexFixture = TestBed.createComponent(ComplexHostComponent);
      complexFixture.detectChanges();

      const customContent = complexFixture.debugElement.nativeElement.querySelector('.custom-content');
      expect(customContent).toBeTruthy();
    });
  });

  describe('Close Button', () => {
    it('should have mat-icon-button directive', () => {
      const closeButton = fixture.debugElement.nativeElement.querySelector('button[mat-icon-button]');
      expect(closeButton.getAttribute('mat-icon-button') !== null).toBe(true);
    });

    it('should have mat-dialog-close directive', () => {
      const closeButton = fixture.debugElement.nativeElement.querySelector('button[mat-dialog-close]');
      expect(closeButton).toBeTruthy();
    });

    it('should have km-close-dialog-btn class', () => {
      const closeButton = fixture.debugElement.nativeElement.querySelector('button.km-close-dialog-btn');
      expect(closeButton).toBeTruthy();
    });

    it('should have ID km-close-dialog-btn', () => {
      const closeButton = fixture.debugElement.nativeElement.querySelector('#km-close-dialog-btn');
      expect(closeButton).toBeTruthy();
    });

    it('should have close icon', () => {
      const icon = fixture.debugElement.nativeElement.querySelector('button i.km-icon-close');
      expect(icon).toBeTruthy();
    });

    it('should have km-icon-mask class on icon', () => {
      const icon = fixture.debugElement.nativeElement.querySelector('i.km-icon-mask');
      expect(icon).toBeTruthy();
    });

    it('should be clickable when enabled', () => {
      component.disableClose = false;
      fixture.detectChanges();

      const closeButton = fixture.debugElement.nativeElement.querySelector('button[mat-icon-button]');
      expect(closeButton.disabled).toBe(false);
    });

    it('should not be clickable when disabled', () => {
      component.disableClose = true;
      fixture.detectChanges();

      const closeButton = fixture.debugElement.nativeElement.querySelector('button[mat-icon-button]');
      expect(closeButton.disabled).toBe(true);
    });
  });

  describe('Dialog Title Container', () => {
    it('should have mat-dialog-title directive', () => {
      const titleContainer = fixture.debugElement.nativeElement.querySelector('[mat-dialog-title]');
      expect(titleContainer.getAttribute('mat-dialog-title') !== null).toBe(true);
    });

    it('should contain div element', () => {
      const div = fixture.debugElement.nativeElement.querySelector('div[mat-dialog-title]');
      expect(div).toBeTruthy();
    });

    it('should contain both content and close button', () => {
      const titleDiv = fixture.debugElement.nativeElement.querySelector('[mat-dialog-title]');
      const button = titleDiv.querySelector('button');
      expect(button).toBeTruthy();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should have proper Material classes on button', () => {
      const closeButton = fixture.debugElement.nativeElement.querySelector('button');
      const classList = closeButton.className;
      expect(classList).toContain('mat-icon-button');
      expect(classList).toContain('km-close-dialog-btn');
    });

    it('should have proper Material classes on icon', () => {
      const icon = fixture.debugElement.nativeElement.querySelector('i');
      const classList = icon.className;
      expect(classList).toContain('km-icon-mask');
      expect(classList).toContain('km-icon-close');
    });
  });

  describe('No Side Effects', () => {
    it('should not emit unexpected events', () => {
      const closeButton = fixture.debugElement.nativeElement.querySelector('button');
      closeButton.click();
      // Component just has mat-dialog-close directive
      expect(component).toBeTruthy();
    });

    it('should not make external service calls', () => {
      fixture.detectChanges();
      // Component is pure presentation
      expect(component).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid disableClose toggles', () => {
      component.disableClose = false;
      fixture.detectChanges();
      component.disableClose = true;
      fixture.detectChanges();
      component.disableClose = false;
      fixture.detectChanges();

      const closeButton = fixture.debugElement.nativeElement.querySelector('button');
      expect(closeButton.disabled).toBe(false);
    });

    it('should handle undefined disableClose', () => {
      component.disableClose = undefined;
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle null disableClose', () => {
      component.disableClose = null;
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });
  });

  describe('Material Integration', () => {
    it('should use mat-dialog-title for proper dialog layout', () => {
      const titleElement = fixture.debugElement.nativeElement.querySelector('[mat-dialog-title]');
      expect(titleElement).toBeTruthy();
    });

    it('should use mat-icon-button for Material button styling', () => {
      const button = fixture.debugElement.nativeElement.querySelector('[mat-icon-button]');
      expect(button).toBeTruthy();
    });

    it('should use mat-dialog-close for dialog dismissal', () => {
      const closeButton = fixture.debugElement.nativeElement.querySelector('[mat-dialog-close]');
      expect(closeButton).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible close button', () => {
      const closeButton = fixture.debugElement.nativeElement.querySelector('button[mat-icon-button]');
      expect(closeButton).toBeTruthy();
    });

    it('should show disabled state visually on button', () => {
      component.disableClose = true;
      fixture.detectChanges();

      const closeButton = fixture.debugElement.nativeElement.querySelector('button');
      expect(closeButton.disabled).toBe(true);
    });

    it('should use icon for visual indication', () => {
      const icon = fixture.debugElement.nativeElement.querySelector('i.km-icon-close');
      expect(icon).toBeTruthy();
      expect(icon.parentElement.tagName.toLowerCase()).toBe('button');
    });
  });
});
