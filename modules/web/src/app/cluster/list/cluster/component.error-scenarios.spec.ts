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
import {ComponentFixture, fakeAsync, tick, TestBed, waitForAsync} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {Auth} from '@core/services/auth/service';
import {ClusterService} from '@core/services/cluster';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {DatacenterService} from '@core/services/datacenter';
import {EndOfLifeService} from '@core/services/eol';
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {fakeAWSCluster} from '@test/data/cluster';
import {fakeHealth} from '@test/data/health';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {AuthMockService} from '@test/services/auth-mock';
import {asyncData, asyncError} from '@test/services/cluster-mock';
import {ClusterTemplateMockService} from '@test/services/cluster-template-mock';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {NotificationMockService} from '@test/services/notification-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {ActivatedRouteStub, RouterStub} from '@test/services/router-stubs';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {of, throwError} from 'rxjs';
import {ClusterListComponent} from './component';

describe('ClusterListComponent - Error Scenarios', () => {
  let fixture: ComponentFixture<ClusterListComponent>;
  let component: ClusterListComponent;
  let clusterService: any;
  let notificationService: any;
  let activatedRoute: ActivatedRouteStub;

  beforeEach(waitForAsync(() => {
    clusterService = {
      projectClusterList: jest.fn(),
      health: jest.fn(),
      refreshClusters: jest.fn(),
      restores: jest.fn(),
    };

    notificationService = {
      error: jest.fn(),
      success: jest.fn(),
      warning: jest.fn(),
      info: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, SharedModule],
      declarations: [ClusterListComponent],
      providers: [
        {provide: ClusterService, useValue: clusterService},
        {provide: NotificationService, useValue: notificationService},
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

  describe('Network Error Handling', () => {
    it('should display error message when cluster list fetch fails with network error', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(asyncError({status: 0, message: 'Network error'}));
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters.length).toBe(0);
      expect(notificationService.error).toHaveBeenCalled();
    }));

    it('should allow retry after network error', fakeAsync(() => {
      let callCount = 0;
      clusterService.projectClusterList.mockImplementation(() => {
        callCount++;
        return callCount === 1
          ? asyncError({status: 0, message: 'Network error'})
          : asyncData({clusters: [fakeAWSCluster()]});
      });
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);
      expect(component.clusters.length).toBe(0);

      // Retry
      component.refresh();
      tick(1);
      expect(component.clusters.length).toBe(1);
    }));

    it('should display error when offline', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(
        throwError({status: 0, statusText: 'Unknown Error', message: 'Offline'})
      );
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(notificationService.error).toHaveBeenCalled();
    }));
  });

  describe('HTTP Error Handling', () => {
    it('should display error message for 401 Unauthorized', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(
        asyncError({status: 401, statusText: 'Unauthorized'})
      );
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(notificationService.error).toHaveBeenCalled();
    }));

    it('should display error message for 403 Forbidden', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(
        asyncError({status: 403, statusText: 'Forbidden'})
      );
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(notificationService.error).toHaveBeenCalled();
    }));

    it('should display error message for 404 Not Found', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(
        asyncError({status: 404, statusText: 'Not Found'})
      );
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(notificationService.error).toHaveBeenCalled();
    }));

    it('should display error message for 500 Internal Server Error', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(
        asyncError({status: 500, statusText: 'Internal Server Error'})
      );
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(notificationService.error).toHaveBeenCalled();
    }));

    it('should display error message for 503 Service Unavailable', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(
        asyncError({status: 503, statusText: 'Service Unavailable'})
      );
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(notificationService.error).toHaveBeenCalled();
    }));
  });

  describe('Partial Error Scenarios', () => {
    it('should handle error in health check while cluster list succeeds', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: [cluster]}));
      clusterService.health.mockReturnValue(asyncError({status: 500, message: 'Health check failed'}));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters.length).toBe(1);
      // Health error should be handled gracefully
      expect(notificationService.error).toHaveBeenCalled();
    }));

    it('should handle error in restores check while cluster list succeeds', fakeAsync(() => {
      const cluster = fakeAWSCluster();
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: [cluster]}));
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncError({status: 500, message: 'Restores check failed'}));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters.length).toBe(1);
      // Restore error should not prevent showing clusters
    }));
  });

  describe('Empty State Handling After Errors', () => {
    it('should handle empty cluster list response gracefully', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(asyncData({clusters: []}));
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters.length).toBe(0);
      expect(component.dataSource.data.length).toBe(0);
    }));

    it('should show proper empty state message when list fails then recovers with empty data', fakeAsync(() => {
      let callCount = 0;
      clusterService.projectClusterList.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? asyncError({status: 500}) : asyncData({clusters: []});
      });
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      // Retry
      component.refresh();
      tick(1);

      expect(component.clusters.length).toBe(0);
    }));
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from transient error and load clusters', fakeAsync(() => {
      let callCount = 0;
      const cluster = fakeAWSCluster();

      clusterService.projectClusterList.mockImplementation(() => {
        callCount++;
        return callCount === 1
          ? asyncError({status: 503, statusText: 'Service Unavailable'})
          : asyncData({clusters: [cluster]});
      });
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters.length).toBe(0);
      expect(notificationService.error).toHaveBeenCalled();

      // User retries
      component.refresh();
      tick(1);

      expect(component.clusters.length).toBe(1);
      expect(component.clusters[0].name).toBe(cluster.name);
    }));

    it('should recover from permission error when permissions change', fakeAsync(() => {
      let callCount = 0;
      const cluster = fakeAWSCluster();

      clusterService.projectClusterList.mockImplementation(() => {
        callCount++;
        return callCount === 1
          ? asyncError({status: 403, statusText: 'Forbidden'})
          : asyncData({clusters: [cluster]});
      });
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(notificationService.error).toHaveBeenCalled();

      // Permissions updated, retry
      component.refresh();
      tick(1);

      expect(component.clusters.length).toBe(1);
    }));
  });

  describe('Multiple Error Handling', () => {
    it('should handle multiple consecutive errors', fakeAsync(() => {
      let callCount = 0;

      clusterService.projectClusterList.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return asyncError({status: 500});
        }
        return asyncData({clusters: [fakeAWSCluster()]});
      });
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      // First attempt
      fixture.detectChanges();
      tick(1);
      expect(notificationService.error).toHaveBeenCalledTimes(1);

      // Second attempt
      component.refresh();
      tick(1);
      expect(notificationService.error).toHaveBeenCalledTimes(2);

      // Third attempt succeeds
      component.refresh();
      tick(1);
      expect(component.clusters.length).toBe(1);
    }));
  });

  describe('Error State Cleanup', () => {
    it('should clear previous error state on successful retry', fakeAsync(() => {
      let callCount = 0;

      clusterService.projectClusterList.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? asyncError({status: 500}) : asyncData({clusters: [fakeAWSCluster()]});
      });
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(notificationService.error).toHaveBeenCalled();
      const errorCallCount = notificationService.error.mock.calls.length;

      // Retry succeeds
      component.refresh();
      tick(1);

      expect(component.clusters.length).toBe(1);
      // Error notification should not be called again
      expect(notificationService.error.mock.calls.length).toBe(errorCallCount);
    }));
  });

  describe('Timeout Error Scenarios', () => {
    it('should handle timeout error gracefully', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(
        asyncError({name: 'TimeoutError', message: 'Request timeout'})
      );
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(notificationService.error).toHaveBeenCalled();
      expect(component.clusters.length).toBe(0);
    }));

    it('should allow user to retry after timeout', fakeAsync(() => {
      let callCount = 0;

      clusterService.projectClusterList.mockImplementation(() => {
        callCount++;
        return callCount === 1
          ? asyncError({name: 'TimeoutError', message: 'Request timeout'})
          : asyncData({clusters: [fakeAWSCluster()]});
      });
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      expect(component.clusters.length).toBe(0);

      // User initiates retry
      component.refresh();
      tick(1);

      expect(component.clusters.length).toBe(1);
    }));
  });

  describe('Error Message Display', () => {
    it('should show error message without breaking UI', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(
        asyncError({status: 500, statusText: 'Internal Server Error'})
      );
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      // Component should still be initialized
      expect(component).toBeDefined();
      expect(component.clusters).toBeDefined();
      expect(component.dataSource).toBeDefined();

      // Should still be able to interact with UI elements
      expect(component.refresh).toBeDefined();
    }));

    it('should not hide the table when error occurs', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(
        asyncError({status: 500})
      );
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      // Table elements should still be present
      expect(component.dataSource).toBeDefined();
    }));
  });

  describe('Subscription Cleanup on Error', () => {
    it('should properly cleanup subscriptions after error', fakeAsync(() => {
      clusterService.projectClusterList.mockReturnValue(
        asyncError({status: 500})
      );
      clusterService.health.mockReturnValue(asyncData([]));
      clusterService.restores.mockReturnValue(asyncData([]));

      fixture.detectChanges();
      tick(1);

      // Destroy component
      fixture.destroy();

      // No further error notifications should occur
      const initialCallCount = notificationService.error.mock.calls.length;
      tick(100);

      expect(notificationService.error.mock.calls.length).toBe(initialCallCount);
    }));
  });
});
