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
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {RBACService} from '@core/services/rbac';
import {ClusterServiceAccountService} from '@core/services/cluster-service-account';
import {SharedModule} from '@shared/module';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeProject} from '@test/data/project';
import {fakeClusterServiceAccount, fakeClusterBinding, fakeNamespaceBinding} from '@test/data/rbac';
import {asyncData} from '@test/services/cluster-mock';
import {RBACServiceAccountComponent} from './component';

describe('RBACServiceAccountComponent', () => {
  let fixture: ComponentFixture<RBACServiceAccountComponent>;
  let component: RBACServiceAccountComponent;
  let rbacService: any;
  let serviceAccountService: any;

  beforeEach(waitForAsync(() => {
    const rbacMock = {
      getClusterBindings: jest.fn(),
      getNamespaceBindings: jest.fn(),
    };

    const serviceAccountMock = {
      get: jest.fn(),
      getKubeconfigUrl: jest.fn(),
    };

    rbacMock.getClusterBindings.mockReturnValue(asyncData([fakeClusterBinding()]));
    rbacMock.getNamespaceBindings.mockReturnValue(asyncData([fakeNamespaceBinding()]));
    serviceAccountMock.get.mockReturnValue(asyncData([fakeClusterServiceAccount()]));
    serviceAccountMock.getKubeconfigUrl.mockReturnValue('http://example.com/kubeconfig');

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [RBACServiceAccountComponent],
      providers: [
        {provide: RBACService, useValue: rbacMock},
        {provide: ClusterServiceAccountService, useValue: serviceAccountMock},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RBACServiceAccountComponent);
    component = fixture.componentInstance;
    rbacService = fixture.debugElement.injector.get(RBACService);
    serviceAccountService = fixture.debugElement.injector.get(ClusterServiceAccountService);
    component.cluster = fakeDigitaloceanCluster();
    component.projectID = fakeProject().id;
    fixture.detectChanges();
  });

  it('should create the component', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should initialize with input bindings', waitForAsync(() => {
    expect(component.cluster).toBeDefined();
    expect(component.projectID).toBeDefined();
  }));

  it('should have output emitters', waitForAsync(() => {
    expect(component.addBinding).toBeDefined();
    expect(component.deleteBinding).toBeDefined();
    expect(component.deleteClusterServiceAccount).toBeDefined();
  }));

  it('should load service accounts on ngOnInit', fakeAsync(() => {
    tick();
    expect(serviceAccountService.get).toHaveBeenCalledWith(component.projectID, component.cluster.id);
  }));

  it('should load bindings on ngOnInit', fakeAsync(() => {
    tick();
    expect(rbacService.getClusterBindings).toHaveBeenCalled();
    expect(rbacService.getNamespaceBindings).toHaveBeenCalled();
  }));

  it('should set isLoading to false', fakeAsync(() => {
    expect(component.isLoading).toBeFalsy();
  }));

  it('should populate dataSource with service accounts', fakeAsync(() => {
    tick();
    expect(component.dataSource.data.length).toBeGreaterThan(0);
  }));

  it('should initialize expansion state', waitForAsync(() => {
    expect(component.clusterServiceAccountExpansion).toBeDefined();
  }));

  it('should toggle row expansion', fakeAsync(() => {
    const account = fakeClusterServiceAccount();
    component.expandRow(account);
    tick();
    expect(component.clusterServiceAccountExpansion[account.id]).toBeTruthy();
  }));

  it('should get kubeconfig download URL', fakeAsync(() => {
    const account = fakeClusterServiceAccount();
    component.download(account);
    tick();
    expect(serviceAccountService.getKubeconfigUrl).toHaveBeenCalledWith(
      component.projectID,
      component.cluster.id,
      account.namespace,
      account.id
    );
  }));

  it('should emit addBinding event', fakeAsync(() => {
    const account = fakeClusterServiceAccount();
    const emitSpy = jest.spyOn(component.addBinding, 'emit');
    component.addServiceAccountBinding(account);
    tick();
    expect(emitSpy).toHaveBeenCalledWith(account);
  }));

  it('should emit deleteBinding event', fakeAsync(() => {
    const binding = fakeClusterBinding();
    const emitSpy = jest.spyOn(component.deleteBinding, 'emit');
    component.deleteServiceAccountBinding(binding as any);
    tick();
    expect(emitSpy).toHaveBeenCalled();
  }));

  it('should emit deleteClusterServiceAccount event', fakeAsync(() => {
    const account = fakeClusterServiceAccount();
    const emitSpy = jest.spyOn(component.deleteClusterServiceAccount, 'emit');
    component.deleteServiceAccount(account);
    tick();
    expect(emitSpy).toHaveBeenCalledWith(account);
  }));

  it('should clean up on destroy', fakeAsync(() => {
    const spy = jest.spyOn(component['_unsubscribe'], 'next');
    component.ngOnDestroy();
    tick();
    expect(spy).toHaveBeenCalled();
  }));
});
