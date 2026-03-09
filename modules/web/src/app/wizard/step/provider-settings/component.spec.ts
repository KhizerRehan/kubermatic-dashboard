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

import {NO_ERRORS_SCHEMA} from '@angular/core';
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
  let clusterSpecService: any;

  beforeEach(waitForAsync(() => {
    const clusterSpecServiceMock = {
      provider: NodeProvider.AWS,
      providerChanges: of(NodeProvider.AWS),
    };

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule],
      declarations: [ProviderSettingsStepComponent],
      providers: [
        {provide: ClusterSpecService, useValue: clusterSpecServiceMock},
        {provide: WizardService, useValue: new WizardMockService()},
      ],
      schemas: [NO_ERRORS_SCHEMA],
      teardown: {destroyAfterEach: false},
    })
      .overrideComponent(ProviderSettingsStepComponent, {
        set: {
          providers: [],
        },
      })
      .compileComponents();

    clusterSpecService = TestBed.inject(ClusterSpecService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProviderSettingsStepComponent);
    component = fixture.componentInstance;
  });

  // Call ngOnInit directly to avoid template rendering issues
  function initComponent(): void {
    component.ngOnInit();
  }

  describe('Form Initialization', () => {
    it('should initialize form with preset, providerBasic, and providerExtended controls', () => {
      initComponent();
      expect(component.form.get('preset')).toBeTruthy();
      expect(component.form.get('providerBasic')).toBeTruthy();
      expect(component.form.get('providerExtended')).toBeTruthy();
    });

    it('should initialize controls as empty strings', () => {
      initComponent();
      expect(component.form.get('preset').value).toBe('');
      expect(component.form.get('providerBasic').value).toBe('');
      expect(component.form.get('providerExtended').value).toBe('');
    });
  });

  describe('Provider Tracking', () => {
    it('should set provider from ClusterSpecService on init', () => {
      initComponent();
      expect(component.provider).toBe(NodeProvider.AWS);
    });

    it('should update provider when providerChanges emits', (done) => {
      const providerChanges$ = new Subject<NodeProvider>();
      clusterSpecService.providerChanges = providerChanges$;

      initComponent();
      providerChanges$.next(NodeProvider.GCP);

      fixture.whenStable().then(() => {
        expect(component.provider).toBe(NodeProvider.GCP);
        done();
      });
    });

    it('should track latest provider across multiple changes', (done) => {
      const providerChanges$ = new Subject<NodeProvider>();
      clusterSpecService.providerChanges = providerChanges$;

      initComponent();
      providerChanges$.next(NodeProvider.AWS);
      providerChanges$.next(NodeProvider.AZURE);
      providerChanges$.next(NodeProvider.GCP);

      fixture.whenStable().then(() => {
        expect(component.provider).toBe(NodeProvider.GCP);
        done();
      });
    });
  });

  describe('hasExtendedSection()', () => {
    beforeEach(() => {
      initComponent();
    });

    it('should return true for providers with extended settings', () => {
      expect(component.hasExtendedSection(NodeProvider.VSPHERE)).toBe(true);
      expect(component.hasExtendedSection(NodeProvider.AWS)).toBe(true);
      expect(component.hasExtendedSection(NodeProvider.AZURE)).toBe(true);
      expect(component.hasExtendedSection(NodeProvider.GCP)).toBe(true);
      expect(component.hasExtendedSection(NodeProvider.OPENSTACK)).toBe(true);
      expect(component.hasExtendedSection(NodeProvider.HETZNER)).toBe(true);
      expect(component.hasExtendedSection(NodeProvider.NUTANIX)).toBe(true);
      expect(component.hasExtendedSection(NodeProvider.VMWARECLOUDDIRECTOR)).toBe(true);
    });

    it('should return false for providers without extended settings', () => {
      expect(component.hasExtendedSection(NodeProvider.ALIBABA)).toBe(false);
      expect(component.hasExtendedSection(NodeProvider.DIGITALOCEAN)).toBe(false);
    });
  });

  describe('ControlValueAccessor', () => {
    beforeEach(() => {
      initComponent();
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

    it('should emit changes via registered onChange callback', () => {
      let emittedValue: any;
      component.registerOnChange((value: any) => {
        emittedValue = value;
      });

      component.form.patchValue({preset: 'new-preset'});

      expect(emittedValue).toBeDefined();
    });
  });

  describe('Validator', () => {
    beforeEach(() => {
      initComponent();
    });

    it('should return null for valid form', () => {
      const result = component.validate(null);
      expect(result).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should clean up subscriptions on destroy', () => {
      initComponent();
      const unsubscribeSpy = jest.spyOn(component['_unsubscribe'], 'next');
      component.ngOnDestroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });
});
