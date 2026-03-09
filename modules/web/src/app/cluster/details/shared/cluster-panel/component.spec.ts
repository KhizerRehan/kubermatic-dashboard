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
import {ActivatedRoute, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {fakeDigitaloceanDatacenter} from '@test/data/datacenter';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeCustomExternalCluster} from '@test/data/external-cluster';
import {ActivatedRouteStub} from '@test/services/router-stubs';
import {ClusterPanelComponent} from './component';

class RouterStub {
  navigate = jest.fn();
}

describe('ClusterPanelComponent', () => {
  let fixture: ComponentFixture<ClusterPanelComponent>;
  let component: ClusterPanelComponent;
  let router: RouterStub;

  beforeEach(waitForAsync(() => {
    router = new RouterStub();

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, RouterTestingModule],
      declarations: [ClusterPanelComponent],
      providers: [
        {provide: Router, useValue: router},
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create the cluster panel component', () => {
    expect(component).toBeTruthy();
  });

  it('should accept cluster as input', () => {
    const cluster = fakeDigitaloceanCluster();
    component.cluster = cluster;
    expect(component.cluster).toBe(cluster);
  });

  it('should accept datacenter as input', () => {
    const dc = fakeDigitaloceanDatacenter();
    component.datacenter = dc;
    expect(component.datacenter).toBe(dc);
  });

  it('should accept projectID as input', () => {
    component.projectID = 'test-project-id';
    expect(component.projectID).toBe('test-project-id');
  });

  it('should return region string when datacenter has country and location', () => {
    const dc = fakeDigitaloceanDatacenter();
    // fakeDigitaloceanDatacenter has country: 'DE' and location: 'Frankfurt'
    component.datacenter = dc;
    expect(component.region).toBe('DE (Frankfurt)');
  });

  it('should return undefined when datacenter is null', () => {
    component.datacenter = null;
    expect(component.region).toBeUndefined();
  });

  it('should return undefined when datacenter has no spec', () => {
    component.datacenter = {} as any;
    expect(component.region).toBeUndefined();
  });

  it('should return undefined when datacenter has no country', () => {
    const dc = fakeDigitaloceanDatacenter();
    delete dc.spec.country;
    component.datacenter = dc;
    expect(component.region).toBeUndefined();
  });

  it('should return undefined when datacenter has no location', () => {
    const dc = fakeDigitaloceanDatacenter();
    delete dc.spec.location;
    component.datacenter = dc;
    expect(component.region).toBeUndefined();
  });

  it('should return undefined when datacenter provider is BRINGYOUROWN', () => {
    const dc = fakeDigitaloceanDatacenter();
    dc.spec.provider = NodeProvider.BRINGYOUROWN;
    component.datacenter = dc;
    expect(component.region).toBeUndefined();
  });

  it('should call router.navigate on goBack()', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['../../'], expect.objectContaining({relativeTo: expect.anything()}));
  });

  it('should accept external cluster as input', () => {
    const externalCluster = fakeCustomExternalCluster();
    component.cluster = externalCluster;
    expect(component.cluster).toBe(externalCluster);
  });

  it('should return region string with correct format (country in parentheses with location)', () => {
    const dc = fakeDigitaloceanDatacenter();
    dc.spec.country = 'US';
    dc.spec.location = 'New York';
    component.datacenter = dc;
    expect(component.region).toBe('US (New York)');
  });
});
