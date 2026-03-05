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
import {OPAService} from './opa';
import {AppConfigService} from '@app/config.service';
import {Constraint, ConstraintTemplate, GatekeeperConfig} from '@shared/entity/opa';

describe('OPAService', () => {
  let service: OPAService;
  let httpController: HttpTestingController;
  let appConfigMock: jasmine.SpyObj<AppConfigService>;

  beforeEach(() => {
    appConfigMock = jasmine.createSpyObj('AppConfigService', ['getRefreshTimeBase']);
    appConfigMock.getRefreshTimeBase.and.returnValue(10);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OPAService,
        {provide: AppConfigService, useValue: appConfigMock},
      ],
    });

    service = TestBed.inject(OPAService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('constraint templates', () => {
    describe('constraintTemplates getter', () => {
      it('should GET constraint templates on first subscription', fakeAsync(() => {
        const templates: ConstraintTemplate[] = [{name: 'template-1'} as ConstraintTemplate];

        service.constraintTemplates.subscribe((result) => {
          expect(result).toEqual(templates);
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates`);
        expect(req.method).toBe('GET');
        req.flush(templates);
        tick();
      }));

      it('should cache constraint templates on second subscription', fakeAsync(() => {
        const templates: ConstraintTemplate[] = [{name: 'template-1'} as ConstraintTemplate];

        service.constraintTemplates.subscribe();
        const req1 = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates`);
        req1.flush(templates);

        // Second subscription should use cache (shareReplay)
        service.constraintTemplates.subscribe((result) => {
          expect(result).toEqual(templates);
        });

        // No new HTTP request
        httpController.expectNone(`http://localhost:8080/api/v2/constrainttemplates`);
        tick();
      }));

      it('should handle empty constraint templates list', fakeAsync(() => {
        service.constraintTemplates.subscribe((result) => {
          expect(result).toEqual([]);
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates`);
        req.flush([]);
        tick();
      }));

      it('should handle multiple constraint templates', fakeAsync(() => {
        const templates: ConstraintTemplate[] = [
          {name: 'template-1'} as ConstraintTemplate,
          {name: 'template-2'} as ConstraintTemplate,
          {name: 'template-3'} as ConstraintTemplate,
        ];

        service.constraintTemplates.subscribe((result) => {
          expect(result.length).toBe(3);
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates`);
        req.flush(templates);
        tick();
      }));
    });

    describe('createConstraintTemplate', () => {
      it('should POST constraint template to correct endpoint', () => {
        const template: ConstraintTemplate = {name: 'new-template'} as ConstraintTemplate;

        service.createConstraintTemplate(template).subscribe();

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates`);
        expect(req.method).toBe('POST');
        expect(req.request.body).toEqual(template);
        req.flush(template);
      });

      it('should return created constraint template', (done) => {
        const template: ConstraintTemplate = {name: 'new-template'} as ConstraintTemplate;

        service.createConstraintTemplate(template).subscribe((result) => {
          expect(result).toEqual(template);
          done();
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates`);
        req.flush(template);
      });

      it('should handle 400 bad request on create', (done) => {
        service.createConstraintTemplate({} as ConstraintTemplate).subscribe({
          error: (error) => {
            expect(error.status).toBe(400);
            done();
          },
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates`);
        req.flush({message: 'Invalid template'}, {status: 400, statusText: 'Bad Request'});
      });

      it('should handle 409 conflict (template already exists)', (done) => {
        service.createConstraintTemplate({name: 'existing'} as ConstraintTemplate).subscribe({
          error: (error) => {
            expect(error.status).toBe(409);
            done();
          },
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates`);
        req.flush({message: 'Already exists'}, {status: 409, statusText: 'Conflict'});
      });

      it('should handle 500 server error', (done) => {
        service.createConstraintTemplate({} as ConstraintTemplate).subscribe({
          error: (error) => {
            expect(error.status).toBe(500);
            done();
          },
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates`);
        req.flush({message: 'Server error'}, {status: 500, statusText: 'Internal Server Error'});
      });
    });

    describe('patchConstraintTemplate', () => {
      it('should PATCH constraint template', () => {
        const patch: ConstraintTemplate = {name: 'template', spec: {}} as ConstraintTemplate;

        service.patchConstraintTemplate('template', patch).subscribe();

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates/template`);
        expect(req.method).toBe('PATCH');
        expect(req.request.body).toEqual(patch);
        req.flush(patch);
      });

      it('should return patched constraint template', (done) => {
        const patch: ConstraintTemplate = {name: 'template'} as ConstraintTemplate;

        service.patchConstraintTemplate('template', patch).subscribe((result) => {
          expect(result.name).toBe('template');
          done();
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates/template`);
        req.flush(patch);
      });

      it('should handle 404 not found on patch', (done) => {
        service.patchConstraintTemplate('nonexistent', {} as ConstraintTemplate).subscribe({
          error: (error) => {
            expect(error.status).toBe(404);
            done();
          },
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates/nonexistent`);
        req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
      });

      it('should include template name in URL path', () => {
        service.patchConstraintTemplate('custom-template', {} as ConstraintTemplate).subscribe();

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates/custom-template`);
        expect(req.request.url).toContain('custom-template');
        req.flush({});
      });
    });

    describe('deleteConstraintTemplate', () => {
      it('should DELETE constraint template', () => {
        service.deleteConstraintTemplate('template-1').subscribe();

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates/template-1`);
        expect(req.method).toBe('DELETE');
        req.flush(null);
      });

      it('should handle successful delete', (done) => {
        service.deleteConstraintTemplate('template-1').subscribe(() => {
          done();
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates/template-1`);
        req.flush(null);
      });

      it('should handle 404 not found on delete', (done) => {
        service.deleteConstraintTemplate('nonexistent').subscribe({
          error: (error) => {
            expect(error.status).toBe(404);
            done();
          },
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates/nonexistent`);
        req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
      });

      it('should handle 403 forbidden on delete', (done) => {
        service.deleteConstraintTemplate('template-1').subscribe({
          error: (error) => {
            expect(error.status).toBe(403);
            done();
          },
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates/template-1`);
        req.flush({message: 'Permission denied'}, {status: 403, statusText: 'Forbidden'});
      });
    });

    describe('refreshConstraintTemplates', () => {
      it('should trigger new HTTP request on refresh', fakeAsync(() => {
        const templates1: ConstraintTemplate[] = [{name: 'template-1'} as ConstraintTemplate];
        const templates2: ConstraintTemplate[] = [{name: 'template-2'} as ConstraintTemplate];

        service.constraintTemplates.subscribe();
        const req1 = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates`);
        req1.flush(templates1);

        service.refreshConstraintTemplates();

        service.constraintTemplates.subscribe();
        const req2 = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates`);
        req2.flush(templates2);

        tick();
      }));
    });
  });

  describe('constraints (project/cluster scoped)', () => {
    describe('constraints getter', () => {
      it('should GET constraints with project and cluster ID', fakeAsync(() => {
        const constraints: Constraint[] = [{name: 'constraint-1'} as Constraint];

        service.constraints('project-1', 'cluster-1').subscribe((result) => {
          expect(result).toEqual(constraints);
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/constraints`
        );
        expect(req.method).toBe('GET');
        req.flush(constraints);
        tick();
      }));

      it('should cache constraints separately per project/cluster combination', fakeAsync(() => {
        const constraints1: Constraint[] = [{name: 'constraint-1'} as Constraint];
        const constraints2: Constraint[] = [{name: 'constraint-2'} as Constraint];

        // First subscription
        service.constraints('project-1', 'cluster-1').subscribe();
        const req1 = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/constraints`
        );
        req1.flush(constraints1);

        // Second subscription (different project)
        service.constraints('project-2', 'cluster-1').subscribe();
        const req2 = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-2/clusters/cluster-1/constraints`
        );
        req2.flush(constraints2);

        tick();
      }));

      it('should return empty array on error (graceful fallback)', fakeAsync(() => {
        service.constraints('project-1', 'cluster-1').subscribe((result) => {
          expect(result).toEqual([]);
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/constraints`
        );
        req.error(new ErrorEvent('Network error'));
        tick();
      }));

      it('should return empty array on 404 not found', fakeAsync(() => {
        service.constraints('project-1', 'cluster-1').subscribe((result) => {
          expect(result).toEqual([]);
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/constraints`
        );
        req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
        tick();
      }));
    });

    describe('createConstraint', () => {
      it('should POST constraint to correct endpoint', () => {
        const constraint: Constraint = {name: 'new-constraint'} as Constraint;

        service.createConstraint('project-1', 'cluster-1', constraint).subscribe();

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/constraints`
        );
        expect(req.method).toBe('POST');
        expect(req.request.body).toEqual(constraint);
        req.flush(constraint);
      });

      it('should return created constraint', (done) => {
        const constraint: Constraint = {name: 'new-constraint'} as Constraint;

        service.createConstraint('project-1', 'cluster-1', constraint).subscribe((result) => {
          expect(result).toEqual(constraint);
          done();
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/constraints`
        );
        req.flush(constraint);
      });

      it('should handle 400 bad request on create', (done) => {
        service.createConstraint('project-1', 'cluster-1', {} as Constraint).subscribe({
          error: (error) => {
            expect(error.status).toBe(400);
            done();
          },
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/constraints`
        );
        req.flush({message: 'Invalid constraint'}, {status: 400, statusText: 'Bad Request'});
      });

      it('should handle 409 conflict (constraint already exists)', (done) => {
        service.createConstraint('project-1', 'cluster-1', {name: 'existing'} as Constraint).subscribe({
          error: (error) => {
            expect(error.status).toBe(409);
            done();
          },
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/constraints`
        );
        req.flush({message: 'Already exists'}, {status: 409, statusText: 'Conflict'});
      });
    });

    describe('patchConstraint', () => {
      it('should PATCH constraint to correct endpoint', () => {
        const patch: Constraint = {name: 'constraint-1'} as Constraint;

        service.patchConstraint('project-1', 'cluster-1', 'constraint-1', patch).subscribe();

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/constraints/constraint-1`
        );
        expect(req.method).toBe('PATCH');
        req.flush(patch);
      });

      it('should handle 404 not found on patch', (done) => {
        service.patchConstraint('project-1', 'cluster-1', 'nonexistent', {} as Constraint).subscribe({
          error: (error) => {
            expect(error.status).toBe(404);
            done();
          },
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/constraints/nonexistent`
        );
        req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
      });
    });

    describe('deleteConstraint', () => {
      it('should DELETE constraint', () => {
        service.deleteConstraint('project-1', 'cluster-1', 'constraint-1').subscribe();

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/constraints/constraint-1`
        );
        expect(req.method).toBe('DELETE');
        req.flush(null);
      });

      it('should handle successful delete', (done) => {
        service.deleteConstraint('project-1', 'cluster-1', 'constraint-1').subscribe(() => {
          done();
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/constraints/constraint-1`
        );
        req.flush(null);
      });

      it('should handle 404 not found on delete', (done) => {
        service.deleteConstraint('project-1', 'cluster-1', 'nonexistent').subscribe({
          error: (error) => {
            expect(error.status).toBe(404);
            done();
          },
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/constraints/nonexistent`
        );
        req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
      });
    });
  });

  describe('default constraints (global)', () => {
    describe('defaultConstraints getter', () => {
      it('should GET default constraints', fakeAsync(() => {
        const constraints: Constraint[] = [{name: 'default-1'} as Constraint];

        service.defaultConstraints.subscribe((result) => {
          expect(result).toEqual(constraints);
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constraints`);
        expect(req.method).toBe('GET');
        req.flush(constraints);
        tick();
      }));

      it('should cache default constraints on second subscription', fakeAsync(() => {
        const constraints: Constraint[] = [{name: 'default-1'} as Constraint];

        service.defaultConstraints.subscribe();
        const req1 = httpController.expectOne(`http://localhost:8080/api/v2/constraints`);
        req1.flush(constraints);

        // Second subscription should use cache
        service.defaultConstraints.subscribe((result) => {
          expect(result).toEqual(constraints);
        });

        httpController.expectNone(`http://localhost:8080/api/v2/constraints`);
        tick();
      }));

      it('should return empty array on error', fakeAsync(() => {
        service.defaultConstraints.subscribe((result) => {
          expect(result).toEqual([]);
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constraints`);
        req.error(new ErrorEvent('Network error'));
        tick();
      }));
    });

    describe('createDefaultConstraint', () => {
      it('should POST default constraint', () => {
        const constraint: Constraint = {name: 'default-constraint'} as Constraint;

        service.createDefaultConstraint(constraint).subscribe();

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constraints`);
        expect(req.method).toBe('POST');
        req.flush(constraint);
      });

      it('should handle error on create', (done) => {
        service.createDefaultConstraint({} as Constraint).subscribe({
          error: (error) => {
            expect(error.status).toBe(400);
            done();
          },
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constraints`);
        req.flush({message: 'Invalid'}, {status: 400, statusText: 'Bad Request'});
      });
    });

    describe('patchDefaultConstraint', () => {
      it('should PATCH default constraint', () => {
        const patch: Constraint = {name: 'default-1'} as Constraint;

        service.patchDefaultConstraint('default-1', patch).subscribe();

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constraints/default-1`);
        expect(req.method).toBe('PATCH');
        req.flush(patch);
      });

      it('should handle 404 not found on patch', (done) => {
        service.patchDefaultConstraint('nonexistent', {} as Constraint).subscribe({
          error: (error) => {
            expect(error.status).toBe(404);
            done();
          },
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constraints/nonexistent`);
        req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
      });
    });

    describe('deleteDefaultConstraint', () => {
      it('should DELETE default constraint', () => {
        service.deleteDefaultConstraint('default-1').subscribe();

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constraints/default-1`);
        expect(req.method).toBe('DELETE');
        req.flush(null);
      });

      it('should handle error on delete', (done) => {
        service.deleteDefaultConstraint('default-1').subscribe({
          error: (error) => {
            expect(error.status).toBe(403);
            done();
          },
        });

        const req = httpController.expectOne(`http://localhost:8080/api/v2/constraints/default-1`);
        req.flush({message: 'Forbidden'}, {status: 403, statusText: 'Forbidden'});
      });
    });

    describe('refreshDefaultConstraints', () => {
      it('should trigger new HTTP request on refresh', fakeAsync(() => {
        const constraints1: Constraint[] = [{name: 'default-1'} as Constraint];
        const constraints2: Constraint[] = [{name: 'default-2'} as Constraint];

        service.defaultConstraints.subscribe();
        const req1 = httpController.expectOne(`http://localhost:8080/api/v2/constraints`);
        req1.flush(constraints1);

        service.refreshDefaultConstraints();

        service.defaultConstraints.subscribe();
        const req2 = httpController.expectOne(`http://localhost:8080/api/v2/constraints`);
        req2.flush(constraints2);

        tick();
      }));
    });
  });

  describe('gatekeeper config', () => {
    describe('gatekeeperConfig getter', () => {
      it('should GET gatekeeper config with project and cluster ID', fakeAsync(() => {
        const config: GatekeeperConfig = {metadata: {name: 'config'}} as GatekeeperConfig;

        service.gatekeeperConfig('project-1', 'cluster-1').subscribe((result) => {
          expect(result).toEqual(config);
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/gatekeeper/config`
        );
        expect(req.method).toBe('GET');
        req.flush(config);
        tick();
      }));

      it('should cache gatekeeper config separately per project/cluster', fakeAsync(() => {
        const config1: GatekeeperConfig = {metadata: {name: 'config-1'}} as GatekeeperConfig;
        const config2: GatekeeperConfig = {metadata: {name: 'config-2'}} as GatekeeperConfig;

        service.gatekeeperConfig('project-1', 'cluster-1').subscribe();
        const req1 = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/gatekeeper/config`
        );
        req1.flush(config1);

        service.gatekeeperConfig('project-2', 'cluster-2').subscribe();
        const req2 = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-2/clusters/cluster-2/gatekeeper/config`
        );
        req2.flush(config2);

        tick();
      }));

      it('should return undefined on error (graceful fallback)', fakeAsync(() => {
        service.gatekeeperConfig('project-1', 'cluster-1').subscribe((result) => {
          expect(result).toBeUndefined();
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/gatekeeper/config`
        );
        req.error(new ErrorEvent('Network error'));
        tick();
      }));

      it('should return undefined on 404 not found', fakeAsync(() => {
        service.gatekeeperConfig('project-1', 'cluster-1').subscribe((result) => {
          expect(result).toBeUndefined();
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/gatekeeper/config`
        );
        req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
        tick();
      }));
    });

    describe('createGatekeeperConfig', () => {
      it('should POST gatekeeper config', () => {
        const config: GatekeeperConfig = {metadata: {name: 'config'}} as GatekeeperConfig;

        service.createGatekeeperConfig('project-1', 'cluster-1', config).subscribe();

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/gatekeeper/config`
        );
        expect(req.method).toBe('POST');
        req.flush(config);
      });

      it('should handle error on create', (done) => {
        service.createGatekeeperConfig('project-1', 'cluster-1', {} as GatekeeperConfig).subscribe({
          error: (error) => {
            expect(error.status).toBe(400);
            done();
          },
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/gatekeeper/config`
        );
        req.flush({message: 'Invalid'}, {status: 400, statusText: 'Bad Request'});
      });
    });

    describe('patchGatekeeperConfig', () => {
      it('should PATCH gatekeeper config', () => {
        const patch: GatekeeperConfig = {metadata: {name: 'config'}} as GatekeeperConfig;

        service.patchGatekeeperConfig('project-1', 'cluster-1', patch).subscribe();

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/gatekeeper/config`
        );
        expect(req.method).toBe('PATCH');
        req.flush(patch);
      });

      it('should handle error on patch', (done) => {
        service.patchGatekeeperConfig('project-1', 'cluster-1', {} as GatekeeperConfig).subscribe({
          error: (error) => {
            expect(error.status).toBe(500);
            done();
          },
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/gatekeeper/config`
        );
        req.flush({message: 'Server error'}, {status: 500, statusText: 'Internal Server Error'});
      });
    });

    describe('deleteGatekeeperConfig', () => {
      it('should DELETE gatekeeper config', () => {
        service.deleteGatekeeperConfig('project-1', 'cluster-1').subscribe();

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/gatekeeper/config`
        );
        expect(req.method).toBe('DELETE');
        req.flush(null);
      });

      it('should handle successful delete', (done) => {
        service.deleteGatekeeperConfig('project-1', 'cluster-1').subscribe(() => {
          done();
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/gatekeeper/config`
        );
        req.flush(null);
      });

      it('should handle error on delete', (done) => {
        service.deleteGatekeeperConfig('project-1', 'cluster-1').subscribe({
          error: (error) => {
            expect(error.status).toBe(403);
            done();
          },
        });

        const req = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/gatekeeper/config`
        );
        req.flush({message: 'Forbidden'}, {status: 403, statusText: 'Forbidden'});
      });
    });

    describe('refreshGatekeeperConfig', () => {
      it('should trigger new HTTP request on refresh', fakeAsync(() => {
        const config1: GatekeeperConfig = {metadata: {name: 'config-1'}} as GatekeeperConfig;
        const config2: GatekeeperConfig = {metadata: {name: 'config-2'}} as GatekeeperConfig;

        service.gatekeeperConfig('project-1', 'cluster-1').subscribe();
        const req1 = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/gatekeeper/config`
        );
        req1.flush(config1);

        service.refreshGatekeeperConfig();

        service.gatekeeperConfig('project-1', 'cluster-1').subscribe();
        const req2 = httpController.expectOne(
          `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/gatekeeper/config`
        );
        req2.flush(config2);

        tick();
      }));
    });
  });

  describe('violation page index management', () => {
    it('should get violation page index', () => {
      const index = 2;
      service.saveViolationPageIndex('project-1', 'cluster-1', 'constraint-1', index);

      const result = service.getViolationPageIndex('project-1', 'cluster-1', 'constraint-1');
      expect(result).toBe(2);
    });

    it('should return undefined for unsaved index', () => {
      const result = service.getViolationPageIndex('project-x', 'cluster-x', 'constraint-x');
      expect(result).toBeUndefined();
    });

    it('should handle multiple violation indexes', () => {
      service.saveViolationPageIndex('project-1', 'cluster-1', 'constraint-1', 1);
      service.saveViolationPageIndex('project-1', 'cluster-1', 'constraint-2', 2);
      service.saveViolationPageIndex('project-2', 'cluster-1', 'constraint-1', 3);

      expect(service.getViolationPageIndex('project-1', 'cluster-1', 'constraint-1')).toBe(1);
      expect(service.getViolationPageIndex('project-1', 'cluster-1', 'constraint-2')).toBe(2);
      expect(service.getViolationPageIndex('project-2', 'cluster-1', 'constraint-1')).toBe(3);
    });
  });

  describe('concurrent requests', () => {
    it('should handle concurrent requests to different endpoints', () => {
      service.constraintTemplates.subscribe();
      service.defaultConstraints.subscribe();

      const req1 = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates`);
      const req2 = httpController.expectOne(`http://localhost:8080/api/v2/constraints`);

      expect(req1.method).toBe('GET');
      expect(req2.method).toBe('GET');

      req1.flush([]);
      req2.flush([]);
    });

    it('should handle concurrent create and list requests', () => {
      service.createConstraintTemplate({name: 'new'} as ConstraintTemplate).subscribe();
      service.constraintTemplates.subscribe();

      const postReq = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates`);
      const getReq = httpController.expectOne(`http://localhost:8080/api/v2/constrainttemplates`);

      expect(postReq.method).toBe('POST');
      expect(getReq.method).toBe('GET');

      postReq.flush({});
      getReq.flush([]);
    });
  });
});
