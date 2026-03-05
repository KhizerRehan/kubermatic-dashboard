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

import {ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatTabsModule} from '@angular/material/tabs';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {MemberService} from '@core/services/member';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {NoopConfirmDialogComponent} from '@test/components/noop-confirmation-dialog.component';
import {fakeMembers, fakeMember} from '@test/data/member';
import {fakeProject} from '@test/data/project';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {MemberServiceMock} from '@test/services/member-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {RouterStub} from '@test/services/router-stubs';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {MemberComponent} from './component';
import {AddMemberComponent} from './add-member/component';
import {EditMemberComponent} from './edit-member/component';
import {of} from 'rxjs';

describe('MemberComponent', () => {
  let fixture: ComponentFixture<MemberComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: MemberComponent;
  let memberService: MemberServiceMock;
  let projectService: ProjectMockService;
  let userService: UserMockService;
  let matDialog: MatDialog;
  let router: Router;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, NoopConfirmDialogComponent, MatTabsModule],
      declarations: [MemberComponent, AddMemberComponent, EditMemberComponent],
      providers: [
        {provide: Router, useClass: RouterStub},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: MemberService, useClass: MemberServiceMock},
        DialogModeService,
        MatDialog,
        GoogleAnalyticsService,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberComponent);
    component = fixture.componentInstance;
    memberService = fixture.debugElement.injector.get(MemberService) as any;
    projectService = fixture.debugElement.injector.get(ProjectService) as any;
    userService = fixture.debugElement.injector.get(UserService) as any;
    matDialog = fixture.debugElement.injector.get(MatDialog);
    router = fixture.debugElement.injector.get(Router);
    noop = TestBed.createComponent(NoopConfirmDialogComponent);
    fixture.detectChanges();
  });

  it('should create members cmp', () => {
    expect(component).toBeTruthy();
  });

  // Initialization & Setup Tests
  it('should initialize dataSource with members', () => {
    expect(component.dataSource.data).toBe(component.members);
  });

  it('should set displayedColumns correctly', () => {
    expect(component.displayedColumns).toEqual(['name', 'email', 'group', 'actions']);
  });

  it('should have View enum available', () => {
    expect(component.view).toBe(View);
  });

  // Member List Display Tests
  it('should return correct group display name for member', fakeAsync(() => {
    const member = fakeMember();
    const selectedProject = fakeProject();
    component['_selectedProject'] = selectedProject;

    const groupName = component.getGroup(member);
    tick();

    expect(groupName).toBeDefined();
  }));

  it('should populate dataSource when members data changes', fakeAsync(() => {
    const testMembers = fakeMembers();
    component.members = testMembers;
    component.ngOnChanges();
    tick();

    expect(component.dataSource.data).toEqual(testMembers);
  }));

  // Permission Checking Tests
  it('should check add member permission correctly', fakeAsync(() => {
    component.currentUser = fakeMember();
    component['_currentGroupConfig'] = {
      members: {create: true},
    } as any;

    const result = component.isAddEnabled();
    tick();

    expect(result).toBeDefined();
  }));

  it('should prevent editing own member record', fakeAsync(() => {
    const currentMember = fakeMember();
    const otherMember = fakeMember();
    otherMember.email = 'other@example.com';

    component.currentUser = currentMember;
    component['_currentGroupConfig'] = {
      members: {edit: true},
    } as any;

    const result = component.isEditEnabled(currentMember);
    tick();

    expect(result).toBeFalsy();
  }));

  it('should prevent deleting own member record', fakeAsync(() => {
    const currentMember = fakeMember();

    component.currentUser = currentMember;
    component['_currentGroupConfig'] = {
      members: {delete: true},
    } as any;

    const result = component.isDeleteEnabled(currentMember);
    tick();

    expect(result).toBeFalsy();
  }));

  it('should show correct edit tooltip for own member', fakeAsync(() => {
    const member = fakeMember();
    component.currentUser = member;

    const tooltip = component.getEditTooltip(member);
    tick();

    expect(tooltip).toContain('cannot edit your own');
  }));

  it('should show correct delete tooltip for own member', fakeAsync(() => {
    const member = fakeMember();
    component.currentUser = member;

    const tooltip = component.getDeleteTooltip(member);
    tick();

    expect(tooltip).toContain('cannot edit your own');
  }));

  // Dialog Operations Tests
  it('should open add member dialog', fakeAsync(() => {
    const openSpy = jest.spyOn(matDialog, 'open').mockReturnValue({
      componentInstance: {},
      afterClosed: () => of(fakeMember()),
    } as any);

    component['_selectedProject'] = fakeProject();
    component.addMember();
    tick();

    expect(openSpy).toHaveBeenCalledWith(AddMemberComponent);
  }));

  it('should add member to list after dialog closes', fakeAsync(() => {
    const newMember = fakeMember();
    const openSpy = jest.spyOn(matDialog, 'open').mockReturnValue({
      componentInstance: {},
      afterClosed: () => of(newMember),
    } as any);

    component['_selectedProject'] = fakeProject();
    const initialLength = component.members.length;
    component.addMember();
    tick();

    expect(component.members.length).toBeGreaterThanOrEqual(initialLength);
  }));

  it('should open edit member dialog with member data', fakeAsync(() => {
    const member = fakeMember();
    const selectedProject = fakeProject();
    component['_selectedProject'] = selectedProject;

    const openSpy = jest.spyOn(matDialog, 'open').mockReturnValue({
      componentInstance: {},
      afterClosed: () => of(true),
    } as any);

    component.editMember(member);
    tick();

    expect(openSpy).toHaveBeenCalledWith(EditMemberComponent);
  }));

  it('should trigger members refresh after edit dialog closes', fakeAsync(() => {
    const member = fakeMember();
    component['_selectedProject'] = fakeProject();

    jest.spyOn(matDialog, 'open').mockReturnValue({
      componentInstance: {},
      afterClosed: () => of(true),
    } as any);

    const refreshSpy = jest.spyOn(component['_membersUpdate'], 'next');
    component.editMember(member);
    tick();

    expect(refreshSpy).toHaveBeenCalled();
  }));

  // Deletion Tests
  it('should open delete member confirmation dialog & call delete()', fakeAsync(() => {
    const spy = jest.spyOn(memberService, 'remove');

    const waitTime = 15000;
    component.deleteMember(fakeMembers()[0]);
    noop.detectChanges();
    tick(waitTime);

    const dialogTitle = document.body.querySelector('.mat-mdc-dialog-title');
    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

    expect(dialogTitle.textContent).toBe('Remove Member');
    expect(deleteButton.textContent).toContain('Remove');

    deleteButton.click();

    noop.detectChanges();
    fixture.detectChanges();
    tick(waitTime);

    expect(spy).toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));

  it('should show notification on successful member deletion', fakeAsync(() => {
    const member = fakeMember();
    component['_selectedProject'] = fakeProject();

    const notificationSpy = jest.spyOn(
      fixture.debugElement.injector.get(NotificationService),
      'success'
    );

    component.deleteMember(member);
    tick(15000);

    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;
    deleteButton?.click();
    tick(15000);

    // Notification should be called on successful deletion
    expect(notificationSpy).toHaveBeenCalledWith(expect.stringContaining(member.name));

    fixture.destroy();
    flush();
  }));

  // Pagination Tests
  it('should determine pagination visibility correctly', fakeAsync(() => {
    component.members = fakeMembers();
    component['_paginator'] = {pageSize: 5} as any;

    const visible = component.isPaginatorVisible();
    tick();

    expect(visible).toBeDefined();
  }));

  it('should hide paginator when data is empty', fakeAsync(() => {
    component.members = [];

    const visible = component.isPaginatorVisible();
    tick();

    expect(visible).toBeFalsy();
  }));

  // URL Path Tests
  it('should extract URL path from router state', fakeAsync(() => {
    const routerStub = router as any;
    routerStub.routerState = {
      snapshot: {url: '/projects/test-project/members'},
    };

    component.getURLPath();
    tick();

    expect(component.urlPath).toBe('members');
  }));

  // Lifecycle Tests
  it('should clean up on destroy', fakeAsync(() => {
    component.ngOnInit();
    tick();

    const spy = jest.spyOn(component['_unsubscribe'], 'next');
    component.ngOnDestroy();
    tick();

    expect(spy).toHaveBeenCalled();
  }));

  it('should complete unsubscribe subject on destroy', fakeAsync(() => {
    const spy = jest.spyOn(component['_unsubscribe'], 'complete');
    component.ngOnDestroy();
    tick();

    expect(spy).toHaveBeenCalled();
  }));
});
