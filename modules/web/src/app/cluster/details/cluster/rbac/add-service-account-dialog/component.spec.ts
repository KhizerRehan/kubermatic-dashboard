// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {ComponentFixture, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ClusterServiceAccountService} from '@core/services/cluster-service-account';
import {RBACService} from '@core/services/rbac';
import {NotificationService} from '@core/services/notification';
import {SharedModule} from '@shared/module';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeProject} from '@test/data/project';
import {fakeClusterServiceAccount} from '@test/data/rbac';
import {asyncData} from '@test/services/cluster-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {AddServiceAccountDialogComponent, Controls} from './component';

describe('AddServiceAccountDialogComponent', () => {
  let fixture: ComponentFixture<AddServiceAccountDialogComponent>;
  let component: AddServiceAccountDialogComponent;
  let rbacService: any;
  let serviceAccountService: any;
  let dialogRef: MatDialogRef<AddServiceAccountDialogComponent>;

  beforeEach(waitForAsync(() => {
    const rbacMock = {
      getClusterNamespaces: jest.fn(),
    };

    const serviceAccountMock = {
      post: jest.fn(),
    };

    rbacMock.getClusterNamespaces.mockReturnValue(asyncData(['default', 'kube-system']));
    serviceAccountMock.post.mockReturnValue(asyncData(fakeClusterServiceAccount()));

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [AddServiceAccountDialogComponent],
      providers: [
        {provide: RBACService, useValue: rbacMock},
        {provide: ClusterServiceAccountService, useValue: serviceAccountMock},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(AddServiceAccountDialogComponent);
    component = fixture.componentInstance;
    rbacService = fixture.debugElement.injector.get(RBACService);
    serviceAccountService = fixture.debugElement.injector.get(ClusterServiceAccountService);
    dialogRef = fixture.debugElement.injector.get(MatDialogRef);
    component.cluster = fakeDigitaloceanCluster();
    component.projectID = fakeProject().id;
    fixture.detectChanges();
  }));

  it('should create the component', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should initialize form with name and namespace controls', waitForAsync(() => {
    expect(component.form.get(Controls.Name)).toBeDefined();
    expect(component.form.get(Controls.Namespace)).toBeDefined();
  }));

  it('should have Controls enum available', waitForAsync(() => {
    expect(component.Controls).toBe(Controls);
  }));

  it('should load namespaces on init', fakeAsync(() => {
    tick();
    expect(rbacService.getClusterNamespaces).toHaveBeenCalledWith(component.projectID, component.cluster.id);
    expect(component.namespaces.length).toBeGreaterThan(0);
  }));

  it('should require name field', fakeAsync(() => {
    const nameControl = component.form.get(Controls.Name);
    nameControl.setValue('');
    tick();
    expect(nameControl.hasError('required')).toBeTruthy();
  }));

  it('should require namespace field', fakeAsync(() => {
    const namespaceControl = component.form.get(Controls.Namespace);
    namespaceControl.setValue('');
    tick();
    expect(namespaceControl.hasError('required')).toBeTruthy();
  }));

  it('should validate name with kubernetes pattern', fakeAsync(() => {
    const nameControl = component.form.get(Controls.Name);
    nameControl.setValue('valid-name');
    tick();
    expect(nameControl.valid).toBeTruthy();
  }));

  it('should populate namespaces dropdown', fakeAsync(() => {
    tick();
    expect(component.namespaces).toContain('default');
    expect(component.namespaces).toContain('kube-system');
  }));

  it('should create service account via API', fakeAsync(() => {
    component.form.get(Controls.Name).setValue('my-sa');
    component.form.get(Controls.Namespace).setValue('default');

    const postSpy = jest.spyOn(serviceAccountService, 'post');
    component.getObservable().subscribe();
    tick();

    expect(postSpy).toHaveBeenCalledWith(
      component.projectID,
      component.cluster.id,
      expect.objectContaining({name: 'my-sa', namespace: 'default'})
    );
  }));

  it('should close dialog on onNext', fakeAsync(() => {
    const closeSpy = jest.spyOn(dialogRef, 'close');
    const account = fakeClusterServiceAccount();
    component.onNext(account);
    tick();
    expect(closeSpy).toHaveBeenCalledWith(account);
  }));

  it('should show notification on success', fakeAsync(() => {
    const notificationSpy = jest.spyOn(TestBed.inject(NotificationService), 'success');
    const account = fakeClusterServiceAccount();
    component.onNext(account);
    tick();
    expect(notificationSpy).toHaveBeenCalledWith(expect.stringContaining('Added'));
  }));

  it('should clean up on destroy', fakeAsync(() => {
    const spy = jest.spyOn(component['_unsubscribe'], 'next');
    component.ngOnDestroy();
    tick();
    expect(spy).toHaveBeenCalled();
  }));
});
