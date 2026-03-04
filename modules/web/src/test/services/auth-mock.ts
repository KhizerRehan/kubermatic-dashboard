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
 * **Advanced Testing Features:**
 * - State control: Set isAuth to simulate authenticated/unauthenticated states
 * - Custom tokens: Override bearer token and username for different user scenarios
 * - Call tracking: Track how many times authentication methods were called
 * - Error simulation: Configure logout to return error for error handling tests
 *
 * @example
 * ```typescript
 * // Basic authentication state control
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: Auth, useClass: AuthMockService}
 *   ]
 * });
 * const authMock = TestBed.inject(Auth) as AuthMockService;
 * authMock.isAuth = false; // Test unauthenticated state
 * fixture.detectChanges();
 * expect(component.showLoginPage).toBe(true);
 * ```
 *
 * @example
 * ```typescript
 * // Testing with custom user
 * const authMock = TestBed.inject(Auth) as AuthMockService;
 * authMock.setCustomUsername('admin@example.com');
 * authMock.setCustomBearerToken('custom-jwt-token-123');
 * expect(authMock.getUsername()).toBe('admin@example.com');
 * expect(authMock.getBearerToken()).toBe('custom-jwt-token-123');
 * ```
 *
 * @example
 * ```typescript
 * // Call tracking
 * const authMock = TestBed.inject(Auth) as AuthMockService;
 * authMock.authenticated();
 * authMock.getBearerToken();
 * expect(authMock.authenticatedCallCount).toBe(1);
 * expect(authMock.getBearerTokenCallCount).toBe(1);
 * ```
 *
 * @see {@link Auth} - Real authentication service
 */
@Injectable()
export class AuthMockService {
  /**
   * Public property to control authentication state in tests.
   *
   * Set to true to simulate authenticated user, false for unauthenticated.
   * When changed, update component state via fixture.detectChanges().
   *
   * @type {boolean}
   * @default true
   *
   * @example
   * ```typescript
   * authMock.isAuth = false;
   * fixture.detectChanges();
   * expect(component.showLoginPage).toBe(true);
   * ```
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
   *
   * Returns the value of isAuth property. Set isAuth to control
   * whether component sees user as authenticated.
   * Automatically tracks call count for assertion purposes.
   *
   * @returns {boolean} Authentication state (from isAuth property)
   *
   * @example
   * ```typescript
   * expect(authMock.authenticated()).toBe(true);
   * authMock.isAuth = false;
   * expect(authMock.authenticated()).toBe(false);
   * ```
   *
   * @example
   * ```typescript
   * // With call tracking
   * authMock.authenticated();
   * authMock.authenticated();
   * expect(authMock.authenticatedCallCount).toBe(2);
   * ```
   */
  authenticated(): boolean {
    this._authenticatedCallCount++;
    return this.isAuth;
  }

  /**
   * Returns mock JWT bearer token for API requests.
   *
   * Mock returns 'token' string by default. Override with setCustomBearerToken()
   * to test scenarios with different tokens (e.g., expired token, specific token format).
   * Automatically tracks call count for assertion purposes.
   *
   * @returns {string} Mock bearer token ('token' or custom if overridden)
   *
   * @example
   * ```typescript
   * const token = authMock.getBearerToken();
   * expect(token).toBe('token');
   * expect(headers['Authorization']).toBe('Bearer token');
   * ```
   *
   * @example
   * ```typescript
   * // With custom token
   * authMock.setCustomBearerToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
   * expect(authMock.getBearerToken()).toContain('eyJ');
   * ```
   */
  getBearerToken(): string {
    this._getBearerTokenCallCount++;
    return this._customBearerToken ?? 'token';
  }

  /**
   * Returns currently authenticated username.
   *
   * Mock returns 'testUser' string by default. Override with setCustomUsername()
   * to test different user identities and display names.
   * Automatically tracks call count for assertion purposes.
   *
   * @returns {string} Mock username ('testUser' or custom if overridden)
   *
   * @example
   * ```typescript
   * const username = authMock.getUsername();
   * expect(username).toBe('testUser');
   * expect(component.userDisplayName).toContain('testUser');
   * ```
   *
   * @example
   * ```typescript
   * // With custom username
   * authMock.setCustomUsername('admin@example.com');
   * expect(authMock.getUsername()).toBe('admin@example.com');
   * ```
   */
  getUsername(): string {
    this._getUsernameCallCount++;
    return this._customUsername ?? 'testUser';
  }

  /**
   * Simulates user logout.
   *
   * Returns observable emitting true to indicate successful logout by default.
   * Use setLogoutError() to simulate logout failures for error handling tests.
   * Automatically tracks call count for assertion purposes.
   *
   * @returns {Observable<boolean>} Observable emitting true on success, or error if configured
   *
   * @example
   * ```typescript
   * authMock.logout().subscribe(success => {
   *   expect(success).toBe(true);
   *   expect(router.navigate).toHaveBeenCalledWith(['/login']);
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Simulate logout failure
   * authMock.setLogoutError(true, 'Session expired');
   * authMock.logout().subscribe(
   *   () => { /* Should not reach here */ },
   *   error => {
   *     expect(error).toBe('Session expired');
   *     expect(component.showErrorMessage).toBe(true);
   *   }
   * );
   * ```
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
   * Simulates OIDC provider logout.
   *
   * No-op in mock. In real service, would logout from external
   * OIDC provider. Not needed for tests.
   *
   * @example
   * ```typescript
   * authMock.oidcProviderLogout(); // Does nothing
   * ```
   */
  oidcProviderLogout(): void {}

  /**
   * Sets OIDC nonce for security validation.
   *
   * No-op in mock. Real service uses nonce for OIDC CSRF protection.
   * Not needed in test environment.
   *
   * @example
   * ```typescript
   * authMock.setNonce(); // Does nothing
   * ```
   */
  setNonce(): void {}

  // ===== Call Tracking Properties =====

  /**
   * Gets the number of times authenticated() was called.
   *
   * Useful for verifying that authentication status was checked
   * the expected number of times.
   *
   * @returns {number} Count of authenticated() calls
   *
   * @example
   * ```typescript
   * const authMock = TestBed.inject(Auth) as AuthMockService;
   * authMock.authenticated();
   * authMock.authenticated();
   * expect(authMock.authenticatedCallCount).toBe(2);
   * ```
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
   *
   * Useful for testing with different token formats, expired tokens,
   * or specific token values expected by tests.
   *
   * @param {string} token - Custom bearer token to use
   *
   * @example
   * ```typescript
   * authMock.setCustomBearerToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
   * expect(authMock.getBearerToken()).toContain('eyJ');
   * ```
   */
  setCustomBearerToken(token: string): void {
    this._customBearerToken = token;
  }

  /**
   * Clears the custom bearer token override, reverting to default 'token'.
   *
   * @example
   * ```typescript
   * authMock.setCustomBearerToken('custom');
   * authMock.clearCustomBearerToken();
   * expect(authMock.getBearerToken()).toBe('token');
   * ```
   */
  clearCustomBearerToken(): void {
    this._customBearerToken = null;
  }

  /**
   * Sets a custom username to be returned by getUsername().
   *
   * Useful for testing with different user identities, email addresses,
   * or display names.
   *
   * @param {string} username - Custom username to use
   *
   * @example
   * ```typescript
   * authMock.setCustomUsername('admin@example.com');
   * expect(authMock.getUsername()).toBe('admin@example.com');
   * ```
   */
  setCustomUsername(username: string): void {
    this._customUsername = username;
  }

  /**
   * Clears the custom username override, reverting to default 'testUser'.
   *
   * @example
   * ```typescript
   * authMock.setCustomUsername('admin@example.com');
   * authMock.clearCustomUsername();
   * expect(authMock.getUsername()).toBe('testUser');
   * ```
   */
  clearCustomUsername(): void {
    this._customUsername = null;
  }

  /**
   * Configures logout() to return an error instead of success.
   *
   * Useful for testing error handling in logout flows, such as
   * session expiration, API errors, or network failures.
   *
   * @param {boolean} shouldError - True to make logout fail, false for success
   * @param {string} errorMessage - Error message to emit on logout failure
   *
   * @example
   * ```typescript
   * // Simulate session timeout
   * authMock.setLogoutError(true, 'Session expired');
   * authMock.logout().subscribe(
   *   () => { /* Should not reach */ },
   *   error => expect(error.message).toBe('Session expired')
   * );
   * ```
   */
  setLogoutError(shouldError: boolean, errorMessage: string = 'Logout failed'): void {
    this._logoutShouldError = shouldError;
    this._logoutErrorMessage = errorMessage;
  }

  /**
   * Resets all call tracking counters.
   *
   * Useful in beforeEach() hooks to ensure clean state between tests.
   *
   * @example
   * ```typescript
   * beforeEach(() => {
   *   const authMock = TestBed.inject(Auth) as AuthMockService;
   *   authMock.resetCallTracking();
   *   expect(authMock.authenticatedCallCount).toBe(0);
   * });
   * ```
   */
  resetCallTracking(): void {
    this._authenticatedCallCount = 0;
    this._getBearerTokenCallCount = 0;
    this._getUsernameCallCount = 0;
    this._logoutCallCount = 0;
  }

  /**
   * Resets all custom overrides and call tracking to defaults.
   *
   * Useful for test cleanup or resetting mock state.
   *
   * @example
   * ```typescript
   * afterEach(() => {
   *   const authMock = TestBed.inject(Auth) as AuthMockService;
   *   authMock.resetAll();
   * });
   * ```
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
