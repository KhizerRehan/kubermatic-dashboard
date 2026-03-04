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
import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {FixtureHelper} from './fixture-helper';

@Component({
  selector: 'test-component',
  template: `
    <div class="container">
      <h1 data-cy="title">{{ title }}</h1>
      <input type="text" data-cy="email-input" [(ngModel)]="email" />
      <select [(ngModel)]="selectedOption" data-cy="select-input">
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </select>
      <button data-cy="submit-btn" [disabled]="isLoading" (click)="onSubmit()">Submit</button>
      <div *ngIf="showMessage" class="message" data-cy="message">{{ message }}</div>
      <ul class="list">
        <li *ngFor="let item of items" class="list-item">{{ item }}</li>
      </ul>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestComponent {
  @Input() title = 'Test Title';
  email = '';
  selectedOption = 'option1';
  isLoading = false;
  showMessage = false;
  message = '';
  items: string[] = [];

  onSubmit(): void {
    this.isLoading = true;
  }
}

describe('FixtureHelper', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [FormsModule],
      teardown: {destroyAfterEach: false},
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('getComponent', () => {
    it('should return component instance', () => {
      const comp = FixtureHelper.getComponent(fixture);
      expect(comp).toBe(component);
    });

    it('should return typed component', () => {
      const comp = FixtureHelper.getComponent<TestComponent>(fixture);
      expect(comp.title).toBe('Test Title');
    });
  });

  describe('querySelector', () => {
    it('should find element by class selector', () => {
      const container = FixtureHelper.querySelector(fixture, '.container');
      expect(container).toBeTruthy();
    });

    it('should find element by data-cy attribute', () => {
      const title = FixtureHelper.querySelector(fixture, '[data-cy="title"]');
      expect(title?.textContent).toContain('Test Title');
    });

    it('should return null if element not found', () => {
      const notFound = FixtureHelper.querySelector(fixture, '.nonexistent');
      expect(notFound).toBeNull();
    });

    it('should work with tag and class selectors', () => {
      const button = FixtureHelper.querySelector(fixture, 'button.btn');
      expect(button).toBeNull(); // Component doesn't have class 'btn'

      const actualButton = FixtureHelper.querySelector(fixture, 'button');
      expect(actualButton).toBeTruthy();
    });
  });

  describe('querySelectorAll', () => {
    it('should find all matching elements', () => {
      component.items = ['Item 1', 'Item 2', 'Item 3'];
      fixture.detectChanges();

      const items = FixtureHelper.querySelectorAll(fixture, '.list-item');
      expect(items.length).toBe(3);
    });

    it('should return empty list if no matches', () => {
      const items = FixtureHelper.querySelectorAll(fixture, '.nonexistent');
      expect(items.length).toBe(0);
    });

    it('should return NodeList of HTMLElements', () => {
      component.items = ['Item 1', 'Item 2'];
      fixture.detectChanges();

      const items = FixtureHelper.querySelectorAll(fixture, '.list-item');
      expect(items instanceof NodeList).toBe(true);
      expect(items[0] instanceof HTMLElement).toBe(true);
    });
  });

  describe('getByDataCy', () => {
    it('should find element by data-cy attribute', () => {
      const title = FixtureHelper.getByDataCy(fixture, 'title');
      expect(title?.textContent).toContain('Test Title');
    });

    it('should return null if data-cy not found', () => {
      const notFound = FixtureHelper.getByDataCy(fixture, 'nonexistent');
      expect(notFound).toBeNull();
    });

    it('should be more readable than full selector', () => {
      const btn = FixtureHelper.getByDataCy(fixture, 'submit-btn');
      expect(btn?.tagName).toBe('BUTTON');
    });
  });

  describe('triggerClick', () => {
    it('should trigger click event by selector', () => {
      spyOn(component, 'onSubmit');

      FixtureHelper.triggerClick(fixture, 'button');
      fixture.detectChanges();

      expect(component.onSubmit).toHaveBeenCalled();
    });

    it('should trigger click event by element reference', () => {
      spyOn(component, 'onSubmit');
      const button = FixtureHelper.querySelector(fixture, 'button') as HTMLButtonElement;

      FixtureHelper.triggerClick(fixture, button);
      fixture.detectChanges();

      expect(component.onSubmit).toHaveBeenCalled();
    });

    it('should do nothing if element not found', () => {
      spyOn(component, 'onSubmit');

      FixtureHelper.triggerClick(fixture, '.nonexistent');
      fixture.detectChanges();

      expect(component.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('triggerInputChange', () => {
    it('should update input value by selector', () => {
      FixtureHelper.triggerInputChange(fixture, '[data-cy="email-input"]', 'test@example.com');
      fixture.detectChanges();

      expect(component.email).toBe('test@example.com');
    });

    it('should update input value by element reference', () => {
      const input = FixtureHelper.querySelector(fixture, '[data-cy="email-input"]') as HTMLInputElement;

      FixtureHelper.triggerInputChange(fixture, input, 'test@example.com');
      fixture.detectChanges();

      expect(component.email).toBe('test@example.com');
    });

    it('should dispatch input and change events', () => {
      const input = FixtureHelper.querySelector(fixture, '[data-cy="email-input"]') as HTMLInputElement;
      let inputEventFired = false;
      let changeEventFired = false;

      input.addEventListener('input', () => (inputEventFired = true));
      input.addEventListener('change', () => (changeEventFired = true));

      FixtureHelper.triggerInputChange(fixture, input, 'value');

      expect(inputEventFired).toBe(true);
      expect(changeEventFired).toBe(true);
    });

    it('should trigger event without changing value if value not provided', () => {
      const input = FixtureHelper.querySelector(fixture, '[data-cy="email-input"]') as HTMLInputElement;
      input.value = 'existing@example.com';

      let eventFired = false;
      input.addEventListener('input', () => (eventFired = true));

      FixtureHelper.triggerInputChange(fixture, input);

      expect(eventFired).toBe(true);
      expect(input.value).toBe('existing@example.com');
    });
  });

  describe('triggerSelectChange', () => {
    it('should update select value by selector', () => {
      FixtureHelper.triggerSelectChange(fixture, '[data-cy="select-input"]', 'option2');
      fixture.detectChanges();

      expect(component.selectedOption).toBe('option2');
    });

    it('should update select value by element reference', () => {
      const select = FixtureHelper.querySelector(fixture, '[data-cy="select-input"]') as HTMLSelectElement;

      FixtureHelper.triggerSelectChange(fixture, select, 'option2');
      fixture.detectChanges();

      expect(component.selectedOption).toBe('option2');
    });

    it('should dispatch change event', () => {
      const select = FixtureHelper.querySelector(fixture, '[data-cy="select-input"]') as HTMLSelectElement;
      let eventFired = false;

      select.addEventListener('change', () => (eventFired = true));

      FixtureHelper.triggerSelectChange(fixture, select, 'option2');

      expect(eventFired).toBe(true);
    });
  });

  describe('isVisible', () => {
    it('should return true for visible element', () => {
      component.showMessage = true;
      fixture.detectChanges();

      const visible = FixtureHelper.isVisible(fixture, '[data-cy="message"]');
      expect(visible).toBe(true);
    });

    it('should return false for hidden element', () => {
      component.showMessage = false;
      fixture.detectChanges();

      const visible = FixtureHelper.isVisible(fixture, '[data-cy="message"]');
      expect(visible).toBe(false);
    });

    it('should return false if element not found', () => {
      const visible = FixtureHelper.isVisible(fixture, '.nonexistent');
      expect(visible).toBe(false);
    });

    it('should work with element reference', () => {
      component.showMessage = true;
      fixture.detectChanges();

      const message = FixtureHelper.querySelector(fixture, '[data-cy="message"]') as HTMLElement;
      const visible = FixtureHelper.isVisible(fixture, message);
      expect(visible).toBe(true);
    });
  });

  describe('isDisabled', () => {
    it('should return true for disabled button', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const disabled = FixtureHelper.isDisabled(fixture, '[data-cy="submit-btn"]');
      expect(disabled).toBe(true);
    });

    it('should return false for enabled button', () => {
      component.isLoading = false;
      fixture.detectChanges();

      const disabled = FixtureHelper.isDisabled(fixture, '[data-cy="submit-btn"]');
      expect(disabled).toBe(false);
    });

    it('should return false if element not found', () => {
      const disabled = FixtureHelper.isDisabled(fixture, '.nonexistent');
      expect(disabled).toBe(false);
    });

    it('should work with element reference', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const button = FixtureHelper.querySelector(fixture, 'button') as HTMLElement;
      const disabled = FixtureHelper.isDisabled(fixture, button);
      expect(disabled).toBe(true);
    });
  });

  describe('getText', () => {
    it('should get text from element by selector', () => {
      const text = FixtureHelper.getText(fixture, '[data-cy="title"]');
      expect(text).toBe('Test Title');
    });

    it('should get text from element reference', () => {
      const title = FixtureHelper.querySelector(fixture, '[data-cy="title"]') as HTMLElement;
      const text = FixtureHelper.getText(fixture, title);
      expect(text).toBe('Test Title');
    });

    it('should return empty string if element not found', () => {
      const text = FixtureHelper.getText(fixture, '.nonexistent');
      expect(text).toBe('');
    });

    it('should return text from fixture root if no selector provided', () => {
      const text = FixtureHelper.getText(fixture);
      expect(text).toContain('Test Title');
      expect(text).toContain('Submit');
    });

    it('should trim whitespace', () => {
      component.title = '  Whitespace Title  ';
      fixture.detectChanges();

      const text = FixtureHelper.getText(fixture, '[data-cy="title"]');
      expect(text).toBe('Whitespace Title');
    });
  });

  describe('detectChanges', () => {
    it('should trigger change detection', () => {
      component.title = 'New Title';
      FixtureHelper.detectChanges(fixture);

      const text = FixtureHelper.getText(fixture, '[data-cy="title"]');
      expect(text).toBe('New Title');
    });
  });

  describe('setInputs', () => {
    it('should set component inputs', () => {
      FixtureHelper.setInputs(fixture, {
        title: 'Updated Title',
      });

      expect(component.title).toBe('Updated Title');
    });

    it('should detect changes by default', () => {
      FixtureHelper.setInputs(fixture, {
        title: 'Updated Title',
      });

      const text = FixtureHelper.getText(fixture, '[data-cy="title"]');
      expect(text).toBe('Updated Title');
    });

    it('should skip change detection if specified', () => {
      FixtureHelper.setInputs(
        fixture,
        {
          title: 'Updated Title',
        },
        false
      );

      // Text won't be updated because detectChanges wasn't called
      const text = FixtureHelper.getText(fixture, '[data-cy="title"]');
      expect(text).toBe('Test Title');
    });

    it('should set multiple inputs at once', () => {
      FixtureHelper.setInputs(fixture, {
        title: 'New Title',
        showMessage: true,
        message: 'Hello',
      });

      expect(component.title).toBe('New Title');
      expect(component.showMessage).toBe(true);
      expect(component.message).toBe('Hello');
    });
  });

  describe('textContains', () => {
    it('should return true if text contains substring', () => {
      const contains = FixtureHelper.textContains(fixture, '[data-cy="title"]', 'Test');
      expect(contains).toBe(true);
    });

    it('should return false if text does not contain substring', () => {
      const contains = FixtureHelper.textContains(fixture, '[data-cy="title"]', 'NotFound');
      expect(contains).toBe(false);
    });

    it('should work with element reference', () => {
      const title = FixtureHelper.querySelector(fixture, '[data-cy="title"]') as HTMLElement;
      const contains = FixtureHelper.textContains(fixture, title, 'Title');
      expect(contains).toBe(true);
    });

    it('should be case sensitive', () => {
      const contains = FixtureHelper.textContains(fixture, '[data-cy="title"]', 'test');
      expect(contains).toBe(false);

      const containsCorreseCase = FixtureHelper.textContains(fixture, '[data-cy="title"]', 'Test');
      expect(containsCorreseCase).toBe(true);
    });

    it('should return false if element not found', () => {
      const contains = FixtureHelper.textContains(fixture, '.nonexistent', 'anything');
      expect(contains).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete user interaction flow', () => {
      // User types email
      FixtureHelper.triggerInputChange(fixture, '[data-cy="email-input"]', 'user@example.com');
      fixture.detectChanges();

      expect(component.email).toBe('user@example.com');

      // User selects option
      FixtureHelper.triggerSelectChange(fixture, '[data-cy="select-input"]', 'option2');
      fixture.detectChanges();

      expect(component.selectedOption).toBe('option2');

      // User clicks button
      FixtureHelper.triggerClick(fixture, '[data-cy="submit-btn"]');
      fixture.detectChanges();

      // Verify button is now disabled
      expect(FixtureHelper.isDisabled(fixture, '[data-cy="submit-btn"]')).toBe(true);
    });

    it('should verify component output with multiple helper methods', () => {
      FixtureHelper.setInputs(fixture, {
        showMessage: true,
        message: 'Operation completed successfully',
      });

      expect(FixtureHelper.isVisible(fixture, '[data-cy="message"]')).toBe(true);
      expect(FixtureHelper.textContains(fixture, '[data-cy="message"]', 'successfully')).toBe(true);
      expect(FixtureHelper.getText(fixture, '[data-cy="message"]')).toContain('Operation');
    });
  });
});
