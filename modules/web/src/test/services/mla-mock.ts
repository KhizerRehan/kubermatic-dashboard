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
import {AlertmanagerConfig, RuleGroup} from '@shared/entity/mla';
import {fakeRuleGroups} from '../data/mla';

/**
 * Mock implementation of MLAService for testing Multi-Level Authentication monitoring and alerting.
 *
 * Provides alertmanager configuration and rule group management without real API calls.
 * Useful for testing MLA feature setup, rule creation, and alerting configuration.
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: MLAService, useClass: MLAMockService}
 *   ]
 * });
 * const mlaMock = TestBed.inject(MLAService) as MLAMockService;
 * ```
 *
 * @see {@link MLAService} - Real MLA service implementation
 * @see {@link test/data/mla} - Source of test data
 */
@Injectable()
export class MLAMockService {
  /**
   * Gets alertmanager configuration for a cluster.
   *
   * Mock returns undefined by default (indicating no config set).
   * Override in custom mocks to return specific config.
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @returns {Observable<AlertmanagerConfig>} Observable emitting alertmanager config
   *
   * @example
   * ```typescript
   * mlaMock.alertmanagerConfig('proj-1', 'cluster-1').subscribe(config => {
   *   expect(config === undefined || config.spec).toBeTruthy();
   * });
   * ```
   */
  alertmanagerConfig(_projectId: string, _clusterId: string): Observable<AlertmanagerConfig> {
    return of(undefined);
  }

  /**
   * Triggers a refresh of alertmanager configuration.
   *
   * Mock is a no-op but available for component compatibility.
   *
   * @example
   * ```typescript
   * mlaMock.refreshAlertmanagerConfig();
   * ```
   */
  refreshAlertmanagerConfig(): void {
    // Mock: no-op refresh
  }

  /**
   * Updates alertmanager configuration for a cluster.
   *
   * Mock returns the input config as updated.
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {AlertmanagerConfig} config - Configuration to apply
   * @returns {Observable<AlertmanagerConfig>} Observable emitting updated config
   *
   * @example
   * ```typescript
   * const config = fakeAlertmanagerConfig();
   * mlaMock.putAlertmanagerConfig('proj-1', 'cluster-1', config).subscribe(updated => {
   *   expect(updated).toEqual(config);
   * });
   * ```
   */
  putAlertmanagerConfig(_projectId: string, _clusterId: string, config: AlertmanagerConfig): Observable<AlertmanagerConfig> {
    return of(config);
  }

  /**
   * Resets alertmanager configuration to defaults.
   *
   * Mock always returns successful reset (void Observable).
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @returns {Observable<void>} Observable emitting void on success
   *
   * @example
   * ```typescript
   * mlaMock.resetAlertmanagerConfig('proj-1', 'cluster-1').subscribe(() => {
   *   expect(component.configReset).toBe(true);
   * });
   * ```
   */
  resetAlertmanagerConfig(_projectId: string, _clusterId: string): Observable<void> {
    return of(void 0);
  }

  /**
   * Gets rule groups for a cluster.
   *
   * Mock returns array of 2 fake rule groups by default.
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @returns {Observable<RuleGroup[]>} Observable emitting rule groups
   *
   * @example
   * ```typescript
   * mlaMock.ruleGroups('proj-1', 'cluster-1').subscribe(groups => {
   *   expect(groups.length).toBeGreaterThan(0);
   *   expect(groups[0].name).toBeTruthy();
   * });
   * ```
   */
  ruleGroups(_projectId: string, _clusterId: string): Observable<RuleGroup[]> {
    return of(fakeRuleGroups());
  }

  /**
   * Triggers a refresh of rule groups.
   *
   * Mock is a no-op but available for component compatibility.
   *
   * @example
   * ```typescript
   * mlaMock.refreshRuleGroups();
   * ```
   */
  refreshRuleGroups(): void {
    // Mock: no-op refresh
  }

  /**
   * Creates a new rule group in a cluster.
   *
   * Mock returns the input rule group.
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {RuleGroup} ruleGroup - Rule group to create
   * @returns {Observable<RuleGroup>} Observable emitting created rule group
   *
   * @example
   * ```typescript
   * const newRuleGroup = {...fakeRuleGroups()[0], name: 'my-rules'};
   * mlaMock.createRuleGroup('proj-1', 'cluster-1', newRuleGroup).subscribe(created => {
   *   expect(created.name).toBe('my-rules');
   * });
   * ```
   */
  createRuleGroup(_projectId: string, _clusterId: string, ruleGroup: RuleGroup): Observable<RuleGroup> {
    return of(ruleGroup);
  }

  /**
   * Updates an existing rule group in a cluster.
   *
   * Mock returns the input rule group as updated.
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {RuleGroup} ruleGroup - Rule group with updates
   * @returns {Observable<RuleGroup>} Observable emitting updated rule group
   *
   * @example
   * ```typescript
   * const updated = {...ruleGroups[0], data: 'new-data'};
   * mlaMock.editRuleGroup('proj-1', 'cluster-1', updated).subscribe(result => {
   *   expect(result.data).toBe('new-data');
   * });
   * ```
   */
  editRuleGroup(_projectId: string, _clusterId: string, ruleGroup: RuleGroup): Observable<RuleGroup> {
    return of(ruleGroup);
  }

  /**
   * Deletes a rule group from a cluster.
   *
   * Mock always returns successful deletion (void Observable).
   *
   * @param {string} _projectId - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {string} _ruleGroupName - Rule group name to delete (ignored)
   * @returns {Observable<void>} Observable emitting void on success
   *
   * @example
   * ```typescript
   * mlaMock.deleteRuleGroup('proj-1', 'cluster-1', 'example').subscribe(() => {
   *   expect(component.ruleGroups.length).toBeLessThan(previousCount);
   * });
   * ```
   */
  deleteRuleGroup(_projectId: string, _clusterId: string, _ruleGroupName: string): Observable<void> {
    return of(void 0);
  }

  /**
   * Gets admin rule groups for a seed (global rule groups).
   *
   * Mock returns array of 2 fake rule groups.
   *
   * @param {string} _seed - Seed name (ignored)
   * @returns {Observable<RuleGroup[]>} Observable emitting admin rule groups
   *
   * @example
   * ```typescript
   * mlaMock.adminRuleGroups('us-east-1').subscribe(groups => {
   *   expect(groups.length).toBeGreaterThan(0);
   * });
   * ```
   */
  adminRuleGroups(_seed: string): Observable<RuleGroup[]> {
    return of(fakeRuleGroups());
  }

  /**
   * Triggers a refresh of admin rule groups.
   *
   * Mock is a no-op but available for component compatibility.
   *
   * @example
   * ```typescript
   * mlaMock.refreshAdminRuleGroups();
   * ```
   */
  refreshAdminRuleGroups(): void {
    // Mock: no-op refresh
  }

  /**
   * Creates a new admin rule group for a seed.
   *
   * Mock returns the input rule group.
   *
   * @param {string} _seedName - Seed name (ignored)
   * @param {RuleGroup} ruleGroup - Rule group to create
   * @returns {Observable<RuleGroup>} Observable emitting created rule group
   *
   * @example
   * ```typescript
   * const newRuleGroup = {...fakeRuleGroups()[0], name: 'admin-rules'};
   * mlaMock.createAdminRuleGroup('us-east-1', newRuleGroup).subscribe(created => {
   *   expect(created.name).toBe('admin-rules');
   * });
   * ```
   */
  createAdminRuleGroup(_seedName: string, ruleGroup: RuleGroup): Observable<RuleGroup> {
    return of(ruleGroup);
  }

  /**
   * Updates an existing admin rule group for a seed.
   *
   * Mock returns the input rule group as updated.
   *
   * @param {string} _seedName - Seed name (ignored)
   * @param {RuleGroup} ruleGroup - Rule group with updates
   * @returns {Observable<RuleGroup>} Observable emitting updated rule group
   *
   * @example
   * ```typescript
   * const updated = {...ruleGroups[0], data: 'new-admin-data'};
   * mlaMock.editAdminRuleGroup('us-east-1', updated).subscribe(result => {
   *   expect(result.data).toBe('new-admin-data');
   * });
   * ```
   */
  editAdminRuleGroup(_seedName: string, ruleGroup: RuleGroup): Observable<RuleGroup> {
    return of(ruleGroup);
  }

  /**
   * Deletes an admin rule group from a seed.
   *
   * Mock always returns successful deletion (void Observable).
   *
   * @param {string} _seedName - Seed name (ignored)
   * @param {string} _ruleGroupName - Rule group name to delete (ignored)
   * @returns {Observable<void>} Observable emitting void on success
   *
   * @example
   * ```typescript
   * mlaMock.deleteAdminRuleGroup('us-east-1', 'example').subscribe(() => {
   *   expect(component.adminRuleGroups.length).toBeLessThan(previousCount);
   * });
   * ```
   */
  deleteAdminRuleGroup(_seedName: string, _ruleGroupName: string): Observable<void> {
    return of(void 0);
  }
}
