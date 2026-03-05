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
import {SharedModule} from '@shared/module';
import {ClusterMetrics} from '@shared/entity/metrics';
import {ClusterMetricsComponent} from './component';

function fakeClusterMetrics(): ClusterMetrics {
  return {
    name: 'test-cluster',
    controlPlane: {
      memoryTotalBytes: 8192,
      cpuTotalMillicores: 4000,
    },
    nodes: {
      memoryTotalBytes: 16384,
      memoryAvailableBytes: 8192,
      memoryUsedPercentage: 50,
      cpuTotalMillicores: 8000,
      cpuAvailableMillicores: 4000,
      cpuUsedPercentage: 50,
    },
  };
}

describe('ClusterMetricsComponent', () => {
  let fixture: ComponentFixture<ClusterMetricsComponent>;
  let component: ClusterMetricsComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SharedModule],
      declarations: [ClusterMetricsComponent],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterMetricsComponent);
    component = fixture.componentInstance;
  });

  it('should create the cluster metrics component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with undefined clusterMetrics', () => {
    expect(component.clusterMetrics).toBeUndefined();
  });

  it('should accept clusterMetrics as input', () => {
    const metrics = fakeClusterMetrics();
    component.clusterMetrics = metrics;
    expect(component.clusterMetrics).toBe(metrics);
  });

  it('should accept null clusterMetrics input', () => {
    component.clusterMetrics = null;
    expect(component.clusterMetrics).toBeNull();
  });

  it('should reflect updated clusterMetrics on input change', () => {
    const metrics1 = fakeClusterMetrics();
    const metrics2 = {...fakeClusterMetrics(), name: 'other-cluster'};
    component.clusterMetrics = metrics1;
    expect(component.clusterMetrics.name).toBe('test-cluster');
    component.clusterMetrics = metrics2;
    expect(component.clusterMetrics.name).toBe('other-cluster');
  });

  it('should not throw when rendering without metrics', () => {
    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('should not throw when rendering with metrics', () => {
    component.clusterMetrics = fakeClusterMetrics();
    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('should store metrics with control plane data', () => {
    const metrics = fakeClusterMetrics();
    component.clusterMetrics = metrics;
    expect(component.clusterMetrics.controlPlane).toBeDefined();
    expect(component.clusterMetrics.controlPlane.cpuTotalMillicores).toBe(4000);
    expect(component.clusterMetrics.controlPlane.memoryTotalBytes).toBe(8192);
  });

  it('should store metrics with nodes data', () => {
    const metrics = fakeClusterMetrics();
    component.clusterMetrics = metrics;
    expect(component.clusterMetrics.nodes).toBeDefined();
    expect(component.clusterMetrics.nodes.cpuUsedPercentage).toBe(50);
    expect(component.clusterMetrics.nodes.memoryUsedPercentage).toBe(50);
  });
});
