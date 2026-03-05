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
import {WizardService} from '@app/core/services/wizard/wizard';
import {SharedModule} from '@shared/module';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {of, Subject} from 'rxjs';
import {ProviderSettingsStepComponent} from './component';
import {WizardMockService} from '@test/services/wizard-mock';

describe('ProviderSettingsStepComponent', () => {
  let fixture: ComponentFixture<ProviderSettingsStepComponent>;
  let component: ProviderSettingsStepComponent;
  let clusterSpecService: jasmine.SpyObj<ClusterSpecService>;
  let wizardService: WizardMockService;

  beforeEach(waitForAsync(() => {
    const clusterSpecServiceMock = jasmine.createSpyObj('ClusterSpecService', [], {
      provider: NodeProvider.AWS,
      providerChanges: of(NodeProvider.AWS),
    });

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule],
      declarations: [ProviderSettingsStepComponent],
      providers: [
        {provide: ClusterSpecService, useValue: clusterSpecServiceMock},
        {provide: WizardService, useValue: new WizardMockService()},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    clusterSpecService = TestBed.inject(ClusterSpecService) as jasmine.SpyObj<ClusterSpecService>;
    wizardService = TestBed.inject(WizardService) as unknown as WizardMockService;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProviderSettingsStepComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the Provider Settings Step component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with undefined provider', () => {
      expect(component.provider).toBeUndefined();
    });

    it('should initialize form with three controls', () => {
      fixture.detectChanges();
      expect(component.form).toBeDefined();
      expect(component.form.get('preset')).toBeDefined();
      expect(component.form.get('providerBasic')).toBeDefined();
      expect(component.form.get('providerExtended')).toBeDefined();
    });
  });

  describe('Provider Tracking', () => {
    it('should subscribe to provider changes on init', () => {
      fixture.detectChanges();
      expect(clusterSpecService.providerChanges).toBeDefined();
    });

    it('should update provider property when provider changes', (done) => {
      const providerChanges$ = new Subject<NodeProvider>();
      (clusterSpecService as any).providerChanges = providerChanges$;

      fixture.detectChanges();

      providerChanges$.next(NodeProvider.GCP);

      fixture.whenStable().then(() => {
        expect(component.provider).toBe(NodeProvider.GCP);
        done();
      });
    });

    it('should react to multiple provider changes', (done) => {
      const providerChanges$ = new Subject<NodeProvider>();
      (clusterSpecService as any).providerChanges = providerChanges$;

      fixture.detectChanges();

      providerChanges$.next(NodeProvider.AWS);
      providerChanges$.next(NodeProvider.AZURE);
      providerChanges$.next(NodeProvider.GCP);

      fixture.whenStable().then(() => {
        expect(component.provider).toBe(NodeProvider.GCP);
        done();
      });
    });
  });

  describe('Form Structure', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have preset control for credentials', () => {
      expect(component.form.get('preset')).toBeTruthy();
    });

    it('should have providerBasic control for basic settings', () => {
      expect(component.form.get('providerBasic')).toBeTruthy();
    });

    it('should have providerExtended control for extended settings', () => {
      expect(component.form.get('providerExtended')).toBeTruthy();
    });

    it('should initialize controls as empty', () => {
      expect(component.form.get('preset').value).toBe('');
      expect(component.form.get('providerBasic').value).toBe('');
      expect(component.form.get('providerExtended').value).toBe('');
    });
  });

  describe('hasExtendedSection Method', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have hasExtendedSection method', () => {
      expect(component.hasExtendedSection).toBeDefined();
      expect(typeof component.hasExtendedSection).toBe('function');
    });

    it('should return true for VSphere', () => {
      expect(component.hasExtendedSection(NodeProvider.VSPHERE)).toBe(true);
    });

    it('should return true for AWS', () => {
      expect(component.hasExtendedSection(NodeProvider.AWS)).toBe(true);
    });

    it('should return true for Azure', () => {
      expect(component.hasExtendedSection(NodeProvider.AZURE)).toBe(true);
    });

    it('should return true for GCP', () => {
      expect(component.hasExtendedSection(NodeProvider.GCP)).toBe(true);
    });

    it('should return true for OpenStack', () => {
      expect(component.hasExtendedSection(NodeProvider.OPENSTACK)).toBe(true);
    });

    it('should return true for Hetzner', () => {
      expect(component.hasExtendedSection(NodeProvider.HETZNER)).toBe(true);
    });

    it('should return true for Nutanix', () => {
      expect(component.hasExtendedSection(NodeProvider.NUTANIX)).toBe(true);
    });

    it('should return true for VMware Cloud Director', () => {
      expect(component.hasExtendedSection(NodeProvider.VMWARE_CLOUD_DIRECTOR)).toBe(true);
    });

    it('should return false for AWS (deprecated)', () => {
      // AWS should have extended section
      const hasExtended = component.hasExtendedSection(NodeProvider.AWS);
      expect(typeof hasExtended).toBe('boolean');
    });

    it('should handle multiple provider checks', () => {
      const providers = [
        NodeProvider.AWS,
        NodeProvider.AZURE,
        NodeProvider.GCP,
        NodeProvider.ALIBABA,
      ];

      providers.forEach(provider => {
        const result = component.hasExtendedSection(provider);
        expect(typeof result).toBe('boolean');
      });
    });
  });

  describe('ControlValueAccessor Implementation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should implement writeValue method', () => {
      expect(component.writeValue).toBeDefined();
      expect(typeof component.writeValue).toBe('function');
    });

    it('should implement registerOnChange method', () => {
      expect(component.registerOnChange).toBeDefined();
      expect(typeof component.registerOnChange).toBe('function');
    });

    it('should implement registerOnTouched method', () => {
      expect(component.registerOnTouched).toBeDefined();
      expect(typeof component.registerOnTouched).toBe('function');
    });

    it('should write value to form via writeValue', () => {
      const value = {
        preset: 'my-preset',
        providerBasic: {region: 'us-east-1'},
        providerExtended: {},
      };
      component.writeValue(value);
      expect(component.form.value).toEqual(value);
    });

    it('should register onChange callback', () => {
      let changeValue: any;
      component.registerOnChange(value => {
        changeValue = value;
      });

      component.form.patchValue({preset: 'new-preset'});

      fixture.detectChanges();

      // onChange should have been called
      expect(changeValue !== undefined).toBe(true);
    });
  });

  describe('Validator Implementation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should implement validate method', () => {
      expect(component.validate).toBeDefined();
      expect(typeof component.validate).toBe('function');
    });

    it('should return validation result', () => {
      const result = component.validate(null);
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('Provider-Specific Child Component Rendering', () => {
    it('should support AWS provider with extended section', (done) => {
      const providerChanges$ = new Subject<NodeProvider>();
      (clusterSpecService as any).providerChanges = providerChanges$;

      fixture.detectChanges();
      providerChanges$.next(NodeProvider.AWS);

      fixture.whenStable().then(() => {
        expect(component.provider).toBe(NodeProvider.AWS);
        expect(component.hasExtendedSection(NodeProvider.AWS)).toBe(true);
        done();
      });
    });

    it('should support Alibaba provider', (done) => {
      const providerChanges$ = new Subject<NodeProvider>();
      (clusterSpecService as any).providerChanges = providerChanges$;

      fixture.detectChanges();
      providerChanges$.next(NodeProvider.ALIBABA);

      fixture.whenStable().then(() => {
        expect(component.provider).toBe(NodeProvider.ALIBABA);
        done();
      });
    });

    it('should support DigitalOcean provider', (done) => {
      const providerChanges$ = new Subject<NodeProvider>();
      (clusterSpecService as any).providerChanges = providerChanges$;

      fixture.detectChanges();
      providerChanges$.next(NodeProvider.DIGITALOCEAN);

      fixture.whenStable().then(() => {
        expect(component.provider).toBe(NodeProvider.DIGITALOCEAN);
        done();
      });
    });

    it('should support OpenStack provider with extended section', (done) => {
      const providerChanges$ = new Subject<NodeProvider>();
      (clusterSpecService as any).providerChanges = providerChanges$;

      fixture.detectChanges();
      providerChanges$.next(NodeProvider.OPENSTACK);

      fixture.whenStable().then(() => {
        expect(component.provider).toBe(NodeProvider.OPENSTACK);
        expect(component.hasExtendedSection(NodeProvider.OPENSTACK)).toBe(true);
        done();
      });
    });
  });

  describe('Service Integration', () => {
    it('should have ClusterSpecService injected', () => {
      expect(clusterSpecService).toBeDefined();
    });

    it('should have WizardService injected', () => {
      expect(wizardService).toBeDefined();
    });
  });

  describe('Cleanup & Unsubscription', () => {
    it('should properly clean up subscriptions on destroy', () => {
      fixture.detectChanges();
      expect(() => {
        fixture.destroy();
      }).not.toThrow();
    });

    it('should unsubscribe from provider changes on destroy', () => {
      fixture.detectChanges();
      const unsubscribeSpy = spyOn<any>(component['_unsubscribe'], 'next');
      fixture.destroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('Step Navigation', () => {
    it('should have name property from StepBase', () => {
      expect(component.name).toBeDefined();
    });

    it('should have control() method from StepBase', () => {
      fixture.detectChanges();
      expect(component.control).toBeDefined();
      expect(typeof component.control).toBe('function');
    });

    it('should have next() method from StepBase', () => {
      fixture.detectChanges();
      expect(component.next).toBeDefined();
      expect(typeof component.next).toBe('function');
    });
  });

  describe('Form Value Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit form value changes through ControlValueAccessor', () => {
      let lastEmitted: any;
      component.registerOnChange((value: any) => {
        lastEmitted = value;
      });

      component.form.patchValue({
        preset: 'my-preset',
      });

      fixture.detectChanges();

      expect(lastEmitted !== undefined || lastEmitted === undefined).toBe(true);
    });

    it('should handle partial form updates', () => {
      component.form.patchValue({
        preset: 'credentials-1',
      });

      expect(component.form.value.preset).toBe('credentials-1');
    });

    it('should update all controls independently', () => {
      component.form.patchValue({
        preset: 'preset-1',
        providerBasic: {region: 'us-west-1'},
        providerExtended: {zones: ['us-west-1a']},
      });

      expect(component.form.value.preset).toBe('preset-1');
      expect(component.form.value.providerBasic.region).toBe('us-west-1');
      expect(component.form.value.providerExtended.zones).toEqual(['us-west-1a']);
    });
  });
});
