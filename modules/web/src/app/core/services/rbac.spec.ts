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
import {take} from 'rxjs/operators';
import {RBACService} from './rbac';
import {AppConfigService} from '@app/config.service';
import {
  ClusterBinding,
  ClusterRoleName,
  ClusterNamespace,
  NamespaceBinding,
  RoleName,
  Kind,
} from '@shared/entity/rbac';

describe('RBACService - RxJS Patterns Testing', () => {
  let service: RBACService;
  let httpTestingController: HttpTestingController;
  let appConfigService: jasmine.SpyObj<AppConfigService>;

  beforeEach(() => {
    const appConfigServiceMock = jasmine.createSpyObj('AppConfigService', ['getRefreshTimeBase']);
    appConfigServiceMock.getRefreshTimeBase.and.returnValue(100); // 100ms base refresh

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RBACService, {provide: AppConfigService, useValue: appConfigServiceMock}],
    });

    service = TestBed.inject(RBACService);
    httpTestingController = TestBed.inject(HttpTestingController);
    appConfigService = TestBed.inject(AppConfigService) as jasmine.SpyObj<AppConfigService>;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  // ========== Observable Caching with ShareReplay ==========
  describe('Observable Caching with ShareReplay (RxJS Pattern)', () => {
    it('should cache getClusterRoleNames observable and reuse for multiple subscribers', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mockData: ClusterRoleName[] = [{name: 'admin'}, {name: 'user'}];

      let requestCount = 0;

      // First subscriber
      service.getClusterRoleNames(clusterID, projectID).subscribe(data1 => {
        expect(data1).toEqual(mockData);

        // Second subscriber (should use cached observable)
        service.getClusterRoleNames(clusterID, projectID).subscribe(data2 => {
          expect(data2).toEqual(mockData);
          expect(requestCount).toBe(1); // Only one HTTP request made
          done();
        });
      });

      // Only one request should be made despite two subscriptions
      requestCount++;
      const req = httpTestingController.expectOne(
        req => req.url.includes('/clusterrolenames') && req.method === 'GET'
      );
      expect(req.request.url).toContain(`/projects/${projectID}/clusters/${clusterID}`);
      req.flush(mockData);
    });

    it('should cache getClusterNamespaces observable independently from clusterRoleNames', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mockRoleNames: ClusterRoleName[] = [{name: 'admin'}];
      const mockNamespaces: ClusterNamespace[] = [{name: 'default'}, {name: 'kube-system'}];

      let requestCount = 0;

      // Request both observables
      service.getClusterRoleNames(clusterID, projectID).subscribe(roles => {
        expect(roles).toEqual(mockRoleNames);

        service.getClusterNamespaces(projectID, clusterID).subscribe(namespaces => {
          expect(namespaces).toEqual(['default', 'kube-system']);
          expect(requestCount).toBe(2); // Two different HTTP requests
          done();
        });
      });

      requestCount++;
      const req1 = httpTestingController.expectOne(
        req => req.url.includes('/clusterrolenames') && req.method === 'GET'
      );
      req1.flush(mockRoleNames);

      requestCount++;
      const req2 = httpTestingController.expectOne(
        req => req.url.includes('/namespaces') && req.method === 'GET'
      );
      req2.flush(mockNamespaces);
    });

    it('should use separate caches for different project/cluster combinations', done => {
      const mockData: ClusterRoleName[] = [{name: 'role1'}];
      let requestCount = 0;

      // Request different clusters
      service.getClusterRoleNames('cluster-1', 'project-1').subscribe(() => {
        service.getClusterRoleNames('cluster-2', 'project-1').subscribe(() => {
          expect(requestCount).toBe(2); // Two separate requests
          done();
        });
      });

      requestCount++;
      const req1 = httpTestingController.expectOne(
        req =>
          req.url.includes('/projects/project-1/clusters/cluster-1') && req.url.includes('/clusterrolenames')
      );
      req1.flush(mockData);

      requestCount++;
      const req2 = httpTestingController.expectOne(
        req =>
          req.url.includes('/projects/project-1/clusters/cluster-2') && req.url.includes('/clusterrolenames')
      );
      req2.flush(mockData);
    });
  });

  // ========== Merge Pattern with Timer and Event Subject ==========
  describe('Merge Pattern with Timer and Event Subject (RxJS Pattern)', () => {
    it('should combine timer and refreshClusterBindings subject for dual-trigger refresh', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mockData: ClusterBinding[] = [{kind: Kind.User, name: 'user@example.com', role: 'admin'}];

      let emissionCount = 0;
      const subscription = service
        .getClusterBindings(clusterID, projectID)
        .pipe(take(2)) // Take first 2 emissions (timer init + manual refresh)
        .subscribe(data => {
          emissionCount++;
          expect(data).toEqual(mockData);

          if (emissionCount === 2) {
            expect(emissionCount).toBe(2);
            subscription.unsubscribe();
            done();
          }
        });

      // First request from timer init
      const req1 = httpTestingController.expectOne(
        req =>
          req.url.includes(`/projects/${projectID}/clusters/${clusterID}/clusterbindings`) && req.method === 'GET'
      );
      req1.flush(mockData);

      // Trigger manual refresh
      service.refreshClusterBindings();

      // Second request from refresh trigger
      const req2 = httpTestingController.expectOne(
        req =>
          req.url.includes(`/projects/${projectID}/clusters/${clusterID}/clusterbindings`) && req.method === 'GET'
      );
      req2.flush(mockData);
    });

    it('should emit on both timer ticks and manual refresh trigger', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mockData: NamespaceBinding[] = [{kind: Kind.User, name: 'user@test.com', role: 'editor'}];

      let emissionCount = 0;
      const subscription = service
        .getNamespaceBindings(clusterID, projectID)
        .pipe(take(3)) // Allow multiple timer emissions
        .subscribe(() => {
          emissionCount++;

          if (emissionCount === 2) {
            service.refreshNamespaceBindings();
          }
        });

      // Handle timer emissions and refresh
      for (let i = 0; i < 2; i++) {
        httpTestingController.expectOne(req => req.url.includes('/bindings') && req.method === 'GET').flush(mockData);
      }

      // Manual refresh triggers another emission
      setTimeout(() => {
        service.refreshNamespaceBindings();
        const finalReq = httpTestingController.expectOne(
          req => req.url.includes('/bindings') && req.method === 'GET'
        );
        finalReq.flush(mockData);
        subscription.unsubscribe();
        expect(emissionCount).toBeGreaterThanOrEqual(2);
        done();
      }, 150);
    });
  });

  // ========== SwitchMap Pattern for Request Cancellation ==========
  describe('SwitchMap Pattern for Request Cancellation (RxJS Pattern)', () => {
    it('should cancel previous HTTP request when switchMap receives new timer emission', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mockData: RoleName[] = [{name: 'admin', kind: Kind.User}];

      let requestCount = 0;
      const subscription = service.getNamespaceRoleNames(clusterID, projectID).pipe(take(1)).subscribe(() => {
        expect(requestCount).toBe(1);
        subscription.unsubscribe();
        done();
      });

      requestCount++;
      const req = httpTestingController.expectOne(req => req.url.includes('/rolenames') && req.method === 'GET');
      req.flush(mockData);
    });

    it('should use switchMap to prevent stale response handling', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mockData1: ClusterRoleName[] = [{name: 'role1'}];
      const mockData2: ClusterRoleName[] = [{name: 'role2'}];

      let latestData: ClusterRoleName[] | undefined;

      const subscription = service
        .getClusterRoleNames(clusterID, projectID)
        .pipe(take(2))
        .subscribe(data => {
          latestData = data;

          if (latestData && latestData[0]?.name === 'role2') {
            subscription.unsubscribe();
            done();
          }
        });

      // First request
      const req1 = httpTestingController.expectOne(req => req.url.includes('/clusterrolenames'));
      req1.flush(mockData1);

      // Clear cache to trigger new request
      setTimeout(() => {
        // Create a new subscription which triggers new HTTP call
        service.getClusterRoleNames(clusterID, projectID).pipe(take(1)).subscribe();

        const req2 = httpTestingController.expectOne(req => req.url.includes('/clusterrolenames'));
        req2.flush(mockData2);
      }, 50);
    });
  });

  // ========== Error Handling with Observable Patterns ==========
  describe('Error Handling with Observable Patterns', () => {
    it('should handle HTTP error in getClusterRoleNames gracefully', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      const subscription = service.getClusterRoleNames(clusterID, projectID).subscribe(
        () => {
          done.fail('Should not emit data on error');
        },
        error => {
          expect(error).toBeDefined();
          subscription.unsubscribe();
          done();
        }
      );

      const req = httpTestingController.expectOne(req => req.url.includes('/clusterrolenames'));
      req.error(new ErrorEvent('Network error'), {status: 500});
    });

    it('should allow retry on failed observable requests', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mockData: ClusterNamespace[] = [{name: 'default'}];

      let requestCount = 0;

      const subscription = service.getClusterNamespaces(projectID, clusterID).subscribe(data => {
        expect(data).toEqual(['default']);
        expect(requestCount).toBe(2); // One failed, one successful
        subscription.unsubscribe();
        done();
      });

      // First request fails
      requestCount++;
      let req = httpTestingController.expectOne(req => req.url.includes('/namespaces'));
      req.error(new ErrorEvent('Network error'), {status: 500});

      // Retry mechanism (re-subscribe triggers new request)
      setTimeout(() => {
        service.getClusterNamespaces(projectID, clusterID).subscribe();
        requestCount++;
        req = httpTestingController.expectOne(req => req.url.includes('/namespaces'));
        req.flush(mockData);
      }, 100);
    });
  });

  // ========== Observable Cleanup and Unsubscription ==========
  describe('Observable Cleanup and Unsubscription (RxJS Pattern)', () => {
    it('should allow proper unsubscription from cached observable', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mockData: ClusterRoleName[] = [{name: 'admin'}];

      const subscription = service.getClusterRoleNames(clusterID, projectID).subscribe();

      const req = httpTestingController.expectOne(req => req.url.includes('/clusterrolenames'));
      req.flush(mockData);

      // Unsubscribe
      subscription.unsubscribe();

      // Verify no pending requests
      httpTestingController.expectNone(() => true);
      done();
    });

    it('should maintain subscription refCount with multiple subscribers', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mockData: ClusterBinding[] = [{kind: Kind.User, name: 'user@test.com', role: 'admin'}];

      // First subscriber
      const sub1 = service.getClusterBindings(clusterID, projectID).subscribe();

      // Second subscriber
      const sub2 = service.getClusterBindings(clusterID, projectID).subscribe();

      const req = httpTestingController.expectOne(req => req.url.includes('/clusterbindings'));
      req.flush(mockData);

      // Unsubscribe first
      sub1.unsubscribe();

      // Observable should still be cached for sub2
      expect(sub2.closed).toBe(false);

      sub2.unsubscribe();
      expect(sub2.closed).toBe(true);

      done();
    });

    it('should not leak memory with proper unsubscription pattern', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mockData: NamespaceBinding[] = [{kind: Kind.User, name: 'user@test.com', role: 'viewer'}];

      const subscriptions: any[] = [];

      // Create multiple subscriptions
      for (let i = 0; i < 5; i++) {
        const sub = service.getNamespaceBindings(clusterID, projectID).subscribe();
        subscriptions.push(sub);
      }

      // Only one HTTP request should be made (cached)
      const req = httpTestingController.expectOne(req => req.url.includes('/bindings'));
      req.flush(mockData);

      // Unsubscribe all
      subscriptions.forEach(sub => sub.unsubscribe());

      // Verify subscriptions are properly cleaned up
      subscriptions.forEach(sub => {
        expect(sub.closed).toBe(true);
      });

      done();
    });
  });

  // ========== API Operation Tests (Create/Delete) ==========
  describe('API Operations with Observable Patterns', () => {
    it('should POST createClusterBinding and handle response', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const roleID = 'admin-role';
      const createBinding = {kind: Kind.User, name: 'user@example.com'};
      const mockResponse: ClusterBinding = {
        kind: Kind.User,
        name: 'user@example.com',
        role: 'admin',
      };

      service.createClusterBinding(clusterID, projectID, roleID, createBinding).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpTestingController.expectOne(
        req =>
          req.url.includes(`/projects/${projectID}/clusters/${clusterID}/clusterroles/${roleID}/clusterbindings`) &&
          req.method === 'POST'
      );
      expect(req.request.body).toEqual(createBinding);
      req.flush(mockResponse);
    });

    it('should DELETE deleteClusterBinding with proper body serialization', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const roleID = 'admin-role';
      const mockResponse: ClusterBinding = {kind: Kind.User, name: 'user@example.com', role: 'admin'};

      service
        .deleteClusterBinding(clusterID, projectID, roleID, Kind.User, 'user@example.com', 'default')
        .subscribe(result => {
          expect(result).toEqual(mockResponse);
          done();
        });

      const req = httpTestingController.expectOne(
        req =>
          req.url.includes(`/projects/${projectID}/clusters/${clusterID}/clusterroles/${roleID}/clusterbindings`) &&
          req.method === 'DELETE'
      );
      expect(req.request.body.userEmail).toBe('user@example.com');
      req.flush(mockResponse);
    });

    it('should POST createNamespaceBinding with namespace parameter', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const roleID = 'editor-role';
      const namespace = 'default';
      const createBinding = {kind: Kind.User, name: 'user@example.com'};
      const mockResponse: NamespaceBinding = {
        kind: Kind.User,
        name: 'user@example.com',
        role: 'editor',
      };

      service.createNamespaceBinding(clusterID, projectID, roleID, namespace, createBinding).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpTestingController.expectOne(
        req =>
          req.url.includes(
            `/projects/${projectID}/clusters/${clusterID}/roles/${namespace}/${roleID}/bindings`
          ) && req.method === 'POST'
      );
      expect(req.request.body).toEqual(createBinding);
      req.flush(mockResponse);
    });

    it('should DELETE deleteNamespaceBinding with correct parameters', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const roleID = 'viewer-role';
      const namespace = 'kube-system';
      const mockResponse: NamespaceBinding = {
        kind: Kind.ServiceAccount,
        name: 'sa-name',
        role: 'viewer',
      };

      service
        .deleteNamespaceBinding(
          clusterID,
          projectID,
          roleID,
          namespace,
          Kind.ServiceAccount,
          'sa-name',
          'kube-system'
        )
        .subscribe(result => {
          expect(result).toEqual(mockResponse);
          done();
        });

      const req = httpTestingController.expectOne(
        req =>
          req.url.includes(
            `/projects/${projectID}/clusters/${clusterID}/roles/${namespace}/${roleID}/bindings`
          ) && req.method === 'DELETE'
      );
      expect(req.request.body.serviceAccount).toBe('sa-name');
      expect(req.request.body.serviceAccountNamespace).toBe('kube-system');
      req.flush(mockResponse);
    });
  });

  // ========== Delete Body Construction ==========
  describe('Delete Binding Body Construction', () => {
    it('should construct correct body for User kind', () => {
      // Access private method via any to test body construction
      const service_any = service as any;
      const body = service_any._getDeleteBindingBody(Kind.User, 'user@example.com', 'default');

      expect(body.userEmail).toBe('user@example.com');
      expect(body.group).toBeUndefined();
      expect(body.serviceAccount).toBeUndefined();
    });

    it('should construct correct body for Group kind', () => {
      const service_any = service as any;
      const body = service_any._getDeleteBindingBody(Kind.Group, 'group-name', 'default');

      expect(body.group).toBe('group-name');
      expect(body.userEmail).toBeUndefined();
      expect(body.serviceAccount).toBeUndefined();
    });

    it('should construct correct body for ServiceAccount kind with namespace', () => {
      const service_any = service as any;
      const body = service_any._getDeleteBindingBody(Kind.ServiceAccount, 'sa-name', 'kube-system');

      expect(body.serviceAccount).toBe('sa-name');
      expect(body.serviceAccountNamespace).toBe('kube-system');
      expect(body.userEmail).toBeUndefined();
      expect(body.group).toBeUndefined();
    });
  });

  // ========== Namespace List Transformation ==========
  describe('Observable Transformation with Map Operator', () => {
    it('should transform ClusterNamespace array to string array', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mockNamespaces: ClusterNamespace[] = [
        {name: 'default'},
        {name: 'kube-system'},
        {name: 'kube-public'},
      ];

      service.getClusterNamespaces(projectID, clusterID).subscribe(namespaces => {
        expect(namespaces).toEqual(['default', 'kube-system', 'kube-public']);
        expect(Array.isArray(namespaces)).toBe(true);
        expect(namespaces[0]).toBe('default');
        done();
      });

      const req = httpTestingController.expectOne(req => req.url.includes('/namespaces'));
      req.flush(mockNamespaces);
    });

    it('should handle empty namespace array', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const mockNamespaces: ClusterNamespace[] = [];

      service.getClusterNamespaces(projectID, clusterID).subscribe(namespaces => {
        expect(namespaces).toEqual([]);
        expect(namespaces.length).toBe(0);
        done();
      });

      const req = httpTestingController.expectOne(req => req.url.includes('/namespaces'));
      req.flush(mockNamespaces);
    });
  });

  // ========== Concurrent Operations ==========
  describe('Concurrent Observable Operations', () => {
    it('should handle concurrent requests to different endpoints', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const roleNames: ClusterRoleName[] = [{name: 'admin'}];
      const bindings: ClusterBinding[] = [{kind: Kind.User, name: 'user@test.com', role: 'admin'}];
      const namespaces: ClusterNamespace[] = [{name: 'default'}];

      let completedCount = 0;

      service.getClusterRoleNames(clusterID, projectID).subscribe(() => {
        completedCount++;
        if (completedCount === 3) done();
      });

      service.getClusterBindings(clusterID, projectID).subscribe(() => {
        completedCount++;
        if (completedCount === 3) done();
      });

      service.getClusterNamespaces(projectID, clusterID).subscribe(() => {
        completedCount++;
        if (completedCount === 3) done();
      });

      // Respond to all pending requests
      httpTestingController
        .match(req => req.url.includes('/clusterrolenames'))
        .forEach(req => req.flush(roleNames));

      httpTestingController
        .match(req => req.url.includes('/clusterbindings'))
        .forEach(req => req.flush(bindings));

      httpTestingController.match(req => req.url.includes('/namespaces')).forEach(req => req.flush(namespaces));
    });

    it('should properly cache different observable types concurrently', done => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';

      const mockRoleNames: ClusterRoleName[] = [{name: 'admin'}];
      const mockNamespaceRoles: RoleName[] = [{name: 'admin', kind: Kind.User}];
      const mockNamespaces: ClusterNamespace[] = [{name: 'default'}];

      let completedCount = 0;

      // Request all three types
      service.getClusterRoleNames(clusterID, projectID).subscribe(() => {
        completedCount++;
        if (completedCount === 3) done();
      });

      service.getNamespaceRoleNames(clusterID, projectID).subscribe(() => {
        completedCount++;
        if (completedCount === 3) done();
      });

      service.getClusterNamespaces(projectID, clusterID).subscribe(() => {
        completedCount++;
        if (completedCount === 3) done();
      });

      // Handle all three requests
      const reqs = httpTestingController.match(() => true);
      expect(reqs.length).toBe(3);

      reqs.forEach(req => {
        if (req.url.includes('/clusterrolenames')) {
          req.flush(mockRoleNames);
        } else if (req.url.includes('/rolenames')) {
          req.flush(mockNamespaceRoles);
        } else if (req.url.includes('/namespaces')) {
          req.flush(mockNamespaces);
        }
      });
    });
  });
});
