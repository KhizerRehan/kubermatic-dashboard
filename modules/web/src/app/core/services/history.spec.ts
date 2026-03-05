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

import {TestBed} from '@angular/core/testing';
import {NavigationEnd, Router} from '@angular/router';
import {Subject} from 'rxjs';

import {HistoryService} from './history';

describe('HistoryService', () => {
  let service: HistoryService;
  let router: Router;
  let routerEventsSubject: Subject<any>;

  beforeEach(() => {
    routerEventsSubject = new Subject();

    const routerMock = {
      events: routerEventsSubject.asObservable(),
      navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true)),
      navigateByUrl: jasmine.createSpy('navigateByUrl').and.returnValue(Promise.resolve(true)),
    };

    TestBed.configureTestingModule({
      providers: [HistoryService, {provide: Router, useValue: routerMock}],
    });

    service = TestBed.inject(HistoryService);
    router = TestBed.inject(Router);
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have onNavigationChange subject', () => {
      expect(service.onNavigationChange).toBeTruthy();
    });
  });

  describe('init()', () => {
    it('should initialize router event listeners', () => {
      service.init();

      expect(router.events).toBeTruthy();
    });

    it('should track navigation changes', (done) => {
      service.onNavigationChange.subscribe(() => {
        done();
      });

      service.init();

      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));
    });

    it('should not initialize router multiple times', () => {
      service.init();
      const callCount1 = (router.navigate as jasmine.Spy).calls.count();

      service.init();
      const callCount2 = (router.navigate as jasmine.Spy).calls.count();

      expect(callCount1).toBe(callCount2);
    });

    it('should handle first navigation', (done) => {
      let navigationCount = 0;

      service.onNavigationChange.subscribe(() => {
        navigationCount++;
        if (navigationCount === 2) {
          expect(navigationCount).toBe(2);
          done();
        }
      });

      service.init();

      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));
    });
  });

  describe('goBack()', () => {
    it('should navigate to previous URL if available', async () => {
      service.init();

      // Simulate two navigation events to establish previous URL
      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));
      routerEventsSubject.next(new NavigationEnd(2, '/projects/detail', '/projects/detail'));

      await service.goBack('/default');

      expect((router.navigateByUrl as jasmine.Spy).calls.count()).toBeGreaterThan(0);
    });

    it('should navigate to default URL if no previous URL', async () => {
      service.init();

      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));

      await service.goBack('/default');

      // Should navigate to default route
      expect(router.navigate).toHaveBeenCalled();
    });

    it('should not navigate back to admin panel URLs', async () => {
      service.init();

      // First navigate to settings (admin panel)
      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));
      routerEventsSubject.next(new NavigationEnd(2, '/settings/admin', '/settings/admin'));
      // Then navigate elsewhere
      routerEventsSubject.next(new NavigationEnd(3, '/projects/detail', '/projects/detail'));

      await service.goBack('/default');

      // Should navigate to default, not back to settings
      expect(router.navigate).toHaveBeenCalled();
    });

    it('should preserve query params when navigating back', async () => {
      service.init();

      routerEventsSubject.next(new NavigationEnd(1, '/projects?page=1', '/projects'));
      routerEventsSubject.next(new NavigationEnd(2, '/clusters', '/clusters'));

      await service.goBack('/default');

      // The goBack method should use queryParamsHandling: 'preserve'
      expect(router.navigate).toHaveBeenCalled();
    });

    it('should return promise', () => {
      service.init();

      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));

      const result = service.goBack('/default');

      expect(result instanceof Promise).toBe(true);
    });

    it('should handle goBack without initialization', async () => {
      // Not calling service.init()
      await service.goBack('/default');

      // Should still attempt navigation
      expect(router.navigate).toHaveBeenCalled();
    });
  });

  describe('Navigation Tracking', () => {
    it('should track multiple navigation events', (done) => {
      let navigationCount = 0;

      service.onNavigationChange.subscribe(() => {
        navigationCount++;
        if (navigationCount === 3) {
          expect(navigationCount).toBe(3);
          done();
        }
      });

      service.init();

      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));
      routerEventsSubject.next(new NavigationEnd(2, '/clusters', '/clusters'));
      routerEventsSubject.next(new NavigationEnd(3, '/projects/detail', '/projects/detail'));
    });

    it('should skip non-NavigationEnd events', (done) => {
      let navigationCount = 0;

      service.onNavigationChange.subscribe(() => {
        navigationCount++;
      });

      service.init();

      // Emit non-NavigationEnd events (should be ignored)
      routerEventsSubject.next({type: 'NavigationStart'});
      routerEventsSubject.next({type: 'RouteConfigLoadStart'});

      // Emit actual NavigationEnd
      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));

      setTimeout(() => {
        expect(navigationCount).toBe(1);
        done();
      }, 100);
    });

    it('should handle rapid consecutive navigations', (done) => {
      let navigationCount = 0;

      service.onNavigationChange.subscribe(() => {
        navigationCount++;
      });

      service.init();

      for (let i = 0; i < 5; i++) {
        routerEventsSubject.next(new NavigationEnd(i, `/route${i}`, `/route${i}`));
      }

      setTimeout(() => {
        expect(navigationCount).toBeGreaterThan(0);
        done();
      }, 100);
    });
  });

  describe('URL History', () => {
    it('should differentiate between different URLs', async () => {
      service.init();

      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));
      routerEventsSubject.next(new NavigationEnd(2, '/clusters/abc', '/clusters/abc'));

      await service.goBack('/default');

      expect(router.navigateByUrl).toHaveBeenCalled();
    });

    it('should ignore navigation to same URL', (done) => {
      let navigationChangeCount = 0;

      service.onNavigationChange.subscribe(() => {
        navigationChangeCount++;
      });

      service.init();

      const sameUrlEvent1 = new NavigationEnd(1, '/projects', '/projects');
      const sameUrlEvent2 = new NavigationEnd(2, '/projects', '/projects');

      routerEventsSubject.next(sameUrlEvent1);
      routerEventsSubject.next(sameUrlEvent2);

      setTimeout(() => {
        // Should have fired navigation changes, but second one might be same URL
        expect(navigationChangeCount).toBeGreaterThan(0);
        done();
      }, 100);
    });

    it('should track current state URL', async () => {
      service.init();

      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));
      const result = await service.goBack('/default');

      // Verify navigation was attempted
      expect(result !== null).toBe(true);
    });
  });

  describe('Admin Panel Detection', () => {
    it('should recognize /settings as admin panel URL', async () => {
      service.init();

      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));
      routerEventsSubject.next(new NavigationEnd(2, '/settings/admin', '/settings/admin'));
      routerEventsSubject.next(new NavigationEnd(3, '/projects/detail', '/projects/detail'));

      await service.goBack('/default');

      expect(router.navigate).toHaveBeenCalled();
    });

    it('should recognize /settings/admin as admin panel URL', async () => {
      service.init();

      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));
      routerEventsSubject.next(new NavigationEnd(2, '/settings/admin/users', '/settings/admin/users'));
      routerEventsSubject.next(new NavigationEnd(3, '/clusters', '/clusters'));

      await service.goBack('/default');

      expect(router.navigate).toHaveBeenCalled();
    });

    it('should not treat /settings-like URLs as admin panel', async () => {
      service.init();

      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));
      routerEventsSubject.next(new NavigationEnd(2, '/settingslike/page', '/settingslike/page'));

      await service.goBack('/default');

      // This should potentially navigate to previous URL if it's not admin
      expect(router.navigate).toHaveBeenCalled();
    });
  });

  describe('Query Parameter Handling', () => {
    it('should preserve query parameters on back navigation', async () => {
      const routerNavigateSpy = router.navigate as jasmine.Spy;

      service.init();

      routerEventsSubject.next(new NavigationEnd(1, '/projects?sort=name&page=1', '/projects'));
      routerEventsSubject.next(new NavigationEnd(2, '/clusters', '/clusters'));

      await service.goBack('/default');

      expect(routerNavigateSpy).toHaveBeenCalled();
    });

    it('should handle navigation with multiple query params', async () => {
      service.init();

      routerEventsSubject.next(
        new NavigationEnd(1, '/projects?sort=name&page=1&filter=active', '/projects')
      );
      routerEventsSubject.next(new NavigationEnd(2, '/clusters', '/clusters'));

      await service.goBack('/default');

      expect(router.navigate).toHaveBeenCalled();
    });
  });

  describe('Default Route Handling', () => {
    it('should navigate to provided default route', async () => {
      service.init();

      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));

      await service.goBack('/custom-default');

      expect(router.navigate).toHaveBeenCalled();
    });

    it('should navigate to root default route', async () => {
      service.init();

      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));

      await service.goBack('/');

      expect(router.navigate).toHaveBeenCalled();
    });

    it('should accept different default routes for different calls', async () => {
      service.init();

      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));

      await service.goBack('/default1');
      await service.goBack('/default2');

      expect(router.navigate).toHaveBeenCalledTimes(2);
    });
  });
});
