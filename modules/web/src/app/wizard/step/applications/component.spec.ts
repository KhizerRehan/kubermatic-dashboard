// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ApplicationService} from '@app/core/services/application';
import {ClusterSpecService} from '@app/core/services/cluster-spec';
import {WizardService} from '@app/core/services/wizard/wizard';
import {SharedModule} from '@shared/module';
import {Application, ApplicationSettings} from '@shared/entity/application';
import {WizardMode} from '@app/wizard/types/wizard-mode';
import {of, Subject} from 'rxjs';
import {ApplicationsStepComponent} from './component';
import {WizardMockService} from '@test/services/wizard-mock';

describe('ApplicationsStepComponent', () => {
  let fixture: ComponentFixture<ApplicationsStepComponent>;
  let component: ApplicationsStepComponent;
  let applicationService: any;
  let clusterSpecService: any;
  let wizardService: WizardMockService;

  const mockApplicationSettings: ApplicationSettings = {
    defaultNamespace: 'default',
  };

  beforeEach(waitForAsync(() => {
    const applicationServiceMock = {
      getApplicationSettings: jest.fn().mockReturnValue(of(mockApplicationSettings)),
      listApplicationDefinitions: jest.fn().mockReturnValue(of([])),
      getApplicationDefinition: jest.fn().mockReturnValue(of(null)),
      applications: [],
    };

    const clusterSpecServiceMock = {
      datacenter: 'us-central1',
      datacenterChanges: new Subject<string>(),
    };

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule],
      declarations: [ApplicationsStepComponent],
      providers: [
        {provide: ApplicationService, useValue: applicationServiceMock},
        {provide: ClusterSpecService, useValue: clusterSpecServiceMock},
        {provide: WizardService, useValue: new WizardMockService()},
      ],
      schemas: [NO_ERRORS_SCHEMA],
      teardown: {destroyAfterEach: false},
    })
      .overrideComponent(ApplicationsStepComponent, {
        set: {
          providers: [],
        },
      })
      .compileComponents();

    applicationService = TestBed.inject(ApplicationService);
    clusterSpecService = TestBed.inject(ClusterSpecService);
    wizardService = TestBed.inject(WizardService) as unknown as WizardMockService;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationsStepComponent);
    component = fixture.componentInstance;
    // Set wizard mode via window.history.state
    Object.defineProperty(window.history, 'state', {
      value: {mode: WizardMode.CreateUserCluster},
      writable: true,
    });
  });

  describe('Component Initialization', () => {
    it('should create the Applications Step component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty applications list', () => {
      expect(component.applications).toEqual([]);
    });

    it('should initialize form with applications control', () => {
      fixture.detectChanges();
      expect(component.form).toBeDefined();
      expect(component.form.get('applications')).toBeDefined();
    });

    it('should load wizard mode from window.history.state', () => {
      fixture.detectChanges();
      expect(component.wizardMode).toBe(WizardMode.CreateUserCluster);
    });
  });

  describe('Application Settings Loading', () => {
    it('should load application settings on init', () => {
      fixture.detectChanges();
      expect(applicationService.getApplicationSettings).toHaveBeenCalled();
    });

    it('should store loaded application settings', (done) => {
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        expect((component as any)._applicationSettings).toEqual(mockApplicationSettings);
        done();
      });
    });
  });

  describe('onApplicationAdded', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should add new application to applications list', () => {
      const newApp: Application = {
        name: 'prometheus',
        spec: {
          namespace: {name: 'prometheus'},
        },
      } as Application;

      component.onApplicationAdded(newApp);

      expect(component.applications.length).toBe(1);
      expect(component.applications[0].name).toBe('prometheus');
    });

    it('should generate ID for application if not present', () => {
      const newApp: Application = {
        name: 'prometheus',
        spec: {
          namespace: {name: 'prometheus'},
        },
      } as Application;

      component.onApplicationAdded(newApp);

      expect(component.applications[0].id).toBe('prometheus/prometheus');
    });

    it('should not add duplicate applications', () => {
      const app: Application = {
        name: 'prometheus',
        spec: {
          namespace: {name: 'prometheus'},
        },
      } as Application;

      component.onApplicationAdded(app);
      component.onApplicationAdded(app);

      expect(component.applications.length).toBe(1);
    });

    it('should call _onApplicationsChanged after adding', () => {
      const spy = jest.spyOn(component as any, '_onApplicationsChanged');
      const newApp: Application = {
        name: 'prometheus',
        spec: {
          namespace: {name: 'prometheus'},
        },
      } as Application;

      component.onApplicationAdded(newApp);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onApplicationUpdated', () => {
    beforeEach(() => {
      fixture.detectChanges();
      const app: Application = {
        id: 'prometheus/prometheus',
        name: 'prometheus',
        spec: {
          namespace: {name: 'prometheus'},
        },
      } as Application;
      component.applications = [app];
    });

    it('should update existing application properties', () => {
      const updated: Application = {
        id: 'prometheus/prometheus',
        name: 'prometheus-updated',
        spec: {
          namespace: {name: 'prometheus-updated'},
        },
      } as Application;

      component.onApplicationUpdated(updated);

      expect(component.applications[0].name).toBe('prometheus-updated');
      expect(component.applications[0].spec.namespace.name).toBe('prometheus-updated');
    });

    it('should update application ID based on name and namespace', () => {
      const updated: Application = {
        id: 'prometheus/prometheus',
        name: 'prometheus-v2',
        spec: {
          namespace: {name: 'monitoring'},
        },
      } as Application;

      component.onApplicationUpdated(updated);

      expect(component.applications[0].id).toBe('prometheus-v2/monitoring');
    });

    it('should create new applications array reference for change detection', () => {
      const oldReference = component.applications;
      const updated: Application = {
        id: 'prometheus/prometheus',
        name: 'prometheus',
        spec: {
          namespace: {name: 'prometheus'},
        },
      } as Application;

      component.onApplicationUpdated(updated);

      expect(component.applications).not.toBe(oldReference);
    });

    it('should call _onApplicationsChanged after updating', () => {
      const spy = jest.spyOn(component as any, '_onApplicationsChanged');
      const updated: Application = {
        id: 'prometheus/prometheus',
        name: 'prometheus',
        spec: {
          namespace: {name: 'prometheus'},
        },
      } as Application;

      component.onApplicationUpdated(updated);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onApplicationDeleted', () => {
    beforeEach(() => {
      fixture.detectChanges();
      const app1: Application = {
        id: 'prometheus/prometheus',
        name: 'prometheus',
        spec: {
          namespace: {name: 'prometheus'},
        },
      } as Application;
      const app2: Application = {
        id: 'grafana/grafana',
        name: 'grafana',
        spec: {
          namespace: {name: 'grafana'},
        },
      } as Application;
      component.applications = [app1, app2];
    });

    it('should remove application from list', () => {
      const deleted: Application = {
        id: 'prometheus/prometheus',
        name: 'prometheus',
        spec: {
          namespace: {name: 'prometheus'},
        },
      } as Application;

      component.onApplicationDeleted(deleted);

      expect(component.applications.length).toBe(1);
      expect(component.applications[0].name).toBe('grafana');
    });

    it('should create new applications array reference for change detection', () => {
      const oldReference = component.applications;
      const deleted: Application = {
        id: 'prometheus/prometheus',
        name: 'prometheus',
        spec: {
          namespace: {name: 'prometheus'},
        },
      } as Application;

      component.onApplicationDeleted(deleted);

      expect(component.applications).not.toBe(oldReference);
    });

    it('should call _onApplicationsChanged after deleting', () => {
      const spy = jest.spyOn(component as any, '_onApplicationsChanged');
      const deleted: Application = {
        id: 'prometheus/prometheus',
        name: 'prometheus',
        spec: {
          namespace: {name: 'prometheus'},
        },
      } as Application;

      component.onApplicationDeleted(deleted);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Datacenter Change Handling', () => {
    it('should reset applications list when datacenter changes', () => {
      fixture.detectChanges();

      const app: Application = {
        name: 'prometheus',
        spec: {
          namespace: {name: 'prometheus'},
        },
      } as Application;
      component.onApplicationAdded(app);
      expect(component.applications.length).toBe(1);

      clusterSpecService.datacenterChanges.next('eu-west1');

      expect(component.applications).toEqual([]);
      expect(applicationService.applications).toEqual([]);
    });

    it('should reload default and enforced applications after datacenter change', () => {
      fixture.detectChanges();

      applicationService.listApplicationDefinitions.mockClear();

      clusterSpecService.datacenterChanges.next('eu-west1');

      expect(applicationService.listApplicationDefinitions).toHaveBeenCalled();
    });

    it('should NOT reset applications when datacenter changes in CustomizeClusterTemplate mode', () => {
      Object.defineProperty(window.history, 'state', {
        value: {mode: WizardMode.CustomizeClusterTemplate},
        writable: true,
      });
      fixture.detectChanges();

      const app: Application = {
        name: 'prometheus',
        spec: {
          namespace: {name: 'prometheus'},
        },
      } as Application;
      component.onApplicationAdded(app);
      expect(component.applications.length).toBe(1);

      clusterSpecService.datacenterChanges.next('eu-west1');

      expect(component.applications.length).toBe(1);
      expect(component.applications[0].name).toBe('prometheus');
    });

    it('should NOT reset applications when datacenter changes in EditClusterTemplate mode', () => {
      Object.defineProperty(window.history, 'state', {
        value: {mode: WizardMode.EditClusterTemplate},
        writable: true,
      });
      fixture.detectChanges();

      const app: Application = {
        name: 'prometheus',
        spec: {
          namespace: {name: 'prometheus'},
        },
      } as Application;
      component.onApplicationAdded(app);
      expect(component.applications.length).toBe(1);

      clusterSpecService.datacenterChanges.next('eu-west1');

      expect(component.applications.length).toBe(1);
      expect(component.applications[0].name).toBe('prometheus');
    });
  });

  describe('ControlValueAccessor', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should write value to form via writeValue', () => {
      const value = {applications: 'test'};
      component.writeValue(value);
      expect(component.form.value).toEqual(value);
    });
  });

  describe('Validator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null for valid form', () => {
      const result = component.validate(null);
      expect(result).toBeNull();
    });
  });

  describe('Cleanup & Unsubscription', () => {
    it('should properly clean up subscriptions on destroy', () => {
      fixture.detectChanges();
      expect(() => {
        fixture.destroy();
      }).not.toThrow();
    });

    it('should unsubscribe from application service on destroy', () => {
      fixture.detectChanges();
      const unsubscribeSpy = jest.spyOn(component['_unsubscribe'], 'next');
      fixture.destroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('Wizard Mode Handling', () => {
    it('should recognize CreateUserCluster mode', () => {
      Object.defineProperty(window.history, 'state', {
        value: {mode: WizardMode.CreateUserCluster},
        writable: true,
      });
      fixture.detectChanges();
      expect(component.wizardMode).toBe(WizardMode.CreateUserCluster);
    });

    it('should recognize CreateClusterTemplate mode', () => {
      Object.defineProperty(window.history, 'state', {
        value: {mode: WizardMode.CreateClusterTemplate},
        writable: true,
      });
      fixture.detectChanges();
      expect(component.wizardMode).toBe(WizardMode.CreateClusterTemplate);
    });
  });
});
