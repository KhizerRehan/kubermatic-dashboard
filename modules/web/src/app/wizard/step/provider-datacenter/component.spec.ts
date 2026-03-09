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
  let clusterSpecService: any;
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
    const datacenterServiceMock = {
      datacenters: of(mockDatacenters),
      getDatacenter: jest.fn().mockReturnValue(of(mockDatacenters[0])),
    };

    const clusterSpecServiceMock = {
      datacenterChanges: of('us-west-1'),
      providerChanges: of(NodeProvider.AWS),
      provider: NodeProvider.AWS,
      cluster: {
        name: 'test-cluster',
        spec: {},
      },
      datacenter: '',
    };

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

    clusterSpecService = TestBed.inject(ClusterSpecService);
    wizardService = TestBed.inject(WizardService) as unknown as WizardMockService;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProviderStepComponent);
    component = fixture.componentInstance;
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be invalid when both provider and datacenter are empty', () => {
      expect(component.form.valid).toBe(false);
      expect(component.form.get('provider').hasError('required')).toBe(false);
      expect(component.form.get('datacenter').hasError('required')).toBe(true);
    });

    it('should be invalid when only provider is set', () => {
      component.form.get('provider').setValue(NodeProvider.AWS);
      expect(component.form.valid).toBe(false);
    });

    it('should be invalid when only datacenter is set', () => {
      component.form.get('datacenter').setValue(mockDatacenters[0].metadata.name);
      expect(component.form.valid).toBe(false);
    });

    it('should be valid when both provider and datacenter have values', () => {
      component.form.patchValue({
        provider: NodeProvider.AWS,
        datacenter: mockDatacenters[0].metadata.name,
      });
      expect(component.form.valid).toBe(true);
    });
  });

  describe('getLocation', () => {
    it('should extract location before parentheses', () => {
      expect(component.getLocation(mockDatacenters[0])).toBe('US West');
    });

    it('should extract location before parentheses for EU format', () => {
      expect(component.getLocation(mockDatacenters[1])).toBe('EU');
    });

    it('should return full location when no parentheses or dash present', () => {
      expect(component.getLocation(mockDatacenters[2])).toBe('US Central');
    });

    it('should strip Azure prefix from location string', () => {
      const dc = {spec: {location: 'Azure West US'}} as Datacenter;
      expect(component.getLocation(dc)).toBe('West US');
    });

    it('should extract location before dash separator', () => {
      const dc = {spec: {location: 'Frankfurt - Zone A'}} as Datacenter;
      expect(component.getLocation(dc)).toBe('Frankfurt');
    });

    it('should handle location with both parentheses and dash, prioritizing parentheses', () => {
      const dc = {spec: {location: 'US West - Main (N. California)'}} as Datacenter;
      expect(component.getLocation(dc)).toBe('US West');
    });
  });

  describe('getZone', () => {
    it('should extract zone from parentheses', () => {
      expect(component.getZone(mockDatacenters[0])).toBe('N. California');
    });

    it('should extract zone from parentheses for EU format', () => {
      expect(component.getZone(mockDatacenters[1])).toBe('Frankfurt');
    });

    it('should return empty string when no zone information present', () => {
      expect(component.getZone(mockDatacenters[2])).toBe('');
    });

    it('should extract zone after dash separator when no parentheses', () => {
      const dc = {spec: {location: 'Frankfurt - Zone A'}} as Datacenter;
      expect(component.getZone(dc)).toBe('Zone A');
    });

    it('should return empty string for simple location without separators', () => {
      const dc = {spec: {location: 'Tokyo'}} as Datacenter;
      expect(component.getZone(dc)).toBe('');
    });
  });

  describe('Provider List Extraction', () => {
    it('should extract unique providers from datacenters on init', () => {
      fixture.detectChanges();
      expect(component.providers).toContain(NodeProvider.AWS);
      expect(component.providers).toContain(NodeProvider.GCP);
      expect(component.providers.length).toBe(2);
    });

    it('should not contain duplicate providers even when multiple datacenters share a provider', () => {
      fixture.detectChanges();
      const awsCount = component.providers.filter(p => p === NodeProvider.AWS).length;
      expect(awsCount).toBe(1);
    });
  });

  describe('Datacenter Filtering on Provider Selection', () => {
    it('should filter datacenters to match the selected provider', () => {
      clusterSpecService.provider = NodeProvider.AWS;
      fixture.detectChanges();
      expect(component.datacenters.every(dc => dc.spec.provider === 'aws')).toBe(true);
      expect(component.datacenters.length).toBe(2);
    });

    it('should show only GCP datacenters when GCP provider is selected', () => {
      clusterSpecService.provider = NodeProvider.GCP;
      fixture.detectChanges();
      expect(component.datacenters.every(dc => dc.spec.provider === 'gcp')).toBe(true);
      expect(component.datacenters.length).toBe(1);
    });
  });

  describe('Datacenter Reset on Provider Change', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset datacenter value when provider changes', () => {
      component.form.get('datacenter').setValue(mockDatacenters[0].metadata.name);
      component.form.get('provider').setValue(NodeProvider.GCP);
      expect(component.form.get('datacenter').value).toBe('');
    });

    it('should update wizard service provider when provider control changes', () => {
      component.form.get('provider').setValue(NodeProvider.GCP);
      expect(wizardService.provider).toBe(NodeProvider.GCP);
    });
  });

  describe('ControlValueAccessor', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set form values via writeValue', () => {
      const value = {
        provider: NodeProvider.AWS,
        datacenter: mockDatacenters[0].metadata.name,
      };
      component.writeValue(value);
      expect(component.form.get('provider').value).toBe(NodeProvider.AWS);
      expect(component.form.get('datacenter').value).toBe(mockDatacenters[0].metadata.name);
    });

    it('should not modify form when writeValue receives null', () => {
      component.form.get('provider').setValue(NodeProvider.AWS);
      component.writeValue(null);
      expect(component.form.get('provider').value).toBe(NodeProvider.AWS);
    });
  });

  describe('Validator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null when form is valid', () => {
      component.form.patchValue({
        provider: NodeProvider.AWS,
        datacenter: mockDatacenters[0].metadata.name,
      });
      expect(component.validate(null)).toBeNull();
    });

    it('should return validation error object when form is invalid', () => {
      component.form.patchValue({provider: '', datacenter: ''});
      const result = component.validate(null);
      expect(result).toEqual({
        invalidForm: {
          valid: false,
          message: 'Form validation failed.',
        },
      });
    });
  });

  describe('Cleanup', () => {
    it('should complete the unsubscribe subject on destroy', () => {
      fixture.detectChanges();
      const nextSpy = jest.spyOn(component['_unsubscribe'], 'next');
      const completeSpy = jest.spyOn(component['_unsubscribe'], 'complete');
      fixture.destroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
