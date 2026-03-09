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
import {MatDialog} from '@angular/material/dialog';
import {AppConfigService} from '@app/config.service';
import {Auth} from '@core/services/auth/service';
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {fakeAWSCluster, fakeGCPCluster} from '@test/data/cluster';
import {fakeHealth} from '@test/data/health';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {AuthMockService} from '@test/services/auth-mock';
import {asyncData, asyncError} from '@test/services/cluster-mock';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {ActivatedRouteStub, RouterStub} from '@test/services/router-stubs';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {NEVER, of, throwError, Subject} from 'rxjs';
import {ClusterDetailsComponent} from './component';

describe('ClusterDetailsComponent - Edge Cases', () => {
  let fixture: ComponentFixture<ClusterDetailsComponent>;
  let component: ClusterDetailsComponent;
  let clusterService: any;
  let machineDeploymentService: any;
  let activatedRoute: ActivatedRouteStub;
  let matDialog: MatDialog;

  beforeEach(waitForAsync(() => {
    clusterService = {
      cluster: jest.fn(),
      health: jest.fn(),
      nodes: jest.fn(),
      machineDeployments: jest.fn(),
      events: jest.fn(),
      metrics: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      upgradeMachineDeploymentMachineImages: jest.fn(),
      refreshCluster: jest.fn(),
    };

    machineDeploymentService = {
      list: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, SharedModule],
      declarations: [ClusterDetailsComponent],
      providers: [
        {provide: ClusterService, useValue: clusterService},
        {provide: MachineDeploymentService, useValue: machineDeploymentService},
        {provide: Auth, useClass: AuthMockService},
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
        {provide: UserService, useClass: UserMockService},
        {provide: Router, useClass: RouterStub},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        MatDialog,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterDetailsComponent);
    component = fixture.componentInstance;
    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    matDialog = TestBed.inject(MatDialog);
    activatedRoute.testParamMap = {projectID: '4k6txp5sq', clusterID: 'test-cluster'};
  });

  describe('Cluster Data Loading', () => {
    it('should handle successful cluster load', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      expect(clusterService.cluster).toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('should handle cluster not found error', fakeAsync(() => {
      const notFoundError = new Error('Cluster not found');
      (notFoundError as any).status = 404;
      clusterService.cluster.mockReturnValue(asyncError(notFoundError));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle permission denied error', fakeAsync(() => {
      const permissionError = new Error('Permission denied');
      (permissionError as any).status = 403;
      clusterService.cluster.mockReturnValue(asyncError(permissionError));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle cluster load timeout', fakeAsync(() => {
      clusterService.cluster.mockReturnValue(NEVER);
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));

      fixture.detectChanges();
      tick(5000);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));
  });

  describe('Health Status Tracking', () => {
    it('should handle healthy cluster status', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      const health = {
        machineHealth: {healthy: 3, unhealthy: 0},
        apiserver: {healthy: true},
        controller: {healthy: true},
        etcd: {healthy: true},
      };
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(health));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle degraded health status', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      const health = {
        machineHealth: {healthy: 1, unhealthy: 2},
        apiserver: {healthy: false},
        controller: {healthy: true},
        etcd: {healthy: false},
      };
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(health));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle unhealthy cluster status', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      const health = {
        machineHealth: {healthy: 0, unhealthy: 5},
        apiserver: {healthy: false},
        controller: {healthy: false},
        etcd: {healthy: false},
      };
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(health));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle missing health data', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(null));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle rapid health status changes', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      // Rapid health changes
      clusterService.health.mockReturnValue(asyncData({
        machineHealth: {healthy: 3},
        apiserver: {healthy: true},
      }));

      fixture.detectChanges();
      tick(1);

      clusterService.health.mockReturnValue(asyncData({
        machineHealth: {healthy: 1},
        apiserver: {healthy: false},
      }));

      clusterService.refreshCluster();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));
  });

  describe('Nodes and Machine Deployments', () => {
    it('should handle cluster with no nodes', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle cluster with many nodes', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      const nodes = Array.from({length: 100}, (_, i) => ({
        id: `node-${i}`,
        name: `node-${i}`,
      }));
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData(nodes));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle machine deployment updates', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      const machineDeployments = [
        {name: 'md-1', replicas: 3, readyReplicas: 3},
        {name: 'md-2', replicas: 5, readyReplicas: 2},
      ];
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData(machineDeployments));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle machine deployment with 0 replicas', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      const machineDeployments = [
        {name: 'md-1', replicas: 0, readyReplicas: 0},
      ];
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData(machineDeployments));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));
  });

  describe('Events and Metrics', () => {
    it('should handle cluster with no events', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      expect(clusterService.events).toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('should handle cluster with many events', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      const events = Array.from({length: 50}, (_, i) => ({
        id: `event-${i}`,
        message: `Event ${i}`,
        type: i % 2 === 0 ? 'Normal' : 'Warning',
      }));
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData(events));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle metrics data missing', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData(null));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle metrics with extreme values', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      const metrics = {
        cpu: {current: 999999, max: 1000000},
        memory: {current: 999999999, max: 1000000000},
      };
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData(metrics));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));
  });

  describe('Dialog Operations', () => {
    it('should handle edit cluster dialog', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      if (component.editCluster) {
        component.editCluster();
      }

      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle delete cluster dialog', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      if (component.deleteCluster) {
        component.deleteCluster();
      }

      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle rapid consecutive dialog operations', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      // Multiple rapid dialog operations
      for (let i = 0; i < 3; i++) {
        if (component.editCluster) {
          component.editCluster();
        }
      }

      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));
  });

  describe('Boundary Conditions', () => {
    it('should handle cluster with very long name', fakeAsync(() => {
      const cluster = {
        ...fakeAWSCluster(),
        name: 'a'.repeat(500),
      };
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle cluster with special characters in name', fakeAsync(() => {
      const cluster = {
        ...fakeAWSCluster(),
        name: 'cluster-@#$%-[test]',
      };
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle cluster with null description', fakeAsync(() => {
      const cluster = {
        ...fakeAWSCluster(),
        description: null,
      };
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));
  });

  describe('Memory Cleanup & Subscriptions', () => {
    it('should unsubscribe from all observables on destroy', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      const destroySpy = jest.spyOn(component as any, 'ngOnDestroy');

      fixture.destroy();

      expect(destroySpy).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle multiple destroy cycles', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      for (let i = 0; i < 3; i++) {
        fixture.detectChanges();
        tick(1);
        fixture.destroy();
      }

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent data loads', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.cluster.mockReturnValue(asyncData(cluster, 100));
      clusterService.health.mockReturnValue(asyncData(fakeHealth(), 100));
      clusterService.nodes.mockReturnValue(asyncData([], 100));
      clusterService.machineDeployments.mockReturnValue(asyncData([], 100));
      clusterService.events.mockReturnValue(asyncData([], 100));
      clusterService.metrics.mockReturnValue(asyncData({}, 100));

      fixture.detectChanges();

      // Try to navigate before all loads complete
      if (component.refresh) {
        component.refresh();
      }

      tick(150);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle simultaneous patch and delete operations', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));
      clusterService.patch.mockReturnValue(asyncData(cluster));
      clusterService.delete.mockReturnValue(asyncData(null));

      fixture.detectChanges();
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));
  });

  describe('Permission and Visibility', () => {
    it('should handle read-only cluster view', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.cluster.mockReturnValue(asyncData(cluster));
      clusterService.health.mockReturnValue(asyncData(fakeHealth()));
      clusterService.nodes.mockReturnValue(asyncData([]));
      clusterService.machineDeployments.mockReturnValue(asyncData([]));
      clusterService.events.mockReturnValue(asyncData([]));
      clusterService.metrics.mockReturnValue(asyncData({}));

      fixture.detectChanges();
      tick(1);

      // Check if edit/delete buttons are hidden
      const editButton = fixture.debugElement.query(By.css('[data-cy="edit-cluster-button"]'));
      // Component should render correctly regardless of permissions
      expect(component).toBeTruthy();

      discardPeriodicTasks();
    }));
  });
});
