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

import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {Constraint, ConstraintTemplate, GatekeeperConfig} from '@shared/entity/opa';
import {fakeConstraintTemplates} from '../data/opa';

/**
 * Mock implementation of OPAService for testing OPA/Gatekeeper constraint management.
 *
 * Provides constraint templates, constraints, and gatekeeper configuration operations
 * without real API calls. Useful for testing constraint creation, deletion, and
 * gatekeeper config management features.
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: OPAService, useClass: OPAMockService}
 *   ]
 * });
 * const opaMock = TestBed.inject(OPAService) as OPAMockService;
 * ```
 *
 * @see {@link OPAService} - Real OPA service implementation
 * @see {@link test/data/opa} - Source of test data
 */
@Injectable()
export class OPAMockService {
  /**
   * Gets all constraint templates (read-only).
   *
   * Mock returns array of 2 fake constraint templates.
   * Constraint templates define the structure of constraints.
   *
   * @returns {Observable<ConstraintTemplate[]>} Observable emitting constraint templates
   *
   * @example
   * ```typescript
   * opaMock.constraintTemplates.subscribe(templates => {
   *   expect(templates.length).toBeGreaterThan(0);
   *   expect(templates[0].name).toBeTruthy();
   * });
   * ```
   */
  get constraintTemplates(): Observable<ConstraintTemplate[]> {
    return of(fakeConstraintTemplates());
  }

  /**
   * Triggers a refresh of constraint templates.
   *
   * Mock is a no-op but available for component compatibility.
   *
   * @example
   * ```typescript
   * opaMock.refreshConstraintTemplates();
   * // Component can test refresh behavior
   * ```
   */
  refreshConstraintTemplates(): void {
    // Mock: no-op refresh
  }

  /**
   * Creates a new constraint template.
   *
   * Mock always returns the input template wrapped in Observable.
   *
   * @param {ConstraintTemplate} template - Template to create
   * @returns {Observable<ConstraintTemplate>} Observable emitting created template
   *
   * @example
   * ```typescript
   * const newTemplate = {...fakeConstraintTemplates()[0]};
   * opaMock.createConstraintTemplate(newTemplate).subscribe(created => {
   *   expect(created.name).toBe(newTemplate.name);
   * });
   * ```
   */
  createConstraintTemplate(template: ConstraintTemplate): Observable<ConstraintTemplate> {
    return of(template);
  }

  /**
   * Patches an existing constraint template.
   *
   * Mock returns the patched template.
   *
   * @param {string} _ctName - Template name (ignored)
   * @param {ConstraintTemplate} patch - Patch to apply
   * @returns {Observable<ConstraintTemplate>} Observable emitting patched template
   *
   * @example
   * ```typescript
   * opaMock.patchConstraintTemplate('k8sdenyname', patch).subscribe(updated => {
   *   expect(updated).toBeTruthy();
   * });
   * ```
   */
  patchConstraintTemplate(_ctName: string, patch: ConstraintTemplate): Observable<ConstraintTemplate> {
    return of(patch);
  }

  /**
   * Deletes a constraint template.
   *
   * Mock always returns successful deletion (void Observable).
   *
   * @param {string} _ctName - Template name to delete (ignored)
   * @returns {Observable<void>} Observable emitting void on success
   *
   * @example
   * ```typescript
   * opaMock.deleteConstraintTemplate('k8sdenyname').subscribe(() => {
   *   expect(component.templates.length).toBeLessThan(previousCount);
   * });
   * ```
   */
  deleteConstraintTemplate(_ctName: string): Observable<void> {
    return of(void 0);
  }

  /**
   * Gets constraints for a specific cluster.
   *
   * Mock returns empty array by default.
   * Override in custom mocks to return specific constraints.
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @returns {Observable<Constraint[]>} Observable emitting constraint array
   *
   * @example
   * ```typescript
   * opaMock.constraints('proj-1', 'cluster-1').subscribe(constraints => {
   *   expect(Array.isArray(constraints)).toBe(true);
   * });
   * ```
   */
  constraints(_projectId: string, _clusterId: string): Observable<Constraint[]> {
    return of([]);
  }

  /**
   * Triggers a refresh of constraints.
   *
   * Mock is a no-op but available for component compatibility.
   *
   * @example
   * ```typescript
   * opaMock.refreshConstraint();
   * ```
   */
  refreshConstraint(): void {
    // Mock: no-op refresh
  }

  /**
   * Creates a new constraint in a cluster.
   *
   * Mock always returns the input constraint wrapped in Observable.
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {Constraint} constraint - Constraint to create
   * @returns {Observable<Constraint>} Observable emitting created constraint
   *
   * @example
   * ```typescript
   * const newConstraint = {...constraints[0]};
   * opaMock.createConstraint('proj-1', 'cluster-1', newConstraint).subscribe(created => {
   *   expect(created.name).toBe(newConstraint.name);
   * });
   * ```
   */
  createConstraint(_projectId: string, _clusterId: string, constraint: Constraint): Observable<Constraint> {
    return of(constraint);
  }

  /**
   * Patches an existing constraint.
   *
   * Mock returns the patched constraint.
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {string} _name - Constraint name (ignored)
   * @param {Constraint} patch - Patch to apply
   * @returns {Observable<Constraint>} Observable emitting patched constraint
   *
   * @example
   * ```typescript
   * opaMock.patchConstraint('proj-1', 'cluster-1', 'constraint-1', patch).subscribe(updated => {
   *   expect(updated).toBeTruthy();
   * });
   * ```
   */
  patchConstraint(_projectId: string, _clusterId: string, _name: string, patch: Constraint): Observable<Constraint> {
    return of(patch);
  }

  /**
   * Deletes a constraint from a cluster.
   *
   * Mock always returns successful deletion (void Observable).
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {string} _name - Constraint name to delete (ignored)
   * @returns {Observable<void>} Observable emitting void on success
   *
   * @example
   * ```typescript
   * opaMock.deleteConstraint('proj-1', 'cluster-1', 'constraint-1').subscribe(() => {
   *   expect(component.constraints.length).toBeLessThan(previousCount);
   * });
   * ```
   */
  deleteConstraint(_projectId: string, _clusterId: string, _name: string): Observable<void> {
    return of(void 0);
  }

  /**
   * Gets default constraints (global constraints).
   *
   * Mock returns empty array by default.
   *
   * @returns {Observable<Constraint[]>} Observable emitting default constraints
   *
   * @example
   * ```typescript
   * opaMock.defaultConstraints.subscribe(constraints => {
   *   expect(Array.isArray(constraints)).toBe(true);
   * });
   * ```
   */
  get defaultConstraints(): Observable<Constraint[]> {
    return of([]);
  }

  /**
   * Triggers a refresh of default constraints.
   *
   * Mock is a no-op but available for component compatibility.
   *
   * @example
   * ```typescript
   * opaMock.refreshDefaultConstraints();
   * ```
   */
  refreshDefaultConstraints(): void {
    // Mock: no-op refresh
  }

  /**
   * Creates a new default constraint.
   *
   * Mock always returns the input constraint.
   *
   * @param {Constraint} constraint - Constraint to create
   * @returns {Observable<Constraint>} Observable emitting created constraint
   *
   * @example
   * ```typescript
   * opaMock.createDefaultConstraint(newConstraint).subscribe(created => {
   *   expect(created.name).toBe(newConstraint.name);
   * });
   * ```
   */
  createDefaultConstraint(constraint: Constraint): Observable<Constraint> {
    return of(constraint);
  }

  /**
   * Patches an existing default constraint.
   *
   * Mock returns the patched constraint.
   *
   * @param {string} _name - Constraint name (ignored)
   * @param {Constraint} patch - Patch to apply
   * @returns {Observable<Constraint>} Observable emitting patched constraint
   *
   * @example
   * ```typescript
   * opaMock.patchDefaultConstraint('constraint-1', patch).subscribe(updated => {
   *   expect(updated).toBeTruthy();
   * });
   * ```
   */
  patchDefaultConstraint(_name: string, patch: Constraint): Observable<Constraint> {
    return of(patch);
  }

  /**
   * Deletes a default constraint.
   *
   * Mock always returns successful deletion (void Observable).
   *
   * @param {string} _name - Constraint name to delete (ignored)
   * @returns {Observable<void>} Observable emitting void on success
   *
   * @example
   * ```typescript
   * opaMock.deleteDefaultConstraint('constraint-1').subscribe(() => {
   *   expect(component.defaultConstraints.length).toBeLessThan(previousCount);
   * });
   * ```
   */
  deleteDefaultConstraint(_name: string): Observable<void> {
    return of(void 0);
  }

  /**
   * Gets gatekeeper configuration for a cluster.
   *
   * Mock returns undefined by default (indicating no config set).
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @returns {Observable<GatekeeperConfig>} Observable emitting gatekeeper config
   *
   * @example
   * ```typescript
   * opaMock.gatekeeperConfig('proj-1', 'cluster-1').subscribe(config => {
   *   expect(config === undefined || config.spec).toBeTruthy();
   * });
   * ```
   */
  gatekeeperConfig(_projectId: string, _clusterId: string): Observable<GatekeeperConfig> {
    return of(undefined);
  }

  /**
   * Triggers a refresh of gatekeeper configuration.
   *
   * Mock is a no-op but available for component compatibility.
   *
   * @example
   * ```typescript
   * opaMock.refreshGatekeeperConfig();
   * ```
   */
  refreshGatekeeperConfig(): void {
    // Mock: no-op refresh
  }

  /**
   * Creates gatekeeper configuration for a cluster.
   *
   * Mock returns the input config.
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {GatekeeperConfig} config - Config to create
   * @returns {Observable<GatekeeperConfig>} Observable emitting created config
   *
   * @example
   * ```typescript
   * opaMock.createGatekeeperConfig('proj-1', 'cluster-1', config).subscribe(created => {
   *   expect(created).toBeTruthy();
   * });
   * ```
   */
  createGatekeeperConfig(_projectId: string, _clusterId: string, config: GatekeeperConfig): Observable<GatekeeperConfig> {
    return of(config);
  }

  /**
   * Patches gatekeeper configuration.
   *
   * Mock returns the patched config.
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {GatekeeperConfig} patch - Patch to apply
   * @returns {Observable<GatekeeperConfig>} Observable emitting patched config
   *
   * @example
   * ```typescript
   * opaMock.patchGatekeeperConfig('proj-1', 'cluster-1', patch).subscribe(updated => {
   *   expect(updated).toBeTruthy();
   * });
   * ```
   */
  patchGatekeeperConfig(_projectId: string, _clusterId: string, patch: GatekeeperConfig): Observable<GatekeeperConfig> {
    return of(patch);
  }

  /**
   * Deletes gatekeeper configuration from a cluster.
   *
   * Mock always returns successful deletion (void Observable).
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @returns {Observable<void>} Observable emitting void on success
   *
   * @example
   * ```typescript
   * opaMock.deleteGatekeeperConfig('proj-1', 'cluster-1').subscribe(() => {
   *   expect(component.hasGatekeeperConfig).toBe(false);
   * });
   * ```
   */
  deleteGatekeeperConfig(_projectId: string, _clusterId: string): Observable<void> {
    return of(void 0);
  }

  /**
   * Gets the violation page index for a constraint.
   *
   * Mock returns undefined indicating no page index has been saved.
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {string} _constraintName - Constraint name (ignored)
   * @returns {number} Page index or undefined
   *
   * @example
   * ```typescript
   * const pageIndex = opaMock.getViolationPageIndex('proj-1', 'cluster-1', 'constraint-1');
   * expect(pageIndex === undefined || pageIndex >= 0).toBe(true);
   * ```
   */
  getViolationPageIndex(_projectId: string, _clusterId: string, _constraintName: string): number {
    return undefined;
  }

  /**
   * Saves the violation page index for a constraint.
   *
   * Mock is a no-op but allows components to call this method.
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {string} _constraintName - Constraint name (ignored)
   * @param {number} _pageIndex - Page index to save (ignored)
   *
   * @example
   * ```typescript
   * opaMock.saveViolationPageIndex('proj-1', 'cluster-1', 'constraint-1', 2);
   * // Component can test pagination behavior
   * ```
   */
  saveViolationPageIndex(_projectId: string, _clusterId: string, _constraintName: string, _pageIndex: number): void {
    // Mock: no-op save
  }
}
