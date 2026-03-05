// Copyright 2025 The Kubermatic Kubernetes Platform contributors.
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
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {ClusterService} from '@core/services/cluster';
import {ExternalClusterService} from '@core/services/external-cluster';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {ExternalClusterState} from '@shared/entity/external-cluster';
import {fakeCustomExternalCluster} from '@test/data/external-cluster';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {asyncData} from '@test/services/cluster-mock';
import {ExternalClusterMockService} from '@test/services/external-cluster-mock';
import {ActivatedRouteStub} from '@test/services/router-stubs';
import {UserMockService} from '@test/services/user-mock';
import {KubeOneClusterDetailsComponent} from './component';

class RouterStub {
  navigate = jest.fn();
}

function makeClusterServiceMock() {
  return {
    externalCluster: jest.fn().mockReturnValue(asyncData(fakeCustomExternalCluster())),
    externalClusterUpgrades: jest.fn().mockReturnValue(asyncData([])),
    externalClusterNodes: jest.fn().mockReturnValue(asyncData([])),
    externalMachineDeployments: jest.fn().mockReturnValue(asyncData([])),
    externalClusterEvents: jest.fn().mockReturnValue(asyncData([])),
    externalClusterMetrics: jest.fn().mockReturnValue(asyncData(null)),
    externalClusterNodesMetrics: jest.fn().mockReturnValue(asyncData([])),
    getExternalKubeconfigURL: jest.fn().mockReturnValue('https://example.com/kubeconfig'),
  };
}

describe('KubeOneClusterDetailsComponent', () => {
  let fixture: ComponentFixture<KubeOneClusterDetailsComponent>;
  let component: KubeOneClusterDetailsComponent;
  let activatedRoute: ActivatedRouteStub;
  let router: RouterStub;
  let clusterServiceMock: ReturnType<typeof makeClusterServiceMock>;
  let externalClusterServiceMock: ExternalClusterMockService;

  beforeEach(waitForAsync(() => {
    clusterServiceMock = makeClusterServiceMock();
    router = new RouterStub();

    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, SharedModule],
      declarations: [KubeOneClusterDetailsComponent],
      providers: [
        {provide: ClusterService, useValue: clusterServiceMock},
        {provide: ExternalClusterService, useClass: ExternalClusterMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: Router, useValue: router},
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeOneClusterDetailsComponent);
    component = fixture.componentInstance;
    externalClusterServiceMock = TestBed.inject(ExternalClusterService) as ExternalClusterMockService;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {
      projectID: 'test-project-id',
      clusterID: 'test-cluster-id',
    };
  });

  it('should create the KubeOne cluster details component', fakeAsync(() => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
    discardPeriodicTasks();
  }));

  it('should set projectID from route params on init', fakeAsync(() => {
    fixture.detectChanges();
    expect(component.projectID).toBe('test-project-id');
    discardPeriodicTasks();
  }));

  it('should call clusterService.externalCluster on init', fakeAsync(() => {
    fixture.detectChanges();
    tick(100);
    expect(clusterServiceMock.externalCluster).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should call clusterService.externalClusterEvents on init', fakeAsync(() => {
    fixture.detectChanges();
    tick(100);
    expect(clusterServiceMock.externalClusterEvents).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should return true for isRunning() when cluster is Running', () => {
    component.cluster = {
      ...fakeCustomExternalCluster(),
      status: {state: ExternalClusterState.Running, statusMessage: ''},
    };
    expect(component.isRunning()).toBe(true);
  });

  it('should return false for isRunning() when cluster is Warning', () => {
    component.cluster = {
      ...fakeCustomExternalCluster(),
      status: {state: ExternalClusterState.Warning, statusMessage: ''},
    };
    // KubeOne isRunning only returns true for Running state (not Warning)
    expect(component.isRunning()).toBe(false);
  });

  it('should return false for isRunning() when cluster is Provisioning', () => {
    component.cluster = {
      ...fakeCustomExternalCluster(),
      status: {state: ExternalClusterState.Provisioning, statusMessage: ''},
    };
    expect(component.isRunning()).toBe(false);
  });

  it('should return false for isRunning() when cluster is Deleting', () => {
    component.cluster = {
      ...fakeCustomExternalCluster(),
      status: {state: ExternalClusterState.Deleting, statusMessage: ''},
    };
    expect(component.isRunning()).toBe(false);
  });

  it('should return false for enableDownloadKubeconfigButton() when cluster has no state', () => {
    component.cluster = {
      ...fakeCustomExternalCluster(),
      status: null,
    };
    expect(component.enableDownloadKubeconfigButton()).toBe(false);
  });

  it('should return false for enableDownloadKubeconfigButton() when cluster is Deleting', () => {
    component.cluster = {
      ...fakeCustomExternalCluster(),
      status: {state: ExternalClusterState.Deleting, statusMessage: ''},
    };
    expect(component.enableDownloadKubeconfigButton()).toBe(false);
  });

  it('should return false for enableDownloadKubeconfigButton() when cluster is Error', () => {
    component.cluster = {
      ...fakeCustomExternalCluster(),
      status: {state: ExternalClusterState.Error, statusMessage: ''},
    };
    expect(component.enableDownloadKubeconfigButton()).toBe(false);
  });

  it('should return false for enableDownloadKubeconfigButton() when cluster is Provisioning', () => {
    component.cluster = {
      ...fakeCustomExternalCluster(),
      status: {state: ExternalClusterState.Provisioning, statusMessage: ''},
    };
    expect(component.enableDownloadKubeconfigButton()).toBe(false);
  });

  it('should return false for enableDownloadKubeconfigButton() when cluster is Unknown', () => {
    component.cluster = {
      ...fakeCustomExternalCluster(),
      status: {state: ExternalClusterState.Unknown, statusMessage: ''},
    };
    expect(component.enableDownloadKubeconfigButton()).toBe(false);
  });

  it('should return true for enableDownloadKubeconfigButton() when cluster is Running', () => {
    component.cluster = {
      ...fakeCustomExternalCluster(),
      status: {state: ExternalClusterState.Running, statusMessage: ''},
    };
    expect(component.enableDownloadKubeconfigButton()).toBe(true);
  });

  it('should return true for hasUpgrades() when cluster is running', () => {
    component.cluster = {
      ...fakeCustomExternalCluster(),
      status: {state: ExternalClusterState.Running, statusMessage: ''},
    };
    expect(component.hasUpgrades()).toBe(true);
  });

  it('should return false for hasUpgrades() when cluster is not running', () => {
    component.cluster = {
      ...fakeCustomExternalCluster(),
      status: {state: ExternalClusterState.Provisioning, statusMessage: ''},
    };
    expect(component.hasUpgrades()).toBe(false);
  });

  it('should return a status string from getStatus()', fakeAsync(() => {
    fixture.detectChanges();
    tick(100);
    const status = component.getStatus();
    expect(typeof status).toBe('string');
    discardPeriodicTasks();
  }));

  it('should call router.navigate on goBack()', () => {
    component.projectID = 'test-project-id';
    component.goBack();
    expect(router.navigate).toHaveBeenCalled();
  });

  it('should call externalClusterService.showDisconnectClusterDialog on disconnectCluster()', fakeAsync(() => {
    fixture.detectChanges();
    tick(100);
    component.disconnectCluster();
    expect(externalClusterServiceMock.disconnectDialogCallCount).toBe(1);
    discardPeriodicTasks();
  }));

  it('should clean up subscriptions on destroy', fakeAsync(() => {
    fixture.detectChanges();
    tick(100);
    const nextSpy = jest.spyOn((component as any)._unsubscribe, 'next');
    const completeSpy = jest.spyOn((component as any)._unsubscribe, 'complete');
    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should initialize with empty machineDeployments', () => {
    expect(component.machineDeployments).toEqual([]);
  });

  it('should initialize with empty nodes', () => {
    expect(component.nodes).toEqual([]);
  });

  it('should initialize with empty events', () => {
    expect(component.events).toEqual([]);
  });

  it('should initialize with empty upgrades', () => {
    expect(component.upgrades).toEqual([]);
  });

  it('should initialize areNodesInitialized as false', () => {
    expect(component.areNodesInitialized).toBe(false);
  });

  it('should initialize areMachineDeploymentsInitialized as false', () => {
    expect(component.areMachineDeploymentsInitialized).toBe(false);
  });
});
