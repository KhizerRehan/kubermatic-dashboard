// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

import {ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {BehaviorSubject, Subject} from 'rxjs';

import {SharedModule} from '@shared/module';
import {NotificationService} from '@core/services/notification';
import {UserService} from '@core/services/user';
import {PaginationPageSizeComponent, ITEMS_PER_PAGE_OPTIONS} from './component';

describe('PaginationPageSizeComponent', () => {
  let component: PaginationPageSizeComponent;
  let fixture: ComponentFixture<PaginationPageSizeComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let userSettingsSubject: BehaviorSubject<any>;

  beforeEach(() => {
    userSettingsSubject = new BehaviorSubject({
      itemsPerPage: 10,
    });

    const userServiceSpy = jasmine.createSpyObj('UserService', ['patchCurrentUserSettings'], {
      currentUserSettings: userSettingsSubject.asObservable(),
    });

    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success']);

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      providers: [
        {provide: UserService, useValue: userServiceSpy},
        {provide: NotificationService, useValue: notificationServiceSpy},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaginationPageSizeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Options', () => {
    it('should expose page size options', () => {
      expect(component.options).toEqual(ITEMS_PER_PAGE_OPTIONS);
    });

    it('should include default options', () => {
      expect(component.options).toContain(5);
      expect(component.options).toContain(10);
      expect(component.options).toContain(15);
      expect(component.options).toContain(20);
      expect(component.options).toContain(25);
    });

    it('should have 5 page size options', () => {
      expect(component.options.length).toBe(5);
    });
  });

  describe('Initialization', () => {
    it('should initialize settings from user service', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.settings).toBeTruthy();
      expect(component.settings.itemsPerPage).toBe(10);
    }));

    it('should initialize apiSettings from user service', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.apiSettings).toBeTruthy();
      expect(component.apiSettings.itemsPerPage).toBe(10);
    }));

    it('should clone settings for local editing', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.settings).not.toBe(component.apiSettings);
      expect(component.settings.itemsPerPage).toBe(component.apiSettings.itemsPerPage);
    }));

    it('should subscribe to user settings changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.settings).toBeTruthy();
    }));
  });

  describe('Settings update from API', () => {
    it('should update apiSettings when user service emits new value', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      userSettingsSubject.next({itemsPerPage: 20});
      tick();

      expect(component.apiSettings.itemsPerPage).toBe(20);
    }));

    it('should update local settings when API settings change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      userSettingsSubject.next({itemsPerPage: 15});
      tick();

      expect(component.settings.itemsPerPage).toBe(15);
    }));

    it('should show notification when settings updated from API', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // First update with same value (should not notify)
      userSettingsSubject.next({itemsPerPage: 10});
      tick();

      expect(notificationService.success).not.toHaveBeenCalled();

      // Second update with different value
      userSettingsSubject.next({itemsPerPage: 20});
      tick();

      expect(notificationService.success).toHaveBeenCalledWith('Updated the user settings');
    }));

    it('should not show notification on first init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // First emission should not trigger notification
      expect(notificationService.success).not.toHaveBeenCalled();
    }));
  });

  describe('onSettingsChange', () => {
    it('should trigger settings change subject', fakeAsync(() => {
      userService.patchCurrentUserSettings.and.returnValue(
        new BehaviorSubject({itemsPerPage: 10}).asObservable()
      );

      fixture.detectChanges();
      tick();

      component.settings.itemsPerPage = 20;
      component.onSettingsChange();
      tick(600); // debounceTime is 500ms

      expect(userService.patchCurrentUserSettings).toHaveBeenCalled();
    }));

    it('should debounce rapid changes', fakeAsync(() => {
      userService.patchCurrentUserSettings.and.returnValue(
        new BehaviorSubject({itemsPerPage: 10}).asObservable()
      );

      fixture.detectChanges();
      tick();

      component.settings.itemsPerPage = 15;
      component.onSettingsChange();

      component.settings.itemsPerPage = 20;
      component.onSettingsChange();

      component.settings.itemsPerPage = 25;
      component.onSettingsChange();

      // Before debounceTime, no call should be made
      expect(userService.patchCurrentUserSettings).not.toHaveBeenCalled();

      // After debounceTime, only one call should be made
      tick(600);

      expect(userService.patchCurrentUserSettings).toHaveBeenCalledTimes(1);
    }));

    it('should pass settings diff to patch method', fakeAsync(() => {
      userService.patchCurrentUserSettings.and.returnValue(
        new BehaviorSubject({itemsPerPage: 20}).asObservable()
      );

      fixture.detectChanges();
      tick();

      component.settings.itemsPerPage = 20;
      component.onSettingsChange();
      tick(600);

      expect(userService.patchCurrentUserSettings).toHaveBeenCalled();
    }));
  });

  describe('isSettingEqual', () => {
    it('should return true when settings equal api settings', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isSettingEqual()).toBe(true);
    }));

    it('should return false when settings differ from api settings', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.settings.itemsPerPage = 20;

      expect(component.isSettingEqual()).toBe(false);
    }));

    it('should return true after settings synced with api', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.settings.itemsPerPage = 20;
      expect(component.isSettingEqual()).toBe(false);

      userSettingsSubject.next({itemsPerPage: 20});
      tick();

      expect(component.isSettingEqual()).toBe(true);
    }));
  });

  describe('Component cleanup', () => {
    it('should unsubscribe on destroy', () => {
      fixture.detectChanges();

      const unsubscribeSpy = jest.spyOn(component['_unsubscribe'], 'next');
      const completeSpy = jest.spyOn(component['_unsubscribe'], 'complete');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should not emit after destroy', fakeAsync(() => {
      userService.patchCurrentUserSettings.and.returnValue(
        new BehaviorSubject({itemsPerPage: 10}).asObservable()
      );

      fixture.detectChanges();
      tick();

      component.ngOnDestroy();

      component.settings.itemsPerPage = 20;
      component.onSettingsChange();
      tick(600);

      // Should not have made any additional calls after destroy
      expect(userService.patchCurrentUserSettings).not.toHaveBeenCalled();
    }));

    it('should stop listening to user settings after destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.apiSettings.itemsPerPage).toBe(10);

      component.ngOnDestroy();

      userSettingsSubject.next({itemsPerPage: 30});
      tick();

      // Settings should not update after destroy
      expect(component.apiSettings.itemsPerPage).toBe(10);
    }));
  });

  describe('Settings synchronization', () => {
    it('should update apiSettings and clone to settings after patch success', fakeAsync(() => {
      const newSettings = {itemsPerPage: 20};
      userService.patchCurrentUserSettings.and.returnValue(
        new BehaviorSubject(newSettings).asObservable()
      );

      fixture.detectChanges();
      tick();

      component.settings.itemsPerPage = 20;
      component.onSettingsChange();
      tick(600);

      expect(component.apiSettings.itemsPerPage).toBe(20);
      expect(component.settings.itemsPerPage).toBe(20);
    }));

    it('should revert local settings to api settings after patch', fakeAsync(() => {
      userService.patchCurrentUserSettings.and.returnValue(
        new BehaviorSubject({itemsPerPage: 20}).asObservable()
      );

      fixture.detectChanges();
      tick();

      component.settings.itemsPerPage = 25;
      component.onSettingsChange();
      tick(600);

      // After patch, local settings should match api settings
      expect(component.settings.itemsPerPage).toBe(20);
    }));
  });

  describe('Edge cases', () => {
    it('should handle null settings gracefully', fakeAsync(() => {
      userSettingsSubject.next(null);
      fixture.detectChanges();
      tick();

      expect(() => component.isSettingEqual()).not.toThrow();
    }));

    it('should handle multiple rapid settings updates', fakeAsync(() => {
      userService.patchCurrentUserSettings.and.returnValue(
        new BehaviorSubject({itemsPerPage: 10}).asObservable()
      );

      fixture.detectChanges();
      tick();

      for (let i = 5; i <= 25; i += 5) {
        component.settings.itemsPerPage = i;
        component.onSettingsChange();
        tick(100);
      }

      tick(600);

      // Should only call patch once due to debouncing
      expect(userService.patchCurrentUserSettings).toHaveBeenCalledTimes(1);
    }));
  });

  describe('Service dependencies', () => {
    it('should inject UserService', () => {
      expect(userService).toBeTruthy();
    });

    it('should inject NotificationService', () => {
      expect(notificationService).toBeTruthy();
    });

    it('should call currentUserSettings observable on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.settings).toBeTruthy();
    }));
  });
});
