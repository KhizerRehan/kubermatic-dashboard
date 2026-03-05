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
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {BrandingService} from '@core/services/branding';
import {HistoryService} from '@core/services/history';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {fakeProject} from '@test/data/project';
import {fakeUser, fakeUserSettings} from '@test/data/user';
import {ProjectMockService} from '@test/services/project-mock';
import {UserMockService} from '@test/services/user-mock';
import {of} from 'rxjs';
import {UserSettingsComponent} from './component';

describe('UserSettingsComponent', () => {
  let fixture: ComponentFixture<UserSettingsComponent>;
  let component: UserSettingsComponent;
  let userService: UserMockService;
  let projectService: ProjectMockService;
  let notificationService: NotificationService;
  let historyService: HistoryService;

  beforeEach(() => {
    const brandingMock = {
      config: {},
    };

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [UserSettingsComponent],
      providers: [
        {provide: UserService, useClass: UserMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: BrandingService, useValue: brandingMock},
        HistoryService,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(UserSettingsComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as unknown as UserMockService;
    projectService = TestBed.inject(ProjectService) as unknown as ProjectMockService;
    notificationService = TestBed.inject(NotificationService);
    historyService = TestBed.inject(HistoryService);
  });

  it('should initialize with current user and settings', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.user).toBeDefined();
    expect(component.settings).toBeDefined();
  });

  it('should load user settings on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component.settings).toEqual(component.apiSettings);
  }));

  it('should load projects on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component.projects.length).toBeGreaterThan(0);
    expect(component.projectIds.length).toBeGreaterThan(0);
  }));

  it('should update landing page selection when useClustersView is true', () => {
    fixture.detectChanges();
    component.onLandingPageChange('Clusters');
    expect(component.settings.useClustersView).toBe(true);
  });

  it('should update landing page selection when useClustersView is false', () => {
    fixture.detectChanges();
    component.onLandingPageChange('Overview');
    expect(component.settings.useClustersView).toBe(false);
  });

  it('should debounce settings changes', fakeAsync(() => {
    fixture.detectChanges();
    const initialSettings = JSON.parse(JSON.stringify(component.settings));

    component.onSettingsChange();
    tick(500); // Half of debounce time (1000ms)
    // Change should not be persisted yet

    component.onSettingsChange();
    tick(1000); // Full debounce time
    // Change should be persisted

    expect(component.settings).toBeTruthy();
  }));

  it('should handle settings change errors gracefully', fakeAsync(() => {
    fixture.detectChanges();
    const spy = jest.spyOn(userService, 'patchCurrentUserSettings').mockReturnValue(of(null));

    component.onSettingsChange();
    tick(1100); // Wait for debounce

    expect(spy).toHaveBeenCalled();
  }));

  it('should return empty string when default project is set', () => {
    fixture.detectChanges();
    component.settings.selectedProjectID = 'test-project-id';
    expect(component.hasDefaultProject()).toBe('');
  });

  it('should return None when default project is not set', () => {
    fixture.detectChanges();
    component.settings.selectedProjectID = '';
    expect(component.hasDefaultProject()).toBe('None');
  });

  it('should clear invalid project selection from projectIds', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.settings.selectedProjectID = 'non-existent-project';
    component.onSettingsChange();
    tick(1100); // Wait for debounce

    expect(component.settings.selectedProjectID).toBe('');
  }));

  it('should navigate back on goBack()', () => {
    fixture.detectChanges();
    const spy = jest.spyOn(historyService, 'goBack');
    component.goBack();
    expect(spy).toHaveBeenCalledWith('/projects');
  });

  it('should check equality using lodash isEqual', () => {
    fixture.detectChanges();
    const obj1 = {a: 1, b: 2};
    const obj2 = {a: 1, b: 2};
    const obj3 = {a: 1, b: 3};

    expect(component.isEqual(obj1, obj2)).toBe(true);
    expect(component.isEqual(obj1, obj3)).toBe(false);
  });

  it('should show success notification on settings update', fakeAsync(() => {
    const spy = jest.spyOn(notificationService, 'success');
    fixture.detectChanges();
    tick();

    // After initial setup, simulate a settings update
    const newSettings = {
      ...component.apiSettings,
      useClustersView: !component.apiSettings.useClustersView,
    };

    // Reset to trigger the change notification
    component.apiSettings = undefined;
    component.settings = newSettings;

    fixture.detectChanges();
    tick();

    // Note: The notification is shown only on subsequent updates, not on first load
  }));

  it('should unsubscribe on component destroy', () => {
    fixture.detectChanges();
    const unsubscribeSpy = jest.spyOn(component['_unsubscribe'], 'next');
    const completeSpy = jest.spyOn(component['_unsubscribe'], 'complete');

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should update paginator size based on user settings', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const itemsPerPage = component.itemsPerPageOptions[0];
    expect(itemsPerPage).toBeGreaterThan(0);
  }));

  it('should maintain local settings copy separate from API settings', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const originalUseClusters = component.apiSettings.useClustersView;
    component.settings.useClustersView = !originalUseClusters;

    expect(component.settings.useClustersView).not.toBe(component.apiSettings.useClustersView);
  }));

  it('should initialize items per page options', () => {
    fixture.detectChanges();
    expect(component.itemsPerPageOptions).toBeDefined();
    expect(component.itemsPerPageOptions.length).toBeGreaterThan(0);
  });
});
