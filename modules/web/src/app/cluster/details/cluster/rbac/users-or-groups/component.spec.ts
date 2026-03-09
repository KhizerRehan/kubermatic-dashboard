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
import {SharedModule} from '@shared/module';
import {Kind} from '@shared/entity/rbac';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeProject} from '@test/data/project';
import {fakeClusterBinding, fakeNamespaceBinding, fakeSimpleClusterBinding} from '@test/data/rbac';
import {asyncData} from '@test/services/cluster-mock';
import {RBACUsersOrGroupsComponent} from './component';

describe('RBACUsersOrGroupsComponent', () => {
  let fixture: ComponentFixture<RBACUsersOrGroupsComponent>;
  let component: RBACUsersOrGroupsComponent;
  let rbacService: any;

  beforeEach(waitForAsync(() => {
    const rbacMock = {
      getClusterBindings: jest.fn(),
      getNamespaceBindings: jest.fn(),
    };

    rbacMock.getClusterBindings.mockReturnValue(asyncData([fakeClusterBinding()]));
    rbacMock.getNamespaceBindings.mockReturnValue(asyncData([fakeNamespaceBinding()]));

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [RBACUsersOrGroupsComponent],
      providers: [
        {provide: RBACService, useValue: rbacMock},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RBACUsersOrGroupsComponent);
    component = fixture.componentInstance;
    rbacService = fixture.debugElement.injector.get(RBACService);
    component.cluster = fakeDigitaloceanCluster();
    component.projectID = fakeProject().id;
    component.rbacType = Kind.User;
    fixture.detectChanges();
  });

  it('should create the component', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should initialize with Kind enum', waitForAsync(() => {
    expect(component.RBACType).toBe(Kind);
  }));

  it('should initialize with correct columns', waitForAsync(() => {
    expect(component.columns).toBeDefined();
    expect(component.columns.length).toBeGreaterThan(0);
  }));

  it('should have input bindings', waitForAsync(() => {
    expect(component.cluster).toBeDefined();
    expect(component.projectID).toBeDefined();
    expect(component.rbacType).toBe(Kind.User);
  }));

  it('should load bindings on ngOnInit', fakeAsync(() => {
    tick();
    expect(rbacService.getClusterBindings).toHaveBeenCalledWith(component.cluster.id, component.projectID);
  }));

  it('should set isLoading to false after loading', fakeAsync(() => {
    expect(component.isLoading).toBeFalsy();
  }));

  it('should populate dataSource', fakeAsync(() => {
    tick();
    expect(component.dataSource.data).toBeDefined();
  }));

  it('should emit deleteBinding event', fakeAsync(() => {
    const binding = fakeSimpleClusterBinding();
    const emitSpy = jest.spyOn(component.deleteBinding, 'emit');
    component.delete(binding);
    tick();
    expect(emitSpy).toHaveBeenCalledWith(binding);
  }));

  it('should clean up on destroy', fakeAsync(() => {
    const spy = jest.spyOn(component['_unsubscribe'], 'next');
    component.ngOnDestroy();
    tick();
    expect(spy).toHaveBeenCalled();
  }));
});
