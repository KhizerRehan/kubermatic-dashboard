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

import {ComponentFixture, discardPeriodicTasks, fakeAsync, flush, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {AddBindingDialogComponent, BindingType, Controls} from '@app/cluster/details/cluster/rbac/add-binding-dialog/component';
import {CoreModule} from '@core/module';
import {RBACService} from '@core/services/rbac';
import {NotificationService} from '@core/services/notification';
import {SharedModule} from '@shared/module';
import {Kind} from '@shared/entity/rbac';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeProject} from '@test/data/project';
import {
  fakeClusterBinding,
  fakeClusterRoleNames,
  fakeNamespaceBinding,
  fakeNamespaceRoleNames,
  fakeRoleNames,
} from '@test/data/rbac';
import {asyncData} from '@test/services/cluster-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';

describe('AddBindingDialogComponent', () => {
  let fixture: ComponentFixture<AddBindingDialogComponent>;
  let component: AddBindingDialogComponent;
  let rbacService: any;
  let dialogRef: MatDialogRef<AddBindingDialogComponent>;
  let notificationService: NotificationService;

  beforeEach(waitForAsync(() => {
    const rbacMock = {
      getClusterRoleNames: jest.fn(),
      getNamespaceRoleNames: jest.fn(),
      createClusterBinding: jest.fn(),
      createNamespaceBinding: jest.fn(),
    };

    rbacMock.getClusterRoleNames.mockReturnValue(asyncData(fakeClusterRoleNames()));
    rbacMock.getNamespaceRoleNames.mockReturnValue(asyncData(fakeNamespaceRoleNames()));
    rbacMock.createClusterBinding.mockReturnValue(asyncData(fakeClusterBinding()));
    rbacMock.createNamespaceBinding.mockReturnValue(asyncData(fakeNamespaceBinding()));

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
      declarations: [AddBindingDialogComponent],
      providers: [
        {provide: RBACService, useValue: rbacMock},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(AddBindingDialogComponent);
    component = fixture.componentInstance;
    rbacService = fixture.debugElement.injector.get(RBACService);
    dialogRef = fixture.debugElement.injector.get(MatDialogRef);
    notificationService = fixture.debugElement.injector.get(NotificationService);
    component.cluster = fakeDigitaloceanCluster();
    component.projectID = fakeProject().id;
    fixture.detectChanges();
  }));

  it('should create the rbac add binding cmp', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  // Initialization Tests
  it('should initialize form with all controls', waitForAsync(() => {
    expect(component.form.get(Controls.Email)).toBeDefined();
    expect(component.form.get(Controls.Group)).toBeDefined();
    expect(component.form.get(Controls.Role)).toBeDefined();
    expect(component.form.get(Controls.Namespace)).toBeDefined();
  }));

  it('should initialize with Cluster binding type', waitForAsync(() => {
    expect(component.bindingType).toBe(BindingType.Cluster);
  }));

  it('should initialize with User subject type by default', waitForAsync(() => {
    expect(component.subjectType).toBe(Kind.User);
  }));

  it('should load cluster roles on init', fakeAsync(() => {
    tick();
    expect(rbacService.getClusterRoleNames).toHaveBeenCalledWith(component.cluster.id, component.projectID);
    expect(component.clusterRoles.length).toBeGreaterThan(0);
  }));

  it('should load namespace roles on init', fakeAsync(() => {
    tick();
    expect(rbacService.getNamespaceRoleNames).toHaveBeenCalledWith(component.cluster.id, component.projectID);
    expect(component.roles.length).toBeGreaterThan(0);
  }));

  it('should have Kind enum available', waitForAsync(() => {
    expect(component.Kind).toBe(Kind);
  }));

  // Cluster Binding Form Validation Tests
  it('cluster form should be validated correctly', fakeAsync(() => {
    component.bindingType = BindingType.Cluster;
    component.setNamespaceValidators();
    component.form.controls.email.setValue('');
    component.form.controls.role.setValue('');
    fixture.detectChanges();
    expect(component.form.valid).toBeFalsy();

    component.form.controls.email.setValue('test@example.de');
    component.form.controls.role.setValue('role-1');
    fixture.detectChanges();
    expect(component.form.valid).toBeTruthy();
    discardPeriodicTasks();
  }));

  it('should require email for user type cluster binding', fakeAsync(() => {
    component.bindingType = BindingType.Cluster;
    component.subjectType = Kind.User;
    component.form.controls.role.setValue('role-1');

    const emailControl = component.form.get(Controls.Email);
    expect(emailControl.valid).toBeFalsy();

    emailControl.setValue('user@example.com');
    expect(emailControl.valid).toBeTruthy();
    discardPeriodicTasks();
  }));

  it('should require group for group type binding', fakeAsync(() => {
    component.bindingType = BindingType.Cluster;
    component.subjectType = Kind.Group;
    component.form.controls.role.setValue('role-1');

    const groupControl = component.form.get(Controls.Group);
    expect(groupControl.valid).toBeFalsy();

    groupControl.setValue('admins');
    expect(groupControl.valid).toBeTruthy();
    discardPeriodicTasks();
  }));

  it('should require role for cluster binding', fakeAsync(() => {
    component.bindingType = BindingType.Cluster;
    component.form.controls.email.setValue('user@example.com');

    const roleControl = component.form.get(Controls.Role);
    expect(roleControl.valid).toBeFalsy();

    roleControl.setValue('admin');
    expect(roleControl.valid).toBeTruthy();
    discardPeriodicTasks();
  }));

  // Namespace Binding Form Validation Tests
  it('namespace form should be validated correctly', fakeAsync(() => {
    component.bindingType = BindingType.Namespace;
    component.setNamespaceValidators();
    component.form.controls.email.setValue('');
    component.form.controls.role.setValue('');
    fixture.detectChanges();
    expect(component.form.valid).toBeFalsy();

    component.form.controls.email.setValue('test@example.de');
    component.form.controls.role.setValue('role-1');
    fixture.detectChanges();
    component.checkNamespaceState();
    expect(component.form.valid).toBeFalsy();

    component.form.controls.namespace.setValue('default');
    fixture.detectChanges();
    expect(component.form.valid).toBeTruthy();
    discardPeriodicTasks();
  }));

  it('should require namespace for namespace binding', fakeAsync(() => {
    component.bindingType = BindingType.Namespace;
    component.setNamespaceValidators();
    component.form.controls.email.setValue('user@example.com');
    component.form.controls.role.setValue('role-1');

    const namespaceControl = component.form.get(Controls.Namespace);
    expect(namespaceControl.valid).toBeFalsy();

    namespaceControl.setValue('default');
    expect(namespaceControl.valid).toBeTruthy();
    discardPeriodicTasks();
  }));

  it('should not require namespace for cluster binding', fakeAsync(() => {
    component.bindingType = BindingType.Cluster;
    component.setNamespaceValidators();
    component.form.controls.email.setValue('user@example.com');
    component.form.controls.role.setValue('role-1');

    const namespaceControl = component.form.get(Controls.Namespace);
    expect(namespaceControl.valid).toBeTruthy();
    discardPeriodicTasks();
  }));

  // Namespace Management Tests
  it('should get namespaces', () => {
    component.roles = fakeRoleNames();
    component.form.controls.role.setValue('role-3');
    fixture.detectChanges();
    expect(component.getNamespaces()).toEqual(['default-test', 'test-2']);
  });

  it('should return empty array for unknown role', () => {
    component.roles = fakeRoleNames();
    component.form.controls.role.setValue('unknown-role');
    fixture.detectChanges();
    expect(component.getNamespaces()).toEqual([]);
  });

  it('should disable namespace control when role is empty', fakeAsync(() => {
    component.bindingType = BindingType.Namespace;
    component.form.controls.role.setValue('');
    component.checkNamespaceState();
    tick();

    expect(component.form.get(Controls.Namespace).disabled).toBeTruthy();
    discardPeriodicTasks();
  }));

  it('should enable namespace control when role is selected', fakeAsync(() => {
    component.bindingType = BindingType.Namespace;
    component.form.controls.role.setValue('role-1');
    component.checkNamespaceState();
    tick();

    expect(component.form.get(Controls.Namespace).enabled).toBeTruthy();
    discardPeriodicTasks();
  }));

  // Binding Type Switching Tests
  it('should switch to cluster binding type', fakeAsync(() => {
    const event = {value: BindingType.Cluster} as any;
    component.changeView(event);
    tick();

    expect(component.bindingType).toBe(BindingType.Cluster);
    discardPeriodicTasks();
  }));

  it('should switch to namespace binding type', fakeAsync(() => {
    const event = {value: BindingType.Namespace} as any;
    component.changeView(event);
    tick();

    expect(component.bindingType).toBe(BindingType.Namespace);
    discardPeriodicTasks();
  }));

  // Subject Type Switching Tests
  it('should require email for User subject type', fakeAsync(() => {
    component.subjectType = Kind.User;
    component.setSubjectTypeValidators();
    fixture.detectChanges();
    tick();

    const emailControl = component.form.get(Controls.Email);
    expect(emailControl.hasError('required')).toBeTruthy();
    discardPeriodicTasks();
  }));

  it('should require group for Group subject type', fakeAsync(() => {
    component.subjectType = Kind.Group;
    component.setSubjectTypeValidators();
    fixture.detectChanges();
    tick();

    const groupControl = component.form.get(Controls.Group);
    expect(groupControl.hasError('required')).toBeTruthy();
    discardPeriodicTasks();
  }));

  // API Call Tests
  it('should create cluster binding with email', fakeAsync(() => {
    component.bindingType = BindingType.Cluster;
    component.form.controls.email.setValue('user@example.com');
    component.form.controls.role.setValue('admin');

    const createSpy = jest.spyOn(rbacService, 'createClusterBinding');
    component.getObservable().subscribe();
    tick();

    expect(createSpy).toHaveBeenCalledWith(
      component.cluster.id,
      component.projectID,
      'admin',
      expect.objectContaining({userEmail: 'user@example.com'})
    );
    flush();
  }));

  it('should create cluster binding with group', fakeAsync(() => {
    component.bindingType = BindingType.Cluster;
    component.subjectType = Kind.Group;
    component.form.controls.group.setValue('admins');
    component.form.controls.role.setValue('admin');

    const createSpy = jest.spyOn(rbacService, 'createClusterBinding');
    component.getObservable().subscribe();
    tick();

    expect(createSpy).toHaveBeenCalledWith(
      component.cluster.id,
      component.projectID,
      'admin',
      expect.objectContaining({group: 'admins'})
    );
    flush();
  }));

  it('should create namespace binding with email and namespace', fakeAsync(() => {
    component.bindingType = BindingType.Namespace;
    component.form.controls.email.setValue('user@example.com');
    component.form.controls.role.setValue('viewer');
    component.form.controls.namespace.setValue('default');

    const createSpy = jest.spyOn(rbacService, 'createNamespaceBinding');
    component.getObservable().subscribe();
    tick();

    expect(createSpy).toHaveBeenCalledWith(
      component.cluster.id,
      component.projectID,
      'viewer',
      'default',
      expect.objectContaining({userEmail: 'user@example.com'})
    );
    flush();
  }));

  // Dialog Integration Tests
  it('should close dialog on onNext', fakeAsync(() => {
    const closeSpy = jest.spyOn(dialogRef, 'close');
    const binding = fakeClusterBinding();

    component.onNext(binding);
    tick();

    expect(closeSpy).toHaveBeenCalledWith(binding);
  }));

  it('should show cluster binding success notification', fakeAsync(() => {
    const notificationSpy = jest.spyOn(notificationService, 'success');
    const binding = fakeClusterBinding();
    component.bindingType = BindingType.Cluster;

    component.onNext(binding);
    tick();

    expect(notificationSpy).toHaveBeenCalledWith(
      expect.stringContaining('cluster binding')
    );
    flush();
  }));

  it('should show namespace binding success notification', fakeAsync(() => {
    const notificationSpy = jest.spyOn(notificationService, 'success');
    const binding = fakeNamespaceBinding();
    component.bindingType = BindingType.Namespace;

    component.onNext(binding);
    tick();

    expect(notificationSpy).toHaveBeenCalledWith(
      expect.stringContaining('binding')
    );
    flush();
  }));

  // Lifecycle Tests
  it('should clean up on destroy', fakeAsync(() => {
    const spy = jest.spyOn(component['_unsubscribe'], 'next');
    component.ngOnDestroy();
    tick();

    expect(spy).toHaveBeenCalled();
  }));

  it('should complete unsubscribe on destroy', fakeAsync(() => {
    const spy = jest.spyOn(component['_unsubscribe'], 'complete');
    component.ngOnDestroy();
    tick();

    expect(spy).toHaveBeenCalled();
  }));

  // Edge Cases
  it('should handle special characters in email with validator', fakeAsync(() => {
    const emailControl = component.form.get(Controls.Email);
    emailControl.setValue('user+tag@example.com');
    tick();

    expect(emailControl.valid).toBeTruthy();
    discardPeriodicTasks();
  }));

  it('should handle multiple role selections', fakeAsync(() => {
    component.form.controls.role.setValue('role-1');
    tick(1000);
    expect(component.form.get(Controls.Role).value).toBe('role-1');

    component.form.controls.role.setValue('role-2');
    tick(1000);
    expect(component.form.get(Controls.Role).value).toBe('role-2');

    discardPeriodicTasks();
  }));

  it('should handle form control enum usage', () => {
    expect(Controls.Email).toBe('email');
    expect(Controls.Group).toBe('group');
    expect(Controls.Role).toBe('role');
    expect(Controls.Namespace).toBe('namespace');
  });

  it('should handle binding type enum usage', () => {
    expect(BindingType.Cluster).toBe('cluster');
    expect(BindingType.Namespace).toBe('namespace');
  });
});
