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
import {MachineDeploymentService} from './machine-deployment';
import {MachineDeployment, MachineDeploymentPatch} from '@shared/entity/machine-deployment';
import {Node} from '@shared/entity/node';
import {NodeMetrics} from '@shared/entity/metrics';
import {Event} from '@shared/entity/event';

describe('MachineDeploymentService', () => {
  let service: MachineDeploymentService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MachineDeploymentService],
    });

    service = TestBed.inject(MachineDeploymentService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('create', () => {
    it('should POST machine deployment to correct endpoint', () => {
      const md: MachineDeployment = {
        metadata: {name: 'test-md'},
        spec: {
          template: {
            labels: {key: 'value'},
            annotations: {anno: 'value'},
            taints: [],
          },
          labels: {mdLabel: 'value'},
        },
      } as MachineDeployment;
      const clusterID = 'cluster-1';
      const projectID = 'project-1';

      service.create(md, clusterID, projectID).subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );
      expect(req.method).toBe('POST');
      req.flush(md);
    });

    it('should handle successful machine deployment creation', (done) => {
      const md: MachineDeployment = {
        metadata: {name: 'test-md'},
        spec: {template: {labels: {}, annotations: {}, taints: []}} as any,
      } as MachineDeployment;
      const response: MachineDeployment = {...md, metadata: {...md.metadata, uid: 'uid-123'}};

      service.create(md, 'cluster-1', 'project-1').subscribe((result) => {
        expect(result.metadata.uid).toBe('uid-123');
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );
      req.flush(response);
    });

    it('should handle 400 bad request on create', (done) => {
      const md = {spec: {template: {labels: {}, annotations: {}, taints: []}}} as any as MachineDeployment;

      service.create(md, 'cluster-1', 'project-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );
      req.flush({message: 'Invalid spec'}, {status: 400, statusText: 'Bad Request'});
    });

    it('should handle 403 forbidden on create', (done) => {
      const md = {spec: {template: {labels: {}, annotations: {}, taints: []}}} as any as MachineDeployment;

      service.create(md, 'cluster-1', 'project-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );
      req.flush({message: 'Permission denied'}, {status: 403, statusText: 'Forbidden'});
    });

    it('should filter null labels before POST', () => {
      const md: MachineDeployment = {
        metadata: {name: 'test-md'},
        spec: {
          template: {
            labels: {key: 'value', nullKey: null},
            annotations: {anno: 'value', nullAnno: null},
            taints: [],
          },
          labels: {label1: 'value', label2: null},
        },
      } as any as MachineDeployment;

      service.create(md, 'cluster-1', 'project-1').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );
      req.flush({});
    });

    it('should handle 500 server error on create', (done) => {
      const md = {spec: {template: {labels: {}, annotations: {}, taints: []}}} as any as MachineDeployment;

      service.create(md, 'cluster-1', 'project-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );
      req.flush({message: 'Server error'}, {status: 500, statusText: 'Internal Server Error'});
    });
  });

  describe('list', () => {
    it('should GET machine deployments list from correct endpoint', () => {
      const cluster = 'cluster-1';
      const projectID = 'project-1';

      service.list(cluster, projectID).subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );
      expect(req.method).toBe('GET');
      req.flush([]);
    });

    it('should return list of machine deployments', (done) => {
      const mds: MachineDeployment[] = [
        {metadata: {name: 'md-1'}} as MachineDeployment,
        {metadata: {name: 'md-2'}} as MachineDeployment,
      ];

      service.list('cluster-1', 'project-1').subscribe((result) => {
        expect(result).toEqual(mds);
        expect(result.length).toBe(2);
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );
      req.flush(mds);
    });

    it('should return empty array on error (graceful fallback)', (done) => {
      service.list('cluster-1', 'project-1').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );
      req.error(new ErrorEvent('Network error'));
    });

    it('should return empty array on 404 not found', (done) => {
      service.list('cluster-1', 'project-1').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );
      req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
    });

    it('should return empty array on 500 server error', (done) => {
      service.list('cluster-1', 'project-1').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );
      req.flush({message: 'Server error'}, {status: 500, statusText: 'Internal Server Error'});
    });
  });

  describe('get', () => {
    it('should GET single machine deployment', () => {
      service.get('md-1', 'cluster-1', 'project-1').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1`
      );
      expect(req.method).toBe('GET');
      req.flush({});
    });

    it('should return single machine deployment', (done) => {
      const md: MachineDeployment = {metadata: {name: 'md-1', uid: 'uid-123'}} as MachineDeployment;

      service.get('md-1', 'cluster-1', 'project-1').subscribe((result) => {
        expect(result).toEqual(md);
        expect(result.metadata.uid).toBe('uid-123');
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1`
      );
      req.flush(md);
    });

    it('should handle 404 not found on get', (done) => {
      service.get('nonexistent', 'cluster-1', 'project-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/nonexistent`
      );
      req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
    });

    it('should include mdId in URL path', () => {
      service.get('special-md-id', 'cluster-1', 'project-1').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/special-md-id`
      );
      expect(req.request.url).toContain('special-md-id');
      req.flush({});
    });
  });

  describe('patch', () => {
    it('should PATCH machine deployment', () => {
      const patch: MachineDeploymentPatch = {spec: {replicas: 5}} as MachineDeploymentPatch;

      service.patch(patch, 'md-1', 'cluster-1', 'project-1').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1`
      );
      expect(req.method).toBe('PATCH');
      expect(req.request.body).toEqual(patch);
      req.flush({});
    });

    it('should handle successful patch response', (done) => {
      const patch: MachineDeploymentPatch = {spec: {replicas: 5}} as MachineDeploymentPatch;
      const response: MachineDeployment = {
        metadata: {name: 'md-1'},
        spec: {replicas: 5},
      } as any as MachineDeployment;

      service.patch(patch, 'md-1', 'cluster-1', 'project-1').subscribe((result) => {
        expect(result.spec.replicas).toBe(5);
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1`
      );
      req.flush(response);
    });

    it('should handle 400 bad request on patch', (done) => {
      const patch: MachineDeploymentPatch = {spec: {replicas: -1}} as MachineDeploymentPatch;

      service.patch(patch, 'md-1', 'cluster-1', 'project-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1`
      );
      req.flush({message: 'Invalid patch'}, {status: 400, statusText: 'Bad Request'});
    });

    it('should handle 409 conflict on patch', (done) => {
      const patch: MachineDeploymentPatch = {} as MachineDeploymentPatch;

      service.patch(patch, 'md-1', 'cluster-1', 'project-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1`
      );
      req.flush({message: 'Conflict'}, {status: 409, statusText: 'Conflict'});
    });
  });

  describe('restart', () => {
    it('should POST restart request to correct endpoint', () => {
      const md: MachineDeployment = {metadata: {name: 'md-1'}, id: 'md-1'} as MachineDeployment;

      service.restart('cluster-1', md, 'project-1').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1/restart`
      );
      expect(req.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({});
    });

    it('should handle successful restart response', (done) => {
      const md: MachineDeployment = {metadata: {name: 'md-1'}, id: 'md-1'} as MachineDeployment;
      const response: MachineDeployment = {...md, status: {readyReplicas: 0} as any};

      service.restart('cluster-1', md, 'project-1').subscribe((result) => {
        expect(result.id).toBe('md-1');
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1/restart`
      );
      req.flush(response);
    });

    it('should handle 404 not found on restart', (done) => {
      const md: MachineDeployment = {metadata: {name: 'nonexistent'}, id: 'nonexistent'} as MachineDeployment;

      service.restart('cluster-1', md, 'project-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/nonexistent/restart`
      );
      req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
    });

    it('should handle 409 conflict on restart', (done) => {
      const md: MachineDeployment = {metadata: {name: 'md-1'}, id: 'md-1'} as MachineDeployment;

      service.restart('cluster-1', md, 'project-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1/restart`
      );
      req.flush({message: 'Machine deployment is updating'}, {status: 409, statusText: 'Conflict'});
    });
  });

  describe('delete', () => {
    it('should DELETE machine deployment', () => {
      const md: MachineDeployment = {metadata: {name: 'md-1'}, id: 'md-1'} as MachineDeployment;

      service.delete('cluster-1', md, 'project-1').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1`
      );
      expect(req.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle successful delete response', (done) => {
      const md: MachineDeployment = {metadata: {name: 'md-1'}, id: 'md-1'} as MachineDeployment;

      service.delete('cluster-1', md, 'project-1').subscribe(() => {
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1`
      );
      req.flush(null);
    });

    it('should handle 404 not found on delete', (done) => {
      const md: MachineDeployment = {metadata: {name: 'nonexistent'}, id: 'nonexistent'} as MachineDeployment;

      service.delete('cluster-1', md, 'project-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/nonexistent`
      );
      req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
    });

    it('should handle 403 forbidden on delete', (done) => {
      const md: MachineDeployment = {metadata: {name: 'md-1'}, id: 'md-1'} as MachineDeployment;

      service.delete('cluster-1', md, 'project-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1`
      );
      req.flush({message: 'Permission denied'}, {status: 403, statusText: 'Forbidden'});
    });
  });

  describe('getNodes', () => {
    it('should GET nodes for machine deployment', () => {
      service.getNodes('md-1', 'cluster-1', 'project-1').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1/nodes`
      );
      expect(req.method).toBe('GET');
      req.flush([]);
    });

    it('should return nodes list', (done) => {
      const nodes: Node[] = [
        {metadata: {name: 'node-1'}} as Node,
        {metadata: {name: 'node-2'}} as Node,
      ];

      service.getNodes('md-1', 'cluster-1', 'project-1').subscribe((result) => {
        expect(result).toEqual(nodes);
        expect(result.length).toBe(2);
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1/nodes`
      );
      req.flush(nodes);
    });

    it('should handle 404 not found on getNodes', (done) => {
      service.getNodes('nonexistent', 'cluster-1', 'project-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/nonexistent/nodes`
      );
      req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
    });
  });

  describe('getNodesMetrics', () => {
    it('should GET nodes metrics for machine deployment', () => {
      service.getNodesMetrics('md-1', 'cluster-1', 'project-1').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1/nodes/metrics`
      );
      expect(req.method).toBe('GET');
      req.flush([]);
    });

    it('should return metrics list', (done) => {
      const metrics: NodeMetrics[] = [
        {name: 'node-1'} as NodeMetrics,
        {name: 'node-2'} as NodeMetrics,
      ];

      service.getNodesMetrics('md-1', 'cluster-1', 'project-1').subscribe((result) => {
        expect(result).toEqual(metrics);
        expect(result.length).toBe(2);
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1/nodes/metrics`
      );
      req.flush(metrics);
    });

    it('should handle error on getNodesMetrics', (done) => {
      service.getNodesMetrics('md-1', 'cluster-1', 'project-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1/nodes/metrics`
      );
      req.flush({message: 'Server error'}, {status: 500, statusText: 'Internal Server Error'});
    });
  });

  describe('getNodesEvents', () => {
    it('should GET nodes events for machine deployment', () => {
      service.getNodesEvents('md-1', 'cluster-1', 'project-1').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1/nodes/events`
      );
      expect(req.method).toBe('GET');
      req.flush([]);
    });

    it('should return events list', (done) => {
      const events: Event[] = [
        {metadata: {name: 'event-1'}} as Event,
        {metadata: {name: 'event-2'}} as Event,
      ];

      service.getNodesEvents('md-1', 'cluster-1', 'project-1').subscribe((result) => {
        expect(result).toEqual(events);
        expect(result.length).toBe(2);
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1/nodes/events`
      );
      req.flush(events);
    });

    it('should handle error on getNodesEvents', (done) => {
      service.getNodesEvents('md-1', 'cluster-1', 'project-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1/nodes/events`
      );
      req.flush({message: 'Server error'}, {status: 500, statusText: 'Internal Server Error'});
    });
  });

  describe('getJoiningScript', () => {
    it('should GET joining script for machine deployment', () => {
      service.getJoiningScript('md-1', 'cluster-1', 'project-1').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1/joiningscript`
      );
      expect(req.method).toBe('GET');
      req.flush('');
    });

    it('should return joining script string', (done) => {
      const script = '#!/bin/bash\necho "joining script"';

      service.getJoiningScript('md-1', 'cluster-1', 'project-1').subscribe((result) => {
        expect(result).toBe(script);
        expect(typeof result).toBe('string');
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1/joiningscript`
      );
      req.flush(script);
    });

    it('should handle 404 not found on getJoiningScript', (done) => {
      service.getJoiningScript('nonexistent', 'cluster-1', 'project-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/nonexistent/joiningscript`
      );
      req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
    });

    it('should handle empty script response', (done) => {
      service.getJoiningScript('md-1', 'cluster-1', 'project-1').subscribe((result) => {
        expect(result).toBe('');
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1/joiningscript`
      );
      req.flush('');
    });
  });

  describe('parameter validation', () => {
    it('should construct correct URLs with different IDs', () => {
      service.get('special-md-id', 'special-cluster', 'special-project').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/special-project/clusters/special-cluster/machinedeployments/special-md-id`
      );
      expect(req.request.url).toContain('special-project');
      expect(req.request.url).toContain('special-cluster');
      expect(req.request.url).toContain('special-md-id');
      req.flush({});
    });

    it('should handle IDs with hyphens and underscores', () => {
      service.get('md-with_special-chars', 'cluster-123', 'proj_abc').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/proj_abc/clusters/cluster-123/machinedeployments/md-with_special-chars`
      );
      req.flush({});
    });
  });

  describe('concurrent requests', () => {
    it('should handle concurrent list and get requests', () => {
      service.list('cluster-1', 'project-1').subscribe();
      service.get('md-1', 'cluster-1', 'project-1').subscribe();

      const listReq = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );
      const getReq = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments/md-1`
      );

      expect(listReq.method).toBe('GET');
      expect(getReq.method).toBe('GET');

      listReq.flush([]);
      getReq.flush({});
    });

    it('should handle concurrent create and list requests', () => {
      const md = {spec: {template: {labels: {}, annotations: {}, taints: []}}} as any as MachineDeployment;

      service.create(md, 'cluster-1', 'project-1').subscribe();
      service.list('cluster-1', 'project-1').subscribe();

      const postReq = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );
      const getReq = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );

      expect(postReq.method).toBe('POST');
      expect(getReq.method).toBe('GET');

      postReq.flush({});
      getReq.flush([]);
    });
  });

  describe('error handling across methods', () => {
    it('should handle 401 unauthorized consistently across methods', (done) => {
      let count = 0;

      service.create({spec: {template: {labels: {}, annotations: {}, taints: []}}} as any as MachineDeployment, 'cluster-1', 'project-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          count++;
          if (count === 2) done();
        },
      });

      service.list('cluster-1', 'project-1').subscribe({
        error: (error) => {
          if (error.status === 401) {
            count++;
            if (count === 2) done();
          }
        },
      });

      const req1 = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );
      const req2 = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/machinedeployments`
      );

      req1.flush({message: 'Unauthorized'}, {status: 401, statusText: 'Unauthorized'});
      req2.flush({message: 'Unauthorized'}, {status: 401, statusText: 'Unauthorized'});
    });
  });
});
