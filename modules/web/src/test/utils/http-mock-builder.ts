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

import {HttpTestingController, TestRequest} from '@angular/common/http/testing';
import {HttpErrorResponse, HttpResponse} from '@angular/common/http';

/**
 * Helper class for mocking HTTP requests in tests using HttpTestingController.
 *
 * Simplifies HTTP mock setup and verification. Provides factory methods for creating
 * mock responses with different status codes, and helpers for verifying request
 * properties without verbose HttpTestingController usage.
 *
 * Use with HttpClientTestingModule in test setup:
 * ```typescript
 * TestBed.configureTestingModule({
 *   imports: [HttpClientTestingModule],
 *   // ...
 * });
 * ```
 *
 * @example
 * ```typescript
 * let httpMock: HttpTestingController;
 * let builder: HttpMockBuilder;
 *
 * beforeEach(() => {
 *   httpMock = TestBed.inject(HttpTestingController);
 *   builder = new HttpMockBuilder(httpMock);
 * });
 *
 * it('should handle successful request', () => {
 *   builder.expectGetRequest('/api/users', {id: 1, name: 'John'});
 * });
 *
 * it('should handle error response', () => {
 *   builder.expectGetRequest('/api/users', null, 404);
 * });
 * ```
 */
export class HttpMockBuilder {
  /**
   * Creates new HttpMockBuilder instance.
   *
   * @param {HttpTestingController} httpMock - HttpTestingController from test setup
   *
   * @example
   * ```typescript
   * const httpMock = TestBed.inject(HttpTestingController);
   * const builder = new HttpMockBuilder(httpMock);
   * ```
   */
  constructor(private httpMock: HttpTestingController) {}

  /**
   * Expects a GET request to URL and responds with mock data.
   *
   * Simplifies the common pattern: call service method, expect GET request,
   * flush response, verify behavior.
   *
   * @template T - Type of response data
   * @param {string} url - Full URL or URL pattern to match
   * @param {T} [responseData] - Data to return in response body (optional for 404/500)
   * @param {number} [statusCode=200] - HTTP status code (200, 404, 500, etc.)
   * @returns {TestRequest} The matched request for further verification
   *
   * @example
   * ```typescript
   * // Success case
   * const request = builder.expectGetRequest('/api/users/1', {id: 1, name: 'John'});
   * expect(request.request.method).toBe('GET');
   * expect(request.url).toContain('/api/users');
   *
   * // 404 Not Found
   * builder.expectGetRequest('/api/users/999', null, 404);
   *
   * // 500 Server Error
   * builder.expectGetRequest('/api/users', null, 500);
   * ```
   */
  expectGetRequest<T = any>(url: string, responseData?: T, statusCode: number = 200): TestRequest {
    const request = this.httpMock.expectOne(url);
    expect(request.request.method).toBe('GET');

    if (statusCode >= 400) {
      request.flush(responseData || '', {status: statusCode, statusText: this._getStatusText(statusCode)});
    } else {
      request.flush(responseData, {status: statusCode, statusText: this._getStatusText(statusCode)});
    }

    return request;
  }

  /**
   * Expects a POST request to URL and responds with mock data.
   *
   * Verifies POST request was made and returns mock response. Useful for testing
   * service methods that create resources or submit data.
   *
   * @template T - Type of response data
   * @param {string} url - Full URL or URL pattern to match
   * @param {any} [expectedBody] - Optional expected request body (if provided, will be verified)
   * @param {T} [responseData] - Data to return in response body
   * @param {number} [statusCode=201] - HTTP status code (typically 201 for POST success)
   * @returns {TestRequest} The matched request for further verification
   *
   * @example
   * ```typescript
   * // Create resource
   * const request = builder.expectPostRequest(
   *   '/api/users',
   *   {name: 'John'},
   *   {id: 1, name: 'John'}
   * );
   * expect(request.request.body.name).toBe('John');
   *
   * // Without expected body verification
   * const createReq = builder.expectPostRequest(
   *   '/api/users',
   *   undefined,
   *   {id: 1, name: 'John'},
   *   201
   * );
   * ```
   */
  expectPostRequest<T = any>(
    url: string,
    expectedBody?: any,
    responseData?: T,
    statusCode: number = 201
  ): TestRequest {
    const request = this.httpMock.expectOne(url);
    expect(request.request.method).toBe('POST');

    if (expectedBody !== undefined) {
      expect(request.request.body).toEqual(expectedBody);
    }

    if (statusCode >= 400) {
      request.flush(responseData || '', {status: statusCode, statusText: this._getStatusText(statusCode)});
    } else {
      request.flush(responseData, {status: statusCode, statusText: this._getStatusText(statusCode)});
    }

    return request;
  }

  /**
   * Expects a PUT request to URL and responds with mock data.
   *
   * Useful for testing service methods that update existing resources.
   *
   * @template T - Type of response data
   * @param {string} url - Full URL or URL pattern to match
   * @param {any} [expectedBody] - Optional expected request body (if provided, will be verified)
   * @param {T} [responseData] - Data to return in response body
   * @param {number} [statusCode=200] - HTTP status code (typically 200 for PUT success)
   * @returns {TestRequest} The matched request for further verification
   *
   * @example
   * ```typescript
   * const request = builder.expectPutRequest(
   *   '/api/users/1',
   *   {name: 'Jane'},
   *   {id: 1, name: 'Jane'}
   * );
   * expect(request.request.body.name).toBe('Jane');
   * ```
   */
  expectPutRequest<T = any>(
    url: string,
    expectedBody?: any,
    responseData?: T,
    statusCode: number = 200
  ): TestRequest {
    const request = this.httpMock.expectOne(url);
    expect(request.request.method).toBe('PUT');

    if (expectedBody !== undefined) {
      expect(request.request.body).toEqual(expectedBody);
    }

    if (statusCode >= 400) {
      request.flush(responseData || '', {status: statusCode, statusText: this._getStatusText(statusCode)});
    } else {
      request.flush(responseData, {status: statusCode, statusText: this._getStatusText(statusCode)});
    }

    return request;
  }

  /**
   * Expects a DELETE request to URL and responds with mock data.
   *
   * Useful for testing service methods that delete resources.
   *
   * @template T - Type of response data
   * @param {string} url - Full URL or URL pattern to match
   * @param {T} [responseData] - Data to return in response body (typically empty)
   * @param {number} [statusCode=200] - HTTP status code (typically 200 for DELETE success)
   * @returns {TestRequest} The matched request for further verification
   *
   * @example
   * ```typescript
   * const request = builder.expectDeleteRequest('/api/users/1');
   * expect(request.request.method).toBe('DELETE');
   *
   * // Delete returns 204 No Content
   * builder.expectDeleteRequest('/api/users/1', null, 204);
   * ```
   */
  expectDeleteRequest<T = any>(url: string, responseData?: T, statusCode: number = 200): TestRequest {
    const request = this.httpMock.expectOne(url);
    expect(request.request.method).toBe('DELETE');

    if (statusCode >= 400) {
      request.flush(responseData || '', {status: statusCode, statusText: this._getStatusText(statusCode)});
    } else {
      request.flush(responseData, {status: statusCode, statusText: this._getStatusText(statusCode)});
    }

    return request;
  }

  /**
   * Expects a request with specific HTTP method to URL.
   *
   * Generic method for less common HTTP verbs (PATCH, HEAD, OPTIONS, etc.)
   * or when method verification is important.
   *
   * @template T - Type of response data
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE, PATCH, etc.)
   * @param {string} url - Full URL or URL pattern to match
   * @param {T} [responseData] - Data to return in response body
   * @param {number} [statusCode=200] - HTTP status code
   * @returns {TestRequest} The matched request for further verification
   *
   * @example
   * ```typescript
   * // Test PATCH request
   * const request = builder.expectRequest(
   *   'PATCH',
   *   '/api/users/1',
   *   {id: 1, name: 'John'}
   * );
   * expect(request.request.method).toBe('PATCH');
   * ```
   */
  expectRequest<T = any>(method: string, url: string, responseData?: T, statusCode: number = 200): TestRequest {
    const request = this.httpMock.expectOne(url);
    expect(request.request.method).toBe(method);

    if (statusCode >= 400) {
      request.flush(responseData || '', {status: statusCode, statusText: this._getStatusText(statusCode)});
    } else {
      request.flush(responseData, {status: statusCode, statusText: this._getStatusText(statusCode)});
    }

    return request;
  }

  /**
   * Verifies that a request was made with expected parameters.
   *
   * Simplifies request verification without manually working with TestRequest.
   *
   * @param {TestRequest} request - The request to verify
   * @param {Object} expectedParams - Object with expected query parameters
   *
   * @example
   * ```typescript
   * const request = httpMock.expectOne(req => req.url.includes('/api/users'));
   * builder.verifyRequestParams(request, {page: '1', limit: '10'});
   * request.flush({});
   * ```
   */
  verifyRequestParams(request: TestRequest, expectedParams: {[key: string]: string}): void {
    const url = new URL(request.url, 'http://localhost');
    Object.entries(expectedParams).forEach(([key, value]) => {
      expect(url.searchParams.get(key)).toBe(value);
    });
  }

  /**
   * Verifies that a request has specific headers.
   *
   * Useful for testing that authentication, content-type, or other headers
   * are properly set on requests.
   *
   * @param {TestRequest} request - The request to verify
   * @param {Object} expectedHeaders - Object with expected header names and values
   *
   * @example
   * ```typescript
   * const request = httpMock.expectOne('/api/users');
   * builder.verifyRequestHeaders(request, {
   *   'Authorization': 'Bearer token123',
   *   'Content-Type': 'application/json'
   * });
   * request.flush({});
   * ```
   */
  verifyRequestHeaders(request: TestRequest, expectedHeaders: {[key: string]: string}): void {
    Object.entries(expectedHeaders).forEach(([key, value]) => {
      expect(request.request.headers.get(key)).toBe(value);
    });
  }

  /**
   * Verifies all pending HTTP requests were fulfilled.
   *
   * Call in afterEach() to ensure no unexpected requests or forgotten mocks.
   *
   * @example
   * ```typescript
   * afterEach(() => {
   *   builder.verifyNoOutstandingRequests();
   * });
   * ```
   */
  verifyNoOutstandingRequests(): void {
    this.httpMock.verify();
  }

  /**
   * Creates an HTTP error response for testing error scenarios.
   *
   * Factory for creating realistic error responses with proper HTTP status
   * codes and error messages.
   *
   * @template T - Type of error body
   * @param {number} statusCode - HTTP error status code (400, 401, 403, 404, 500, etc.)
   * @param {T} [errorBody] - Error response body (optional)
   * @param {string} [message] - Custom error message (optional)
   * @returns {HttpErrorResponse} Error response object for testing error handlers
   *
   * @example
   * ```typescript
   * // 404 Not Found
   * const notFoundError = builder.createErrorResponse(404);
   *
   * // 401 Unauthorized
   * const unauthorizedError = builder.createErrorResponse(401, {
   *   error: 'Invalid token'
   * });
   *
   * // Custom error message
   * const serverError = builder.createErrorResponse(500, null, 'Database connection failed');
   * expect(serverError.message).toContain('Database connection failed');
   * ```
   */
  createErrorResponse<T = any>(statusCode: number, errorBody?: T, message?: string): HttpErrorResponse {
    return new HttpErrorResponse({
      error: errorBody,
      status: statusCode,
      statusText: this._getStatusText(statusCode),
      url: 'http://localhost/api',
      headers: undefined,
      type: 4,
      message: message || this._getStatusText(statusCode),
    });
  }

  /**
   * Creates a successful HTTP response object for testing response handling.
   *
   * Useful when testing code that examines response headers, status, or full
   * HttpResponse object rather than just response body.
   *
   * @template T - Type of response body
   * @param {T} body - Response body data
   * @param {number} [status=200] - HTTP status code
   * @param {Object} [headers={}] - Response headers
   * @returns {HttpResponse<T>} Response object for testing
   *
   * @example
   * ```typescript
   * const response = builder.createSuccessResponse({id: 1, name: 'John'});
   * expect(response.status).toBe(200);
   * expect(response.body.id).toBe(1);
   *
   * // With custom status
   * const createdResponse = builder.createSuccessResponse({id: 1}, 201);
   * expect(createdResponse.status).toBe(201);
   * ```
   */
  createSuccessResponse<T = any>(body: T, status: number = 200, headers: any = {}): HttpResponse<T> {
    return new HttpResponse({
      body,
      status,
      statusText: this._getStatusText(status),
      url: 'http://localhost/api',
      headers: undefined,
      type: 4,
    });
  }

  /**
   * Gets human-readable status text for HTTP status code.
   *
   * @private
   * @param {number} statusCode - HTTP status code
   * @returns {string} Status text (e.g., 'Not Found' for 404)
   */
  private _getStatusText(statusCode: number): string {
    const statusTexts: {[key: number]: string} = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };
    return statusTexts[statusCode] || 'Unknown Error';
  }
}
