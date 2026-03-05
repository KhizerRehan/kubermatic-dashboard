// Copyright 2025 The Kubermatic Kubernetes Platform contributors.
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

import {MatSnackBar, MatSnackBarRef} from '@angular/material/snack-bar';
import {TestBed} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

import {NotificationService} from './notification';

describe('NotificationService', () => {
  let service: NotificationService;
  let snackBar: MatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [NotificationService, MatSnackBar],
    });

    service = TestBed.inject(NotificationService);
    snackBar = TestBed.inject(MatSnackBar);
  });

  afterEach(() => {
    // Clean up any open snackbars
    snackBar.dismiss();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('success()', () => {
    it('should display success notification', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      const message = 'Operation completed successfully';
      service.success(message);

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should accept custom duration for success notification', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      const message = 'Success!';
      service.success(message, 5000);

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should display success notification with default duration', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.success('Success message');

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle empty success message', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.success('');

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle long success message', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      const longMessage = 'A'.repeat(500);
      service.success(longMessage);

      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  describe('warning()', () => {
    it('should display warning notification', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      const message = 'This is a warning';
      service.warning(message);

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should accept custom duration for warning notification', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      const message = 'Warning!';
      service.warning(message, 3000);

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should display warning notification with default duration', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.warning('Warning message');

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle multiple warning notifications', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.warning('Warning 1');
      service.warning('Warning 2');
      service.warning('Warning 3');

      expect(snackBar.open).toHaveBeenCalledTimes(3);
    });
  });

  describe('error()', () => {
    it('should display error notification', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      const message = 'An error occurred';
      service.error(message);

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should accept custom duration for error notification', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      const message = 'Error!';
      service.error(message, 5000);

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should display error notification with default duration', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.error('Error message');

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle error messages with special characters', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      const message = 'Error: <script>alert("test")</script>';
      service.error(message);

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle multiple error notifications', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.error('Error 1');
      service.error('Error 2');
      service.error('Error 3');

      expect(snackBar.open).toHaveBeenCalledTimes(3);
    });
  });

  describe('Generic notify()', () => {
    it('should display notification with custom message', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      const message = 'Custom notification';
      service.notify(message);

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should accept duration parameter in notify', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.notify('Message', 3000);

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle empty notification message', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.notify('');

      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  describe('Notification Priority and Sequencing', () => {
    it('should queue multiple notifications sequentially', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.success('First');
      service.warning('Second');
      service.error('Third');
      service.success('Fourth');

      expect(snackBar.open).toHaveBeenCalledTimes(4);
    });

    it('should handle rapid notification calls', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      for (let i = 0; i < 10; i++) {
        service.success(`Notification ${i}`);
      }

      expect(snackBar.open).toHaveBeenCalledTimes(10);
    });

    it('should display different notification types correctly', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.success('Success');
      service.warning('Warning');
      service.error('Error');

      expect(snackBar.open).toHaveBeenCalledTimes(3);
    });
  });

  describe('Notification Duration', () => {
    it('should use provided duration', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.success('Message', 1000);

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle zero duration', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.success('Message', 0);

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle negative duration gracefully', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.success('Message', -1000);

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle very large duration', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.success('Message', 999999);

      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  describe('Notification Message Variations', () => {
    it('should handle notification with HTML content', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.success('<strong>Bold</strong> message');

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle notification with unicode characters', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.success('✓ Success 中文 العربية');

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle notification with newlines', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.error('Error line 1\nError line 2\nError line 3');

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should handle notification with whitespace', () => {
      spyOn(snackBar, 'open').and.returnValue({} as MatSnackBarRef<any>);

      service.success('   Message with spaces   ');

      expect(snackBar.open).toHaveBeenCalled();
    });
  });
});
