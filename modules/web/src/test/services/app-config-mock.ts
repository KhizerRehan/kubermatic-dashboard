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
import {CustomLink} from '@shared/entity/settings';
import {VersionInfo} from '@shared/entity/version-info';
import {Config, EndOfLife, UserGroupConfig} from '@shared/model/Config';
import {fakeUserGroupConfig} from '../data/user-group-config';

/**
 * Mock implementation of AppConfigService for testing.
 *
 * Provides application configuration, version information, and feature flags
 * without making real API calls. Useful for testing components that depend on
 * application-level configuration.
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: AppConfigService, useClass: AppConfigMockService}
 *   ]
 * });
 * const mockConfig = TestBed.inject(AppConfigService);
 * const version = mockConfig.getGitVersion(); // Returns v1.0.0 mock
 * ```
 *
 * @see {@link AppConfigService} - Real service implementation
 * @see {@link test/data/user-group-config} - Source of fake user group config
 */
@Injectable()
export class AppConfigMockService {
  private readonly _refreshTimeBase = 200;

  /**
   * Returns application configuration settings.
   *
   * Mock returns minimal configuration with OpenStack wizard settings disabled.
   * Override this method in custom mocks to test different configurations.
   *
   * @returns {Config} Application configuration object
   *
   * @example
   * ```typescript
   * const config = mockService.getConfig();
   * expect(config.openstack.wizard_use_default_user).toBe(false);
   * ```
   */
  getConfig(): Config {
    return {
      openstack: {
        wizard_use_default_user: false,
      },
    };
  }

  /**
   * Returns RBAC user group configuration.
   *
   * Provides group-based access control settings for testing authorization
   * and permission features. Uses fakeUserGroupConfig() factory.
   *
   * @returns {UserGroupConfig} Object mapping group names to their configurations
   *
   * @example
   * ```typescript
   * const groupConfig = mockService.getUserGroupConfig();
   * const adminConfig = groupConfig['admin'];
   * expect(adminConfig.permissions).toContain('cluster.create');
   * ```
   */
  getUserGroupConfig(): UserGroupConfig {
    return fakeUserGroupConfig();
  }

  /**
   * Returns build version and git metadata information.
   *
   * Mock returns a hardcoded version v1.0.0 with sample git information.
   * Useful for testing version display, update checks, and version-dependent features.
   *
   * @returns {VersionInfo} Object containing version strings and git metadata
   * @returns {string} .raw - Raw version string ('v1.0.0')
   * @returns {string} .semverString - Semantic version ('v1.0.0')
   * @returns {string} .humanReadable - Human-readable version ('v1.0.0')
   * @returns {string} .hash - Git commit hash ('1234abcd')
   * @returns {string} .tag - Git tag ('v1.0.0')
   * @returns {number} .distance - Commits since tag (10)
   * @returns {boolean} .dirty - Whether working tree has changes (true)
   *
   * @example
   * ```typescript
   * const version = mockService.getGitVersion();
   * expect(version.semverString).toBe('v1.0.0');
   * expect(version.hash).toBe('1234abcd');
   * ```
   */
  getGitVersion(): VersionInfo {
    return {
      dirty: true,
      distance: 10,
      hash: '1234abcd',
      raw: 'v1.0.0',
      semverString: 'v1.0.0',
      humanReadable: 'v1.0.0',
      suffix: '',
      tag: 'v1.0.0',
    } as VersionInfo;
  }

  /**
   * Returns array of custom navigation links.
   *
   * Mock returns empty array. Override in custom mocks to test custom link
   * rendering and navigation behavior.
   *
   * @returns {CustomLink[]} Array of custom navigation links (empty in mock)
   *
   * @example
   * ```typescript
   * const links = mockService.getCustomLinks();
   * expect(links.length).toBe(0);
   * ```
   */
  getCustomLinks(): CustomLink[] {
    return [];
  }

  /**
   * Returns the base refresh time interval for data polling.
   *
   * Mock returns 200ms for fast test execution. In real service, this is
   * multiplied by refresh multiplier for actual poll intervals.
   *
   * @returns {number} Base refresh interval in milliseconds (200)
   *
   * @example
   * ```typescript
   * const baseRefresh = mockService.getRefreshTimeBase();
   * expect(baseRefresh).toBe(200); // Fast for tests
   * ```
   */
  getRefreshTimeBase(): number {
    return this._refreshTimeBase;
  }

  /**
   * Returns end-of-life (EOL) configuration for versions.
   *
   * Mock returns empty object. Useful for testing EOL warnings and
   * version upgrade notifications.
   *
   * @returns {EndOfLife} Object mapping version strings to EOL dates
   *
   * @example
   * ```typescript
   * const eolConfig = mockService.getEndOfLifeConfig();
   * expect(Object.keys(eolConfig).length).toBe(0);
   * ```
   */
  getEndOfLifeConfig(): EndOfLife {
    return {};
  }
}
