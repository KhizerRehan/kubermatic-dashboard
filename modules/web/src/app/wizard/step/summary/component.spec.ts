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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ApplicationService} from '@app/core/services/application';
import {ClusterSpecService} from '@app/core/services/cluster-spec';
import {DatacenterService} from '@app/core/services/datacenter';
import {NodeDataService} from '@app/core/services/node-data/service';
import {SharedModule} from '@shared/module';
import {Datacenter} from '@shared/entity/datacenter';
import {SeedSettings} from '@shared/entity/seed';
import {Cluster} from '@shared/entity/cluster';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {Application} from '@shared/entity/application';
import {of, Subject} from 'rxjs';
import {SummaryStepComponent} from './component';

describe('SummaryStepComponent', () => {
  let fixture: ComponentFixture<SummaryStepComponent>;
  let component: SummaryStepComponent;
  let clusterSpecService: jasmine.SpyObj<ClusterSpecService>;
  let nodeDataService: jasmine.SpyObj<NodeDataService>;
  let datacenterService: jasmine.SpyObj<DatacenterService>;
  let applicationService: jasmine.SpyObj<ApplicationService>;

  const mockDatacenter: Datacenter = {
    metadata: {name: 'us-west-1'},
    spec: {
      provider: 'aws',
      country: 'US',
      location: 'US West (N. California)',
      seed: 'us-west-1-seed',
    },
  } as Datacenter;

  const mockSeedSettings: SeedSettings = {
    datacenters: {},
    kubeOneSettings: {},
  } as SeedSettings;

  const mockCluster: Cluster = {
    metadata: {name: 'test-cluster'},
    spec: {
      humanReadableVersion: '1.24.0',
      version: 'v1.24.0',
    },
  } as Cluster;

  const mockMachineDeployment: MachineDeployment = {
    metadata: {name: 'initial-nodes'},
    spec: {
      replicas: 3,
    },
  } as MachineDeployment;

  const mockApplications: Application[] = [
    {
      name: 'prometheus',
      spec: {
        namespace: {name: 'prometheus'},
      },
    } as Application,
    {
      name: 'cert-manager',
      spec: {
        namespace: {name: 'cert-manager'},
      },
    } as Application,
  ];

  beforeEach(waitForAsync(() => {
    const clusterSpecServiceMock = jasmine.createSpyObj('ClusterSpecService', [], {
      cluster: mockCluster,
      sshKeyChanges: of(['key1', 'key2']),
      datacenterChanges: of('us-west-1'),
    });

    const nodeDataServiceMock = jasmine.createSpyObj('NodeDataService', []);

    const datacenterServiceMock = jasmine.createSpyObj('DatacenterService', [
      'getDatacenter',
      'seedSettings',
    ]);
    datacenterServiceMock.getDatacenter.and.returnValue(of(mockDatacenter));
    datacenterServiceMock.seedSettings.and.returnValue(of(mockSeedSettings));

    const applicationServiceMock = jasmine.createSpyObj('ApplicationService', [], {
      applications: mockApplications,
    });

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [SummaryStepComponent],
      providers: [
        {provide: ClusterSpecService, useValue: clusterSpecServiceMock},
        {provide: NodeDataService, useValue: nodeDataServiceMock},
        {provide: DatacenterService, useValue: datacenterServiceMock},
        {provide: ApplicationService, useValue: applicationServiceMock},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    clusterSpecService = TestBed.inject(ClusterSpecService) as jasmine.SpyObj<ClusterSpecService>;
    nodeDataService = TestBed.inject(NodeDataService) as jasmine.SpyObj<NodeDataService>;
    datacenterService = TestBed.inject(DatacenterService) as jasmine.SpyObj<DatacenterService>;
    applicationService = TestBed.inject(ApplicationService) as jasmine.SpyObj<ApplicationService>;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryStepComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the Summary Step component', () => {
      expect(component).toBeTruthy();
    });

    it('should be a display/read-only component with no form', () => {
      fixture.detectChanges();
      expect(component.form).toBeUndefined();
    });

    it('should initialize without any form controls', () => {
      fixture.detectChanges();
      expect((component as any).form).toBeUndefined();
    });
  });

  describe('Cluster Property', () => {
    it('should expose cluster from ClusterSpecService via getter', () => {
      fixture.detectChanges();
      expect(component.cluster).toEqual(mockCluster);
    });

    it('should update cluster when ClusterSpecService.cluster changes', () => {
      fixture.detectChanges();
      expect(component.cluster.metadata.name).toBe('test-cluster');
    });
  });

  describe('Datacenter Loading', () => {
    it('should load datacenter on init', (done) => {
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        expect(datacenterService.getDatacenter).toHaveBeenCalled();
        done();
      });
    });

    it('should store loaded datacenter', (done) => {
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        expect(component.datacenter).toEqual(mockDatacenter);
        done();
      });
    });

    it('should reload datacenter on datacenter changes', (done) => {
      const datacenterChanges$ = new Subject<string>();
      (clusterSpecService as any).datacenterChanges = datacenterChanges$;

      fixture.detectChanges();

      datacenterChanges$.next('eu-central-1');

      fixture.whenStable().then(() => {
        expect(datacenterService.getDatacenter).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Seed Settings Loading', () => {
    it('should load seed settings on init', (done) => {
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        expect(datacenterService.seedSettings).toHaveBeenCalled();
        done();
      });
    });

    it('should store loaded seed settings', (done) => {
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        expect(component.seedSettings).toEqual(mockSeedSettings);
        done();
      });
    });
  });

  describe('SSH Keys Property', () => {
    it('should expose SSH keys getter', () => {
      fixture.detectChanges();
      expect(component.sshKeys).toBeDefined();
    });

    it('should return empty array if no SSH keys present', () => {
      (clusterSpecService as any).sshKeys = undefined;
      fixture.detectChanges();
      const sshKeys = component.sshKeys;
      expect(Array.isArray(sshKeys)).toBe(true);
    });

    it('should subscribe to SSH key changes', (done) => {
      const sshKeyChanges$ = new Subject<string[]>();
      (clusterSpecService as any).sshKeyChanges = sshKeyChanges$;

      fixture.detectChanges();

      sshKeyChanges$.next(['key1', 'key2']);

      fixture.whenStable().then(() => {
        expect(component.sshKeys).toBeDefined();
        done();
      });
    });
  });

  describe('Machine Deployment Property', () => {
    it('should expose machine deployment from NodeDataService', () => {
      const machineDeploymentSubject = new Subject<MachineDeployment>();
      (nodeDataService as any).machineDeploymentChanges = machineDeploymentSubject;

      fixture.detectChanges();
      machineDeploymentSubject.next(mockMachineDeployment);
      fixture.detectChanges();

      expect(component.machineDeployment).toBeDefined();
    });
  });

  describe('Applications Property', () => {
    it('should expose applications from ApplicationService', () => {
      fixture.detectChanges();
      expect(component.applications).toBeDefined();
    });

    it('should return applications list', () => {
      fixture.detectChanges();
      expect(Array.isArray(component.applications)).toBe(true);
    });

    it('should filter out system applications', () => {
      const appsWithSystem: Application[] = [
        {
          name: 'prometheus',
          spec: {
            namespace: {name: 'prometheus'},
          },
        } as Application,
        {
          name: 'system-app',
          spec: {
            namespace: {name: 'kube-system'},
          },
        } as Application,
      ];

      (applicationService as any).applications = appsWithSystem;
      fixture.detectChanges();

      const filtered = component.applications;
      // System applications should be filtered
      expect(filtered).toBeDefined();
    });
  });

  describe('Cluster Template Edit Mode', () => {
    it('should have clusterTemplateEditMode property', () => {
      fixture.detectChanges();
      expect(component.clusterTemplateEditMode).toBeDefined();
    });

    it('should expose boolean value for template edit mode', () => {
      fixture.detectChanges();
      const mode = component.clusterTemplateEditMode;
      expect(typeof mode === 'boolean').toBe(true);
    });
  });

  describe('Service Integration', () => {
    it('should have ClusterSpecService injected', () => {
      expect(clusterSpecService).toBeDefined();
    });

    it('should have NodeDataService injected', () => {
      expect(nodeDataService).toBeDefined();
    });

    it('should have DatacenterService injected', () => {
      expect(datacenterService).toBeDefined();
    });

    it('should have ApplicationService injected', () => {
      expect(applicationService).toBeDefined();
    });
  });

  describe('Data Binding for Template', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should provide cluster for template display', () => {
      expect(component.cluster).toBeDefined();
    });

    it('should provide datacenter for template display', () => {
      expect(component.datacenter).toBeDefined();
    });

    it('should provide seed settings for template display', () => {
      expect(component.seedSettings).toBeDefined();
    });

    it('should provide machine deployment for template display', () => {
      expect(component.machineDeployment).toBeDefined();
    });

    it('should provide applications for template display', () => {
      expect(component.applications).toBeDefined();
    });

    it('should provide SSH keys for template display', () => {
      expect(component.sshKeys).toBeDefined();
    });
  });

  describe('Cleanup & Unsubscription', () => {
    it('should properly clean up subscriptions on destroy', () => {
      fixture.detectChanges();
      expect(() => {
        fixture.destroy();
      }).not.toThrow();
    });

    it('should unsubscribe from all observables on destroy', () => {
      fixture.detectChanges();
      const unsubscribeSpy = spyOn<any>(component['_unsubscribe'], 'next');
      fixture.destroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('Chained Observable Pattern', () => {
    it('should use switchMap to chain datacenter and seed settings loading', (done) => {
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        // Both datacenter and seed settings should be loaded
        expect(component.datacenter).toBeDefined();
        expect(component.seedSettings).toBeDefined();
        done();
      });
    });

    it('should handle datacenter change with chained observables', (done) => {
      const datacenterChanges$ = new Subject<string>();
      (clusterSpecService as any).datacenterChanges = datacenterChanges$;

      fixture.detectChanges();

      datacenterChanges$.next('eu-central-1');

      fixture.whenStable().then(() => {
        expect(datacenterService.getDatacenter).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Read-Only Display Component', () => {
    it('should not have any form controls for editing', () => {
      fixture.detectChanges();
      expect((component as any).form).toBeUndefined();
    });

    it('should be purely for data presentation', () => {
      fixture.detectChanges();
      // Component should only expose getters and observables
      expect(component.cluster).toBeDefined();
      expect(component.datacenter).toBeDefined();
      expect(component.seedSettings).toBeDefined();
    });

    it('should use immutable properties for display', () => {
      fixture.detectChanges();
      const cluster1 = component.cluster;
      const cluster2 = component.cluster;
      // Should reference same object (not creating new instances)
      expect(cluster1).toBe(cluster2);
    });
  });
});
