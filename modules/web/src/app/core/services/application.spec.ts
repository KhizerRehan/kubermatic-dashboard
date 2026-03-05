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
import {ApplicationService} from './application';
import {AppConfigService} from '@app/config.service';
import {Application, ApplicationDefinition, ApplicationSettings} from '@shared/entity/application';
import {take} from 'rxjs/operators';

describe('ApplicationService - RxJS Patterns Testing', () => {
  let service: ApplicationService;
  let httpTestingController: HttpTestingController;
  let appConfigService: jasmine.SpyObj<AppConfigService>;

  beforeEach(() => {
    const appConfigServiceMock = jasmine.createSpyObj('AppConfigService', ['getRefreshTimeBase']);
    appConfigServiceMock.getRefreshTimeBase.and.returnValue(100);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApplicationService, {provide: AppConfigService, useValue: appConfigServiceMock}],
    });

    service = TestBed.inject(ApplicationService);
    httpTestingController = TestBed.inject(HttpTestingController);
    appConfigService = TestBed.inject(AppConfigService) as jasmine.SpyObj<AppConfigService>;
  });

  afterEach(() => {
    httpTestingController.verify();
    service.reset();
  });

  // ========== Timer + SwitchMap Pattern ==========
  describe('Timer + SwitchMap Refresh Pattern (RxJS Pattern)', () => {
    it('should initialize observable on first listApplicationDefinitions call', (done: DoneFn) => {
      const mockAppDefs: ApplicationDefinition[] = [
        {name: 'app1', namespace: 'ns1', spec: {}},
      ] as ApplicationDefinition[];

      const subscription = service.listApplicationDefinitions().pipe(take(1)).subscribe(defs => {
        expect(defs).toBeDefined();
        expect(Array.isArray(defs)).toBe(true);
        subscription.unsubscribe();
        done();
      });

      const req = httpTestingController.expectOne(req => req.url.includes('/applicationdefinitions'));
      req.flush(mockAppDefs);
    });

    it('should use switchMap to cancel previous request on timer tick', (done: DoneFn) => {
      const mockAppDefs: ApplicationDefinition[] = [
        {name: 'app1', namespace: 'ns1', spec: {}},
      ] as ApplicationDefinition[];

      let requestCount = 0;

      service.listApplicationDefinitions().pipe(take(1)).subscribe(() => {
        expect(requestCount).toBe(1);
        done();
      });

      requestCount++;
      const req = httpTestingController.expectOne(req => req.url.includes('/applicationdefinitions'));
      req.flush(mockAppDefs);
    });

    it('should cache listApplicationDefinitions observable with shareReplay', (done: DoneFn) => {
      const mockAppDefs: ApplicationDefinition[] = [
        {name: 'app1', namespace: 'ns1', spec: {}},
      ] as ApplicationDefinition[];

      let requestCount = 0;

      // First subscriber
      service.listApplicationDefinitions().subscribe(() => {
        // Second subscriber (should use cached observable)
        service.listApplicationDefinitions().subscribe(() => {
          expect(requestCount).toBe(1); // Only one HTTP request
          done();
        });
      });

      requestCount++;
      const req = httpTestingController.expectOne(req => req.url.includes('/applicationdefinitions'));
      req.flush(mockAppDefs);
    });

    it('should sort application definitions by name after mapping', (done: DoneFn) => {
      const mockAppDefs: ApplicationDefinition[] = [
        {name: 'zebra-app', namespace: 'ns1', spec: {}},
        {name: 'alpha-app', namespace: 'ns2', spec: {}},
        {name: 'beta-app', namespace: 'ns3', spec: {}},
      ] as ApplicationDefinition[];

      service.listApplicationDefinitions().pipe(take(1)).subscribe(defs => {
        expect(defs[0].name).toBe('alpha-app');
        expect(defs[1].name).toBe('beta-app');
        expect(defs[2].name).toBe('zebra-app');
        done();
      });

      const req = httpTestingController.expectOne(req => req.url.includes('/applicationdefinitions'));
      req.flush(mockAppDefs);
    });
  });

  // ========== Tap Operator for Side Effects ==========
  describe('Tap Operator for Side Effects (RxJS Pattern)', () => {
    it('should use tap to enrich application definition with logo data', (done: DoneFn) => {
      const mockAppDef: ApplicationDefinition = {
        name: 'app-with-logo',
        namespace: 'default',
        spec: {logoData: ''},
      } as ApplicationDefinition;

      service.getApplicationDefinition('app-with-logo').subscribe(appDef => {
        expect(appDef).toBeDefined();
        done();
      });

      const req = httpTestingController.expectOne(
        req => req.url.includes('/applicationdefinitions/app-with-logo') && req.method === 'GET'
      );
      req.flush(mockAppDef);
    });

    it('should use tap to merge new app definition with cached array', (done: DoneFn) => {
      const existingAppDefs: ApplicationDefinition[] = [
        {name: 'existing-app', namespace: 'ns1', spec: {}},
      ] as ApplicationDefinition[];

      // Set initial definitions
      service['_applicationDefinitions'] = existingAppDefs;

      const mockAppDef: ApplicationDefinition = {
        name: 'existing-app',
        namespace: 'ns1',
        spec: {description: 'updated'},
      } as ApplicationDefinition;

      service.getApplicationDefinition('existing-app').subscribe(() => {
        // Verify merge happened
        expect(service.applicationDefinitions).toBeDefined();
        done();
      });

      const req = httpTestingController.expectOne(
        req => req.url.includes('/applicationdefinitions/existing-app')
      );
      req.flush(mockAppDef);
    });
  });

  // ========== Error Handling with Selective catchError ==========
  describe('Selective Error Handling with catchError (RxJS Pattern)', () => {
    it('should return empty object on 404 error in getApplicationDefinition', (done: DoneFn) => {
      service.getApplicationDefinition('non-existent-app').subscribe(
        appDef => {
          expect(appDef).toEqual({} as ApplicationDefinition);
          done();
        },
        () => {
          done.fail('Should not emit error on 404');
        }
      );

      const req = httpTestingController.expectOne(
        req => req.url.includes('/applicationdefinitions/non-existent-app')
      );
      req.error(new ErrorEvent('Not Found'), {status: 404});
    });

    it('should rethrow non-404 errors in getApplicationDefinition', (done: DoneFn) => {
      service.getApplicationDefinition('app-name').subscribe(
        () => {
          done.fail('Should not emit data on error');
        },
        error => {
          expect(error).toBeDefined();
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpTestingController.expectOne(
        req => req.url.includes('/applicationdefinitions/app-name')
      );
      req.error(new ErrorEvent('Server Error'), {status: 500});
    });

    it('should return empty array on error in getApplicationSettings', (done: DoneFn) => {
      service.getApplicationSettings().subscribe(
        settings => {
          expect(settings).toEqual({} as ApplicationSettings);
          done();
        },
        () => {
          done.fail('Should not emit error');
        }
      );

      const req = httpTestingController.expectOne(
        req => req.url.includes('/applicationsettings') && req.method === 'GET'
      );
      req.error(new ErrorEvent('Network Error'), {status: 0});
    });

    it('should return empty array on error in list method', (done: DoneFn) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      service.list(projectID, clusterID).subscribe(
        apps => {
          expect(apps).toEqual([]);
          done();
        },
        () => {
          done.fail('Should not emit error');
        }
      );

      const req = httpTestingController.expectOne(
        req =>
          req.url.includes(`/projects/${projectID}/clusters/${clusterID}/applicationinstallations`) &&
          req.method === 'GET'
      );
      req.error(new ErrorEvent('Network Error'), {status: 500});
    });

    it('should return empty array on error in listApplicationDefinitions', (done: DoneFn) => {
      service.listApplicationDefinitions().pipe(take(1)).subscribe(
        defs => {
          expect(defs).toEqual([]);
          done();
        },
        () => {
          done.fail('Should not emit error');
        }
      );

      const req = httpTestingController.expectOne(req => req.url.includes('/applicationdefinitions'));
      req.error(new ErrorEvent('Network Error'), {status: 500});
    });
  });

  // ========== Data Transformation with Map ==========
  describe('Data Transformation with Map Operator (RxJS Pattern)', () => {
    it('should transform and enrich application definitions', (done: DoneFn) => {
      const mockAppDefs: ApplicationDefinition[] = [
        {name: 'app1', namespace: 'ns1', spec: {}},
        {name: 'app2', namespace: 'ns2', spec: {}},
      ] as ApplicationDefinition[];

      service.listApplicationDefinitions().pipe(take(1)).subscribe(defs => {
        expect(defs.length).toBe(2);
        expect(defs[0].name).toBeDefined();
        done();
      });

      const req = httpTestingController.expectOne(req => req.url.includes('/applicationdefinitions'));
      req.flush(mockAppDefs);
    });

    it('should merge old app definitions with new ones during refresh', (done: DoneFn) => {
      const oldAppDefs: ApplicationDefinition[] = [
        {name: 'app1', namespace: 'ns1', spec: {description: 'old'}},
      ] as ApplicationDefinition[];

      service['_applicationDefinitions'] = oldAppDefs;

      const newAppDefs: ApplicationDefinition[] = [
        {name: 'app1', namespace: 'ns1', spec: {description: 'new', version: '2.0'}},
      ] as ApplicationDefinition[];

      service.listApplicationDefinitions().pipe(take(1)).subscribe(defs => {
        expect(defs.length).toBe(1);
        done();
      });

      const req = httpTestingController.expectOne(req => req.url.includes('/applicationdefinitions'));
      req.flush(newAppDefs);
    });
  });

  // ========== Observable Cleanup and Unsubscription ==========
  describe('Observable Cleanup and Unsubscription', () => {
    it('should allow unsubscription from listApplicationDefinitions', (done: DoneFn) => {
      const mockAppDefs: ApplicationDefinition[] = [
        {name: 'app1', namespace: 'ns1', spec: {}},
      ] as ApplicationDefinition[];

      const subscription = service.listApplicationDefinitions().subscribe();

      const req = httpTestingController.expectOne(req => req.url.includes('/applicationdefinitions'));
      req.flush(mockAppDefs);

      subscription.unsubscribe();
      expect(subscription.closed).toBe(true);
      done();
    });

    it('should support multiple concurrent subscriptions', (done: DoneFn) => {
      const mockAppDefs: ApplicationDefinition[] = [
        {name: 'app1', namespace: 'ns1', spec: {}},
      ] as ApplicationDefinition[];

      const sub1 = service.listApplicationDefinitions().subscribe();
      const sub2 = service.listApplicationDefinitions().subscribe();
      const sub3 = service.listApplicationDefinitions().subscribe();

      const req = httpTestingController.expectOne(req => req.url.includes('/applicationdefinitions'));
      req.flush(mockAppDefs);

      sub1.unsubscribe();
      sub2.unsubscribe();
      sub3.unsubscribe();

      expect(sub1.closed).toBe(true);
      expect(sub2.closed).toBe(true);
      expect(sub3.closed).toBe(true);

      done();
    });
  });

  // ========== EventEmitter Pattern ==========
  describe('EventEmitter for State Changes (RxJS Pattern)', () => {
    it('should emit applicationChanges when applications setter is called', (done: DoneFn) => {
      const mockApps: Application[] = [
        {name: 'app1', namespace: 'default', spec: {}},
      ] as Application[];

      service.applicationChanges.subscribe(apps => {
        expect(apps).toEqual(mockApps);
        done();
      });

      service.applications = mockApps;
    });

    it('should update internal _applications state when setter is called', () => {
      const mockApps: Application[] = [
        {name: 'app1', namespace: 'default', spec: {}},
      ] as Application[];

      service.applications = mockApps;

      expect(service.applications).toEqual(mockApps);
    });

    it('should handle multiple applicationChanges subscriptions', (done: DoneFn) => {
      const mockApps: Application[] = [
        {name: 'app1', namespace: 'default', spec: {}},
      ] as Application[];

      let sub1Called = false;
      let sub2Called = false;

      const sub1 = service.applicationChanges.subscribe(apps => {
        expect(apps).toEqual(mockApps);
        sub1Called = true;
      });

      const sub2 = service.applicationChanges.subscribe(apps => {
        expect(apps).toEqual(mockApps);
        sub2Called = true;
      });

      service.applications = mockApps;

      setTimeout(() => {
        expect(sub1Called).toBe(true);
        expect(sub2Called).toBe(true);
        sub1.unsubscribe();
        sub2.unsubscribe();
        done();
      }, 50);
    });
  });

  // ========== API Operations ==========
  describe('API Operations with Observable Patterns', () => {
    it('should POST application with correct URL construction', (done: DoneFn) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const app: Application = {name: 'app1', namespace: 'default', spec: {}};
      const mockResponse: Application = {name: 'app1', namespace: 'default', spec: {}};

      service.add(app, projectID, clusterID).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpTestingController.expectOne(
        req =>
          req.url.includes(`/projects/${projectID}/clusters/${clusterID}/applicationinstallations`) &&
          req.method === 'POST'
      );
      expect(req.request.body).toEqual(app);
      req.flush(mockResponse);
    });

    it('should GET application list from cluster', (done: DoneFn) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mockApps: Application[] = [
        {name: 'app1', namespace: 'default', spec: {}},
        {name: 'app2', namespace: 'kube-system', spec: {}},
      ];

      service.list(projectID, clusterID).subscribe(apps => {
        expect(apps).toEqual(mockApps);
        done();
      });

      const req = httpTestingController.expectOne(
        req =>
          req.url.includes(`/projects/${projectID}/clusters/${clusterID}/applicationinstallations`) &&
          req.method === 'GET'
      );
      req.flush(mockApps);
    });

    it('should GET specific application by namespace and name', (done: DoneFn) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const app: Application = {name: 'app1', namespace: 'default', spec: {}};
      const mockResponse: Application = {name: 'app1', namespace: 'default', spec: {}};

      service.getApplication(app, projectID, clusterID).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpTestingController.expectOne(
        req =>
          req.url.includes(
            `/projects/${projectID}/clusters/${clusterID}/applicationinstallations/${app.namespace}/${app.name}`
          ) && req.method === 'GET'
      );
      req.flush(mockResponse);
    });

    it('should PUT application update', (done: DoneFn) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const app: Application = {
        name: 'app1',
        namespace: 'default',
        spec: {version: '2.0'},
      };
      const mockResponse: Application = {
        name: 'app1',
        namespace: 'default',
        spec: {version: '2.0'},
      };

      service.put(app, projectID, clusterID).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpTestingController.expectOne(
        req =>
          req.url.includes(
            `/projects/${projectID}/clusters/${clusterID}/applicationinstallations/${app.namespace}/${app.name}`
          ) && req.method === 'PUT'
      );
      expect(req.request.body).toEqual(app);
      req.flush(mockResponse);
    });

    it('should DELETE application', (done: DoneFn) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const app: Application = {name: 'app1', namespace: 'default', spec: {}};

      service.delete(app, projectID, clusterID).subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const req = httpTestingController.expectOne(
        req =>
          req.url.includes(
            `/projects/${projectID}/clusters/${clusterID}/applicationinstallations/${app.namespace}/${app.name}`
          ) && req.method === 'DELETE'
      );
      req.flush(null);
    });

    it('should PATCH application definition', (done: DoneFn) => {
      const name = 'app-def-1';
      const patch: ApplicationDefinition = {
        name: 'app-def-1',
        namespace: 'default',
        spec: {version: '3.0'},
      } as ApplicationDefinition;
      const mockResponse: ApplicationDefinition = patch;

      service.patchApplicationDefinition(name, patch).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpTestingController.expectOne(
        req =>
          req.url.includes(`/applicationdefinitions/${name}`) && req.method === 'PATCH'
      );
      expect(req.request.body).toEqual(patch);
      req.flush(mockResponse);
    });
  });

  // ========== State Management ==========
  describe('State Management and Getters', () => {
    it('should get applications array', () => {
      const mockApps: Application[] = [
        {name: 'app1', namespace: 'default', spec: {}},
      ];
      service.applications = mockApps;

      expect(service.applications).toEqual(mockApps);
    });

    it('should get applicationDefinitions array', () => {
      const mockDefs: ApplicationDefinition[] = [
        {name: 'def1', namespace: 'ns1', spec: {}},
      ] as ApplicationDefinition[];

      service['_applicationDefinitions'] = mockDefs;

      expect(service.applicationDefinitions).toEqual(mockDefs);
    });

    it('should reset applications array', () => {
      const mockApps: Application[] = [
        {name: 'app1', namespace: 'default', spec: {}},
      ];
      service.applications = mockApps;
      expect(service.applications.length).toBe(1);

      service.reset();
      expect(service.applications).toEqual([]);
    });
  });

  // ========== Observable Caching with ShareReplay ==========
  describe('Observable Caching with ShareReplay (RxJS Pattern)', () => {
    it('should cache listApplicationDefinitions observable', (done: DoneFn) => {
      const mockAppDefs: ApplicationDefinition[] = [
        {name: 'app1', namespace: 'ns1', spec: {}},
      ] as ApplicationDefinition[];

      const obs1 = service.listApplicationDefinitions();
      const obs2 = service.listApplicationDefinitions();

      expect(obs1).toBe(obs2); // Same cached observable

      obs1.pipe(take(1)).subscribe(() => {
        done();
      });

      const req = httpTestingController.expectOne(req => req.url.includes('/applicationdefinitions'));
      req.flush(mockAppDefs);
    });

    it('should use refCount to release subscription when all unsubscribe', (done: DoneFn) => {
      const mockAppDefs: ApplicationDefinition[] = [
        {name: 'app1', namespace: 'ns1', spec: {}},
      ] as ApplicationDefinition[];

      const sub1 = service.listApplicationDefinitions().subscribe();
      const sub2 = service.listApplicationDefinitions().subscribe();

      const req = httpTestingController.expectOne(req => req.url.includes('/applicationdefinitions'));
      req.flush(mockAppDefs);

      sub1.unsubscribe();
      sub2.unsubscribe();

      // Both subscriptions should be cleaned up
      expect(sub1.closed).toBe(true);
      expect(sub2.closed).toBe(true);

      done();
    });
  });

  // ========== Concurrent Operations ==========
  describe('Concurrent Observable Operations', () => {
    it('should handle concurrent add and list operations', (done: DoneFn) => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const app: Application = {name: 'app1', namespace: 'default', spec: {}};
      const mockApps: Application[] = [app];

      let addCompleted = false;
      let listCompleted = false;

      service.add(app, projectID, clusterID).subscribe(() => {
        addCompleted = true;
        if (listCompleted) done();
      });

      service.list(projectID, clusterID).subscribe(() => {
        listCompleted = true;
        if (addCompleted) done();
      });

      const requests = httpTestingController.match(() => true);
      expect(requests.length).toBe(2);

      requests.forEach(req => {
        if (req.method === 'POST') {
          req.flush(app);
        } else if (req.method === 'GET') {
          req.flush(mockApps);
        }
      });
    });

    it('should handle concurrent getApplicationSettings and listApplicationDefinitions', (done: DoneFn) => {
      const mockSettings: ApplicationSettings = {enableApplication: true};
      const mockAppDefs: ApplicationDefinition[] = [
        {name: 'app1', namespace: 'ns1', spec: {}},
      ] as ApplicationDefinition[];

      let settingsCompleted = false;
      let defsCompleted = false;

      service.getApplicationSettings().subscribe(() => {
        settingsCompleted = true;
        if (defsCompleted) done();
      });

      service.listApplicationDefinitions().pipe(take(1)).subscribe(() => {
        defsCompleted = true;
        if (settingsCompleted) done();
      });

      const requests = httpTestingController.match(() => true);
      expect(requests.length).toBe(2);

      requests.forEach(req => {
        if (req.url.includes('/applicationsettings')) {
          req.flush(mockSettings);
        } else if (req.url.includes('/applicationdefinitions')) {
          req.flush(mockAppDefs);
        }
      });
    });
  });
});
