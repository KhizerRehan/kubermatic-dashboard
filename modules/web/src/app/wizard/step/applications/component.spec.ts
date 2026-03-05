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
  let applicationService: jasmine.SpyObj<ApplicationService>;
  let clusterSpecService: jasmine.SpyObj<ClusterSpecService>;
  let wizardService: WizardMockService;

  const mockApplicationSettings: ApplicationSettings = {
    defaultNamespace: 'default',
  };

  const mockApplicationDefinitions: Application[] = [
    {
      name: 'cert-manager',
      spec: {
        namespace: {name: 'cert-manager'},
        default: true,
        enforced: false,
        selector: {datacenters: ['us-central1']},
      },
    } as Application,
    {
      name: 'k8sgpt',
      spec: {
        namespace: {name: 'k8sgpt'},
        default: false,
        enforced: true,
        selector: {datacenters: []},
      },
    } as Application,
    {
      name: 'ingress-nginx',
      spec: {
        namespace: {name: 'ingress-nginx'},
        default: false,
        enforced: false,
        selector: {datacenters: null},
      },
    } as Application,
  ];

  beforeEach(waitForAsync(() => {
    const applicationServiceMock = jasmine.createSpyObj('ApplicationService', [
      'getApplicationSettings',
      'listApplicationDefinitions',
      'getApplicationDefinition',
    ]);

    applicationServiceMock.getApplicationSettings.and.returnValue(of(mockApplicationSettings));
    applicationServiceMock.listApplicationDefinitions.and.returnValue(of(mockApplicationDefinitions));
    applicationServiceMock.getApplicationDefinition.and.callFake((name: string) => {
      return of(mockApplicationDefinitions.find(app => app.name === name));
    });

    const clusterSpecServiceMock = jasmine.createSpyObj('ClusterSpecService', [], {
      datacenter: 'us-central1',
      datacenterChanges: new Subject<string>(),
    });

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule],
      declarations: [ApplicationsStepComponent],
      providers: [
        {provide: ApplicationService, useValue: applicationServiceMock},
        {provide: ClusterSpecService, useValue: clusterSpecServiceMock},
        {provide: WizardService, useValue: new WizardMockService()},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    applicationService = TestBed.inject(ApplicationService) as jasmine.SpyObj<ApplicationService>;
    clusterSpecService = TestBed.inject(ClusterSpecService) as jasmine.SpyObj<ClusterSpecService>;
    wizardService = TestBed.inject(WizardService) as unknown as WizardMockService;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationsStepComponent);
    component = fixture.componentInstance;
    // Set wizard mode via window.history.state
    Object.defineProperty(window.history, 'state', {
      value: {mode: WizardMode.CreateCluster},
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
      expect(component.wizardMode).toBe(WizardMode.CreateCluster);
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

  describe('Application Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have onApplicationAdded method', () => {
      expect(component.onApplicationAdded).toBeDefined();
    });

    it('should have onApplicationUpdated method', () => {
      expect(component.onApplicationUpdated).toBeDefined();
    });

    it('should have onApplicationDeleted method', () => {
      expect(component.onApplicationDeleted).toBeDefined();
    });

    describe('onApplicationAdded', () => {
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
        const spy = spyOn<any>(component, '_onApplicationsChanged');
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
        const spy = spyOn<any>(component, '_onApplicationsChanged');
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
        const spy = spyOn<any>(component, '_onApplicationsChanged');
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
  });

  describe('ControlValueAccessor Interface', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should implement ControlValueAccessor interface', () => {
      expect(component.writeValue).toBeDefined();
      expect(component.registerOnChange).toBeDefined();
      expect(component.registerOnTouched).toBeDefined();
    });

    it('should write value to form via writeValue', () => {
      const value = {applications: 'test'};
      component.writeValue(value);
      expect(component.form.value).toEqual(value);
    });
  });

  describe('Validator Interface', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should implement Validator interface', () => {
      expect(component.validate).toBeDefined();
    });

    it('should return null for valid form', () => {
      const result = component.validate(null);
      expect(result).toBeNull();
    });
  });

  describe('ApplicationsListView Enum', () => {
    it('should expose ApplicationsListView for template', () => {
      expect(component.ApplicationsListView).toBeDefined();
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
      const unsubscribeSpy = spyOn<any>(component['_unsubscribe'], 'next');
      fixture.destroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('Wizard Mode Handling', () => {
    it('should recognize CreateCluster mode', () => {
      Object.defineProperty(window.history, 'state', {
        value: {mode: WizardMode.CreateCluster},
        writable: true,
      });
      fixture.detectChanges();
      expect(component.wizardMode).toBe(WizardMode.CreateCluster);
    });

    it('should recognize EditCluster mode', () => {
      Object.defineProperty(window.history, 'state', {
        value: {mode: WizardMode.EditCluster},
        writable: true,
      });
      fixture.detectChanges();
      expect(component.wizardMode).toBe(WizardMode.EditCluster);
    });
  });
});
