// Copyright 2025 The Kubermatic Kubernetes Platform contributors.
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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {SettingsService} from '@core/services/settings';
import {View} from '@app/shared/entity/common';
import {SettingsMockService} from '@test/services/settings-mock';
import {ClustersComponent} from './component';

class RouterStubWithState {
  routerState = {
    snapshot: {
      url: '/projects/test-project/clusters',
    },
  };

  navigate = jest.fn();
}

describe('ClustersComponent', () => {
  let fixture: ComponentFixture<ClustersComponent>;
  let component: ClustersComponent;
  let router: RouterStubWithState;

  beforeEach(waitForAsync(() => {
    router = new RouterStubWithState();

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, RouterTestingModule],
      declarations: [ClustersComponent],
      providers: [
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: Router, useValue: router},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClustersComponent);
    component = fixture.componentInstance;
  });

  it('should create the clusters container component', () => {
    expect(component).toBeTruthy();
  });

  it('should expose View enum', () => {
    expect(component.view).toBe(View);
  });

  it('should initialize areExternalClustersEnabled as false', () => {
    expect(component.areExternalClustersEnabled).toBeFalsy();
  });

  it('should initialize resourcesType as empty string', () => {
    expect(component.resourcesType).toBe('');
  });

  it('should subscribe to adminSettings on init and update areExternalClustersEnabled', () => {
    fixture.detectChanges();
    // The SettingsMockService returns enableExternalClusterImport: true
    expect(component.areExternalClustersEnabled).toBe(true);
  });

  it('should call checkResourcesType on init', () => {
    const checkSpy = jest.spyOn(component, 'checkResourcesType');
    fixture.detectChanges();
    expect(checkSpy).toHaveBeenCalled();
  });

  it('should set resourcesType from last URL segment on checkResourcesType', () => {
    router.routerState.snapshot.url = '/projects/test-project/clusters';
    component.checkResourcesType();
    expect(component.resourcesType).toBe('clusters');
  });

  it('should handle external-clusters URL segment', () => {
    router.routerState.snapshot.url = '/projects/test-project/external-clusters';
    component.checkResourcesType();
    expect(component.resourcesType).toBe('external-clusters');
  });

  it('should handle kubeone-clusters URL segment', () => {
    router.routerState.snapshot.url = '/projects/test-project/kubeone-clusters';
    component.checkResourcesType();
    expect(component.resourcesType).toBe('kubeone-clusters');
  });

  it('should handle simple URL path', () => {
    router.routerState.snapshot.url = '/clusters';
    component.checkResourcesType();
    expect(component.resourcesType).toBe('clusters');
  });

  it('should update resourcesType after multiple checkResourcesType calls', () => {
    router.routerState.snapshot.url = '/projects/test/clusters';
    component.checkResourcesType();
    expect(component.resourcesType).toBe('clusters');

    router.routerState.snapshot.url = '/projects/test/external-clusters';
    component.checkResourcesType();
    expect(component.resourcesType).toBe('external-clusters');
  });

  it('should complete unsubscribe subject on destroy', () => {
    fixture.detectChanges();
    const unsubscribeSpy = jest.spyOn((component as any)._unsubscribe, 'next');
    const completeSpy = jest.spyOn((component as any)._unsubscribe, 'complete');
    component.ngOnDestroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should not throw on multiple destroy calls', () => {
    fixture.detectChanges();
    expect(() => {
      component.ngOnDestroy();
      component.ngOnDestroy();
    }).not.toThrow();
  });

  it('should be initialized with View.ExternalClusters available', () => {
    expect(component.view.ExternalClusters).toBeTruthy();
  });

  it('should be initialized with View.KubeOneClusters available', () => {
    expect(component.view.KubeOneClusters).toBeTruthy();
  });
});
