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
import {SimpleDisplayComponent} from './simple-display.component';

/**
 * Example Test: Simple Presentational Component
 *
 * This test demonstrates how to test a simple component that:
 * - Accepts @Input properties for data binding
 * - Emits @Output events for parent communication
 * - Renders template based on inputs
 *
 * Key Testing Patterns:
 * - Testing @Input property binding
 * - Testing @Output event emission with spyOn
 * - Verifying template rendering based on input values
 */
describe('SimpleDisplayComponent', () => {
  let fixture: ComponentFixture<SimpleDisplayComponent>;
  let component: SimpleDisplayComponent;

  // Setup TestBed before each test
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [SimpleDisplayComponent],
    }).compileComponents();
  });

  // Create component instance before each test
  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleDisplayComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ========== @Input Tests ==========

  /**
   * Pattern: Testing @Input property binding
   * Verifies that data passed via @Input is correctly received by the component
   */
  it('should receive title via @Input and display it', () => {
    const testTitle = 'Test Title';

    // Set @Input property
    component.title = testTitle;
    fixture.detectChanges();

    // Verify component received the input
    expect(component.title).toBe(testTitle);

    // Verify template renders the title
    const titleElement = fixture.nativeElement.querySelector('[data-cy="title"]');
    expect(titleElement?.textContent).toContain(testTitle);
  });

  it('should receive description via @Input and display it', () => {
    const testDescription = 'This is a test description';

    component.description = testDescription;
    fixture.detectChanges();

    expect(component.description).toBe(testDescription);

    const descElement = fixture.nativeElement.querySelector('[data-cy="description"]');
    expect(descElement?.textContent).toContain(testDescription);
  });

  it('should update display when @Input properties change', () => {
    component.title = 'Initial Title';
    fixture.detectChanges();

    let titleElement = fixture.nativeElement.querySelector('[data-cy="title"]');
    expect(titleElement?.textContent).toContain('Initial Title');

    // Update the input
    component.title = 'Updated Title';
    fixture.detectChanges();

    titleElement = fixture.nativeElement.querySelector('[data-cy="title"]');
    expect(titleElement?.textContent).toContain('Updated Title');
  });

  // ========== @Output Tests ==========

  /**
   * Pattern: Testing @Output event emission
   * Verifies that events are emitted correctly when user interactions occur
   * Uses spyOn to intercept and verify event emissions
   */
  it('should emit onActionClick when action button is clicked', () => {
    // Create a spy on the @Output EventEmitter
    spyOn(component.onActionClick, 'emit');

    fixture.detectChanges();

    // Trigger the click event
    const actionButton = fixture.nativeElement.querySelector('[data-cy="action-button"]');
    actionButton.click();

    // Verify the event was emitted
    expect(component.onActionClick.emit).toHaveBeenCalled();
  });

  it('should emit onActionClick with the correct data', () => {
    spyOn(component.onActionClick, 'emit');

    component.title = 'Test Title';
    fixture.detectChanges();

    const actionButton = fixture.nativeElement.querySelector('[data-cy="action-button"]');
    actionButton.click();

    // Verify the event was emitted with the correct data
    expect(component.onActionClick.emit).toHaveBeenCalledWith('Test Title');
  });

  it('should emit multiple events when clicked multiple times', () => {
    spyOn(component.onActionClick, 'emit');

    fixture.detectChanges();

    const actionButton = fixture.nativeElement.querySelector('[data-cy="action-button"]');
    actionButton.click();
    actionButton.click();
    actionButton.click();

    // Verify the event was emitted multiple times
    expect(component.onActionClick.emit).toHaveBeenCalledTimes(3);
  });

  // ========== Template Rendering Tests ==========

  /**
   * Pattern: Testing conditional rendering
   * Verifies that template elements are shown/hidden based on component state
   */
  it('should show action button when isActionEnabled is true', () => {
    component.isActionEnabled = true;
    fixture.detectChanges();

    const actionButton = fixture.nativeElement.querySelector('[data-cy="action-button"]');
    expect(actionButton).toBeTruthy();
  });

  it('should hide action button when isActionEnabled is false', () => {
    component.isActionEnabled = false;
    fixture.detectChanges();

    const actionButton = fixture.nativeElement.querySelector('[data-cy="action-button"]');
    expect(actionButton).toBeFalsy();
  });

  it('should apply correct CSS classes based on state', () => {
    component.isHighlighted = true;
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('[data-cy="container"]');
    expect(container.classList.contains('highlighted')).toBe(true);

    component.isHighlighted = false;
    fixture.detectChanges();

    expect(container.classList.contains('highlighted')).toBe(false);
  });

  // ========== Integration Tests ==========

  /**
   * Pattern: Integration test combining multiple features
   * Tests how inputs, outputs, and template rendering work together
   */
  it('should handle complete user interaction flow', () => {
    spyOn(component.onActionClick, 'emit');

    component.title = 'Complete Flow Test';
    component.description = 'Testing inputs and outputs';
    component.isActionEnabled = true;
    fixture.detectChanges();

    // Verify inputs are displayed
    const titleElement = fixture.nativeElement.querySelector('[data-cy="title"]');
    expect(titleElement?.textContent).toContain('Complete Flow Test');

    // Trigger event
    const actionButton = fixture.nativeElement.querySelector('[data-cy="action-button"]');
    actionButton.click();

    // Verify output event
    expect(component.onActionClick.emit).toHaveBeenCalledWith('Complete Flow Test');
  });
});
