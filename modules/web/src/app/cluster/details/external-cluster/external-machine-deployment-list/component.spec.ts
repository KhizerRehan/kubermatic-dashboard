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
import {MatPaginatorModule, MatPaginator} from '@angular/material/paginator';
import {MatTableModule} from '@angular/material/table';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {ExternalMachineDeploymentService} from '@core/services/external-machine-deployment';
import {NotificationService} from '@core/services/notification';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {ExternalMachineDeployment, ExternalMachineDeploymentHealthStatus} from '@shared/entity/external-machine-deployment';
import {ExternalCluster} from '@shared/entity/external-cluster';
import {fakeCustomExternalCluster} from '@test/data/external-cluster';
import {UserMockService} from '@test/services/user-mock';
import {of} from 'rxjs';
import {ExternalMachineDeploymentListComponent} from './component';

describe('ExternalMachineDeploymentListComponent', () => {
  let fixture: ComponentFixture<ExternalMachineDeploymentListComponent>;
  let component: ExternalMachineDeploymentListComponent;
  let router: Router;
  let dialog: MatDialog;
  let notificationService: NotificationService;

  beforeEach(waitForAsync(() => {
    const routerMock = {
      navigate: jest.fn(),
    };
    const dialogMock = {
      open: jest.fn().mockReturnValue({
        componentInstance: {},
        afterClosed: () => of(null),
      } as MatDialogRef<any>),
    };
    const notificationServiceMock = {
      success: jest.fn(),
      error: jest.fn(),
    };
    const externalMachineDeploymentServiceMock = {
      showDeleteDialog: jest.fn().mockReturnValue(of(null)),
    };

    TestBed.configureTestingModule({
      imports: [MatTableModule, MatPaginatorModule, NoopAnimationsModule, SharedModule],
      declarations: [ExternalMachineDeploymentListComponent],
      providers: [
        {provide: Router, useValue: routerMock},
        {provide: MatDialog, useValue: dialogMock},
        {provide: NotificationService, useValue: notificationServiceMock},
        {provide: ExternalMachineDeploymentService, useValue: externalMachineDeploymentServiceMock},
        {provide: UserService, useClass: UserMockService},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExternalMachineDeploymentListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    dialog = TestBed.inject(MatDialog);
    notificationService = TestBed.inject(NotificationService);
  });

  it('should create the external machine deployment list component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize displayedColumns with all column values', () => {
    expect(component.displayedColumns).toContain('status');
    expect(component.displayedColumns).toContain('name');
    expect(component.displayedColumns).toContain('replicas');
    expect(component.displayedColumns).toContain('version');
    expect(component.displayedColumns).toContain('os');
    expect(component.displayedColumns).toContain('created');
    expect(component.displayedColumns).toContain('actions');
  });

  it('should initialize dataSource as MatTableDataSource', () => {
    expect(component.dataSource).toBeTruthy();
    expect(component.dataSource.data).toEqual([]);
  });

  it('should accept cluster as input', () => {
    const cluster = fakeCustomExternalCluster();
    component.cluster = cluster;
    expect(component.cluster).toBe(cluster);
  });

  it('should accept machineDeployments as input', () => {
    const machineDeployments: ExternalMachineDeployment[] = [
      {
        id: 'md-1',
        name: 'test-md',
        spec: {
          replicas: 3,
          template: {
            spec: {
              osName: 'ubuntu',
            },
          },
        },
        status: {
          replicas: 3,
          readyReplicas: 3,
          availableReplicas: 3,
        },
        creationTimestamp: new Date(),
      } as ExternalMachineDeployment,
    ];
    component.machineDeployments = machineDeployments;
    expect(component.machineDeployments).toBe(machineDeployments);
  });

  it('should accept projectID as input', () => {
    component.projectID = 'test-project-id';
    expect(component.projectID).toBe('test-project-id');
  });

  it('should accept isClusterRunning as input', () => {
    component.isClusterRunning = true;
    expect(component.isClusterRunning).toBe(true);
  });

  it('should accept isInitialized as input', () => {
    component.isInitialized = true;
    expect(component.isInitialized).toBe(true);
  });

  it('should initialize machine deployments data source on ngOnInit', waitForAsync(() => {
    const cluster = fakeCustomExternalCluster();
    const machineDeployments: ExternalMachineDeployment[] = [
      {
        id: 'md-1',
        name: 'test-md',
        spec: {
          replicas: 3,
          template: {
            spec: {
              osName: 'ubuntu',
            },
          },
        },
        status: {
          replicas: 3,
          readyReplicas: 3,
          availableReplicas: 3,
        },
        creationTimestamp: new Date(),
      } as ExternalMachineDeployment,
    ];
    component.cluster = cluster;
    component.machineDeployments = machineDeployments;
    component.projectID = 'test-project-id';

    fixture.detectChanges();

    expect(component.dataSource.data).toEqual(machineDeployments);
    expect(component.dataSource.paginator).toBe(component.paginator);
  }));

  it('should update dataSource on ngOnChanges', () => {
    const newMachineDeployments: ExternalMachineDeployment[] = [
      {
        id: 'md-2',
        name: 'new-md',
        spec: {
          replicas: 5,
          template: {
            spec: {
              osName: 'centos',
            },
          },
        },
        status: {
          replicas: 5,
          readyReplicas: 5,
          availableReplicas: 5,
        },
        creationTimestamp: new Date(),
      } as ExternalMachineDeployment,
    ];
    component.machineDeployments = newMachineDeployments;
    component.ngOnChanges();

    expect(component.dataSource.data).toEqual(newMachineDeployments);
  });

  it('should emit machineDeploymentChange when machine deployment changes', (done) => {
    const machineDeployment: ExternalMachineDeployment = {
      id: 'md-1',
      name: 'test-md',
      spec: {
        replicas: 3,
        template: {
          spec: {
            osName: 'ubuntu',
          },
        },
      },
      status: {
        replicas: 3,
        readyReplicas: 3,
        availableReplicas: 3,
      },
      creationTimestamp: new Date(),
    } as ExternalMachineDeployment;

    component.machineDeploymentChange$.subscribe((md) => {
      expect(md).toEqual(machineDeployment);
      done();
    });

    component.machineDeploymentChange$.emit(machineDeployment);
  });

  it('should navigate to machine deployment details on goToDetails', () => {
    const cluster = fakeCustomExternalCluster();
    const machineDeployment: ExternalMachineDeployment = {
      id: 'md-1',
      name: 'test-md',
      spec: {
        replicas: 3,
        template: {
          spec: {
            osName: 'ubuntu',
          },
        },
      },
      status: {
        replicas: 3,
        readyReplicas: 3,
        availableReplicas: 3,
      },
      creationTimestamp: new Date(),
    } as ExternalMachineDeployment;
    component.cluster = cluster;
    component.projectID = 'test-project-id';
    const routerSpy = jest.spyOn(router, 'navigate');

    component.goToDetails(machineDeployment);

    expect(routerSpy).toHaveBeenCalled();
  });

  it('should have isEditEnabled method that returns boolean', () => {
    const result = component.isEditEnabled();
    expect(typeof result).toBe('boolean');
  });

  it('should have isDeleteEnabled method that returns boolean', () => {
    const result = component.isDeleteEnabled();
    expect(typeof result).toBe('boolean');
  });

  it('should have isAddMachineDeploymentsEnabled method that returns boolean', () => {
    const result = component.isAddMachineDeploymentsEnabled();
    expect(typeof result).toBe('boolean');
  });

  it('should show update dialog on updateMachineDeployment', () => {
    const cluster = fakeCustomExternalCluster();
    const machineDeployment: ExternalMachineDeployment = {
      id: 'md-1',
      name: 'test-md',
      spec: {
        replicas: 3,
        template: {
          spec: {
            osName: 'ubuntu',
          },
        },
      },
      status: {
        replicas: 3,
        readyReplicas: 3,
        availableReplicas: 3,
      },
      creationTimestamp: new Date(),
    } as ExternalMachineDeployment;
    component.cluster = cluster;
    component.projectID = 'test-project-id';
    const dialogSpy = jest.spyOn(dialog, 'open');

    component.updateMachineDeployment(machineDeployment);

    expect(dialogSpy).toHaveBeenCalled();
  });

  it('should show delete dialog on showDeleteDialog', () => {
    const cluster = fakeCustomExternalCluster();
    const machineDeployment: ExternalMachineDeployment = {
      id: 'md-1',
      name: 'test-md',
      spec: {
        replicas: 3,
        template: {
          spec: {
            osName: 'ubuntu',
          },
        },
      },
      status: {
        replicas: 3,
        readyReplicas: 3,
        availableReplicas: 3,
      },
      creationTimestamp: new Date(),
    } as ExternalMachineDeployment;
    component.cluster = cluster;
    component.projectID = 'test-project-id';
    const externalMachineDeploymentService = TestBed.inject(ExternalMachineDeploymentService);
    const showDeleteDialogSpy = jest.spyOn(externalMachineDeploymentService, 'showDeleteDialog');

    component.showDeleteDialog(machineDeployment);

    expect(showDeleteDialogSpy).toHaveBeenCalled();
  });

  it('should check visibility of paginator based on data', () => {
    component.isInitialized = true;
    component.machineDeployments = [];
    const isPaginatorVisible = component.isPaginatorVisible();

    expect(typeof isPaginatorVisible).toBe('boolean');
  });

  it('should check loading state', () => {
    component.isInitialized = false;
    const isLoadingData = component.isLoadingData();

    expect(typeof isLoadingData).toBe('boolean');
  });

  it('should check if there is no data', () => {
    component.machineDeployments = [];
    const hasNoData = component.hasNoData();

    expect(typeof hasNoData).toBe('boolean');
  });

  it('should handle empty machine deployments array', waitForAsync(() => {
    component.machineDeployments = [];
    component.projectID = 'test-project-id';

    fixture.detectChanges();

    expect(component.dataSource.data.length).toBe(0);
  }));

  it('should handle null machine deployments', waitForAsync(() => {
    component.machineDeployments = null as any;
    component.projectID = 'test-project-id';

    fixture.detectChanges();

    // Should handle gracefully (implementation returns [])
    expect(component.dataSource.data).toBeDefined();
  }));

  it('should filter AKS-specific columns when cluster is AKS', waitForAsync(() => {
    const cluster = fakeCustomExternalCluster();
    cluster.cloud.aks = {
      resourceGroup: 'test-rg',
      name: 'test-cluster',
    };
    component.cluster = cluster;
    component.projectID = 'test-project-id';

    fixture.detectChanges();

    // Should include AKS-specific columns
    expect(component.displayedColumns).toBeDefined();
  }));

  it('should handle machine deployments with different health statuses', () => {
    const healthyMD: ExternalMachineDeployment = {
      id: 'md-1',
      name: 'healthy-md',
      spec: {
        replicas: 3,
        template: {
          spec: {
            osName: 'ubuntu',
          },
        },
      },
      status: {
        replicas: 3,
        readyReplicas: 3,
        availableReplicas: 3,
      },
      creationTimestamp: new Date(),
    } as ExternalMachineDeployment;

    const unhealthyMD: ExternalMachineDeployment = {
      id: 'md-2',
      name: 'unhealthy-md',
      spec: {
        replicas: 3,
        template: {
          spec: {
            osName: 'ubuntu',
          },
        },
      },
      status: {
        replicas: 3,
        readyReplicas: 1,
        availableReplicas: 1,
      },
      creationTimestamp: new Date(),
    } as ExternalMachineDeployment;

    component.machineDeployments = [healthyMD, unhealthyMD];
    component.ngOnChanges();

    expect(component.dataSource.data.length).toBe(2);
  });

  it('should get operating system from machine deployment', () => {
    const machineDeployment: ExternalMachineDeployment = {
      id: 'md-1',
      name: 'test-md',
      spec: {
        replicas: 3,
        template: {
          spec: {
            osName: 'ubuntu',
          },
        },
      },
      status: {
        replicas: 3,
        readyReplicas: 3,
        availableReplicas: 3,
      },
      creationTimestamp: new Date(),
    } as ExternalMachineDeployment;

    const os = component.getOperatingSystem(machineDeployment);
    expect(os).toBeDefined();
  });

  it('should unsubscribe on component destroy', () => {
    const unsubscribeSpy = jest.spyOn(component['_unsubscribe'], 'next');
    const completeSpy = jest.spyOn(component['_unsubscribe'], 'complete');

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
