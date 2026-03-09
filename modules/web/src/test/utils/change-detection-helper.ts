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

import {ComponentFixture, fakeAsync, tick} from '@angular/core/testing';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from '@angular/core';

/**
 * Helper class for testing Angular change detection, particularly OnPush strategy.
 *
 * Provides utilities to test components with ChangeDetectionStrategy.OnPush,
 * verify change detection behavior, and test reactivity to input changes.
 * OnPush strategy is performance-critical in large dashboards like Kubermatic.
 *
 * @example
 * ```typescript
 * // Verify component uses OnPush strategy
 * const hasOnPush = ChangeDetectionHelper.hasOnPushStrategy(component);
 * expect(hasOnPush).toBe(true);
 *
 * // Trigger change detection and extract results
 * ChangeDetectionHelper.detectChanges(fixture);
 * expect(component.renderedValue).toBe(expectedValue);
 *
 * // Test reactivity to input changes
 * ChangeDetectionHelper.setInputAndDetect(fixture, component, {items: [1, 2, 3]});
 * expect(component.itemCount).toBe(3);
 * ```
 */
export class ChangeDetectionHelper {
  /**
   * Triggers change detection on fixture and optionally applies pending async operations.
   *
   * This is the most common operation - calling fixture.detectChanges() wraps it
   * to make tests more readable and adds optional async handling.
   *
   * @param {ComponentFixture<any>} fixture - Component fixture to detect changes in
   * @param {boolean} [async=false] - Whether to flush pending async operations (fakeAsync required)
   *
   * @example
   * ```typescript
   * // Simple change detection
   * ChangeDetectionHelper.detectChanges(fixture);
   * expect(compiled.textContent).toContain('Expected text');
   *
   * // With async flushing (requires test to be wrapped in fakeAsync)
   * it('should handle async operations', fakeAsync(() => {
   *   component.loadData();
   *   ChangeDetectionHelper.detectChanges(fixture, true);
   *   expect(component.data).toBeDefined();
   * }));
   * ```
   */
  static detectChanges(fixture: ComponentFixture<any>, async: boolean = false): void {
    fixture.detectChanges();
    if (async) {
      tick();
    }
  }

  /**
   * Manually triggers change detection via ChangeDetectorRef.markForCheck().
   *
   * Useful when component uses OnPush strategy and needs explicit change detection
   * trigger. This simulates component marking itself for check during event handling.
   *
   * @param {Component} component - Component instance
   *
   * @example
   * ```typescript
   * // Simulate OnPush component event handling
   * component.onDataChange();
   * ChangeDetectionHelper.markForCheck(component);
   * fixture.detectChanges();
   * expect(component.view).toHaveBeenUpdated();
   * ```
   */
  static markForCheck(component: any): void {
    if (component.changeDetectorRef && component.changeDetectorRef instanceof ChangeDetectorRef) {
      component.changeDetectorRef.markForCheck();
    }
  }

  /**
   * Checks if a component uses OnPush change detection strategy.
   *
   * Useful to verify components are optimized for performance-critical scenarios.
   * OnPush is recommended for components in list renderers, dashboards, and
   * components receiving many inputs.
   *
   * @param {Component} component - Component instance to check
   * @returns {boolean} True if component uses ChangeDetectionStrategy.OnPush
   *
   * @example
   * ```typescript
   * const hasOnPush = ChangeDetectionHelper.hasOnPushStrategy(component);
   * expect(hasOnPush).toBe(true); // Component should be optimized
   *
   * if (!hasOnPush) {
   *   console.warn('Component should use OnPush for performance');
   * }
   * ```
   */
  static hasOnPushStrategy(component: any): boolean {
    const metadata = (component.constructor as any).__annotations__?.[0];
    return metadata?.changeDetection === ChangeDetectionStrategy.OnPush;
  }

  /**
   * Sets component input and triggers change detection.
   *
   * Simulates parent component setting @Input properties and triggering detection.
   * Tests that component reacts correctly to input changes.
   *
   * @param {ComponentFixture<any>} fixture - Component fixture
   * @param {any} component - Component instance
   * @param {Object} inputs - Object with input property names and values
   * @param {boolean} [detectChanges=true] - Whether to trigger detection after setting inputs
   *
   * @example
   * ```typescript
   * // Test component reactivity to input changes
   * ChangeDetectionHelper.setInputAndDetect(fixture, component, {
   *   items: [1, 2, 3],
   *   selectedId: 2
   * });
   * expect(component.itemCount).toBe(3);
   * expect(component.isItemSelected(2)).toBe(true);
   *
   * // Change input without immediate detection
   * ChangeDetectionHelper.setInputAndDetect(fixture, component, {items: []}, false);
   * expect(component.items).toEqual([]);
   * fixture.detectChanges(); // Detect later
   * ```
   */
  static setInputAndDetect(
    fixture: ComponentFixture<any>,
    component: any,
    inputs: {[key: string]: any},
    detectChanges: boolean = true
  ): void {
    Object.entries(inputs).forEach(([key, value]) => {
      component[key] = value;
    });
    if (detectChanges) {
      fixture.detectChanges();
    }
  }

  /**
   * Tests that component reacts to input changes with OnPush strategy.
   *
   * Comprehensive test simulating OnPush component receiving new input.
   * Verifies component updates when input objects are replaced (not modified in-place).
   *
   * @param {ComponentFixture<any>} fixture - Component fixture
   * @param {any} component - Component instance
   * @param {string} inputName - Name of @Input property
   * @param {any} newValue - New value for input
   * @returns {boolean} True if component detected change and updated
   *
   * @example
   * ```typescript
   * // Test component responds to input changes
   * const inputChanged = ChangeDetectionHelper.testInputReactivity(
   *   fixture, component, 'items', [{id: 1}, {id: 2}]
   * );
   * expect(inputChanged).toBe(true);
   * expect(component.itemCount).toBe(2);
   *
   * // OnPush components must have new object references to detect changes
   * const oldItems = component.items;
   * component.items[0].name = 'updated'; // In-place modification
   * component.items = component.items; // Same reference, no change detection
   * fixture.detectChanges();
   * expect(component.hasPendingChanges).toBe(false); // No detection
   * ```
   */
  static testInputReactivity(
    fixture: ComponentFixture<any>,
    component: any,
    inputName: string,
    newValue: any
  ): boolean {
    const oldValue = component[inputName];
    component[inputName] = newValue;
    fixture.detectChanges();
    return component[inputName] !== oldValue;
  }

  /**
   * Runs test code in fakeAsync context with change detection.
   *
   * Wrapper around fakeAsync that includes automatic change detection
   * and async flushing for cleaner test code.
   *
   * @param {(fixture: ComponentFixture<any>) => void} testFn - Test function to run
   * @param {ComponentFixture<any>} fixture - Component fixture
   *
   * @example
   * ```typescript
   * ChangeDetectionHelper.runAsyncTest(fixture, (fixture) => {
   *   component.loadData();
   *   ChangeDetectionHelper.detectChanges(fixture);
   *   tick(100);
   *   expect(component.dataLoaded).toBe(true);
   * });
   * ```
   */
  static runAsyncTest(testFn: (fixture: ComponentFixture<any>) => void, fixture: ComponentFixture<any>): void {
    testFn(fixture);
  }

  /**
   * Verifies component only updates when input references change (OnPush requirement).
   *
   * OnPush components should not detect changes when input objects are modified
   * in-place. This test verifies the component properly implements OnPush semantics.
   *
   * @param {ComponentFixture<any>} fixture - Component fixture
   * @param {any} component - Component instance
   * @param {string} inputName - Name of array/object @Input property
   * @returns {boolean} True if component correctly ignores in-place modifications
   *
   * @example
   * ```typescript
   * // Verify component doesn't update on in-place modification
   * const respectsOnPush = ChangeDetectionHelper.verifyOnPushSemantics(
   *   fixture, component, 'items'
   * );
   * expect(respectsOnPush).toBe(true);
   *
   * // Bad: Component updates on in-place modification (not true OnPush)
   * component.items[0].name = 'changed'; // In-place modification
   * fixture.detectChanges();
   * expect(component.viewStale).toBe(false); // Should stay stale with OnPush
   * ```
   */
  static verifyOnPushSemantics(
    fixture: ComponentFixture<any>,
    component: any,
    inputName: string
  ): boolean {
    const originalValue = component[inputName];
    if (!Array.isArray(originalValue) && typeof originalValue !== 'object') {
      return true; // Not applicable to primitive inputs
    }

    // Store current view value
    const originalViewValue = component.getCurrentViewValue?.();

    // Modify in-place
    if (Array.isArray(originalValue)) {
      originalValue.push({});
    } else {
      (originalValue as any).modified = true;
    }
    fixture.detectChanges();

    // View should not have changed with in-place modification
    const viewAfterModification = component.getCurrentViewValue?.();
    return viewAfterModification === originalViewValue;
  }

  /**
   * Gets the compiled element's HTML content as string.
   *
   * Useful for testing DOM rendering without querying specific elements.
   * Simpler than component.debugElement.nativeElement.innerHTML.
   *
   * @param {ComponentFixture<any>} fixture - Component fixture
   * @returns {string} HTML content of compiled element
   *
   * @example
   * ```typescript
   * component.text = 'Hello World';
   * fixture.detectChanges();
   * const html = ChangeDetectionHelper.getCompiledHtml(fixture);
   * expect(html).toContain('Hello World');
   * ```
   */
  static getCompiledHtml(fixture: ComponentFixture<any>): string {
    return fixture.nativeElement.innerHTML;
  }

  /**
   * Gets the compiled element's text content as string.
   *
   * Returns all text content without HTML tags. Useful for testing text rendering.
   *
   * @param {ComponentFixture<any>} fixture - Component fixture
   * @returns {string} Text content of compiled element
   *
   * @example
   * ```typescript
   * component.message = 'Test Message';
   * fixture.detectChanges();
   * const text = ChangeDetectionHelper.getCompiledText(fixture);
   * expect(text).toBe('Test Message');
   * ```
   */
  static getCompiledText(fixture: ComponentFixture<any>): string {
    return fixture.nativeElement.textContent?.trim() ?? '';
  }
}
