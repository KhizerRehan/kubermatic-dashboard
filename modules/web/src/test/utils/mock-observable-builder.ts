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

import {Observable, Subject, throwError, NEVER, of} from 'rxjs';
import {delay} from 'rxjs/operators';

/**
 * Helper class for creating mock observables in tests.
 *
 * Provides factory methods to create observables with different emission patterns
 * (success, error, timeout) for testing RxJS-based code and observables-heavy components.
 *
 * @example
 * ```typescript
 * // Create observable that emits data then completes
 * const data$ = MockObservableBuilder.success({id: 1, name: 'Test'});
 *
 * // Create observable that emits error
 * const error$ = MockObservableBuilder.error(new Error('API failed'));
 *
 * // Create observable that never emits (timeout scenario)
 * const timeout$ = MockObservableBuilder.timeout();
 *
 * // Create subject-based observable for testing subscriptions
 * const subject = MockObservableBuilder.createSubject<string>();
 * ```
 */
export class MockObservableBuilder {
  /**
   * Creates an observable that emits data then completes.
   *
   * Useful for mocking successful API responses or data streams that emit once and complete.
   * Optionally add delay to simulate network latency.
   *
   * @template T - Type of data emitted
   * @param {T} data - Data to emit before completion
   * @param {number} [delayMs=0] - Optional delay in milliseconds before emission
   * @returns {Observable<T>} Observable that emits data then completes
   *
   * @example
   * ```typescript
   * // Immediate emission
   * const user$ = MockObservableBuilder.success({id: 1, name: 'John'});
   * user$.subscribe(user => console.log(user)); // Logs {id: 1, name: 'John'}
   *
   * // With delay (simulating network latency)
   * const delayed$ = MockObservableBuilder.success({status: 'ok'}, 100);
   * // Will emit after 100ms delay
   * ```
   */
  static success<T>(data: T, delayMs: number = 0): Observable<T> {
    return delayMs > 0 ? of(data).pipe(delay(delayMs)) : of(data);
  }

  /**
   * Creates an observable that emits an error.
   *
   * Useful for testing error handling, error interceptors, and error recovery logic
   * in components and services.
   *
   * @template T - Expected type of the observable (though error will be thrown before emission)
   * @param {Error | any} error - Error to emit (Error object or any value)
   * @param {number} [delayMs=0] - Optional delay in milliseconds before error emission
   * @returns {Observable<T>} Observable that emits error
   *
   * @example
   * ```typescript
   * // Immediate error
   * const error$ = MockObservableBuilder.error(new Error('API failed'));
   * error$.subscribe(
   *   () => {},
   *   err => console.error(err.message) // Logs 'API failed'
   * );
   *
   * // With delay
   * const delayedError$ = MockObservableBuilder.error(new Error('Timeout'), 500);
   * // Will emit error after 500ms delay
   * ```
   */
  static error<T>(error: Error | any, delayMs: number = 0): Observable<T> {
    return delayMs > 0 ? of(null).pipe(delay(delayMs), throwError(() => error)) : throwError(() => error);
  }

  /**
   * Creates an observable that never emits or completes.
   *
   * Useful for testing timeout scenarios, subscription cleanup, and cases where
   * a request hangs indefinitely. Often used to test unsubscribe logic.
   *
   * @template T - Expected type of the observable (never emitted)
   * @returns {Observable<T>} Observable that never emits
   *
   * @example
   * ```typescript
   * // Observable that represents a hanging request
   * const hanging$ = MockObservableBuilder.timeout();
   *
   * const subscription = hanging$.subscribe(
   *   () => console.log('Will never be called')
   * );
   *
   * // Test that subscription is properly cleaned up
   * subscription.unsubscribe();
   * ```
   */
  static timeout<T>(): Observable<T> {
    return NEVER;
  }

  /**
   * Creates a Subject that can emit multiple values over time.
   *
   * Useful for testing subscriptions, multiple emissions, and component reactions
   * to data stream changes. Subject allows you to control when values are emitted
   * during tests.
   *
   * @template T - Type of values emitted by subject
   * @returns {Subject<T>} Subject for manual value emission
   *
   * @example
   * ```typescript
   * // Create subject for manual control
   * const items$ = MockObservableBuilder.createSubject<string>();
   *
   * const results: string[] = [];
   * items$.subscribe(item => results.push(item));
   *
   * // Emit values manually during test
   * items$.next('first');
   * items$.next('second');
   * items$.complete();
   *
   * expect(results).toEqual(['first', 'second']);
   * ```
   */
  static createSubject<T>(): Subject<T> {
    return new Subject<T>();
  }

  /**
   * Creates an observable that emits array of items one by one.
   *
   * Useful for mocking APIs that return lists where each item needs to be
   * processed individually, or for testing accumulation of streamed data.
   *
   * @template T - Type of items in array
   * @param {T[]} items - Array of items to emit
   * @param {number} [delayMs=0] - Optional delay in milliseconds between each emission
   * @returns {Observable<T>} Observable that emits each item then completes
   *
   * @example
   * ```typescript
   * // Emit array items
   * const items$ = MockObservableBuilder.successArray(['a', 'b', 'c']);
   * const results: string[] = [];
   * items$.subscribe(item => results.push(item));
   * // results = ['a', 'b', 'c']
   *
   * // With delay between items
   * const delayedItems$ = MockObservableBuilder.successArray([1, 2, 3], 100);
   * // Each item emitted 100ms apart
   * ```
   */
  static successArray<T>(items: T[], delayMs: number = 0): Observable<T> {
    if (items.length === 0) {
      return of();
    }
    return new Observable(subscriber => {
      let index = 0;
      const emit = () => {
        if (index < items.length) {
          subscriber.next(items[index++]);
          if (delayMs > 0 && index < items.length) {
            setTimeout(emit, delayMs);
          } else if (index < items.length) {
            emit();
          } else {
            subscriber.complete();
          }
        }
      };
      emit();
    });
  }
}
