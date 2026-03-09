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

import {ChangeDetectorRef, ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {FormControl} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {BrandingService} from '@core/services/branding';
import {FeatureGateService} from '@core/services/feature-gate';
import {NotificationService} from '@core/services/notification';
import {SettingsService} from '@core/services/settings';
import {UserClusterConfigService} from '@core/services/user-cluster-config';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {fakeAdminSettings} from '@test/data/settings';
import {fakeUser} from '@test/data/user';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {of} from 'rxjs';
import {DefaultsComponent} from './component';

describe('DefaultsComponent', () => {
  let fixture: ComponentFixture<DefaultsComponent>;
  let component: DefaultsComponent;
  let settingsService: SettingsMockService;
  let userService: UserMockService;
  let notificationService: NotificationService;
  let userClusterConfigService: UserClusterConfigService;

  beforeEach(() => {
    const featureGateMock = {
      featureGates: of({
        oidcKubeCfgEndpoint: true,
        openIDAuthPlugin: true,
      }),
    };

    const userClusterConfigMock = {
      getAdmissionPluginsConfiguration: jest.fn().mockReturnValue(of({
        eventRateLimit: {
          enabled: false,
          enforced: false,
          defaultConfig: {},
        },
      })),
      patchAdmissionPluginsConfiguration: jest.fn().mockReturnValue(of({
        eventRateLimit: {
          enabled: false,
          enforced: false,
          defaultConfig: {},
        },
      })),
    };

    const brandingMock = {
      config: {},
      hideDocumentationLinks: false,
    };

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [DefaultsComponent],
      providers: [
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: FeatureGateService, useValue: featureGateMock},
        {provide: UserClusterConfigService, useValue: userClusterConfigMock},
        {provide: BrandingService, useValue: brandingMock},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(DefaultsComponent);
    component = fixture.componentInstance;
    settingsService = TestBed.inject(SettingsService) as unknown as SettingsMockService;
    userService = TestBed.inject(UserService) as unknown as UserMockService;
    notificationService = TestBed.inject(NotificationService);
    userClusterConfigService = TestBed.inject(UserClusterConfigService);
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should load admin settings on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.settings).toBeDefined();
    expect(component.apiSettings).toBeDefined();
  }));

  it('should load current user on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.user).toBeDefined();
  }));

  it('should load feature gates on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.isOIDCKubeCfgEndpointEnabled).toBe(true);
    expect(component.isOpenIDAuthPluginEnabled).toBe(true);
  }));

  it('should load event rate limit configuration', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.eventRateLimitConfig).toBeDefined();
  }));

  it('should disable event rate limit form when not enabled', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.eventRateLimitConfig.enabled = false;
    expect(component.disableEventRateLimitConfigForm).toBe(true);
  }));

  it('should enable event rate limit form when enabled', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.eventRateLimitConfig.enabled = true;
    component.onEventRateLimitConfigChange('enabled', true);

    expect(component.disableEventRateLimitConfigForm).toBe(false);
  }));

  it('should return getter for hiddenAnnotations', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.settings.annotations = {
      hiddenAnnotations: ['annotation1', 'annotation2'],
      protectedAnnotations: [],
    };

    expect(component.hiddenAnnotations).toEqual(['annotation1', 'annotation2']);
  }));

  it('should return getter for protectedAnnotations', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.settings.annotations = {
      hiddenAnnotations: [],
      protectedAnnotations: ['protected1', 'protected2'],
    };

    expect(component.protectedAnnotations).toEqual(['protected1', 'protected2']);
  }));

  it('should update hidden annotations on change', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const newAnnotations = ['new-hidden1', 'new-hidden2'];
    component.onHiddenAnnotationsChange(newAnnotations);

    expect(component.settings.annotations.hiddenAnnotations).toEqual(newAnnotations);
  }));

  it('should update protected annotations on change', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const newAnnotations = ['new-protected1', 'new-protected2'];
    component.onProtectedAnnotationsChange(newAnnotations);

    expect(component.settings.annotations.protectedAnnotations).toEqual(newAnnotations);
  }));

  it('should check if MLA logging settings are equal', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const areEqual = component.isMLALoggingEqual();
    expect(typeof areEqual).toBe('boolean');
  }));

  it('should check if MLA monitoring settings are equal', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const areEqual = component.isMLAMonitoringEqual();
    expect(typeof areEqual).toBe('boolean');
  }));

  it('should return true when MLA logging is unchanged', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const areEqual = component.isMLALoggingEqual();
    expect(areEqual).toBe(true);
  }));

  it('should return false when MLA logging differs', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    if (component.settings.mlaOptions && component.apiSettings.mlaOptions) {
      component.settings.mlaOptions.loggingEnabled = !component.apiSettings.mlaOptions.loggingEnabled;
      const areEqual = component.isMLALoggingEqual();
      expect(areEqual).toBe(false);
    }
  }));

  it('should disable web terminal when OIDC kubeconfig changes', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.settings.webTerminalOptions = {enabled: true};
    component.onOIDCKubeconfigSettingsChange();

    expect(component.settings.webTerminalOptions.enabled).toBe(false);
  }));

  it('should disable share cluster when OIDC kubeconfig changes', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.settings.enableShareCluster = true;
    component.onOIDCKubeconfigSettingsChange();

    expect(component.settings.enableShareCluster).toBe(false);
  }));

  it('should check if Kubernetes Dashboard feature gates are enabled', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.isOIDCKubeCfgEndpointEnabled = true;
    component.isOpenIDAuthPluginEnabled = true;

    expect(component.isKubernetesDashboardFeatureGatesEnabled()).toBe(true);
  }));

  it('should return false for Kubernetes Dashboard when any feature gate is disabled', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.isOIDCKubeCfgEndpointEnabled = false;
    component.isOpenIDAuthPluginEnabled = true;

    expect(component.isKubernetesDashboardFeatureGatesEnabled()).toBe(false);
  }));

  it('should update Velero checksum algorithm', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.onVeleroChecksumAlgorithmChange('sha256');

    expect(component.settings.clusterBackupOptions.defaultChecksumAlgorithm).toBe('sha256');
  }));

  it('should update IP allocation modes', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const newModes = ['POOL', 'DHCP'];
    component.onIPAllocationModeChange(newModes);

    expect(component.settings.providerConfiguration.vmwareCloudDirector.ipAllocationModes).toEqual(newModes);
  }));

  it('should update allowed operating systems', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const selectedOS = ['ubuntu', 'centos'];
    component.onOperatingSystemChange(selectedOS);

    expect(component.settings.allowedOperatingSystems['ubuntu']).toBe(true);
    expect(component.settings.allowedOperatingSystems['centos']).toBe(true);
  }));

  it('should check if OS is the last enabled OS', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.allowedOperatingSystems = ['ubuntu'];
    const isLast = component.isLastEnabledOS('ubuntu');

    expect(isLast).toBe(true);
  }));

  it('should return false if OS is not the last enabled OS', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.allowedOperatingSystems = ['ubuntu', 'centos'];
    const isLast = component.isLastEnabledOS('ubuntu');

    expect(isLast).toBe(false);
  }));

  it('should get documentation link', () => {
    fixture.detectChanges();

    const link = component.getDocumentationLink();
    expect(typeof link).toBe('string');
    expect(link.length).toBeGreaterThan(0);
  });

  it('should return empty documentation link when documentation is hidden', () => {
    const brandingMock = TestBed.inject(BrandingService);
    (brandingMock as any).hideDocumentationLinks = true;

    component['_branding'] = brandingMock;
    const link = component.getDocumentationLink();

    expect(link).toBe('');
  });

  it('should check equality using lodash', () => {
    fixture.detectChanges();

    const obj1 = {a: 1, b: 2};
    const obj2 = {a: 1, b: 2};
    const obj3 = {a: 1, b: 3};

    expect(component.isEqual(obj1, obj2)).toBe(true);
    expect(component.isEqual(obj1, obj3)).toBe(false);
  });

  it('should trigger settings change on onSettingsChange()', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const spy = jest.spyOn(component['_settingsChange'], 'next');
    component.onSettingsChange();

    expect(spy).toHaveBeenCalled();
  }));

  it('should unsubscribe on component destroy', () => {
    fixture.detectChanges();
    const unsubscribeSpy = jest.spyOn(component['_unsubscribe'], 'next');
    const completeSpy = jest.spyOn(component['_unsubscribe'], 'complete');

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should debounce settings changes (500ms)', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const spy = jest.spyOn(settingsService, 'patchAdminSettings').mockReturnValue(of(component.settings));

    component.onSettingsChange();
    tick(250); // Half of debounce time

    expect(spy).not.toHaveBeenCalled();

    tick(250); // Complete debounce time
    expect(spy).toHaveBeenCalled();
  }));
});
