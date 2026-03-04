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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatDialog} from '@angular/material/dialog';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {BrandingService} from '@core/services/branding';
import {ApplicationService} from '@core/services/application';
import {SharedModule} from '@shared/module';
import {Application, ApplicationAnnotations} from '@shared/entity/application';
import {Cluster} from '@shared/entity/cluster';
import {of} from 'rxjs';
import {ApplicationListComponent, ApplicationsListView} from './component';

describe('ApplicationListComponent', () => {
  let fixture: ComponentFixture<ApplicationListComponent>;
  let component: ApplicationListComponent;
  let applicationService: jasmine.SpyObj<ApplicationService>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let dialogModeService: jasmine.SpyObj<DialogModeService>;
  let brandingService: jasmine.SpyObj<BrandingService>;

  const mockApplication: Application = {
    name: 'test-app',
    spec: {
      applicationRef: {name: 'app-def', version: '1.0.0'},
      namespace: {name: 'kube-system'},
    },
    labels: {},
  };

  const mockCluster: Cluster = {
    name: 'test-cluster',
    spec: {cloud: {}},
  } as Cluster;

  beforeEach(() => {
    const appServiceSpy = jasmine.createSpyObj('ApplicationService', ['listApplicationDefinitions', 'getApplicationDefinition']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const dialogModeSpy = jasmine.createSpyObj('DialogModeService', [], {isEditDialog: false});
    const brandingSpy = jasmine.createSpyObj('BrandingService', [], {logoURL: 'logo.png'});

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      providers: [
        {provide: ApplicationService, useValue: appServiceSpy},
        {provide: MatDialog, useValue: dialogSpy},
        {provide: DialogModeService, useValue: dialogModeSpy},
        {provide: BrandingService, useValue: brandingSpy},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    applicationService = TestBed.inject(ApplicationService) as jasmine.SpyObj<ApplicationService>;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    dialogModeService = TestBed.inject(DialogModeService) as jasmine.SpyObj<DialogModeService>;
    brandingService = TestBed.inject(BrandingService) as jasmine.SpyObj<BrandingService>;

    applicationService.listApplicationDefinitions.and.returnValue(of([]));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationListComponent);
    component = fixture.componentInstance;
  });

  it('should initialize and subscribe to application definitions', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(applicationService.listApplicationDefinitions).toHaveBeenCalled();
  });

  it('should accept applications input and initialize data source', () => {
    component.applications = [mockApplication];
    fixture.detectChanges();
    expect(component.applicationsDataSource.data).toContain(mockApplication);
  });

  it('should filter applications based on system flag', () => {
    const systemApp = {...mockApplication, labels: {'app.kubernetes.io/part-of': 'kubermatic'}};
    component.applications = [mockApplication, systemApp];
    component.view = ApplicationsListView.Default;
    component.showSystemApplications = false;
    fixture.detectChanges();
    const visibleApps = component.applicationsDataSource.data;
    expect(visibleApps.length).toBe(1);
    expect(visibleApps[0]).toEqual(mockApplication);
  });

  it('should emit addApplication event when onAddApplication is called', (done) => {
    component.cluster = mockCluster;
    component.projectID = 'project-1';
    component.isClusterReady = true;
    component.canEdit = true;
    component.applicationDefinitions = [{name: 'app-def'} as any];
    fixture.detectChanges();

    const dialogRefSpyObj = jasmine.createSpyObj({afterClosed: of([mockApplication, {name: 'app-def'}])});
    matDialog.open.and.returnValue(dialogRefSpyObj);

    component.addApplication.subscribe(app => {
      expect(app).toEqual(mockApplication);
      done();
    });

    component.onAddApplication();
  });

  it('should not add application when cluster is not ready', () => {
    component.isClusterReady = false;
    component.canEdit = true;
    component.applicationDefinitions = [{name: 'app-def'} as any];
    fixture.detectChanges();

    component.onAddApplication();
    expect(matDialog.open).not.toHaveBeenCalled();
  });

  it('should emit editApplication event when onEditApplication is called', (done) => {
    component.cluster = mockCluster;
    component.projectID = 'project-1';
    component.applications = [mockApplication];
    fixture.detectChanges();

    const dialogRefSpyObj = jasmine.createSpyObj({afterClosed: of(mockApplication)});
    matDialog.open.and.returnValue(dialogRefSpyObj);

    component.editApplication.subscribe(app => {
      expect(app).toEqual(mockApplication);
      done();
    });

    component.onEditApplication(mockApplication);
  });

  it('should emit deleteApplication event on confirmed deletion', (done) => {
    component.cluster = mockCluster;
    component.applications = [mockApplication];
    fixture.detectChanges();

    const dialogRefSpyObj = jasmine.createSpyObj({afterClosed: of(true)});
    matDialog.open.and.returnValue(dialogRefSpyObj);

    component.deleteApplication.subscribe(app => {
      expect(app).toEqual(mockApplication);
      done();
    });

    component.onDeleteApplication(mockApplication);
  });

  it('should not delete system applications', () => {
    const systemApp = {...mockApplication, labels: {'app.kubernetes.io/part-of': 'kubermatic'}};
    component.applications = [systemApp];
    fixture.detectChanges();

    component.onDeleteApplication(systemApp);
    expect(matDialog.open).not.toHaveBeenCalled();
  });

  it('should toggle system applications visibility', () => {
    const systemApp = {...mockApplication, labels: {'app.kubernetes.io/part-of': 'kubermatic'}};
    component.applications = [mockApplication, systemApp];
    component.view = ApplicationsListView.Default;
    fixture.detectChanges();

    expect(component.showSystemApplications).toBeTrue();
    component.toggleSystemApplications();
    expect(component.showSystemApplications).toBeFalse();
    expect(component.applicationsDataSource.data.length).toBe(1);
  });

  it('should change view between card and table layouts', () => {
    fixture.detectChanges();
    expect(component.showCards).toBeTrue();
    component.changeView();
    expect(component.showCards).toBeFalse();
    component.changeView();
    expect(component.showCards).toBeTrue();
  });

  it('should return correct application type for enforced applications', () => {
    const enforcedApp = {
      ...mockApplication,
      annotations: {[ApplicationAnnotations.Enforce]: 'true'},
    };
    const type = component.getApplicationType(enforcedApp);
    expect(type).toBe('Enforced');
  });

  it('should handle search query filtering', () => {
    component.applications = [mockApplication];
    fixture.detectChanges();
    component.onSearchQueryChanged('test-app');
    expect(component.applicationsDataSource.filter).toBe('test-app');
  });
});
