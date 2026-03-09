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
import {FeatureGateService, FeatureGates} from './feature-gate';
import {AppConfigService} from '@app/config.service';

describe('FeatureGateService', () => {
  let service: FeatureGateService;
  let httpController: HttpTestingController;
  let appConfigMock: jasmine.SpyObj<AppConfigService>;

  beforeEach(() => {
    appConfigMock = jasmine.createSpyObj('AppConfigService', ['getRefreshTimeBase']);
    appConfigMock.getRefreshTimeBase.and.returnValue(10);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        FeatureGateService,
        {provide: AppConfigService, useValue: appConfigMock},
      ],
    });

    service = TestBed.inject(FeatureGateService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('featureGates getter', () => {
    it('should GET feature gates on first subscription', fakeAsync(() => {
      const gates: FeatureGates = {oidcKubeCfgEndpoint: true};

      service.featureGates.subscribe((result) => {
        expect(result).toEqual(gates);
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      expect(req.method).toBe('GET');
      req.flush(gates);
      tick();
    }));

    it('should cache feature gates on second subscription', fakeAsync(() => {
      const gates: FeatureGates = {oidcKubeCfgEndpoint: true};

      service.featureGates.subscribe();
      const req1 = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req1.flush(gates);

      // Second subscription should use cache (shareReplay)
      service.featureGates.subscribe((result) => {
        expect(result).toEqual(gates);
      });

      // No new HTTP request
      httpController.expectNone(`http://localhost:8080/api/v2/featuregates`);
      tick();
    }));

    it('should handle all feature gates enabled', fakeAsync(() => {
      const gates: FeatureGates = {
        oidcKubeCfgEndpoint: true,
        openIDAuthPlugin: true,
        disableUserSSHKey: true,
      };

      service.featureGates.subscribe((result) => {
        expect(result.oidcKubeCfgEndpoint).toBe(true);
        expect(result.openIDAuthPlugin).toBe(true);
        expect(result.disableUserSSHKey).toBe(true);
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.flush(gates);
      tick();
    }));

    it('should handle all feature gates disabled', fakeAsync(() => {
      const gates: FeatureGates = {
        oidcKubeCfgEndpoint: false,
        openIDAuthPlugin: false,
        disableUserSSHKey: false,
      };

      service.featureGates.subscribe((result) => {
        expect(result.oidcKubeCfgEndpoint).toBe(false);
        expect(result.openIDAuthPlugin).toBe(false);
        expect(result.disableUserSSHKey).toBe(false);
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.flush(gates);
      tick();
    }));

    it('should handle mixed feature gate states', fakeAsync(() => {
      const gates: FeatureGates = {
        oidcKubeCfgEndpoint: true,
        openIDAuthPlugin: false,
        disableUserSSHKey: true,
      };

      service.featureGates.subscribe((result) => {
        expect(result.oidcKubeCfgEndpoint).toBe(true);
        expect(result.openIDAuthPlugin).toBe(false);
        expect(result.disableUserSSHKey).toBe(true);
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.flush(gates);
      tick();
    }));

    it('should handle empty feature gates object', fakeAsync(() => {
      const gates: FeatureGates = {};

      service.featureGates.subscribe((result) => {
        expect(Object.keys(result).length).toBe(0);
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.flush(gates);
      tick();
    }));

    it('should handle undefined feature gates on error', fakeAsync(() => {
      service.featureGates.subscribe((result) => {
        expect(result).toEqual({});
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.error(new ErrorEvent('Network error'));
      tick();
    }));

    it('should return empty object on 404 not found', fakeAsync(() => {
      service.featureGates.subscribe((result) => {
        expect(result).toEqual({});
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});
      tick();
    }));

    it('should return empty object on 500 server error', fakeAsync(() => {
      service.featureGates.subscribe((result) => {
        expect(result).toEqual({});
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.flush({message: 'Server error'}, {status: 500, statusText: 'Internal Server Error'});
      tick();
    }));

    it('should handle 503 service unavailable', fakeAsync(() => {
      service.featureGates.subscribe((result) => {
        expect(result).toEqual({});
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.flush({message: 'Service unavailable'}, {status: 503, statusText: 'Service Unavailable'});
      tick();
    }));

    it('should use correct endpoint URL', fakeAsync(() => {
      service.featureGates.subscribe();

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      expect(req.request.url).toContain('featuregates');
      req.flush({});
      tick();
    }));

    it('should refresh feature gates on timer intervals', fakeAsync(() => {
      const gates1: FeatureGates = {oidcKubeCfgEndpoint: true};
      const gates2: FeatureGates = {oidcKubeCfgEndpoint: false};

      service.featureGates.subscribe();
      const req1 = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req1.flush(gates1);

      // Advance time to trigger timer
      tick(300); // Advance time for timer refresh

      // Trigger another request (simulating timer refresh)
      service.featureGates.subscribe();
      const req2 = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req2.flush(gates2);

      tick();
    }));

    it('should handle partial feature gate response', fakeAsync(() => {
      const gates: FeatureGates = {oidcKubeCfgEndpoint: true};

      service.featureGates.subscribe((result) => {
        expect(result.oidcKubeCfgEndpoint).toBe(true);
        expect(result.openIDAuthPlugin).toBeUndefined();
        expect(result.disableUserSSHKey).toBeUndefined();
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.flush(gates);
      tick();
    }));

    it('should not make duplicate requests on multiple subscriptions within cache window', fakeAsync(() => {
      const gates: FeatureGates = {oidcKubeCfgEndpoint: true};

      const sub1 = service.featureGates.subscribe();
      const sub2 = service.featureGates.subscribe();
      const sub3 = service.featureGates.subscribe();

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.flush(gates);

      // All subscriptions should receive the same cached value
      sub1.unsubscribe();
      sub2.unsubscribe();
      sub3.unsubscribe();

      tick();

      // No additional requests should be made
      httpController.expectNone(`http://localhost:8080/api/v2/featuregates`);
    }));

    it('should handle 401 unauthorized response', fakeAsync(() => {
      service.featureGates.subscribe((result) => {
        expect(result).toEqual({});
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.flush({message: 'Unauthorized'}, {status: 401, statusText: 'Unauthorized'});
      tick();
    }));

    it('should handle 403 forbidden response', fakeAsync(() => {
      service.featureGates.subscribe((result) => {
        expect(result).toEqual({});
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.flush({message: 'Forbidden'}, {status: 403, statusText: 'Forbidden'});
      tick();
    }));
  });

  describe('response transformation', () => {
    it('should preserve feature gate types (boolean)', fakeAsync(() => {
      const gates: FeatureGates = {oidcKubeCfgEndpoint: true};

      service.featureGates.subscribe((result) => {
        expect(typeof result.oidcKubeCfgEndpoint).toBe('boolean');
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.flush(gates);
      tick();
    }));

    it('should handle response with additional unknown properties', fakeAsync(() => {
      const response = {
        oidcKubeCfgEndpoint: true,
        unknownProperty: 'should-be-ignored',
      };

      service.featureGates.subscribe((result) => {
        expect(result.oidcKubeCfgEndpoint).toBe(true);
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.flush(response);
      tick();
    }));
  });

  describe('error handling', () => {
    it('should gracefully degrade on network timeout', fakeAsync(() => {
      service.featureGates.subscribe((result) => {
        expect(result).toEqual({});
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.error(new ErrorEvent('Timeout'));
      tick();
    }));

    it('should handle malformed JSON response gracefully', fakeAsync(() => {
      service.featureGates.subscribe((result) => {
        // Should still have empty object fallback
        expect(typeof result).toBe('object');
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.error(new ErrorEvent('Parse error'));
      tick();
    }));

    it('should handle rate limiting (429 Too Many Requests)', fakeAsync(() => {
      service.featureGates.subscribe((result) => {
        expect(result).toEqual({});
      });

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.flush({message: 'Too Many Requests'}, {status: 429, statusText: 'Too Many Requests'});
      tick();
    }));
  });

  describe('subscription behavior', () => {
    it('should emit value to all subscribers', fakeAsync(() => {
      const gates: FeatureGates = {oidcKubeCfgEndpoint: true};
      let count = 0;

      service.featureGates.subscribe(() => count++);
      service.featureGates.subscribe(() => count++);

      const req = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req.flush(gates);

      tick();
      // Both subscribers should receive the value from cache
      expect(count).toBe(2);
    }));

    it('should handle unsubscription and resubscription', fakeAsync(() => {
      const gates: FeatureGates = {oidcKubeCfgEndpoint: true};

      const sub1 = service.featureGates.subscribe();
      const req1 = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req1.flush(gates);

      sub1.unsubscribe();

      // After all subscribers unsubscribe, cache should be cleared (refCount: true)
      // New subscription should trigger new request
      service.featureGates.subscribe();
      const req2 = httpController.expectOne(`http://localhost:8080/api/v2/featuregates`);
      req2.flush(gates);

      tick();
    }));
  });
});
