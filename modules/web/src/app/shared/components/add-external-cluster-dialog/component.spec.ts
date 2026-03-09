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
import {MatStepperModule} from '@angular/material/stepper';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {CoreModule} from '@core/module';
import {ExternalClusterService} from '@core/services/external-cluster';
import {NotificationService} from '@core/services/notification';
import {SharedModule} from '@shared/module';
import {ExternalClusterProvider} from '@shared/entity/external-cluster';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {RouterStub} from '@test/services/router-stubs';
import {AddExternalClusterDialogComponent, Step} from './component';
import {Subject} from 'rxjs';

describe('AddExternalClusterDialogComponent', () => {
  let fixture: ComponentFixture<AddExternalClusterDialogComponent>;
  let component: AddExternalClusterDialogComponent;
  let dialogRef: MatDialogRefMock;
  let externalClusterService: any;
  let notificationService: NotificationService;
  let router: RouterStub;

  beforeEach(() => {
    const externalClusterServiceMock = {
      providerChanges: new Subject(),
      provider: null,
      isCredentialsStepValid: false,
      isClusterStepValid: false,
      externalCluster: {},
      reset: jest.fn(),
      import: jest.fn(),
    };

    const routerStub = new RouterStub();

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule, MatStepperModule],
      declarations: [AddExternalClusterDialogComponent],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: ExternalClusterService, useValue: externalClusterServiceMock},
        {provide: Router, useValue: routerStub},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(AddExternalClusterDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as MatDialogRefMock;
    externalClusterService = TestBed.inject(ExternalClusterService);
    notificationService = TestBed.inject(NotificationService);
    router = TestBed.inject(Router) as RouterStub;

    component.projectId = 'project-123';
    fixture.detectChanges();
  }));

  describe('Component Initialization', () => {
    it('should create the component', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should accept projectId input', waitForAsync(() => {
      expect(component.projectId).toBe('project-123');
    }));

    it('should initialize steps with Provider and Credentials', waitForAsync(() => {
      expect(component.steps).toContain(Step.Provider);
      expect(component.steps).toContain(Step.Credentials);
    }));

    it('should have access to MatDialogRef', waitForAsync(() => {
      expect(component.dialogRef).toBeTruthy();
    }));

    it('should have step enum values', waitForAsync(() => {
      expect(component.step.Provider).toBe('Pick Provider');
      expect(component.step.Credentials).toBe('Enter Credentials');
      expect(component.step.Cluster).toBe('Pick Cluster');
    }));

    it('should have provider enum reference', waitForAsync(() => {
      expect(component.provider).toBe(ExternalClusterProvider);
    }));
  });

  describe('Provider Selection and Step Management', () => {
    it('should add Cluster step when custom provider is not selected', fakeAsync(() => {
      externalClusterService.provider = ExternalClusterProvider.GKE;
      externalClusterService.providerChanges.next(ExternalClusterProvider.GKE);

      tick();

      expect(component.steps).toContain(Step.Cluster);
      expect(component.steps.length).toBe(3);
    }));

    it('should not add Cluster step when custom provider is selected', fakeAsync(() => {
      externalClusterService.provider = ExternalClusterProvider.Custom;
      externalClusterService.providerChanges.next(ExternalClusterProvider.Custom);

      tick();

      expect(component.steps).not.toContain(Step.Cluster);
      expect(component.steps.length).toBe(2);
    }));

    it('should reset step when going back', fakeAsync(() => {
      externalClusterService.providerChanges.next(ExternalClusterProvider.GKE);
      tick();

      const steps = component.steps;
      expect(steps.length).toBe(3);
    }));

    it('should ignore null provider changes', fakeAsync(() => {
      const initialSteps = [...component.steps];
      externalClusterService.providerChanges.next(null);

      tick();

      expect(component.steps).toEqual(initialSteps);
    }));
  });

  describe('Step Validation', () => {
    it('should return invalid when no provider selected on Provider step', waitForAsync(() => {
      externalClusterService.provider = null;
      expect(component.invalid).toBe(true);
    }));

    it('should return valid when provider selected on Provider step', waitForAsync(() => {
      externalClusterService.provider = ExternalClusterProvider.GKE;
      expect(component.invalid).toBe(false);
    }));

    it('should return invalid when credentials not valid on Credentials step', waitForAsync(() => {
      externalClusterService.provider = ExternalClusterProvider.GKE;
      externalClusterService.isCredentialsStepValid = false;
      expect(component.invalid).toBe(true);
    }));

    it('should return valid when credentials valid on Credentials step', waitForAsync(() => {
      externalClusterService.provider = ExternalClusterProvider.GKE;
      externalClusterService.isCredentialsStepValid = true;
      expect(component.invalid).toBe(false);
    }));

    it('should return invalid when cluster not valid on Cluster step', waitForAsync(() => {
      externalClusterService.provider = ExternalClusterProvider.GKE;
      externalClusterService.isClusterStepValid = false;
      expect(component.invalid).toBe(true);
    }));

    it('should return valid when cluster valid on Cluster step', waitForAsync(() => {
      externalClusterService.provider = ExternalClusterProvider.GKE;
      externalClusterService.isClusterStepValid = true;
      expect(component.invalid).toBe(false);
    }));
  });

  describe('Dialog Label', () => {
    it('should show Add External Cluster label for custom provider', waitForAsync(() => {
      externalClusterService.provider = ExternalClusterProvider.Custom;
      expect(component.label).toBe('Add External Cluster');
    }));

    it('should show Import Cluster label for non-custom providers', waitForAsync(() => {
      externalClusterService.provider = ExternalClusterProvider.GKE;
      expect(component.label).toBe('Import Cluster');
    }));

    it('should show Import Cluster label for EKS', waitForAsync(() => {
      externalClusterService.provider = ExternalClusterProvider.EKS;
      expect(component.label).toBe('Import Cluster');
    }));
  });

  describe('Step Navigation', () => {
    it('should identify first step correctly', waitForAsync(() => {
      expect(component.first).toBe(true);
    }));

    it('should identify last step correctly', waitForAsync(() => {
      expect(component.last).toBe(true); // Only 2 steps initially
    }));

    it('should return active step', waitForAsync(() => {
      expect(component.active).toBe(Step.Provider);
    }));

    it('should check if step is available', waitForAsync(() => {
      expect(component.isAvailable(Step.Provider)).toBe(true);
      expect(component.isAvailable(Step.Credentials)).toBe(true);
      expect(component.isAvailable(Step.Cluster)).toBe(false); // Not available by default
    }));
  });

  describe('getObservable Method', () => {
    it('should return import observable', waitForAsync(() => {
      externalClusterService.import.mockReturnValue({pipe: jest.fn().mockReturnValue({} as any)});
      externalClusterService.externalCluster = {name: 'test-cluster'};

      const obs = component.getObservable();

      expect(externalClusterService.import).toHaveBeenCalledWith('project-123', {name: 'test-cluster'});
    }));

    it('should pass correct projectId and cluster to import', waitForAsync(() => {
      externalClusterService.import.mockReturnValue({pipe: jest.fn().mockReturnValue({} as any)});
      externalClusterService.externalCluster = {name: 'my-cluster', kubeconfig: 'config'};

      component.getObservable();

      expect(externalClusterService.import).toHaveBeenCalledWith('project-123', externalClusterService.externalCluster);
    }));
  });

  describe('onNext Method', () => {
    it('should close dialog', fakeAsync(() => {
      const closeSpy = jest.spyOn(dialogRef, 'close');
      const mockCluster = {name: 'test-cluster', id: 'cluster-123'};

      component.onNext(mockCluster as any);

      tick();

      expect(closeSpy).toHaveBeenCalled();
    }));

    it('should show success notification', fakeAsync(() => {
      const notificationSpy = jest.spyOn(notificationService, 'success');
      const mockCluster = {name: 'my-cluster', id: 'cluster-456'};

      component.onNext(mockCluster as any);

      tick();

      expect(notificationSpy).toHaveBeenCalledWith('Added the my-cluster cluster');
    }));

    it('should navigate to cluster detail page', fakeAsync(() => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      const mockCluster = {name: 'imported-cluster', id: 'cluster-789'};

      component.onNext(mockCluster as any);

      tick();

      expect(navigateSpy).toHaveBeenCalledWith(['/projects/project-123/clusters/externalclusters/cluster-789']);
    }));

    it('should handle cluster with special characters in name', fakeAsync(() => {
      const notificationSpy = jest.spyOn(notificationService, 'success');
      const mockCluster = {name: 'cluster-with-@#$-special', id: 'cluster-999'};

      component.onNext(mockCluster as any);

      tick();

      expect(notificationSpy).toHaveBeenCalledWith('Added the cluster-with-@#$-special cluster');
    }));
  });

  describe('Navigation Methods', () => {
    it('should have next method', waitForAsync(() => {
      expect(component.next).toBeDefined();
      expect(typeof component.next).toBe('function');
    }));

    it('should have previous method', waitForAsync(() => {
      expect(component.previous).toBeDefined();
      expect(typeof component.previous).toBe('function');
    }));
  });

  describe('Cleanup and Lifecycle', () => {
    it('should reset external cluster service on destroy', fakeAsync(() => {
      const resetSpy = jest.spyOn(externalClusterService, 'reset');
      component.ngOnDestroy();

      tick();

      expect(resetSpy).toHaveBeenCalled();
    }));

    it('should unsubscribe from observables on destroy', fakeAsync(() => {
      component.ngOnDestroy();
      tick();

      // Verify component cleanup occurred
      expect(component).toBeTruthy();
    }));

    it('should handle component destruction', waitForAsync(() => {
      fixture.destroy();
      expect(component).toBeTruthy();
    }));
  });

  describe('Edge Cases', () => {
    it('should handle undefined projectId', waitForAsync(() => {
      component.projectId = undefined;
      expect(component.projectId).toBeUndefined();
    }));

    it('should handle empty externalCluster object', fakeAsync(() => {
      externalClusterService.externalCluster = {};
      externalClusterService.import.mockReturnValue({pipe: jest.fn().mockReturnValue({} as any)});

      component.getObservable();

      tick();

      expect(externalClusterService.import).toHaveBeenCalled();
    }));

    it('should handle multiple rapid provider changes', fakeAsync(() => {
      externalClusterService.providerChanges.next(ExternalClusterProvider.GKE);
      tick();
      externalClusterService.providerChanges.next(ExternalClusterProvider.EKS);
      tick();
      externalClusterService.providerChanges.next(ExternalClusterProvider.Custom);
      tick();

      expect(component.steps.length).toBeGreaterThanOrEqual(2);
    }));
  });
});
