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
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {CoreModule} from '@core/module';
import {MemberService} from '@core/services/member';
import {NotificationService} from '@core/services/notification';
import {SharedModule} from '@shared/module';
import {Member} from '@shared/entity/member';
import {fakeMember} from '@test/data/member';
import {fakeProject} from '@test/data/project';
import {asyncData} from '@test/services/cluster-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {MemberUtils} from '@shared/utils/member';
import {EditMemberComponent} from './component';

describe('EditMemberComponent', () => {
  let fixture: ComponentFixture<EditMemberComponent>;
  let component: EditMemberComponent;
  let editMemberSpy: jest.Mock;
  let memberService: any;
  let dialogRef: MatDialogRef<EditMemberComponent>;
  let notificationService: NotificationService;

  beforeEach(waitForAsync(() => {
    const memberServiceMock = {edit: jest.fn()};
    editMemberSpy = memberServiceMock.edit.mockReturnValue(asyncData(fakeMember()));

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MemberService, useValue: memberServiceMock},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(EditMemberComponent);
    component = fixture.componentInstance;
    memberService = fixture.debugElement.injector.get(MemberService);
    dialogRef = fixture.debugElement.injector.get(MatDialogRef);
    notificationService = fixture.debugElement.injector.get(NotificationService);
    component.project = fakeProject();
    component.member = fakeMember();
    fixture.detectChanges();
  }));

  it('should initialize', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  // Component Initialization Tests
  it('should set member and project inputs', waitForAsync(() => {
    expect(component.member).toBeDefined();
    expect(component.project).toBeDefined();
  }));

  it('should have form group defined', waitForAsync(() => {
    expect(component.form).toBeDefined();
    expect(component.form.get('group')).toBeDefined();
  }));

  // Form Validation Tests
  it('should have valid form defaults', () => {
    expect(component.form.valid).toBeTruthy();
  });

  it('should initialize form with member group', () => {
    const memberInProject = MemberUtils.getGroupInProject(component.member, component.project.id);
    expect(component.form.controls.group.value).toBe(memberInProject);
  });

  it('should have required fields', () => {
    component.form.controls.group.patchValue('');
    expect(component.form.controls.group.valid).toBeFalsy();
    expect(component.form.controls.group.hasError('required')).toBeTruthy();

    component.form.controls.group.patchValue('editor');
    expect(component.form.controls.group.hasError('required')).toBeFalsy();
  });

  it('should invalidate form with empty group', () => {
    component.form.controls.group.patchValue('');
    expect(component.form.valid).toBeFalsy();
  });

  it('should validate form with valid group', () => {
    component.form.controls.group.patchValue('owner');
    expect(component.form.valid).toBeTruthy();
  });

  // Form Submission Tests
  it('should call editMember method', fakeAsync(() => {
    component.form.controls.group.patchValue('editor');
    component.getObservable().subscribe();
    tick();
    flush();

    expect(editMemberSpy).toHaveBeenCalled();
  }));

  it('should create correct observable with form values', fakeAsync(() => {
    const newGroup = 'owner';
    component.form.controls.group.patchValue(newGroup);

    const observable = component.getObservable();
    expect(observable).toBeDefined();

    tick();
    flush();
  }));

  it('should pass correct member data to API', fakeAsync(() => {
    const newGroup = 'editor';
    component.form.controls.group.patchValue(newGroup);

    const editSpy = jest.spyOn(memberService, 'edit');
    component.getObservable().subscribe();
    tick();

    const callArgs = editSpy.mock.calls[0];
    expect(callArgs[0].id).toBe(component.member.id);
    expect(callArgs[0].email).toBe(component.member.email);
    expect(callArgs[0].name).toBe(component.member.name);
    expect(callArgs[0].projects[0].group).toBe(newGroup);
    expect(callArgs[0].projects[0].id).toBe(component.project.id);
    expect(callArgs[1]).toBe(component.project.id);

    flush();
  }));

  it('should preserve member metadata in API call', fakeAsync(() => {
    component.form.controls.group.patchValue('viewer');

    const editSpy = jest.spyOn(memberService, 'edit');
    component.getObservable().subscribe();
    tick();

    const callArgs = editSpy.mock.calls[0];
    const memberPayload = callArgs[0];

    expect(memberPayload.id).toBe(component.member.id);
    expect(memberPayload.creationTimestamp).toBe(component.member.creationTimestamp);
    expect(memberPayload.deletionTimestamp).toBe(component.member.deletionTimestamp);

    flush();
  }));

  // Dialog Integration Tests
  it('should close dialog on onNext', fakeAsync(() => {
    const closeSpy = jest.spyOn(dialogRef, 'close');

    component.onNext();
    tick();

    expect(closeSpy).toHaveBeenCalledWith(true);
  }));

  it('should show notification on successful edit', fakeAsync(() => {
    const notificationSpy = jest.spyOn(notificationService, 'success');

    component.onNext();
    tick();

    expect(notificationSpy).toHaveBeenCalledWith(
      expect.stringContaining(component.member.name)
    );

    flush();
  }));

  it('should mention update in notification message', fakeAsync(() => {
    const notificationSpy = jest.spyOn(notificationService, 'success');

    component.onNext();
    tick();

    expect(notificationSpy).toHaveBeenCalledWith(
      expect.stringContaining('Updated')
    );

    flush();
  }));

  // Edge Cases
  it('should handle different group values', () => {
    const groupValues = ['viewer', 'editor', 'owner'];

    groupValues.forEach(group => {
      component.form.controls.group.patchValue(group);
      expect(component.form.valid).toBeTruthy();
    });
  });

  it('should preserve original member data', () => {
    const originalEmail = component.member.email;
    const originalName = component.member.name;

    component.form.controls.group.patchValue('owner');

    expect(component.member.email).toBe(originalEmail);
    expect(component.member.name).toBe(originalName);
  });

  it('should have only one control in form', () => {
    const controls = Object.keys(component.form.controls);
    expect(controls).toContain('group');
    expect(controls.length).toBe(1);
  });

  it('should handle member with multiple projects', fakeAsync(() => {
    const memberWithMultipleProjects = fakeMember();
    memberWithMultipleProjects.projects = [
      {id: component.project.id, group: 'editor'},
      {id: 'other-project-id', group: 'viewer'},
    ];

    component.member = memberWithMultipleProjects;
    component.ngOnInit();
    tick();

    const group = MemberUtils.getGroupInProject(component.member, component.project.id);
    expect(group).toBe('editor');
  }));
});
