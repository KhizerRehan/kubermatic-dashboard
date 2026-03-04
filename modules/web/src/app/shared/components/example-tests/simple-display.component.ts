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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

/**
 * Simple Display Component
 *
 * This is a simple presentational component for testing basic component patterns.
 * It demonstrates:
 * - @Input properties for data binding
 * - @Output events for parent communication
 * - Conditional rendering based on state
 * - CSS class binding
 */
@Component({
  selector: 'km-simple-display',
  templateUrl: './simple-display.component.html',
  styleUrls: ['./simple-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleDisplayComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() isActionEnabled: boolean = true;
  @Input() isHighlighted: boolean = false;

  @Output() onActionClick = new EventEmitter<string>();

  onAction(): void {
    this.onActionClick.emit(this.title);
  }
}
