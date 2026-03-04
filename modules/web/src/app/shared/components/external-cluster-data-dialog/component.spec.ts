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

import {ComponentFixture, TestBed, waitForAsync, fakeAsync, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute} from '@angular/router';
import {CoreModule} from '@core/module';
import {ClusterService} from '@core/services/cluster';
import {NotificationService} from '@core/services/notification';
import {SharedModule} from '@shared/module';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {EditClusterConnectionDialogComponent} from './component';
import {Cluster} from '@shared/entity/cluster';
import {of} from 'rxjs';

describe('EditClusterConnectionDialogComponent', () => {
  let fixture: ComponentFixture<EditClusterConnectionDialogComponent>;
  let component: EditClusterConnectionDialogComponent;
  let dialogRef: MatDialogRefMock;
  let clusterService: any;
  let notificationService: NotificationService;

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: jest.fn((key: string) => {
          if (key === 'clusterID') return 'cluster-123';
          return null;
        }),
      },
    },
  };

  beforeEach(() => {
    const clusterServiceMock = {
      onClusterUpdate: {next: jest.fn()},
      updateExternalCluster: jest.fn().mockReturnValue(of({})),
    };

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
      declarations: [EditClusterConnectionDialogComponent],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: ClusterService, useValue: clusterServiceMock},
        {provide: ActivatedRoute, useValue: mockActivatedRoute},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(EditClusterConnectionDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as MatDialogRefMock;
    clusterService = TestBed.inject(ClusterService);
    notificationService = TestBed.inject(NotificationService);

    component.name = 'test-cluster';
    component.projectId = 'project-123';
    fixture.detectChanges();
  }));

  describe('Component Initialization', () => {
    it('should create the component', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should accept name input', waitForAsync(() => {
      expect(component.name).toBe('test-cluster');
    }));

    it('should accept projectId input', waitForAsync(() => {
      expect(component.projectId).toBe('project-123');
    }));

    it('should initialize form with name control', waitForAsync(() => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('name')).toBeTruthy();
    }));

    it('should pre-fill name control with input value', waitForAsync(() => {
      expect(component.form.get('name').value).toBe('test-cluster');
    }));

    it('should have access to MatDialogRef', waitForAsync(() => {
      expect(component.dialogRef).toBeTruthy();
    }));

    it('should load clusterID from route params', waitForAsync(() => {
      expect(component.clusterID).toBe('cluster-123');
    }));

    it('should have empty kubeconfig initially', waitForAsync(() => {
      expect(component.kubeconfig).toBe('');
    }));

    it('should have controls enum defined', waitForAsync(() => {
      expect(component.controls.Name).toBe('name');
    }));
  });

  describe('Form Validation', () => {
    it('form should be invalid when name is empty', waitForAsync(() => {
      component.form.get('name').setValue('');
      expect(component.form.invalid).toBe(true);
    }));

    it('form should be valid when name is provided', waitForAsync(() => {
      component.form.get('name').setValue('valid-name');
      expect(component.form.valid).toBe(true);
    }));

    it('name field should be required', waitForAsync(() => {
      const nameControl = component.form.get('name');
      nameControl.setValue('');
      expect(nameControl.hasError('required')).toBe(true);
    }));

    it('name field should not have error when filled', waitForAsync(() => {
      const nameControl = component.form.get('name');
      nameControl.setValue('updated-cluster-name');
      expect(nameControl.hasError('required')).toBe(false);
    }));
  });

  describe('Kubeconfig Handling', () => {
    it('should initialize kubeconfig as empty string', waitForAsync(() => {
      expect(component.kubeconfig).toBe('');
    }));

    it('should accept kubeconfig updates', waitForAsync(() => {
      const testKubeconfig = 'apiVersion: v1\nkind: Config\n';
      component.kubeconfig = testKubeconfig;
      expect(component.kubeconfig).toBe(testKubeconfig);
    }));

    it('should handle multiline kubeconfig', waitForAsync(() => {
      const multilineConfig = 'line1\nline2\nline3\nline4';
      component.kubeconfig = multilineConfig;
      expect(component.kubeconfig).toContain('line1');
      expect(component.kubeconfig).toContain('line4');
    }));

    it('should handle kubeconfig with special characters', waitForAsync(() => {
      const specialConfig = 'apiVersion: v1\ndata:\n  config: @#$%^&*';
      component.kubeconfig = specialConfig;
      expect(component.kubeconfig).toContain('@#$%^&*');
    }));

    it('should handle very long kubeconfig', waitForAsync(() => {
      const longConfig = 'a'.repeat(10000);
      component.kubeconfig = longConfig;
      expect(component.kubeconfig.length).toBe(10000);
    }));
  });

  describe('getObservable Method', () => {
    it('should encode kubeconfig to base64', fakeAsync(() => {
      component.kubeconfig = 'test-config';
      component.form.get('name').setValue('updated-name');

      const obs = component.getObservable();

      tick();

      expect(clusterService.updateExternalCluster).toHaveBeenCalled();
      const callArgs = clusterService.updateExternalCluster.mock.calls[0][2];
      expect(callArgs.kubeconfig).toBe(btoa('test-config'));
    }));

    it('should pass correct projectId to update method', fakeAsync(() => {
      component.projectId = 'custom-project';
      component.form.get('name').setValue('updated-name');

      component.getObservable();

      tick();

      expect(clusterService.updateExternalCluster).toHaveBeenCalledWith(
        'custom-project',
        expect.anything(),
        expect.anything()
      );
    }));

    it('should pass correct clusterID to update method', fakeAsync(() => {
      component.form.get('name').setValue('updated-name');

      component.getObservable();

      tick();

      expect(clusterService.updateExternalCluster).toHaveBeenCalledWith(
        expect.anything(),
        'cluster-123',
        expect.anything()
      );
    }));

    it('should pass updated name in model', fakeAsync(() => {
      component.form.get('name').setValue('new-cluster-name');
      component.kubeconfig = 'config';

      component.getObservable();

      tick();

      const callArgs = clusterService.updateExternalCluster.mock.calls[0][2];
      expect(callArgs.name).toBe('new-cluster-name');
    }));

    it('should close dialog before returning observable', fakeAsync(() => {
      const closeSpy = jest.spyOn(dialogRef, 'close');
      component.form.get('name').setValue('updated');

      component.getObservable();

      tick();

      expect(closeSpy).toHaveBeenCalled();
    }));

    it('should handle kubeconfig with unicode characters', fakeAsync(() => {
      component.kubeconfig = 'config: 中文-🚀';
      component.form.get('name').setValue('test');

      component.getObservable();

      tick();

      const callArgs = clusterService.updateExternalCluster.mock.calls[0][2];
      expect(callArgs.kubeconfig).toBe(btoa('config: 中文-🚀'));
    }));
  });

  describe('onNext Method', () => {
    it('should emit cluster update event', fakeAsync(() => {
      component.onNext();

      tick();

      expect(clusterService.onClusterUpdate.next).toHaveBeenCalled();
    }));

    it('should show success notification', fakeAsync(() => {
      const notificationSpy = jest.spyOn(notificationService, 'success');
      component.name = 'my-cluster';

      component.onNext();

      tick();

      expect(notificationSpy).toHaveBeenCalledWith('Updated the my-cluster cluster');
    }));

    it('should use component name in notification', fakeAsync(() => {
      const notificationSpy = jest.spyOn(notificationService, 'success');
      component.name = 'custom-cluster-name';

      component.onNext();

      tick();

      expect(notificationSpy).toHaveBeenCalledWith('Updated the custom-cluster-name cluster');
    }));

    it('should handle cluster name with special characters', fakeAsync(() => {
      const notificationSpy = jest.spyOn(notificationService, 'success');
      component.name = 'cluster-with-@#$-special';

      component.onNext();

      tick();

      expect(notificationSpy).toHaveBeenCalledWith('Updated the cluster-with-@#$-special cluster');
    }));
  });

  describe('Dialog Reference Management', () => {
    it('should have dialog ref available', waitForAsync(() => {
      expect(component._matDialogRef).toBeTruthy();
    }));

    it('should allow closing dialog via reference', waitForAsync(() => {
      component._matDialogRef.close();
      expect(dialogRef.closeCalled).toBe(true);
    }));
  });

  describe('Edge Cases', () => {
    it('should handle undefined name input', waitForAsync(() => {
      component.name = undefined;
      expect(component.name).toBeUndefined();
    }));

    it('should handle empty name input', waitForAsync(() => {
      component.name = '';
      fixture.detectChanges();
      expect(component.form.get('name').value).toBe('');
    }));

    it('should handle very long cluster name', waitForAsync(() => {
      const longName = 'a'.repeat(255);
      component.name = longName;
      component.form.get('name').setValue(longName);
      expect(component.form.get('name').value.length).toBe(255);
    }));

    it('should handle rapid successive updates', fakeAsync(() => {
      component.form.get('name').setValue('name1');
      component.getObservable().subscribe();
      tick();

      component.form.get('name').setValue('name2');
      component.getObservable().subscribe();
      tick();

      expect(clusterService.updateExternalCluster).toHaveBeenCalledTimes(2);
    }));

    it('should handle kubeconfig updates while form is invalid', waitForAsync(() => {
      component.form.get('name').setValue('');
      component.kubeconfig = 'new-config';
      expect(component.form.invalid).toBe(true);
      expect(component.kubeconfig).toBe('new-config');
    }));
  });

  describe('Lifecycle', () => {
    it('should initialize form on ngOnInit', waitForAsync(() => {
      component.form = null;
      component.ngOnInit();
      expect(component.form).toBeTruthy();
    }));

    it('should load clusterID on init', waitForAsync(() => {
      component.clusterID = null;
      component.ngOnInit();
      expect(component.clusterID).toBe('cluster-123');
    }));

    it('should handle component destruction', waitForAsync(() => {
      fixture.destroy();
      expect(component).toBeTruthy();
    }));
  });
});
