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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {DatacenterService} from '@core/services/datacenter';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {SharedModule} from '@shared/module';
import {ClusterTemplate} from '@shared/entity/cluster-template';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {of} from 'rxjs';
import {ClusterFromTemplateComponent} from './component';

describe('ClusterFromTemplateComponent', () => {
  let fixture: ComponentFixture<ClusterFromTemplateComponent>;
  let component: ClusterFromTemplateComponent;
  let datacenterService: jasmine.SpyObj<DatacenterService>;
  let clusterTemplateService: jasmine.SpyObj<ClusterTemplateService>;

  const mockDatacenter: Datacenter = {
    metadata: {name: 'dc1'},
    spec: {
      provider: 'aws',
      seed: 'seed-1',
    },
  } as Datacenter;

  const mockSeedSettings: SeedSettings = {
    mla: {user_cluster_mla_enabled: false},
  } as SeedSettings;

  const mockTemplate: ClusterTemplate = {
    name: 'test-template',
    cluster: {
      spec: {
        cloud: {
          dc: 'dc1',
        },
      },
    },
    userSshKeys: [
      {name: 'key1'},
      {name: 'key2'},
    ],
  } as ClusterTemplate;

  beforeEach(() => {
    const datacenterSpy = jasmine.createSpyObj('DatacenterService', ['getDatacenter', 'seedSettings']);
    const templateSpy = jasmine.createSpyObj('ClusterTemplateService', [], {
      replicas: 1,
      clusterStepValidity: true,
    });

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule],
      providers: [
        {provide: DatacenterService, useValue: datacenterSpy},
        {provide: ClusterTemplateService, useValue: templateSpy},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    datacenterService = TestBed.inject(DatacenterService) as jasmine.SpyObj<DatacenterService>;
    clusterTemplateService = TestBed.inject(ClusterTemplateService) as jasmine.SpyObj<ClusterTemplateService>;

    datacenterService.getDatacenter.and.returnValue(of(mockDatacenter));
    datacenterService.seedSettings.and.returnValue(of(mockSeedSettings));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterFromTemplateComponent);
    component = fixture.componentInstance;
    component.template = mockTemplate;
    component.projectId = 'project-1';
  });

  it('should initialize component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load datacenter on initialization', () => {
    fixture.detectChanges();
    expect(datacenterService.getDatacenter).toHaveBeenCalledWith('dc1');
    expect(component.datacenter).toEqual(mockDatacenter);
  });

  it('should load seed settings on initialization', () => {
    fixture.detectChanges();
    expect(datacenterService.seedSettings).toHaveBeenCalledWith('seed-1');
    expect(component.seedSettings).toEqual(mockSeedSettings);
  });

  it('should create form with replicas control', () => {
    fixture.detectChanges();
    expect(component.form).toBeTruthy();
    expect(component.form.get('replicas')).toBeTruthy();
  });

  it('should initialize replicas control with default value', () => {
    fixture.detectChanges();
    const replicasControl = component.form.get('replicas');
    expect(replicasControl.value).toBe(1);
  });

  it('should update clusterTemplateService replicas on form value change', (done) => {
    fixture.detectChanges();
    const replicasControl = component.form.get('replicas');
    replicasControl.setValue(3);

    setTimeout(() => {
      expect(clusterTemplateService.replicas).toBe(3);
      done();
    }, 100);
  });

  it('should update clusterTemplateService validity on form status change', (done) => {
    fixture.detectChanges();
    const replicasControl = component.form.get('replicas');
    replicasControl.setValue(5);

    setTimeout(() => {
      expect(clusterTemplateService.clusterStepValidity).toBeDefined();
      done();
    }, 100);
  });

  it('should extract SSH key names from template', () => {
    component.template = {
      ...mockTemplate,
      userSshKeys: [
        {name: 'key1'},
        {name: 'key2'},
        {name: 'key3'},
      ],
    } as ClusterTemplate;
    const sshKeys = component.sshKeys;
    expect(sshKeys.length).toBe(3);
    expect(sshKeys).toContain('key1');
    expect(sshKeys).toContain('key2');
    expect(sshKeys).toContain('key3');
  });

  it('should handle template without SSH keys', () => {
    component.template = {
      ...mockTemplate,
      userSshKeys: undefined,
    } as ClusterTemplate;
    const sshKeys = component.sshKeys;
    expect(sshKeys).toBeTruthy();
    expect(sshKeys.length).toBe(0);
  });

  it('should display details when showDetails is true', () => {
    component.showDetails = true;
    fixture.detectChanges();
    expect(component.showDetails).toBeTrue();
  });

  it('should clean up subscriptions on destroy', () => {
    fixture.detectChanges();
    spyOn(component['_unsubscribe'], 'next');
    spyOn(component['_unsubscribe'], 'complete');

    component.ngOnDestroy();

    expect(component['_unsubscribe'].next).toHaveBeenCalled();
    expect(component['_unsubscribe'].complete).toHaveBeenCalled();
  });
});
