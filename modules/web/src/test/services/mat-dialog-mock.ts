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

/**
 * Mock implementation of Angular Material MatDialog service.
 *
 * Provides dialog opening and closing simulation for testing components that use MatDialog.
 * Tracks dialog opening events and supports custom dialog return values.
 *
 * **Advanced Testing Features:**
 * - Call tracking: Track how many times open() was called and with what arguments
 * - Custom return values: Configure dialogs to close with specific data or errors
 * - Dialog ref mocking: Simulates MatDialogRef behavior (close, afterClosed)
 * - Error simulation: Configure dialogs to fail with specific errors
 *
 * For dialog testing, use one of these approaches:
 * 1. Test dialog component in isolation with MAT_DIALOG_DATA injection
 * 2. Use this mock to test parent component dialog opening/closing behavior
 * 3. Mock only the dialog methods your component actually uses
 *
 * @example
 * ```typescript
 * // Basic usage: Test that component opens dialog
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: MatDialog, useClass: MatDialogMock}
 *   ]
 * });
 * const dialogMock = TestBed.inject(MatDialog) as MatDialogMock;
 * fixture.detectChanges();
 * // Component triggers dialog.open(...)
 * expect(dialogMock.openCallCount).toBe(1);
 * expect(dialogMock.openCallArguments[0].component).toBe(MyDialogComponent);
 * ```
 *
 * @example
 * ```typescript
 * // Test dialog result handling
 * const dialogMock = TestBed.inject(MatDialog) as MatDialogMock;
 * dialogMock.setDialogReturnValue({saved: true, id: '123'});
 * fixture.detectChanges();
 * // Component opens dialog and handles result
 * expect(component.lastSavedId).toBe('123');
 * ```
 *
 * @see {@link MatDialog} - Real Angular Material dialog service
 * @see {@link MatDialogRefMock} - Companion mock for dialog reference
 * @see {@link MAT_DIALOG_DATA} - Token for injecting dialog data into component
 */
import {Observable, of} from 'rxjs';

export class MatDialogMock {
  /** @private Tracks how many times open() was called */
  private _openCallCount = 0;

  /** @private Stores open() call arguments */
  private _openCallArguments: Array<{component: any; config?: any; timestamp: Date}> = [];

  /** @private Custom return value for dialog close */
  private _dialogReturnValue: any = null;

  /** @private Flag to simulate dialog error */
  private _shouldError = false;

  /** @private Error message for dialog failure */
  private _errorMessage = 'Dialog operation failed';

  /**
   * Opens a dialog with the given component.
   *
   * Returns a mock dialog reference that simulates afterClosed() and close() behavior.
   * Automatically tracks call count and arguments for assertion purposes.
   *
   * @param {any} component - Component to display in dialog
   * @param {any} config - Optional dialog configuration (width, data, etc.)
   * @returns {any} Mock MatDialogRef with afterClosed() observable and close() method
   *
   * @example
   * ```typescript
   * const dialogMock = TestBed.inject(MatDialog) as MatDialogMock;
   * fixture.detectChanges();
   * // Component opens dialog
   * expect(dialogMock.openCallCount).toBe(1);
   * expect(dialogMock.openCallArguments[0].component).toBe(MyDialogComponent);
   * ```
   *
   * @example
   * ```typescript
   * // Dialog with configuration
   * dialogMock.open(MyComponent, {width: '400px', data: {userId: '123'}});
   * const args = dialogMock.openCallArguments[0];
   * expect(args.config.width).toBe('400px');
   * expect(args.config.data.userId).toBe('123');
   * ```
   *
   * @example
   * ```typescript
   * // Handle dialog result
   * dialogMock.setDialogReturnValue({action: 'save', data: {...}});
   * const dialogRef = dialogMock.open(MyComponent);
   * dialogRef.afterClosed().subscribe(result => {
   *   expect(result.action).toBe('save');
   * });
   * ```
   */
  open(component: any, config?: any): any {
    this._openCallCount++;
    this._openCallArguments.push({component, config, timestamp: new Date()});

    const returnValue = this._dialogReturnValue;
    const shouldError = this._shouldError;
    const errorMessage = this._errorMessage;

    return {
      afterClosed: () => {
        if (shouldError) {
          return new Observable(subscriber => {
            subscriber.error(new Error(errorMessage));
          });
        }
        return of(returnValue);
      },
      close: (result?: any) => {
        // No-op in mock
      },
      // Additional DialogRef properties that components might use
      componentInstance: {},
      result: shouldError
        ? Promise.reject(new Error(errorMessage))
        : Promise.resolve(returnValue),
    };
  }

  // ===== Call Tracking Properties =====

  /**
   * Gets the number of times open() was called.
   *
   * @returns {number} Count of open() calls
   *
   * @example
   * ```typescript
   * const dialogMock = TestBed.inject(MatDialog) as MatDialogMock;
   * dialogMock.open(Component1);
   * dialogMock.open(Component2);
   * expect(dialogMock.openCallCount).toBe(2);
   * ```
   */
  get openCallCount(): number {
    return this._openCallCount;
  }

  /**
   * Gets the arguments that were passed to open() calls.
   *
   * Each entry includes component, optional config, and timestamp.
   *
   * @returns {Array} Array of open() call records
   *
   * @example
   * ```typescript
   * dialogMock.open(MyComponent, {width: '400px', data: {id: '123'}});
   * const args = dialogMock.openCallArguments[0];
   * expect(args.component).toBe(MyComponent);
   * expect(args.config.width).toBe('400px');
   * expect(args.config.data.id).toBe('123');
   * ```
   */
  get openCallArguments(): typeof this._openCallArguments {
    return this._openCallArguments;
  }

  // ===== Configuration Methods =====

  /**
   * Sets the return value that will be emitted when dialog closes.
   *
   * Useful for testing component behavior after dialog result is received.
   *
   * @param {any} value - Value to emit when dialog closes
   *
   * @example
   * ```typescript
   * dialogMock.setDialogReturnValue({action: 'save', id: 'proj-123'});
   * component.openProjectDialog();
   * fixture.detectChanges();
   * // Component receives and handles the result
   * expect(component.selectedProject.id).toBe('proj-123');
   * ```
   */
  setDialogReturnValue(value: any): void {
    this._dialogReturnValue = value;
  }

  /**
   * Configures dialog to return an error when closed.
   *
   * Useful for testing error handling in dialog result handling.
   *
   * @param {boolean} shouldError - True to make dialog fail, false for success
   * @param {string} errorMessage - Error message to emit on failure
   *
   * @example
   * ```typescript
   * dialogMock.setDialogError(true, 'User cancelled dialog');
   * component.openDialog();
   * fixture.detectChanges();
   * // Component should handle error gracefully
   * expect(component.showErrorNotification).toBe(true);
   * ```
   */
  setDialogError(shouldError: boolean, errorMessage: string = 'Dialog operation failed'): void {
    this._shouldError = shouldError;
    this._errorMessage = errorMessage;
  }

  /**
   * Resets all call tracking counters and arguments.
   *
   * Useful in beforeEach() hooks to ensure clean state between tests.
   *
   * @example
   * ```typescript
   * beforeEach(() => {
   *   const dialogMock = TestBed.inject(MatDialog) as MatDialogMock;
   *   dialogMock.resetCallTracking();
   *   expect(dialogMock.openCallCount).toBe(0);
   * });
   * ```
   */
  resetCallTracking(): void {
    this._openCallCount = 0;
    this._openCallArguments = [];
  }

  /**
   * Resets all custom configurations and call tracking.
   *
   * Resets the mock to its default state.
   *
   * @example
   * ```typescript
   * afterEach(() => {
   *   const dialogMock = TestBed.inject(MatDialog) as MatDialogMock;
   *   dialogMock.resetAll();
   * });
   * ```
   */
  resetAll(): void {
    this._dialogReturnValue = null;
    this._shouldError = false;
    this._errorMessage = 'Dialog operation failed';
    this.resetCallTracking();
  }
}
