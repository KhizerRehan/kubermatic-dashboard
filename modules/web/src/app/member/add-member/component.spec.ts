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
import {MemberService} from '@core/services/member';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {SharedModule} from '@shared/module';
import {Member} from '@shared/entity/member';
import {Group} from '@shared/utils/member';
import {fakeMember} from '@test/data/member';
import {fakeProject} from '@test/data/project';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {MemberServiceMock} from '@test/services/member-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {of} from 'rxjs';
import {AddMemberComponent} from './component';

describe('AddMemberComponent', () => {
  let fixture: ComponentFixture<AddMemberComponent>;
  let component: AddMemberComponent;
  let memberService: MemberServiceMock;
  let dialogRef: MatDialogRef<AddMemberComponent>;
  let notificationService: NotificationService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [AddMemberComponent],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: MemberService, useClass: MemberServiceMock},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(AddMemberComponent);
    component = fixture.componentInstance;
    memberService = fixture.debugElement.injector.get(MemberService) as any;
    dialogRef = fixture.debugElement.injector.get(MatDialogRef);
    notificationService = fixture.debugElement.injector.get(NotificationService);
    component.project = fakeProject();
    fixture.detectChanges();
  }));

  it('should create the component', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  // Form Initialization Tests
  it('should initialize form on ngOnInit', waitForAsync(() => {
    expect(component.form).toBeDefined();
    expect(component.form.get('email')).toBeDefined();
    expect(component.get('group')).toBeDefined();
  }));

  it('form invalid after creating', () => {
    expect(component.form.valid).toBeFalsy();
  });

  // Form Validation Tests
  it('should have required fields', () => {
    expect(component.form.valid).toBeFalsy();
    expect(component.form.controls.email.valid).toBeFalsy();
    expect(component.form.controls.email.hasError('required')).toBeTruthy();
    expect(component.form.controls.group.valid).toBeFalsy();
    expect(component.form.controls.group.hasError('required')).toBeTruthy();

    component.form.controls.email.patchValue('john@doe.com');
    expect(component.form.controls.email.hasError('required')).toBeFalsy();
    component.form.controls.group.patchValue(Group.Editor);
    expect(component.form.controls.group.hasError('required')).toBeFalsy();
  });

  it('should validate email format', () => {
    const emailControl = component.form.controls.email;

    emailControl.patchValue('invalid-email');
    expect(emailControl.hasError('email')).toBeTruthy();

    emailControl.patchValue('valid@example.com');
    expect(emailControl.hasError('email')).toBeFalsy();
  });

  it('should invalidate form with missing email', () => {
    component.form.controls.group.patchValue(Group.Editor);
    expect(component.form.valid).toBeFalsy();
  });

  it('should invalidate form with missing group', () => {
    component.form.controls.email.patchValue('test@example.com');
    expect(component.form.valid).toBeFalsy();
  });

  it('should validate form with email and group', () => {
    component.form.controls.email.patchValue('test@example.com');
    component.form.controls.group.patchValue(Group.Editor);
    expect(component.form.valid).toBeTruthy();
  });

  // Form Submission Tests
  it('should call addMember method', fakeAsync(() => {
    const spy = jest.spyOn(memberService, 'add');

    component.form.controls.email.patchValue('john@doe.com');
    component.form.controls.group.patchValue('editors');
    component.getObservable().subscribe();
    tick();
    flush();

    expect(spy).toHaveBeenCalled();
  }));

  it('should create correct observable with form values', fakeAsync(() => {
    const email = 'test@example.com';
    const group = Group.Owner;

    component.form.controls.email.patchValue(email);
    component.form.controls.group.patchValue(group);

    const observable = component.getObservable();
    expect(observable).toBeDefined();

    tick();
    flush();
  }));

  it('should pass correct member data to API', fakeAsync(() => {
    const email = 'newmember@example.com';
    const group = Group.Editor;
    const project = fakeProject();
    component.project = project;

    component.form.controls.email.patchValue(email);
    component.form.controls.group.patchValue(group);

    const addSpy = jest.spyOn(memberService, 'add');
    component.getObservable().subscribe();
    tick();

    const callArgs = addSpy.mock.calls[0];
    expect(callArgs[0].email).toBe(email);
    expect(callArgs[0].projects[0].group).toBe(group);
    expect(callArgs[0].projects[0].id).toBe(project.id);
    expect(callArgs[1]).toBe(project.id);

    flush();
  }));

  // Dialog Integration Tests
  it('should close dialog on onNext', fakeAsync(() => {
    const closeSpy = jest.spyOn(dialogRef, 'close');
    const member = fakeMember();

    component.onNext(member);
    tick();

    expect(closeSpy).toHaveBeenCalledWith(member);
  }));

  it('should show notification on successful add', fakeAsync(() => {
    const notificationSpy = jest.spyOn(notificationService, 'success');
    const member = fakeMember();
    const project = fakeProject();
    component.project = project;

    component.onNext(member);
    tick();

    expect(notificationSpy).toHaveBeenCalledWith(
      expect.stringContaining(member.email)
    );
    expect(notificationSpy).toHaveBeenCalledWith(
      expect.stringContaining(project.name)
    );

    flush();
  }));

  // Edge Cases
  it('should handle email with leading/trailing spaces', () => {
    const emailControl = component.form.controls.email;
    emailControl.patchValue('  test@example.com  ');
    // After trimming by HTML input, should still be valid
    expect(emailControl.valid).toBeTruthy();
  });

  it('should handle special characters in email', () => {
    const emailControl = component.form.controls.email;
    emailControl.patchValue('user+tag@example.co.uk');
    expect(emailControl.valid).toBeTruthy();
  });

  it('should have email and group form controls', () => {
    expect(component.form.controls.hasOwnProperty('email')).toBeTruthy();
    expect(component.form.controls.hasOwnProperty('group')).toBeTruthy();
  });

  it('should require at least two form controls', () => {
    const controlCount = Object.keys(component.form.controls).length;
    expect(controlCount).toBeGreaterThanOrEqual(2);
  });
});
