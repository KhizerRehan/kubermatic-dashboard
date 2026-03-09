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

import {ComponentFixture, tick} from '@angular/core/testing';

/**
 * Helper class for simplifying common operations on component fixtures in tests.
 *
 * Provides utility methods to interact with component fixtures without boilerplate code:
 * - Get component instance with type safety
 * - Query DOM elements by various selectors
 * - Trigger common DOM events (click, input, change)
 * - Verify element visibility and disabled state
 * - Detect changes and tick for async operations
 *
 * Reduces code repetition and improves test readability by encapsulating common fixture patterns.
 *
 * @example
 * ```typescript
 * const fixture = TestBed.createComponent(MyComponent);
 * const component = FixtureHelper.getComponent(fixture);
 *
 * // Query elements
 * const button = FixtureHelper.querySelector(fixture, 'button[data-cy="submit"]');
 * const items = FixtureHelper.querySelectorAll(fixture, '.list-item');
 *
 * // Trigger events
 * FixtureHelper.triggerClick(fixture, 'button');
 * FixtureHelper.triggerInputChange(fixture, 'input[name="email"]', 'test@example.com');
 *
 * // Verify state
 * expect(FixtureHelper.isVisible(fixture, '.success-message')).toBe(true);
 * expect(FixtureHelper.isDisabled(fixture, 'button[type="submit"]')).toBe(false);
 * ```
 */
export class FixtureHelper {
  /**
   * Gets the component instance from a fixture with type safety.
   *
   * Simple convenience method to extract component from fixture with proper typing.
   * Eliminates boilerplate like `const component = fixture.componentInstance as MyComponent;`
   *
   * @template T - Type of component in the fixture
   * @param {ComponentFixture<T>} fixture - The component fixture
   * @returns {T} Typed component instance
   *
   * @example
   * ```typescript
   * const fixture = TestBed.createComponent(MyComponent);
   * const component = FixtureHelper.getComponent(fixture);
   *
   * component.data = testData;
   * expect(component.data).toEqual(testData);
   * ```
   */
  static getComponent<T>(fixture: ComponentFixture<T>): T {
    return fixture.componentInstance;
  }

  /**
   * Queries DOM for a single element matching the selector.
   *
   * Returns the first element matching the CSS selector, or null if not found.
   * Useful for selecting elements by class, id, attribute selectors, etc.
   *
   * @param {ComponentFixture<any>} fixture - The component fixture
   * @param {string} selector - CSS selector to query (e.g., '.button', '#submit', '[data-cy="save"]')
   * @returns {HTMLElement | null} The DOM element or null if not found
   *
   * @example
   * ```typescript
   * const button = FixtureHelper.querySelector(fixture, 'button.primary');
   * const input = FixtureHelper.querySelector(fixture, 'input[data-cy="email"]');
   *
   * expect(button).toBeTruthy();
   * expect(input?.value).toBe('');
   * ```
   */
  static querySelector(fixture: ComponentFixture<any>, selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector);
  }

  /**
   * Queries DOM for all elements matching the selector.
   *
   * Returns a list of all elements matching the CSS selector.
   * Useful for testing lists, tables, or repeated elements.
   *
   * @param {ComponentFixture<any>} fixture - The component fixture
   * @param {string} selector - CSS selector to query (e.g., '.list-item', 'tr[data-cy="row"]')
   * @returns {NodeListOf<HTMLElement>} Collection of matching elements
   *
   * @example
   * ```typescript
   * const items = FixtureHelper.querySelectorAll(fixture, '.list-item');
   *
   * expect(items.length).toBe(3);
   * expect(items[0].textContent).toContain('Item 1');
   * ```
   */
  static querySelectorAll(fixture: ComponentFixture<any>, selector: string): NodeListOf<HTMLElement> {
    return fixture.nativeElement.querySelectorAll(selector);
  }

  /**
   * Gets an element by data-cy attribute value.
   *
   * Convenience method for selecting elements by data-cy attribute (test-specific selector).
   * Equivalent to `querySelector('[data-cy="..."]')` but more readable.
   *
   * @param {ComponentFixture<any>} fixture - The component fixture
   * @param {string} dataCy - Value of data-cy attribute (e.g., 'submit-button', 'email-input')
   * @returns {HTMLElement | null} The DOM element or null if not found
   *
   * @example
   * ```typescript
   * const submitButton = FixtureHelper.getByDataCy(fixture, 'submit-button');
   * const emailInput = FixtureHelper.getByDataCy(fixture, 'email-input');
   *
   * FixtureHelper.triggerClick(fixture, submitButton);
   * expect(emailInput?.value).toBe('test@example.com');
   * ```
   */
  static getByDataCy(fixture: ComponentFixture<any>, dataCy: string): HTMLElement | null {
    return this.querySelector(fixture, `[data-cy="${dataCy}"]`);
  }

  /**
   * Triggers a click event on an element specified by selector or element.
   *
   * Simulates user click by calling click() on the target element.
   * Element can be specified by CSS selector string or direct HTMLElement reference.
   *
   * @param {ComponentFixture<any>} fixture - The component fixture
   * @param {string | HTMLElement} selectorOrElement - CSS selector or HTMLElement to click
   * @returns {void}
   *
   * @example
   * ```typescript
   * // Click by selector
   * FixtureHelper.triggerClick(fixture, 'button.submit');
   *
   * // Click by element reference
   * const button = FixtureHelper.querySelector(fixture, 'button');
   * FixtureHelper.triggerClick(fixture, button!);
   *
   * fixture.detectChanges();
   * expect(component.submitted).toBe(true);
   * ```
   */
  static triggerClick(fixture: ComponentFixture<any>, selectorOrElement: string | HTMLElement): void {
    const element =
      typeof selectorOrElement === 'string' ? this.querySelector(fixture, selectorOrElement) : selectorOrElement;
    if (element) {
      element.click();
    }
  }

  /**
   * Triggers input/change event on an element and optionally updates its value.
   *
   * Simulates user typing by setting value property and dispatching input event.
   * Useful for testing form inputs with reactive forms or two-way binding.
   *
   * @param {ComponentFixture<any>} fixture - The component fixture
   * @param {string | HTMLInputElement} selectorOrElement - CSS selector or input element
   * @param {string} [value] - Optional new value to set on input element
   * @returns {void}
   *
   * @example
   * ```typescript
   * const input = FixtureHelper.querySelector(fixture, 'input[name="email"]');
   *
   * // Trigger input event with value change
   * FixtureHelper.triggerInputChange(fixture, input!, 'test@example.com');
   *
   * fixture.detectChanges();
   * expect(component.form.get('email')?.value).toBe('test@example.com');
   * ```
   */
  static triggerInputChange(
    fixture: ComponentFixture<any>,
    selectorOrElement: string | HTMLInputElement,
    value?: string
  ): void {
    const element =
      typeof selectorOrElement === 'string'
        ? (this.querySelector(fixture, selectorOrElement) as HTMLInputElement)
        : selectorOrElement;

    if (element && element instanceof HTMLInputElement) {
      if (value !== undefined) {
        element.value = value;
      }
      element.dispatchEvent(new Event('input', {bubbles: true}));
      element.dispatchEvent(new Event('change', {bubbles: true}));
    }
  }

  /**
   * Triggers change event on a select element and optionally sets its value.
   *
   * Simulates user selecting an option from a dropdown/select element.
   * Useful for testing select inputs with change handlers.
   *
   * @param {ComponentFixture<any>} fixture - The component fixture
   * @param {string | HTMLSelectElement} selectorOrElement - CSS selector or select element
   * @param {string} [value] - Optional new value to set on select element
   * @returns {void}
   *
   * @example
   * ```typescript
   * const select = FixtureHelper.querySelector(fixture, 'select[name="environment"]');
   *
   * // Change select value
   * FixtureHelper.triggerSelectChange(fixture, select!, 'production');
   *
   * fixture.detectChanges();
   * expect(component.form.get('environment')?.value).toBe('production');
   * ```
   */
  static triggerSelectChange(
    fixture: ComponentFixture<any>,
    selectorOrElement: string | HTMLSelectElement,
    value?: string
  ): void {
    const element =
      typeof selectorOrElement === 'string'
        ? (this.querySelector(fixture, selectorOrElement) as HTMLSelectElement)
        : selectorOrElement;

    if (element && element instanceof HTMLSelectElement) {
      if (value !== undefined) {
        element.value = value;
      }
      element.dispatchEvent(new Event('change', {bubbles: true}));
    }
  }

  /**
   * Checks if an element is visible in the DOM.
   *
   * Element is considered visible if:
   * 1. Element exists in DOM
   * 2. Element is not hidden (display !== 'none')
   * 3. Element is not hidden by parent (visibility !== 'hidden')
   *
   * @param {ComponentFixture<any>} fixture - The component fixture
   * @param {string | HTMLElement} selectorOrElement - CSS selector or element to check
   * @returns {boolean} True if element is visible, false otherwise
   *
   * @example
   * ```typescript
   * component.showMessage = true;
   * fixture.detectChanges();
   *
   * expect(FixtureHelper.isVisible(fixture, '.success-message')).toBe(true);
   *
   * component.showMessage = false;
   * fixture.detectChanges();
   *
   * expect(FixtureHelper.isVisible(fixture, '.success-message')).toBe(false);
   * ```
   */
  static isVisible(fixture: ComponentFixture<any>, selectorOrElement: string | HTMLElement): boolean {
    const element =
      typeof selectorOrElement === 'string' ? this.querySelector(fixture, selectorOrElement) : selectorOrElement;

    if (!element) {
      return false;
    }

    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  /**
   * Checks if an element is disabled.
   *
   * Returns true if element has 'disabled' attribute or CSS class.
   * Useful for testing button/input disabled states.
   *
   * @param {ComponentFixture<any>} fixture - The component fixture
   * @param {string | HTMLElement} selectorOrElement - CSS selector or element to check
   * @returns {boolean} True if element is disabled, false otherwise
   *
   * @example
   * ```typescript
   * component.isLoading = true;
   * fixture.detectChanges();
   *
   * expect(FixtureHelper.isDisabled(fixture, 'button.submit')).toBe(true);
   *
   * component.isLoading = false;
   * fixture.detectChanges();
   *
   * expect(FixtureHelper.isDisabled(fixture, 'button.submit')).toBe(false);
   * ```
   */
  static isDisabled(fixture: ComponentFixture<any>, selectorOrElement: string | HTMLElement): boolean {
    const element =
      typeof selectorOrElement === 'string' ? this.querySelector(fixture, selectorOrElement) : selectorOrElement;

    if (!element) {
      return false;
    }

    return (
      (element instanceof HTMLButtonElement && element.disabled) ||
      (element instanceof HTMLInputElement && element.disabled) ||
      (element instanceof HTMLSelectElement && element.disabled) ||
      (element instanceof HTMLTextAreaElement && element.disabled) ||
      element.hasAttribute('disabled') ||
      element.classList.contains('disabled')
    );
  }

  /**
   * Gets text content from an element.
   *
   * Returns trimmed text content of element, useful for verifying displayed text.
   * Note: This includes all descendant text nodes.
   *
   * @param {ComponentFixture<any>} fixture - The component fixture
   * @param {string | HTMLElement} [selectorOrElement] - CSS selector or element to get text from.
   *                                                      If omitted, uses fixture.nativeElement
   * @returns {string} Text content of element, or empty string if element not found
   *
   * @example
   * ```typescript
   * component.message = 'Success!';
   * fixture.detectChanges();
   *
   * const text = FixtureHelper.getText(fixture, '.message');
   * expect(text).toBe('Success!');
   * ```
   */
  static getText(fixture: ComponentFixture<any>, selectorOrElement?: string | HTMLElement): string {
    let element: HTMLElement | null = fixture.nativeElement;

    if (selectorOrElement) {
      element =
        typeof selectorOrElement === 'string' ? this.querySelector(fixture, selectorOrElement) : selectorOrElement;
    }

    return element ? (element.textContent || '').trim() : '';
  }

  /**
   * Detects changes in the fixture and optionally ticks for async operations.
   *
   * Wrapper around fixture.detectChanges() with optional tick() for async timers.
   * Useful for triggering change detection after setting component properties
   * or after async operations complete.
   *
   * @param {ComponentFixture<any>} fixture - The component fixture
   * @param {number} [tickMs] - Optional milliseconds to tick for async operations (like timers, promises)
   * @returns {void}
   *
   * @example
   * ```typescript
   * component.data = newData;
   * FixtureHelper.detectChanges(fixture);
   *
   * // Or with async operations
   * component.loadData(); // Starts async timer
   * FixtureHelper.detectChanges(fixture, 5000); // Tick 5 seconds
   * expect(component.isLoading).toBe(false);
   * ```
   */
  static detectChanges(fixture: ComponentFixture<any>, tickMs?: number): void {
    fixture.detectChanges();
    if (tickMs !== undefined) {
      tick(tickMs);
    }
  }

  /**
   * Sets component input properties and detects changes.
   *
   * Convenience method to set multiple component @Input properties at once
   * and trigger change detection. Useful for setting up component state before testing.
   *
   * @template T - Type of component in the fixture
   * @param {ComponentFixture<T>} fixture - The component fixture
   * @param {Partial<T>} inputs - Object with input properties to set
   * @param {boolean} [detectChanges=true] - Whether to call detectChanges after setting inputs (default: true)
   * @returns {void}
   *
   * @example
   * ```typescript
   * const fixture = TestBed.createComponent(UserCardComponent);
   *
   * FixtureHelper.setInputs(fixture, {
   *   user: testUser,
   *   showDetails: true,
   * });
   *
   * // Component properties are now set and changes detected
   * expect(fixture.componentInstance.user).toEqual(testUser);
   * expect(FixtureHelper.getText(fixture, '.user-name')).toBe(testUser.name);
   * ```
   */
  static setInputs<T>(
    fixture: ComponentFixture<T>,
    inputs: Partial<T>,
    detectChanges: boolean = true
  ): void {
    const component = fixture.componentInstance;
    Object.assign(component, inputs);
    if (detectChanges) {
      fixture.detectChanges();
    }
  }

  /**
   * Verifies that an element contains the expected text (substring match).
   *
   * Useful for checking if element contains expected text without exact match.
   * Ignores leading/trailing whitespace and performs case-sensitive comparison.
   *
   * @param {ComponentFixture<any>} fixture - The component fixture
   * @param {string | HTMLElement} selectorOrElement - CSS selector or element to check
   * @param {string} expectedText - Text to search for
   * @returns {boolean} True if element text contains expectedText, false otherwise
   *
   * @example
   * ```typescript
   * component.errors = ['Email is invalid', 'Password too short'];
   * fixture.detectChanges();
   *
   * expect(FixtureHelper.textContains(fixture, '.error-list', 'Email is invalid')).toBe(true);
   * expect(FixtureHelper.textContains(fixture, '.error-list', 'Username missing')).toBe(false);
   * ```
   */
  static textContains(fixture: ComponentFixture<any>, selectorOrElement: string | HTMLElement, expectedText: string): boolean {
    const text = this.getText(fixture, selectorOrElement);
    return text.includes(expectedText);
  }
}
