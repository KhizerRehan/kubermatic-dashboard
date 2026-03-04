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
 * real authentication provider integration. Control authentication state by
 * setting the isAuth property.
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: Auth, useClass: AuthMockService}
 *   ]
 * });
 * const authMock = TestBed.inject(Auth) as AuthMockService;
 * authMock.isAuth = false; // Test unauthenticated state
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
   *
   * @returns {boolean} Authentication state (from isAuth property)
   *
   * @example
   * ```typescript
   * expect(authMock.authenticated()).toBe(true);
   * authMock.isAuth = false;
   * expect(authMock.authenticated()).toBe(false);
   * ```
   */
  authenticated(): boolean {
    return this.isAuth;
  }

  /**
   * Returns mock JWT bearer token for API requests.
   *
   * Mock always returns 'token' string. Components using this for HTTP
   * headers will receive predictable token value.
   *
   * @returns {string} Mock bearer token ('token')
   *
   * @example
   * ```typescript
   * const token = authMock.getBearerToken();
   * expect(token).toBe('token');
   * expect(headers['Authorization']).toBe('Bearer token');
   * ```
   */
  getBearerToken(): string {
    return 'token';
  }

  /**
   * Returns currently authenticated username.
   *
   * Mock returns 'testUser' string. Use in tests for user identity verification
   * and profile display testing.
   *
   * @returns {string} Mock username ('testUser')
   *
   * @example
   * ```typescript
   * const username = authMock.getUsername();
   * expect(username).toBe('testUser');
   * expect(component.userDisplayName).toContain('testUser');
   * ```
   */
  getUsername(): string {
    return 'testUser';
  }

  /**
   * Simulates user logout.
   *
   * Returns observable emitting true to indicate successful logout.
   * Useful for testing logout flows and cleanup operations.
   *
   * @returns {Observable<boolean>} Observable emitting true on logout
   *
   * @example
   * ```typescript
   * authMock.logout().subscribe(success => {
   *   expect(success).toBe(true);
   *   expect(router.navigate).toHaveBeenCalledWith(['/login']);
   * });
   * ```
   */
  logout(): Observable<boolean> {
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
}
