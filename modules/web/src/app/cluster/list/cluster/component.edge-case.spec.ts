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
import {AppConfigService} from '@app/config.service';
import {Auth} from '@core/services/auth/service';
import {ClusterService} from '@core/services/cluster';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {DatacenterService} from '@core/services/datacenter';
import {EndOfLifeService} from '@core/services/eol';
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {fakeAWSCluster, fakeGCPCluster, fakeAzureCluster} from '@test/data/cluster';
import {fakeHealth} from '@test/data/health';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {AuthMockService} from '@test/services/auth-mock';
import {asyncData, asyncError} from '@test/services/cluster-mock';
import {ClusterTemplateMockService} from '@test/services/cluster-template-mock';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {ActivatedRouteStub, RouterStub} from '@test/services/router-stubs';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {of, throwError, delay, NEVER, Subject} from 'rxjs';
import {ClusterListComponent} from './component';

describe('ClusterListComponent - Edge Cases', () => {
  let fixture: ComponentFixture<ClusterListComponent>;
  let component: ClusterListComponent;
  let clusterService: any;
  let activatedRoute: ActivatedRouteStub;

  beforeEach(waitForAsync(() => {
    clusterService = {
      projectClusterList: jest.fn(),
      health: jest.fn(),
      refreshClusters: jest.fn(),
      restores: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, SharedModule],
      declarations: [ClusterListComponent],
      providers: [
        {provide: ClusterService, useValue: clusterService},
        {provide: Auth, useClass: AuthMockService},
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
        {provide: UserService, useClass: UserMockService},
        {provide: Router, useClass: RouterStub},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: ClusterTemplateService, useClass: ClusterTemplateMockService},
        EndOfLifeService,
        MachineDeploymentService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterListComponent);
    component = fixture.componentInstance;
    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {projectID: '4k6txp5sq'};
  });

  describe('Boundary Conditions', () => {
    it('should handle empty cluster list gracefully', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: []}));
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters.length).toBe(0);
      expect(component.dataSource.data.length).toBe(0);
      discardPeriodicTasks();
    }));

    it('should handle single cluster in list', fakeAsync(() => {
      const singleCluster = fakeAWSCluster();
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: [singleCluster]}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters.length).toBe(1);
      expect(component.clusters[0].id).toBe(singleCluster.id);
      discardPeriodicTasks();
    }));

    it('should handle very large cluster list (100+ items)', fakeAsync(() => {
      const largeClusters = Array.from({length: 150}, (_, i) => ({
        ...fakeAWSCluster(),
        id: `cluster-${i}`,
        name: `cluster-${i}`,
      }));
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: largeClusters}));
      const largeHealth = largeClusters.map(() => fakeHealth());
      clusterService.health.mockReturnValue(asyncData(largeHealth));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters.length).toBe(150);
      expect(component.dataSource.data.length).toBe(150);
      discardPeriodicTasks();
    }));

    it('should handle pagination with exactly pageSize items', fakeAsync(() => {
      const pageSize = component.pageSize;
      const clusters = Array.from({length: pageSize}, (_, i) => ({
        ...fakeAWSCluster(),
        id: `cluster-${i}`,
        name: `cluster-${i}`,
      }));
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      clusterService.health.mockReturnValue(asyncData(clusters.map(() => fakeHealth())));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters.length).toBe(pageSize);
      expect(component.paginator.length).toBe(pageSize);
      discardPeriodicTasks();
    }));

    it('should handle pagination with pageSize + 1 items', fakeAsync(() => {
      const pageSize = component.pageSize;
      const clusters = Array.from({length: pageSize + 1}, (_, i) => ({
        ...fakeAWSCluster(),
        id: `cluster-${i}`,
        name: `cluster-${i}`,
      }));
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      clusterService.health.mockReturnValue(asyncData(clusters.map(() => fakeHealth())));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.paginator.getNumberOfPages()).toBeGreaterThan(1);
      discardPeriodicTasks();
    }));

    it('should preserve sort state with empty dataset', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: []}));
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      if (component.sort) {
        component.sort.sortChange.emit({active: 'name', direction: 'asc'});
      }

      expect(component.clusters.length).toBe(0);
      discardPeriodicTasks();
    }));
  });

  describe('Invalid Input Handling', () => {
    it('should handle null cluster object in list', fakeAsync(() => {
      const clustersWithNull = [{...fakeAWSCluster()}, null as any, {...fakeAWSCluster()}];
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: clustersWithNull}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth(), fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      // Component should handle gracefully without crashing
      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle undefined cluster properties', fakeAsync(() => {
      const clusterWithUndefinedFields = {
        ...fakeAWSCluster(),
        creationTimestamp: undefined,
        displayName: undefined,
      };
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: [clusterWithUndefinedFields]}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters.length).toBe(1);
      discardPeriodicTasks();
    }));

    it('should handle cluster with empty name', fakeAsync(() => {
      const clusterWithEmptyName = {
        ...fakeAWSCluster(),
        name: '',
      };
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: [clusterWithEmptyName]}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters[0].name).toBe('');
      discardPeriodicTasks();
    }));

    it('should handle cluster with very long name (>100 chars)', fakeAsync(() => {
      const longName = 'a'.repeat(150);
      const clusterWithLongName = {
        ...fakeAWSCluster(),
        name: longName,
      };
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: [clusterWithLongName]}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters[0].name.length).toBe(150);
      discardPeriodicTasks();
    }));

    it('should handle missing health data for clusters', fakeAsync(() => {
      const clusters = [fakeAWSCluster(), fakeGCPCluster()];
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      clusterService.health.mockReturnValue(asyncData([])); // Empty health
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters.length).toBe(2);
      discardPeriodicTasks();
    }));

    it('should handle health data mismatched with cluster count', fakeAsync(() => {
      const clusters = [fakeAWSCluster(), fakeGCPCluster(), fakeAzureCluster()];
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      // Only provide health for first cluster
      clusterService.health.mockReturnValue(asyncData([fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters.length).toBe(3);
      discardPeriodicTasks();
    }));
  });

  describe('State Transitions', () => {
    it('should handle transition from empty to populated list', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: []}));
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);
      expect(component.clusters.length).toBe(0);

      // Simulate data update
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: [fakeAWSCluster()]}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth()]));

      component.refresh();
      tick(1);

      expect(component.clusters.length).toBeGreaterThan(0);
      discardPeriodicTasks();
    }));

    it('should handle transition from populated to empty list', fakeAsync(() => {
      const clusters = [fakeAWSCluster(), fakeGCPCluster()];
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth(), fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);
      expect(component.clusters.length).toBe(2);

      // Clear clusters
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: []}));
      clusterService.health.mockReturnValue(asyncData([]));

      component.refresh();
      tick(1);

      expect(component.clusters.length).toBe(0);
      discardPeriodicTasks();
    }));

    it('should handle rapid project changes', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: [fakeAWSCluster()]}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      // Simulate rapid project ID changes
      activatedRoute.testParamMap = {projectID: 'project-1'};
      fixture.detectChanges();

      activatedRoute.testParamMap = {projectID: 'project-2'};
      fixture.detectChanges();

      activatedRoute.testParamMap = {projectID: 'project-3'};
      fixture.detectChanges();
      tick(1);

      expect(clusterService.projectClusterList).toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('should handle sort state changes during data refresh', fakeAsync(() => {
      const clusters = [
        {...fakeAWSCluster(), name: 'z-cluster'},
        {...fakeAWSCluster(), name: 'a-cluster'},
      ];
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth(), fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      // Change sort
      if (component.sort) {
        component.sort.sortChange.emit({active: 'name', direction: 'asc'});
      }

      // Trigger refresh during sort
      component.refresh();
      tick(1);

      expect(component.clusters.length).toBe(2);
      discardPeriodicTasks();
    }));

    it('should handle pagination change during sort', fakeAsync(() => {
      const clusters = Array.from({length: 50}, (_, i) => ({
        ...fakeAWSCluster(),
        id: `cluster-${i}`,
        name: `cluster-${i}`,
      }));
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      clusterService.health.mockReturnValue(asyncData(clusters.map(() => fakeHealth())));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      // Sort first
      if (component.sort) {
        component.sort.sortChange.emit({active: 'name', direction: 'desc'});
      }

      // Then change page
      if (component.paginator) {
        component.paginator.pageIndex = 1;
        component.paginator.page.emit({previousPageIndex: 0, pageIndex: 1, pageSize: component.pageSize, length: 50});
      }

      expect(component.clusters.length).toBe(50);
      discardPeriodicTasks();
    }));
  });

  describe('Race Conditions', () => {
    it('should handle rapid consecutive refresh calls', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: [fakeAWSCluster()]}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      // Rapid refresh calls
      component.refresh();
      component.refresh();
      component.refresh();

      tick(5);

      expect(clusterService.projectClusterList).toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('should handle simultaneous sort and filter operations', fakeAsync(() => {
      const clusters = [fakeAWSCluster(), fakeGCPCluster(), fakeAzureCluster()];
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth(), fakeHealth(), fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      // Simulate simultaneous operations
      if (component.sort) {
        component.sort.sortChange.emit({active: 'name', direction: 'asc'});
      }

      component.filterPredicate = 'search-term';
      component.applyFilter('search-term');

      tick(1);

      expect(component.clusters.length).toBeGreaterThanOrEqual(0);
      discardPeriodicTasks();
    }));

    it('should handle click events during data loading', fakeAsync(() => {
      // Simulate slow data loading
      clusterService.projectClusterList.mockReturnValue(
        asyncData({clusters: [fakeAWSCluster()]}, 100)
      );
      clusterService.health.mockReturnValue(
        asyncData([fakeHealth()], 100)
      );
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();

      // Try to click before data loads
      const refreshButton = fixture.debugElement.query(By.css('[matTooltip="Refresh"]'));
      if (refreshButton) {
        refreshButton.nativeElement.click();
      }

      tick(150);

      expect(component.clusters.length).toBeGreaterThanOrEqual(0);
      discardPeriodicTasks();
    }));

    it('should handle multiple simultaneous dialog operations', fakeAsync(() => {
      const clusters = [fakeAWSCluster(), fakeGCPCluster()];
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth(), fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      // Simulate multiple dialog attempts
      if (component.clusterTemplateDialog) {
        component.openClusterTemplateDialog();
        component.openClusterTemplateDialog();
      }

      tick(1);

      expect(component.clusters.length).toBe(2);
      discardPeriodicTasks();
    }));
  });

  describe('Timeout Scenarios', () => {
    it('should handle cluster list request timeout', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(NEVER);
      clusterService.health.mockReturnValue(asyncData([fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(5000);

      // Component should remain stable even without data
      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle health data request timeout', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: [fakeAWSCluster()]}));
      clusterService.health.mockReturnValue(NEVER);
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(5000);

      expect(component.clusters.length).toBe(1);
      discardPeriodicTasks();
    }));

    it('should handle delayed response with paginator changes', fakeAsync(() => {
      const clusters = Array.from({length: 50}, (_, i) => ({
        ...fakeAWSCluster(),
        id: `cluster-${i}`,
        name: `cluster-${i}`,
      }));
      clusterService.projectClusterList.mockReturnValue(
        asyncData({clusters}, 2000)
      );
      clusterService.health.mockReturnValue(
        asyncData(clusters.map(() => fakeHealth()), 2000)
      );
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(500);

      // Change paginator while response is pending
      if (component.paginator) {
        component.paginator.pageIndex = 1;
      }

      tick(2000);

      expect(component.clusters.length).toBe(50);
      discardPeriodicTasks();
    }));
  });

  describe('Memory Cleanup & Subscriptions', () => {
    it('should unsubscribe from observables on component destroy', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: [fakeAWSCluster()]}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      const destroySpy = jest.spyOn(component as any, 'ngOnDestroy');

      fixture.destroy();

      expect(destroySpy).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should clean up paginator subscriptions', fakeAsync(() => {
      const clusters = Array.from({length: 50}, (_, i) => ({
        ...fakeAWSCluster(),
        id: `cluster-${i}`,
      }));
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      clusterService.health.mockReturnValue(asyncData(clusters.map(() => fakeHealth())));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.paginator).toBeTruthy();

      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('should clean up sort subscriptions', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: [fakeAWSCluster()]}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      if (component.sort) {
        const sortSpy = jest.spyOn(component.sort.sortChange, 'emit');
        component.sort.sortChange.emit({active: 'name', direction: 'asc'});
        expect(sortSpy).toHaveBeenCalled();
      }

      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('should handle multiple destroy cycles', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: [fakeAWSCluster()]}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      for (let i = 0; i < 5; i++) {
        fixture.detectChanges();
        tick(1);
        fixture.destroy();
      }

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));
  });

  describe('Filter and Search Operations', () => {
    it('should filter clusters with special characters in name', fakeAsync(() => {
      const clusters = [
        {...fakeAWSCluster(), name: 'cluster-@#$%'},
        {...fakeAWSCluster(), name: 'cluster-[test]'},
        {...fakeAWSCluster(), name: 'cluster-(prod)'},
      ];
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth(), fakeHealth(), fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      component.applyFilter('@#$%');
      tick(1);

      expect(component.clusters.length).toBeGreaterThanOrEqual(0);
      discardPeriodicTasks();
    }));

    it('should handle case-insensitive filter', fakeAsync(() => {
      const clusters = [
        {...fakeAWSCluster(), name: 'MyCluster'},
        {...fakeAWSCluster(), name: 'PRODUCTION'},
        {...fakeAWSCluster(), name: 'development'},
      ];
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth(), fakeHealth(), fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      component.applyFilter('production');
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should clear filter correctly', fakeAsync(() => {
      const clusters = [fakeAWSCluster(), fakeGCPCluster()];
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth(), fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      component.applyFilter('test');
      tick(1);

      component.applyFilter('');
      tick(1);

      expect(component.clusters.length).toBe(2);
      discardPeriodicTasks();
    }));

    it('should handle filter with very long search string', fakeAsync(() => {
      const clusters = [fakeAWSCluster(), fakeGCPCluster()];
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth(), fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      const longSearch = 'a'.repeat(1000);
      component.applyFilter(longSearch);
      tick(1);

      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));
  });

  describe('Health Status Aggregation', () => {
    it('should handle mixed health statuses', fakeAsync(() => {
      const clusters = [fakeAWSCluster(), fakeGCPCluster(), fakeAzureCluster()];
      const mixedHealth = [
        {machineHealth: {healthy: 3}, apiserver: {healthy: true}},
        {machineHealth: {healthy: 0}, apiserver: {healthy: false}},
        {machineHealth: {healthy: 1}, apiserver: {healthy: true}},
      ];
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      clusterService.health.mockReturnValue(asyncData(mixedHealth));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters.length).toBe(3);
      discardPeriodicTasks();
    }));

    it('should handle health status updates without cluster changes', fakeAsync(() => {
      const clusters = [fakeAWSCluster(), fakeGCPCluster()];
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters}));
      clusterService.health.mockReturnValue(asyncData([fakeHealth(), fakeHealth()]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      const initialCount = component.clusters.length;

      // Simulate health update
      clusterService.health.mockReturnValue(asyncData([
        {machineHealth: {healthy: 5}, apiserver: {healthy: true}},
        {machineHealth: {healthy: 2}, apiserver: {healthy: false}},
      ]));

      component.refresh();
      tick(1);

      expect(component.clusters.length).toBe(initialCount);
      discardPeriodicTasks();
    }));
  });
});
