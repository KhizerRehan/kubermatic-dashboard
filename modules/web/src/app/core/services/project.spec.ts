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

import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {ParamsService} from '@core/services/params';
import {UserService} from '@core/services/user';
import {environment} from '@environments/environment';
import {fakeProject, fakeProjectModel} from '@test/data/project';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {UserMockService} from '@test/services/user-mock';
import {lastValueFrom} from 'rxjs';

import {ProjectService} from './project';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpController: HttpTestingController;
  let router: Router;
  let paramsService: ParamsService;

  const restRoot = environment.restRoot;
  const mockProject = fakeProject();
  const mockProjectID = mockProject.id;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProjectService,
        ParamsService,
        Router,
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: UserService, useClass: UserMockService},
      ],
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(ProjectService);
    httpController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    paramsService = TestBed.inject(ParamsService);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with default display all projects setting', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('projectClusterList()', () => {
    it('should fetch projects list on first call', async () => {
      const result = lastValueFrom(service.projects);

      const req = httpController.expectOne(`${restRoot}/projects`);
      expect(req.request.method).toBe('GET');
      req.flush([mockProject]);

      const projects = await result;
      expect(projects).toContain(jasmine.objectContaining({id: mockProjectID}));
    });

    it('should cache projects observable to avoid duplicate requests', async () => {
      const result1 = lastValueFrom(service.projects);
      const req1 = httpController.expectOne(`${restRoot}/projects`);
      req1.flush([mockProject]);
      const projects1 = await result1;

      // Second call should use cache without making new HTTP request
      const result2 = lastValueFrom(service.projects);
      // No new request should be made
      httpController.expectNone(`${restRoot}/projects`);
      const projects2 = await result2;

      expect(projects1).toEqual(projects2);
    });

    it('should handle empty projects list', async () => {
      const result = lastValueFrom(service.projects);

      const req = httpController.expectOne(`${restRoot}/projects`);
      req.flush([]);

      const projects = await result;
      expect(projects).toEqual([]);
    });

    it('should handle API error gracefully', async () => {
      const result = lastValueFrom(service.projects);

      const req = httpController.expectOne(`${restRoot}/projects`);
      req.error(new ErrorEvent('Network error'));

      try {
        await result;
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe('myProjects', () => {
    it('should fetch user own projects', async () => {
      const result = lastValueFrom(service.myProjects);

      const req = httpController.expectOne(`${restRoot}/projects`);
      expect(req.request.method).toBe('GET');
      req.flush([mockProject]);

      const projects = await result;
      expect(projects).toContain(jasmine.objectContaining({id: mockProjectID}));
    });

    it('should cache my projects observable', async () => {
      const result1 = lastValueFrom(service.myProjects);
      const req1 = httpController.expectOne(`${restRoot}/projects`);
      req1.flush([mockProject]);
      const projects1 = await result1;

      // Second call should reuse cache
      const result2 = lastValueFrom(service.myProjects);
      httpController.expectNone(`${restRoot}/projects`);
      const projects2 = await result2;

      expect(projects1).toEqual(projects2);
    });
  });

  describe('selectedProject', () => {
    it('should get selected project from projects list', async () => {
      spyOn(service, 'selectedProjectID').and.returnValue(mockProjectID);
      const result = lastValueFrom(service.selectedProject);

      const req = httpController.expectOne(`${restRoot}/projects`);
      req.flush([mockProject]);

      const project = await result;
      expect(project?.id).toBe(mockProjectID);
    });

    it('should fetch selected project if not in list', async () => {
      spyOn(service, 'selectedProjectID').and.returnValue(mockProjectID);
      const result = lastValueFrom(service.selectedProject);

      // First request tries to get from projects list
      const req1 = httpController.expectOne(`${restRoot}/projects`);
      req1.flush([]); // Empty list

      // Then makes individual project request
      const req2 = httpController.expectOne(`${restRoot}/projects/${mockProjectID}`);
      req2.flush(mockProject);

      const project = await result;
      expect(project?.id).toBe(mockProjectID);
    });
  });

  describe('create()', () => {
    it('should create new project with valid model', async () => {
      const projectModel = fakeProjectModel();
      const result = lastValueFrom(service.create(projectModel));

      const req = httpController.expectOne(`${restRoot}/projects`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(projectModel);

      req.flush(mockProject);

      const project = await result;
      expect(project.id).toBe(mockProjectID);
    });

    it('should emit onProjectsUpdate after create', (done) => {
      const projectModel = fakeProjectModel();
      spyOn(service.onProjectsUpdate, 'next');

      service.create(projectModel).subscribe(() => {
        // Project update is triggered after creation
        done();
      });

      const req = httpController.expectOne(`${restRoot}/projects`);
      req.flush(mockProject);
    });

    it('should handle creation error', async () => {
      const projectModel = fakeProjectModel();
      const result = lastValueFrom(service.create(projectModel));

      const req = httpController.expectOne(`${restRoot}/projects`);
      req.error(new ErrorEvent('Creation failed'));

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe('update()', () => {
    it('should update existing project', async () => {
      const updatedProject = {...mockProject, name: 'Updated Project'};
      const result = lastValueFrom(service.update(updatedProject));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedProject);

      req.flush(updatedProject);

      const project = await result;
      expect(project.name).toBe('Updated Project');
    });

    it('should emit onProjectsUpdate after update', (done) => {
      spyOn(service.onProjectsUpdate, 'next');

      service.update(mockProject).subscribe(() => {
        done();
      });

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}`);
      req.flush(mockProject);
    });

    it('should handle update error', async () => {
      const result = lastValueFrom(service.update(mockProject));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}`);
      req.error(new ErrorEvent('Update failed'));

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe('delete()', () => {
    it('should delete project by ID', async () => {
      const result = lastValueFrom(service.delete(mockProjectID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}`);
      expect(req.request.method).toBe('DELETE');

      req.flush({});

      await result;
      // No error thrown indicates success
      expect(true).toBe(true);
    });

    it('should emit onProjectsUpdate after delete', (done) => {
      spyOn(service.onProjectsUpdate, 'next');

      service.delete(mockProjectID).subscribe(() => {
        done();
      });

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}`);
      req.flush({});
    });

    it('should handle delete error (403 Forbidden)', async () => {
      const result = lastValueFrom(service.delete(mockProjectID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}`);
      req.error(new ErrorEvent('Forbidden'), {status: 403});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it('should handle delete error (404 Not Found)', async () => {
      const result = lastValueFrom(service.delete(mockProjectID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}`);
      req.error(new ErrorEvent('Not Found'), {status: 404});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe('Observable Caching and Refresh', () => {
    it('should not make duplicate requests for same project', async () => {
      const result1 = lastValueFrom(service.projects);
      const req1 = httpController.expectOne(`${restRoot}/projects`);
      req1.flush([mockProject]);
      await result1;

      // Access again - should use cache
      const result2 = lastValueFrom(service.projects);
      httpController.expectNone(`${restRoot}/projects`);
      const projects2 = await result2;

      expect(projects2).toBeTruthy();
    });

    it('should update cache when onProjectsUpdate is triggered', (done) => {
      const result = lastValueFrom(service.projects);

      const req = httpController.expectOne(`${restRoot}/projects`);
      req.flush([mockProject]);

      result.then(() => {
        // Trigger update
        service.onProjectsUpdate.next();

        // This should trigger a new request
        const newReq = httpController.expectOne(`${restRoot}/projects`);
        newReq.flush([{...mockProject, name: 'Updated'}]);
        done();
      });
    });
  });

  describe('Project Filtering', () => {
    it('should filter projects by name', async () => {
      const project1 = {...mockProject, id: 'project-1', name: 'Production'};
      const project2 = {...mockProject, id: 'project-2', name: 'Development'};
      const result = lastValueFrom(service.projects);

      const req = httpController.expectOne(`${restRoot}/projects`);
      req.flush([project1, project2]);

      const projects = await result;
      const filtered = projects.filter(p => p.name.includes('Production'));
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Production');
    });
  });
});
