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

import {HttpClientModule} from '@angular/common/http';
import {NgModule, Type} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {MatDialog} from '@angular/material/dialog';
import {TestBed} from '@angular/core/testing';

/**
 * Helper class for simplifying TestBed configuration setup in component and service tests.
 *
 * Provides factory functions with sensible defaults and support for common test scenarios:
 * - Basic component tests (with only required imports)
 * - Component tests with services and mocks
 * - Component tests with Angular Material dialogs
 * - Feature module tests
 *
 * Each factory function returns the configured TestBed, allowing further customization
 * via TestBed.configureTestingModule() if needed.
 *
 * @example
 * ```typescript
 * // Basic component test setup
 * TestBedSetup.configureBasicComponentTest({
 *   imports: [SharedModule],
 *   declarations: [MyComponent],
 * });
 *
 * // Component test with services and mocks
 * TestBedSetup.configureComponentWithServices({
 *   imports: [SharedModule],
 *   declarations: [MyComponent],
 *   providers: [
 *     {provide: MyService, useClass: MyServiceMock},
 *   ],
 * });
 * ```
 */
export class TestBedSetup {
  /**
   * Configures TestBed for a basic component test with minimal setup.
   *
   * Automatically includes common imports (BrowserModule, NoopAnimationsModule)
   * and enables OnPush change detection strategy support. Use this for simple
   * component tests that don't require services or complex dependencies.
   *
   * @param {Object} config - TestBed configuration options
   * @param {any[]} [config.imports] - Additional modules to import
   * @param {any[]} [config.declarations] - Components/directives to declare
   * @param {any[]} [config.providers] - Services and tokens to provide
   * @param {boolean} [config.teardown=true] - Whether to destroy components after each test (default: true)
   * @returns {TestBed} Configured TestBed instance for chaining or direct use
   *
   * @example
   * ```typescript
   * TestBedSetup.configureBasicComponentTest({
   *   imports: [SharedModule],
   *   declarations: [LabelFormComponent],
   * });
   *
   * const fixture = TestBed.createComponent(LabelFormComponent);
   * const component = fixture.componentInstance;
   * expect(component).toBeTruthy();
   * ```
   */
  static configureBasicComponentTest(config: {
    imports?: any[];
    declarations?: any[];
    providers?: any[];
    teardown?: {destroyAfterEach?: boolean};
  }): TestBed {
    const testBedConfig = {
      imports: [BrowserModule, NoopAnimationsModule, ...(config.imports || [])],
      declarations: config.declarations || [],
      providers: config.providers || [],
      teardown: config.teardown || {destroyAfterEach: false},
    };

    return TestBed.configureTestingModule(testBedConfig);
  }

  /**
   * Configures TestBed for component tests that require services and HTTP mocking.
   *
   * Includes BrowserModule, HttpClientModule, NoopAnimationsModule, and sets up
   * HttpTestingController support. Perfect for components that depend on services
   * making HTTP calls. Services can be mocked using providers configuration.
   *
   * @param {Object} config - TestBed configuration options
   * @param {any[]} [config.imports] - Additional modules to import
   * @param {any[]} [config.declarations] - Components/directives to declare
   * @param {any[]} [config.providers] - Services and mock implementations
   * @param {boolean} [config.teardown=true] - Whether to destroy components after each test (default: true)
   * @returns {TestBed} Configured TestBed instance
   *
   * @example
   * ```typescript
   * TestBedSetup.configureComponentWithServices({
   *   imports: [SharedModule],
   *   declarations: [ClusterListComponent],
   *   providers: [
   *     {provide: ClusterService, useClass: ClusterMockService},
   *     {provide: ProjectService, useClass: ProjectMockService},
   *   ],
   * });
   *
   * const httpMock = TestBed.inject(HttpTestingController);
   * const fixture = TestBed.createComponent(ClusterListComponent);
   *
   * // Now component can make HTTP calls, controlled by httpMock
   * const req = httpMock.expectOne('/api/v2/clusters');
   * req.flush([mockCluster]);
   * httpMock.verify();
   * ```
   */
  static configureComponentWithServices(config: {
    imports?: any[];
    declarations?: any[];
    providers?: any[];
    teardown?: {destroyAfterEach?: boolean};
  }): TestBed {
    const testBedConfig = {
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, ...(config.imports || [])],
      declarations: config.declarations || [],
      providers: config.providers || [],
      teardown: config.teardown || {destroyAfterEach: false},
    };

    return TestBed.configureTestingModule(testBedConfig);
  }

  /**
   * Configures TestBed for component tests that use Angular Material Dialog.
   *
   * Includes everything from configureComponentWithServices plus MatDialog setup.
   * Use this when testing components that open or manage dialogs using MatDialog.open().
   *
   * @param {Object} config - TestBed configuration options
   * @param {any[]} [config.imports] - Additional modules to import
   * @param {any[]} [config.declarations] - Components/directives/dialogs to declare
   * @param {any[]} [config.providers] - Services and mock implementations
   * @param {boolean} [config.teardown=true] - Whether to destroy components after each test (default: true)
   * @returns {TestBed} Configured TestBed instance
   *
   * @example
   * ```typescript
   * TestBedSetup.configureComponentWithDialog({
   *   imports: [SharedModule, MatDialogModule],
   *   declarations: [MyComponent, MyDialogComponent],
   *   providers: [
   *     {provide: MatDialog, useClass: MatDialogMock},
   *   ],
   * });
   *
   * const matDialog = TestBed.inject(MatDialog);
   * const fixture = TestBed.createComponent(MyComponent);
   * component.openDialog();
   *
   * // Verify dialog was opened with correct data
   * expect(matDialog.open).toHaveBeenCalled();
   * ```
   */
  static configureComponentWithDialog(config: {
    imports?: any[];
    declarations?: any[];
    providers?: any[];
    teardown?: {destroyAfterEach?: boolean};
  }): TestBed {
    const testBedConfig = {
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, ...(config.imports || [])],
      declarations: config.declarations || [],
      providers: config.providers || [],
      teardown: config.teardown || {destroyAfterEach: false},
    };

    return TestBed.configureTestingModule(testBedConfig);
  }

  /**
   * Configures TestBed for feature module tests.
   *
   * Sets up TestBed to test an entire feature module with all its imports,
   * declarations, and providers. Useful for integration testing of feature modules
   * or testing multiple components together.
   *
   * @param {Object} config - TestBed configuration options
   * @param {Type} config.featureModule - The feature module to import
   * @param {any[]} [config.additionalImports] - Extra modules to import alongside feature module
   * @param {any[]} [config.declarations] - Additional components to declare
   * @param {any[]} [config.providers] - Services and mock implementations
   * @param {boolean} [config.teardown=true] - Whether to destroy components after each test (default: true)
   * @returns {TestBed} Configured TestBed instance
   *
   * @example
   * ```typescript
   * TestBedSetup.configureFeatureModule({
   *   featureModule: ClusterModule,
   *   additionalImports: [SharedModule],
   *   providers: [
   *     {provide: ClusterService, useClass: ClusterMockService},
   *   ],
   * });
   *
   * // Now all components from ClusterModule are available for testing
   * const fixture = TestBed.createComponent(ClusterListComponent);
   * expect(fixture.componentInstance).toBeTruthy();
   * ```
   */
  static configureFeatureModule(config: {
    featureModule: Type<any>;
    additionalImports?: any[];
    declarations?: any[];
    providers?: any[];
    teardown?: {destroyAfterEach?: boolean};
  }): TestBed {
    const testBedConfig = {
      imports: [
        BrowserModule,
        HttpClientModule,
        NoopAnimationsModule,
        config.featureModule,
        ...(config.additionalImports || []),
      ],
      declarations: config.declarations || [],
      providers: config.providers || [],
      teardown: config.teardown || {destroyAfterEach: false},
    };

    return TestBed.configureTestingModule(testBedConfig);
  }

  /**
   * Compiles component declarations and prepares TestBed for test execution.
   *
   * Call this after configuring TestBed with any of the factory functions above.
   * Compiling components is required before creating component fixtures.
   *
   * @returns {Promise<void>} Promise that resolves when compilation is complete
   *
   * @example
   * ```typescript
   * TestBedSetup.configureBasicComponentTest({
   *   imports: [SharedModule],
   *   declarations: [MyComponent],
   * });
   *
   * await TestBedSetup.compileComponents();
   *
   * const fixture = TestBed.createComponent(MyComponent);
   * ```
   */
  static async compileComponents(): Promise<void> {
    return TestBed.compileComponents();
  }

  /**
   * Creates a service instance from the TestBed injector.
   *
   * Convenience method to get a service from TestBed with type safety.
   * Use after configuring TestBed and optionally calling compileComponents().
   *
   * @template T - Type of service to inject
   * @param {Type<T>} serviceType - Class/token for the service to inject
   * @returns {T} Instance of the requested service
   *
   * @example
   * ```typescript
   * TestBedSetup.configureComponentWithServices({
   *   providers: [{provide: MyService, useClass: MyServiceMock}],
   * });
   *
   * const myService = TestBedSetup.injectService(MyService);
   * expect(myService).toBeTruthy();
   * ```
   */
  static injectService<T>(serviceType: Type<T>): T {
    return TestBed.inject(serviceType);
  }
}
