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
import {AppConfigService} from '@app/config.service';
import {ProjectService} from '@core/services/project';
import {fakeProject, Project} from '@test/data/project';
import {AppConfigMockService} from '@test/services/app-config-mock';

describe('ProjectService - Error Scenarios', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ProjectService,
        {provide: AppConfigService, useClass: AppConfigMockService},
      ],
    });

    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Network Error Scenarios', () => {
    it('should handle network timeout when fetching projects', (done) => {
      service.listAll().subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.error(new ProgressEvent('timeout'));
    });

    it('should handle connection refused error', (done) => {
      service.listAll().subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.error(new ProgressEvent('Network error'));
    });

    it('should handle offline scenario on project list', (done) => {
      service.listAll().subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.error(new ErrorEvent('Offline'));
    });
  });

  describe('HTTP 4xx Error Scenarios', () => {
    it('should handle 401 Unauthorized error on project list', (done) => {
      service.listAll().subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush('Unauthorized', {status: 401, statusText: 'Unauthorized'});
    });

    it('should handle 403 Forbidden error', (done) => {
      service.listAll().subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush('Forbidden', {status: 403, statusText: 'Forbidden'});
    });

    it('should handle 404 Not Found error on single project fetch', (done) => {
      service.get('nonexistent-project').subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects/nonexistent-project');
      req.flush('Project not found', {status: 404, statusText: 'Not Found'});
    });

    it('should handle 409 Conflict error on project creation', (done) => {
      const newProject: Project = fakeProject();

      service.create(newProject).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush('Project name already exists', {status: 409, statusText: 'Conflict'});
    });

    it('should handle 400 Bad Request error', (done) => {
      const invalidProject = {name: ''}; // Invalid: empty name

      service.create(invalidProject as any).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush('Project name is required', {status: 400, statusText: 'Bad Request'});
    });
  });

  describe('HTTP 5xx Error Scenarios', () => {
    it('should handle 500 Internal Server Error on project list', (done) => {
      service.listAll().subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush('Internal server error', {status: 500, statusText: 'Internal Server Error'});
    });

    it('should handle 503 Service Unavailable', (done) => {
      service.listAll().subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(503);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush('Service unavailable', {status: 503, statusText: 'Service Unavailable'});
    });
  });

  describe('Project-Specific Error Scenarios', () => {
    it('should handle error when fetching single project', (done) => {
      service.get('missing-project').subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects/missing-project');
      req.flush('Not found', {status: 404, statusText: 'Not Found'});
    });

    it('should handle error when creating project', (done) => {
      const project = fakeProject();

      service.create(project).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush('Failed to create project', {status: 500, statusText: 'Internal Server Error'});
    });

    it('should handle error when updating project', (done) => {
      const project = fakeProject();

      service.edit(project).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${project.id}`);
      req.flush('Project not found', {status: 404, statusText: 'Not Found'});
    });

    it('should handle error when deleting project', (done) => {
      const projectID = 'test-project';

      service.delete(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}`);
      req.flush('Cannot delete project with active clusters', {status: 403, statusText: 'Forbidden'});
    });
  });

  describe('Permission Error Scenarios', () => {
    it('should handle permission error on project creation', (done) => {
      const project = fakeProject();

      service.create(project).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush('Insufficient permissions', {status: 403, statusText: 'Forbidden'});
    });

    it('should handle permission error on project update', (done) => {
      const project = fakeProject();

      service.edit(project).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${project.id}`);
      req.flush('User lacks edit permission', {status: 403, statusText: 'Forbidden'});
    });

    it('should handle permission error on project deletion', (done) => {
      const projectID = 'test-project';

      service.delete(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}`);
      req.flush('User lacks delete permission', {status: 403, statusText: 'Forbidden'});
    });

    it('should handle 401 Unauthorized on privileged operation', (done) => {
      const projectID = 'test-project';

      service.delete(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}`);
      req.flush('Authentication required', {status: 401, statusText: 'Unauthorized'});
    });
  });

  describe('Data Validation Error Scenarios', () => {
    it('should handle validation error for invalid project name', (done) => {
      const project = fakeProject();
      project.name = ''; // Invalid: empty name

      service.create(project).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush('Project name is required', {status: 400, statusText: 'Bad Request'});
    });

    it('should handle validation error for project with special characters', (done) => {
      const project = fakeProject();
      project.name = 'project!@#$%'; // Invalid: special characters

      service.create(project).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush('Project name contains invalid characters', {status: 400, statusText: 'Bad Request'});
    });

    it('should handle validation error for duplicate project', (done) => {
      const project = fakeProject();
      project.name = 'existing-project'; // Duplicate name

      service.create(project).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush('Project with this name already exists', {status: 409, statusText: 'Conflict'});
    });
  });

  describe('Concurrent Operations Error Scenarios', () => {
    it('should handle error when creating projects with same name concurrently', (done) => {
      const project1 = fakeProject();
      const project2 = fakeProject();
      project2.name = project1.name; // Same name

      // First creation
      service.create(project1).subscribe();

      // Second creation with same name
      service.create(project2).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        },
      });

      const reqs = httpMock.match('/api/v2/projects');
      expect(reqs.length).toBe(2);
      reqs[0].flush(project1);
      reqs[1].flush('Conflict', {status: 409, statusText: 'Conflict'});
    });

    it('should handle error when deleting project while it is being used', (done) => {
      const projectID = 'test-project';

      service.delete(projectID).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        },
      });

      const req = httpMock.expectOne(`/api/v2/projects/${projectID}`);
      req.flush('Project is in use', {status: 409, statusText: 'Conflict'});
    });
  });

  describe('Recovery Scenarios', () => {
    it('should allow retry after failed project list fetch', (done) => {
      const project = fakeProject();

      // First attempt fails
      service.listAll().subscribe({
        next: () => {
          fail('should have errored');
        },
        error: () => {
          // Retry
          service.listAll().subscribe({
            next: (projects) => {
              expect(projects.length).toBeGreaterThan(0);
              done();
            },
          });

          const retryReq = httpMock.expectOne('/api/v2/projects');
          retryReq.flush([project]);
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush('Service error', {status: 500, statusText: 'Internal Server Error'});
    });

    it('should allow retry after failed project creation', (done) => {
      const project = fakeProject();

      // First attempt fails
      service.create(project).subscribe({
        next: () => {
          fail('should have errored');
        },
        error: () => {
          // Retry
          service.create(project).subscribe({
            next: (created) => {
              expect(created.name).toBe(project.name);
              done();
            },
          });

          const retryReq = httpMock.expectOne('/api/v2/projects');
          retryReq.flush(project);
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush('Server error', {status: 500, statusText: 'Internal Server Error'});
    });
  });

  describe('Edge Cases with Error Responses', () => {
    it('should handle malformed error response on project list', (done) => {
      service.listAll().subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush({}, {status: 500, statusText: 'Internal Server Error'});
    });

    it('should handle null error response', (done) => {
      service.listAll().subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush(null, {status: 500, statusText: 'Internal Server Error'});
    });

    it('should handle HTML error response instead of JSON', (done) => {
      service.listAll().subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush('<html>500 Error</html>', {status: 500, statusText: 'Internal Server Error'});
    });
  });

  describe('Graceful Degradation on Error', () => {
    it('should handle error gracefully and allow user to continue', (done) => {
      service.listAll().subscribe({
        next: () => {
          fail('should have errored');
        },
        error: (error) => {
          // After error, the application should still be functional
          expect(error.status).toBe(500);

          // Try another operation
          const newProject = fakeProject();
          service.create(newProject).subscribe();

          const req = httpMock.expectOne('/api/v2/projects');
          req.flush(newProject);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v2/projects');
      req.flush('Error', {status: 500, statusText: 'Internal Server Error'});
    });
  });
});
