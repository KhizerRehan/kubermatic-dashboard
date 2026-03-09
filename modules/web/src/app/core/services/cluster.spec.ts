// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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
import {lastValueFrom} from 'rxjs';
import {MatDialogModule} from '@angular/material/dialog';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {RouterTestingModule} from '@angular/router/testing';

import {AppConfigService} from '@app/config.service';

import {environment} from '@environments/environment';

import {fakeProject} from '@test/data/project';
import {RequestType} from '@test/types/request-type';
import {machineDeploymentsFake} from '@test/data/node';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {AppConfigMockService} from '@test/services/app-config-mock';

import {ClusterService} from './cluster';

describe('ClusterService', () => {
  let service: ClusterService;
  let httpController: HttpTestingController;

  const mockMachineDeploymentID = machineDeploymentsFake()[0].id;
  const mockClusterID = fakeDigitaloceanCluster().id;
  const mockProjectID = fakeProject().id;
  const mockCluster = fakeDigitaloceanCluster();

  const newRestRoot = environment.newRestRoot;
  const restRoot = environment.restRoot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClusterService, {provide: AppConfigService, useClass: AppConfigMockService}],
      imports: [HttpClientTestingModule, MatDialogModule, MatSnackBarModule, RouterTestingModule],
    });
    httpController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ClusterService);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('projectClusterList()', () => {
    it('should fetch clusters for project', async () => {
      const result = lastValueFrom(service.projectClusterList(mockProjectID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters`);
      expect(req.request.method).toBe(RequestType.GET);

      req.flush({clusters: [mockCluster]});

      const clusterList = await result;
      expect(clusterList.clusters).toBeTruthy();
    });

    it('should cache cluster list observable', async () => {
      const result1 = lastValueFrom(service.projectClusterList(mockProjectID));
      const req1 = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters`);
      req1.flush({clusters: [mockCluster]});
      await result1;

      // Second call should use cache
      const result2 = lastValueFrom(service.projectClusterList(mockProjectID));
      httpController.expectNone(`${restRoot}/projects/${mockProjectID}/clusters`);
      const clusterList2 = await result2;

      expect(clusterList2).toBeTruthy();
    });

    it('should fetch empty clusters list', async () => {
      const result = lastValueFrom(service.projectClusterList(mockProjectID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters`);
      req.flush({clusters: []});

      const clusterList = await result;
      expect(clusterList.clusters.length).toBe(0);
    });

    it('should handle API error gracefully', async () => {
      const result = lastValueFrom(service.projectClusterList(mockProjectID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters`);
      req.error(new ErrorEvent('Network error'));

      try {
        await result;
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it('should include machine deployment count when requested', async () => {
      const result = lastValueFrom(service.projectClusterList(mockProjectID, true));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters?machineDeploymentCount=true`);
      expect(req.request.method).toBe(RequestType.GET);

      req.flush({clusters: [mockCluster]});

      const clusterList = await result;
      expect(clusterList.clusters).toBeTruthy();
    });
  });

  describe('clusters()', () => {
    it('should get clusters array from project cluster list', async () => {
      const result = lastValueFrom(service.clusters(mockProjectID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters`);
      req.flush({clusters: [mockCluster]});

      const clusters = await result;
      expect(clusters.length).toBeGreaterThan(0);
      expect(clusters[0].id).toBe(mockCluster.id);
    });

    it('should handle empty clusters array', async () => {
      const result = lastValueFrom(service.clusters(mockProjectID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters`);
      req.flush({clusters: []});

      const clusters = await result;
      expect(clusters).toEqual([]);
    });
  });

  describe('createCluster()', () => {
    it('should create cluster for project', async () => {
      const clusterModel = {spec: mockCluster.spec};
      const result = lastValueFrom(service.createCluster(mockProjectID, clusterModel as any));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(clusterModel);

      req.flush(mockCluster);

      const cluster = await result;
      expect(cluster.id).toBe(mockCluster.id);
    });

    it('should handle create cluster error (400 Bad Request)', async () => {
      const clusterModel = {spec: mockCluster.spec};
      const result = lastValueFrom(service.createCluster(mockProjectID, clusterModel as any));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters`);
      req.error(new ErrorEvent('Invalid cluster spec'), {status: 400});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it('should handle create cluster error (403 Forbidden)', async () => {
      const clusterModel = {spec: mockCluster.spec};
      const result = lastValueFrom(service.createCluster(mockProjectID, clusterModel as any));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters`);
      req.error(new ErrorEvent('Permission denied'), {status: 403});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe('deleteCluster()', () => {
    it('should delete cluster from project', async () => {
      const result = lastValueFrom(service.deleteCluster(mockProjectID, mockClusterID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters/${mockClusterID}`);
      expect(req.request.method).toBe('DELETE');

      req.flush({});

      await result;
      expect(true).toBe(true); // No error means success
    });

    it('should handle delete cluster error (404 Not Found)', async () => {
      const result = lastValueFrom(service.deleteCluster(mockProjectID, mockClusterID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters/${mockClusterID}`);
      req.error(new ErrorEvent('Cluster not found'), {status: 404});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it('should handle delete cluster error (403 Forbidden)', async () => {
      const result = lastValueFrom(service.deleteCluster(mockProjectID, mockClusterID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters/${mockClusterID}`);
      req.error(new ErrorEvent('Permission denied'), {status: 403});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe('getCluster()', () => {
    it('should fetch single cluster by ID', async () => {
      const result = lastValueFrom(service.getCluster(mockProjectID, mockClusterID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters/${mockClusterID}`);
      expect(req.request.method).toBe(RequestType.GET);

      req.flush(mockCluster);

      const cluster = await result;
      expect(cluster.id).toBe(mockClusterID);
    });

    it('should cache cluster observable', async () => {
      const result1 = lastValueFrom(service.getCluster(mockProjectID, mockClusterID));
      const req1 = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters/${mockClusterID}`);
      req1.flush(mockCluster);
      await result1;

      // Second call should use cache
      const result2 = lastValueFrom(service.getCluster(mockProjectID, mockClusterID));
      httpController.expectNone(`${restRoot}/projects/${mockProjectID}/clusters/${mockClusterID}`);
      const cluster2 = await result2;

      expect(cluster2).toBeTruthy();
    });

    it('should handle get cluster error (404 Not Found)', async () => {
      const result = lastValueFrom(service.getCluster(mockProjectID, mockClusterID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters/${mockClusterID}`);
      req.error(new ErrorEvent('Cluster not found'), {status: 404});

      try {
        await result;
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe('External Machine Deployment Operations', () => {
    it('should dispatch correct URL with GET request when externalMachineDeploymentNodes() is called', () => {
      lastValueFrom(service.externalMachineDeploymentNodes(mockProjectID, mockClusterID, mockMachineDeploymentID));
      const req = httpController.expectOne(
        `${newRestRoot}/projects/${mockProjectID}/kubernetes/clusters/${mockClusterID}/machinedeployments/${mockMachineDeploymentID}/nodes`
      );
      expect(req.request.method).toBe(RequestType.GET);
      req.flush({});
    });

    it('should dispatch correct URL with GET request when externalMachineDeploymentNodesMetrics() is called', () => {
      lastValueFrom(service.externalMachineDeploymentNodesMetrics(mockProjectID, mockClusterID, mockMachineDeploymentID));
      const req = httpController.expectOne(
        `${newRestRoot}/projects/${mockProjectID}/kubernetes/clusters/${mockClusterID}/machinedeployments/${mockMachineDeploymentID}/nodes/metrics`
      );
      expect(req.request.method).toBe(RequestType.GET);
      req.flush({});
    });

    it('should dispatch correct URL with GET request when externalMachineDeploymentNodesEvents() is called', () => {
      lastValueFrom(service.externalMachineDeploymentNodesEvents(mockProjectID, mockClusterID, mockMachineDeploymentID));
      const req = httpController.expectOne(
        `${newRestRoot}/projects/${mockProjectID}/kubernetes/clusters/${mockClusterID}/machinedeployments/${mockMachineDeploymentID}/nodes/events`
      );
      expect(req.request.method).toBe(RequestType.GET);
      req.flush({});
    });
  });

  describe('Observable Refresh and Cache Management', () => {
    it('should refresh cluster list via onClusterUpdate subject', (done) => {
      const result = lastValueFrom(service.projectClusterList(mockProjectID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters`);
      req.flush({clusters: [mockCluster]});

      result.then(() => {
        // Trigger update
        service.onClusterUpdate.next();

        // This should trigger a new request
        const newReq = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters`);
        newReq.flush({clusters: [mockCluster]});
        done();
      });
    });

    it('should emit providerSettingsPatchChanges when updated', (done) => {
      const patch = {provider: 'digitalocean'};

      service.providerSettingsPatchChanges$.subscribe(changePatch => {
        expect(changePatch.provider).toBe('digitalocean');
        done();
      });

      service.changeProviderSettingsPatch(patch as any);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle server errors gracefully in projectClusterList', async () => {
      const result = lastValueFrom(service.projectClusterList(mockProjectID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters`);
      req.error(new ErrorEvent('Server error'), {status: 500});

      try {
        await result;
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it('should handle authorization errors in deleteCluster', async () => {
      const result = lastValueFrom(service.deleteCluster(mockProjectID, mockClusterID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters/${mockClusterID}`);
      req.error(new ErrorEvent('Unauthorized'), {status: 401});

      try {
        await result;
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe('URL Construction', () => {
    it('should correctly construct cluster list URL with project ID', async () => {
      const customProjectID = 'custom-project-123';
      const result = lastValueFrom(service.projectClusterList(customProjectID));

      const req = httpController.expectOne(`${restRoot}/projects/${customProjectID}/clusters`);
      expect(req.request.url).toContain(customProjectID);

      req.flush({clusters: []});
      await result;
    });

    it('should correctly construct cluster detail URL', async () => {
      const customClusterID = 'custom-cluster-456';
      const result = lastValueFrom(service.getCluster(mockProjectID, customClusterID));

      const req = httpController.expectOne(`${restRoot}/projects/${mockProjectID}/clusters/${customClusterID}`);
      expect(req.request.url).toContain(mockProjectID);
      expect(req.request.url).toContain(customClusterID);

      req.flush(mockCluster);
      await result;
    });
  });
});
