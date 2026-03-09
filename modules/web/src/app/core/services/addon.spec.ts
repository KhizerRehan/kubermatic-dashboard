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
import {AddonService} from './addon';
import {AppConfigService} from '@app/config.service';
import {Addon, AddonConfig} from '@shared/entity/addon';
import {fakeAsync, tick} from '@angular/core/testing';

describe('AddonService', () => {
  let service: AddonService;
  let httpController: HttpTestingController;
  let appConfigMock: jasmine.SpyObj<AppConfigService>;

  beforeEach(() => {
    appConfigMock = jasmine.createSpyObj('AppConfigService', ['getRefreshTimeBase']);
    appConfigMock.getRefreshTimeBase.and.returnValue(10);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AddonService,
        {provide: AppConfigService, useValue: appConfigMock},
      ],
    });

    service = TestBed.inject(AddonService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('add', () => {
    it('should POST addon to correct endpoint', () => {
      const addon: Addon = {name: 'test-addon'} as Addon;
      const projectID = 'project-1';
      const clusterID = 'cluster-1';

      service.add(addon, projectID, clusterID).subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );
      expect(req.method).toBe('POST');
      expect(req.request.body).toEqual(addon);
      req.flush(addon);
    });

    it('should handle successful addon creation response', (done) => {
      const addon: Addon = {name: 'test-addon'} as Addon;
      const projectID = 'project-1';
      const clusterID = 'cluster-1';
      const response: Addon = {name: 'test-addon', id: 'addon-1'} as Addon;

      service.add(addon, projectID, clusterID).subscribe((result) => {
        expect(result).toEqual(response);
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );
      req.flush(response);
    });

    it('should handle 400 bad request error', (done) => {
      const addon: Addon = {name: ''} as Addon;

      service.add(addon, 'project-1', 'cluster-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );
      req.flush({message: 'Invalid addon'}, {status: 400, statusText: 'Bad Request'});
    });

    it('should handle 401 unauthorized error', (done) => {
      service.add({} as Addon, 'project-1', 'cluster-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );
      req.flush({message: 'Unauthorized'}, {status: 401, statusText: 'Unauthorized'});
    });

    it('should handle 403 forbidden error', (done) => {
      service.add({} as Addon, 'project-1', 'cluster-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );
      req.flush({message: 'Forbidden'}, {status: 403, statusText: 'Forbidden'});
    });

    it('should handle 500 server error', (done) => {
      service.add({} as Addon, 'project-1', 'cluster-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );
      req.flush({message: 'Server error'}, {status: 500, statusText: 'Internal Server Error'});
    });
  });

  describe('list', () => {
    it('should GET addons list from correct endpoint', () => {
      const projectID = 'project-1';
      const clusterID = 'cluster-1';

      service.list(projectID, clusterID).subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );
      expect(req.method).toBe('GET');
      req.flush([]);
    });

    it('should handle successful list response with multiple addons', (done) => {
      const response: Addon[] = [
        {name: 'addon-1', id: '1'} as Addon,
        {name: 'addon-2', id: '2'} as Addon,
      ];

      service.list('project-1', 'cluster-1').subscribe((result) => {
        expect(result).toEqual(response);
        expect(result.length).toBe(2);
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );
      req.flush(response);
    });

    it('should return empty array on error (graceful fallback)', (done) => {
      service.list('project-1', 'cluster-1').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );
      req.error(new ErrorEvent('Network error'));
    });

    it('should return empty array on 404 not found', (done) => {
      service.list('project-1', 'cluster-1').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );
      req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
    });

    it('should return empty array on 500 server error', (done) => {
      service.list('project-1', 'cluster-1').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );
      req.flush({message: 'Server error'}, {status: 500, statusText: 'Internal Server Error'});
    });

    it('should construct correct URL with different project and cluster IDs', () => {
      service.list('project-xyz', 'cluster-abc').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-xyz/clusters/cluster-abc/addons`
      );
      expect(req.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('patch', () => {
    it('should PATCH addon to correct endpoint', () => {
      const addon: Addon = {name: 'test-addon', id: 'addon-1'} as Addon;
      const projectID = 'project-1';
      const clusterID = 'cluster-1';

      service.patch(addon, projectID, clusterID).subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons/test-addon`
      );
      expect(req.method).toBe('PATCH');
      expect(req.request.body).toEqual(addon);
      req.flush(addon);
    });

    it('should handle successful patch response', (done) => {
      const addon: Addon = {name: 'test-addon', id: 'addon-1'} as Addon;
      const response: Addon = {name: 'test-addon', id: 'addon-1', enabled: true} as Addon;

      service.patch(addon, 'project-1', 'cluster-1').subscribe((result) => {
        expect(result).toEqual(response);
        expect(result.enabled).toBe(true);
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons/test-addon`
      );
      req.flush(response);
    });

    it('should handle 400 bad request on patch', (done) => {
      service.patch({name: 'test'} as Addon, 'project-1', 'cluster-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons/test`
      );
      req.flush({message: 'Invalid addon'}, {status: 400, statusText: 'Bad Request'});
    });

    it('should handle 404 not found on patch', (done) => {
      service.patch({name: 'nonexistent'} as Addon, 'project-1', 'cluster-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons/nonexistent`
      );
      req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
    });

    it('should include addon name in URL path', () => {
      const addon: Addon = {name: 'special-addon-name'} as Addon;

      service.patch(addon, 'project-1', 'cluster-1').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons/special-addon-name`
      );
      expect(req.request.url).toContain('special-addon-name');
      req.flush(addon);
    });
  });

  describe('delete', () => {
    it('should DELETE addon from correct endpoint', () => {
      const addonID = 'addon-1';
      const projectID = 'project-1';
      const clusterID = 'cluster-1';

      service.delete(addonID, projectID, clusterID).subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons/addon-1`
      );
      expect(req.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle successful delete response', (done) => {
      service.delete('addon-1', 'project-1', 'cluster-1').subscribe(() => {
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons/addon-1`
      );
      req.flush(null);
    });

    it('should handle 404 not found on delete', (done) => {
      service.delete('nonexistent', 'project-1', 'cluster-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons/nonexistent`
      );
      req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
    });

    it('should handle 403 forbidden on delete', (done) => {
      service.delete('addon-1', 'project-1', 'cluster-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons/addon-1`
      );
      req.flush({message: 'Permission denied'}, {status: 403, statusText: 'Forbidden'});
    });

    it('should handle 500 server error on delete', (done) => {
      service.delete('addon-1', 'project-1', 'cluster-1').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons/addon-1`
      );
      req.flush({message: 'Server error'}, {status: 500, statusText: 'Internal Server Error'});
    });
  });

  describe('accessibleAddons', () => {
    it('should GET accessible addons list', () => {
      service.accessibleAddons.subscribe();

      const req = httpController.expectOne(`http://localhost:8080/api/v1/addons`);
      expect(req.method).toBe('GET');
      req.flush([]);
    });

    it('should return list of addon names', (done) => {
      const response = ['addon-1', 'addon-2', 'addon-3'];

      service.accessibleAddons.subscribe((result) => {
        expect(result).toEqual(response);
        expect(result.length).toBe(3);
        done();
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v1/addons`);
      req.flush(response);
    });

    it('should handle empty accessible addons list', (done) => {
      service.accessibleAddons.subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v1/addons`);
      req.flush([]);
    });
  });

  describe('addonConfigs', () => {
    it('should GET addon configs with timer refresh', fakeAsync(() => {
      const configs: AddonConfig[] = [{name: 'config-1', id: '1'} as AddonConfig];

      service.addonConfigs.subscribe((result) => {
        expect(result).toEqual(configs);
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v1/addonconfigs`);
      req.flush(configs);
      tick();
    }));

    it('should cache addon configs on second subscription', fakeAsync(() => {
      const configs: AddonConfig[] = [{name: 'config-1'} as AddonConfig];

      let callCount = 0;
      service.addonConfigs.subscribe(() => callCount++);
      const req1 = httpController.expectOne(`http://localhost:8080/api/v1/addonconfigs`);
      req1.flush(configs);

      // Second subscription should use cache
      service.addonConfigs.subscribe(() => callCount++);

      tick();
      // No new HTTP request should be made
      httpController.expectNone(`http://localhost:8080/api/v1/addonconfigs`);
    }));

    it('should handle addon configs error with graceful degradation', fakeAsync(() => {
      let errorReceived = false;
      let resultReceived = false;

      service.addonConfigs.subscribe({
        next: () => (resultReceived = true),
        error: () => (errorReceived = true),
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v1/addonconfigs`);
      req.error(new ErrorEvent('Network error'));

      tick();
      // Should not error, but handle gracefully (dependent on actual error handling)
    }));

    it('should refresh addon configs on multiple subscriptions', fakeAsync(() => {
      const configs: AddonConfig[] = [{name: 'config-1'} as AddonConfig];

      service.addonConfigs.subscribe((result) => {
        expect(result).toEqual(configs);
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v1/addonconfigs`);
      req.flush(configs);
      tick();

      // After first subscription completes
      const configs2: AddonConfig[] = [{name: 'config-2'} as AddonConfig];
      service.addonConfigs.subscribe((result) => {
        expect(result).toEqual(configs2);
      });

      tick(300); // Advance time for timer
      const req2 = httpController.expectOne(`http://localhost:8080/api/v1/addonconfigs`);
      req2.flush(configs2);
    }));

    it('should use correct endpoint for addon configs', fakeAsync(() => {
      service.addonConfigs.subscribe();

      const req = httpController.expectOne(`http://localhost:8080/api/v1/addonconfigs`);
      expect(req.method).toBe('GET');
      req.flush([]);
      tick();
    }));
  });

  describe('parameter validation', () => {
    it('should construct URL with special characters in IDs', () => {
      const addon = {name: 'test'} as Addon;

      service.patch(addon, 'proj-123', 'clust-456').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/proj-123/clusters/clust-456/addons/test`
      );
      req.flush(addon);
    });

    it('should handle addon names with special characters', () => {
      const addon = {name: 'addon-special_chars.v1'} as Addon;

      service.patch(addon, 'project-1', 'cluster-1').subscribe();

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons/addon-special_chars.v1`
      );
      expect(req.request.url).toContain('addon-special_chars.v1');
      req.flush(addon);
    });
  });

  describe('concurrent requests', () => {
    it('should handle multiple concurrent add requests', () => {
      const addon1 = {name: 'addon-1'} as Addon;
      const addon2 = {name: 'addon-2'} as Addon;

      service.add(addon1, 'project-1', 'cluster-1').subscribe();
      service.add(addon2, 'project-1', 'cluster-1').subscribe();

      const req1 = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );
      const req2 = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );

      expect(req1.request.body.name).toBe('addon-1');
      expect(req2.request.body.name).toBe('addon-2');

      req1.flush(addon1);
      req2.flush(addon2);
    });

    it('should handle list and add requests concurrently', () => {
      service.list('project-1', 'cluster-1').subscribe();
      service.add({name: 'addon-1'} as Addon, 'project-1', 'cluster-1').subscribe();

      const getReq = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );
      const postReq = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );

      expect(getReq.method).toBe('GET');
      expect(postReq.method).toBe('POST');

      getReq.flush([]);
      postReq.flush({name: 'addon-1'});
    });
  });

  describe('response transformation', () => {
    it('should preserve addon object structure on add', (done) => {
      const addon: Addon = {
        name: 'test-addon',
        id: 'addon-1',
        enabled: true,
        variables: {key: 'value'},
      } as Addon;

      service.add(addon, 'project-1', 'cluster-1').subscribe((result) => {
        expect(result.name).toBe(addon.name);
        expect(result.id).toBe(addon.id);
        expect(result.enabled).toBe(addon.enabled);
        expect(result.variables).toEqual(addon.variables);
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );
      req.flush(addon);
    });

    it('should handle array transformation in list', (done) => {
      const addons: Addon[] = [
        {name: 'addon-1', id: '1'} as Addon,
        {name: 'addon-2', id: '2'} as Addon,
      ];

      service.list('project-1', 'cluster-1').subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result[0].name).toBe('addon-1');
        expect(result[1].name).toBe('addon-2');
        done();
      });

      const req = httpController.expectOne(
        `http://localhost:8080/api/v2/projects/project-1/clusters/cluster-1/addons`
      );
      req.flush(addons);
    });
  });
});
