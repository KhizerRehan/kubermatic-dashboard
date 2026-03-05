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

import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {PageEvent} from '@angular/material/paginator';
import {Sort} from '@angular/material/sort';

interface Item {
  id: number;
  name: string;
  description: string;
  status: string;
}

/**
 * Material Integration Test Component
 *
 * Demonstrates comprehensive use of Material components:
 * - MatDialog for modal dialogs
 * - MatTable with sorting and pagination
 * - MatForm for form input and validation
 * - MatButton with various states
 * - MatExpansion panel for collapsible content
 * - MatMenu for dropdown menus
 * - MatTooltip for helper text
 * - MatTab for tabbed content
 */
@Component({
  selector: 'km-material-integration',
  templateUrl: './material-integration.component.html',
  styleUrls: ['./material-integration.component.scss'],
})
export class MaterialIntegrationComponent implements OnInit {
  form: FormGroup;
  items: Item[] = [
    {id: 1, name: 'Item 1', description: 'First item', status: 'active'},
    {id: 2, name: 'Item 2', description: 'Second item', status: 'inactive'},
    {id: 3, name: 'Item 3', description: 'Third item', status: 'active'},
  ];
  dataSource: MatTableDataSource<Item>;
  displayedColumns = ['id', 'name', 'description', 'status'];
  selectedItems: Item[] = [];
  expandedItemId: number | null = null;
  activeTab = 0;
  isLoading = false;
  showTable = true;

  constructor(
    private _formBuilder: FormBuilder,
    private _dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<Item>(this.items);
    this.form = this._formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      description: ['', Validators.maxLength(100)],
    });
  }

  ngOnInit(): void {
    this.dataSource.data = this.items;
  }

  // ========== MatDialog Methods ==========

  openDialog(): void {
    this._dialog.open(MaterialIntegrationDialogComponent);
  }

  // ========== MatTable Methods ==========

  toggleItemSelection(item: Item): void {
    const index = this.selectedItems.indexOf(item);
    if (index === -1) {
      this.selectedItems.push(item);
    } else {
      this.selectedItems.splice(index, 1);
    }
  }

  isItemSelected(item: Item): boolean {
    return this.selectedItems.includes(item);
  }

  sortData(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      return;
    }

    const sorted = this.items.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      const aValue = a[sort.active as keyof Item];
      const bValue = b[sort.active as keyof Item];

      if (aValue < bValue) return isAsc ? -1 : 1;
      if (aValue > bValue) return isAsc ? 1 : -1;
      return 0;
    });

    this.dataSource.data = sorted;
  }

  paginate(event: PageEvent): void {
    // Handle pagination event
    const startIndex = event.pageIndex * event.pageSize;
    const endIndex = startIndex + event.pageSize;
    this.dataSource.data = this.items.slice(startIndex, endIndex);
  }

  // ========== MatButton Methods ==========

  submitForm(): void {
    if (this.form.valid) {
      this.isLoading = true;
      setTimeout(() => {
        this.isLoading = false;
      }, 1000);
    }
  }

  resetForm(): void {
    this.form.reset();
  }

  deleteItem(): void {
    if (this.selectedItems.length > 0) {
      this.items = this.items.filter(item => !this.selectedItems.includes(item));
      this.dataSource.data = this.items;
      this.selectedItems = [];
    }
  }

  // ========== MatExpansion Methods ==========

  toggleExpansion(itemId: number): void {
    this.expandedItemId = this.expandedItemId === itemId ? null : itemId;
  }

  isExpanded(itemId: number): boolean {
    return this.expandedItemId === itemId;
  }

  // ========== MatMenu Methods ==========

  selectAction(action: string): void {
    if (action === 'export') {
      // Handle export
    } else if (action === 'import') {
      // Handle import
    }
  }

  // ========== MatTab Methods ==========

  selectTab(index: number): void {
    this.activeTab = index;
  }

  // ========== Helper Methods ==========

  toggleTable(): void {
    this.showTable = !this.showTable;
  }

  getFormErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `${controlName} is required`;
    }
    if (control.errors['minlength']) {
      return `${controlName} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    if (control.errors['email']) {
      return 'Invalid email format';
    }
    if (control.errors['maxlength']) {
      return `${controlName} cannot exceed ${control.errors['maxlength'].requiredLength} characters`;
    }
    return 'Invalid input';
  }
}

/**
 * Simple Material Dialog Content Component
 */
@Component({
  selector: 'km-material-integration-dialog',
  template: `
    <h2 mat-dialog-title data-cy="dialog-title">Dialog Title</h2>
    <mat-dialog-content data-cy="dialog-content">
      <p>This is a Material Dialog example.</p>
    </mat-dialog-content>
    <mat-dialog-actions data-cy="dialog-actions">
      <button mat-button (click)="onCancel()" data-cy="dialog-cancel">Cancel</button>
      <button mat-raised-button color="primary" (click)="onConfirm()" data-cy="dialog-confirm">Confirm</button>
    </mat-dialog-actions>
  `,
})
export class MaterialIntegrationDialogComponent {
  constructor(private _dialog: any) {}

  onCancel(): void {
    this._dialog.close();
  }

  onConfirm(): void {
    this._dialog.close({confirmed: true});
  }
}
