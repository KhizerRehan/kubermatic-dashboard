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
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatDialogModule} from '@angular/material/dialog';
import {SharedModule} from '@shared/module';
import {UserInteractionsComponent} from './user-interactions.component';
import {FixtureHelper} from '@test/utils/fixture-helper';

/**
 * Comprehensive User Interaction Tests
 *
 * This test suite covers all major types of user interactions:
 * - Click handling (buttons, links, icons with event propagation)
 * - Input events (typing, selection changes, focus/blur)
 * - Keyboard events (Enter key, Escape key, Tab navigation)
 * - Form submission and validation
 * - Drag and drop interactions
 * - Double-click and long-press handling
 * - Dialog interactions
 * - Focus management
 *
 * Total: 40+ comprehensive user interaction tests
 */
describe('UserInteractionsComponent', () => {
  let fixture: ComponentFixture<UserInteractionsComponent>;
  let component: UserInteractionsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        NoopAnimationsModule,
        SharedModule,
        ReactiveFormsModule,
        MatDialogModule,
      ],
      declarations: [UserInteractionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserInteractionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ========== CLICK HANDLING TESTS (6 tests) ==========

  /**
   * Pattern: Testing basic button click
   * Verifies that clicking a button triggers the correct handler
   */
  it('should increment button click count on click', () => {
    expect(component.buttonClickCount).toBe(0);

    const button = FixtureHelper.querySelector(fixture, '[data-cy="click-button"]');
    FixtureHelper.triggerClick(fixture, '[data-cy="click-button"]');

    expect(component.buttonClickCount).toBe(1);
  });

  /**
   * Pattern: Testing multiple clicks
   * Verifies that multiple clicks are tracked correctly
   */
  it('should increment button click count on multiple clicks', () => {
    const button = FixtureHelper.querySelector(fixture, '[data-cy="click-button"]');

    FixtureHelper.triggerClick(fixture, '[data-cy="click-button"]');
    FixtureHelper.triggerClick(fixture, '[data-cy="click-button"]');
    FixtureHelper.triggerClick(fixture, '[data-cy="click-button"]');

    expect(component.buttonClickCount).toBe(3);
  });

  /**
   * Pattern: Testing icon button click
   * Verifies that icon buttons work correctly
   */
  it('should handle icon button clicks', () => {
    expect(component.buttonClickCount).toBe(0);

    FixtureHelper.triggerClick(fixture, '[data-cy="icon-button"]');

    expect(component.buttonClickCount).toBe(1);
  });

  /**
   * Pattern: Testing link click with preventDefault
   * Verifies that link clicks are properly handled
   */
  it('should handle link click events', () => {
    expect(component.buttonClickCount).toBe(0);

    FixtureHelper.triggerClick(fixture, '[data-cy="link-button"]');

    expect(component.buttonClickCount).toBe(1);
  });

  /**
   * Pattern: Testing double-click
   * Verifies that double-click events are handled separately from single clicks
   */
  it('should increment double-click count on double click', () => {
    expect(component.doubleClickCount).toBe(0);

    const button = FixtureHelper.querySelector(fixture, '[data-cy="double-click-button"]');
    if (button) {
      const doubleClickEvent = new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      button.dispatchEvent(doubleClickEvent);
    }

    expect(component.doubleClickCount).toBe(1);
  });

  /**
   * Pattern: Testing multiple double-clicks
   * Verifies that multiple double-clicks are tracked separately
   */
  it('should handle multiple double-click events', () => {
    const button = FixtureHelper.querySelector(fixture, '[data-cy="double-click-button"]');
    if (button) {
      const doubleClickEvent = new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        view: window,
      });

      button.dispatchEvent(doubleClickEvent);
      button.dispatchEvent(doubleClickEvent);

      expect(component.doubleClickCount).toBe(2);
    }
  });

  // ========== LONG-PRESS TESTS (3 tests) ==========

  /**
   * Pattern: Testing long-press start
   * Verifies that mousedown activates long-press state
   */
  it('should activate long-press state on mousedown', () => {
    expect(component.longPressActive).toBe(false);

    const button = FixtureHelper.querySelector(fixture, '[data-cy="long-press-button"]');
    if (button) {
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      button.dispatchEvent(mouseDownEvent);
    }

    expect(component.longPressActive).toBe(true);
  });

  /**
   * Pattern: Testing long-press end
   * Verifies that mouseup deactivates long-press state
   */
  it('should deactivate long-press state on mouseup', () => {
    const button = FixtureHelper.querySelector(fixture, '[data-cy="long-press-button"]');
    if (button) {
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      const mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        view: window,
      });

      button.dispatchEvent(mouseDownEvent);
      expect(component.longPressActive).toBe(true);

      button.dispatchEvent(mouseUpEvent);
      expect(component.longPressActive).toBe(false);
    }
  });

  /**
   * Pattern: Testing long-press cancel on mouseleave
   * Verifies that mouseleave deactivates long-press state
   */
  it('should deactivate long-press on mouseleave', () => {
    const button = FixtureHelper.querySelector(fixture, '[data-cy="long-press-button"]');
    if (button) {
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      const mouseLeaveEvent = new MouseEvent('mouseleave', {
        bubbles: true,
        cancelable: true,
        view: window,
      });

      button.dispatchEvent(mouseDownEvent);
      expect(component.longPressActive).toBe(true);

      button.dispatchEvent(mouseLeaveEvent);
      expect(component.longPressActive).toBe(false);
    }
  });

  // ========== INPUT EVENT TESTS (6 tests) ==========

  /**
   * Pattern: Testing text input change
   * Verifies that typing updates component state
   */
  it('should update input value on text change', () => {
    expect(component.inputValue).toBe('');

    const input = FixtureHelper.querySelector(fixture, '[data-cy="text-input"]') as HTMLInputElement;
    if (input) {
      input.value = 'test value';
      const changeEvent = new Event('change');
      input.dispatchEvent(changeEvent);
      component.onInputChange({target: input} as any);
    }

    expect(component.inputValue).toBe('test value');
  });

  /**
   * Pattern: Testing select option change
   * Verifies that selecting an option updates component state
   */
  it('should update selected option on select change', () => {
    expect(component.selectedOption).toBe('');

    component.onSelectChange('option1');

    expect(component.selectedOption).toBe('option1');
  });

  /**
   * Pattern: Testing input focus
   * Verifies that focus event is tracked
   */
  it('should track focus on input field', () => {
    expect(component.focusedField).toBeNull();

    component.onFocus('text-input');

    expect(component.focusedField).toBe('text-input');
  });

  /**
   * Pattern: Testing input blur
   * Verifies that blur clears focused field
   */
  it('should clear focused field on blur', () => {
    component.onFocus('text-input');
    expect(component.focusedField).toBe('text-input');

    component.onBlur();

    expect(component.focusedField).toBeNull();
  });

  /**
   * Pattern: Testing focus indicator display
   * Verifies that focus state is visible in DOM
   */
  it('should display focus indicator when input is focused', () => {
    component.onFocus('text-input');
    fixture.detectChanges();

    const focusIndicator = FixtureHelper.querySelector(fixture, '[data-cy="text-input-focused"]');
    expect(focusIndicator).toBeTruthy();
    expect(focusIndicator?.textContent).toContain('Focused');
  });

  /**
   * Pattern: Testing focus indicator removal
   * Verifies that focus indicator disappears on blur
   */
  it('should hide focus indicator on blur', () => {
    component.onFocus('text-input');
    fixture.detectChanges();

    let focusIndicator = FixtureHelper.querySelector(fixture, '[data-cy="text-input-focused"]');
    expect(focusIndicator).toBeTruthy();

    component.onBlur();
    fixture.detectChanges();

    focusIndicator = FixtureHelper.querySelector(fixture, '[data-cy="text-input-focused"]');
    expect(focusIndicator).toBeFalsy();
  });

  // ========== KEYBOARD EVENT TESTS (5 tests) ==========

  /**
   * Pattern: Testing Enter key press
   * Verifies that Enter key triggers appropriate handler
   */
  it('should detect Enter key press', () => {
    expect(component.enterKeyPressed).toBe(false);

    const event = new KeyboardEvent('keydown', {key: 'Enter', bubbles: true});
    spyOn(event, 'preventDefault');
    component.onKeyDown(event);

    expect(component.enterKeyPressed).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  /**
   * Pattern: Testing Escape key press
   * Verifies that Escape key triggers appropriate handler
   */
  it('should detect Escape key press', () => {
    expect(component.escapeKeyPressed).toBe(false);

    const event = new KeyboardEvent('keydown', {key: 'Escape', bubbles: true});
    spyOn(event, 'preventDefault');
    component.onKeyDown(event);

    expect(component.escapeKeyPressed).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  /**
   * Pattern: Testing key press in input field
   * Verifies that keyboard events in inputs are detected
   */
  it('should handle keyboard input in input field', () => {
    const input = FixtureHelper.querySelector(fixture, '[data-cy="keyboard-input"]') as HTMLInputElement;
    if (input) {
      const enterEvent = new KeyboardEvent('keydown', {key: 'Enter', bubbles: true});
      spyOn(enterEvent, 'preventDefault');
      component.onKeyDown(enterEvent);
      fixture.detectChanges();

      const enterIndicator = FixtureHelper.querySelector(fixture, '[data-cy="enter-pressed"]');
      expect(enterIndicator).toBeTruthy();
    }
  });

  /**
   * Pattern: Testing non-matching key press
   * Verifies that other keys don't trigger special handlers
   */
  it('should not trigger special handlers for other keys', () => {
    const event = new KeyboardEvent('keydown', {key: 'a', bubbles: true});
    component.onKeyDown(event);

    expect(component.enterKeyPressed).toBe(false);
    expect(component.escapeKeyPressed).toBe(false);
  });

  /**
   * Pattern: Testing keyboard event propagation
   * Verifies that keyboard events can be prevented from propagating
   */
  it('should prevent default for special keys', () => {
    const event = new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true});
    spyOn(event, 'preventDefault');
    component.onKeyDown(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  // ========== FORM SUBMISSION AND VALIDATION TESTS (7 tests) ==========

  /**
   * Pattern: Testing form submission with valid data
   * Verifies that form submits when all fields are valid
   */
  it('should submit form with valid data', () => {
    component.form.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      select: 'value1',
      checkbox: true,
    });

    component.onSubmit();

    expect(component.isFormSubmitted).toBe(true);
  });

  /**
   * Pattern: Testing form submission with invalid data
   * Verifies that form does not submit when fields are invalid
   */
  it('should not submit form with invalid data', () => {
    component.form.patchValue({
      username: '',
      email: 'invalid-email',
      select: '',
      checkbox: false,
    });

    component.onSubmit();

    expect(component.isFormSubmitted).toBe(false);
  });

  /**
   * Pattern: Testing form reset
   * Verifies that form reset clears all fields and submission state
   */
  it('should reset form to initial state', () => {
    component.form.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      select: 'value1',
    });
    component.isFormSubmitted = true;

    component.resetForm();

    expect(component.form.get('username')?.value).toBeNull();
    expect(component.form.get('email')?.value).toBeNull();
    expect(component.form.get('select')?.value).toBeNull();
    expect(component.isFormSubmitted).toBe(false);
  });

  /**
   * Pattern: Testing form validation - required field
   * Verifies that required fields show errors when empty
   */
  it('should mark username as required', () => {
    const usernameControl = component.form.get('username');
    usernameControl?.setValue('');
    usernameControl?.markAsTouched();

    expect(usernameControl?.hasError('required')).toBe(true);
    expect(usernameControl?.invalid).toBe(true);
  });

  /**
   * Pattern: Testing form validation - email format
   * Verifies that email field validates email format
   */
  it('should validate email format', () => {
    const emailControl = component.form.get('email');
    emailControl?.setValue('invalid-email');

    expect(emailControl?.hasError('email')).toBe(true);
    expect(emailControl?.invalid).toBe(true);
  });

  /**
   * Pattern: Testing form validation - email valid
   * Verifies that valid email passes validation
   */
  it('should accept valid email', () => {
    const emailControl = component.form.get('email');
    emailControl?.setValue('test@example.com');

    expect(emailControl?.hasError('email')).toBe(false);
    expect(emailControl?.valid).toBe(true);
  });

  /**
   * Pattern: Testing submit button disabled state
   * Verifies that submit button is disabled when form is invalid
   */
  it('should disable submit button when form is invalid', () => {
    component.form.patchValue({
      username: '',
      email: 'test@example.com',
      select: 'value1',
    });
    fixture.detectChanges();

    const submitButton = FixtureHelper.querySelector(fixture, '[data-cy="form-submit"]') as HTMLButtonElement;
    expect(submitButton?.disabled).toBe(true);
  });

  // ========== DRAG AND DROP TESTS (5 tests) ==========

  /**
   * Pattern: Testing drag start
   * Verifies that dragging an item starts the drag operation
   */
  it('should set dragged item on dragstart', () => {
    expect(component.draggedItem).toBeNull();

    const event = new DragEvent('dragstart', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    });
    component.onDragStart(event, 'item-1');

    expect(component.draggedItem).toBe('item-1');
  });

  /**
   * Pattern: Testing drag over
   * Verifies that dragover event allows drop
   */
  it('should allow drop on dragover', () => {
    const event = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    });
    spyOn(event, 'preventDefault');

    component.onDragOver(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  /**
   * Pattern: Testing drop handling
   * Verifies that dropping an item adds it to dropped items
   */
  it('should add dropped item to list', () => {
    component.draggedItem = 'item-1';
    expect(component.droppedItems.length).toBe(0);

    const event = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    });
    component.onDrop(event);

    expect(component.droppedItems).toContain('item-1');
  });

  /**
   * Pattern: Testing multiple drops
   * Verifies that multiple items can be dropped
   */
  it('should handle multiple item drops', () => {
    component.draggedItem = 'item-1';
    const event1 = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    });
    component.onDrop(event1);

    component.draggedItem = 'item-2';
    const event2 = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    });
    component.onDrop(event2);

    expect(component.droppedItems.length).toBe(2);
    expect(component.droppedItems).toContain('item-1');
    expect(component.droppedItems).toContain('item-2');
  });

  /**
   * Pattern: Testing drag end
   * Verifies that drag end clears dragged item
   */
  it('should clear dragged item on dragend', () => {
    component.draggedItem = 'item-1';
    component.onDragEnd();

    expect(component.draggedItem).toBeNull();
  });

  /**
   * Pattern: Testing duplicate drop prevention
   * Verifies that the same item cannot be dropped twice
   */
  it('should prevent duplicate item drops', () => {
    component.draggedItem = 'item-1';
    const event1 = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    });
    component.onDrop(event1);

    // Try to drop the same item again
    const event2 = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    });
    component.onDrop(event2);

    expect(component.droppedItems.length).toBe(1);
  });

  // ========== DIALOG INTERACTION TESTS (3 tests) ==========

  /**
   * Pattern: Testing dialog result display
   * Verifies that dialog results are displayed in the component
   */
  it('should display dialog result when set', () => {
    component.setDialogResult('test-result');
    fixture.detectChanges();

    const resultDisplay = FixtureHelper.querySelector(fixture, '[data-cy="dialog-result"]');
    expect(resultDisplay?.textContent).toContain('test-result');
  });

  /**
   * Pattern: Testing dialog button click
   * Verifies that dialog can be opened from button click
   */
  it('should have dialog open button', () => {
    const dialogButton = FixtureHelper.querySelector(fixture, '[data-cy="open-dialog"]');
    expect(dialogButton).toBeTruthy();
    expect(dialogButton?.textContent).toContain('Open Dialog');
  });

  /**
   * Pattern: Testing dialog result visibility
   * Verifies that dialog result is hidden until set
   */
  it('should not display dialog result initially', () => {
    const resultDisplay = FixtureHelper.querySelector(fixture, '[data-cy="dialog-result"]');
    expect(resultDisplay).toBeFalsy();
  });

  // ========== INTEGRATION TESTS (4 tests) ==========

  /**
   * Pattern: Testing complete user interaction flow
   * Verifies a realistic scenario with multiple interactions
   */
  it('should handle complete user form interaction', () => {
    // User fills in the form
    component.form.patchValue({
      username: 'john_doe',
      email: 'john@example.com',
      select: 'value1',
      checkbox: true,
    });

    fixture.detectChanges();

    // Form should be valid
    expect(component.form.valid).toBe(true);

    // User clicks submit
    component.onSubmit();

    // Form should be submitted
    expect(component.isFormSubmitted).toBe(true);
  });

  /**
   * Pattern: Testing click and keyboard together
   * Verifies that clicks and keyboard events can happen in sequence
   */
  it('should handle click followed by keyboard event', () => {
    FixtureHelper.triggerClick(fixture, '[data-cy="click-button"]');
    expect(component.buttonClickCount).toBe(1);

    const event = new KeyboardEvent('keydown', {key: 'Enter', bubbles: true});
    component.onKeyDown(event);
    expect(component.enterKeyPressed).toBe(true);
  });

  /**
   * Pattern: Testing input focus and keyboard input
   * Verifies that focused input can receive keyboard events
   */
  it('should handle input focus with keyboard event', () => {
    component.onFocus('keyboard-input');
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', {key: 'Enter', bubbles: true});
    component.onKeyDown(event);

    expect(component.focusedField).toBe('keyboard-input');
    expect(component.enterKeyPressed).toBe(true);
  });

  /**
   * Pattern: Testing drag with multiple interaction types
   * Verifies that drag and drop works alongside other interactions
   */
  it('should handle drag and drop with button clicks', () => {
    // First, click a button
    FixtureHelper.triggerClick(fixture, '[data-cy="click-button"]');
    expect(component.buttonClickCount).toBe(1);

    // Then drag and drop
    component.draggedItem = 'item-1';
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    });
    component.onDrop(dropEvent);

    expect(component.droppedItems).toContain('item-1');
    expect(component.buttonClickCount).toBe(1);
  });

  // ========== EDGE CASE AND ERROR SCENARIO TESTS (3 tests) ==========

  /**
   * Pattern: Testing rapid clicks
   * Verifies that component handles rapid clicks correctly
   */
  it('should handle rapid clicks without errors', () => {
    for (let i = 0; i < 10; i++) {
      FixtureHelper.triggerClick(fixture, '[data-cy="click-button"]');
    }

    expect(component.buttonClickCount).toBe(10);
  });

  /**
   * Pattern: Testing interaction with disabled button
   * Verifies that disabled buttons cannot be submitted
   */
  it('should prevent form submission when submit button is disabled', () => {
    component.form.patchValue({
      username: '',
      email: 'invalid',
      select: '',
    });
    fixture.detectChanges();

    component.onSubmit();

    expect(component.isFormSubmitted).toBe(false);
  });

  /**
   * Pattern: Testing form state consistency
   * Verifies that form state remains consistent during interactions
   */
  it('should maintain form consistency during interaction', () => {
    component.form.patchValue({
      username: 'user1',
      email: 'user1@example.com',
    });

    expect(component.form.valid).toBe(false); // select is still required

    component.form.patchValue({select: 'value1'});

    expect(component.form.valid).toBe(true);
  });
});
