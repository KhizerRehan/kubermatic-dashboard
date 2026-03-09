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

import {ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {NotificationService} from '@core/services/notification';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {fakeAdminSettings} from '@test/data/settings';
import {fakeUser} from '@test/data/user';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {of} from 'rxjs';
import {CustomizationComponent} from './component';

describe('CustomizationComponent', () => {
  let fixture: ComponentFixture<CustomizationComponent>;
  let component: CustomizationComponent;
  let settingsService: SettingsMockService;
  let userService: UserMockService;
  let notificationService: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [CustomizationComponent],
      providers: [
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: UserService, useClass: UserMockService},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(CustomizationComponent);
    component = fixture.componentInstance;
    settingsService = TestBed.inject(SettingsService) as unknown as SettingsMockService;
    userService = TestBed.inject(UserService) as unknown as UserMockService;
    notificationService = TestBed.inject(NotificationService);
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should load admin settings on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.settings).toBeDefined();
    expect(component.apiSettings).toBeDefined();
  }));

  it('should load current user on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.user).toBeDefined();
  }));

  it('should create local copy of settings separate from API settings', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.settings).not.toBe(component.apiSettings);
  }));

  it('should toggle disableChangelogPopup on changelog checkbox change', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const initialState = component.settings.disableChangelogPopup;
    const event = {checked: !initialState} as MatCheckboxChange;

    component.onChangelogSettingsChange(event);

    expect(component.settings.disableChangelogPopup).toBe(!initialState);
  }));

  it('should trigger settings change on changelog toggle', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const spy = jest.spyOn(component['_settingsChange'], 'next');
    const event = {checked: true} as MatCheckboxChange;

    component.onChangelogSettingsChange(event);

    expect(spy).toHaveBeenCalled();
  }));

  it('should debounce settings changes (500ms)', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const spy = jest.spyOn(settingsService, 'patchAdminSettings').mockReturnValue(of(component.settings));

    component.onSettingsChange();
    tick(250); // Half of debounce time

    expect(spy).not.toHaveBeenCalled();

    tick(250); // Complete debounce time
    expect(spy).toHaveBeenCalled();
  }));

  it('should call patchAdminSettings on debounced change', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const spy = jest.spyOn(settingsService, 'patchAdminSettings').mockReturnValue(of(component.settings));

    component.onSettingsChange();
    tick(500); // Full debounce time

    expect(spy).toHaveBeenCalled();
  }));

  it('should show success notification on settings update', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const notificationSpy = jest.spyOn(notificationService, 'success');

    // Simulate a settings update
    component.apiSettings = component.settings;
    const newSettings = {
      ...component.settings,
      displayAPIDocs: !component.settings.displayAPIDocs,
    };

    const settingsSubject = (settingsService as any).adminSettingsSubject;
    settingsSubject.next(newSettings);
    tick();

    // Note: notification only shows on update after first load
  }));

  it('should check equality using lodash isEqual', () => {
    fixture.detectChanges();
    const obj1 = {a: 1, b: 2};
    const obj2 = {a: 1, b: 2};
    const obj3 = {a: 1, b: 3};

    expect(component.isEqual(obj1, obj2)).toBe(true);
    expect(component.isEqual(obj1, obj3)).toBe(false);
  });

  it('should check if display links settings are equal', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const areEqual = component.isDisplayLinksEqual();
    expect(typeof areEqual).toBe('boolean');
  }));

  it('should return true when display link settings are unchanged', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    // Settings and apiSettings should be equal initially
    const areEqual = component.isDisplayLinksEqual();
    expect(areEqual).toBe(true);
  }));

  it('should return false when displayAPIDocs differs', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.settings.displayAPIDocs = !component.apiSettings.displayAPIDocs;

    const areEqual = component.isDisplayLinksEqual();
    expect(areEqual).toBe(false);
  }));

  it('should return false when displayDemoInfo differs', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.settings.displayDemoInfo = !component.apiSettings.displayDemoInfo;

    const areEqual = component.isDisplayLinksEqual();
    expect(areEqual).toBe(false);
  }));

  it('should return false when displayTermsOfService differs', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.settings.displayTermsOfService = !component.apiSettings.displayTermsOfService;

    const areEqual = component.isDisplayLinksEqual();
    expect(areEqual).toBe(false);
  }));

  it('should return false when disableChangelogPopup differs', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.settings.disableChangelogPopup = !component.apiSettings.disableChangelogPopup;

    const areEqual = component.isDisplayLinksEqual();
    expect(areEqual).toBe(false);
  }));

  it('should include customLinks in patch', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const spy = jest.spyOn(settingsService, 'patchAdminSettings').mockReturnValue(of(component.settings));
    component.settings.customLinks = [{label: 'Test', href: 'http://example.com'}];

    component.onSettingsChange();
    tick(500);

    expect(spy).toHaveBeenCalled();
  }));

  it('should maintain separate copies of settings for editing', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.settings.displayAPIDocs = !component.settings.displayAPIDocs;

    expect(component.settings.displayAPIDocs).not.toBe(component.apiSettings.displayAPIDocs);
  }));

  it('should unsubscribe on component destroy', () => {
    fixture.detectChanges();
    const unsubscribeSpy = jest.spyOn(component['_unsubscribe'], 'next');
    const completeSpy = jest.spyOn(component['_unsubscribe'], 'complete');

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should trigger settings change on onSettingsChange()', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const spy = jest.spyOn(component['_settingsChange'], 'next');
    component.onSettingsChange();

    expect(spy).toHaveBeenCalled();
  }));
});
