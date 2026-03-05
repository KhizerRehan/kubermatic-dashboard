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

import {Component, ViewChild, ChangeDetectionStrategy, MatDialog, MatDialogRef} from '@angular/core';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';

/**
 * Test component for comprehensive user interaction testing.
 *
 * Includes various interactive elements to test:
 * - Click handling (buttons, links, icons)
 * - Input events (text input, selection changes)
 * - Keyboard events (Enter, Escape, Tab)
 * - Double-click and long-press
 * - Form submission and validation
 * - Dialog interactions
 * - Focus and blur events
 * - Drag and drop (basic)
 */
@Component({
  selector: 'km-user-interactions',
  templateUrl: './user-interactions.component.html',
  styleUrls: ['./user-interactions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserInteractionsComponent {
  form: FormGroup;
  buttonClickCount = 0;
  doubleClickCount = 0;
  longPressActive = false;
  inputValue = '';
  selectedOption = '';
  isFormSubmitted = false;
  focusedField: string | null = null;
  draggedItem: string | null = null;
  droppedItems: string[] = [];
  dialogResult = '';
  enterKeyPressed = false;
  escapeKeyPressed = false;

  constructor(
    private _formBuilder: FormBuilder,
    private _matDialog: MatDialog,
  ) {
    this.form = this._formBuilder.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      select: ['', Validators.required],
      checkbox: [false],
    });
  }

  // ========== Click Handling ==========

  onButtonClick(): void {
    this.buttonClickCount++;
  }

  onDoubleClick(): void {
    this.doubleClickCount++;
  }

  onLongPressStart(): void {
    this.longPressActive = true;
  }

  onLongPressEnd(): void {
    this.longPressActive = false;
  }

  onIconClick(): void {
    this.buttonClickCount++;
  }

  onLinkClick(): void {
    this.buttonClickCount++;
  }

  // ========== Input Events ==========

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.inputValue = input.value;
  }

  onSelectChange(value: string): void {
    this.selectedOption = value;
  }

  onFocus(field: string): void {
    this.focusedField = field;
  }

  onBlur(): void {
    this.focusedField = null;
  }

  // ========== Keyboard Events ==========

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.enterKeyPressed = true;
      event.preventDefault();
    } else if (event.key === 'Escape') {
      this.escapeKeyPressed = true;
      event.preventDefault();
    }
  }

  // ========== Form Submission ==========

  onSubmit(): void {
    if (this.form.valid) {
      this.isFormSubmitted = true;
    }
  }

  resetForm(): void {
    this.form.reset();
    this.isFormSubmitted = false;
  }

  // ========== Drag and Drop ==========

  onDragStart(event: DragEvent, item: string): void {
    this.draggedItem = item;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (this.draggedItem && !this.droppedItems.includes(this.draggedItem)) {
      this.droppedItems.push(this.draggedItem);
    }
  }

  onDragEnd(): void {
    this.draggedItem = null;
  }

  // ========== Dialog Interactions ==========

  openDialog(): void {
    // This will be mocked in tests
  }

  setDialogResult(result: string): void {
    this.dialogResult = result;
  }
}
