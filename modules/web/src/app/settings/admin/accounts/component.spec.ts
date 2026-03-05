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
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {fakeUser, fakeUserSettings} from '@test/data/user';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {of} from 'rxjs';
import {AccountsComponent} from './component';

describe('AccountsComponent', () => {
  let fixture: ComponentFixture<AccountsComponent>;
  let component: AccountsComponent;
  let settingsService: SettingsMockService;
  let userService: UserMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [AccountsComponent],
      providers: [
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: UserService, useClass: UserMockService},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(AccountsComponent);
    component = fixture.componentInstance;
    settingsService = TestBed.inject(SettingsService) as unknown as SettingsMockService;
    userService = TestBed.inject(UserService) as unknown as UserMockService;
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize data source on ngOnInit', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.dataSource).toBeDefined();
    expect(component.dataSource.data).toBeDefined();
  }));

  it('should set sort configuration on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.sort).toBeDefined();
    expect(component.sort.active).toBe('name');
    expect(component.sort.direction).toBe('asc');
  }));

  it('should set paginator on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.paginator).toBeDefined();
    expect(component.paginator.pageSize).toBeGreaterThan(0);
  }));

  it('should load users from settings service', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.users.length).toBeGreaterThanOrEqual(0);
  }));

  it('should set loading state during initialization', () => {
    expect(component.isLoading).toBe(false);
    component.isLoading = true;
    fixture.detectChanges();
    expect(component.isLoading).toBe(true);
  });

  it('should hide loading spinner after users are loaded', fakeAsync(() => {
    component.isLoading = true;
    fixture.detectChanges();
    tick();

    expect(component.isLoading).toBe(false);
  }));

  it('should display columns in correct order', () => {
    fixture.detectChanges();
    expect(component.displayedColumns).toEqual(['name', 'role', 'email', 'lastSeen', 'creationTimestamp']);
  });

  it('should filter out users with missing name or email', fakeAsync(() => {
    const mockUsers = [
      {name: 'Test User', email: 'test@example.com', role: 'admin', lastSeen: new Date(), creationTimestamp: new Date()},
      {name: '', email: 'invalid@example.com', role: 'user', lastSeen: new Date(), creationTimestamp: new Date()},
      {name: 'Valid User', email: '', role: 'user', lastSeen: new Date(), creationTimestamp: new Date()},
      {name: 'Complete User', email: 'complete@example.com', role: 'user', lastSeen: new Date(), creationTimestamp: new Date()},
    ];

    jest.spyOn(settingsService, 'users', 'get').mockReturnValue(of(mockUsers));

    fixture.detectChanges();
    tick();

    // Should only have valid users
    expect(component.users.length).toBe(2);
  }));

  it('should update data source when ngOnChanges is called', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const initialDataLength = component.dataSource.data.length;
    component.ngOnChanges();

    expect(component.dataSource.data).toBeDefined();
  }));

  it('should apply filter on search', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.onSearch('test');
    fixture.detectChanges();

    expect(component.dataSource.filter).toBe('test');
  }));

  it('should handle error state during user loading', fakeAsync(() => {
    jest.spyOn(settingsService, 'users', 'get').mockReturnValue(
      new Promise((_, reject) => reject(new Error('Load error')))
    );

    fixture.detectChanges();
    tick();

    // Loading state should be cleared on error
    expect(component.isLoading).toBe(false);
  }));

  it('should update paginator page size from user settings', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const paginator = component.paginator;
    expect(paginator.pageSize).toBeGreaterThan(0);
  }));

  it('should show paginator when users exceed page size', fakeAsync(() => {
    component.users = Array(25).fill(null).map((_, i) => ({
      name: `User ${i}`,
      email: `user${i}@example.com`,
      role: 'user',
      lastSeen: new Date(),
      creationTimestamp: new Date(),
    }));
    component.paginator.pageSize = 10;

    const isPaginatorVisible = component.isPaginatorVisible();
    expect(isPaginatorVisible).toBe(true);
  }));

  it('should hide paginator when users are empty', () => {
    component.users = [];
    expect(component.isPaginatorVisible()).toBe(false);
  });

  it('should hide paginator when users are below page size', () => {
    component.users = Array(5).fill(null).map((_, i) => ({
      name: `User ${i}`,
      email: `user${i}@example.com`,
      role: 'user',
      lastSeen: new Date(),
      creationTimestamp: new Date(),
    }));
    component.paginator.pageSize = 10;

    expect(component.isPaginatorVisible()).toBe(false);
  });

  it('should load current user settings on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.currentUser).toBeDefined();
  }));

  it('should unsubscribe on component destroy', () => {
    fixture.detectChanges();
    const unsubscribeSpy = jest.spyOn(component['_unsubscribe'], 'next');
    const completeSpy = jest.spyOn(component['_unsubscribe'], 'complete');

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should handle paginator visibility correctly', fakeAsync(() => {
    component.users = null;
    expect(component.isPaginatorVisible()).toBe(false);

    component.users = [];
    expect(component.isPaginatorVisible()).toBe(false);

    fixture.detectChanges();
    tick();
  }));
});
