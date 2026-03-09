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
 * **Advanced Testing Features:**
 * - Call tracking: Track how many times methods were called and with what arguments
 * - State simulation: Simulate different configuration states (loading, error, success)
 * - Complex returns: Support custom version data and configuration overrides
 *
 * @example
 * ```typescript
 * // Basic usage
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: AppConfigService, useClass: AppConfigMockService}
 *   ]
 * });
 * const mockConfig = TestBed.inject(AppConfigService);
 * const version = mockConfig.getGitVersion(); // Returns v1.0.0 mock
 * ```
 *
 * @example
 * ```typescript
 * // Call tracking
 * const mockConfig = TestBed.inject(AppConfigService) as AppConfigMockService;
 * mockConfig.getConfig();
 * expect(mockConfig.getConfigCallCount).toBe(1);
 * expect(mockConfig.getConfigCallHistory.length).toBe(1);
 * ```
 *
 * @example
 * ```typescript
 * // State simulation with custom version
 * const mockConfig = TestBed.inject(AppConfigService) as AppConfigMockService;
 * mockConfig.setGitVersionOverride({semverString: 'v2.0.0', tag: 'v2.0.0'});
 * const version = mockConfig.getGitVersion();
 * expect(version.semverString).toBe('v2.0.0');
 * ```
 *
 * @example
 * ```typescript
 * // Custom configuration
 * const mockConfig = TestBed.inject(AppConfigService) as AppConfigMockService;
 * mockConfig.setConfigOverride({openstack: {wizard_use_default_user: true}});
 * const config = mockConfig.getConfig();
 * expect(config.openstack.wizard_use_default_user).toBe(true);
 * ```
 *
 * @see {@link AppConfigService} - Real service implementation
 * @see {@link test/data/user-group-config} - Source of fake user group config
 */
@Injectable()
export class AppConfigMockService {
  private readonly _refreshTimeBase = 200;

  /** @private Tracks how many times getConfig() was called */
  private _getConfigCallCount = 0;

  /** @private Tracks how many times getGitVersion() was called */
  private _getGitVersionCallCount = 0;

  /** @private Stores call history for getConfig() */
  private _getConfigCallHistory: Array<{timestamp: Date}> = [];

  /** @private Stores call history for getGitVersion() */
  private _getGitVersionCallHistory: Array<{timestamp: Date}> = [];

  /** @private Custom configuration override */
  private _configOverride: Partial<ReturnType<AppConfigMockService['getConfig']>> | null = null;

  /** @private Custom version info override */
  private _versionOverride: Partial<VersionInfo> | null = null;

  /**
   * Returns application configuration settings.
   *
   * Mock returns minimal configuration with OpenStack wizard settings disabled.
   * Use setConfigOverride() to customize the returned configuration for specific test scenarios.
   * Automatically tracks call count and history for assertion purposes.
   *
   * @returns {Config} Application configuration object (or overridden config if set)
   *
   * @example
   * ```typescript
   * const config = mockService.getConfig();
   * expect(config.openstack.wizard_use_default_user).toBe(false);
   * ```
   *
   * @example
   * ```typescript
   * // With override
   * mockService.setConfigOverride({openstack: {wizard_use_default_user: true}});
   * const config = mockService.getConfig();
   * expect(config.openstack.wizard_use_default_user).toBe(true);
   * ```
   */
  getConfig(): Config {
    this._getConfigCallCount++;
    this._getConfigCallHistory.push({timestamp: new Date()});

    const defaultConfig: Config = {
      openstack: {
        wizard_use_default_user: false,
      },
    };

    if (this._configOverride) {
      return {...defaultConfig, ...this._configOverride};
    }
    return defaultConfig;
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
   * Use setGitVersionOverride() to customize the returned version for specific test scenarios.
   * Automatically tracks call count and history for assertion purposes.
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
   *
   * @example
   * ```typescript
   * // With override for testing newer version
   * mockService.setGitVersionOverride({semverString: 'v2.0.0', tag: 'v2.0.0'});
   * const version = mockService.getGitVersion();
   * expect(version.semverString).toBe('v2.0.0');
   * ```
   */
  getGitVersion(): VersionInfo {
    this._getGitVersionCallCount++;
    this._getGitVersionCallHistory.push({timestamp: new Date()});

    const defaultVersion: VersionInfo = {
      dirty: true,
      distance: 10,
      hash: '1234abcd',
      raw: 'v1.0.0',
      semverString: 'v1.0.0',
      humanReadable: 'v1.0.0',
      suffix: '',
      tag: 'v1.0.0',
    } as VersionInfo;

    if (this._versionOverride) {
      return {...defaultVersion, ...this._versionOverride};
    }
    return defaultVersion;
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

  // ===== Call Tracking Methods =====

  /**
   * Gets the number of times getConfig() was called.
   *
   * Useful for verifying that configuration was requested
   * the expected number of times in component initialization.
   *
   * @returns {number} Count of getConfig() calls
   *
   * @example
   * ```typescript
   * const mockService = TestBed.inject(AppConfigService) as AppConfigMockService;
   * mockService.getConfig();
   * mockService.getConfig();
   * expect(mockService.getConfigCallCount).toBe(2);
   * ```
   */
  get getConfigCallCount(): number {
    return this._getConfigCallCount;
  }

  /**
   * Gets the call history for getConfig() method.
   *
   * Each entry includes timestamp of when the call occurred.
   * Useful for analyzing call patterns and timing.
   *
   * @returns {Array} Array of call records with timestamps
   *
   * @example
   * ```typescript
   * const mockService = TestBed.inject(AppConfigService) as AppConfigMockService;
   * mockService.getConfig();
   * const history = mockService.getConfigCallHistory;
   * expect(history.length).toBe(1);
   * expect(history[0].timestamp).toBeInstanceOf(Date);
   * ```
   */
  get getConfigCallHistory(): typeof this._getConfigCallHistory {
    return this._getConfigCallHistory;
  }

  /**
   * Gets the number of times getGitVersion() was called.
   *
   * Useful for verifying that version information was requested.
   *
   * @returns {number} Count of getGitVersion() calls
   *
   * @example
   * ```typescript
   * const mockService = TestBed.inject(AppConfigService) as AppConfigMockService;
   * mockService.getGitVersion();
   * expect(mockService.getGitVersionCallCount).toBe(1);
   * ```
   */
  get getGitVersionCallCount(): number {
    return this._getGitVersionCallCount;
  }

  /**
   * Gets the call history for getGitVersion() method.
   *
   * Each entry includes timestamp of when the call occurred.
   *
   * @returns {Array} Array of call records with timestamps
   *
   * @example
   * ```typescript
   * const mockService = TestBed.inject(AppConfigService) as AppConfigMockService;
   * mockService.getGitVersion();
   * const history = mockService.getGitVersionCallHistory;
   * expect(history.length).toBe(1);
   * ```
   */
  get getGitVersionCallHistory(): typeof this._getGitVersionCallHistory {
    return this._getGitVersionCallHistory;
  }

  // ===== Configuration Override Methods =====

  /**
   * Sets a custom configuration override for testing specific scenarios.
   *
   * Overrides are merged with default configuration, allowing partial overrides.
   * Useful for testing components that depend on specific configuration values.
   *
   * @param {Partial<Config>} override - Partial configuration to merge with defaults
   *
   * @example
   * ```typescript
   * const mockService = TestBed.inject(AppConfigService) as AppConfigMockService;
   * mockService.setConfigOverride({openstack: {wizard_use_default_user: true}});
   * const config = mockService.getConfig();
   * expect(config.openstack.wizard_use_default_user).toBe(true);
   * ```
   */
  setConfigOverride(override: Partial<ReturnType<AppConfigMockService['getConfig']>>): void {
    this._configOverride = override;
  }

  /**
   * Clears any configuration override, reverting to default configuration.
   *
   * Resets the mock to return default configuration values.
   *
   * @example
   * ```typescript
   * mockService.setConfigOverride({...});
   * mockService.clearConfigOverride();
   * const config = mockService.getConfig();
   * expect(config.openstack.wizard_use_default_user).toBe(false);
   * ```
   */
  clearConfigOverride(): void {
    this._configOverride = null;
  }

  /**
   * Sets a custom version info override for testing version-dependent features.
   *
   * Overrides are merged with default version info, allowing partial overrides.
   * Useful for testing version displays, upgrade checks, and version-dependent logic.
   *
   * @param {Partial<VersionInfo>} override - Partial version info to merge with defaults
   *
   * @example
   * ```typescript
   * const mockService = TestBed.inject(AppConfigService) as AppConfigMockService;
   * mockService.setGitVersionOverride({semverString: 'v2.0.0', tag: 'v2.0.0'});
   * const version = mockService.getGitVersion();
   * expect(version.semverString).toBe('v2.0.0');
   * ```
   */
  setGitVersionOverride(override: Partial<VersionInfo>): void {
    this._versionOverride = override;
  }

  /**
   * Clears any version info override, reverting to default version.
   *
   * Resets the mock to return default version values (v1.0.0).
   *
   * @example
   * ```typescript
   * mockService.setGitVersionOverride({...});
   * mockService.clearGitVersionOverride();
   * const version = mockService.getGitVersion();
   * expect(version.semverString).toBe('v1.0.0');
   * ```
   */
  clearGitVersionOverride(): void {
    this._versionOverride = null;
  }

  /**
   * Resets all call tracking counters and history.
   *
   * Useful in beforeEach() hooks to ensure clean state between tests.
   *
   * @example
   * ```typescript
   * beforeEach(() => {
   *   const mockService = TestBed.inject(AppConfigService) as AppConfigMockService;
   *   mockService.resetCallTracking();
   *   expect(mockService.getConfigCallCount).toBe(0);
   * });
   * ```
   */
  resetCallTracking(): void {
    this._getConfigCallCount = 0;
    this._getGitVersionCallCount = 0;
    this._getConfigCallHistory = [];
    this._getGitVersionCallHistory = [];
  }
}
