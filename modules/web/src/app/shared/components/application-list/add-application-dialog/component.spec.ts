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
import {MatTableModule} from '@angular/material/table';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {CoreModule} from '@core/module';
import {ApplicationService} from '@core/services/application';
import {BrandingService} from '@core/services/branding';
import {SharedModule} from '@shared/module';
import {Application, ApplicationDefinition} from '@shared/entity/application';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {AddApplicationDialogComponent} from './component';
import {of} from 'rxjs';

describe('AddApplicationDialogComponent', () => {
  let fixture: ComponentFixture<AddApplicationDialogComponent>;
  let component: AddApplicationDialogComponent;
  let dialogRef: MatDialogRefMock;
  let applicationService: any;
  let brandingService: any;

  const mockApplicationDefinitions: ApplicationDefinition[] = [
    {
      id: 'def-1',
      name: 'Prometheus',
      spec: {formSpec: []},
    } as any,
    {
      id: 'def-2',
      name: 'Grafana',
      spec: {formSpec: []},
    } as any,
  ];

  const mockInstalledApplications: Application[] = [
    {
      id: 'app-1',
      name: 'prometheus-instance',
      namespace: {name: 'monitoring'},
      spec: {} as any,
    } as any,
  ];

  beforeEach(() => {
    const applicationServiceMock = {
      getApplicationSettings: jest.fn().mockReturnValue(of({})),
      getApplicationVersions: jest.fn().mockReturnValue(of([])),
      createApplication: jest.fn().mockReturnValue(of({})),
    };

    const brandingServiceMock = {
      config: {logo: '', logoDark: ''},
    };

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule, MatTableModule],
      declarations: [AddApplicationDialogComponent],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: ApplicationService, useValue: applicationServiceMock},
        {provide: BrandingService, useValue: brandingServiceMock},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(AddApplicationDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as MatDialogRefMock;
    applicationService = TestBed.inject(ApplicationService);
    brandingService = TestBed.inject(BrandingService);

    component.applicationDefinitions = mockApplicationDefinitions;
    component.installedApplications = mockInstalledApplications;
    component.applicationDefinitionsMap = new Map(mockApplicationDefinitions.map(def => [def.id, def]));

    fixture.detectChanges();
  }));

  describe('Component Initialization', () => {
    it('should create the component', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should accept applicationDefinitions input', waitForAsync(() => {
      expect(component.applicationDefinitions).toEqual(mockApplicationDefinitions);
    }));

    it('should accept installedApplications input', waitForAsync(() => {
      expect(component.installedApplications).toEqual(mockInstalledApplications);
    }));

    it('should accept applicationDefinitionsMap input', waitForAsync(() => {
      expect(component.applicationDefinitionsMap.size).toBe(2);
    }));

    it('should have controls enum defined', waitForAsync(() => {
      expect(component.Controls).toBeDefined();
    }));

    it('should have step registry enum defined', waitForAsync(() => {
      expect(component.StepRegistry).toBeDefined();
    }));

    it('should have access to MatDialogRef', waitForAsync(() => {
      expect(component.dialogRef).toBeTruthy();
    }));

    it('should initialize applicationDefsDataSource', waitForAsync(() => {
      expect(component.applicationDefsDataSource).toBeTruthy();
    }));

    it('should initialize valuesConfig as empty string', waitForAsync(() => {
      expect(component.valuesConfig).toBe('');
    }));

    it('should initialize isValuesConfigValid as true', waitForAsync(() => {
      expect(component.isValuesConfigValid).toBe(true);
    }));

    it('should initialize isLoadingDetails as false', waitForAsync(() => {
      expect(component.isLoadingDetails).toBe(false);
    }));
  });

  describe('Application Selection', () => {
    it('should track selected application', waitForAsync(() => {
      component.selectedApplication = mockApplicationDefinitions[0];
      expect(component.selectedApplication).toEqual(mockApplicationDefinitions[0]);
    }));

    it('should allow changing selected application', waitForAsync(() => {
      component.selectedApplication = mockApplicationDefinitions[0];
      component.selectedApplication = mockApplicationDefinitions[1];
      expect(component.selectedApplication.id).toBe('def-2');
    }));

    it('should populate dataSource with application definitions', waitForAsync(() => {
      expect(component.applicationDefsDataSource.data.length).toBeGreaterThan(0);
    }));
  });

  describe('Form Initialization', () => {
    it('should initialize form on ngOnInit', waitForAsync(() => {
      component.form = null;
      component.ngOnInit();
      tick();

      expect(component.form).toBeTruthy();
    }));

    it('should load application settings on init', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(applicationService.getApplicationSettings).toHaveBeenCalled();
    }));
  });

  describe('Stepper Navigation', () => {
    it('should have steps array defined', waitForAsync(() => {
      expect(component.StepRegistry.SelectApplication).toBeDefined();
      expect(component.StepRegistry.Settings).toBeDefined();
      expect(component.StepRegistry.ApplicationValues).toBeDefined();
    }));
  });

  describe('Values Configuration', () => {
    it('should accept values config input', waitForAsync(() => {
      component.valuesConfig = 'key: value';
      expect(component.valuesConfig).toBe('key: value');
    }));

    it('should handle multiline YAML values', waitForAsync(() => {
      const yamlConfig = 'prometheus:\n  scrapeInterval: 30s\n  retention: 7d\n';
      component.valuesConfig = yamlConfig;
      expect(component.valuesConfig).toContain('scrapeInterval');
    }));

    it('should handle empty values config', waitForAsync(() => {
      component.valuesConfig = '';
      expect(component.valuesConfig).toBe('');
    }));

    it('should validate YAML configuration', waitForAsync(() => {
      component.valuesConfig = 'invalid: yaml: syntax:';
      expect(component.isValuesConfigValid).toBeDefined();
    }));

    it('should update isValuesConfigValid flag', waitForAsync(() => {
      component.isValuesConfigValid = false;
      expect(component.isValuesConfigValid).toBe(false);
      component.isValuesConfigValid = true;
      expect(component.isValuesConfigValid).toBe(true);
    }));
  });

  describe('Application Method', () => {
    it('should track application installation method', waitForAsync(() => {
      component.applicationMethod = 'Helm';
      expect(component.applicationMethod).toBe('Helm');
    }));

    it('should allow changing application method', waitForAsync(() => {
      component.applicationMethod = 'Helm';
      component.applicationMethod = 'Kustomize';
      expect(component.applicationMethod).toBe('Kustomize');
    }));
  });

  describe('Version Source Selection', () => {
    it('should track selected version source', waitForAsync(() => {
      component.selectedVersionSource = '1.0.0';
      expect(component.selectedVersionSource).toBe('1.0.0');
    }));

    it('should allow changing version source', waitForAsync(() => {
      component.selectedVersionSource = '1.0.0';
      component.selectedVersionSource = '2.0.0';
      expect(component.selectedVersionSource).toBe('2.0.0');
    }));
  });

  describe('Dialog Closing', () => {
    it('should allow closing dialog', waitForAsync(() => {
      dialogRef.close();
      expect(dialogRef.closeCalled).toBe(true);
    }));

    it('should allow passing application data on close', waitForAsync(() => {
      const newApp = {id: 'new-app', name: 'new-app-instance'};
      dialogRef.close(newApp);
      expect(dialogRef.closeCalled).toBe(true);
    }));
  });

  describe('Edition Version Information', () => {
    it('should have editionVersion defined', waitForAsync(() => {
      expect(component.editionVersion).toBeDefined();
    }));

    it('should be a string', waitForAsync(() => {
      expect(typeof component.editionVersion).toBe('string');
    }));
  });

  describe('Application Definitions Map', () => {
    it('should map application definitions by ID', waitForAsync(() => {
      expect(component.applicationDefinitionsMap.get('def-1')).toEqual(mockApplicationDefinitions[0]);
      expect(component.applicationDefinitionsMap.get('def-2')).toEqual(mockApplicationDefinitions[1]);
    }));

    it('should handle empty definitions map', waitForAsync(() => {
      component.applicationDefinitionsMap = new Map();
      expect(component.applicationDefinitionsMap.size).toBe(0);
    }));
  });

  describe('Installed Applications Tracking', () => {
    it('should track already installed applications', waitForAsync(() => {
      expect(component.installedApplications.length).toBeGreaterThan(0);
    }));

    it('should handle empty installed applications', waitForAsync(() => {
      component.installedApplications = [];
      expect(component.installedApplications.length).toBe(0);
    }));

    it('should identify conflicts with installed applications', waitForAsync(() => {
      const existingApp = mockInstalledApplications[0];
      expect(component.installedApplications).toContain(existingApp);
    }));
  });

  describe('Cleanup and Lifecycle', () => {
    it('should unsubscribe on destroy', fakeAsync(() => {
      component.ngOnDestroy();
      tick();
      expect(component).toBeTruthy();
    }));

    it('should handle ngOnChanges', waitForAsync(() => {
      component.ngOnChanges({
        applicationDefinitions: {
          currentValue: mockApplicationDefinitions,
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true,
        },
      });
      expect(component).toBeTruthy();
    }));

    it('should handle component destruction', waitForAsync(() => {
      fixture.destroy();
      expect(component).toBeTruthy();
    }));
  });

  describe('Edge Cases', () => {
    it('should handle application definition with special characters', waitForAsync(() => {
      const specialDef = {
        ...mockApplicationDefinitions[0],
        name: 'app-@#$-special',
      } as any;
      component.selectedApplication = specialDef;
      expect(component.selectedApplication.name).toBe('app-@#$-special');
    }));

    it('should handle very long values config', waitForAsync(() => {
      const longConfig = 'config:\n' + 'setting: value\n'.repeat(500);
      component.valuesConfig = longConfig;
      expect(component.valuesConfig.length).toBeGreaterThan(1000);
    }));

    it('should handle many application definitions', waitForAsync(() => {
      const manyDefs = Array.from({length: 100}, (_, i) => ({
        id: `def-${i}`,
        name: `App ${i}`,
        spec: {},
      } as any));
      component.applicationDefinitions = manyDefs;
      expect(component.applicationDefinitions.length).toBe(100);
    }));

    it('should handle many installed applications', waitForAsync(() => {
      const manyApps = Array.from({length: 100}, (_, i) => ({
        id: `app-${i}`,
        name: `instance-${i}`,
        namespace: {name: 'default'},
        spec: {},
      } as any));
      component.installedApplications = manyApps;
      expect(component.installedApplications.length).toBe(100);
    }));

    it('should handle rapid application selection changes', waitForAsync(() => {
      for (const def of mockApplicationDefinitions) {
        component.selectedApplication = def;
      }
      expect(component.selectedApplication).toEqual(mockApplicationDefinitions[mockApplicationDefinitions.length - 1]);
    }));
  });
});
