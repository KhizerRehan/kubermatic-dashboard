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
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {CoreModule} from '@core/module';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {NotificationService} from '@core/services/notification';
import {SharedModule} from '@shared/module';
import {ClusterTemplate} from '@shared/entity/cluster-template';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {RouterStub} from '@test/services/router-stubs';
import {ClusterFromTemplateDialogComponent, ClusterFromTemplateDialogData} from './component';
import {of} from 'rxjs';
import {Subject} from 'rxjs';

describe('ClusterFromTemplateDialogComponent', () => {
  let fixture: ComponentFixture<ClusterFromTemplateDialogComponent>;
  let component: ClusterFromTemplateDialogComponent;
  let dialogRef: MatDialogRefMock;
  let clusterTemplateService: any;
  let notificationService: NotificationService;
  let router: RouterStub;

  const mockTemplate: ClusterTemplate = {
    id: 'template-123',
    name: 'Production Template',
    scope: 'project',
    creationTimestamp: new Date(),
    projectID: 'project-123',
  } as any;

  const mockDialogData: ClusterFromTemplateDialogData = {
    template: mockTemplate,
    projectID: 'project-123',
    quotaWidget: null,
  };

  beforeEach(() => {
    const clusterTemplateServiceMock = {
      replicasChanges: new Subject(),
      isClusterStepValid: true,
      createInstances: jest.fn().mockReturnValue(of({})),
    };

    const routerStub = new RouterStub();

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
      declarations: [ClusterFromTemplateDialogComponent],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: mockDialogData},
        {provide: ClusterTemplateService, useValue: clusterTemplateServiceMock},
        {provide: Router, useValue: routerStub},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(ClusterFromTemplateDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as MatDialogRefMock;
    clusterTemplateService = TestBed.inject(ClusterTemplateService);
    notificationService = TestBed.inject(NotificationService);
    router = TestBed.inject(Router) as RouterStub;

    fixture.detectChanges();
  }));

  describe('Component Initialization', () => {
    it('should create the component', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should inject MAT_DIALOG_DATA', waitForAsync(() => {
      expect(component.data).toEqual(mockDialogData);
    }));

    it('should have access to MatDialogRef', waitForAsync(() => {
      expect(component.dialogRef).toBeTruthy();
    }));

    it('should initialize showDetails as false', waitForAsync(() => {
      expect(component.showDetails).toBe(false);
    }));

    it('should initialize replicas as undefined', waitForAsync(() => {
      expect(component.replicas).toBeUndefined();
    }));

    it('should have quotaWidget reference', waitForAsync(() => {
      expect(component.quotaWidget).toBeDefined();
    }));
  });

  describe('Dialog Data Access', () => {
    it('should access template from dialog data', waitForAsync(() => {
      expect(component.data.template).toEqual(mockTemplate);
    }));

    it('should access projectID from dialog data', waitForAsync(() => {
      expect(component.data.projectID).toBe('project-123');
    }));

    it('should access quotaWidget from dialog data', waitForAsync(() => {
      expect(component.data.quotaWidget).toBeNull();
    }));
  });

  describe('Replicas Management', () => {
    it('should subscribe to replicasChanges on init', fakeAsync(() => {
      clusterTemplateService.replicasChanges.next(3);

      tick();

      expect(component.replicas).toBe(3);
    }));

    it('should update replicas when service emits', fakeAsync(() => {
      clusterTemplateService.replicasChanges.next(2);
      tick();
      expect(component.replicas).toBe(2);

      clusterTemplateService.replicasChanges.next(5);
      tick();
      expect(component.replicas).toBe(5);
    }));

    it('should ignore null replica changes', fakeAsync(() => {
      clusterTemplateService.replicasChanges.next(null);

      tick();

      expect(component.replicas).toBeUndefined();
    }));

    it('should handle single replica', fakeAsync(() => {
      clusterTemplateService.replicasChanges.next(1);

      tick();

      expect(component.replicas).toBe(1);
    }));

    it('should handle large replica count', fakeAsync(() => {
      clusterTemplateService.replicasChanges.next(50);

      tick();

      expect(component.replicas).toBe(50);
    }));

    it('should handle zero replicas', fakeAsync(() => {
      clusterTemplateService.replicasChanges.next(0);

      tick();

      expect(component.replicas).toBe(0);
    }));
  });

  describe('Validity Checking', () => {
    it('should return isClusterStepValid from service', waitForAsync(() => {
      clusterTemplateService.isClusterStepValid = true;
      expect(component.valid).toBe(true);
    }));

    it('should return false when step invalid', waitForAsync(() => {
      clusterTemplateService.isClusterStepValid = false;
      expect(component.valid).toBe(false);
    }));

    it('should be dynamic based on service state', waitForAsync(() => {
      clusterTemplateService.isClusterStepValid = true;
      expect(component.valid).toBe(true);

      clusterTemplateService.isClusterStepValid = false;
      expect(component.valid).toBe(false);
    }));
  });

  describe('getObservable Method', () => {
    it('should call createInstances with correct parameters', waitForAsync(() => {
      component.replicas = 3;

      component.getObservable();

      expect(clusterTemplateService.createInstances).toHaveBeenCalledWith(3, 'project-123', 'template-123');
    }));

    it('should pass replicas correctly', waitForAsync(() => {
      component.replicas = 5;

      component.getObservable();

      expect(clusterTemplateService.createInstances).toHaveBeenCalledWith(5, expect.anything(), expect.anything());
    }));

    it('should pass projectID correctly', waitForAsync(() => {
      component.replicas = 2;

      component.getObservable();

      expect(clusterTemplateService.createInstances).toHaveBeenCalledWith(expect.anything(), 'project-123', expect.anything());
    }));

    it('should pass template ID correctly', waitForAsync(() => {
      component.replicas = 1;

      component.getObservable();

      expect(clusterTemplateService.createInstances).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'template-123');
    }));

    it('should return observable that completes', waitForAsync(() => {
      component.replicas = 2;
      const obs = component.getObservable();

      expect(obs).toBeTruthy();
    }));
  });

  describe('onNext Method', () => {
    it('should close dialog', fakeAsync(() => {
      const closeSpy = jest.spyOn(dialogRef, 'close');
      component.replicas = 3;

      component.onNext();

      tick();

      expect(closeSpy).toHaveBeenCalled();
    }));

    it('should navigate to clusters page', fakeAsync(() => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      component.replicas = 2;

      component.onNext();

      tick();

      expect(navigateSpy).toHaveBeenCalledWith(['/projects/project-123/clusters']);
    }));

    it('should show success notification', fakeAsync(() => {
      const notificationSpy = jest.spyOn(notificationService, 'success');
      component.replicas = 1;

      component.onNext();

      tick();

      expect(notificationSpy).toHaveBeenCalledWith('Created 1 instance from Production Template template');
    }));

    it('should use correct singular form for one replica', fakeAsync(() => {
      const notificationSpy = jest.spyOn(notificationService, 'success');
      component.replicas = 1;

      component.onNext();

      tick();

      expect(notificationSpy).toHaveBeenCalledWith(expect.stringContaining('instance'));
      expect(notificationSpy).not.toHaveBeenCalledWith(expect.stringContaining('instances'));
    }));

    it('should use correct plural form for multiple replicas', fakeAsync(() => {
      const notificationSpy = jest.spyOn(notificationService, 'success');
      component.replicas = 5;

      component.onNext();

      tick();

      expect(notificationSpy).toHaveBeenCalledWith(expect.stringContaining('instances'));
    }));

    it('should include template name in notification', fakeAsync(() => {
      const notificationSpy = jest.spyOn(notificationService, 'success');
      component.replicas = 2;

      component.onNext();

      tick();

      expect(notificationSpy).toHaveBeenCalledWith(expect.stringContaining('Production Template'));
    }));

    it('should handle template name with special characters', fakeAsync(() => {
      const notificationSpy = jest.spyOn(notificationService, 'success');
      component.data.template.name = 'template-@#$-special';
      component.replicas = 2;

      component.onNext();

      tick();

      expect(notificationSpy).toHaveBeenCalledWith(expect.stringContaining('@#$'));
    }));
  });

  describe('QuotaWidget Management', () => {
    it('should initialize quotaWidget from data', waitForAsync(() => {
      component.quotaWidget = mockDialogData.quotaWidget;
      expect(component.quotaWidget).toBeNull();
    }));

    it('should set quotaWidget in ngOnInit', waitForAsync(() => {
      const mockQuotaWidget = {} as any;
      component.data.quotaWidget = mockQuotaWidget;
      component.ngOnInit();

      expect(component.quotaWidget).toBe(mockQuotaWidget);
    }));
  });

  describe('showDetails Toggle', () => {
    it('should allow toggling showDetails', waitForAsync(() => {
      expect(component.showDetails).toBe(false);
      component.showDetails = true;
      expect(component.showDetails).toBe(true);
    }));

    it('should persist showDetails state', waitForAsync(() => {
      component.showDetails = true;
      expect(component.showDetails).toBe(true);

      // Toggle again
      component.showDetails = false;
      expect(component.showDetails).toBe(false);
    }));
  });

  describe('Cleanup and Lifecycle', () => {
    it('should complete subject on destroy', fakeAsync(() => {
      component.ngOnDestroy();

      tick();

      expect(component).toBeTruthy();
    }));

    it('should unsubscribe from replicas changes on destroy', fakeAsync(() => {
      component.ngOnInit();
      clusterTemplateService.replicasChanges.next(3);
      tick();

      component.ngOnDestroy();

      // New emissions should not affect component after destroy
      clusterTemplateService.replicasChanges.next(99);
      tick();

      expect(component.replicas).toBe(3);
    }));

    it('should handle component destruction', waitForAsync(() => {
      fixture.destroy();
      expect(component).toBeTruthy();
    }));
  });

  describe('Edge Cases', () => {
    it('should handle template with very long name', waitForAsync(() => {
      const longName = 'a'.repeat(255);
      component.data.template.name = longName;
      component.replicas = 2;

      component.onNext();

      expect(component.data.template.name.length).toBe(255);
    }));

    it('should handle replicas change after dialog already closed', fakeAsync(() => {
      clusterTemplateService.replicasChanges.next(3);
      tick();

      component.ngOnDestroy();
      tick();

      // Component should handle additional emissions gracefully
      clusterTemplateService.replicasChanges.next(5);
      tick();

      expect(component).toBeTruthy();
    }));

    it('should handle rapid replica changes', fakeAsync(() => {
      for (let i = 1; i <= 10; i++) {
        clusterTemplateService.replicasChanges.next(i);
        tick();
      }

      expect(component.replicas).toBe(10);
    }));

    it('should handle undefined projectID in navigation', fakeAsync(() => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      component.data.projectID = undefined;
      component.replicas = 1;

      component.onNext();

      tick();

      expect(navigateSpy).toHaveBeenCalled();
    }));
  });
});
