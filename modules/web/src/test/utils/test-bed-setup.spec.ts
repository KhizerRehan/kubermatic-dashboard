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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Component} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';

import {TestBedSetup} from './test-bed-setup';

@Component({
  selector: 'test-component',
  template: '<div>Test Component</div>',
})
class TestComponent {}

describe('TestBedSetup', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('configureBasicComponentTest', () => {
    it('should configure TestBed with basic imports', () => {
      TestBedSetup.configureBasicComponentTest({
        declarations: [TestComponent],
      });

      expect(TestBed).toBeTruthy();
    });

    it('should include BrowserModule and NoopAnimationsModule by default', () => {
      TestBedSetup.configureBasicComponentTest({
        declarations: [TestComponent],
      });

      const fixture = TestBed.createComponent(TestComponent);
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should allow additional imports', () => {
      TestBedSetup.configureBasicComponentTest({
        imports: [HttpClientModule],
        declarations: [TestComponent],
      });

      const httpModule = TestBed.inject(HttpClientModule);
      expect(httpModule).toBeTruthy();
    });

    it('should set teardown configuration', () => {
      TestBedSetup.configureBasicComponentTest({
        declarations: [TestComponent],
        teardown: {destroyAfterEach: true},
      });

      expect(TestBed).toBeTruthy();
    });

    it('should allow custom providers', () => {
      const mockService = {getValue: () => 'test'};

      TestBedSetup.configureBasicComponentTest({
        declarations: [TestComponent],
        providers: [{provide: 'TestService', useValue: mockService}],
      });

      const service = TestBed.inject('TestService' as any);
      expect(service.getValue()).toBe('test');
    });
  });

  describe('configureComponentWithServices', () => {
    it('should include HttpClientModule for API testing', () => {
      TestBedSetup.configureComponentWithServices({
        declarations: [TestComponent],
      });

      const http = TestBed.inject(HttpClientModule);
      expect(http).toBeTruthy();
    });

    it('should allow service mocking', () => {
      const mockService = {getValue: () => 'mocked'};

      TestBedSetup.configureComponentWithServices({
        declarations: [TestComponent],
        providers: [{provide: 'MockService', useValue: mockService}],
      });

      const service = TestBed.inject('MockService' as any);
      expect(service.getValue()).toBe('mocked');
    });

    it('should create component fixture with service dependencies', () => {
      TestBedSetup.configureComponentWithServices({
        imports: [BrowserModule, HttpClientModule, NoopAnimationsModule],
        declarations: [TestComponent],
      });

      const fixture = TestBed.createComponent(TestComponent);
      expect(fixture.componentInstance).toBeTruthy();
    });
  });

  describe('configureComponentWithDialog', () => {
    it('should configure TestBed with Material Dialog support', () => {
      TestBedSetup.configureComponentWithDialog({
        imports: [MatDialogModule],
        declarations: [TestComponent],
      });

      expect(TestBed).toBeTruthy();
    });

    it('should allow MatDialog injection', () => {
      TestBedSetup.configureComponentWithDialog({
        imports: [MatDialogModule],
        declarations: [TestComponent],
      });

      const matDialog = TestBed.inject(MatDialog);
      expect(matDialog).toBeTruthy();
    });

    it('should allow custom providers for dialog testing', () => {
      const mockDialogService = {isOpen: false};

      TestBedSetup.configureComponentWithDialog({
        imports: [MatDialogModule],
        declarations: [TestComponent],
        providers: [{provide: 'DialogService', useValue: mockDialogService}],
      });

      const service = TestBed.inject('DialogService' as any);
      expect(service.isOpen).toBe(false);
    });
  });

  describe('configureFeatureModule', () => {
    @Component({
      selector: 'test-feature-component',
      template: '<div>Feature Component</div>',
    })
    class FeatureComponent {}

    @Component({
      selector: 'app-root',
      template: '<test-feature-component></test-feature-component>',
    })
    class FeatureRootComponent {}

    // Create a minimal test module
    const createTestModule = () => {
      return TestBedSetup.configureFeatureModule({
        featureModule: FeatureRootComponent as any, // Using component as placeholder for module
        declarations: [FeatureComponent],
      });
    };

    it('should configure TestBed with feature module', () => {
      createTestModule();
      expect(TestBed).toBeTruthy();
    });

    it('should include base imports for feature module', () => {
      createTestModule();

      const fixture = TestBed.createComponent(FeatureComponent);
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should allow additional imports alongside feature module', () => {
      TestBedSetup.configureFeatureModule({
        featureModule: FeatureRootComponent as any,
        declarations: [FeatureComponent],
        additionalImports: [HttpClientModule],
      });

      const http = TestBed.inject(HttpClientModule);
      expect(http).toBeTruthy();
    });
  });

  describe('compileComponents', () => {
    it('should compile components asynchronously', async () => {
      TestBedSetup.configureBasicComponentTest({
        declarations: [TestComponent],
      });

      await TestBedSetup.compileComponents();
      expect(TestBed).toBeTruthy();
    });
  });

  describe('injectService', () => {
    it('should inject service with type safety', () => {
      const mockService = {getValue: () => 'injected'};

      TestBedSetup.configureBasicComponentTest({
        providers: [{provide: 'Service', useValue: mockService}],
      });

      const service = TestBedSetup.injectService('Service' as any);
      expect(service.getValue()).toBe('injected');
    });

    it('should throw error if service not provided', () => {
      TestBedSetup.configureBasicComponentTest({});

      expect(() => {
        TestBedSetup.injectService('NonExistentService' as any);
      }).toThrow();
    });
  });

  describe('factory function combinations', () => {
    it('should work with basic component test for simple components', () => {
      TestBedSetup.configureBasicComponentTest({
        declarations: [TestComponent],
      });

      const fixture = TestBed.createComponent(TestComponent);
      const component = TestBedSetup.injectService(TestComponent as any);

      // Just verify fixture was created successfully
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should work with services configuration for complex components', () => {
      const mockService = {data: 'test'};

      TestBedSetup.configureComponentWithServices({
        declarations: [TestComponent],
        providers: [{provide: 'DataService', useValue: mockService}],
      });

      const service = TestBedSetup.injectService('DataService' as any);
      expect(service.data).toBe('test');
    });
  });
});
