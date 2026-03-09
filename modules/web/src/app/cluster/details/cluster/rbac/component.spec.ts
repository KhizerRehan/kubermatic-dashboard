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

import {ComponentFixture, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialog } from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeProject} from '@test/data/project';
import {fakeClusterBinding, fakeSimpleClusterBinding, fakeClusterServiceAccount} from '@test/data/rbac';
import {RouterStub} from '@test/services/router-stubs';
import {NotificationService} from '@core/services/notification';
import {RBACService} from '@core/services/rbac';
import {SharedModule} from '@shared/module';
import {of} from 'rxjs';
import {RBACComponent} from './component';
import {AddBindingDialogComponent} from './add-binding-dialog/component';
import {AddServiceAccountDialogComponent} from './add-service-account-dialog/component';
import {AddServiceAccountBindingDialogComponent} from './add-service-account-binding-dialog/component';
import {ClusterService} from '@core/services/cluster';
import {ClusterMockService} from '@test/services/cluster-mock';
import {AppConfigService} from '@app/config.service';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {ClusterServiceAccountService} from '@core/services/cluster-service-account';
import {ClusterServiceAccountMockService} from '@test/services/cluster-service-account-mock';
import {Kind} from '@shared/entity/rbac';
import {NoopConfirmDialogComponent} from '@test/components/noop-confirmation-dialog.component';

describe('RBACComponent', () => {
  let fixture: ComponentFixture<RBACComponent>;
  let component: RBACComponent;
  let rbacService: any;
  let clusterServiceAccountService: any;
  let matDialog: MatDialog;
  let notificationService: NotificationService;

  beforeEach(waitForAsync(() => {
    const rbacMock = {
      deleteClusterBinding: jest.fn(),
      deleteNamespaceBinding: jest.fn(),
      refreshClusterBindings: jest.fn(),
      refreshNamespaceBindings: jest.fn(),
    };
    rbacMock.deleteClusterBinding.mockReturnValue(of(null));
    rbacMock.deleteNamespaceBinding.mockReturnValue(of(null));

    const clusterServiceAccountMock = {
      refreshServiceAccounts: jest.fn(),
      delete: jest.fn(),
    };
    clusterServiceAccountMock.delete.mockReturnValue(of(null));

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, NoopConfirmDialogComponent],
      declarations: [RBACComponent, AddBindingDialogComponent, AddServiceAccountDialogComponent, AddServiceAccountBindingDialogComponent],
      providers: [
        {provide: RBACService, useValue: rbacMock},
        {provide: ClusterServiceAccountService, useValue: clusterServiceAccountMock},
        {provide: Router, useClass: RouterStub},
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        MatDialog,
        GoogleAnalyticsService,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RBACComponent);
    component = fixture.componentInstance;
    rbacService = fixture.debugElement.injector.get(RBACService);
    clusterServiceAccountService = fixture.debugElement.injector.get(ClusterServiceAccountService);
    matDialog = fixture.debugElement.injector.get(MatDialog);
    notificationService = fixture.debugElement.injector.get(NotificationService);
    component.cluster = fakeDigitaloceanCluster();
    component.projectID = fakeProject().id;
    component.isClusterRunning = true;
    fixture.detectChanges();
  });

  it('should create the rbac cmp', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  // Initialization Tests
  it('should initialize with Kind enum', waitForAsync(() => {
    expect(component.RBACKind).toBe(Kind);
  }));

  it('should initialize with RBAC modes', waitForAsync(() => {
    expect(component.modes).toContain(Kind.ServiceAccount);
    expect(component.modes).toContain(Kind.User);
    expect(component.modes).toContain(Kind.Group);
  }));

  it('should initialize modeControl with ServiceAccount default', waitForAsync(() => {
    expect(component.modeControl.value).toBe(Kind.ServiceAccount);
  }));

  it('should have cluster and projectID inputs', waitForAsync(() => {
    expect(component.cluster).toBeDefined();
    expect(component.projectID).toBeDefined();
  }));

  // Dialog Management Tests
  it('should open addBinding dialog with event', fakeAsync(() => {
    const event = new Event('click');
    const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
    const openSpy = jest.spyOn(matDialog, 'open').mockReturnValue({
      componentInstance: {},
      afterClosed: () => of(fakeClusterBinding()),
    } as any);

    component.addBinding(event);
    tick();

    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith(AddBindingDialogComponent);
  }));

  it('should set dialog instance properties for addBinding', fakeAsync(() => {
    const event = new Event('click');
    const mockDialogRef = {
      componentInstance: {},
      afterClosed: () => of(fakeClusterBinding()),
    };
    jest.spyOn(matDialog, 'open').mockReturnValue(mockDialogRef as any);

    component.modeControl.setValue(Kind.User);
    component.addBinding(event);
    tick();

    expect(mockDialogRef.componentInstance.cluster).toBe(component.cluster);
    expect(mockDialogRef.componentInstance.projectID).toBe(component.projectID);
    expect(mockDialogRef.componentInstance.subjectType).toBe(Kind.User);
  }));

  it('should open addServiceAccount dialog', fakeAsync(() => {
    const event = new Event('click');
    const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
    const openSpy = jest.spyOn(matDialog, 'open').mockReturnValue({
      componentInstance: {},
      afterClosed: () => of(null),
    } as any);

    component.addServiceAccount(event);
    tick();

    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith(AddServiceAccountDialogComponent);
  }));

  it('should set dialog instance properties for addServiceAccount', fakeAsync(() => {
    const event = new Event('click');
    const mockDialogRef = {
      componentInstance: {},
      afterClosed: () => of(null),
    };
    jest.spyOn(matDialog, 'open').mockReturnValue(mockDialogRef as any);

    component.addServiceAccount(event);
    tick();

    expect(mockDialogRef.componentInstance.cluster).toBe(component.cluster);
    expect(mockDialogRef.componentInstance.projectID).toBe(component.projectID);
  }));

  it('should open addServiceAccountBinding dialog without service account', fakeAsync(() => {
    const openSpy = jest.spyOn(matDialog, 'open').mockReturnValue({
      componentInstance: {},
      afterClosed: () => of(null),
    } as any);

    component.addServiceAccountBinding();
    tick();

    expect(openSpy).toHaveBeenCalledWith(AddServiceAccountBindingDialogComponent);
  }));

  it('should open addServiceAccountBinding dialog with service account', fakeAsync(() => {
    const serviceAccount = fakeClusterServiceAccount();
    const mockDialogRef = {
      componentInstance: {},
      afterClosed: () => of(null),
    };
    jest.spyOn(matDialog, 'open').mockReturnValue(mockDialogRef as any);

    component.addServiceAccountBinding(serviceAccount);
    tick();

    expect(mockDialogRef.componentInstance.clusterServiceAccount).toBe(serviceAccount);
  }));

  // Service Account Deletion Tests
  it('should open confirmation dialog for deleteServiceAccount', fakeAsync(() => {
    const serviceAccount = fakeClusterServiceAccount();
    const event = new Event('click');

    jest.spyOn(matDialog, 'open').mockReturnValue({
      componentInstance: {},
      afterClosed: () => of(false),
    } as any);

    component.deleteServiceAccount(serviceAccount);
    tick();

    const dialogTitle = document.body.querySelector('.mat-mdc-dialog-title');
    expect(dialogTitle?.textContent).toContain('Delete Service Account');
  }));

  it('should call service delete on confirmation', fakeAsync(() => {
    const serviceAccount = fakeClusterServiceAccount();
    const deleteSpy = jest.spyOn(clusterServiceAccountService, 'delete');

    component.deleteServiceAccount(serviceAccount);
    tick(15000);

    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;
    deleteButton?.click();
    tick(15000);

    expect(deleteSpy).toHaveBeenCalledWith(
      component.projectID,
      component.cluster.id,
      serviceAccount.namespace,
      serviceAccount.name
    );
  }));

  it('should refresh bindings after service account deletion', fakeAsync(() => {
    const serviceAccount = fakeClusterServiceAccount();

    component.deleteServiceAccount(serviceAccount);
    tick(15000);

    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;
    deleteButton?.click();
    tick(15000);

    expect(rbacService.refreshClusterBindings).toHaveBeenCalled();
    expect(rbacService.refreshNamespaceBindings).toHaveBeenCalled();
  }));

  it('should show notification on successful service account deletion', fakeAsync(() => {
    const serviceAccount = fakeClusterServiceAccount();
    const notificationSpy = jest.spyOn(notificationService, 'success');

    component.deleteServiceAccount(serviceAccount);
    tick(15000);

    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;
    deleteButton?.click();
    tick(15000);

    expect(notificationSpy).toHaveBeenCalledWith(
      expect.stringContaining(serviceAccount.name)
    );
  }));

  // Binding Deletion Tests
  it('should open confirmation dialog for deleteBinding', fakeAsync(() => {
    const binding = fakeSimpleClusterBinding();

    jest.spyOn(matDialog, 'open').mockReturnValue({
      componentInstance: {},
      afterClosed: () => of(false),
    } as any);

    component.deleteBinding(binding);
    tick();

    const dialogTitle = document.body.querySelector('.mat-mdc-dialog-title');
    expect(dialogTitle?.textContent).toContain('Delete Binding');
  }));

  it('should call deleteClusterBinding for cluster-scoped bindings', fakeAsync(() => {
    const binding = fakeSimpleClusterBinding();
    binding.namespace = undefined; // Cluster-scoped

    component.deleteBinding(binding);
    tick(15000);

    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;
    deleteButton?.click();
    tick(15000);

    expect(rbacService.deleteClusterBinding).toHaveBeenCalled();
    expect(rbacService.deleteNamespaceBinding).not.toHaveBeenCalled();
  }));

  it('should call deleteNamespaceBinding for namespace-scoped bindings', fakeAsync(() => {
    const binding = fakeSimpleClusterBinding();
    binding.namespace = 'default'; // Namespace-scoped

    component.deleteBinding(binding);
    tick(15000);

    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;
    deleteButton?.click();
    tick(15000);

    expect(rbacService.deleteNamespaceBinding).toHaveBeenCalled();
  }));

  it('should show notification on successful binding deletion', fakeAsync(() => {
    const binding = fakeSimpleClusterBinding();
    const notificationSpy = jest.spyOn(notificationService, 'success');

    component.deleteBinding(binding);
    tick(15000);

    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;
    deleteButton?.click();
    tick(15000);

    expect(notificationSpy).toHaveBeenCalledWith(
      expect.stringContaining(binding.name)
    );
  }));

  // Dialog Refresh Tests
  it('should refresh bindings after addBinding dialog closes', fakeAsync(() => {
    const event = new Event('click');

    jest.spyOn(matDialog, 'open').mockReturnValue({
      componentInstance: {},
      afterClosed: () => of(fakeClusterBinding()),
    } as any);

    component.addBinding(event);
    tick();

    expect(rbacService.refreshClusterBindings).toHaveBeenCalled();
    expect(rbacService.refreshNamespaceBindings).toHaveBeenCalled();
  }));

  it('should refresh bindings after addServiceAccount dialog closes', fakeAsync(() => {
    const event = new Event('click');

    jest.spyOn(matDialog, 'open').mockReturnValue({
      componentInstance: {},
      afterClosed: () => of(fakeClusterServiceAccount()),
    } as any);

    component.addServiceAccount(event);
    tick();

    expect(rbacService.refreshClusterBindings).toHaveBeenCalled();
  }));

  it('should refresh bindings after addServiceAccountBinding dialog closes', fakeAsync(() => {
    jest.spyOn(matDialog, 'open').mockReturnValue({
      componentInstance: {},
      afterClosed: () => of(fakeClusterBinding()),
    } as any);

    component.addServiceAccountBinding();
    tick();

    expect(clusterServiceAccountService.refreshServiceAccounts).toHaveBeenCalled();
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
});
