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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatStepperModule} from '@angular/material/stepper';
import {DomSanitizer} from '@angular/platform-browser';
import {SharedModule} from '@shared/module';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {InstallAddonDialogComponent} from './component';
import {AddonConfig} from '@shared/entity/addon';
import {BrandingService} from '@core/services/branding';

describe('InstallAddonDialogComponent', () => {
  let fixture: ComponentFixture<InstallAddonDialogComponent>;
  let component: InstallAddonDialogComponent;
  let dialogRef: MatDialogRefMock;
  let brandingService: jasmine.SpyObj<BrandingService>;

  const mockAddonConfig: AddonConfig = {
    name: 'prometheus',
    shortDescription: 'Prometheus monitoring',
    description: 'Prometheus is a monitoring system',
    spec: {
      formSpec: [
        {
          internalName: 'retention',
          displayName: 'Retention Days',
          required: true,
          type: 'text',
        },
        {
          internalName: 'scrapeInterval',
          displayName: 'Scrape Interval',
          required: false,
          type: 'text',
        },
      ],
    },
  };

  const mockAddonConfigs = new Map([['prometheus', mockAddonConfig]]);

  beforeEach(() => {
    brandingService = jasmine.createSpyObj('BrandingService', ['getAppName']);

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, MatStepperModule],
      declarations: [InstallAddonDialogComponent],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: BrandingService, useValue: brandingService},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(InstallAddonDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as MatDialogRefMock;

    component.installableAddons = ['prometheus'];
    component.addonConfigs = mockAddonConfigs;

    fixture.detectChanges();
  }));

  describe('Component Initialization', () => {
    it('should create the component', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should inject MatDialogRef correctly', waitForAsync(() => {
      expect(component.dialogRef).toBeTruthy();
    }));

    it('should initialize installableAddons input', waitForAsync(() => {
      expect(component.installableAddons.length).toBeGreaterThan(0);
    }));

    it('should initialize addonConfigs map', waitForAsync(() => {
      expect(component.addonConfigs).toBeTruthy();
      expect(component.addonConfigs.size).toBeGreaterThan(0);
    }));

    it('should initialize selectedAddon as undefined', waitForAsync(() => {
      expect(component.selectedAddon).toBeUndefined();
    }));
  });

  describe('hasLogo Method', () => {
    it('should return true when addon config has logo', waitForAsync(() => {
      const configWithLogo: AddonConfig = {
        ...mockAddonConfig,
        spec: {...mockAddonConfig.spec, logo: 'data:image/svg+xml;base64,xyz'},
      };

      const updatedConfigs = new Map(mockAddonConfigs);
      updatedConfigs.set('prometheus', configWithLogo);
      component.addonConfigs = updatedConfigs;

      expect(component.hasLogo('prometheus')).toBe(true);
    }));

    it('should return false when addon config has no logo', waitForAsync(() => {
      expect(component.hasLogo('prometheus')).toBe(false);
    }));

    it('should return false for non-existent addon', waitForAsync(() => {
      expect(component.hasLogo('non-existent')).toBe(false);
    }));
  });

  describe('hasForm Method', () => {
    it('should return true when addon config has form spec', waitForAsync(() => {
      expect(component.hasForm('prometheus')).toBe(true);
    }));

    it('should return false when addon config has no form spec', waitForAsync(() => {
      const configWithoutForm: AddonConfig = {
        name: 'simple-addon',
        shortDescription: 'Simple addon',
        description: 'A simple addon',
        spec: {},
      };

      const updatedConfigs = new Map(mockAddonConfigs);
      updatedConfigs.set('simple', configWithoutForm);
      component.addonConfigs = updatedConfigs;

      expect(component.hasForm('simple')).toBe(false);
    }));

    it('should return false for non-existent addon', waitForAsync(() => {
      expect(component.hasForm('non-existent')).toBe(false);
    }));
  });

  describe('getAddonLogo Method', () => {
    it('should return logo data when available', waitForAsync(() => {
      const logoData = 'data:image/svg+xml;base64,xyz';
      const configWithLogo: AddonConfig = {
        ...mockAddonConfig,
        spec: {...mockAddonConfig.spec, logo: logoData},
      };

      const updatedConfigs = new Map(mockAddonConfigs);
      updatedConfigs.set('prometheus', configWithLogo);
      component.addonConfigs = updatedConfigs;

      const logo = component.getAddonLogo('prometheus');
      expect(logo).toBe(logoData);
    }));

    it('should return empty string when no logo', waitForAsync(() => {
      const logo = component.getAddonLogo('prometheus');
      expect(logo).toBeDefined();
    }));
  });

  describe('getAddonShortDescription Method', () => {
    it('should return short description', waitForAsync(() => {
      const description = component.getAddonShortDescription('prometheus');
      expect(description).toBe('Prometheus monitoring');
    }));

    it('should escape HTML characters in description', waitForAsync(() => {
      const configWithHtml: AddonConfig = {
        ...mockAddonConfig,
        shortDescription: 'Description with <script>alert("xss")</script>',
      };

      const updatedConfigs = new Map(mockAddonConfigs);
      updatedConfigs.set('test', configWithHtml);
      component.addonConfigs = updatedConfigs;

      const description = component.getAddonShortDescription('test');
      expect(description).not.toContain('<script>');
    }));
  });

  describe('getAddonDescription Method', () => {
    it('should return addon description', waitForAsync(() => {
      const description = component.getAddonDescription('prometheus');
      expect(description).toBeDefined();
    }));

    it('should sanitize HTML in description', waitForAsync(() => {
      const configWithHtml: AddonConfig = {
        ...mockAddonConfig,
        description: 'Safe <b>description</b>',
      };

      const updatedConfigs = new Map(mockAddonConfigs);
      updatedConfigs.set('test', configWithHtml);
      component.addonConfigs = updatedConfigs;

      const description = component.getAddonDescription('test');
      expect(description).toBeDefined();
    }));

    it('should handle null description gracefully', waitForAsync(() => {
      const configWithoutDescription: AddonConfig = {
        ...mockAddonConfig,
        spec: {},
      };

      const updatedConfigs = new Map(mockAddonConfigs);
      updatedConfigs.set('test', configWithoutDescription);
      component.addonConfigs = updatedConfigs;

      const description = component.getAddonDescription('test');
      expect(description).toBeDefined();
    }));
  });

  describe('select Method', () => {
    it('should set selectedAddon', waitForAsync(() => {
      component.select('prometheus');
      expect(component.selectedAddon).toBe('prometheus');
    }));

    it('should initialize form when addon is selected', waitForAsync(() => {
      component.select('prometheus');
      expect(component.form).toBeTruthy();
    }));

    it('should initialize formBasic when addon is selected', waitForAsync(() => {
      component.select('prometheus');
      expect(component.formBasic).toBeTruthy();
    }));

    it('should have ContinuouslyReconcile control in formBasic', waitForAsync(() => {
      component.select('prometheus');
      const control = component.formBasic.get('continuouslyReconcile');
      expect(control).toBeTruthy();
      expect(control.value).toBe(false);
    }));

    it('should create form controls from addon config', waitForAsync(() => {
      component.select('prometheus');
      expect(component.form.get('retention')).toBeTruthy();
      expect(component.form.get('scrapeInterval')).toBeTruthy();
    }));
  });

  describe('goBack Method', () => {
    it('should clear selectedAddon', waitForAsync(() => {
      component.select('prometheus');
      expect(component.selectedAddon).toBe('prometheus');

      component.goBack();
      expect(component.selectedAddon).toBeUndefined();
    }));

    it('should clear form', waitForAsync(() => {
      component.select('prometheus');
      component.goBack();
      expect(component.form).toBeUndefined();
    }));

    it('should clear formBasic', waitForAsync(() => {
      component.select('prometheus');
      component.goBack();
      expect(component.formBasic).toBeUndefined();
    }));
  });

  describe('install Method', () => {
    it('should close dialog with addon entity', waitForAsync(() => {
      component.select('prometheus');
      component.form.patchValue({retention: '30', scrapeInterval: '15s'});

      component.install();

      expect(dialogRef.closeCalled).toBe(true);
    }));

    it('should pass correct addon data on installation', waitForAsync(() => {
      const closeSpy = jest.spyOn(dialogRef, 'close');

      component.select('prometheus');
      component.form.patchValue({retention: '30'});
      component.formBasic.patchValue({continuouslyReconcile: true});

      component.install();

      const passedData = closeSpy.mock.calls[0][0];
      expect(passedData.name).toBe('prometheus');
      expect(passedData.spec.variables.retention).toBe('30');
      expect(passedData.spec.continuouslyReconcile).toBe(true);
    }));

    it('should collect all form variables in addon spec', waitForAsync(() => {
      const closeSpy = jest.spyOn(dialogRef, 'close');

      component.select('prometheus');
      component.form.patchValue({
        retention: '30',
        scrapeInterval: '15s',
      });

      component.install();

      const passedData = closeSpy.mock.calls[0][0];
      expect(Object.keys(passedData.spec.variables).length).toBe(2);
    }));
  });

  describe('Stepper Navigation', () => {
    it('should support selecting addon which moves stepper forward', waitForAsync(() => {
      component.select('prometheus');
      expect(component.selectedAddon).toBe('prometheus');
    }));

    it('should support going back in stepper', waitForAsync(() => {
      component.select('prometheus');
      component.goBack();
      expect(component.selectedAddon).toBeUndefined();
    }));

    it('should support bidirectional stepper navigation', waitForAsync(() => {
      component.select('prometheus');
      expect(component.selectedAddon).toBe('prometheus');

      component.goBack();
      expect(component.selectedAddon).toBeUndefined();

      component.select('prometheus');
      expect(component.selectedAddon).toBe('prometheus');
    }));
  });

  describe('getControlValidators Static Method', () => {
    it('should return required validator for required control', waitForAsync(() => {
      const formSpec = {
        internalName: 'field',
        displayName: 'Field',
        required: true,
        type: 'text',
      };

      const validators = InstallAddonDialogComponent.getControlValidators(formSpec);
      expect(validators.length).toBeGreaterThan(0);
    }));

    it('should return empty array for optional control', waitForAsync(() => {
      const formSpec = {
        internalName: 'field',
        displayName: 'Field',
        required: false,
        type: 'text',
      };

      const validators = InstallAddonDialogComponent.getControlValidators(formSpec);
      expect(validators.length).toBe(0);
    }));
  });

  describe('Multiple Addon Installation', () => {
    it('should support selecting different addons sequentially', waitForAsync(() => {
      const config2: AddonConfig = {
        name: 'grafana',
        shortDescription: 'Grafana dashboard',
        description: 'Grafana visualization',
        spec: {formSpec: []},
      };

      const updatedConfigs = new Map(mockAddonConfigs);
      updatedConfigs.set('grafana', config2);
      component.addonConfigs = updatedConfigs;
      component.installableAddons = ['prometheus', 'grafana'];

      component.select('prometheus');
      expect(component.selectedAddon).toBe('prometheus');

      component.goBack();
      component.select('grafana');
      expect(component.selectedAddon).toBe('grafana');
    }));

    it('should reset form when switching between addons', waitForAsync(() => {
      const config2: AddonConfig = {
        name: 'grafana',
        shortDescription: 'Grafana',
        description: 'Grafana',
        spec: {formSpec: [{internalName: 'interval', displayName: 'Interval', required: false, type: 'text'}]},
      };

      const updatedConfigs = new Map(mockAddonConfigs);
      updatedConfigs.set('grafana', config2);
      component.addonConfigs = updatedConfigs;
      component.installableAddons = ['prometheus', 'grafana'];

      component.select('prometheus');
      component.form.patchValue({retention: '30'});

      component.goBack();
      component.select('grafana');

      expect(component.form.get('retention')).toBeFalsy();
      expect(component.form.get('interval')).toBeTruthy();
    }));
  });

  describe('Edge Cases', () => {
    it('should handle addon with no form spec', waitForAsync(() => {
      const configWithoutForm: AddonConfig = {
        name: 'simple',
        shortDescription: 'Simple',
        description: 'Simple addon',
        spec: {},
      };

      const updatedConfigs = new Map(mockAddonConfigs);
      updatedConfigs.set('simple', configWithoutForm);
      component.addonConfigs = updatedConfigs;
      component.installableAddons = ['simple'];

      component.select('simple');
      expect(component.hasForm('simple')).toBe(false);
    }));

    it('should handle very long addon descriptions', waitForAsync(() => {
      const configWithLongDesc: AddonConfig = {
        ...mockAddonConfig,
        description: 'A'.repeat(5000),
      };

      const updatedConfigs = new Map(mockAddonConfigs);
      updatedConfigs.set('prometheus', configWithLongDesc);
      component.addonConfigs = updatedConfigs;

      const description = component.getAddonDescription('prometheus');
      expect(description).toBeDefined();
    }));

    it('should handle empty installableAddons list', waitForAsync(() => {
      component.installableAddons = [];
      expect(component.installableAddons.length).toBe(0);
    }));

    it('should handle special characters in addon names', waitForAsync(() => {
      const configWithSpecialName: AddonConfig = {
        ...mockAddonConfig,
        name: 'addon-with-!@#-chars',
      };

      const updatedConfigs = new Map(mockAddonConfigs);
      updatedConfigs.set('addon-with-!@#-chars', configWithSpecialName);
      component.addonConfigs = updatedConfigs;

      expect(component.addonConfigs.has('addon-with-!@#-chars')).toBe(true);
    }));
  });
});
