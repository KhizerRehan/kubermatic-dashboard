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

/**
 * Mock implementation of AuthService for testing authentication and authorization.
 *
 * Simulates OIDC authentication, token management, and logout flows without
 * real authentication provider integration.
 *
 * Advanced Testing Features:
 * - State control: Set isAuth to simulate authenticated/unauthenticated states
 * - Custom tokens: Override bearer token and username for different user scenarios
 * - Call tracking: Track how many times authentication methods were called
 * - Error simulation: Configure logout to return error for error handling tests
 */
@Injectable()
export class AuthMockService {
  /**
   * Public property to control authentication state in tests.
   * Set to true to simulate authenticated user, false for unauthenticated.
   */
  isAuth = true;

  /** @private Tracks how many times authenticated() was called */
  private _authenticatedCallCount = 0;

  /** @private Tracks how many times getBearerToken() was called */
  private _getBearerTokenCallCount = 0;

  /** @private Tracks how many times getUsername() was called */
  private _getUsernameCallCount = 0;

  /** @private Tracks how many times logout() was called */
  private _logoutCallCount = 0;

  /** @private Custom bearer token override */
  private _customBearerToken: string | null = null;

  /** @private Custom username override */
  private _customUsername: string | null = null;

  /** @private Flag to simulate logout errors */
  private _logoutShouldError = false;

  /** @private Error message to return on logout failure */
  private _logoutErrorMessage = 'Logout failed';

  /**
   * Returns OIDC provider URL for external authentication.
   *
   * Mock returns empty string (no external provider in tests).
   * Tests should not depend on real OIDC provider URLs.
   *
   * @returns {string} Empty string (no OIDC provider)
   *
   * @example
   * ```typescript
   * const url = authMock.getOIDCProviderURL();
   * expect(url).toBe('');
   * ```
   */
  getOIDCProviderURL(): string {
    return '';
  }

  /**
   * Returns whether user is currently authenticated.
   * Returns the value of isAuth property. Tracks call count for assertion purposes.
   */
  authenticated(): boolean {
    this._authenticatedCallCount++;
    return this.isAuth;
  }

  /**
   * Returns mock JWT bearer token for API requests.
   * Returns 'token' by default or custom if overridden. Tracks call count.
   */
  getBearerToken(): string {
    this._getBearerTokenCallCount++;
    return this._customBearerToken ?? 'token';
  }

  /**
   * Returns currently authenticated username.
   * Returns 'testUser' by default or custom if overridden. Tracks call count.
   */
  getUsername(): string {
    this._getUsernameCallCount++;
    return this._customUsername ?? 'testUser';
  }

  /**
   * Simulates user logout.
   * Returns observable emitting true on success or error if configured. Tracks call count.
   */
  logout(): Observable<boolean> {
    this._logoutCallCount++;
    if (this._logoutShouldError) {
      return new Observable(subscriber => {
        subscriber.error(new Error(this._logoutErrorMessage));
      });
    }
    return of(true);
  }

  /**
   * Simulates OIDC provider logout. No-op in mock.
   */
  oidcProviderLogout(): void {}

  /**
   * Sets OIDC nonce for security validation. No-op in mock.
   */
  setNonce(): void {}

  // ===== Call Tracking Properties =====

  /**
   * Gets the number of times authenticated() was called.
   */
  get authenticatedCallCount(): number {
    return this._authenticatedCallCount;
  }

  /**
   * Gets the number of times getBearerToken() was called.
   *
   * @returns {number} Count of getBearerToken() calls
   */
  get getBearerTokenCallCount(): number {
    return this._getBearerTokenCallCount;
  }

  /**
   * Gets the number of times getUsername() was called.
   *
   * @returns {number} Count of getUsername() calls
   */
  get getUsernameCallCount(): number {
    return this._getUsernameCallCount;
  }

  /**
   * Gets the number of times logout() was called.
   *
   * @returns {number} Count of logout() calls
   */
  get logoutCallCount(): number {
    return this._logoutCallCount;
  }

  // ===== Configuration Methods =====

  /**
   * Sets a custom bearer token to be returned by getBearerToken().
   */
  setCustomBearerToken(token: string): void {
    this._customBearerToken = token;
  }

  /**
   * Clears the custom bearer token override, reverting to default 'token'.
   */
  clearCustomBearerToken(): void {
    this._customBearerToken = null;
  }

  /**
   * Sets a custom username to be returned by getUsername().
   */
  setCustomUsername(username: string): void {
    this._customUsername = username;
  }

  /**
   * Clears the custom username override, reverting to default 'testUser'.
   */
  clearCustomUsername(): void {
    this._customUsername = null;
  }

  /**
   * Configures logout() to return an error instead of success.
   */
  setLogoutError(shouldError: boolean, errorMessage: string = 'Logout failed'): void {
    this._logoutShouldError = shouldError;
    this._logoutErrorMessage = errorMessage;
  }

  /**
   * Resets all call tracking counters.
   */
  resetCallTracking(): void {
    this._authenticatedCallCount = 0;
    this._getBearerTokenCallCount = 0;
    this._getUsernameCallCount = 0;
    this._logoutCallCount = 0;
  }

  /**
   * Resets all custom overrides and call tracking to defaults.
   */
  resetAll(): void {
    this.isAuth = true;
    this._customBearerToken = null;
    this._customUsername = null;
    this._logoutShouldError = false;
    this._logoutErrorMessage = 'Logout failed';
    this.resetCallTracking();
  }
}
