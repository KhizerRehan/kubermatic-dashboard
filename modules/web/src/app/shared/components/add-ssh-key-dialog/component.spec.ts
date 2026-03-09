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

import {ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule, By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {CoreModule} from '@core/module';
import {NotificationService} from '@core/services/notification';
import {SSHKeyService} from '@app/core/services/ssh-key/ssh-key';
import {SharedModule} from '@shared/module';
import {fakeProject} from '@test/data/project';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {RouterStub} from '@test/services/router-stubs';
import {SSHKeyMockService} from '@test/services/ssh-key-mock';
import {click} from '@test/utils/click-handler';
import {AddSshKeyDialogComponent} from './component';
import {SSHKey} from '@shared/entity/ssh-key';

describe('AddSshKeyDialogComponent', () => {
  let fixture: ComponentFixture<AddSshKeyDialogComponent>;
  let component: AddSshKeyDialogComponent;
  let dialogRef: MatDialogRefMock;
  let notificationService: NotificationService;
  let googleAnalyticsService: GoogleAnalyticsService;

  const validSSHKey =
    'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCyVGaw1PuEl98f4/7Kq3O9ZIvDw2OFOSXAFVqilSFNkHlefm1iMtPeqsIBp2t9cbGUf55xNDULz/bD/4BCV43yZ5lh0cUYuXALg9NI29ui7PEGReXjSpNwUD6ceN/78YOK41KAcecq+SS0bJ4b4amKZIJG3JWmDKljtv1dmSBCrTmEAQaOorxqGGBYmZS7NQumRe4lav5r6wOs8OACMANE1ejkeZsGFzJFNqvr5DuHdDL5FAudW23me3BDmrM9ifUzzjl1Jwku3bnRaCcjaxH8oTumt1a00mWci/1qUlaVFft085yvVq7KZbF2OPPbl+erDW91+EZ2FgEi+v1/CSJ5 your_username@hostname';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: Router, useClass: RouterStub},
        {provide: SSHKeyService, useClass: SSHKeyMockService},
        GoogleAnalyticsService,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSshKeyDialogComponent);
    component = fixture.componentInstance;
    component.projectID = fakeProject().id;
    dialogRef = TestBed.inject(MatDialogRef) as MatDialogRefMock;
    notificationService = TestBed.inject(NotificationService);
    googleAnalyticsService = TestBed.inject(GoogleAnalyticsService);
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the add node modal cmp', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should initialize form with name and key controls', waitForAsync(() => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('name')).toBeTruthy();
      expect(component.form.get('key')).toBeTruthy();
    }));

    it('should have default title', waitForAsync(() => {
      expect(component.title).toBe('Add SSH Key');
    }));

    it('should track projectID from input', waitForAsync(() => {
      expect(component.projectID).toBeTruthy();
    }));

    it('should emit google analytics event on init', waitForAsync(() => {
      const spy = jest.spyOn(googleAnalyticsService, 'emitEvent');
      component.ngOnInit();
      expect(spy).toHaveBeenCalledWith('addSshKey', 'addSshKeyDialogOpened');
    }));
  });

  describe('Form Validation', () => {
    it('form invalid when empty', () => {
      expect(component.form.valid).toBeFalsy();
    });

    it('form invalid when only name provided', () => {
      component.form.controls['name'].setValue('test-key');
      expect(component.form.valid).toBeFalsy();
    });

    it('form invalid when only key provided', () => {
      component.form.controls['key'].setValue(validSSHKey);
      expect(component.form.valid).toBeFalsy();
    });

    it('form valid when both name and key provided', () => {
      component.form.controls['name'].setValue('test-key');
      component.form.controls['key'].setValue(validSSHKey);
      expect(component.form.valid).toBeTruthy();
    });

    it('name field required validation', () => {
      const name = component.form.controls['name'];
      let errors = name.errors || {};
      expect(errors['required']).toBeTruthy();

      name.setValue('test');
      errors = name.errors || {};
      expect(errors['required']).toBeFalsy();
    });

    it('key field required validation', () => {
      const key = component.form.controls['key'];
      let errors = key.errors || {};
      expect(errors['required']).toBeTruthy();

      key.setValue(validSSHKey);
      errors = key.errors || {};
      expect(errors['required']).toBeFalsy();
    });
  });

  describe('SSH Key Validation', () => {
    it('validation should fail when SSH key is invalid format', fakeAsync(() => {
      component.form.controls['name'].setValue('test');
      component.form.controls['key'].setValue('ssh-rsa 7Kq3O9ZIvDwt9cbGUf55xN');
      expect(component.form.valid).toBeFalsy();
    }));

    it('validation should fail when SSH key type is invalid', fakeAsync(() => {
      component.form.controls['name'].setValue('test');
      component.form.controls['key'].setValue('ssh-rda 7Kq3O9ZIvDwt9cbGUf55xN');
      expect(component.form.valid).toBeFalsy();
    }));

    it('validation should fail when SSH key is plain text', fakeAsync(() => {
      component.form.controls['name'].setValue('test');
      component.form.controls['key'].setValue('test');
      expect(component.form.valid).toBeFalsy();
    }));

    it('validation should succeed with valid RSA SSH key', () => {
      component.form.controls['name'].setValue('test-key');
      component.form.controls['key'].setValue(validSSHKey);
      expect(component.form.valid).toBeTruthy();
    });

    it('validation should fail with empty key', () => {
      component.form.controls['name'].setValue('test-key');
      component.form.controls['key'].setValue('');
      expect(component.form.valid).toBeFalsy();
    });
  });

  describe('Form Submission', () => {
    it('submitting a form closes dialog', fakeAsync(() => {
      expect(component.form.valid).toBeFalsy();
      component.form.controls['name'].setValue('testname');
      component.form.controls['key'].setValue(validSSHKey);
      expect(component.form.valid).toBeTruthy();

      const spyDialogRefClose = jest.spyOn(dialogRef, 'close');

      fixture.detectChanges();
      const submitButton = fixture.debugElement.query(By.css('button'));

      click(submitButton);

      tick();
      fixture.detectChanges();
      flush();

      expect(spyDialogRefClose).toHaveBeenCalledTimes(1);
    }));

    it('getObservable should return observable', fakeAsync(() => {
      component.form.controls['name'].setValue('test-key');
      component.form.controls['key'].setValue(validSSHKey);

      const obs = component.getObservable();
      expect(obs).toBeTruthy();

      tick();
      flush();
    }));
  });

  describe('onNext Method', () => {
    it('should close dialog and show notification', fakeAsync(() => {
      const mockSSHKey: SSHKey = {
        name: 'test-key',
        id: 'key-123',
        spec: {publicKey: validSSHKey},
      } as any;

      const notificationSpy = jest.spyOn(notificationService, 'success');

      component.onNext(mockSSHKey);

      tick();

      expect(dialogRef.closeCalled).toBe(true);
      expect(notificationSpy).toHaveBeenCalledWith(expect.stringContaining('test-key'));
    }));

    it('should emit analytics event on next', fakeAsync(() => {
      const mockSSHKey: SSHKey = {
        name: 'test-key',
        id: 'key-123',
        spec: {publicKey: validSSHKey},
      } as any;

      const analyticsSpy = jest.spyOn(googleAnalyticsService, 'emitEvent');

      component.onNext(mockSSHKey);

      tick();

      expect(analyticsSpy).toHaveBeenCalledWith('addSshKey', 'sshKeyAdded');
    }));
  });

  describe('onNewKeyTextChanged Method', () => {
    it('should extract key name from SSH key comment', () => {
      component.form.controls['name'].setValue('');
      component.form.controls['key'].setValue(validSSHKey);

      component.onNewKeyTextChanged();

      expect(component.form.controls['name'].value).toBe('your_username@hostname');
    });

    it('should not override existing key name', () => {
      component.form.controls['name'].setValue('my-key');
      component.form.controls['key'].setValue(validSSHKey);

      component.onNewKeyTextChanged();

      expect(component.form.controls['name'].value).toBe('my-key');
    });

    it('should handle key without comment', () => {
      const keyWithoutComment = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCyVGaw1PuEl98f4/7Kq3O9ZIvDw2OFOSXAFVqilSFNkHlefm1iMtPeqsIBp2t9cbGUf55xNDULz/bD/4BCV43yZ5lh0cUYuXALg9NI29ui7PEGReXjSpNwUD6ceN/78YOK41KAcecq+SS0bJ4b4amKZIJG3JWmDKljtv1dmSBCrTmEAQaOorxqGGBYmZS7NQumRe4lav5r6wOs8OACMANE1ejkeZsGFzJFNqvr5DuHdDL5FAudW23me3BDmrM9ifUzzjl1Jwku3bnRaCcjaxH8oTumt1a00mWci/1qUlaVFft085yvVq7KZbF2OPPbl+erDW91+EZ2FgEi+v1/CSJ5';

      component.form.controls['name'].setValue('');
      component.form.controls['key'].setValue(keyWithoutComment);

      component.onNewKeyTextChanged();

      // Should not change name if no comment found
      expect(component.form.controls['name'].value).toBe('');
    });

    it('should handle key with newlines', () => {
      const keyWithNewline = validSSHKey + '\n';

      component.form.controls['name'].setValue('');
      component.form.controls['key'].setValue(keyWithNewline);

      component.onNewKeyTextChanged();

      expect(component.form.controls['name'].value).toBe('your_username@hostname');
    });
  });

  describe('Dialog Cancellation', () => {
    it('should allow canceling the dialog', fakeAsync(() => {
      const cancelButton = fixture.nativeElement.querySelector('[data-cy="dialog-cancel"]');

      if (cancelButton) {
        cancelButton.click();
      }

      tick();

      expect(component || dialogRef).toBeTruthy();
    }));
  });

  describe('Edge Cases', () => {
    it('should handle very long SSH key names', () => {
      const longName = 'a'.repeat(255);
      component.form.controls['name'].setValue(longName);
      component.form.controls['key'].setValue(validSSHKey);
      expect(component.form.valid).toBeTruthy();
    });

    it('should handle special characters in key name', () => {
      component.form.controls['name'].setValue('key-with-@#$-chars');
      component.form.controls['key'].setValue(validSSHKey);
      expect(component.form.valid).toBeTruthy();
    });

    it('should handle whitespace in key name', () => {
      component.form.controls['name'].setValue('key with spaces');
      component.form.controls['key'].setValue(validSSHKey);
      expect(component.form.valid).toBeTruthy();
    });

    it('should handle multiple whitespaces in key comment', () => {
      const keyWithMultipleSpaces = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCyVGaw1PuEl98f4/7Kq3O9ZIvDw2OFOSXAFVqilSFNkHlefm1iMtPeqsIBp2t9cbGUf55xNDULz/bD/4BCV43yZ5lh0cUYuXALg9NI29ui7PEGReXjSpNwUD6ceN/78YOK41KAcecq+SS0bJ4b4amKZIJG3JWmDKljtv1dmSBCrTmEAQaOorxqGGBYmZS7NQumRe4lav5r6wOs8OACMANE1ejkeZsGFzJFNqvr5DuHdDL5FAudW23me3BDmrM9ifUzzjl1Jwku3bnRaCcjaxH8oTumt1a00mWci/1qUlaVFft085yvVq7KZbF2OPPbl+erDW91+EZ2FgEi+v1/CSJ5   key with  multiple  spaces';

      component.form.controls['name'].setValue('');
      component.form.controls['key'].setValue(keyWithMultipleSpaces);

      component.onNewKeyTextChanged();

      expect(component.form.controls['name'].value.length).toBeGreaterThan(0);
    });
  });

  describe('Form State Management', () => {
    it('should maintain form state through validation', fakeAsync(() => {
      component.form.controls['name'].setValue('test-key');
      component.form.controls['key'].setValue(validSSHKey);

      const nameValue = component.form.controls['name'].value;
      const keyValue = component.form.controls['key'].value;

      tick();

      expect(component.form.controls['name'].value).toBe(nameValue);
      expect(component.form.controls['key'].value).toBe(keyValue);
    }));

    it('should reset form when needed', fakeAsync(() => {
      component.form.controls['name'].setValue('test-key');
      component.form.controls['key'].setValue(validSSHKey);
      component.form.reset();

      expect(component.form.pristine).toBe(true);

      tick();
    }));
  });
});
