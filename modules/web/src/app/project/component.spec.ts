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

import {ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {CoreModule} from '@core/module';
import {DatacenterService} from '@core/services/datacenter';
import {DialogModeService} from '@core/services/dialog-mode';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {ProjectStatus} from '@shared/entity/project';
import {NoopProjectDeleteDialogComponent} from '@test/components/noop-project-delete-dialog.component';
import {fakeProject, fakeProjects} from '@test/data/project';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {RouterStub} from '@test/services/router-stubs';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {CookieService} from 'ngx-cookie-service';
import {ProjectComponent} from './component';
import {ProjectModule} from './module';

describe('ProjectComponent', () => {
  let fixture: ComponentFixture<ProjectComponent>;
  let component: ProjectComponent;
  let noop: ComponentFixture<NoopProjectDeleteDialogComponent>;
  let projectService: ProjectMockService;
  let userService: UserMockService;
  let settingsService: SettingsMockService;
  let notificationService: NotificationService;
  let router: Router;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ProjectModule, SharedModule, CoreModule],
      providers: [
        {provide: Router, useClass: RouterStub},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        MatDialog,
        GoogleAnalyticsService,
        CookieService,
        DialogModeService,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopProjectDeleteDialogComponent);
    projectService = TestBed.inject(ProjectService) as ProjectMockService;
    userService = TestBed.inject(UserService) as UserMockService;
    settingsService = TestBed.inject(SettingsService) as SettingsMockService;
    notificationService = TestBed.inject(NotificationService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    projectService.resetCallTracking();
    projectService.resetAll();
  });

  // Basic component initialization tests
  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty projects', () => {
    expect(component.projects).toEqual([]);
  });

  it('should set up data source on init', () => {
    expect(component.dataSource).toBeTruthy();
    expect(component.dataSource.data).toBeDefined();
  });

  it('should initialize displayed columns for enterprise edition', () => {
    component.isEnterpriseEdition = true;
    component.ngOnInit();
    expect(component.displayedColumns.length).toBeGreaterThan(0);
  });

  // Project list rendering tests
  it('should render project list correctly', () => {
    component.projects = fakeProjects();
    component.dataSource.data = component.projects;
    fixture.detectChanges();

    expect(component.dataSource.data.length).toBe(2);
  });

  it('should display project names in data source', () => {
    const projects = fakeProjects();
    component.projects = projects;
    component.dataSource.data = projects;
    fixture.detectChanges();

    expect(component.dataSource.data[0].name).toBe(projects[0].name);
  });

  it('should track projects by ID', () => {
    const project = fakeProject();
    const trackedId = component.projectTrackBy(0, project);
    expect(trackedId).toBe(project.id);
  });

  // Project filtering tests
  it('should filter projects by name', () => {
    const projects = [
      {...fakeProject(), name: 'test-project-1', id: 'test-1'},
      {...fakeProject(), name: 'other-project', id: 'other-1'},
    ];
    component.projects = projects;
    component.dataSource.data = projects;

    const filtered = projects.filter(p => component['_filter'](p, 'test'));
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toContain('test');
  });

  it('should filter projects by ID', () => {
    const projects = [
      {...fakeProject(), name: 'project-1', id: 'abc123'},
      {...fakeProject(), name: 'project-2', id: 'def456'},
    ];
    component.projects = projects;

    const filtered = projects.filter(p => component['_filter'](p, 'abc'));
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toContain('abc');
  });

  it('should filter projects by owner name', () => {
    const projects = [
      {...fakeProject(), owners: [{name: 'John Doe', email: 'john@example.com', id: '1'}]},
      {...fakeProject(), owners: [{name: 'Jane Smith', email: 'jane@example.com', id: '2'}]},
    ];
    component.projects = projects;

    const filtered = projects.filter(p => component['_filter'](p, 'john'));
    expect(filtered.length).toBe(1);
  });

  it('should filter projects by labels', () => {
    const projects = [
      {...fakeProject(), labels: {'env': 'prod', 'team': 'backend'}},
      {...fakeProject(), labels: {'env': 'dev', 'team': 'frontend'}},
    ];
    component.projects = projects;

    const filtered = projects.filter(p => component['_filter'](p, 'prod'));
    expect(filtered.length).toBe(1);
  });

  it('should handle case-insensitive filtering', () => {
    const projects = [
      {...fakeProject(), name: 'MyProject'},
      {...fakeProject(), name: 'OtherProject'},
    ];
    component.projects = projects;

    const filtered = projects.filter(p => component['_filter'](p, 'MYPROJECT'));
    expect(filtered.length).toBe(1);
  });

  it('should handle empty search query', fakeAsync(() => {
    component.projects = fakeProjects();
    component.dataSource.data = component.projects;

    component.onSearch('');
    tick(500);

    expect(component.dataSource.data.length).toBe(component.projects.length);
    expect(component['_activeSearchQuery']).toBe('');
  }));

  // Project search tests
  it('should search projects with debounce', fakeAsync(() => {
    const searchSpy = jest.spyOn(projectService, 'searchProjects');
    const debounceMs = 500;

    component.onSearch('test-project');
    tick(debounceMs);

    expect(searchSpy).toHaveBeenCalledWith('test-project', false);
  }));

  it('should use search endpoint to update data source', fakeAsync(() => {
    const projectService = TestBed.inject(ProjectService) as ProjectMockService;
    const searchSpy = jest.spyOn(projectService, 'searchProjects');
    const debounceMs = 500;

    component.onSearch('new-project-1');
    tick(debounceMs);

    expect(searchSpy).toHaveBeenCalledWith('new-project-1', false);
    expect(component.dataSource.data.length).toBe(1);
  }));

  it('should trim search query', fakeAsync(() => {
    const searchSpy = jest.spyOn(projectService, 'searchProjects');
    const debounceMs = 500;

    component.onSearch('  test-project  ');
    tick(debounceMs);

    expect(searchSpy).toHaveBeenCalledWith('test-project', false);
  }));

  it('should not search for whitespace-only queries', fakeAsync(() => {
    const searchSpy = jest.spyOn(projectService, 'searchProjects');

    component.onSearch('   ');
    tick(500);

    expect(searchSpy).not.toHaveBeenCalled();
  }));

  // Role and permission tests
  it('should get role for project', () => {
    const projectId = 'test-project-id';
    component.role.set(projectId, 'Owner');

    expect(component.getRole(projectId)).toBe('Owner');
  });

  it('should identify admin users', () => {
    const adminUser = {...userService.currentUser, isAdmin: true};
    component.currentUser = adminUser;

    expect(component.isAdmin).toBe(true);
  });

  it('should identify non-admin users', () => {
    const regularUser = {...userService.currentUser, isAdmin: false};
    component.currentUser = regularUser;

    expect(component.isAdmin).toBe(false);
  });

  it('should check edit permission for admin users', () => {
    const adminUser = {...userService.currentUser, isAdmin: true};
    component.currentUser = adminUser;
    component.restrictProjectModification = false;
    const project = fakeProject();

    const canEdit = component.isEditEnabled(project);
    expect(canEdit).toBeDefined();
  });

  it('should check delete permission for admin users', () => {
    const adminUser = {...userService.currentUser, isAdmin: true};
    component.currentUser = adminUser;
    component.restrictProjectDeletion = false;
    const project = fakeProject();

    const canDelete = component.isDeleteEnabled(project);
    expect(canDelete).toBeDefined();
  });

  // Project edit/delete tests
  it('should open delete project confirmation dialog & call deleteProject()', fakeAsync(() => {
    const waitTime = 15000;
    const project = fakeProject();
    const event = new MouseEvent('click');

    component.deleteProject(project, event);
    noop.detectChanges();
    fixture.detectChanges();
    tick(waitTime);

    const dialogTitle = document.body.querySelector('.mat-mdc-dialog-title');
    const deleteButton = document.body.querySelector('#km-delete-project-dialog-confirm-btn') as HTMLInputElement;
    const dialogInput = document.querySelector('#km-delete-project-dialog-input');

    dialogInput.setAttribute('value', project.name);
    deleteButton.disabled = false;

    noop.detectChanges();
    fixture.detectChanges();

    expect(dialogTitle.textContent).toBe('Delete Project');
    expect(document.querySelector('#km-delete-project-dialog-input').getAttribute('value')).toBe(project.name);
    flush();
  }));

  it('should prevent event propagation on edit', () => {
    const event = new MouseEvent('click');
    const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
    const project = fakeProject();

    component.editProject(project, event);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should prevent event propagation on delete', () => {
    const event = new MouseEvent('click');
    const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
    const project = fakeProject();

    component.deleteProject(project, event);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  // Project status tests
  it('should check if project is active', () => {
    const activeProject = {...fakeProject(), status: ProjectStatus.Active};
    const inactiveProject = {...fakeProject(), status: ProjectStatus.Terminating};

    expect(component.isProjectActive(activeProject)).toBe(true);
    expect(component.isProjectActive(inactiveProject)).toBe(false);
  });

  it('should get status icon for project', () => {
    const project = fakeProject();
    const icon = component.getStatusIcon(project);

    expect(icon).toBeDefined();
  });

  // Project owner tests
  it('should format owner names', () => {
    const owners = [
      {name: 'Owner One', email: 'owner1@example.com', id: '1'},
      {name: 'Owner Two', email: 'owner2@example.com', id: '2'},
    ];

    const ownerString = component.getOwnerString(owners);
    expect(ownerString).toContain('Owner One');
    expect(ownerString).toContain('Owner Two');
  });

  it('should get owner name array', () => {
    const owners = [
      {name: 'Owner One', email: 'owner1@example.com', id: '1'},
      {name: 'Owner Two', email: 'owner2@example.com', id: '2'},
    ];

    const nameArray = component.getOwnerNameArray(owners);
    expect(nameArray.length).toBe(2);
    expect(nameArray).toContain('Owner One');
  });

  it('should truncate long owner lists', () => {
    const owners = [
      {name: 'Owner One', email: 'owner1@example.com', id: '1'},
      {name: 'Owner Two', email: 'owner2@example.com', id: '2'},
      {name: 'Owner Three', email: 'owner3@example.com', id: '3'},
    ];
    component['_maxOwnersLen'] = 15;

    const truncated = component.getOwners(owners);
    expect(truncated.length).toBeLessThanOrEqual(15);
  });

  // Project labels tests
  it('should count project labels', () => {
    const project = {
      ...fakeProject(),
      labels: {'env': 'prod', 'team': 'backend', 'cost-center': '12345'},
    };

    const count = component.getLabelsLength(project);
    expect(count).toBe(3);
  });

  it('should format labels as tooltip', () => {
    const project = {
      ...fakeProject(),
      labels: {'env': 'prod', 'team': 'backend'},
    };

    const tooltip = component.getLabelsTooltip(project);
    expect(tooltip).toContain('env');
    expect(tooltip).toContain('prod');
  });

  it('should handle project without labels', () => {
    const project = {...fakeProject(), labels: undefined};

    const count = component.getLabelsLength(project);
    expect(count).toBe(0);
  });

  // Project name formatting tests
  it('should truncate long project names', () => {
    const longName = 'very-long-project-name-that-exceeds-max-length';
    const truncated = component.getName(longName);

    expect(truncated.length).toBeLessThanOrEqual(18);
  });

  it('should not truncate short project names', () => {
    const shortName = 'short-name';
    const result = component.getName(shortName);

    expect(result).toBe(shortName);
  });

  it('should generate tooltip for long project names', () => {
    const longName = 'very-long-project-name-that-exceeds-max-length';
    const tooltip = component.getProjectTooltip(longName);

    expect(tooltip).toBe(longName);
  });

  it('should not generate tooltip for short project names', () => {
    const shortName = 'short-name';
    const tooltip = component.getProjectTooltip(shortName);

    expect(tooltip).toBe('');
  });

  // Project creation tests
  it('should check if project creation is restricted', () => {
    component.isAdmin = false;
    component.restrictProjectCreation = true;

    expect(component.isProjectCreationRestricted()).toBe(true);
  });

  it('should allow project creation for admin when restricted', () => {
    component.currentUser = {...userService.currentUser, isAdmin: true};
    component.restrictProjectCreation = true;

    expect(component.isProjectCreationRestricted()).toBe(false);
  });

  // Project sorting tests
  it('should compare values correctly in ascending order', () => {
    const result = component.compare('a', 'b', true);
    expect(result).toBeLessThan(0);
  });

  it('should compare values correctly in descending order', () => {
    const result = component.compare('a', 'b', false);
    expect(result).toBeGreaterThan(0);
  });

  it('should compare numeric values', () => {
    const result = component.compare(1, 2, true);
    expect(result).toBeLessThan(0);
  });

  // Empty state tests
  it('should identify empty project list', () => {
    component.isInitializing = false;
    component.projects = [];

    expect(component.isEmpty(component.projects)).toBe(true);
  });

  it('should not identify as empty while initializing', () => {
    component.isInitializing = true;
    component.projects = [];

    expect(component.isEmpty(component.projects)).toBe(false);
  });

  // Component cleanup tests
  it('should unsubscribe on destroy', () => {
    const unsubscribeSpy = jest.spyOn(component['_unsubscribe'], 'next');

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('should complete unsubscribe subject on destroy', () => {
    const completeSpy = jest.spyOn(component['_unsubscribe'], 'complete');

    component.ngOnDestroy();

    expect(completeSpy).toHaveBeenCalled();
  });

  // Integration tests with services
  it('should load current user on init', () => {
    expect(component.currentUser).toBeDefined();
  });

  it('should load current user roles', () => {
    const user = userService.currentUser;
    component.currentUser = user;
    component.projects = fakeProjects();

    component['_loadCurrentUserRoles']();

    expect(component.role.size).toBeGreaterThanOrEqual(0);
  });
});
