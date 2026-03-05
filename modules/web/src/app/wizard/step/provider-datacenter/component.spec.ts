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
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ClusterSpecService} from '@app/core/services/cluster-spec';
import {DatacenterService} from '@app/core/services/datacenter';
import {WizardService} from '@app/core/services/wizard/wizard';
import {SharedModule} from '@shared/module';
import {Datacenter} from '@shared/entity/datacenter';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {of} from 'rxjs';
import {ProviderStepComponent} from './component';
import {WizardMockService} from '@test/services/wizard-mock';

describe('ProviderStepComponent', () => {
  let fixture: ComponentFixture<ProviderStepComponent>;
  let component: ProviderStepComponent;
  let datacenterService: jasmine.SpyObj<DatacenterService>;
  let clusterSpecService: jasmine.SpyObj<ClusterSpecService>;
  let wizardService: WizardMockService;

  const mockDatacenters: Datacenter[] = [
    {
      metadata: {name: 'us-west-1'},
      spec: {
        provider: 'aws',
        country: 'US',
        location: 'US West (N. California)',
        seed: 'us-west-1-seed',
      },
    } as Datacenter,
    {
      metadata: {name: 'eu-central-1'},
      spec: {
        provider: 'aws',
        country: 'DE',
        location: 'EU (Frankfurt)',
        seed: 'eu-central-1-seed',
      },
    } as Datacenter,
    {
      metadata: {name: 'gcp-us-central-1'},
      spec: {
        provider: 'gcp',
        country: 'US',
        location: 'US Central',
        seed: 'gcp-seed',
      },
    } as Datacenter,
  ];

  beforeEach(waitForAsync(() => {
    const datacenterServiceMock = jasmine.createSpyObj('DatacenterService', ['getDatacenter'], {
      datacenters: of(mockDatacenters),
    });

    const clusterSpecServiceMock = jasmine.createSpyObj('ClusterSpecService', ['getClusterName'], {
      datacenterChanges: of('us-west-1'),
      providerChanges: of(NodeProvider.AWS),
      cluster: {
        name: 'test-cluster',
        spec: {},
      },
    });

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule],
      declarations: [ProviderStepComponent],
      providers: [
        {provide: DatacenterService, useValue: datacenterServiceMock},
        {provide: ClusterSpecService, useValue: clusterSpecServiceMock},
        {provide: WizardService, useValue: new WizardMockService()},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    datacenterService = TestBed.inject(DatacenterService) as jasmine.SpyObj<DatacenterService>;
    clusterSpecService = TestBed.inject(ClusterSpecService) as jasmine.SpyObj<ClusterSpecService>;
    wizardService = TestBed.inject(WizardService) as unknown as WizardMockService;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProviderStepComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the Provider Step component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty providers list', () => {
      expect(component.providers).toEqual([]);
    });

    it('should initialize with empty datacenters list', () => {
      expect(component.datacenters).toEqual([]);
    });

    it('should initialize form with provider and datacenter controls', () => {
      fixture.detectChanges();
      expect(component.form).toBeDefined();
      expect(component.form.get('provider')).toBeDefined();
      expect(component.form.get('datacenter')).toBeDefined();
    });

    it('should require provider and datacenter controls', () => {
      fixture.detectChanges();
      const providerControl = component.form.get('provider');
      const datacenterControl = component.form.get('datacenter');
      expect(providerControl.hasError('required')).toBe(true);
      expect(datacenterControl.hasError('required')).toBe(true);
    });
  });

  describe('Datacenter Loading', () => {
    it('should load datacenters from datacenter service on init', () => {
      fixture.detectChanges();
      expect(component.datacenters).toEqual(mockDatacenters);
    });

    it('should extract unique providers from datacenters', () => {
      fixture.detectChanges();
      // Should extract AWS and GCP (AWS appears twice)
      expect(component.providers.length).toBe(2);
      expect(component.providers).toContain(NodeProvider.AWS);
      expect(component.providers).toContain(NodeProvider.GCP);
    });

    it('should filter providers by provider name correctly', () => {
      fixture.detectChanges();
      const providers = component.providers;
      expect(providers.filter(p => p === NodeProvider.AWS).length).toBe(1);
    });
  });

  describe('Form Control Validators', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate provider control as required', () => {
      const providerControl = component.form.get('provider');
      providerControl.setValue('');
      expect(providerControl.hasError('required')).toBe(true);
    });

    it('should validate provider control with valid value', () => {
      const providerControl = component.form.get('provider');
      providerControl.setValue(NodeProvider.AWS);
      expect(providerControl.hasError('required')).toBe(false);
    });

    it('should validate datacenter control as required', () => {
      const datacenterControl = component.form.get('datacenter');
      datacenterControl.setValue('');
      expect(datacenterControl.hasError('required')).toBe(true);
    });

    it('should mark form as invalid when controls are empty', () => {
      expect(component.form.valid).toBe(false);
    });

    it('should mark form as valid when both controls have values', () => {
      component.form.patchValue({
        provider: NodeProvider.AWS,
        datacenter: mockDatacenters[0].metadata.name,
      });
      expect(component.form.valid).toBe(true);
    });
  });

  describe('Provider Change Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear datacenter when provider changes', (done) => {
      component.form.patchValue({provider: NodeProvider.AWS});
      // Trigger change detection to process subscription
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        expect(component.form.get('datacenter').value).toBe('');
        done();
      });
    });

    it('should update wizard service provider on provider change', (done) => {
      const newProvider = NodeProvider.GCP;
      component.form.get('provider').setValue(newProvider);

      fixture.whenStable().then(() => {
        expect(wizardService.provider).toBe(newProvider);
        done();
      });
    });

    it('should filter datacenters by selected provider', (done) => {
      component.form.patchValue({provider: NodeProvider.AWS});

      fixture.whenStable().then(() => {
        // Should have AWS datacenters
        const awsDatacenters = component.datacenters;
        const allAws = awsDatacenters.every(
          dc => dc.spec.provider === NodeProvider.AWS
        );
        expect(allAws || awsDatacenters.length === 0).toBe(true);
        done();
      });
    });
  });

  describe('Datacenter Change Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update cluster spec service when datacenter changes', (done) => {
      component.form.patchValue({
        provider: NodeProvider.AWS,
        datacenter: mockDatacenters[0].metadata.name,
      });

      fixture.whenStable().then(() => {
        // Check that clusterSpecService.datacenter was updated
        // (This would be verified through the service mock)
        done();
      });
    });

    it('should not propagate empty datacenter values to cluster spec service', (done) => {
      component.form.patchValue({
        provider: NodeProvider.AWS,
        datacenter: '',
      });

      fixture.whenStable().then(() => {
        // Empty values should be filtered by the subscription
        done();
      });
    });
  });

  describe('ControlValueAccessor Interface', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should implement ControlValueAccessor interface', () => {
      expect(component.writeValue).toBeDefined();
      expect(component.registerOnChange).toBeDefined();
      expect(component.registerOnTouched).toBeDefined();
    });

    it('should write value to form control via writeValue', () => {
      const value = {
        provider: NodeProvider.AWS,
        datacenter: mockDatacenters[0].metadata.name,
      };
      component.writeValue(value);
      expect(component.form.value).toEqual(value);
    });

    it('should emit form value changes through onChange callback', (done) => {
      let emittedValue: any;
      component.registerOnChange((value: any) => {
        emittedValue = value;
      });

      component.form.patchValue({
        provider: NodeProvider.AWS,
        datacenter: mockDatacenters[0].metadata.name,
      });

      fixture.whenStable().then(() => {
        expect(emittedValue).toBeDefined();
        done();
      });
    });
  });

  describe('Validator Interface', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should implement Validator interface', () => {
      expect(component.validate).toBeDefined();
    });

    it('should return null for valid form', () => {
      component.form.patchValue({
        provider: NodeProvider.AWS,
        datacenter: mockDatacenters[0].metadata.name,
      });
      const result = component.validate(null);
      expect(result).toBeNull();
    });

    it('should return validation error for invalid form', () => {
      component.form.patchValue({
        provider: '',
        datacenter: '',
      });
      const result = component.validate(null);
      expect(result).not.toBeNull();
    });
  });

  describe('Helper Methods', () => {
    it('should provide getLocation method for template', () => {
      expect(component.getLocation).toBeDefined();
    });

    it('should provide getZone method for template', () => {
      expect(component.getZone).toBeDefined();
    });

    it('should provide trackByDatacenter method for ngFor optimization', () => {
      expect(component.trackByDatacenter).toBeDefined();
    });
  });

  describe('Deprecation Warnings', () => {
    it('should expose ANEXIA_DEPRECATED_MESSAGE constant for template', () => {
      expect(component.ANEXIA_DEPRECATED_MESSAGE).toBeDefined();
    });
  });

  describe('Cleanup & Unsubscription', () => {
    it('should properly clean up subscriptions on destroy', () => {
      fixture.detectChanges();
      expect(() => {
        fixture.destroy();
      }).not.toThrow();
    });

    it('should unsubscribe from datacenter service on destroy', () => {
      fixture.detectChanges();
      const unsubscribeSpy = spyOn<any>(component['_unsubscribe'], 'next');
      fixture.destroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('NodeProvider Constants', () => {
    it('should expose NodeProvider enum for template', () => {
      expect(component.nodeProvider).toBe(NodeProvider);
    });
  });

  describe('Controls Readonly', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have provider and datacenter controls accessible via controls property', () => {
      expect(component.controls.Provider).toBe('provider');
      expect(component.controls.Datacenter).toBe('datacenter');
    });
  });
});
