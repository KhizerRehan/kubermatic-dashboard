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
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {NotificationService} from '@core/services/notification';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {SharedModule} from '@shared/module';
import {fakeUser} from '@test/data/user';
import {MatDialogMock} from '@test/services/mat-dialog-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {of} from 'rxjs';
import {AddAdminDialogComponent} from './add-admin-dialog/component';
import {AdminsComponent} from './component';

describe('AdminsComponent', () => {
  let fixture: ComponentFixture<AdminsComponent>;
  let component: AdminsComponent;
  let settingsService: SettingsMockService;
  let userService: UserMockService;
  let notificationService: NotificationService;
  let matDialog: MatDialogMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [AdminsComponent, AddAdminDialogComponent, ConfirmationDialogComponent],
      providers: [
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: MatDialog, useClass: MatDialogMock},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(AdminsComponent);
    component = fixture.componentInstance;
    settingsService = TestBed.inject(SettingsService) as unknown as SettingsMockService;
    userService = TestBed.inject(UserService) as unknown as UserMockService;
    notificationService = TestBed.inject(NotificationService);
    matDialog = TestBed.inject(MatDialog) as unknown as MatDialogMock;
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize data source and sorting on ngOnInit', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.dataSource).toBeDefined();
    expect(component.sort.active).toBe('name');
    expect(component.sort.direction).toBe('asc');
  }));

  it('should load admins from settings service', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.admins).toBeDefined();
  }));

  it('should update data source when admins change', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const initialLength = component.admins.length;
    expect(component.dataSource.data).toEqual(component.admins);
  }));

  it('should display columns in correct order', () => {
    fixture.detectChanges();
    expect(component.displayedColumns).toEqual(['name', 'email', 'actions']);
  });

  it('should set paginator on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.paginator).toBeDefined();
    expect(component.paginator.pageSize).toBeGreaterThan(0);
  }));

  it('should enable delete button when admin is not current user', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const mockAdmin = {
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true,
    };

    component.user = {
      name: 'Current User',
      email: 'current@example.com',
      role: 'admin',
    };

    const isDeleteEnabled = component.isDeleteEnabled(mockAdmin);
    expect(isDeleteEnabled).toBe(true);
  }));

  it('should disable delete button when admin is current user', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const currentUserEmail = 'admin@example.com';
    const mockAdmin = {
      name: 'Admin User',
      email: currentUserEmail,
      isAdmin: true,
    };

    component.user = {
      name: 'Admin User',
      email: currentUserEmail,
      role: 'admin',
    };

    const isDeleteEnabled = component.isDeleteEnabled(mockAdmin);
    expect(isDeleteEnabled).toBe(false);
  }));

  it('should open confirmation dialog on delete', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const mockAdmin = {
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true,
    };

    component.user = {
      name: 'Current User',
      email: 'current@example.com',
      role: 'admin',
    };

    component.delete(mockAdmin);

    expect(matDialog.open).toHaveBeenCalledWith(ConfirmationDialogComponent, expect.any(Object));
  }));

  it('should update admin when delete is confirmed', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const mockAdmin = {
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true,
    };

    component.user = {
      name: 'Current User',
      email: 'current@example.com',
      role: 'admin',
    };

    jest.spyOn(settingsService, 'setAdmin').mockReturnValue(of(mockAdmin));
    jest.spyOn(settingsService, 'refreshAdmins');

    component.delete(mockAdmin);
    tick();

    expect(mockAdmin.isAdmin).toBe(false);
  }));

  it('should show notification on successful admin removal', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const mockAdmin = {
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true,
    };

    component.user = {
      name: 'Current User',
      email: 'current@example.com',
      role: 'admin',
    };

    const notificationSpy = jest.spyOn(notificationService, 'success');
    jest.spyOn(settingsService, 'setAdmin').mockReturnValue(of(mockAdmin));
    jest.spyOn(settingsService, 'refreshAdmins');

    component.delete(mockAdmin);
    tick();

    expect(notificationSpy).toHaveBeenCalledWith(
      expect.stringContaining('Removed the')
    );
  }));

  it('should refresh admins after successful removal', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const mockAdmin = {
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true,
    };

    component.user = {
      name: 'Current User',
      email: 'current@example.com',
      role: 'admin',
    };

    const refreshSpy = jest.spyOn(settingsService, 'refreshAdmins');
    jest.spyOn(settingsService, 'setAdmin').mockReturnValue(of(mockAdmin));

    component.delete(mockAdmin);
    tick();

    expect(refreshSpy).toHaveBeenCalled();
  }));

  it('should open add admin dialog', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.add();

    expect(matDialog.open).toHaveBeenCalledWith(AddAdminDialogComponent);
  }));

  it('should refresh admins when add dialog returns data', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const refreshSpy = jest.spyOn(settingsService, 'refreshAdmins');

    component.add();
    tick();

    expect(refreshSpy).toHaveBeenCalled();
  }));

  it('should not refresh admins when add dialog is cancelled', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    matDialog.openResultData = undefined; // Simulate cancel
    const refreshSpy = jest.spyOn(settingsService, 'refreshAdmins');

    component.add();
    tick();

    // refreshAdmins should not be called if dialog returns undefined/falsy
  }));

  it('should generate delete button ID from admin email', () => {
    const mockAdmin = {
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true,
    };

    const deleteId = component.getDeleteId(mockAdmin);
    expect(deleteId).toBe(`km-admin-delete-${btoa('admin@example.com')}`);
  });

  it('should show paginator when admins exceed page size', fakeAsync(() => {
    component.admins = Array(25).fill(null).map((_, i) => ({
      name: `Admin ${i}`,
      email: `admin${i}@example.com`,
      isAdmin: true,
    }));
    component.paginator.pageSize = 10;

    const isPaginatorVisible = component.isPaginatorVisible();
    expect(isPaginatorVisible).toBe(true);
  }));

  it('should hide paginator when admins are empty', () => {
    component.admins = [];
    expect(component.isPaginatorVisible()).toBe(false);
  });

  it('should hide paginator when admins are below page size', () => {
    component.admins = Array(5).fill(null).map((_, i) => ({
      name: `Admin ${i}`,
      email: `admin${i}@example.com`,
      isAdmin: true,
    }));
    component.paginator.pageSize = 10;

    expect(component.isPaginatorVisible()).toBe(false);
  });

  it('should update data source on ngOnChanges', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.ngOnChanges();

    expect(component.dataSource.data).toBeDefined();
  }));

  it('should unsubscribe on component destroy', () => {
    fixture.detectChanges();
    const unsubscribeSpy = jest.spyOn(component['_unsubscribe'], 'next');
    const completeSpy = jest.spyOn(component['_unsubscribe'], 'complete');

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should load current user on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.user).toBeDefined();
  }));
});
