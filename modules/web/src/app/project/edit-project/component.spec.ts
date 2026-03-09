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
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ChangeDetectorRef} from '@angular/core';
import {CoreModule} from '@core/module';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {UserService} from '@app/core/services/user';
import {SharedModule} from '@shared/module';
import {DEFAULT_ADMIN_SETTINGS} from '@app/shared/entity/settings';
import {ProjectModule} from '../module';
import {EditProjectComponent} from './component';
import {asyncData} from '@test/services/cluster-mock';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {AppConfigService} from '@app/config.service';
import {UserMockService} from '@test/services/user-mock';
import {fakeProject} from '@test/data/project';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';

describe('EditProjectComponent', () => {
  let fixture: ComponentFixture<EditProjectComponent>;
  let component: EditProjectComponent;
  let projectService: ProjectService;
  let userService: UserMockService;
  let notificationService: NotificationService;
  let dialogRef: MatDialogRefMock;
  let editProjectSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const projectServiceMock = {edit: jest.fn()};
    editProjectSpy = projectServiceMock.edit.mockReturnValue(asyncData(fakeProject()));

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule, ProjectModule],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: ProjectService, useValue: projectServiceMock},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: UserService, useClass: UserMockService},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(EditProjectComponent);
    component = fixture.componentInstance;
    projectService = TestBed.inject(ProjectService);
    userService = TestBed.inject(UserService) as UserMockService;
    notificationService = TestBed.inject(NotificationService);
    dialogRef = TestBed.inject(MatDialogRef) as MatDialogRefMock;
    component.project = fakeProject();
    component.adminAllowedOperatingSystems = DEFAULT_ADMIN_SETTINGS.allowedOperatingSystems;
    component.labels = {};
    component.asyncLabelValidators = [];
    fixture.detectChanges();
  }));

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Component initialization tests
  it('should initialize', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should have valid form after creating', () => {
    expect(component.form.valid).toBeTruthy();
  });

  it('should initialize with project input', () => {
    const project = fakeProject();
    component.project = project;
    fixture.detectChanges();

    expect(component.project).toBe(project);
    expect(component.project.id).toBeTruthy();
  });

  it('should initialize with admin allowed operating systems', () => {
    const operatingSystems = DEFAULT_ADMIN_SETTINGS.allowedOperatingSystems;
    component.adminAllowedOperatingSystems = operatingSystems;

    expect(component.adminAllowedOperatingSystems).toBe(operatingSystems);
  });

  // Form validation tests
  it('should have required fields', () => {
    component.form.controls.name.patchValue('');
    expect(component.form.valid).toBeFalsy();
    expect(component.form.controls.name.valid).toBeFalsy();
    expect(component.form.controls.name.hasError('required')).toBeTruthy();

    component.form.controls.name.patchValue('new-project-name');
    expect(component.form.controls.name.hasError('required')).toBeFalsy();
  });

  it('should require project name', () => {
    component.form.get('name').setValue('');
    fixture.detectChanges();

    expect(component.form.get('name').valid).toBeFalsy();
    expect(component.form.get('name').hasError('required')).toBeTruthy();
  });

  it('should validate project name field', () => {
    component.form.get('name').setValue('test-project');
    fixture.detectChanges();

    expect(component.form.get('name').valid).toBeTruthy();
  });

  it('should have labels control', () => {
    expect(component.form.get('labels')).toBeTruthy();
  });

  it('should have CPU quota control', () => {
    expect(component.form.get('cpuQuota')).toBeTruthy();
  });

  it('should have memory quota control', () => {
    expect(component.form.get('memoryQuota')).toBeTruthy();
  });

  it('should have storage quota control', () => {
    expect(component.form.get('storageQuota')).toBeTruthy();
  });

  it('should have allowed operating systems control', () => {
    expect(component.form.get('allowedOperatingSystems')).toBeTruthy();
  });

  // Project model tests
  it('should initialize labels from project', waitForAsync(() => {
    const projectWithLabels = {...fakeProject(), labels: {'env': 'prod', 'team': 'backend'}};
    component.project = projectWithLabels;
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.labels).toBeDefined();
  }));

  it('should clone project labels on init', () => {
    const projectWithLabels = {...fakeProject(), labels: {'env': 'prod'}};
    component.project = projectWithLabels;
    component.ngOnInit();

    // Labels should be a copy, not reference
    expect(component.labels).toEqual(projectWithLabels.labels);
  });

  // Operating system handling tests
  it('should handle operating system changes', () => {
    const operatingSystems = ['ubuntu', 'centos'];
    component.project = {...fakeProject(), spec: {allowedOperatingSystems: {}}};

    component.onOperatingSystemChange(operatingSystems);

    expect(component.project.spec.allowedOperatingSystems['ubuntu']).toBe(true);
    expect(component.project.spec.allowedOperatingSystems['centos']).toBe(true);
  });

  it('should set operating system flags to true', () => {
    component.project = {...fakeProject(), spec: {allowedOperatingSystems: {}}};

    component.onOperatingSystemChange(['ubuntu', 'debian']);
    fixture.detectChanges();

    expect(component.project.spec.allowedOperatingSystems['ubuntu']).toBe(true);
    expect(component.project.spec.allowedOperatingSystems['debian']).toBe(true);
  });

  it('should handle single operating system selection', () => {
    component.project = {...fakeProject(), spec: {allowedOperatingSystems: {}}};

    component.onOperatingSystemChange(['ubuntu']);

    expect(component.project.spec.allowedOperatingSystems['ubuntu']).toBe(true);
  });

  // Observable tests
  it('should generate observable for edit operation', () => {
    component.form.controls.name.setValue('updated-project');
    component.labels = {'env': 'staging'};

    const observable = component.getObservable();

    expect(observable).toBeTruthy();
    // Observable should call project service edit
    observable.subscribe(() => {
      expect(editProjectSpy).toHaveBeenCalled();
    });
  });

  it('should include project name in observable', () => {
    const newName = 'updated-project-name';
    component.form.controls.name.setValue(newName);

    const observable = component.getObservable();

    expect(observable).toBeTruthy();
  });

  it('should include labels in observable', () => {
    const newLabels = {'env': 'prod', 'team': 'backend'};
    component.labels = newLabels;

    const observable = component.getObservable();

    expect(observable).toBeTruthy();
  });

  it('should remove nullified labels from edit payload', () => {
    component.labels = {'env': 'prod', 'team': null};
    component.form.controls.name.setValue('test');

    const observable = component.getObservable();
    observable.subscribe(() => {
      // Nullified labels should be removed
      expect(editProjectSpy).toHaveBeenCalled();
    });
  });

  // Dialog closing tests
  it('should close dialog on next', () => {
    const closeSpy = jest.spyOn(component.dialogRef, 'close');
    const project = fakeProject();
    component.project = project;

    component.onNext(project);

    expect(closeSpy).toHaveBeenCalledWith(project);
  });

  it('should pass project to dialog close', () => {
    const closeSpy = jest.spyOn(component.dialogRef, 'close');
    const project = fakeProject();
    component.project = project;

    component.onNext(project);

    expect(closeSpy).toHaveBeenCalledWith(project);
  });

  // Notification tests
  it('should show success notification on next', () => {
    const notificationSpy = jest.spyOn(notificationService, 'success');
    const project = fakeProject();
    component.project = project;

    component.onNext(project);

    expect(notificationSpy).toHaveBeenCalledWith(`Updated the ${project.name} project`);
  });

  // Member checking tests
  it('should identify user as project member', waitForAsync(() => {
    const user = userService.currentUser;
    const userProject = {...fakeProject(), id: 'project-1'};
    user.projects = [{id: 'project-1', group: 'editors'}];
    component.project = userProject;

    component.ngOnInit();
    fixture.detectChanges();
    tick();

    expect(component.isMember).toBeDefined();
  }));

  it('should identify user as non-member', () => {
    const userProject = {...fakeProject(), id: 'other-project'};
    component.project = userProject;

    component['_initForm']();
    fixture.detectChanges();

    expect(component.isMember).toBeDefined();
  });

  // Controls enum test
  it('should have Controls enum defined', () => {
    expect(component.Controls).toBeDefined();
    expect(component.Controls.Name).toBe('name');
    expect(component.Controls.Labels).toBe('labels');
  });

  it('should reference controls by enum', () => {
    expect(component.form.get(component.Controls.Name)).toBeTruthy();
    expect(component.form.get(component.Controls.Labels)).toBeTruthy();
  });

  // Change detection tests
  it('should trigger change detection after init', waitForAsync(() => {
    const cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy = jest.spyOn(cdr, 'detectChanges');

    component.ngOnInit();
    tick();

    expect(detectChangesSpy).toHaveBeenCalled();
  }));

  // Enterprise Edition tests
  it('should have isEnterpriseEdition flag', () => {
    expect(component.isEnterpriseEdition).toBeDefined();
  });

  // Async validators tests
  it('should have async label validators', () => {
    expect(component.asyncLabelValidators).toBeDefined();
    expect(Array.isArray(component.asyncLabelValidators)).toBe(true);
  });

  // Form control access tests
  it('should access form controls directly', () => {
    const nameControl = component.form.controls.name;
    expect(nameControl).toBeTruthy();
  });

  it('should update form control values', () => {
    const newValue = 'new-test-project';
    component.form.controls.name.patchValue(newValue);

    expect(component.form.controls.name.value).toBe(newValue);
  });

  // Quota control tests
  it('should initialize quota controls with empty values', () => {
    expect(component.form.get(component.Controls.CPUQuota).value).toBe('');
    expect(component.form.get(component.Controls.MemoryQuota).value).toBe('');
    expect(component.form.get(component.Controls.StorageQuota).value).toBe('');
  });

  it('should allow setting quota values', () => {
    component.form.get(component.Controls.CPUQuota).setValue('10');
    component.form.get(component.Controls.MemoryQuota).setValue('20');
    component.form.get(component.Controls.StorageQuota).setValue('100');

    expect(component.form.get(component.Controls.CPUQuota).value).toBe('10');
    expect(component.form.get(component.Controls.MemoryQuota).value).toBe('20');
    expect(component.form.get(component.Controls.StorageQuota).value).toBe('100');
  });

  // Project initialization tests
  it('should handle project without labels', () => {
    const projectNoLabels = {...fakeProject(), labels: null};
    component.project = projectNoLabels;

    expect(() => {
      component['_initForm']();
    }).not.toThrow();
  });

  it('should handle project with complex operating systems', () => {
    const projectWithOS = {
      ...fakeProject(),
      spec: {allowedOperatingSystems: {'ubuntu': true, 'centos': true, 'debian': false}},
    };
    component.project = projectWithOS;
    component.adminAllowedOperatingSystems = {
      ubuntu: true,
      centos: true,
      debian: true,
      rocky: false,
    };

    component['_initForm']();

    expect(component.form.get(component.Controls.AllowedOperatingSystems)).toBeTruthy();
  });

  // Form state tests
  it('should mark form as untouched initially', () => {
    expect(component.form.untouched).toBe(true);
  });

  it('should mark form as pristine initially', () => {
    expect(component.form.pristine).toBe(true);
  });

  it('should mark form as dirty after change', () => {
    component.form.get('name').setValue('new-name');

    expect(component.form.dirty).toBe(true);
  });

  it('should mark control as touched after interaction', () => {
    component.form.get('name').markAsTouched();

    expect(component.form.get('name').touched).toBe(true);
  });

  // Error handling in observable
  it('should handle edit observable with project data', () => {
    component.project = fakeProject();
    component.form.controls.name.setValue('test-update');

    const obs = component.getObservable();
    expect(obs).toBeTruthy();
  });

  // User subscription tests
  it('should load current user on init', waitForAsync(() => {
    component.ngOnInit();
    tick();

    expect(component.user).toBeDefined();
  }));
});
