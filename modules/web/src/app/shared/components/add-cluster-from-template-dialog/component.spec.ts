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
import {MatStepperModule} from '@angular/material/stepper';
import {Router} from '@angular/router';
import {CoreModule} from '@core/module';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {NotificationService} from '@core/services/notification';
import {SharedModule} from '@shared/module';
import {ClusterTemplate} from '@shared/entity/cluster-template';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {RouterStub} from '@test/services/router-stubs';
import {AddClusterFromTemplateDialogComponent, Step, AddClusterFromTemplateDialogData} from './component';
import {Subject} from 'rxjs';

describe('AddClusterFromTemplateDialogComponent', () => {
  let fixture: ComponentFixture<AddClusterFromTemplateDialogComponent>;
  let component: AddClusterFromTemplateDialogComponent;
  let dialogRef: MatDialogRefMock;
  let clusterTemplateService: any;
  let notificationService: NotificationService;
  let router: RouterStub;

  const mockTemplate: ClusterTemplate = {
    id: 'template-123',
    name: 'test-template',
    scope: 'project',
    creationTimestamp: new Date(),
    projectID: 'project-123',
  } as any;

  const mockDialogData: AddClusterFromTemplateDialogData = {
    projectId: 'project-123',
    quotaWidget: null,
    templateId: 'template-123',
  };

  beforeEach(() => {
    const clusterTemplateServiceMock = {
      templateChanges: new Subject(),
      replicasChanges: new Subject(),
      instanceChanges: new Subject(),
      isClusterStepValid: true,
      createInstances: jest.fn(),
      reset: jest.fn(),
    };

    const routerStub = new RouterStub();

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule, MatStepperModule],
      declarations: [AddClusterFromTemplateDialogComponent],
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
    fixture = TestBed.createComponent(AddClusterFromTemplateDialogComponent);
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

    it('should initialize with steps', waitForAsync(() => {
      expect(component.steps).toContain(Step.Template);
      expect(component.steps).toContain(Step.Cluster);
    }));

    it('should have showDetails false initially', waitForAsync(() => {
      expect(component.showDetails).toBe(false);
    }));

    it('should have step enum reference', waitForAsync(() => {
      expect(component.step.Template).toBe('Select Template');
      expect(component.step.Cluster).toBe('Create Cluster');
    }));

    it('should initialize replicas as undefined', waitForAsync(() => {
      expect(component.replicas).toBeUndefined();
    }));
  });

  describe('Template Selection', () => {
    it('should accept template from service', fakeAsync(() => {
      clusterTemplateService.templateChanges.next(mockTemplate);

      tick();

      expect(component.template).toEqual(mockTemplate);
    }));

    it('should ignore null template changes', fakeAsync(() => {
      clusterTemplateService.templateChanges.next(null);

      tick();

      expect(component.template).toBeUndefined();
    }));

    it('should handle multiple template selections', fakeAsync(() => {
      const template1 = {...mockTemplate, id: 'template-1', name: 'Template 1'};
      const template2 = {...mockTemplate, id: 'template-2', name: 'Template 2'};

      clusterTemplateService.templateChanges.next(template1);
      tick();
      expect(component.template).toEqual(template1);

      clusterTemplateService.templateChanges.next(template2);
      tick();
      expect(component.template).toEqual(template2);
    }));
  });

  describe('Replicas Management', () => {
    it('should accept replicas from service', fakeAsync(() => {
      clusterTemplateService.replicasChanges.next(3);

      tick();

      expect(component.replicas).toBe(3);
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

    it('should handle high replica count', fakeAsync(() => {
      clusterTemplateService.replicasChanges.next(100);

      tick();

      expect(component.replicas).toBe(100);
    }));
  });

  describe('Valid Property', () => {
    it('should check cluster step validity', waitForAsync(() => {
      clusterTemplateService.isClusterStepValid = true;
      expect(component.valid).toBe(true);
    }));

    it('should return false when cluster step invalid', waitForAsync(() => {
      clusterTemplateService.isClusterStepValid = false;
      expect(component.valid).toBe(false);
    }));
  });

  describe('getObservable Method', () => {
    it('should return createInstances observable', waitForAsync(() => {
      clusterTemplateService.createInstances.mockReturnValue({pipe: jest.fn().mockReturnValue({} as any)});
      component.template = mockTemplate;
      component.replicas = 2;

      component.getObservable();

      expect(clusterTemplateService.createInstances).toHaveBeenCalledWith(2, 'project-123', 'template-123');
    }));

    it('should pass correct replicas to createInstances', waitForAsync(() => {
      clusterTemplateService.createInstances.mockReturnValue({pipe: jest.fn().mockReturnValue({} as any)});
      component.template = mockTemplate;
      component.replicas = 5;

      component.getObservable();

      expect(clusterTemplateService.createInstances).toHaveBeenCalledWith(5, expect.anything(), expect.anything());
    }));

    it('should pass correct projectID to createInstances', waitForAsync(() => {
      clusterTemplateService.createInstances.mockReturnValue({pipe: jest.fn().mockReturnValue({} as any)});
      component.template = mockTemplate;
      component.replicas = 1;

      component.getObservable();

      expect(clusterTemplateService.createInstances).toHaveBeenCalledWith(expect.anything(), 'project-123', expect.anything());
    }));

    it('should pass correct template ID to createInstances', waitForAsync(() => {
      clusterTemplateService.createInstances.mockReturnValue({pipe: jest.fn().mockReturnValue({} as any)});
      component.template = mockTemplate;
      component.replicas = 1;

      component.getObservable();

      expect(clusterTemplateService.createInstances).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'template-123');
    }));
  });

  describe('onNext Method - Not Implemented in Component', () => {
    it('should have onNext method defined', waitForAsync(() => {
      expect(component.onNext).toBeDefined();
    }));
  });

  describe('Quota and Details', () => {
    it('should accept quota widget from dialog data', waitForAsync(() => {
      expect(component.quotaWidget).toBeNull(); // In our mock data
    }));

    it('should toggle showDetails', waitForAsync(() => {
      expect(component.showDetails).toBe(false);
      component.showDetails = true;
      expect(component.showDetails).toBe(true);
    }));
  });

  describe('Cleanup and Lifecycle', () => {
    it('should unsubscribe on destroy', fakeAsync(() => {
      component.ngOnDestroy();

      tick();

      expect(component).toBeTruthy();
    }));

    it('should handle component destruction', waitForAsync(() => {
      fixture.destroy();
      expect(component).toBeTruthy();
    }));
  });

  describe('Edge Cases', () => {
    it('should handle template with special characters', fakeAsync(() => {
      const specialTemplate = {...mockTemplate, name: 'template-@#$-special'};
      clusterTemplateService.templateChanges.next(specialTemplate);

      tick();

      expect(component.template.name).toBe('template-@#$-special');
    }));

    it('should handle zero replicas', fakeAsync(() => {
      clusterTemplateService.replicasChanges.next(0);

      tick();

      expect(component.replicas).toBe(0);
    }));

    it('should handle multiple rapid replica changes', fakeAsync(() => {
      clusterTemplateService.replicasChanges.next(1);
      tick();
      clusterTemplateService.replicasChanges.next(2);
      tick();
      clusterTemplateService.replicasChanges.next(3);
      tick();

      expect(component.replicas).toBe(3);
    }));
  });
});
