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
import {TestBed} from '@angular/core/testing';
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {fakeMachineDeployment} from '@test/data/machine-deployment';

describe('MachineDeploymentService - Error Scenarios', () => {
  let service: MachineDeploymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MachineDeploymentService],
    });

    service = TestBed.inject(MachineDeploymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Network Error Scenarios', () => {
    it('should handle network timeout when fetching machine deployments', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      service.list(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.error(new ProgressEvent('timeout'));
    });

    it('should handle connection refused error', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      service.list(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.error(new ProgressEvent('Connection refused'));
    });
  });

  describe('HTTP 4xx Error Scenarios', () => {
    it('should handle 401 Unauthorized error', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      service.list(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.flush('Unauthorized', {status: 401, statusText: 'Unauthorized'});
    });

    it('should handle 403 Forbidden error', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      service.list(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.flush('Forbidden', {status: 403, statusText: 'Forbidden'});
    });

    it('should handle 404 Not Found error', (done) => {
      const projectID = 'test-project';
      const clusterID = 'missing-cluster';

      service.list(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.flush('Not found', {status: 404, statusText: 'Not Found'});
    });

    it('should handle 409 Conflict error on machine deployment creation', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const md = fakeMachineDeployment();

      service.create(projectID, clusterID, md).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.flush('Name already exists', {status: 409, statusText: 'Conflict'});
    });

    it('should handle 400 Bad Request error', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const invalidMD = {name: ''}; // Invalid

      service.create(projectID, clusterID, invalidMD as any).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.flush('Invalid machine deployment', {status: 400, statusText: 'Bad Request'});
    });
  });

  describe('HTTP 5xx Error Scenarios', () => {
    it('should handle 500 Internal Server Error', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      service.list(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.flush('Server error', {status: 500, statusText: 'Internal Server Error'});
    });

    it('should handle 503 Service Unavailable', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      service.list(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(503);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.flush('Unavailable', {status: 503, statusText: 'Service Unavailable'});
    });
  });

  describe('Machine Deployment Specific Error Scenarios', () => {
    it('should handle error when fetching single machine deployment', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mdID = 'missing-md';

      service.get(projectID, clusterID, mdID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments/${mdID}`
      );
      req.flush('Not found', {status: 404, statusText: 'Not Found'});
    });

    it('should handle error when updating machine deployment', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const md = fakeMachineDeployment();

      service.patch(projectID, clusterID, md).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments/${md.id}`
      );
      req.flush('Not found', {status: 404, statusText: 'Not Found'});
    });

    it('should handle error when deleting machine deployment', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mdID = 'test-md';

      service.delete(projectID, clusterID, mdID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments/${mdID}`
      );
      req.flush('Cannot delete', {status: 403, statusText: 'Forbidden'});
    });

    it('should handle error when scaling machine deployment', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mdID = 'test-md';

      service.changeNodeDeploymentCount(projectID, clusterID, mdID, 3).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments/${mdID}`
      );
      req.flush('Invalid replica count', {status: 400, statusText: 'Bad Request'});
    });
  });

  describe('Permission Error Scenarios', () => {
    it('should handle permission error on machine deployment creation', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const md = fakeMachineDeployment();

      service.create(projectID, clusterID, md).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.flush('Permission denied', {status: 403, statusText: 'Forbidden'});
    });

    it('should handle permission error on update', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const md = fakeMachineDeployment();

      service.patch(projectID, clusterID, md).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments/${md.id}`
      );
      req.flush('Permission denied', {status: 403, statusText: 'Forbidden'});
    });

    it('should handle permission error on deletion', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mdID = 'test-md';

      service.delete(projectID, clusterID, mdID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments/${mdID}`
      );
      req.flush('Insufficient permissions', {status: 403, statusText: 'Forbidden'});
    });

    it('should handle 401 Unauthorized on privileged operation', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mdID = 'test-md';

      service.delete(projectID, clusterID, mdID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments/${mdID}`
      );
      req.flush('Authentication required', {status: 401, statusText: 'Unauthorized'});
    });
  });

  describe('Data Validation Error Scenarios', () => {
    it('should handle validation error for invalid MD name', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const md = fakeMachineDeployment();
      md.name = ''; // Invalid

      service.create(projectID, clusterID, md).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.flush('Name is required', {status: 400, statusText: 'Bad Request'});
    });

    it('should handle validation error for invalid replica count', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mdID = 'test-md';

      service.changeNodeDeploymentCount(projectID, clusterID, mdID, -1).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments/${mdID}`
      );
      req.flush('Replica count must be non-negative', {status: 400, statusText: 'Bad Request'});
    });

    it('should handle validation error for missing required fields', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const invalidMD = {name: 'test', spec: {}}; // Missing spec fields

      service.create(projectID, clusterID, invalidMD as any).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.flush('Invalid machine deployment spec', {status: 400, statusText: 'Bad Request'});
    });
  });

  describe('Concurrent Operations Error Scenarios', () => {
    it('should handle error when creating MDs with same name concurrently', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const md1 = fakeMachineDeployment();
      const md2 = fakeMachineDeployment();
      md2.name = md1.name; // Same name

      service.create(projectID, clusterID, md1).subscribe();

      service.create(projectID, clusterID, md2).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        },
      });

      const reqs = httpMock.match(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      expect(reqs.length).toBe(2);
      reqs[0].flush(md1);
      reqs[1].flush('Conflict', {status: 409, statusText: 'Conflict'});
    });

    it('should handle error when updating MD while it is being deleted', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const md = fakeMachineDeployment();

      service.patch(projectID, clusterID, md).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments/${md.id}`
      );
      req.flush('Resource is being deleted', {status: 409, statusText: 'Conflict'});
    });
  });

  describe('Recovery Scenarios', () => {
    it('should allow retry after failed MD fetch', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const md = fakeMachineDeployment();

      // First attempt fails
      service.list(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: () => {
          // Retry
          service.list(projectID, clusterID).subscribe({
            next: (mds) => {
              expect(mds.length).toBe(1);
              done();
            },
          });

          const retryReq = httpMock.expectOne(
            `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
          );
          retryReq.flush([md]);
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.flush('Server error', {status: 500, statusText: 'Internal Server Error'});
    });

    it('should allow retry after failed MD creation', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const md = fakeMachineDeployment();

      // First attempt fails
      service.create(projectID, clusterID, md).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: () => {
          // Retry
          service.create(projectID, clusterID, md).subscribe({
            next: (created) => {
              expect(created.name).toBe(md.name);
              done();
            },
          });

          const retryReq = httpMock.expectOne(
            `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
          );
          retryReq.flush(md);
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.flush('Service error', {status: 500, statusText: 'Internal Server Error'});
    });
  });

  describe('Edge Cases with Error Responses', () => {
    it('should handle malformed error response', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      service.list(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.flush({}, {status: 500, statusText: 'Internal Server Error'});
    });

    it('should handle null error response', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      service.list(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.flush(null, {status: 500, statusText: 'Internal Server Error'});
    });

    it('should handle non-JSON error response', (done) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      service.list(projectID, clusterID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/${projectID}/clusters/${clusterID}/machinedeployments`
      );
      req.flush('<html>500 Error</html>', {status: 500, statusText: 'Internal Server Error'});
    });
  });
});
