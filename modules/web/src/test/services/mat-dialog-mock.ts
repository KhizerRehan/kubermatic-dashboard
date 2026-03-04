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
 * Minimal mock for testing components that use MatDialog. Currently empty
 * to avoid dependencies on Material DialogRef. Extend this class for
 * custom behavior, or use MatDialogRef with MAT_DIALOG_DATA token directly.
 *
 * For dialog testing, prefer one of these approaches:
 * 1. Test dialog component in isolation with MAT_DIALOG_DATA injection
 * 2. Extend this mock to add custom dialog-open behavior
 * 3. Mock only the dialog methods your component actually uses
 *
 * @example
 * ```typescript
 * // Approach 1: Test dialog component directly
 * TestBed.configureTestingModule({
 *   declarations: [MyDialogComponent],
 *   providers: [
 *     {provide: MAT_DIALOG_DATA, useValue: {userId: '123'}}
 *   ]
 * });
 * const dialogComponent = TestBed.createComponent(MyDialogComponent);
 * ```
 *
 * @example
 * ```typescript
 * // Approach 2: Extend mock with custom behavior
 * class MyDialogMock extends MatDialogMock {
 *   open(component: any, config: any) {
 *     return {close: (result) => {}} as any;
 *   }
 * }
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: MatDialog, useClass: MyDialogMock}
 *   ]
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Approach 3: Use MatDialogRef directly
 * const dialogRefMock = new MatDialogRefMock();
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: MatDialogRef, useValue: dialogRefMock}
 *   ]
 * });
 * ```
 *
 * @see {@link MatDialog} - Real Angular Material dialog service
 * @see {@link MatDialogRefMock} - Companion mock for dialog reference
 * @see {@link MAT_DIALOG_DATA} - Token for injecting dialog data into component
 */
export class MatDialogMock {}
