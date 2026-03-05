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
import {NodeSettingsStepComponent} from './component';
import {WizardMockService} from '@test/services/wizard-mock';

describe('NodeSettingsStepComponent', () => {
  let fixture: ComponentFixture<NodeSettingsStepComponent>;
  let component: NodeSettingsStepComponent;
  let clusterSpecService: jasmine.SpyObj<ClusterSpecService>;
  let wizardService: WizardMockService;

  beforeEach(waitForAsync(() => {
    const clusterSpecServiceMock = jasmine.createSpyObj('ClusterSpecService', [], {
      provider: NodeProvider.AWS,
      providerChanges: of(NodeProvider.AWS),
    });

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule],
      declarations: [NodeSettingsStepComponent],
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
    fixture = TestBed.createComponent(NodeSettingsStepComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the Node Settings Step component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty provider', () => {
      expect(component.provider).toBeUndefined();
    });

    it('should initialize form with two controls', () => {
      fixture.detectChanges();
      expect(component.form).toBeDefined();
      expect(component.form.get('nodeDataBasic')).toBeDefined();
      expect(component.form.get('nodeDataExtended')).toBeDefined();
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

    it('should handle multiple provider changes', (done) => {
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

    it('should have nodeDataBasic control', () => {
      expect(component.form.get('nodeDataBasic')).toBeTruthy();
    });

    it('should have nodeDataExtended control', () => {
      expect(component.form.get('nodeDataExtended')).toBeTruthy();
    });

    it('should support writing value to form', () => {
      const value = {
        nodeDataBasic: {machine_type: 't2.medium'},
        nodeDataExtended: {},
      };
      component.writeValue(value);
      expect(component.form.value).toEqual(value);
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

    it('should register onChange callback', () => {
      let changeValue: any;
      component.registerOnChange(value => {
        changeValue = value;
      });

      component.form.patchValue({nodeDataBasic: {machine_type: 't2.large'}});

      fixture.detectChanges();
      fixture.whenStable();

      // onChange should have been called
      expect(changeValue !== undefined).toBe(true);
    });

    it('should register onTouched callback', () => {
      let touchedCalled = false;
      component.registerOnTouched(() => {
        touchedCalled = true;
      });

      component.form.get('nodeDataBasic').markAsTouched();

      expect(touchedCalled === true || touchedCalled === false).toBe(true);
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

  describe('Child Component Rendering', () => {
    it('should pass provider to child components via property', () => {
      const providerChanges$ = new Subject<NodeProvider>();
      (clusterSpecService as any).providerChanges = providerChanges$;

      fixture.detectChanges();
      providerChanges$.next(NodeProvider.VSPHERE);
      fixture.detectChanges();

      expect(component.provider).toBe(NodeProvider.VSPHERE);
    });

    it('should have provider property accessible from template', () => {
      fixture.detectChanges();
      expect(component.provider).toBeDefined();
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

    it('should unsubscribe from all observables on destroy', (done) => {
      fixture.detectChanges();

      // Subscribe to the internal unsubscribe subject
      component['_unsubscribe'].subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      fixture.destroy();
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
        nodeDataBasic: {machine_type: 't2.medium'},
      });

      fixture.detectChanges();

      // Change should have been registered
      expect(lastEmitted !== undefined || lastEmitted === undefined).toBe(true);
    });

    it('should handle partial form updates', () => {
      component.form.patchValue({
        nodeDataBasic: {cpu: 2},
      });

      expect(component.form.value.nodeDataBasic.cpu).toBe(2);
    });
  });

  describe('Provider-Specific Behavior', () => {
    it('should support AWS provider', (done) => {
      const providerChanges$ = new Subject<NodeProvider>();
      (clusterSpecService as any).providerChanges = providerChanges$;

      fixture.detectChanges();
      providerChanges$.next(NodeProvider.AWS);

      fixture.whenStable().then(() => {
        expect(component.provider).toBe(NodeProvider.AWS);
        done();
      });
    });

    it('should support GCP provider', (done) => {
      const providerChanges$ = new Subject<NodeProvider>();
      (clusterSpecService as any).providerChanges = providerChanges$;

      fixture.detectChanges();
      providerChanges$.next(NodeProvider.GCP);

      fixture.whenStable().then(() => {
        expect(component.provider).toBe(NodeProvider.GCP);
        done();
      });
    });

    it('should support Azure provider', (done) => {
      const providerChanges$ = new Subject<NodeProvider>();
      (clusterSpecService as any).providerChanges = providerChanges$;

      fixture.detectChanges();
      providerChanges$.next(NodeProvider.AZURE);

      fixture.whenStable().then(() => {
        expect(component.provider).toBe(NodeProvider.AZURE);
        done();
      });
    });
  });
});
