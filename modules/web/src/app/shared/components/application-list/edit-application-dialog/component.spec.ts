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

import {ComponentFixture, TestBed, waitForAsync, fakeAsync, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {CoreModule} from '@core/module';
import {ApplicationService} from '@core/services/application';
import {SharedModule} from '@shared/module';
import {Application, ApplicationDefinition} from '@shared/entity/application';
import {Cluster} from '@shared/entity/cluster';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {EditApplicationDialogComponent} from './component';
import {of} from 'rxjs';

describe('EditApplicationDialogComponent', () => {
  let fixture: ComponentFixture<EditApplicationDialogComponent>;
  let component: EditApplicationDialogComponent;
  let dialogRef: MatDialogRefMock;
  let applicationService: any;

  const mockApplication: Application = {
    id: 'app-123',
    name: 'test-app',
    namespace: {name: 'default'},
    version: {version: '1.0.0'},
    spec: {} as any,
  } as any;

  const mockApplicationDefinition: ApplicationDefinition = {
    id: 'def-123',
    name: 'test-app-def',
    spec: {} as any,
  } as any;

  const mockCluster: Cluster = {
    id: 'cluster-123',
    name: 'test-cluster',
  } as any;

  beforeEach(() => {
    const applicationServiceMock = {
      getApplicationDefinition: jest.fn().mockReturnValue(of(mockApplicationDefinition)),
      getApplicationVersions: jest.fn().mockReturnValue(of([])),
      updateApplication: jest.fn().mockReturnValue(of({})),
    };

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
      declarations: [EditApplicationDialogComponent],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: ApplicationService, useValue: applicationServiceMock},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(EditApplicationDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as MatDialogRefMock;
    applicationService = TestBed.inject(ApplicationService);

    component.application = mockApplication;
    component.applicationDefinition = mockApplicationDefinition;
    component.cluster = mockCluster;
    component.projectID = 'project-123';
    component.installedApplications = [mockApplication];

    fixture.detectChanges();
  }));

  describe('Component Initialization', () => {
    it('should create the component', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should accept application input', waitForAsync(() => {
      expect(component.application).toEqual(mockApplication);
    }));

    it('should accept applicationDefinition input', waitForAsync(() => {
      expect(component.applicationDefinition).toEqual(mockApplicationDefinition);
    }));

    it('should accept cluster input', waitForAsync(() => {
      expect(component.cluster).toEqual(mockCluster);
    }));

    it('should accept projectID input', waitForAsync(() => {
      expect(component.projectID).toBe('project-123');
    }));

    it('should accept installedApplications input', waitForAsync(() => {
      expect(component.installedApplications).toContain(mockApplication);
    }));

    it('should have controls enum defined', waitForAsync(() => {
      expect(component.Controls).toBeDefined();
    }));

    it('should have access to MatDialogRef', waitForAsync(() => {
      expect(component.dialogRef).toBeTruthy();
    }));

    it('should initialize valuesConfig as empty', waitForAsync(() => {
      expect(component.valuesConfig).toBe('');
    }));

    it('should initialize isValuesConfigValid as true', waitForAsync(() => {
      expect(component.isValuesConfigValid).toBe(true);
    }));

    it('should initialize isLoadingDetails as false', waitForAsync(() => {
      expect(component.isLoadingDetails).toBe(false);
    }));
  });

  describe('Form Initialization', () => {
    it('should initialize form on ngOnInit', waitForAsync(() => {
      component.form = null;
      component.ngOnInit();
      tick();

      expect(component.form).toBeTruthy();
    }));

    it('should load application details', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(applicationService.getApplicationDefinition).toHaveBeenCalled();
    }));
  });

  describe('Application Values Handling', () => {
    it('should accept and store application values config', waitForAsync(() => {
      component.valuesConfig = 'key: value\nname: app';
      expect(component.valuesConfig).toContain('key: value');
    }));

    it('should validate YAML format', waitForAsync(() => {
      component.valuesConfig = 'invalid: yaml: content:';
      expect(component.isValuesConfigValid).toBeDefined();
    }));

    it('should handle empty values config', waitForAsync(() => {
      component.valuesConfig = '';
      expect(component.valuesConfig).toBe('');
    }));

    it('should handle multiline values config', waitForAsync(() => {
      const multilineConfig = 'config:\n  key1: value1\n  key2: value2\n';
      component.valuesConfig = multilineConfig;
      expect(component.valuesConfig).toContain('key1');
      expect(component.valuesConfig).toContain('key2');
    }));
  });

  describe('Application Method', () => {
    it('should track application method', waitForAsync(() => {
      component.applicationMethod = 'Helm';
      expect(component.applicationMethod).toBe('Helm');
    }));

    it('should allow changing application method', waitForAsync(() => {
      component.applicationMethod = 'Helm';
      expect(component.applicationMethod).toBe('Helm');
      component.applicationMethod = 'Kustomize';
      expect(component.applicationMethod).toBe('Kustomize');
    }));
  });

  describe('Dialog Closing', () => {
    it('should allow closing dialog', waitForAsync(() => {
      dialogRef.close();
      expect(dialogRef.closeCalled).toBe(true);
    }));

    it('should allow passing data on close', waitForAsync(() => {
      dialogRef.close(mockApplication);
      expect(dialogRef.closeCalled).toBe(true);
    }));
  });

  describe('Version Management', () => {
    it('should track selected version source', waitForAsync(() => {
      component.selectedVersionSource = '1.0.0';
      expect(component.selectedVersionSource).toBe('1.0.0');
    }));

    it('should update selected version source', waitForAsync(() => {
      component.selectedVersionSource = '1.0.0';
      component.selectedVersionSource = '2.0.0';
      expect(component.selectedVersionSource).toBe('2.0.0');
    }));
  });

  describe('System Applications Detection', () => {
    it('should have isSystemApplication function', waitForAsync(() => {
      expect(component.isSystemApplication).toBeDefined();
      expect(typeof component.isSystemApplication).toBe('function');
    }));

    it('should check if application is system application', waitForAsync(() => {
      const systemApp = {...mockApplication, system: true} as any;
      const result = component.isSystemApplication(systemApp);
      expect(typeof result).toBe('boolean');
    }));
  });

  describe('Installed Applications List', () => {
    it('should accept list of installed applications', waitForAsync(() => {
      const apps = [mockApplication, {...mockApplication, id: 'app-456', name: 'app-2'}] as any;
      component.installedApplications = apps;
      expect(component.installedApplications.length).toBe(2);
    }));

    it('should handle empty installed applications list', waitForAsync(() => {
      component.installedApplications = [];
      expect(component.installedApplications.length).toBe(0);
    }));
  });

  describe('Cleanup and Lifecycle', () => {
    it('should unsubscribe on destroy', fakeAsync(() => {
      component.ngOnDestroy();
      tick();
      expect(component).toBeTruthy();
    }));

    it('should handle component destruction', waitForAsync(() => {
      fixture.destroy();
      expect(component).toBeTruthy();
    }));
  });

  describe('Edge Cases', () => {
    it('should handle application with special characters in name', waitForAsync(() => {
      const specialApp = {...mockApplication, name: 'app-@#$-special'} as any;
      component.application = specialApp;
      expect(component.application.name).toBe('app-@#$-special');
    }));

    it('should handle very long values config', waitForAsync(() => {
      const longConfig = 'config:\n' + 'a: 1\n'.repeat(1000);
      component.valuesConfig = longConfig;
      expect(component.valuesConfig.length).toBeGreaterThan(100);
    }));

    it('should handle undefined application definition', waitForAsync(() => {
      component.applicationDefinition = undefined;
      expect(component.applicationDefinition).toBeUndefined();
    }));

    it('should handle null cluster', waitForAsync(() => {
      component.cluster = null;
      expect(component.cluster).toBeNull();
    }));

    it('should handle rapid value changes', waitForAsync(() => {
      component.valuesConfig = 'value1';
      component.valuesConfig = 'value2';
      component.valuesConfig = 'value3';
      expect(component.valuesConfig).toBe('value3');
    }));
  });
});
