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

import {ChangeDetectionStrategy, Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

/**
 * Dialog Content Component
 *
 * This component demonstrates Material dialog patterns including:
 * - Receiving data via MAT_DIALOG_DATA
 * - Closing dialog with return data via MatDialogRef
 * - Handling different dialog modes (edit, delete, etc.)
 * - Error state management
 */
@Component({
  selector: 'km-dialog-content',
  templateUrl: './dialog-content.component.html',
  styleUrls: ['./dialog-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogContentComponent {
  mode: 'edit' | 'delete' = 'edit';
  isFormValid: boolean = true;
  error: string | null = null;
  formData: any = {};

  constructor(
    public dialogRef: MatDialogRef<DialogContentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmAction(): void {
    const result = {
      confirmed: true,
      userId: this.data?.userId,
    };

    this.dialogRef.close(result);
  }

  deleteAction(): void {
    const result = {
      confirmed: true,
      action: 'delete',
      userId: this.data?.userId,
    };

    this.dialogRef.close(result);
  }

  closeDialog(): void {
    this.dialogRef.close(null);
  }
}
