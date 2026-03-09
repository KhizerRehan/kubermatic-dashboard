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
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ApplicationService} from '@app/core/services/application';
import {ClusterSpecService} from '@app/core/services/cluster-spec';
import {DatacenterService} from '@app/core/services/datacenter';
import {NodeDataService} from '@app/core/services/node-data/service';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {Cluster} from '@shared/entity/cluster';
import {Application, ApplicationLabel, ApplicationLabelValue} from '@shared/entity/application';
import {OPERATING_SYSTEM_PROFILE_ANNOTATION} from '@shared/entity/machine-deployment';
import {of, Subject} from 'rxjs';
import {SummaryStepComponent} from './component';

describe('SummaryStepComponent', () => {
  let fixture: ComponentFixture<SummaryStepComponent>;
  let component: SummaryStepComponent;
  let clusterSpecService: any;
  let nodeDataService: any;
  let datacenterService: any;
  let applicationService: any;

  const mockDatacenter: Datacenter = {
    metadata: {name: 'us-west-1'},
    spec: {
      provider: 'aws',
      country: 'US',
      location: 'US West (N. California)',
      seed: 'us-west-1-seed',
    },
  } as Datacenter;

  const mockSeedSettings: SeedSettings = {} as SeedSettings;

  const mockCluster = {
    name: 'test-cluster',
    spec: {
      humanReadableVersion: '1.24.0',
      version: 'v1.24.0',
    },
  } as unknown as Cluster;

  const mockApplications: Application[] = [
    {
      name: 'prometheus',
      labels: {},
      spec: {
        namespace: {name: 'prometheus'},
      },
    } as unknown as Application,
    {
      name: 'cert-manager',
      labels: {},
      spec: {
        namespace: {name: 'cert-manager'},
      },
    } as unknown as Application,
  ];

  beforeEach(waitForAsync(() => {
    const clusterSpecServiceMock = {
      cluster: mockCluster,
      sshKeyChanges: of([]),
      datacenterChanges: of('us-west-1'),
      clusterTemplateEditMode: false,
    };

    const nodeDataServiceMock = {
      nodeData: {
        name: 'initial-nodes',
        spec: {},
        count: 3,
        dynamicConfig: false,
        annotations: {},
        labels: {},
        minReplicas: 1,
        maxReplicas: 5,
        operatingSystemProfile: null,
      },
    };

    const datacenterServiceMock = {
      getDatacenter: jest.fn().mockReturnValue(of(mockDatacenter)),
      seedSettings: jest.fn().mockReturnValue(of(mockSeedSettings)),
    };

    const applicationServiceMock = {
      applications: mockApplications,
    };

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, HttpClientModule],
      declarations: [SummaryStepComponent],
      providers: [
        {provide: ClusterSpecService, useValue: clusterSpecServiceMock},
        {provide: NodeDataService, useValue: nodeDataServiceMock},
        {provide: DatacenterService, useValue: datacenterServiceMock},
        {provide: ApplicationService, useValue: applicationServiceMock},
      ],
      schemas: [NO_ERRORS_SCHEMA],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    clusterSpecService = TestBed.inject(ClusterSpecService);
    nodeDataService = TestBed.inject(NodeDataService);
    datacenterService = TestBed.inject(DatacenterService);
    applicationService = TestBed.inject(ApplicationService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryStepComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('cluster getter', () => {
    it('should return the cluster from ClusterSpecService', () => {
      expect(component.cluster).toBe(mockCluster);
    });
  });

  describe('clusterTemplateEditMode getter', () => {
    it('should return the value from ClusterSpecService', () => {
      expect(component.clusterTemplateEditMode).toBe(false);
    });

    it('should reflect a truthy value from ClusterSpecService', () => {
      clusterSpecService.clusterTemplateEditMode = true;
      expect(component.clusterTemplateEditMode).toBe(true);
    });
  });

  describe('machineDeployment getter', () => {
    it('should map name from nodeData', () => {
      const md = component.machineDeployment;
      expect(md.name).toBe('initial-nodes');
    });

    it('should map annotations from nodeData', () => {
      nodeDataService.nodeData.annotations = {foo: 'bar'};
      const md = component.machineDeployment;
      expect(md.annotations).toEqual({foo: 'bar'});
    });

    it('should map labels from nodeData', () => {
      nodeDataService.nodeData.labels = {env: 'test'};
      const md = component.machineDeployment;
      expect(md.labels).toEqual({env: 'test'});
    });

    it('should set spec.replicas from count', () => {
      const md = component.machineDeployment;
      expect(md.spec.replicas).toBe(3);
    });

    it('should set spec.dynamicConfig from nodeData', () => {
      const md = component.machineDeployment;
      expect(md.spec.dynamicConfig).toBe(false);
    });

    it('should set spec.minReplicas from nodeData', () => {
      const md = component.machineDeployment;
      expect(md.spec.minReplicas).toBe(1);
    });

    it('should set spec.maxReplicas from nodeData', () => {
      const md = component.machineDeployment;
      expect(md.spec.maxReplicas).toBe(5);
    });

    it('should add operatingSystemProfile annotation when present', () => {
      nodeDataService.nodeData.operatingSystemProfile = 'ubuntu';
      nodeDataService.nodeData.annotations = {existing: 'value'};
      const md = component.machineDeployment;
      expect(md.annotations[OPERATING_SYSTEM_PROFILE_ANNOTATION]).toBe('ubuntu');
      expect(md.annotations['existing']).toBe('value');
    });

    it('should not add operatingSystemProfile annotation when absent', () => {
      nodeDataService.nodeData.operatingSystemProfile = null;
      const md = component.machineDeployment;
      expect(md.annotations[OPERATING_SYSTEM_PROFILE_ANNOTATION]).toBeUndefined();
    });
  });

  describe('sshKeys getter', () => {
    it('should map SSHKey objects to their names', () => {
      const sshKeyChanges$ = new Subject<any[]>();
      clusterSpecService.sshKeyChanges = sshKeyChanges$;

      fixture.detectChanges();
      sshKeyChanges$.next([{name: 'key-1'}, {name: 'key-2'}]);

      expect(component.sshKeys).toEqual(['key-1', 'key-2']);
    });

    it('should return empty array when no SSH keys', () => {
      fixture.detectChanges();
      expect(component.sshKeys).toEqual([]);
    });
  });

  describe('applications getter', () => {
    it('should return user applications', () => {
      fixture.detectChanges();
      expect(component.applications).toEqual(mockApplications);
    });

    it('should filter out system applications with managed-by label', () => {
      applicationService.applications = [
        ...mockApplications,
        {
          name: 'system-app',
          labels: {[ApplicationLabel.ManagedBy]: ApplicationLabelValue.KKP},
          spec: {namespace: {name: 'kube-system'}},
        } as unknown as Application,
      ];

      const apps = component.applications;
      expect(apps.length).toBe(2);
      expect(apps.find(a => a.name === 'system-app')).toBeUndefined();
    });

    it('should keep applications without managed-by label', () => {
      applicationService.applications = [
        {
          name: 'user-app',
          labels: {someOtherLabel: 'value'},
          spec: {namespace: {name: 'default'}},
        } as unknown as Application,
      ];

      const apps = component.applications;
      expect(apps.length).toBe(1);
      expect(apps[0].name).toBe('user-app');
    });
  });

  describe('Datacenter loading', () => {
    it('should call getDatacenter on datacenterChanges emission', () => {
      fixture.detectChanges();
      expect(datacenterService.getDatacenter).toHaveBeenCalledWith('us-west-1');
    });

    it('should store the loaded datacenter', done => {
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(component.datacenter).toEqual(mockDatacenter);
        done();
      });
    });

    it('should call seedSettings with the seed from the loaded datacenter', () => {
      fixture.detectChanges();
      expect(datacenterService.seedSettings).toHaveBeenCalledWith('us-west-1-seed');
    });

    it('should store the loaded seed settings', done => {
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(component.seedSettings).toEqual(mockSeedSettings);
        done();
      });
    });
  });

  describe('Cleanup', () => {
    it('should call next and complete on _unsubscribe when destroyed', () => {
      fixture.detectChanges();
      const nextSpy = jest.spyOn(component['_unsubscribe'], 'next');
      const completeSpy = jest.spyOn(component['_unsubscribe'], 'complete');

      fixture.destroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
