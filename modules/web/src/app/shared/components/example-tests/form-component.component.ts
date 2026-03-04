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
 * Custom validator for age range
 */
export function ageRangeValidator(control: any) {
  const value = control.value;
  if (value === null || value === undefined) {
    return null;
  }
  if (value < 18 || value > 120) {
    return {ageRange: {value: control.value}};
  }
  return null;
}

/**
 * Form Example Component
 *
 * This component demonstrates reactive form patterns including:
 * - Form initialization with FormBuilder
 * - Form validation (required, email, custom validators)
 * - Form submission handling
 * - Error message display
 */
@Component({
  selector: 'km-form-example',
  templateUrl: './form-component.component.html',
  styleUrls: ['./form-component.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormExampleComponent implements OnInit {
  form!: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      age: [null, [Validators.required, ageRangeValidator]],
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      // Handle form submission
      console.log('Form submitted:', this.form.value);
      // Reset form after submission
      this.form.reset();
    }
  }
}
