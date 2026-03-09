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
import {SharedModule} from '@shared/module';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {EditAddonDialogComponent} from './component';
import {Addon, AddonConfig} from '@shared/entity/addon';
import {Cluster} from '@shared/entity/cluster';

describe('EditAddonDialogComponent', () => {
  let fixture: ComponentFixture<EditAddonDialogComponent>;
  let component: EditAddonDialogComponent;
  let dialogRef: MatDialogRefMock;

  const mockAddon: Addon = {
    name: 'test-addon',
    id: 'addon-123',
    spec: {
      variables: {setting1: 'value1'},
      continuouslyReconcile: true,
    },
  };

  const mockAddonConfig: AddonConfig = {
    name: 'test-addon',
    shortDescription: 'Test addon',
    description: 'A test addon',
    spec: {
      formSpec: [
        {
          internalName: 'setting1',
          displayName: 'Setting 1',
          required: true,
          type: 'text',
        },
      ],
    },
  };

  const mockCluster: Cluster = {
    id: 'cluster-123',
    name: 'test-cluster',
  } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [EditAddonDialogComponent],
      providers: [{provide: MatDialogRef, useClass: MatDialogRefMock}],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(EditAddonDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as MatDialogRefMock;

    component.addon = mockAddon;
    component.addonConfig = mockAddonConfig;
    component.cluster = mockCluster;

    fixture.detectChanges();
  }));

  describe('Component Initialization', () => {
    it('should create the component', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should inject MatDialogRef correctly', waitForAsync(() => {
      expect(component.dialogRef).toBeTruthy();
    }));

    it('should accept addon input', waitForAsync(() => {
      expect(component.addon).toBe(mockAddon);
    }));

    it('should accept cluster input', waitForAsync(() => {
      expect(component.cluster).toBe(mockCluster);
    }));

    it('should accept addonConfig input', waitForAsync(() => {
      expect(component.addonConfig).toBe(mockAddonConfig);
    }));

    it('should initialize Controls enum', waitForAsync(() => {
      expect(component.Controls).toBeTruthy();
    }));
  });

  describe('Form Initialization', () => {
    it('should initialize form group on ngOnInit', waitForAsync(() => {
      expect(component.form).toBeTruthy();
    }));

    it('should initialize formBasic group on ngOnInit', waitForAsync(() => {
      expect(component.formBasic).toBeTruthy();
    }));

    it('should have ContinuouslyReconcile control in formBasic', waitForAsync(() => {
      const control = component.formBasic.get('continuouslyReconcile');
      expect(control).toBeTruthy();
    }));

    it('should set ContinuouslyReconcile value from addon spec', waitForAsync(() => {
      const control = component.formBasic.get('continuouslyReconcile');
      expect(control.value).toBe(true);
    }));
  });

  describe('hasForm Method', () => {
    it('should return true when addon config has form spec', waitForAsync(() => {
      expect(component.hasForm()).toBe(true);
    }));

    it('should return false when addon config has no form spec', waitForAsync(() => {
      const configWithoutForm: AddonConfig = {
        name: 'simple-addon',
        shortDescription: 'Simple addon',
        description: 'A simple addon',
        spec: {},
      };

      component.addonConfig = configWithoutForm;
      expect(component.hasForm()).toBe(false);
    }));
  });

  describe('hasLogo Method', () => {
    it('should return true when addon config has logo', waitForAsync(() => {
      const configWithLogo: AddonConfig = {
        ...mockAddonConfig,
        spec: {...mockAddonConfig.spec, logo: 'data:image/svg+xml;base64,xyz'},
      };

      component.addonConfig = configWithLogo;
      expect(component.hasLogo()).toBe(true);
    }));

    it('should return false when addon config has no logo', waitForAsync(() => {
      expect(component.hasLogo()).toBe(false);
    }));
  });

  describe('getAddonLogo Method', () => {
    it('should return logo data when available', waitForAsync(() => {
      const logoData = 'data:image/svg+xml;base64,xyz';
      const configWithLogo: AddonConfig = {
        ...mockAddonConfig,
        spec: {...mockAddonConfig.spec, logo: logoData},
      };

      component.addonConfig = configWithLogo;
      const logo = component.getAddonLogo();
      expect(logo).toBe(logoData);
    }));
  });

  describe('Form Controls from AddonConfig', () => {
    it('should create form controls from addon config formSpec', waitForAsync(() => {
      const control = component.form.get('setting1');
      expect(control).toBeTruthy();
    }));

    it('should apply required validators from formSpec', waitForAsync(() => {
      const control = component.form.get('setting1');
      control.setValue('');
      expect(control.invalid).toBe(true);
    }));

    it('should set initial values from addon variables', waitForAsync(() => {
      const control = component.form.get('setting1');
      expect(control.value).toBe('value1');
    }));

    it('should handle multiple form spec entries', waitForAsync(() => {
      const configWithMultipleForms: AddonConfig = {
        ...mockAddonConfig,
        spec: {
          formSpec: [
            {internalName: 'field1', displayName: 'Field 1', required: true, type: 'text'},
            {internalName: 'field2', displayName: 'Field 2', required: false, type: 'text'},
            {internalName: 'field3', displayName: 'Field 3', required: true, type: 'text'},
          ],
        },
      };

      component.addonConfig = configWithMultipleForms;
      component.addon = {
        name: 'addon',
        spec: {variables: {field1: 'val1', field2: 'val2', field3: 'val3'}, continuouslyReconcile: false},
      };

      component.ngOnInit();

      expect(component.form.get('field1')).toBeTruthy();
      expect(component.form.get('field2')).toBeTruthy();
      expect(component.form.get('field3')).toBeTruthy();
    }));
  });

  describe('getFormState Static Method', () => {
    it('should extract form state from addon', waitForAsync(() => {
      const formSpec = mockAddonConfig.spec.formSpec[0];
      const state = EditAddonDialogComponent.getFormState(mockAddon, formSpec);
      expect(state).toBe('value1');
    }));

    it('should return undefined when variable not found', waitForAsync(() => {
      const formSpec = {
        internalName: 'nonexistent',
        displayName: 'Nonexistent',
        required: false,
        type: 'text',
      };

      const state = EditAddonDialogComponent.getFormState(mockAddon, formSpec);
      expect(state).toBeUndefined();
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

      const validators = EditAddonDialogComponent.getControlValidators(formSpec);
      expect(validators.length).toBeGreaterThan(0);
    }));

    it('should return empty array for optional control', waitForAsync(() => {
      const formSpec = {
        internalName: 'field',
        displayName: 'Field',
        required: false,
        type: 'text',
      };

      const validators = EditAddonDialogComponent.getControlValidators(formSpec);
      expect(validators.length).toBe(0);
    }));
  });

  describe('edit Method', () => {
    it('should close dialog with addon patch data', waitForAsync(() => {
      component.form.patchValue({setting1: 'new-value'});
      component.formBasic.patchValue({continuouslyReconcile: false});

      component.edit();

      expect(dialogRef.closeCalled).toBe(true);
    }));

    it('should return addon with updated variables', waitForAsync(() => {
      component.form.patchValue({setting1: 'new-value'});
      component.formBasic.patchValue({continuouslyReconcile: false});

      const closeSpy = jest.spyOn(dialogRef, 'close');
      component.edit();

      const passedData = closeSpy.mock.calls[0][0];
      expect(passedData.name).toBe('test-addon');
      expect(passedData.spec.variables.setting1).toBe('new-value');
      expect(passedData.spec.continuouslyReconcile).toBe(false);
    }));

    it('should preserve addon name when editing', waitForAsync(() => {
      const closeSpy = jest.spyOn(dialogRef, 'close');
      component.edit();

      const passedData = closeSpy.mock.calls[0][0];
      expect(passedData.name).toBe(mockAddon.name);
    }));
  });

  describe('Dialog Closure', () => {
    it('should allow dialog closure through dialogRef', waitForAsync(() => {
      component.edit();
      expect(dialogRef.closeCalled).toBe(true);
    }));
  });

  describe('Edge Cases', () => {
    it('should handle addon with no variables', waitForAsync(() => {
      const addonWithoutVariables: Addon = {
        name: 'simple-addon',
        spec: {continuouslyReconcile: true},
      };

      component.addon = addonWithoutVariables;
      component.ngOnInit();

      expect(component.form).toBeTruthy();
    }));

    it('should handle addon config with empty formSpec', waitForAsync(() => {
      const configWithEmptySpec: AddonConfig = {
        ...mockAddonConfig,
        spec: {formSpec: []},
      };

      component.addonConfig = configWithEmptySpec;
      component.ngOnInit();

      expect(component.hasForm()).toBe(false);
    }));

    it('should handle null logo gracefully', waitForAsync(() => {
      component.addonConfig.spec.logo = null;
      expect(component.hasLogo()).toBe(false);
    }));

    it('should handle very long variable values', waitForAsync(() => {
      const longValue = 'a'.repeat(1000);
      component.form.patchValue({setting1: longValue});
      expect(component.form.get('setting1').value).toBe(longValue);
    }));

    it('should handle special characters in variable values', waitForAsync(() => {
      const specialValue = 'value-with-!@#$%^&*()_+={}[]|\\:;<>?,./';
      component.form.patchValue({setting1: specialValue});
      expect(component.form.get('setting1').value).toBe(specialValue);
    }));
  });

  describe('Form State Management', () => {
    it('should track form dirty state', waitForAsync(() => {
      expect(component.form.pristine).toBe(true);
      component.form.patchValue({setting1: 'new-value'});
      expect(component.form.dirty).toBe(true);
    }));

    it('should allow form reset', waitForAsync(() => {
      component.form.patchValue({setting1: 'new-value'});
      component.form.reset();
      expect(component.form.pristine).toBe(true);
    }));

    it('should maintain formBasic state independently', waitForAsync(() => {
      component.form.patchValue({setting1: 'new-value'});
      component.formBasic.patchValue({continuouslyReconcile: false});

      expect(component.form.dirty).toBe(true);
      expect(component.formBasic.dirty).toBe(true);
    }));
  });

  describe('Multiple Edit Sessions', () => {
    it('should support editing different addons sequentially', waitForAsync(() => {
      const addon1 = {...mockAddon, name: 'addon-1'};
      const addon2 = {...mockAddon, name: 'addon-2'};

      component.addon = addon1;
      component.ngOnInit();
      expect(component.addon.name).toBe('addon-1');

      component.addon = addon2;
      component.ngOnInit();
      expect(component.addon.name).toBe('addon-2');
    }));

    it('should reset form controls when addon changes', waitForAsync(() => {
      const addon1 = {
        ...mockAddon,
        spec: {variables: {setting1: 'value1'}, continuouslyReconcile: true},
      };

      const addon2 = {
        ...mockAddon,
        name: 'addon-2',
        spec: {variables: {setting1: 'value2'}, continuouslyReconcile: false},
      };

      component.addon = addon1;
      component.ngOnInit();
      expect(component.form.get('setting1').value).toBe('value1');

      component.addon = addon2;
      component.ngOnInit();
      expect(component.form.get('setting1').value).toBe('value2');
    }));
  });
});
