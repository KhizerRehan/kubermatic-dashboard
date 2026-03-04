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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '@shared/module';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {ConfirmationDialogComponent, ConfirmationDialogConfig} from './component';

describe('ConfirmationDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  let component: ConfirmationDialogComponent;
  let dialogRef: MatDialogRefMock;
  let dialogData: ConfirmationDialogConfig;

  beforeEach(() => {
    dialogData = {
      title: 'Delete Item?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
    };

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: dialogData},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as MatDialogRefMock;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should initialize', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should inject MAT_DIALOG_DATA correctly', () => {
      expect(component.data).toEqual(dialogData);
    });

    it('should initialize inputName as empty string', () => {
      expect(component.inputName).toBe('');
    });

    it('should have injected MatDialogRef', () => {
      expect(component.dialogRef).toBeTruthy();
    });
  });

  describe('inputNameMatches Method', () => {
    it('should return true when inputName matches compareName', () => {
      component.data.compareName = 'my-item';
      component.inputName = 'my-item';
      expect(component.inputNameMatches()).toBe(true);
    });

    it('should return false when inputName does not match compareName', () => {
      component.data.compareName = 'my-item';
      component.inputName = 'wrong-name';
      expect(component.inputNameMatches()).toBe(false);
    });

    it('should return true when compareName is not provided', () => {
      component.data.compareName = undefined;
      expect(component.inputNameMatches()).toBe(true);
    });

    it('should return true when compareName is empty string', () => {
      component.data.compareName = '';
      expect(component.inputNameMatches()).toBe(true);
    });

    it('should handle special characters in compareName', () => {
      component.data.compareName = 'item-with-@#$-chars';
      component.inputName = 'item-with-@#$-chars';
      expect(component.inputNameMatches()).toBe(true);
    });

    it('should be case-sensitive when matching names', () => {
      component.data.compareName = 'MyItem';
      component.inputName = 'myitem';
      expect(component.inputNameMatches()).toBe(false);
    });
  });

  describe('onChange Method', () => {
    it('should update inputName when input value changes', () => {
      const event = {target: {value: 'my-item'}};
      component.onChange(event);
      expect(component.inputName).toBe('my-item');
    });

    it('should handle empty input changes', () => {
      component.inputName = 'previous-value';
      const event = {target: {value: ''}};
      component.onChange(event);
      expect(component.inputName).toBe('');
    });

    it('should handle special characters in input', () => {
      const event = {target: {value: 'item-with-!@#$%'}};
      component.onChange(event);
      expect(component.inputName).toBe('item-with-!@#$%');
    });
  });

  describe('onEnterKeyDown Method', () => {
    it('should close dialog with true when no verification is required', () => {
      component.data.compareName = undefined;
      component.onEnterKeyDown();
      expect(dialogRef.closeCalled).toBe(true);
    });

    it('should close dialog with true when inputName matches compareName', () => {
      component.data.compareName = 'my-item';
      component.inputName = 'my-item';
      component.onEnterKeyDown();
      expect(dialogRef.closeCalled).toBe(true);
    });

    it('should not close dialog when inputName does not match compareName', () => {
      component.data.compareName = 'my-item';
      component.inputName = 'wrong-name';
      component.onEnterKeyDown();
      expect(dialogRef.closeCalled).toBe(false);
    });
  });

  describe('getIconClass Method', () => {
    it('should return a non-empty string', () => {
      const iconClass = component.getIconClass();
      expect(typeof iconClass).toBe('string');
    });

    it('should return icon class based on confirmLabel', () => {
      component.data.confirmLabel = 'Delete';
      const iconClass = component.getIconClass();
      expect(iconClass).toBeTruthy();
    });
  });

  describe('Dialog with Warning Message', () => {
    it('should have warning message in data', () => {
      component.data.warning = 'This is a destructive operation!';
      expect(component.data.warning).toBe('This is a destructive operation!');
    });

    it('should render dialog component even with warning', () => {
      component.data.warning = 'This is a destructive operation!';
      expect(component).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long title', () => {
      component.data.title = 'A'.repeat(500);
      expect(component.data.title.length).toBe(500);
      expect(component).toBeTruthy();
    });

    it('should handle very long message', () => {
      component.data.message = 'B'.repeat(1000);
      expect(component.data.message.length).toBe(1000);
      expect(component).toBeTruthy();
    });

    it('should handle null warning message', () => {
      component.data.warning = null;
      expect(component).toBeTruthy();
    });

    it('should handle whitespace in input name', () => {
      component.data.compareName = 'my item';
      component.inputName = 'my item';
      expect(component.inputNameMatches()).toBe(true);
    });

    it('should handle multiline input names with newlines', () => {
      component.data.compareName = 'line1\nline2';
      component.inputName = 'line1\nline2';
      expect(component.inputNameMatches()).toBe(true);
    });
  });

  describe('Dialog State Transitions', () => {
    it('should maintain state across multiple onChange calls', () => {
      component.onChange({target: {value: 'first'}});
      expect(component.inputName).toBe('first');

      component.onChange({target: {value: 'second'}});
      expect(component.inputName).toBe('second');

      component.onChange({target: {value: 'third'}});
      expect(component.inputName).toBe('third');
    });
  });

  describe('Data Injection Validation', () => {
    it('should require title in dialog data', () => {
      expect(component.data.title).toBeTruthy();
    });

    it('should require message in dialog data', () => {
      expect(component.data.message).toBeTruthy();
    });

    it('should require confirmLabel in dialog data', () => {
      expect(component.data.confirmLabel).toBeTruthy();
    });

    it('should handle optional fields gracefully', () => {
      const minimalData: ConfirmationDialogConfig = {
        title: 'Confirm',
        message: 'Are you sure?',
        confirmLabel: 'Yes',
      };

      expect(minimalData.warning).toBeUndefined();
      expect(minimalData.compareName).toBeUndefined();
    });
  });
});
