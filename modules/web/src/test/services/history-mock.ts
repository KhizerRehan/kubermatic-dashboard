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

import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

/**
 * Mock implementation of HistoryService for testing navigation history tracking.
 *
 * Provides browser history navigation without actual router integration.
 * Useful for testing components that use navigation history, back button
 * functionality, and route state tracking.
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: HistoryService, useClass: HistoryMockService}
 *   ]
 * });
 * const historyMock = TestBed.inject(HistoryService) as HistoryMockService;
 * ```
 *
 * @see {@link HistoryService} - Real history service implementation
 */
@Injectable()
export class HistoryMockService {
  /**
   * Event emitted when navigation changes.
   *
   * Components can subscribe to detect navigation state changes:
   * ```typescript
   * historyMock.onNavigationChange.subscribe(() => {
   *   console.log('Navigation changed');
   * });
   * ```
   *
   * Tests can emit events to simulate navigation:
   * ```typescript
   * historyMock.onNavigationChange.next();
   * ```
   *
   * @type {Subject<void>}
   */
  readonly onNavigationChange = new Subject<void>();

  /**
   * Initializes the history service.
   *
   * Mock is a no-op but available for component compatibility.
   * Real service would initialize router event listeners.
   *
   * @example
   * ```typescript
   * historyMock.init();
   * // Service is ready to track navigation
   * ```
   */
  init(): void {
    // Mock: no-op initialization
  }

  /**
   * Navigates back to previous route.
   *
   * Mock simulates navigation by:
   * - Always returning resolved Promise with true
   * - Emitting navigation change event
   * - Ignoring the defaultState parameter
   *
   * Tests can verify navigation by checking the promise resolution.
   *
   * @param {string} _defaultState - Default route if no history exists (ignored)
   * @returns {Promise<boolean>} Promise resolving to true on successful navigation
   *
   * @example
   * ```typescript
   * it('should navigate back', fakeAsync(() => {
   *   historyMock.goBack('/projects').then(result => {
   *     expect(result).toBe(true);
   *   });
   * }));
   * ```
   *
   * @example
   * ```typescript
   * it('should emit navigation change on back', fakeAsync(() => {
   *   spyOn(historyMock.onNavigationChange, 'next');
   *   historyMock.goBack('/projects').then(() => {
   *     expect(historyMock.onNavigationChange.next).toHaveBeenCalled();
   *   });
   * }));
   * ```
   */
  goBack(_defaultState: string): Promise<boolean> {
    this.onNavigationChange.next();
    return Promise.resolve(true);
  }
}
