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

import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {AppConfigService} from '@app/config.service';
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {SettingsService} from '@core/services/settings';
import {fakeCluster, fakeHealth} from '@test/data/cluster';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {NotificationMockService} from '@test/services/notification-mock';
import {SettingsMockService} from '@test/services/settings-mock';
import {of, throwError} from 'rxjs';

describe('ClusterService - Error Scenarios', () => {
  let service: ClusterService;
  let httpMock: HttpTestingController;
  let notificationService: any;

  beforeEach(() => {
    notificationService = {
      error: jest.fn(),
      success: jest.fn(),
      warning: jest.fn(),
      info: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ClusterService,
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: NotificationService, useValue: notificationService},
        {provide: SettingsService, useClass: SettingsMockService},
      ],
    });

    service = TestBed.inject(ClusterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Network Error Scenarios', () => {
    it('should handle network timeout when fetching cluster list', (done) => {
      const projectID = 'test-project';

      const sub = service.projectClusterList(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.error(new ProgressEvent('error'));

      sub.unsubscribe();
    });

    it('should handle connection refused error', (done) => {
      const projectID = 'test-project';

      service.projectClusterList(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.error(new ProgressEvent('Network connection failed'));
    });

    it('should handle offline scenario', (done) => {
      const projectID = 'test-project';

      service.projectClusterList(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.error(new ErrorEvent('Offline'));
    });
  });

  describe('HTTP 4xx Error Scenarios', () => {
    it('should handle 401 Unauthorized error when fetching clusters', (done) => {
      const projectID = 'test-project';

      service.projectClusterList(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush('Unauthorized', {status: 401, statusText: 'Unauthorized'});
    });

    it('should handle 403 Forbidden error (permission denied)', (done) => {
      const projectID = 'test-project';

      service.projectClusterList(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush('Forbidden', {status: 403, statusText: 'Forbidden'});
    });

    it('should handle 404 Not Found error', (done) => {
      const projectID = 'nonexistent-project';

      service.projectClusterList(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush('Project not found', {status: 404, statusText: 'Not Found'});
    });

    it('should handle 409 Conflict error on cluster creation', (done) => {
      const projectID = 'test-project';
      const cluster = fakeCluster();

      service.create(projectID, cluster).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush('Cluster name already exists', {status: 409, statusText: 'Conflict'});
    });

    it('should handle 400 Bad Request (validation error) on cluster create', (done) => {
      const projectID = 'test-project';
      const invalidCluster = {name: ''}; // Invalid: empty name

      service.create(projectID, invalidCluster as any).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush('Invalid cluster specification', {status: 400, statusText: 'Bad Request'});
    });
  });

  describe('HTTP 5xx Error Scenarios', () => {
    it('should handle 500 Internal Server Error', (done) => {
      const projectID = 'test-project';

      service.projectClusterList(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush('Internal server error', {status: 500, statusText: 'Internal Server Error'});
    });

    it('should handle 503 Service Unavailable error', (done) => {
      const projectID = 'test-project';

      service.projectClusterList(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(503);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush('Service temporarily unavailable', {status: 503, statusText: 'Service Unavailable'});
    });

    it('should handle 502 Bad Gateway error', (done) => {
      const projectID = 'test-project';

      service.projectClusterList(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(502);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush('Bad gateway', {status: 502, statusText: 'Bad Gateway'});
    });
  });

  describe('Cluster-Specific Error Scenarios', () => {
    it('should handle error when fetching single cluster', (done) => {
      const projectID = 'test-project';
      const clusterID = 'missing-cluster';

      service.cluster(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters/${clusterID}`);
      req.flush('Cluster not found', {status: 404, statusText: 'Not Found'});
    });

    it('should handle error when updating cluster', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const cluster = fakeCluster();

      service.edit(projectID, cluster).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters/${clusterID}`);
      req.flush('Permission denied', {status: 403, statusText: 'Forbidden'});
    });

    it('should handle error when deleting cluster', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      service.delete(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters/${clusterID}`);
      req.flush('Cannot delete cluster', {status: 403, statusText: 'Forbidden'});
    });

    it('should handle error when fetching cluster health', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      service.health(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters/${clusterID}/health`);
      req.flush('Failed to get cluster health', {status: 500, statusText: 'Internal Server Error'});
    });

    it('should handle error when fetching cluster nodes', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      service.nodes(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters/${clusterID}/nodes`);
      req.flush('Cluster not found', {status: 404, statusText: 'Not Found'});
    });
  });

  describe('Concurrent Operations Error Scenarios', () => {
    it('should handle error when creating cluster while another is being created', (done) => {
      const projectID = 'test-project';
      const cluster1 = fakeCluster();
      const cluster2 = fakeCluster();
      cluster2.name = 'cluster-2';

      // First creation
      service.create(projectID, cluster1).subscribe();

      // Second creation with same name should conflict
      service.create(projectID, cluster2).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        },
      });

      const reqs = httpMock.match(`/api/v2/projects/${projectID}/clusters`);
      expect(reqs.length).toBe(2);
      reqs[0].flush(cluster1, {status: 200, statusText: 'OK'});
      reqs[1].flush('Conflict', {status: 409, statusText: 'Conflict'});
    });

    it('should handle error when attempting to update deleted cluster', (done) => {
      const projectID = 'test-project';
      const clusterID = 'deleted-cluster';
      const cluster = fakeCluster();

      service.edit(projectID, cluster).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters/${clusterID}`);
      req.flush('Cluster not found', {status: 404, statusText: 'Not Found'});
    });
  });

  describe('Permission Error Scenarios', () => {
    it('should handle permission error when user lacks edit permission', (done) => {
      const projectID = 'test-project';
      const cluster = fakeCluster();

      service.edit(projectID, cluster).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(/projects\/.*\/clusters/);
      req.flush('User lacks edit permission', {status: 403, statusText: 'Forbidden'});
    });

    it('should handle permission error when user lacks delete permission', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      service.delete(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters/${clusterID}`);
      req.flush('User lacks delete permission', {status: 403, statusText: 'Forbidden'});
    });

    it('should handle unauthorized error (401) on privileged operation', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      service.delete(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters/${clusterID}`);
      req.flush('Authentication required', {status: 401, statusText: 'Unauthorized'});
    });
  });

  describe('Data Validation Error Scenarios', () => {
    it('should handle validation error for invalid cluster name', (done) => {
      const projectID = 'test-project';
      const cluster = fakeCluster();
      cluster.name = ''; // Invalid: empty name

      service.create(projectID, cluster).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush('Cluster name is required', {status: 400, statusText: 'Bad Request'});
    });

    it('should handle validation error for invalid cluster specification', (done) => {
      const projectID = 'test-project';
      const invalidCluster = {
        name: 'test',
        spec: {}, // Missing required spec fields
      };

      service.create(projectID, invalidCluster as any).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush('Invalid cluster specification', {status: 400, statusText: 'Bad Request'});
    });

    it('should handle validation error for missing required fields', (done) => {
      const projectID = 'test-project';
      const cluster = fakeCluster();
      cluster.spec.cloud = {} as any; // Missing cloud provider

      service.create(projectID, cluster).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush('Cloud provider must be specified', {status: 400, statusText: 'Bad Request'});
    });
  });

  describe('Recovery and Retry Scenarios', () => {
    it('should allow retry after failed cluster fetch', (done) => {
      const projectID = 'test-project';

      // First attempt fails
      service.projectClusterList(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: () => {
          // Retry
          service.projectClusterList(projectID).subscribe({
            next: (data) => {
              expect(data.clusters.length).toBe(1);
              done();
            },
          });

          const retryReq = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
          retryReq.flush({clusters: [fakeCluster()]});
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush('Service unavailable', {status: 503, statusText: 'Service Unavailable'});
    });

    it('should allow retry after failed cluster creation', (done) => {
      const projectID = 'test-project';
      const cluster = fakeCluster();

      // First attempt fails
      service.create(projectID, cluster).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: () => {
          // Retry
          service.create(projectID, cluster).subscribe({
            next: (created) => {
              expect(created.name).toBe(cluster.name);
              done();
            },
          });

          const retryReq = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
          retryReq.flush(cluster);
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush('Server error', {status: 500, statusText: 'Internal Server Error'});
    });
  });

  describe('Edge Cases with Error Responses', () => {
    it('should handle malformed error response', (done) => {
      const projectID = 'test-project';

      service.projectClusterList(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush({}, {status: 500, statusText: 'Internal Server Error'});
    });

    it('should handle error response with no message', (done) => {
      const projectID = 'test-project';

      service.projectClusterList(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush(null, {status: 500, statusText: 'Internal Server Error'});
    });

    it('should handle error response with non-JSON content', (done) => {
      const projectID = 'test-project';

      service.projectClusterList(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush('HTML error page', {status: 500, statusText: 'Internal Server Error'});
    });

    it('should handle error with extremely long error message', (done) => {
      const projectID = 'test-project';
      const longMessage = 'A'.repeat(10000);

      service.projectClusterList(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}/clusters`);
      req.flush(longMessage, {status: 400, statusText: 'Bad Request'});
    });
  });
});
