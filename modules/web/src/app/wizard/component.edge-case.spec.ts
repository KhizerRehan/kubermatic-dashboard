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
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {AppConfigService} from '@app/config.service';
import {ApplicationService} from '@core/services/application';
import {Auth} from '@core/services/auth/service';
import {ClusterService} from '@core/services/cluster';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {DatacenterService} from '@core/services/datacenter';
import {NameGeneratorService} from '@core/services/name-generator';
import {NodeDataService} from '@core/services/node-data/service';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {WizardService} from '@core/services/wizard/wizard';
import {QuotaCalculationService} from '@app/dynamic/enterprise/quotas/services/quota-calculation';
import {SharedModule} from '@shared/module';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {AuthMockService} from '@test/services/auth-mock';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {ActivatedRouteStub, RouterStub} from '@test/services/router-stubs';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {of, Subject} from 'rxjs';
import {WizardComponent} from './component';
import {WizardMode} from './types/wizard-mode';
import {StepRegistry} from './config';

describe('WizardComponent', () => {
  let fixture: ComponentFixture<WizardComponent>;
  let component: WizardComponent;
  let router: Router;
  let notificationService: any;

  beforeEach(waitForAsync(() => {
    const clusterSpecServiceMock = {
      cluster: {name: 'test-cluster', spec: {cloud: {}, clusterNetwork: {}, admissionPlugins: []}, labels: {}, annotations: {}, credential: ''},
      datacenter: '',
      datacenterChanges: new Subject<string>(),
      providerChanges: of(null),
      clusterChanges: new Subject<any>(),
      provider: null,
      sshKeys: [],
      clusterTemplateEditMode: false,
      emitChangeEvents: jest.fn(),
      sshKeyChanges: of([]),
      encryptionAtRestKey: null,
      reset: jest.fn(),
      initializeClusterFromClusterTemplate: jest.fn(),
    };

    const nodeDataServiceMock = {
      operatingSystemChanges: of(null),
      isInWizardMode: jest.fn().mockReturnValue(true),
      nodeData: {name: 'worker', spec: {}, count: 3, dynamicConfig: false, annotations: {}, labels: {}, minReplicas: 1, maxReplicas: 5, operatingSystemProfile: null},
      reset: jest.fn(),
      initializeNodeDataFromMachineDeployment: jest.fn(),
    };

    const applicationServiceMock = {
      applications: [],
      getApplicationDefinition: jest.fn().mockReturnValue(of(null)),
      listApplicationDefinitions: jest.fn().mockReturnValue(of([])),
      reset: jest.fn(),
    };

    notificationService = {success: jest.fn(), error: jest.fn()};

    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, SharedModule],
      declarations: [WizardComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {provide: ClusterService, useValue: {create: jest.fn(), cluster: jest.fn()}},
        {provide: ClusterTemplateService, useValue: {list: jest.fn(), get: jest.fn()}},
        {provide: ClusterSpecService, useValue: clusterSpecServiceMock},
        {provide: NodeDataService, useValue: nodeDataServiceMock},
        {provide: ApplicationService, useValue: applicationServiceMock},
        {provide: Auth, useClass: AuthMockService},
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
        {provide: UserService, useClass: UserMockService},
        {provide: Router, useClass: RouterStub},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: NameGeneratorService, useValue: {generateName: jest.fn().mockReturnValue('generated-name')}},
        {provide: NotificationService, useValue: notificationService},
        {provide: QuotaCalculationService, useValue: {getQuotaExceed: jest.fn().mockReturnValue(of(false))}},
        WizardService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardComponent);
    component = fixture.componentInstance;
    router = fixture.debugElement.injector.get(Router);
    const activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {projectID: '4k6txp5sq'};
  });

  describe('getTitle()', () => {
    it('should return "Create Cluster" for CreateUserCluster mode', () => {
      component.wizardMode = WizardMode.CreateUserCluster;
      expect(component.getTitle()).toBe('Create Cluster');
    });

    it('should return "Create Cluster Template" for CreateClusterTemplate mode', () => {
      component.wizardMode = WizardMode.CreateClusterTemplate;
      expect(component.getTitle()).toBe('Create Cluster Template');
    });

    it('should return "Edit Cluster Template" for EditClusterTemplate mode', () => {
      component.wizardMode = WizardMode.EditClusterTemplate;
      expect(component.getTitle()).toBe('Edit Cluster Template');
    });

    it('should return "Customize Cluster Template" for CustomizeClusterTemplate mode', () => {
      component.wizardMode = WizardMode.CustomizeClusterTemplate;
      expect(component.getTitle()).toBe('Customize Cluster Template');
    });

    it('should return "Create Cluster" when no mode is set', () => {
      component.wizardMode = undefined;
      expect(component.getTitle()).toBe('Create Cluster');
    });
  });

  describe('getPrimaryButtonLabel()', () => {
    it('should return "Create Cluster" for CreateUserCluster mode', () => {
      component.wizardMode = WizardMode.CreateUserCluster;
      expect(component.getPrimaryButtonLabel()).toBe('Create Cluster');
    });

    it('should return "Save Template" for CreateClusterTemplate mode', () => {
      component.wizardMode = WizardMode.CreateClusterTemplate;
      expect(component.getPrimaryButtonLabel()).toBe('Save Template');
    });

    it('should return "Save Changes to Template" for EditClusterTemplate mode', () => {
      component.wizardMode = WizardMode.EditClusterTemplate;
      expect(component.getPrimaryButtonLabel()).toBe('Save Changes to Template');
    });

    it('should return "Create Cluster from Customized Template" for CustomizeClusterTemplate mode', () => {
      component.wizardMode = WizardMode.CustomizeClusterTemplate;
      expect(component.getPrimaryButtonLabel()).toBe('Create Cluster from Customized Template');
    });
  });

  describe('getSecondaryButtonLabel()', () => {
    it('should return "Save Cluster Template" for CreateUserCluster mode', () => {
      component.wizardMode = WizardMode.CreateUserCluster;
      expect(component.getSecondaryButtonLabel()).toBe('Save Cluster Template');
    });

    it('should return "Save Template and Create Cluster" for CreateClusterTemplate mode', () => {
      component.wizardMode = WizardMode.CreateClusterTemplate;
      expect(component.getSecondaryButtonLabel()).toBe('Save Template and Create Cluster');
    });

    it('should return "Save as New Template" for EditClusterTemplate mode', () => {
      component.wizardMode = WizardMode.EditClusterTemplate;
      expect(component.getSecondaryButtonLabel()).toBe('Save as New Template');
    });

    it('should return "Save as New Template" for CustomizeClusterTemplate mode', () => {
      component.wizardMode = WizardMode.CustomizeClusterTemplate;
      expect(component.getSecondaryButtonLabel()).toBe('Save as New Template');
    });
  });

  describe('steps getter', () => {
    it('should return only enabled steps', () => {
      const stepNames = component.steps.map(s => s.name);
      // MachineNetwork is disabled by default in config.ts
      expect(stepNames).not.toContain(StepRegistry.MachineNetwork);
      expect(stepNames).toContain(StepRegistry.Provider);
      expect(stepNames).toContain(StepRegistry.Cluster);
      expect(stepNames).toContain(StepRegistry.Summary);
    });

    it('should filter out Provider step when clusterTemplateID is set', () => {
      component.clusterTemplateID = 'template-123';
      const stepNames = component.steps.map(s => s.name);
      expect(stepNames).not.toContain(StepRegistry.Provider);
      expect(stepNames).toContain(StepRegistry.Cluster);
    });

    it('should include Provider step when no clusterTemplateID', () => {
      component.clusterTemplateID = undefined;
      const stepNames = component.steps.map(s => s.name);
      expect(stepNames).toContain(StepRegistry.Provider);
    });
  });

  describe('showCreateClusterButton', () => {
    it('should return true on last step for CreateUserCluster mode', () => {
      component.wizardMode = WizardMode.CreateUserCluster;
      Object.defineProperty(component, 'last', {get: () => true, configurable: true});
      expect(component.showCreateClusterButton).toBe(true);
    });

    it('should return true on last step for CustomizeClusterTemplate mode', () => {
      component.wizardMode = WizardMode.CustomizeClusterTemplate;
      Object.defineProperty(component, 'last', {get: () => true, configurable: true});
      expect(component.showCreateClusterButton).toBe(true);
    });

    it('should return false on last step for CreateClusterTemplate mode', () => {
      component.wizardMode = WizardMode.CreateClusterTemplate;
      Object.defineProperty(component, 'last', {get: () => true, configurable: true});
      expect(component.showCreateClusterButton).toBe(false);
    });

    it('should return false on last step for EditClusterTemplate mode', () => {
      component.wizardMode = WizardMode.EditClusterTemplate;
      Object.defineProperty(component, 'last', {get: () => true, configurable: true});
      expect(component.showCreateClusterButton).toBe(false);
    });

    it('should return false when not on last step', () => {
      component.wizardMode = WizardMode.CreateUserCluster;
      Object.defineProperty(component, 'last', {get: () => false, configurable: true});
      expect(component.showCreateClusterButton).toBe(false);
    });
  });

  describe('onCancel()', () => {
    beforeEach(() => {
      component.project = {id: 'test-project'} as any;
      jest.spyOn(router, 'navigate');
    });

    it('should navigate to clusters list for CreateUserCluster mode', () => {
      component.wizardMode = WizardMode.CreateUserCluster;
      component.onCancel();
      expect(router.navigate).toHaveBeenCalledWith(['/projects/test-project/clusters']);
    });

    it('should navigate to cluster templates for CreateClusterTemplate mode', () => {
      component.wizardMode = WizardMode.CreateClusterTemplate;
      component.onCancel();
      expect(router.navigate).toHaveBeenCalledWith(['/projects/test-project/clustertemplates']);
    });

    it('should navigate to cluster templates for EditClusterTemplate mode', () => {
      component.wizardMode = WizardMode.EditClusterTemplate;
      component.onCancel();
      expect(router.navigate).toHaveBeenCalledWith(['/projects/test-project/clustertemplates']);
    });

    it('should navigate to cluster templates for CustomizeClusterTemplate mode', () => {
      component.wizardMode = WizardMode.CustomizeClusterTemplate;
      component.onCancel();
      expect(router.navigate).toHaveBeenCalledWith(['/projects/test-project/clustertemplates']);
    });

    it('should default to clusters list when no mode is set', () => {
      component.wizardMode = undefined;
      component.onCancel();
      expect(router.navigate).toHaveBeenCalledWith(['/projects/test-project/clusters']);
    });
  });

  describe('onNext()', () => {
    beforeEach(() => {
      component.project = {id: 'test-project'} as any;
      jest.spyOn(router, 'navigate');
    });

    it('should set creating flag to true', () => {
      const cluster = {id: 'cluster-1', name: 'my-cluster'} as any;
      component.onNext(cluster);
      expect(component.creating).toBe(true);
    });

    it('should show success notification with cluster name', () => {
      const cluster = {id: 'cluster-1', name: 'my-cluster'} as any;
      component.onNext(cluster);
      expect(notificationService.success).toHaveBeenCalledWith('Created the my-cluster cluster');
    });

    it('should navigate to cluster details page', () => {
      const cluster = {id: 'cluster-1', name: 'my-cluster'} as any;
      component.onNext(cluster);
      expect(router.navigate).toHaveBeenCalledWith(['/projects/test-project/clusters/cluster-1']);
    });
  });

  describe('ngOnInit()', () => {
    it('should set project ID from route params', () => {
      component.ngOnInit();
      expect(component.project.id).toBe('4k6txp5sq');
    });

    it('should set loadingClusterTemplate to false when no template ID', () => {
      component.ngOnInit();
      expect(component.loadingClusterTemplate).toBe(false);
    });
  });

  describe('ngOnDestroy()', () => {
    it('should clean up subscriptions without error', () => {
      component.ngOnInit();
      expect(() => {
        component.ngOnDestroy();
      }).not.toThrow();
    });
  });
});
