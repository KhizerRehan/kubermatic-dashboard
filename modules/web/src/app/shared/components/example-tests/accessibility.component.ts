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

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

/**
 * Accessibility Test Component
 *
 * This component demonstrates accessible form patterns including:
 * - Proper ARIA labels and descriptions
 * - Keyboard navigation and focus management
 * - Form field label associations
 * - Error announcements with aria-invalid and aria-describedby
 * - Loading states with aria-busy
 * - Role definitions for custom components
 */
@Component({
  selector: 'km-accessibility-test',
  templateUrl: './accessibility.component.html',
  styleUrls: ['./accessibility.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessibilityTestComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  isSubmitted = false;
  errorMessage = '';
  successMessage = '';
  focusedElement: HTMLElement | null = null;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]],
      subscribe: [false],
    });
  }

  onSubmit(): void {
    this.isSubmitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.errorMessage = 'Please correct the errors below.';
      return;
    }

    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = 'Form submitted successfully!';
      this.form.reset();
      this.isSubmitted = false;
    }, 1000);
  }

  trackFocus(element: HTMLElement): void {
    this.focusedElement = element;
  }

  resetForm(): void {
    this.form.reset();
    this.isSubmitted = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onKeyDown(event: KeyboardEvent): void {
    // Handle Escape key to close form
    if (event.key === 'Escape') {
      this.resetForm();
    }
  }
}
