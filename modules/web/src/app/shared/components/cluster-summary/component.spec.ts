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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SettingsService} from '@app/core/services/settings';
import {SharedModule} from '@shared/module';
import {Cluster} from '@shared/entity/cluster';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {Datacenter} from '@shared/entity/datacenter';
import {SSHKey} from '@shared/entity/ssh-key';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {SettingsMockService} from '@test/services/settings-mock';
import {ClusterSummaryComponent} from './component';

describe('ClusterSummaryComponent', () => {
  let fixture: ComponentFixture<ClusterSummaryComponent>;
  let component: ClusterSummaryComponent;
  let settingsService: jasmine.SpyObj<SettingsService>;

  const mockCluster: Cluster = {
    name: 'test-cluster',
    spec: {
      cloud: {
        aws: {
          vpcId: 'vpc-123',
        },
      },
      admissionPlugins: ['PodPreset'],
      clusterNetwork: {
        pods: {cidrBlocks: ['10.0.0.0/8']},
        services: {cidrBlocks: ['10.1.0.0/16']},
      },
      eventRateLimitConfig: {
        namespace: {
          qps: 50,
          burst: 100,
          cacheSize: 4096,
        },
      },
    },
  } as Cluster;

  const mockMachineDeployment: MachineDeployment = {
    name: 'test-md',
    spec: {
      template: {
        operatingSystem: 'ubuntu',
      },
    },
  } as MachineDeployment;

  const mockDatacenter: Datacenter = {
    metadata: {name: 'dc1'},
    spec: {provider: 'aws'},
  } as Datacenter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      providers: [
        {provide: SettingsService, useClass: SettingsMockService},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterSummaryComponent);
    component = fixture.componentInstance;
    component.cluster = mockCluster;
    component.machineDeployment = mockMachineDeployment;
    component.datacenter = mockDatacenter;
  });

  it('should initialize component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load admin settings on initialization', () => {
    fixture.detectChanges();
    expect(component.adminSettings).toBeTruthy();
  });

  it('should detect provider from cluster spec', () => {
    component.cluster = {
      ...mockCluster,
      spec: {...mockCluster.spec, cloud: {aws: {vpcId: 'vpc-123'}}},
    } as Cluster;
    expect(component.provider).toBe(NodeProvider.AWS);
  });

  it('should provide list of admission plugins', () => {
    const plugins = component.admissionPlugins;
    expect(plugins).toBeTruthy();
    expect(plugins.length).toBeGreaterThan(0);
  });

  it('should check if admission plugins are enabled', () => {
    component.cluster = {
      ...mockCluster,
      spec: {...mockCluster.spec, admissionPlugins: ['PodPreset', 'ResourceQuota']},
    } as Cluster;
    expect(component.isAdmissionPluginEnabled('PodPreset')).toBeTrue();
    expect(component.isAdmissionPluginEnabled('NonExistent')).toBeFalse();
  });

  it('should indicate when admission plugins are present', () => {
    component.cluster = {
      ...mockCluster,
      spec: {...mockCluster.spec, admissionPlugins: ['PodPreset']},
    } as Cluster;
    expect(component.hasAdmissionPlugins).toBeTrue();

    component.cluster = {
      ...mockCluster,
      spec: {...mockCluster.spec, admissionPlugins: undefined},
    } as Cluster;
    expect(component.hasAdmissionPlugins).toBeFalse();
  });

  it('should retrieve operating system from machine deployment', () => {
    component.machineDeployment = {
      ...mockMachineDeployment,
      spec: {
        template: {operatingSystem: 'ubuntu'},
      },
    } as MachineDeployment;
    const os = component.operatingSystem;
    expect(os).toBeDefined();
  });

  it('should handle SSH keys input', () => {
    const sshKeyNames = ['key1', 'key2', 'key3'];
    component.sshKeys = sshKeyNames;
    const keys = component.getSSHKeys();
    expect(keys.length).toBe(3);
    expect(keys[0].name).toBe('key1');
  });

  it('should return event rate limit types from cluster', () => {
    component.cluster = {
      ...mockCluster,
      spec: {
        ...mockCluster.spec,
        eventRateLimitConfig: {
          namespace: {qps: 50, burst: 100, cacheSize: 4096},
          server: {qps: 100, burst: 200, cacheSize: 8192},
        },
      },
    } as Cluster;
    const types = component.eventRateLimitTypes;
    expect(types).toContain('namespace');
    expect(types).toContain('server');
    expect(types.length).toBe(2);
  });

  it('should format applications counter class correctly', () => {
    component.cluster = {...mockCluster} as Cluster;
    component.clusterTemplateEditMode = false;
    const counterClass = component.getApplicationsCounterClass();
    expect(counterClass).toBeTruthy();
    expect(counterClass).toContain('counter-');
  });

  it('should provide admission plugin names', () => {
    const pluginName = component.getAdmissionPluginName('PodPreset');
    expect(pluginName).toBeDefined();
  });
});
