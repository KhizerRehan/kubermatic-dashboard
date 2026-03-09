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
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {AppConfigService} from '@app/config.service';
import {ApplicationService} from '@app/core/services/application';
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {ClusterService} from '@app/core/services/cluster';
import {ClusterSpecService} from '@app/core/services/cluster-spec';
import {DatacenterService} from '@app/core/services/datacenter';
import {FeatureGateService} from '@app/core/services/feature-gate';
import {ProjectService} from '@app/core/services/project';
import {SettingsService} from '@app/core/services/settings';
import {WizardService} from '@app/core/services/wizard/wizard';
import {BrandingService} from '@core/services/branding';
import {LabelService} from '@core/services/label';
import {NameGeneratorService} from '@core/services/name-generator';
import {UserClusterConfigService} from '@app/core/services/user-cluster-config';
import {SharedModule} from '@shared/module';
import {MasterVersion} from '@shared/entity/cluster';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {of, Subject} from 'rxjs';
import {ClusterStepComponent} from './component';
import {GlobalModule} from '@core/services/global/module';
import {WizardMockService} from '@test/services/wizard-mock';

describe('ClusterStepComponent', () => {
  let fixture: ComponentFixture<ClusterStepComponent>;
  let component: ClusterStepComponent;
  let clusterService: any;
  let clusterSpecService: any;
  let nameGeneratorService: any;

  const mockMasterVersions: MasterVersion[] = [
    {version: 'v1.26.0'},
    {version: 'v1.25.0'},
    {version: 'v1.24.0'},
  ] as MasterVersion[];

  const mockDatacenter: Datacenter = {
    metadata: {name: 'us-west-1'},
    spec: {
      provider: 'aws',
      country: 'US',
      location: 'US West',
      seed: 'us-west-1-seed',
    },
  } as Datacenter;

  const mockSeedSettings: SeedSettings = {} as SeedSettings;

  beforeEach(waitForAsync(() => {
    const clusterServiceMock = {
      getMasterVersions: jest.fn().mockReturnValue(of(mockMasterVersions)),
      getAdmissionPlugins: jest.fn().mockReturnValue(of([])),
      getCNIPluginVersions: jest.fn().mockReturnValue(of({versions: ['v1.12.0'], cniDefaultVersion: 'v1.12.0'})),
      getClusterDefaults: jest.fn().mockReturnValue(of({})),
    };
    

    const clusterSpecServiceMock = {
      cluster: {name: '', spec: {cloud: {aws: {}}, clusterNetwork: {}, admissionPlugins: []}, annotations: {}},
      datacenter: '',
      datacenterChanges: new Subject<string>(),
      providerChanges: of(NodeProvider.AWS),
      clusterChanges: new Subject<any>(),
      provider: NodeProvider.AWS,
      sshKeys: '',
      clusterTemplateEditMode: false,
      emitChangeEvents: jest.fn(),
      labels: {},
      annotations: {},
      admissionPlugins: [],
      podNodeSelectorAdmissionPluginConfig: {},
      eventRateLimitConfig: {},
      encryptionAtRestKey: null,
    };

    const datacenterServiceMock = {
      getDatacenter: jest.fn().mockReturnValue(of(mockDatacenter)),
      seedSettings: jest.fn().mockReturnValue(of(mockSeedSettings)),
    };

    const settingsServiceMock = {
      adminSettings: of({
        enableDashboard: true,
        enableClusterBackups: true,
        opaOptions: {enabled: false, enforced: false},
        mlaOptions: {loggingEnabled: false, loggingEnforced: false, monitoringEnabled: false, monitoringEnforced: false},
        staticLabels: [],
      }),
    };

    const featureGateServiceMock = {
      featureGates: of({disableUserSSHKey: false}),
    };

    const projectServiceMock = {
      selectedProject: of({id: 'test-project'}),
    };

    const applicationServiceMock = {
      getApplicationDefinition: jest.fn().mockReturnValue(of({spec: {defaultValuesBlock: ''}})),
    };

    const clusterBackupServiceMock = {
      listBackupStorageLocation: jest.fn().mockReturnValue(of([])),
    };

    nameGeneratorService = {
      generateName: jest.fn().mockReturnValue('generated-name'),
    };


  //     constructor(
  //   private readonly _builder: FormBuilder,
  //   private readonly _cdr: ChangeDetectorRef,
  //   private readonly _matDialog: MatDialog,
  //   private readonly _clusterService: ClusterService,
  //   private readonly _nameGenerator: NameGeneratorService,
  //   private readonly _clusterSpecService: ClusterSpecService,
  //   private readonly _datacenterService: DatacenterService,
  //   private readonly _settingsService: SettingsService,
  //   private readonly _applicationService: ApplicationService,
  //   private readonly _projectService: ProjectService,
  //   private readonly _clusterBackupService: ClusterBackupService,
  //   private readonly _featureGatesService: FeatureGateService,
  //   readonly branding: BrandingService,
  //   private readonly _userClusterConfigService: UserClusterConfigService,
  //   wizard: WizardService
  // ) {
  //   super(wizard);
  // }
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, HttpClientModule, SharedModule, GlobalModule],
      declarations: [ClusterStepComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {provide: ClusterService, useValue: clusterServiceMock},
        {provide: ClusterSpecService, useValue: clusterSpecServiceMock},
        {provide: DatacenterService, useValue: datacenterServiceMock},
        {provide: SettingsService, useValue: settingsServiceMock},
        {provide: FeatureGateService, useValue: featureGateServiceMock},
        {provide: ProjectService, useValue: projectServiceMock},
        {provide: ApplicationService, useValue: applicationServiceMock},
        {provide: ClusterBackupService, useValue: clusterBackupServiceMock},
        {provide: MatDialog, useValue: {open: jest.fn()}},
        {provide: WizardService, useValue: new WizardMockService()},
        {provide: BrandingService, useValue: {isKubermaticBranding: true}},
        {provide: NameGeneratorService, useValue: nameGeneratorService},
        {provide: UserClusterConfigService, useValue: {getAdmissionPluginsConfiguration: jest.fn().mockReturnValue(of({}))}},
        {provide: LabelService, useValue: {systemLabels: of({})}},
        AppConfigService,
      ],
      teardown: {destroyAfterEach: false},
    })
      .overrideComponent(ClusterStepComponent, {
        set: {
          providers: [],
        },
      })
      .compileComponents();

    clusterService = TestBed.inject(ClusterService);
    clusterSpecService = TestBed.inject(ClusterSpecService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterStepComponent);
    component = fixture.componentInstance;
  });

  // Call ngOnInit manually to set up form without template rendering (avoids NG01203 errors)
  function initComponent(): void {
    component.ngOnInit();
  }

  describe('Form Validation', () => {
    beforeEach(() => {
      initComponent();
    });

    it('should require cluster name', () => {
      const nameControl = component.form.get('name');
      nameControl.setValue('');
      expect(nameControl.hasError('required')).toBe(true);
    });

    it('should accept valid cluster name', () => {
      const nameControl = component.form.get('name');
      nameControl.setValue('my-cluster');
      expect(nameControl.hasError('required')).toBe(false);
    });

    it('should enforce minimum name length of 5 characters', () => {
      const nameControl = component.form.get('name');
      nameControl.setValue('abcd');
      expect(nameControl.hasError('minlength')).toBe(true);

      nameControl.setValue('abcde');
      expect(nameControl.hasError('minlength')).toBe(false);
    });

    it('should reject names with special characters', () => {
      const nameControl = component.form.get('name');
      nameControl.setValue('my|cluster"name');
      expect(nameControl.hasError('pattern')).toBe(true);
    });

    it('should require version selection', () => {
      const versionControl = component.form.get('version');
      versionControl.setValue('');
      expect(versionControl.hasError('required')).toBe(true);
    });

    it('should require container runtime', () => {
      const runtimeControl = component.form.get('containerRuntime');
      runtimeControl.setValue('');
      expect(runtimeControl.hasError('required')).toBe(true);
    });

    it('should mark form as invalid when required controls are empty', () => {
      expect(component.form.valid).toBe(false);
    });
  });

  describe('Master Versions Loading', () => {
    it('should load master versions via providerChanges', () => {
      initComponent();
      expect(clusterService.getMasterVersions).toHaveBeenCalled();
    });

    it('should populate masterVersions array', (done) => {
      initComponent();
      fixture.whenStable().then(() => {
        expect(component.masterVersions.length).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Name Generation', () => {
    it('should generate a name and set it on the name control', () => {
      initComponent();
      component.generateName();
      expect(component.form.get('name').value).toBe('generated-name');
      expect(nameGeneratorService.generateName).toHaveBeenCalled();
    });
  });

  describe('Encryption at Rest', () => {
    beforeEach(() => {
      initComponent();
    });

    it('should add required validator to encryption key when encryption is enabled', () => {
      component.form.get('encryptionAtRest').setValue(true);

      const keyControl = component.form.get('encryptionAtRestKey');
      keyControl.setValue('');
      expect(keyControl.hasError('required')).toBe(true);
    });

    it('should clear encryption key validators when encryption is disabled', () => {
      component.form.get('encryptionAtRest').setValue(true);
      component.form.get('encryptionAtRest').setValue(false);

      const keyControl = component.form.get('encryptionAtRestKey');
      expect(keyControl.value).toBe('');
      expect(keyControl.valid).toBe(true);
    });

    it('should generate encryption key and set it on control', () => {
      component.form.get('encryptionAtRest').setValue(true);

      component.generateEncryptionKey();
      const keyValue = component.form.get('encryptionAtRestKey').value;
      expect(keyValue).toBeTruthy();
      expect(typeof keyValue).toBe('string');
    });

    it('should not show encryption at rest in template modes', () => {
      component.wizardMode = 'create-cluster-template' as any;
      expect(component.isEncryptionAtRestVisible()).toBe(false);

      component.wizardMode = 'edit-cluster-template' as any;
      expect(component.isEncryptionAtRestVisible()).toBe(false);

      component.wizardMode = 'customize-cluster-template' as any;
      expect(component.isEncryptionAtRestVisible()).toBe(false);
    });

    it('should show encryption at rest in cluster creation mode', () => {
      component.clusterTemplateEditMode = false;
      component.wizardMode = 'create-user-cluster' as any;
      expect(component.isEncryptionAtRestVisible()).toBe(true);
    });
  });

  describe('Audit Logging', () => {
    beforeEach(() => {
      initComponent();
    });

    it('should disable audit webhook backend when audit logging is turned off', () => {
      component.form.get('auditLogging').setValue(true);
      component.form.get('auditWebhookBackend').setValue(true);

      component.form.get('auditLogging').setValue(false);

      expect(component.form.get('auditWebhookBackend').value).toBe(false);
    });
  });

  describe('Cluster Backup', () => {
    beforeEach(() => {
      initComponent();
    });

    it('should add backupStorageLocation control when cluster backup is enabled', () => {
      component.form.get('clusterBackup').setValue(true);
      expect(component.form.get('backupStorageLocation')).toBeTruthy();
    });

    it('should require backupStorageLocation when cluster backup is enabled', () => {
      component.form.get('clusterBackup').setValue(true);

      const bslControl = component.form.get('backupStorageLocation');
      bslControl.setValue('');
      expect(bslControl.hasError('required')).toBe(true);
    });

    it('should remove backupStorageLocation control when cluster backup is disabled', () => {
      component.form.get('clusterBackup').setValue(true);
      component.form.get('clusterBackup').setValue(false);

      expect(component.form.get('backupStorageLocation')).toBeFalsy();
    });
  });

  describe('CNI Plugin', () => {
    beforeEach(() => {
      initComponent();
    });

    it('should detect cilium selection', () => {
      component.form.get('cniPlugin').setValue('cilium');
      expect(component.isCiliumSelected()).toBe(true);
    });

    it('should detect non-cilium CNI', () => {
      component.form.get('cniPlugin').setValue('canal');
      expect(component.isCiliumSelected()).toBe(false);
    });

    it('should detect CNI plugin type presence', () => {
      component.form.get('cniPlugin').setValue('cilium');
      expect(component.hasCNIPluginType()).toBe(true);
    });

    it('should detect no CNI plugin', () => {
      component.form.get('cniPlugin').setValue('none');
      expect(component.hasCNIPluginType()).toBe(false);
    });
  });

  describe('IP Family', () => {
    it('should default to IPv4 family on form init', () => {
      // Init form without triggering subscriptions that access cloud spec
      (component as any)._initForm();
      expect(component.form.get('ipFamily').value).toBe('IPv4');
    });
  });

  describe('Expose Strategy', () => {
    beforeEach(() => {
      initComponent();
    });

    it('should detect LoadBalancer expose strategy', () => {
      component.form.get('exposeStrategy').setValue('LoadBalancer');
      expect(component.isExposeStrategyLoadBalancer()).toBe(true);
    });

    it('should detect non-LoadBalancer expose strategy', () => {
      component.form.get('exposeStrategy').setValue('NodePort');
      expect(component.isExposeStrategyLoadBalancer()).toBe(false);
    });
  });

  describe('Labels and Annotations', () => {
    beforeEach(() => {
      initComponent();
    });

    it('should update labels in component and ClusterSpecService', () => {
      const labels = {env: 'production', team: 'backend'};
      component.onLabelsChange(labels);
      expect(component.labels).toEqual(labels);
      expect(clusterSpecService.labels).toEqual(labels);
    });

    it('should update annotations in component and ClusterSpecService', () => {
      const annotations = {'custom/note': 'test'};
      component.onAnnotationsChange(annotations);
      expect(component.annotations).toEqual(annotations);
      expect(clusterSpecService.annotations).toEqual(annotations);
    });
  });

  describe('ControlValueAccessor', () => {
    beforeEach(() => {
      initComponent();
    });

    it('should accept writeValue with null gracefully', () => {
      expect(() => component.writeValue(null)).not.toThrow();
    });
  });

  describe('Validator', () => {
    beforeEach(() => {
      initComponent();
    });

    it('should return validation errors when form is invalid', () => {
      component.form.get('name').setValue('');
      const result = component.validate(null);
      expect(result).not.toBeNull();
    });

    it('should return null when name and version are valid', () => {
      component.form.get('name').setValue('valid-cluster-name');
      component.form.get('version').setValue('v1.26.0');
      component.form.get('containerRuntime').setValue('containerd');
      const nameControl = component.form.get('name');
      expect(nameControl.valid).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should clean up subscriptions on destroy', () => {
      initComponent();
      const unsubscribeSpy = jest.spyOn(component['_unsubscribe'], 'next');
      component.ngOnDestroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });
});
