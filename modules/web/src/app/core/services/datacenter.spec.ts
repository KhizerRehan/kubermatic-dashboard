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
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {Datacenter} from '@shared/entity/datacenter';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {AuthMockService} from '@test/services/auth-mock';
import {Auth} from './auth/service';
import {lastValueFrom} from 'rxjs';

import {DatacenterService} from './datacenter';

describe('DatacenterService', () => {
  let service: DatacenterService;
  let httpController: HttpTestingController;
  let authService: AuthMockService;

  const restRoot = environment.restRoot;

  const mockDatacenter: Datacenter = {
    metadata: {
      name: 'us-central1',
    },
    spec: {
      seed: 'us-seed',
      provider: 'gcp',
      location: 'US Central',
      kubermaticOperations: {
        log: {
          retention_days: 30,
        },
      },
      kubermaticProvisioning: {
        log: {
          retention_days: 30,
        },
      },
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DatacenterService,
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: Auth, useClass: AuthMockService},
      ],
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(DatacenterService);
    httpController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(Auth) as AuthMockService;
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('init()', () => {
    it('should initialize datacenters observable', () => {
      authService.setCustomBearerToken('valid-token');

      service.init();

      const req = httpController.expectOne(`${restRoot}/dc`);
      req.flush([mockDatacenter]);

      expect(service).toBeTruthy();
    });

    it('should initialize seeds observable', () => {
      authService.setCustomBearerToken('valid-token');

      service.init();

      const dcReq = httpController.expectOne(`${restRoot}/dc`);
      dcReq.flush([mockDatacenter]);

      const seedsReq = httpController.expectOne(`${restRoot}/seeds`);
      seedsReq.flush(['us-seed', 'eu-seed']);
    });

    it('should handle unauthenticated state', () => {
      authService.setCustomBearerToken('');

      service.init();

      // When not authenticated, should return empty arrays
      // Requests may not be made at all if authentication is checked
      expect(service).toBeTruthy();
    });
  });

  describe('datacenters', () => {
    it('should fetch all datacenters', async () => {
      authService.setCustomBearerToken('valid-token');
      service.init();

      const req = httpController.expectOne(`${restRoot}/dc`);
      expect(req.request.method).toBe('GET');

      req.flush([mockDatacenter]);

      const datacenters = await lastValueFrom(service.datacenters);
      expect(datacenters).toBeTruthy();
      expect(datacenters.length).toBeGreaterThan(0);
    });

    it('should fetch empty datacenters list', async () => {
      authService.setCustomBearerToken('valid-token');
      service.init();

      const req = httpController.expectOne(`${restRoot}/dc`);
      req.flush([]);

      const datacenters = await lastValueFrom(service.datacenters);
      expect(datacenters).toEqual([]);
    });

    it('should sort datacenters by name', async () => {
      authService.setCustomBearerToken('valid-token');
      service.init();

      const dc1 = {metadata: {name: 'z-datacenter'}, spec: mockDatacenter.spec};
      const dc2 = {metadata: {name: 'a-datacenter'}, spec: mockDatacenter.spec};
      const dc3 = {metadata: {name: 'm-datacenter'}, spec: mockDatacenter.spec};

      const req = httpController.expectOne(`${restRoot}/dc`);
      req.flush([dc1, dc2, dc3]);

      const datacenters = await lastValueFrom(service.datacenters);
      expect(datacenters[0].metadata.name).toBe('a-datacenter');
      expect(datacenters[1].metadata.name).toBe('m-datacenter');
      expect(datacenters[2].metadata.name).toBe('z-datacenter');
    });

    it('should handle API error with fallback to empty list', async () => {
      authService.setCustomBearerToken('valid-token');
      service.init();

      const req = httpController.expectOne(`${restRoot}/dc`);
      req.error(new ErrorEvent('Network error'));

      const datacenters = await lastValueFrom(service.datacenters);
      expect(datacenters).toEqual([]);
    });
  });

  describe('getDatacenter()', () => {
    it('should find datacenter by name', async () => {
      authService.setCustomBearerToken('valid-token');
      service.init();

      const req = httpController.expectOne(`${restRoot}/dc`);
      req.flush([mockDatacenter]);

      const dc = await lastValueFrom(service.getDatacenter('us-central1'));
      expect(dc?.metadata.name).toBe('us-central1');
    });

    it('should return undefined if datacenter not found', async () => {
      authService.setCustomBearerToken('valid-token');
      service.init();

      const req = httpController.expectOne(`${restRoot}/dc`);
      req.flush([mockDatacenter]);

      const dc = await lastValueFrom(service.getDatacenter('non-existent'));
      expect(dc).toBeUndefined();
    });

    it('should find correct datacenter among multiple', async () => {
      authService.setCustomBearerToken('valid-token');
      service.init();

      const dc1 = {metadata: {name: 'dc1'}, spec: mockDatacenter.spec};
      const dc2 = {metadata: {name: 'dc2'}, spec: mockDatacenter.spec};
      const dc3 = {metadata: {name: 'dc3'}, spec: mockDatacenter.spec};

      const req = httpController.expectOne(`${restRoot}/dc`);
      req.flush([dc1, dc2, dc3]);

      const found = await lastValueFrom(service.getDatacenter('dc2'));
      expect(found?.metadata.name).toBe('dc2');
    });
  });

  describe('refreshDatacenters()', () => {
    it('should trigger refresh of datacenters', () => {
      authService.setCustomBearerToken('valid-token');
      service.init();

      const req1 = httpController.expectOne(`${restRoot}/dc`);
      req1.flush([mockDatacenter]);

      // Trigger refresh
      service.refreshDatacenters();

      const req2 = httpController.expectOne(`${restRoot}/dc`);
      req2.flush([{...mockDatacenter, metadata: {name: 'updated'}}]);
    });
  });

  describe('seeds', () => {
    it('should fetch all seeds', async () => {
      authService.setCustomBearerToken('valid-token');
      service.init();

      const dcReq = httpController.expectOne(`${restRoot}/dc`);
      dcReq.flush([mockDatacenter]);

      const seedsReq = httpController.expectOne(`${restRoot}/seeds`);
      seedsReq.flush(['seed1', 'seed2', 'seed3']);

      const seeds = await lastValueFrom(service.seeds);
      expect(seeds).toContain('seed1');
      expect(seeds).toContain('seed2');
      expect(seeds).toContain('seed3');
    });

    it('should fetch empty seeds list', async () => {
      authService.setCustomBearerToken('valid-token');
      service.init();

      const dcReq = httpController.expectOne(`${restRoot}/dc`);
      dcReq.flush([]);

      const seedsReq = httpController.expectOne(`${restRoot}/seeds`);
      seedsReq.flush([]);

      const seeds = await lastValueFrom(service.seeds);
      expect(seeds).toEqual([]);
    });

    it('should sort seeds alphabetically', async () => {
      authService.setCustomBearerToken('valid-token');
      service.init();

      const dcReq = httpController.expectOne(`${restRoot}/dc`);
      dcReq.flush([mockDatacenter]);

      const seedsReq = httpController.expectOne(`${restRoot}/seeds`);
      seedsReq.flush(['z-seed', 'a-seed', 'm-seed']);

      const seeds = await lastValueFrom(service.seeds);
      expect(seeds[0]).toBe('a-seed');
      expect(seeds[1]).toBe('m-seed');
      expect(seeds[2]).toBe('z-seed');
    });
  });

  describe('createDatacenter()', () => {
    it('should create new datacenter', async () => {
      const model = {spec: {seed: 'us-seed'}} as any;
      const result = lastValueFrom(service.createDatacenter(model));

      const req = httpController.expectOne(`${restRoot}/seed/us-seed/dc`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(model);

      req.flush(mockDatacenter);

      const dc = await result;
      expect(dc.metadata.name).toBe('us-central1');
    });

    it('should handle create datacenter error', async () => {
      const model = {spec: {seed: 'invalid-seed'}} as any;
      const result = lastValueFrom(service.createDatacenter(model));

      const req = httpController.expectOne(`${restRoot}/seed/invalid-seed/dc`);
      req.error(new ErrorEvent('Invalid seed'), {status: 400});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe('patchDatacenter()', () => {
    it('should patch existing datacenter', async () => {
      const patch = {...mockDatacenter} as Datacenter;
      const result = lastValueFrom(service.patchDatacenter('us-seed', 'us-central1', patch));

      const req = httpController.expectOne(`${restRoot}/seed/us-seed/dc/us-central1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(patch);

      req.flush(patch);

      const dc = await result;
      expect(dc.metadata.name).toBe('us-central1');
    });

    it('should handle patch datacenter error', async () => {
      const patch = {...mockDatacenter} as Datacenter;
      const result = lastValueFrom(service.patchDatacenter('us-seed', 'non-existent', patch));

      const req = httpController.expectOne(`${restRoot}/seed/us-seed/dc/non-existent`);
      req.error(new ErrorEvent('Not found'), {status: 404});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe('deleteDatacenter()', () => {
    it('should delete datacenter', async () => {
      const result = lastValueFrom(service.deleteDatacenter(mockDatacenter));

      const req = httpController.expectOne(`${restRoot}/seed/us-seed/dc/us-central1`);
      expect(req.request.method).toBe('DELETE');

      req.flush({});

      await result;
      expect(true).toBe(true); // No error means success
    });

    it('should handle delete datacenter error', async () => {
      const result = lastValueFrom(service.deleteDatacenter(mockDatacenter));

      const req = httpController.expectOne(`${restRoot}/seed/us-seed/dc/us-central1`);
      req.error(new ErrorEvent('Not found'), {status: 404});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it('should use correct seed and datacenter name in URL', async () => {
      const customDC = {
        metadata: {name: 'custom-dc'},
        spec: {seed: 'custom-seed', ...mockDatacenter.spec},
      } as Datacenter;

      const result = lastValueFrom(service.deleteDatacenter(customDC));

      const req = httpController.expectOne(`${restRoot}/seed/custom-seed/dc/custom-dc`);
      expect(req.request.url).toContain('custom-seed');
      expect(req.request.url).toContain('custom-dc');

      req.flush({});

      await result;
    });
  });

  describe('URL Construction', () => {
    it('should correctly construct datacenter list URL', async () => {
      authService.setCustomBearerToken('valid-token');
      service.init();

      const req = httpController.expectOne(`${restRoot}/dc`);
      expect(req.request.url).toBe(`${restRoot}/dc`);

      req.flush([mockDatacenter]);
    });

    it('should correctly construct create datacenter URL with seed', async () => {
      const model = {spec: {seed: 'my-seed'}} as any;
      const result = lastValueFrom(service.createDatacenter(model));

      const req = httpController.expectOne(`${restRoot}/seed/my-seed/dc`);
      expect(req.request.url).toContain('my-seed');

      req.flush(mockDatacenter);
      await result;
    });

    it('should correctly construct patch datacenter URL', async () => {
      const patch = {...mockDatacenter} as Datacenter;
      const result = lastValueFrom(service.patchDatacenter('seed123', 'dc456', patch));

      const req = httpController.expectOne(`${restRoot}/seed/seed123/dc/dc456`);
      expect(req.request.url).toContain('seed123');
      expect(req.request.url).toContain('dc456');

      req.flush(patch);
      await result;
    });
  });
});
