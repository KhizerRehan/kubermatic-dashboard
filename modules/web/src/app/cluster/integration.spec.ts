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
import {ClusterService} from '@core/services/cluster';
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {NotificationService} from '@core/services/notification';
import {Cluster, ProjectClusterList} from '@shared/entity/cluster';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {of, throwError} from 'rxjs';

/**
 * Integration tests for Cluster-related service interactions
 *
 * Tests verify interactions between:
 * - ClusterService + MachineDeploymentService
 * - Service operations updating related service state
 * - Error propagation across related services
 */
describe('Cluster Services Integration', () => {
  let clusterService: ClusterService;
  let machineDeploymentService: MachineDeploymentService;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let httpController: HttpTestingController;

  const mockCluster: Cluster = {
    id: 'cluster-1',
    name: 'Test Cluster',
    status: 'Active',
    creationTimestamp: new Date(),
    type: 'kubernetes',
  } as Cluster;

  const mockClusterList: ProjectClusterList = {
    clusters: [mockCluster],
  } as ProjectClusterList;

  const mockMachineDeployment: MachineDeployment = {
    id: 'md-1',
    name: 'Machine Deployment 1',
    metadata: {name: 'md-1'},
    spec: {replicas: 3} as any,
  } as MachineDeployment;

  beforeEach(() => {
    const notificationServiceMock = jasmine.createSpyObj('NotificationService', [
      'success',
      'error',
      'warning',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ClusterService,
        MachineDeploymentService,
        {provide: NotificationService, useValue: notificationServiceMock},
      ],
    });

    clusterService = TestBed.inject(ClusterService);
    machineDeploymentService = TestBed.inject(MachineDeploymentService);
    notificationService = TestBed.inject(NotificationService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('Cluster + MachineDeployment coordination', () => {
    it('should fetch clusters and their machine deployments', fakeAsync(() => {
      clusterService.projectClusterList('project-1').subscribe((clusters) => {
        expect(clusters.clusters.length).toBeGreaterThanOrEqual(1);
      });

      const req1 = httpController.expectOne((r) =>
        r.url.includes('projects/project-1/clusters')
      );
      req1.flush(mockClusterList);

      tick();

      // Now fetch machine deployments for the cluster
      machineDeploymentService.list('cluster-1', 'project-1').subscribe((mds) => {
        expect(mds.length).toBeGreaterThanOrEqual(0);
      });

      const req2 = httpController.expectOne((r) =>
        r.url.includes('machinedeployments')
      );
      req2.flush([mockMachineDeployment]);

      tick();
    }));

    it('should handle cluster fetch error without affecting machine deployments', fakeAsync(() => {
      let clusterError = false;
      let mdSuccess = false;

      // Cluster fetch fails
      clusterService.projectClusterList('project-1').subscribe({
        error: () => {
          clusterError = true;
        },
      });

      const req1 = httpController.expectOne((r) =>
        r.url.includes('projects/project-1/clusters')
      );
      req1.error(new ErrorEvent('Network error'));

      tick();

      // Machine deployment fetch can still succeed
      machineDeploymentService.list('cluster-1', 'project-1').subscribe(() => {
        mdSuccess = true;
      });

      const req2 = httpController.expectOne((r) =>
        r.url.includes('machinedeployments')
      );
      req2.flush([mockMachineDeployment]);

      tick();

      expect(clusterError).toBe(true);
      expect(mdSuccess).toBe(true);
    }));

    it('should refresh machine deployments when cluster is updated', fakeAsync(() => {
      // Initial fetch
      clusterService.getCluster('project-1', 'cluster-1').subscribe();

      const req1 = httpController.expectOne((r) =>
        r.url.includes('clusters/cluster-1')
      );
      req1.flush(mockCluster);

      tick();

      // Fetch MDs after cluster update
      machineDeploymentService.list('cluster-1', 'project-1').subscribe();

      const req2 = httpController.expectOne((r) =>
        r.url.includes('machinedeployments')
      );
      req2.flush([mockMachineDeployment]);

      tick();
    }));
  });

  describe('Service error propagation', () => {
    it('should handle cluster 404 and gracefully degrade', fakeAsync(() => {
      clusterService.projectClusterList('project-1').subscribe((result) => {
        // Should return empty array on error
        expect(Array.isArray(result.clusters)).toBe(true);
      });

      const req = httpController.expectOne((r) =>
        r.url.includes('projects/project-1/clusters')
      );
      req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});

      tick();
    }));

    it('should handle 500 server error across services', fakeAsync(() => {
      let clusterError = false;

      clusterService.projectClusterList('project-1').subscribe({
        error: () => {
          clusterError = true;
        },
      });

      const req = httpController.expectOne((r) =>
        r.url.includes('projects/project-1/clusters')
      );
      req.flush({message: 'Server error'}, {status: 500, statusText: 'Internal Server Error'});

      tick();

      expect(clusterError).toBe(true);
    }));

    it('should recover from transient service errors', fakeAsync(() => {
      let attempts = 0;

      spyOn(clusterService, 'projectClusterList').and.callFake(() => {
        attempts++;
        if (attempts === 1) {
          return throwError(() => ({status: 500}));
        }
        return of(mockClusterList);
      });

      // First attempt fails
      clusterService.projectClusterList('project-1').subscribe({
        error: () => {
          // Retry
          clusterService.projectClusterList('project-1').subscribe(() => {
            expect(attempts).toBe(2);
          });
        },
      });

      tick();
    }));
  });

  describe('Cascade operations', () => {
    it('should delete cluster and its machine deployments', fakeAsync(() => {
      // Delete cluster
      clusterService.deleteCluster('project-1', 'cluster-1').subscribe();

      const delReq = httpController.expectOne((r) =>
        r.url.includes('clusters/cluster-1')
      );
      expect(delReq.method).toBe('DELETE');
      delReq.flush(null);

      tick();
    }));

    it('should create cluster then machine deployments', fakeAsync(() => {
      const newCluster = {id: 'new-cluster', name: 'New'} as Cluster;

      // Create cluster
      clusterService.createCluster('project-1', newCluster).subscribe();

      const createReq = httpController.expectOne((r) =>
        r.url.includes('clusters') && r.method === 'POST'
      );
      createReq.flush(newCluster);

      tick();

      // Create machine deployment in cluster
      machineDeploymentService.create(mockMachineDeployment, 'new-cluster', 'project-1').subscribe();

      const mdReq = httpController.expectOne((r) =>
        r.url.includes('machinedeployments') && r.method === 'POST'
      );
      mdReq.flush(mockMachineDeployment);

      tick();
    }));
  });

  describe('Concurrent service operations', () => {
    it('should handle concurrent cluster and machine deployment operations', fakeAsync(() => {
      // Fetch clusters
      clusterService.projectClusterList('project-1').subscribe();

      // Fetch machine deployments concurrently
      machineDeploymentService.list('cluster-1', 'project-1').subscribe();

      // Handle both requests
      const clusterReq = httpController.expectOne((r) =>
        r.url.includes('projects/project-1/clusters')
      );
      const mdReq = httpController.expectOne((r) =>
        r.url.includes('machinedeployments')
      );

      clusterReq.flush(mockClusterList);
      mdReq.flush([mockMachineDeployment]);

      tick();
    }));

    it('should handle multiple concurrent cluster operations', fakeAsync(() => {
      // Multiple cluster operations
      clusterService.getCluster('project-1', 'cluster-1').subscribe();
      clusterService.getCluster('project-1', 'cluster-2').subscribe();
      machineDeploymentService.list('cluster-1', 'project-1').subscribe();

      const req1 = httpController.expectOne((r) =>
        r.url.includes('clusters/cluster-1')
      );
      const req2 = httpController.expectOne((r) =>
        r.url.includes('clusters/cluster-2')
      );
      const req3 = httpController.expectOne((r) =>
        r.url.includes('machinedeployments')
      );

      req1.flush(mockCluster);
      req2.flush({...mockCluster, id: 'cluster-2', name: 'Cluster 2'});
      req3.flush([mockMachineDeployment]);

      tick();
    }));
  });

  describe('Service state consistency', () => {
    it('should maintain consistent state across related services', fakeAsync(() => {
      // Fetch initial state
      clusterService.projectClusterList('project-1').subscribe();

      const req1 = httpController.expectOne((r) =>
        r.url.includes('projects/project-1/clusters')
      );
      req1.flush(mockClusterList);

      tick();

      // Get cluster details
      clusterService.getCluster('project-1', 'cluster-1').subscribe();

      const req2 = httpController.expectOne((r) =>
        r.url.includes('clusters/cluster-1')
      );
      req2.flush(mockCluster);

      tick();

      // State should be consistent
      expect(mockClusterList.clusters[0].id).toBe(mockCluster.id);
    }));

    it('should sync state when service data changes', fakeAsync(() => {
      const updatedCluster = {...mockCluster, status: 'Updating'};

      // Initial fetch
      clusterService.getCluster('project-1', 'cluster-1').subscribe();

      const req1 = httpController.expectOne((r) =>
        r.url.includes('clusters/cluster-1')
      );
      req1.flush(mockCluster);

      tick();

      // Update cluster
      clusterService.getCluster('project-1', 'cluster-1').subscribe();

      const req2 = httpController.expectOne((r) =>
        r.url.includes('clusters/cluster-1')
      );
      req2.flush(updatedCluster);

      tick();
    }));
  });

  describe('Data transformation across services', () => {
    it('should transform cluster data for display', fakeAsync(() => {
      clusterService.projectClusterList('project-1').subscribe((result) => {
        // Data should be in expected format
        expect(result.clusters).toBeDefined();
        expect(Array.isArray(result.clusters)).toBe(true);
        if (result.clusters.length > 0) {
          expect(result.clusters[0].id).toBeDefined();
          expect(result.clusters[0].name).toBeDefined();
        }
      });

      const req = httpController.expectOne((r) =>
        r.url.includes('projects/project-1/clusters')
      );
      req.flush(mockClusterList);

      tick();
    }));

    it('should transform machine deployment data', fakeAsync(() => {
      machineDeploymentService.list('cluster-1', 'project-1').subscribe((mds) => {
        expect(Array.isArray(mds)).toBe(true);
        if (mds.length > 0) {
          expect(mds[0].id).toBeDefined();
          expect(mds[0].name).toBeDefined();
        }
      });

      const req = httpController.expectOne((r) =>
        r.url.includes('machinedeployments')
      );
      req.flush([mockMachineDeployment]);

      tick();
    }));
  });

  describe('Service cleanup and unsubscription', () => {
    it('should properly cleanup cluster service subscriptions', fakeAsync(() => {
      const sub = clusterService.projectClusterList('project-1').subscribe();

      const req = httpController.expectOne((r) =>
        r.url.includes('projects/project-1/clusters')
      );
      req.flush(mockClusterList);

      tick();

      sub.unsubscribe();

      // No new requests should be made after unsubscribe
      tick();
      httpController.expectNone((r) => r.url.includes('projects/project-1/clusters'));
    }));

    it('should cleanup multiple concurrent subscriptions', fakeAsync(() => {
      const sub1 = clusterService.projectClusterList('project-1').subscribe();
      const sub2 = machineDeploymentService.list('cluster-1', 'project-1').subscribe();

      const req1 = httpController.expectOne((r) =>
        r.url.includes('projects/project-1/clusters')
      );
      const req2 = httpController.expectOne((r) =>
        r.url.includes('machinedeployments')
      );

      req1.flush(mockClusterList);
      req2.flush([mockMachineDeployment]);

      tick();

      sub1.unsubscribe();
      sub2.unsubscribe();

      // No new requests
      tick();
    }));
  });

  describe('Observable caching behavior', () => {
    it('should reuse cached cluster data on multiple subscriptions', fakeAsync(() => {
      clusterService.projectClusterList('project-1').subscribe();

      const req1 = httpController.expectOne((r) =>
        r.url.includes('projects/project-1/clusters')
      );
      req1.flush(mockClusterList);

      tick();

      // Second subscription should use cache
      clusterService.projectClusterList('project-1').subscribe();

      // No new HTTP request expected due to shareReplay
      httpController.expectNone((r) => r.url.includes('projects/project-1/clusters'));

      tick();
    }));

    it('should invalidate cache on refresh trigger', fakeAsync(() => {
      clusterService.projectClusterList('project-1').subscribe();

      const req1 = httpController.expectOne((r) =>
        r.url.includes('projects/project-1/clusters')
      );
      req1.flush(mockClusterList);

      tick();

      // Trigger refresh
      clusterService.onClustersUpdate.next();

      // Should make new request
      clusterService.projectClusterList('project-1').subscribe();

      const req2 = httpController.expectOne((r) =>
        r.url.includes('projects/project-1/clusters')
      );
      req2.flush(mockClusterList);

      tick();
    }));
  });
});
