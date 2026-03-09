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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {Event} from '@shared/entity/event';
import {SharedModule} from '@shared/module';
import {SettingsMockService, DEFAULT_ADMIN_SETTINGS_MOCK} from '@test/services/settings-mock';
import {UserMockService, DEFAULT_USER_SETTINGS_MOCK} from '@test/services/user-mock';
import {EventListComponent} from './component';

describe('EventListComponent', () => {
  let fixture: ComponentFixture<EventListComponent>;
  let component: EventListComponent;
  let userService: jasmine.SpyObj<UserService>;
  let settingsService: jasmine.SpyObj<SettingsService>;

  const mockEvent: Event = {
    type: 'Normal',
    message: 'Test event message',
    involvedObject: {name: 'test-pod'},
    count: 1,
    lastTimestamp: new Date(),
  } as Event;

  const mockWarningEvent: Event = {
    type: 'Warning',
    message: 'Warning event message',
    involvedObject: {name: 'test-pod'},
    count: 2,
    lastTimestamp: new Date(),
  } as Event;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      providers: [
        {provide: UserService, useClass: UserMockService},
        {provide: SettingsService, useClass: SettingsMockService},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventListComponent);
    component = fixture.componentInstance;
  });

  it('should initialize component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should return true when there are events', () => {
    component.events = [mockEvent];
    expect(component.hasEvents()).toBeTruthy();
  });

  it('should return false when there are no events', () => {
    component.events = [];
    expect(component.hasEvents()).toBeFalsy();
  });

  it('should initialize dataSource with events', () => {
    component.events = [mockEvent, mockWarningEvent];
    fixture.detectChanges();
    expect(component.dataSource.data.length).toBeGreaterThan(0);
  });

  it('should set sort active to lastTimestamp on initialization', () => {
    fixture.detectChanges();
    expect(component.sort.active).toBe('lastTimestamp');
    expect(component.sort.direction).toBe('desc');
  });

  it('should set paginator page size from user settings', () => {
    fixture.detectChanges();
    expect(component.paginator.pageSize).toBe(DEFAULT_USER_SETTINGS_MOCK.itemsPerPage);
  });

  it('should determine if paginator is visible based on event count', () => {
    component.events = [];
    fixture.detectChanges();
    expect(component.isPaginatorVisible()).toBeFalse();

    component.events = Array(15).fill(mockEvent);
    fixture.detectChanges();
    expect(component.isPaginatorVisible()).toBeTrue();
  });

  it('should return correct icon for Normal event type', () => {
    const icon = component.getTypeIcon(mockEvent);
    expect(icon).toBe('km-icon-check');
  });

  it('should return correct icon for Warning event type', () => {
    const icon = component.getTypeIcon(mockWarningEvent);
    expect(icon).toBe('km-icon-warning-event');
  });

  it('should return default icon for unknown event type', () => {
    const unknownEvent = {...mockEvent, type: 'Unknown'} as Event;
    const icon = component.getTypeIcon(unknownEvent);
    expect(icon).toBe('km-icon-circle');
  });

  it('should update displayed columns correctly', () => {
    fixture.detectChanges();
    expect(component.displayedColumns).toContain('status');
    expect(component.displayedColumns).toContain('message');
    expect(component.displayedColumns).toContain('involvedObjectName');
    expect(component.displayedColumns).toContain('involvedObjectKind');
  });

  it('should clean up subscriptions on destroy', () => {
    fixture.detectChanges();
    spyOn(component['_unsubscribe'], 'next');
    spyOn(component['_unsubscribe'], 'complete');

    component.ngOnDestroy();

    expect(component['_unsubscribe'].next).toHaveBeenCalled();
    expect(component['_unsubscribe'].complete).toHaveBeenCalled();
  });

  it('should update data source when events change', () => {
    fixture.detectChanges();
    const initialLength = component.dataSource.data.length;

    component.events = [mockEvent, mockWarningEvent];
    component.ngOnChanges();
    fixture.detectChanges();

    expect(component.dataSource.data.length).toBeGreaterThanOrEqual(initialLength);
  });
});
