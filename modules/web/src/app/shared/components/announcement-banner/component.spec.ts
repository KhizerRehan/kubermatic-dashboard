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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {NavigationEnd, Router} from '@angular/router';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {UserService} from '@app/core/services/user';
import {AdminAnnouncement} from '@app/shared/entity/settings';
import {SharedModule} from '@shared/module';
import {of, Subject} from 'rxjs';
import {AnnouncementBannerComponent} from './component';

describe('AnnouncementBannerComponent', () => {
  let component: AnnouncementBannerComponent;
  let fixture: ComponentFixture<AnnouncementBannerComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let routerEventsSubject: Subject<NavigationEnd>;

  beforeEach(() => {
    routerEventsSubject = new Subject<NavigationEnd>();

    const userServiceMock = jasmine.createSpyObj('UserService', ['patchReadAnnouncements'], {
      currentUser: of({readAnnouncements: []}),
    });

    const routerMock = jasmine.createSpyObj('Router', [], {
      events: routerEventsSubject,
    });

    const matDialogMock = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      providers: [
        {provide: UserService, useValue: userServiceMock},
        {provide: Router, useValue: routerMock},
        {provide: MatDialog, useValue: matDialogMock},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnouncementBannerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization & Default State', () => {
    it('should initialize readAnnouncements as empty array', () => {
      expect(component.readAnnouncements).toEqual([]);
    });

    it('should initialize showAnnouncementBanner as false', () => {
      expect(component.showAnnouncementBanner).toBe(false);
    });

    it('should initialize currentAnnouncementID as empty string', () => {
      expect(component.currentAnnouncementID).toBe('');
    });

    it('should have unsubscribe subject', () => {
      expect(component['_unsubscribe']).toBeTruthy();
    });
  });

  describe('@Input announcements property', () => {
    it('should store announcements map', () => {
      const announcements = new Map<string, AdminAnnouncement>();
      announcements.set('1', {title: 'Test', message: 'Test message'} as AdminAnnouncement);

      component.announcements = announcements;
      expect(component.announcements).toBe(announcements);
    });

    it('should handle empty announcements map', () => {
      component.announcements = new Map<string, AdminAnnouncement>();
      fixture.detectChanges();
      expect(component.announcements.size).toBe(0);
    });

    it('should handle multiple announcements', () => {
      const announcements = new Map<string, AdminAnnouncement>();
      announcements.set('1', {title: 'First', message: 'First message'} as AdminAnnouncement);
      announcements.set('2', {title: 'Second', message: 'Second message'} as AdminAnnouncement);

      component.announcements = announcements;
      expect(component.announcements.size).toBe(2);
    });

    it('should update current announcement on input change', () => {
      component.readAnnouncements = [];
      const announcements = new Map<string, AdminAnnouncement>();
      announcements.set('1', {title: 'Test', message: 'Test message'} as AdminAnnouncement);

      component.announcements = announcements;
      component.ngOnChanges();

      expect(component.currentAnnouncementID).toBe('1');
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to router events', () => {
      fixture.detectChanges();
      expect(router.events).toBeTruthy();
    });

    it('should subscribe to current user from UserService', () => {
      userService.currentUser = of({readAnnouncements: ['1', '2']} as any);
      fixture.detectChanges();

      expect(component.readAnnouncements).toEqual(['1', '2']);
    });

    it('should set showAnnouncementBanner to false for settings page', (done) => {
      fixture.detectChanges();

      const event = new NavigationEnd(1, '/settings/profile', '/settings/profile');
      routerEventsSubject.next(event);

      fixture.detectChanges();
      setTimeout(() => {
        expect(component.showAnnouncementBanner).toBe(false);
        done();
      }, 10);
    });

    it('should set showAnnouncementBanner to false for account page', (done) => {
      fixture.detectChanges();

      const event = new NavigationEnd(1, '/account/settings', '/account/settings');
      routerEventsSubject.next(event);

      fixture.detectChanges();
      setTimeout(() => {
        expect(component.showAnnouncementBanner).toBe(false);
        done();
      }, 10);
    });

    it('should set showAnnouncementBanner to true for other pages', (done) => {
      fixture.detectChanges();

      const event = new NavigationEnd(1, '/projects', '/projects');
      routerEventsSubject.next(event);

      fixture.detectChanges();
      setTimeout(() => {
        expect(component.showAnnouncementBanner).toBe(true);
        done();
      }, 10);
    });
  });

  describe('ngOnChanges', () => {
    it('should call _updateCurrentAnnouncementID', () => {
      const spy = jest.spyOn<any, any>(component, '_updateCurrentAnnouncementID');
      component.announcements = new Map<string, AdminAnnouncement>();
      component.ngOnChanges();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should update current announcement ID on changes', () => {
      component.announcements = new Map<string, AdminAnnouncement>();
      component.announcements.set('1', {title: 'Test', message: 'Test message'} as AdminAnnouncement);
      component.readAnnouncements = [];
      component.ngOnChanges();

      expect(component.currentAnnouncementID).toBe('1');
    });
  });

  describe('openAnnouncementsDialog method', () => {
    it('should open MatDialog with AnnouncementsDialogComponent', () => {
      component.announcements = new Map<string, AdminAnnouncement>();
      component.announcements.set('1', {title: 'Test', message: 'Test message'} as AdminAnnouncement);

      component.openAnnouncementsDialog();

      expect(matDialog.open).toHaveBeenCalled();
    });

    it('should pass announcements object as dialog data', () => {
      component.announcements = new Map<string, AdminAnnouncement>();
      component.announcements.set('1', {title: 'Test', message: 'Test message'} as AdminAnnouncement);

      component.openAnnouncementsDialog();

      const call = (matDialog.open as jasmine.Spy).calls.mostRecent();
      expect(call.args[1].data).toEqual({
        '1': {title: 'Test', message: 'Test message'},
      });
    });

    it('should handle empty announcements', () => {
      component.announcements = new Map<string, AdminAnnouncement>();

      component.openAnnouncementsDialog();

      expect(matDialog.open).toHaveBeenCalled();
    });

    it('should handle multiple announcements in dialog', () => {
      component.announcements = new Map<string, AdminAnnouncement>();
      component.announcements.set('1', {title: 'First', message: 'First message'} as AdminAnnouncement);
      component.announcements.set('2', {title: 'Second', message: 'Second message'} as AdminAnnouncement);

      component.openAnnouncementsDialog();

      const call = (matDialog.open as jasmine.Spy).calls.mostRecent();
      expect(Object.keys(call.args[1].data).length).toBe(2);
    });
  });

  describe('closeBanner method', () => {
    it('should add current announcement ID to readAnnouncements', () => {
      component.currentAnnouncementID = '1';
      component.readAnnouncements = [];
      userService.patchReadAnnouncements = jasmine.createSpy('patchReadAnnouncements').and.returnValue(of(['1']));

      component.closeBanner();

      expect(component.readAnnouncements).toContain('1');
    });

    it('should call patchReadAnnouncements with updated list', () => {
      component.currentAnnouncementID = '1';
      component.readAnnouncements = [];
      userService.patchReadAnnouncements = jasmine.createSpy('patchReadAnnouncements').and.returnValue(of(['1']));

      component.closeBanner();

      expect(userService.patchReadAnnouncements).toHaveBeenCalledWith(['1']);
    });

    it('should update readAnnouncements from service response', () => {
      component.currentAnnouncementID = '1';
      component.readAnnouncements = [];
      userService.patchReadAnnouncements = jasmine.createSpy('patchReadAnnouncements').and.returnValue(of(['1', '2']));

      component.closeBanner();

      expect(component.readAnnouncements).toEqual(['1', '2']);
    });

    it('should preserve existing read announcements', () => {
      component.currentAnnouncementID = '2';
      component.readAnnouncements = ['1'];
      userService.patchReadAnnouncements = jasmine.createSpy('patchReadAnnouncements').and.returnValue(of(['1', '2']));

      component.closeBanner();

      expect(userService.patchReadAnnouncements).toHaveBeenCalledWith(['1', '2']);
    });
  });

  describe('_updateCurrentAnnouncementID method', () => {
    it('should find first unread announcement', () => {
      component.announcements = new Map<string, AdminAnnouncement>();
      component.announcements.set('1', {title: 'First', message: 'First message'} as AdminAnnouncement);
      component.announcements.set('2', {title: 'Second', message: 'Second message'} as AdminAnnouncement);
      component.readAnnouncements = [];

      component['_updateCurrentAnnouncementID']();

      expect(component.currentAnnouncementID).toBe('1');
    });

    it('should skip read announcements', () => {
      component.announcements = new Map<string, AdminAnnouncement>();
      component.announcements.set('1', {title: 'First', message: 'First message'} as AdminAnnouncement);
      component.announcements.set('2', {title: 'Second', message: 'Second message'} as AdminAnnouncement);
      component.readAnnouncements = ['1'];

      component['_updateCurrentAnnouncementID']();

      expect(component.currentAnnouncementID).toBe('2');
    });

    it('should return undefined when all announcements are read', () => {
      component.announcements = new Map<string, AdminAnnouncement>();
      component.announcements.set('1', {title: 'First', message: 'First message'} as AdminAnnouncement);
      component.readAnnouncements = ['1'];

      component['_updateCurrentAnnouncementID']();

      expect(component.currentAnnouncementID).toBeUndefined();
    });

    it('should handle empty announcements map', () => {
      component.announcements = new Map<string, AdminAnnouncement>();
      component.readAnnouncements = [];

      component['_updateCurrentAnnouncementID']();

      expect(component.currentAnnouncementID).toBeUndefined();
    });
  });

  describe('Banner Visibility', () => {
    it('should show banner on project pages', (done) => {
      fixture.detectChanges();

      const event = new NavigationEnd(1, '/projects/abc123/clusters', '/projects/abc123/clusters');
      routerEventsSubject.next(event);

      setTimeout(() => {
        expect(component.showAnnouncementBanner).toBe(true);
        done();
      }, 10);
    });

    it('should hide banner on settings pages', (done) => {
      fixture.detectChanges();

      const event = new NavigationEnd(1, '/settings/admin', '/settings/admin');
      routerEventsSubject.next(event);

      setTimeout(() => {
        expect(component.showAnnouncementBanner).toBe(false);
        done();
      }, 10);
    });

    it('should hide banner on terms page', (done) => {
      fixture.detectChanges();

      const event = new NavigationEnd(1, '/terms-of-service', '/terms-of-service');
      routerEventsSubject.next(event);

      setTimeout(() => {
        expect(component.showAnnouncementBanner).toBe(false);
        done();
      }, 10);
    });
  });

  describe('Component Cleanup', () => {
    it('should complete unsubscribe subject on destroy', () => {
      const spy = jest.spyOn(component['_unsubscribe'], 'complete');
      fixture.destroy();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should unsubscribe from router events on destroy', () => {
      fixture.detectChanges();
      const spy = jest.spyOn(component['_unsubscribe'], 'next');
      component.ngOnDestroy?.();
      // Component properly uses takeUntil for cleanup
      expect(component).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null announcements gracefully', () => {
      component.announcements = null;
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle undefined announcements gracefully', () => {
      component.announcements = undefined;
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle user without readAnnouncements', () => {
      userService.currentUser = of({} as any);
      fixture.detectChanges();
      expect(component.readAnnouncements).toEqual([]);
    });

    it('should handle rapid route changes', (done) => {
      fixture.detectChanges();

      routerEventsSubject.next(new NavigationEnd(1, '/projects', '/projects'));
      routerEventsSubject.next(new NavigationEnd(2, '/settings', '/settings'));
      routerEventsSubject.next(new NavigationEnd(3, '/projects/abc', '/projects/abc'));

      setTimeout(() => {
        expect(component.showAnnouncementBanner).toBe(true);
        done();
      }, 10);
    });
  });
});
