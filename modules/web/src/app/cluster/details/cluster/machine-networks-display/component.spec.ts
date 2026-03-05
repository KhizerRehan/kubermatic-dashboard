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
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatTableModule} from '@angular/material/table';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {fakeClusterWithMachineNetwork} from '@test/data/cluster-with-machine-networks';
import {MachineNetworksDisplayComponent} from './component';

describe('MachineNetworksDisplayComponent', () => {
  let fixture: ComponentFixture<MachineNetworksDisplayComponent>;
  let component: MachineNetworksDisplayComponent;
  let dialog: MatDialog;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MatTableModule, NoopAnimationsModule],
      declarations: [MachineNetworksDisplayComponent],
      providers: [
        {
          provide: MatDialog,
          useValue: {
            open: jest.fn().mockReturnValue({
              componentInstance: {},
            } as MatDialogRef<any>),
          },
        },
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineNetworksDisplayComponent);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
  });

  it('should create the machine networks display component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize displayedColumns with correct column names', () => {
    expect(component.displayedColumns).toEqual(['number', 'cidr', 'dnsServers', 'gateway']);
  });

  it('should initialize dataSource as MatTableDataSource', () => {
    expect(component.dataSource).toBeTruthy();
    expect(component.dataSource.data).toEqual([]);
  });

  it('should accept cluster as input', () => {
    const cluster = fakeClusterWithMachineNetwork();
    component.cluster = cluster;
    expect(component.cluster).toBe(cluster);
  });

  it('should accept projectID as input', () => {
    component.projectID = 'test-project-id';
    expect(component.projectID).toBe('test-project-id');
  });

  it('should accept isClusterRunning as input', () => {
    component.isClusterRunning = true;
    expect(component.isClusterRunning).toBe(true);
  });

  it('should populate dataSource with cluster machine networks', () => {
    const cluster = fakeClusterWithMachineNetwork();
    component.cluster = cluster;

    const dataSource = component.getDataSource();

    expect(dataSource.data).toEqual(cluster.spec.machineNetworks);
    expect(dataSource.data.length).toBe(1);
  });

  it('should return correct data source from getDataSource method', () => {
    const cluster = fakeClusterWithMachineNetwork();
    component.cluster = cluster;

    const result = component.getDataSource();

    expect(result).toBe(component.dataSource);
    expect(result.data).toEqual(cluster.spec.machineNetworks);
  });

  it('should handle cluster with multiple machine networks', () => {
    const cluster = fakeClusterWithMachineNetwork();
    cluster.spec.machineNetworks = [
      {
        cidr: '192.182.0.0/29',
        dnsServers: ['8.8.8.8', '8.8.1.1'],
        gateway: '190.128.0.2',
      },
      {
        cidr: '10.0.0.0/24',
        dnsServers: ['1.1.1.1'],
        gateway: '10.0.0.1',
      },
    ];
    component.cluster = cluster;

    const dataSource = component.getDataSource();

    expect(dataSource.data.length).toBe(2);
    expect(dataSource.data[0].cidr).toBe('192.182.0.0/29');
    expect(dataSource.data[1].cidr).toBe('10.0.0.0/24');
  });

  it('should return empty data source for cluster with no machine networks', () => {
    const cluster = fakeClusterWithMachineNetwork();
    cluster.spec.machineNetworks = [];
    component.cluster = cluster;

    const dataSource = component.getDataSource();

    expect(dataSource.data).toEqual([]);
    expect(dataSource.data.length).toBe(0);
  });

  it('should format DNS servers as comma-separated string', () => {
    const cluster = fakeClusterWithMachineNetwork();
    const machineNetwork = cluster.spec.machineNetworks[0];

    const dnsString = component.getDnsString(machineNetwork);

    expect(dnsString).toBe('8.8.8.8, 8.8.1.1');
  });

  it('should format single DNS server correctly', () => {
    const cluster = fakeClusterWithMachineNetwork();
    cluster.spec.machineNetworks[0].dnsServers = ['8.8.8.8'];
    const machineNetwork = cluster.spec.machineNetworks[0];

    const dnsString = component.getDnsString(machineNetwork);

    expect(dnsString).toBe('8.8.8.8');
  });

  it('should handle empty DNS servers array', () => {
    const cluster = fakeClusterWithMachineNetwork();
    cluster.spec.machineNetworks[0].dnsServers = [];
    const machineNetwork = cluster.spec.machineNetworks[0];

    const dnsString = component.getDnsString(machineNetwork);

    expect(dnsString).toBe('');
  });

  it('should handle multiple DNS servers', () => {
    const cluster = fakeClusterWithMachineNetwork();
    cluster.spec.machineNetworks[0].dnsServers = ['8.8.8.8', '8.8.1.1', '1.1.1.1'];
    const machineNetwork = cluster.spec.machineNetworks[0];

    const dnsString = component.getDnsString(machineNetwork);

    expect(dnsString).toBe('8.8.8.8, 8.8.1.1, 1.1.1.1');
  });

  it('should open AddMachineNetworkComponent dialog when addMachineNetwork is called', () => {
    const cluster = fakeClusterWithMachineNetwork();
    const dialogSpy = jest.spyOn(dialog, 'open');
    component.cluster = cluster;
    component.projectID = 'test-project-id';

    component.addMachineNetwork();

    expect(dialogSpy).toHaveBeenCalled();
  });

  it('should set cluster on dialog component instance when adding machine network', () => {
    const cluster = fakeClusterWithMachineNetwork();
    const mockDialogRef = {
      componentInstance: {},
    } as MatDialogRef<any>;
    jest.spyOn(dialog, 'open').mockReturnValue(mockDialogRef);
    component.cluster = cluster;

    component.addMachineNetwork();

    expect(mockDialogRef.componentInstance.cluster).toBe(cluster);
  });

  it('should set projectID on dialog component instance when adding machine network', () => {
    const cluster = fakeClusterWithMachineNetwork();
    const projectID = 'test-project-id';
    const mockDialogRef = {
      componentInstance: {},
    } as MatDialogRef<any>;
    jest.spyOn(dialog, 'open').mockReturnValue(mockDialogRef);
    component.cluster = cluster;
    component.projectID = projectID;

    component.addMachineNetwork();

    expect(mockDialogRef.componentInstance.projectID).toBe(projectID);
  });

  it('should update dataSource when cluster input changes', () => {
    const cluster1 = fakeClusterWithMachineNetwork();
    const cluster2 = fakeClusterWithMachineNetwork();
    cluster2.spec.machineNetworks = [
      {
        cidr: '10.0.0.0/24',
        dnsServers: ['1.1.1.1'],
        gateway: '10.0.0.1',
      },
    ];

    component.cluster = cluster1;
    component.getDataSource();
    expect(component.dataSource.data).toEqual(cluster1.spec.machineNetworks);

    component.cluster = cluster2;
    component.getDataSource();
    expect(component.dataSource.data).toEqual(cluster2.spec.machineNetworks);
  });

  it('should maintain dataSource reference across calls', () => {
    const cluster = fakeClusterWithMachineNetwork();
    component.cluster = cluster;

    const dataSource1 = component.getDataSource();
    const dataSource2 = component.getDataSource();

    expect(dataSource1).toBe(dataSource2);
    expect(dataSource1).toBe(component.dataSource);
  });

  it('should handle cluster with null machine networks gracefully', () => {
    const cluster = fakeClusterWithMachineNetwork();
    cluster.spec.machineNetworks = null as any;
    component.cluster = cluster;

    expect(() => component.getDataSource()).toThrow();
  });

  it('should have MatDialog injected in constructor', () => {
    expect(component['dialog']).toBe(dialog);
  });
});
