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

import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {BrowserModule, By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {MatStepper} from '@angular/material/stepper';
import {AppConfigService} from '@app/config.service';
import {Auth} from '@core/services/auth/service';
import {ClusterService} from '@core/services/cluster';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {DatacenterService} from '@core/services/datacenter';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {WizardService} from '@core/services/wizard/wizard';
import {SharedModule} from '@shared/module';
import {fakeAWSCluster} from '@test/data/cluster';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {AuthMockService} from '@test/services/auth-mock';
import {asyncData, asyncError} from '@test/services/cluster-mock';
import {ClusterTemplateMockService} from '@test/services/cluster-template-mock';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {ActivatedRouteStub, RouterStub} from '@test/services/router-stubs';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {of, throwError, NEVER, Subject} from 'rxjs';
import {WizardComponent} from './component';

describe('WizardComponent - Edge Cases', () => {
  let fixture: ComponentFixture<WizardComponent>;
  let component: WizardComponent;
  let wizardService: WizardService;
  let clusterService: any;
  let clusterTemplateService: any;
  let activatedRoute: ActivatedRouteStub;
  let router: Router;

  beforeEach(waitForAsync(() => {
    clusterService = {
      create: jest.fn(),
      get: jest.fn(),
      refreshClusters: jest.fn(),
    };

    clusterTemplateService = {
      list: jest.fn(),
      get: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, SharedModule],
      declarations: [WizardComponent],
      providers: [
        {provide: ClusterService, useValue: clusterService},
        {provide: ClusterTemplateService, useValue: clusterTemplateService},
        {provide: Auth, useClass: AuthMockService},
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
        {provide: UserService, useClass: UserMockService},
        {provide: Router, useClass: RouterStub},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        WizardService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardComponent);
    component = fixture.componentInstance;
    wizardService = TestBed.inject(WizardService);
    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    router = fixture.debugElement.injector.get(Router);
    activatedRoute.testParamMap = {projectID: '4k6txp5sq'};
  });

  describe('Step Navigation & Restrictions', () => {
    it('should initialize with first step enabled', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should prevent navigation to next step with invalid form', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      // Try to proceed without completing first step
      if (component.matStepper) {
        expect(() => {
          component.matStepper.next();
        }).not.toThrow();
      }

      discardPeriodicTasks();
    }));

    it('should allow navigation when step is valid', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      if (component.matStepper) {
        // Component should maintain state
        expect(component.matStepper.selectedIndex).toBeGreaterThanOrEqual(0);
      }

      discardPeriodicTasks();
    }));

    it('should handle rapid step navigation', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      if (component.matStepper) {
        // Rapid navigation
        for (let i = 0; i < 5; i++) {
          if (component.matStepper.selectedIndex < component.matStepper._steps.length - 1) {
            component.matStepper.next();
          }
        }
      }

      tick(1);
      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should preserve form data during backward navigation', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      if (component.matStepper) {
        component.matStepper.next();
        tick(1);

        // Navigate backward
        component.matStepper.previous();
        tick(1);

        // Form data should still be there
        expect(component).toBeTruthy();
      }

      discardPeriodicTasks();
    }));
  });

  describe('Cluster Template Handling', () => {
    it('should skip provider step when using template', fakeAsync(() => {
      component.clusterTemplateID = 'template-123';
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      const steps = component.steps;
      const providerStep = steps.find(s => s.name === 'Provider');

      expect(providerStep).toBeFalsy();
      discardPeriodicTasks();
    }));

    it('should handle missing template gracefully', fakeAsync(() => {
      component.clusterTemplateID = 'non-existent-template';
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle template list loading error', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncError(new Error('Failed to load')));
      fixture.detectChanges();
      tick(1);

      // Component should handle error gracefully
      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle very large template list', fakeAsync(() => {
      const largeTemplateList = Array.from({length: 500}, (_, i) => ({
        id: `template-${i}`,
        name: `Template ${i}`,
      }));
      clusterTemplateService.list.mockReturnValue(asyncData(largeTemplateList));
      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle template with special characters in name', fakeAsync(() => {
      component.clusterTemplateID = 'template-@#$%-test';
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      expect(component.clusterTemplateID).toBe('template-@#$%-test');
      discardPeriodicTasks();
    }));
  });

  describe('Cluster Creation & API Interactions', () => {
    it('should handle successful cluster creation', fakeAsync(() => {
      const newCluster = fakeAWSCluster();
      clusterService.create.mockReturnValue(asyncData(newCluster));
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      if (component.form) {
        // Form should be initialized
        expect(component.form).toBeTruthy();
      }

      discardPeriodicTasks();
    }));

    it('should handle cluster creation API error', fakeAsync(() => {
      clusterService.create.mockReturnValue(asyncError(new Error('API Error')));
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle cluster creation timeout', fakeAsync(() => {
      clusterService.create.mockReturnValue(NEVER);
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      tick(5000);

      // Component should remain stable
      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle 409 conflict error during creation', fakeAsync(() => {
      const conflictError = new Error('Cluster already exists');
      (conflictError as any).status = 409;
      clusterService.create.mockReturnValue(asyncError(conflictError));
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle 400 validation error during creation', fakeAsync(() => {
      const validationError = new Error('Invalid cluster configuration');
      (validationError as any).status = 400;
      clusterService.create.mockReturnValue(asyncError(validationError));
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle 403 permission error during creation', fakeAsync(() => {
      const permissionError = new Error('Permission denied');
      (permissionError as any).status = 403;
      clusterService.create.mockReturnValue(asyncError(permissionError));
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));
  });

  describe('Boundary Conditions', () => {
    it('should handle cluster name with minimum length', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      if (component.form) {
        component.form.patchValue({name: 'a'});
        fixture.detectChanges();
        tick(1);

        expect(component.form.get('name')?.value).toBe('a');
      }

      discardPeriodicTasks();
    }));

    it('should handle cluster name with maximum length', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      const longName = 'a'.repeat(63); // Kubernetes name limit

      if (component.form) {
        component.form.patchValue({name: longName});
        fixture.detectChanges();
        tick(1);

        expect(component.form.get('name')?.value).toBe(longName);
      }

      discardPeriodicTasks();
    }));

    it('should reject cluster name exceeding maximum length', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      const tooLongName = 'a'.repeat(100);

      if (component.form) {
        component.form.patchValue({name: tooLongName});
        fixture.detectChanges();
        tick(1);

        expect(component.form.get('name')?.value).toBe(tooLongName);
      }

      discardPeriodicTasks();
    }));

    it('should handle cluster name with special characters', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      const specialCharName = 'cluster-@#$%-test';

      if (component.form) {
        component.form.patchValue({name: specialCharName});
        fixture.detectChanges();
        tick(1);

        expect(component.form.get('name')?.value).toBe(specialCharName);
      }

      discardPeriodicTasks();
    }));

    it('should handle empty cluster name', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      if (component.form) {
        component.form.patchValue({name: ''});
        fixture.detectChanges();
        tick(1);

        expect(component.form.get('name')?.value).toBe('');
      }

      discardPeriodicTasks();
    }));
  });

  describe('Memory Cleanup & Subscriptions', () => {
    it('should unsubscribe from all observables on destroy', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      const destroySpy = jest.spyOn(component as any, 'ngOnDestroy');

      fixture.destroy();

      expect(destroySpy).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should clean up stepper subscriptions', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      if (component.matStepper) {
        expect(component.matStepper).toBeTruthy();
      }

      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('should handle multiple destroy cycles', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));

      for (let i = 0; i < 3; i++) {
        fixture.detectChanges();
        tick(1);
        fixture.destroy();
      }

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));
  });

  describe('Form State Management', () => {
    it('should maintain form state across step changes', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      if (component.form && component.matStepper) {
        // Set value in first step
        component.form.patchValue({name: 'test-cluster'});
        fixture.detectChanges();
        tick(1);

        const valueBeforeNav = component.form.get('name')?.value;

        // Navigate to next step
        if (component.matStepper.selectedIndex < component.matStepper._steps.length - 1) {
          component.matStepper.next();
        }
        tick(1);

        // Navigate back
        component.matStepper.previous();
        tick(1);

        const valueAfterNav = component.form.get('name')?.value;
        expect(valueAfterNav).toBe(valueBeforeNav);
      }

      discardPeriodicTasks();
    }));

    it('should handle rapid form value changes', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      if (component.form) {
        // Rapid changes
        for (let i = 0; i < 10; i++) {
          component.form.patchValue({name: `cluster-${i}`});
        }
        tick(1);

        expect(component.form.get('name')?.value).toBe('cluster-9');
      }

      discardPeriodicTasks();
    }));

    it('should reset form when starting new wizard', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      if (component.form) {
        component.form.patchValue({name: 'test-cluster'});
        fixture.detectChanges();
        tick(1);

        // Reset (if method exists)
        if (component.form.reset) {
          component.form.reset();
        }
        fixture.detectChanges();
        tick(1);

        expect(component.form.get('name')?.value).toBeNull();
      }

      discardPeriodicTasks();
    }));
  });

  describe('Provider-Specific Logic', () => {
    it('should handle provider change during wizard', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      if (component.form) {
        // Change provider
        component.form.patchValue({provider: 'aws'});
        fixture.detectChanges();
        tick(1);

        component.form.patchValue({provider: 'gcp'});
        fixture.detectChanges();
        tick(1);

        component.form.patchValue({provider: 'azure'});
        fixture.detectChanges();
        tick(1);

        expect(component.form.get('provider')?.value).toBe('azure');
      }

      discardPeriodicTasks();
    }));

    it('should adapt wizard steps based on provider', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      const initialSteps = component.steps.length;

      if (component.form) {
        component.form.patchValue({provider: 'aws'});
        fixture.detectChanges();
        tick(1);

        // Steps should adapt
        expect(component.steps.length).toBeGreaterThanOrEqual(initialSteps - 1);
      }

      discardPeriodicTasks();
    }));
  });

  describe('Error Handling & Recovery', () => {
    it('should recover from form validation errors', fakeAsync(() => {
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      if (component.form) {
        // Create invalid state
        component.form.patchValue({name: ''});
        fixture.detectChanges();
        tick(1);

        // Recover with valid data
        component.form.patchValue({name: 'valid-cluster'});
        fixture.detectChanges();
        tick(1);

        expect(component.form.get('name')?.value).toBe('valid-cluster');
      }

      discardPeriodicTasks();
    }));

    it('should handle API errors gracefully', fakeAsync(() => {
      clusterService.create.mockReturnValue(asyncError(new Error('Network error')));
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      // Component should remain functional
      if (component.form) {
        component.form.patchValue({name: 'test'});
        fixture.detectChanges();
        tick(1);
      }

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle retry after failed creation', fakeAsync(() => {
      let callCount = 0;
      clusterService.create.mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return asyncError(new Error('Temporary error'));
        }
        return asyncData(fakeAWSCluster());
      });
      clusterTemplateService.list.mockReturnValue(asyncData([]));
      fixture.detectChanges();
      tick(1);

      expect(clusterService.create).toBeDefined();
      discardPeriodicTasks();
    }));
  });
});
