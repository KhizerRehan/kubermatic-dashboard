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

import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';
import {HttpMockBuilder} from './http-mock-builder';

describe('HttpMockBuilder', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let builder: HttpMockBuilder;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    builder = new HttpMockBuilder(httpMock);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('expectGetRequest()', () => {
    it('should intercept GET request and return data', (done) => {
      const testData = {id: 1, name: 'Test'};

      httpClient.get('/api/test').subscribe((data) => {
        expect(data).toEqual(testData);
        done();
      });

      builder.expectGetRequest('/api/test', testData);
    });

    it('should handle multiple GET requests', (done) => {
      const firstData = {id: 1};
      const secondData = {id: 2};
      const results: any[] = [];

      httpClient.get('/api/first').subscribe((data) => results.push(data));
      httpClient.get('/api/second').subscribe((data) => results.push(data));

      builder.expectGetRequest('/api/first', firstData);
      builder.expectGetRequest('/api/second', secondData);

      setTimeout(() => {
        expect(results.length).toBe(2);
        expect(results[0]).toEqual(firstData);
        expect(results[1]).toEqual(secondData);
        done();
      }, 50);
    });

    it('should support custom status code', (done) => {
      const testData = {partial: true};

      httpClient.get('/api/partial', {observe: 'response'}).subscribe((response) => {
        expect(response.status).toBe(206);
        expect(response.body).toEqual(testData);
        done();
      });

      builder.expectGetRequest('/api/partial', testData, 206);
    });

    it('should work with empty responses', (done) => {
      httpClient.get('/api/empty').subscribe((data) => {
        expect(data).toBeNull();
        done();
      });

      builder.expectGetRequest('/api/empty', null);
    });

    it('should handle array responses', (done) => {
      const arrayData = [{id: 1}, {id: 2}];

      httpClient.get('/api/items').subscribe((data) => {
        expect(data).toEqual(arrayData);
        done();
      });

      builder.expectGetRequest('/api/items', arrayData);
    });
  });

  describe('expectPostRequest()', () => {
    it('should intercept POST request with body', (done) => {
      const requestBody = {name: 'New Item'};
      const responseData = {id: 1, name: 'New Item'};

      httpClient.post('/api/items', requestBody).subscribe((data) => {
        expect(data).toEqual(responseData);
        done();
      });

      builder.expectPostRequest('/api/items', requestBody, responseData);
    });

    it('should verify request body matches expectation', (done) => {
      const requestBody = {name: 'Item'};
      const responseData = {id: 1};

      httpClient.post('/api/items', requestBody).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne('/api/items');
      expect(req.request.body).toEqual(requestBody);
      req.flush(responseData);
    });

    it('should handle POST with custom status code', (done) => {
      const requestBody = {data: 'test'};
      const responseData = {created: true};

      httpClient.post('/api/create', requestBody, {observe: 'response'}).subscribe((response) => {
        expect(response.status).toBe(201);
        expect(response.body).toEqual(responseData);
        done();
      });

      builder.expectPostRequest('/api/create', requestBody, responseData, 201);
    });

    it('should handle empty POST response', (done) => {
      const requestBody = {action: 'process'};

      httpClient.post('/api/process', requestBody).subscribe(() => {
        done();
      });

      builder.expectPostRequest('/api/process', requestBody, null);
    });
  });

  describe('expectPutRequest()', () => {
    it('should intercept PUT request', (done) => {
      const requestBody = {name: 'Updated'};
      const responseData = {id: 1, name: 'Updated'};

      httpClient.put('/api/items/1', requestBody).subscribe((data) => {
        expect(data).toEqual(responseData);
        done();
      });

      builder.expectPutRequest('/api/items/1', requestBody, responseData);
    });

    it('should verify PUT request body', (done) => {
      const requestBody = {status: 'active'};
      const responseData = {updated: true};

      httpClient.put('/api/update', requestBody).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne('/api/update');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(requestBody);
      req.flush(responseData);
    });

    it('should support custom status code for PUT', (done) => {
      const requestBody = {data: 'test'};
      const responseData = {modified: true};

      httpClient.put('/api/items', requestBody, {observe: 'response'}).subscribe((response) => {
        expect(response.status).toBe(202);
        done();
      });

      builder.expectPutRequest('/api/items', requestBody, responseData, 202);
    });
  });

  describe('expectDeleteRequest()', () => {
    it('should intercept DELETE request', (done) => {
      httpClient.delete('/api/items/1').subscribe(() => {
        done();
      });

      builder.expectDeleteRequest('/api/items/1', null);
    });

    it('should handle DELETE with response data', (done) => {
      const responseData = {deleted: true};

      httpClient.delete('/api/items/1').subscribe((data) => {
        expect(data).toEqual(responseData);
        done();
      });

      builder.expectDeleteRequest('/api/items/1', responseData);
    });

    it('should support custom status code for DELETE', (done) => {
      httpClient.delete('/api/force-delete/1', {observe: 'response'}).subscribe((response) => {
        expect(response.status).toBe(204);
        done();
      });

      const req = httpMock.expectOne('/api/force-delete/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null, {status: 204, statusText: 'No Content'});
    });

    it('should handle DELETE with complex response', (done) => {
      const responseData = {id: 1, deleted: true, deletedAt: '2024-01-01'};

      httpClient.delete('/api/items/1').subscribe((data) => {
        expect(data).toEqual(responseData);
        done();
      });

      builder.expectDeleteRequest('/api/items/1', responseData);
    });
  });

  describe('expectRequest()', () => {
    it('should handle generic request method', (done) => {
      const testData = {generic: true};

      httpClient.request('GET', '/api/generic').subscribe((data) => {
        expect(data).toEqual(testData);
        done();
      });

      builder.expectRequest('GET', '/api/generic', testData);
    });

    it('should support PATCH method', (done) => {
      const requestData = {patch: 'data'};
      const responseData = {patched: true};

      httpClient.request('PATCH', '/api/patch', {body: requestData}).subscribe((data) => {
        expect(data).toEqual(responseData);
        done();
      });

      const req = httpMock.expectOne('/api/patch');
      req.flush(responseData);
    });

    it('should support HEAD method', (done) => {
      httpClient.head('/api/exists').subscribe(() => {
        done();
      });

      const req = httpMock.expectOne('/api/exists');
      expect(req.request.method).toBe('HEAD');
      req.flush(null);
    });
  });

  describe('verifyRequestParams()', () => {
    it('should verify query parameters', () => {
      httpClient.get('/api/search?query=test&limit=10').subscribe();

      const req = httpMock.expectOne((request) =>
        request.url === '/api/search' &&
        request.params.get('query') === 'test' &&
        request.params.get('limit') === '10'
      );

      expect(req.request.params.get('query')).toBe('test');
      expect(req.request.params.get('limit')).toBe('10');

      req.flush({});
    });

    it('should handle URL with parameters', () => {
      httpClient.get('/api/items', {params: {id: '1', status: 'active'}}).subscribe();

      const req = httpMock.expectOne((request) => request.url === '/api/items');

      expect(req.request.params.get('id')).toBe('1');
      expect(req.request.params.get('status')).toBe('active');

      req.flush([]);
    });
  });

  describe('verifyRequestHeaders()', () => {
    it('should verify request headers', () => {
      httpClient.get('/api/data', {headers: {'X-Custom-Header': 'test-value'}}).subscribe();

      const req = httpMock.expectOne('/api/data');

      expect(req.request.headers.has('X-Custom-Header')).toBe(true);
      expect(req.request.headers.get('X-Custom-Header')).toBe('test-value');

      req.flush({});
    });

    it('should verify multiple headers', () => {
      httpClient.get('/api/secure', {
        headers: {
          'Authorization': 'Bearer token',
          'X-API-Key': 'secret-key',
        },
      }).subscribe();

      const req = httpMock.expectOne('/api/secure');

      expect(req.request.headers.get('Authorization')).toBe('Bearer token');
      expect(req.request.headers.get('X-API-Key')).toBe('secret-key');

      req.flush({});
    });
  });

  describe('verifyNoOutstandingRequests()', () => {
    it('should verify all requests were handled', () => {
      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      req.flush({data: 'test'});

      expect(() => {
        builder.verifyNoOutstandingRequests();
      }).not.toThrow();
    });

    it('should throw error for outstanding requests', () => {
      httpClient.get('/api/test').subscribe();
      httpMock.expectOne('/api/test');
      // Not flushing the response

      expect(() => {
        httpMock.verify();
      }).toThrow();
    });
  });

  describe('createErrorResponse()', () => {
    it('should create error response', () => {
      httpClient.get('/api/error').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          expect(err.error.message).toContain('Not found');
        },
      });

      const req = httpMock.expectOne('/api/error');
      const errorResponse = builder.createErrorResponse(404, 'Not found');
      req.flush(errorResponse, {status: 404, statusText: 'Not Found'});
    });

    it('should support different status codes', () => {
      const errorStatuses = [400, 401, 403, 404, 500, 503];

      errorStatuses.forEach((status) => {
        const error = builder.createErrorResponse(status, `Error ${status}`);
        expect(error).toBeTruthy();
      });
    });
  });

  describe('createSuccessResponse()', () => {
    it('should create success response', () => {
      const data = {id: 1, name: 'Success'};
      const response = builder.createSuccessResponse(data);

      expect(response).toEqual(data);
    });

    it('should support custom status code', () => {
      const data = {created: true};
      const response = builder.createSuccessResponse(data, 201);

      expect(response).toEqual(data);
    });

    it('should work with different data types', () => {
      const primitiveResponse = builder.createSuccessResponse('string-response');
      expect(primitiveResponse).toBe('string-response');

      const arrayResponse = builder.createSuccessResponse([1, 2, 3]);
      expect(arrayResponse).toEqual([1, 2, 3]);

      const objectResponse = builder.createSuccessResponse({key: 'value'});
      expect(objectResponse).toEqual({key: 'value'});
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete CRUD workflow', (done) => {
      const newItem = {name: 'New Item'};
      const createdItem = {id: 1, ...newItem};
      const updatedItem = {id: 1, name: 'Updated Item'};

      let step = 0;

      // CREATE
      httpClient.post('/api/items', newItem).subscribe((created) => {
        expect(created).toEqual(createdItem);
        step++;

        // READ
        httpClient.get('/api/items/1').subscribe((item) => {
          expect(item).toEqual(createdItem);
          step++;

          // UPDATE
          httpClient.put('/api/items/1', {name: 'Updated Item'}).subscribe((updated) => {
            expect(updated).toEqual(updatedItem);
            step++;

            // DELETE
            httpClient.delete('/api/items/1').subscribe(() => {
              step++;
              expect(step).toBe(4);
              done();
            });

            builder.expectDeleteRequest('/api/items/1', null);
          });

          builder.expectPutRequest('/api/items/1', {name: 'Updated Item'}, updatedItem);
        });

        builder.expectGetRequest('/api/items/1', createdItem);
      });

      builder.expectPostRequest('/api/items', newItem, createdItem);
    });

    it('should handle error scenarios in workflow', (done) => {
      let successCalls = 0;
      let errorCalls = 0;

      // Successful request
      httpClient.get('/api/success').subscribe(
        () => {
          successCalls++;
        },
        () => {}
      );

      // Failed request
      httpClient.get('/api/error').subscribe(
        () => {},
        () => {
          errorCalls++;
        }
      );

      builder.expectGetRequest('/api/success', {success: true});

      const errorReq = httpMock.expectOne('/api/error');
      errorReq.error(new ProgressEvent('error'), {status: 500, statusText: 'Server Error'});

      setTimeout(() => {
        expect(successCalls).toBe(1);
        expect(errorCalls).toBe(1);
        done();
      }, 50);
    });

    it('should verify request/response matching', (done) => {
      const request = {action: 'process', data: [1, 2, 3]};
      const response = {processed: true, count: 3};

      httpClient.post('/api/process', request).subscribe((result) => {
        expect(result).toEqual(response);
        done();
      });

      const req = httpMock.expectOne('/api/process');

      // Verify request structure
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      expect(req.request.body.action).toBe('process');
      expect(req.request.body.data.length).toBe(3);

      req.flush(response);
    });

    it('should handle concurrent requests', (done) => {
      const results: any[] = [];

      const requests = [
        httpClient.get('/api/data/1'),
        httpClient.get('/api/data/2'),
        httpClient.get('/api/data/3'),
      ];

      requests.forEach((req, index) => {
        req.subscribe((data) => results.push(data));
      });

      builder.expectGetRequest('/api/data/1', {id: 1});
      builder.expectGetRequest('/api/data/2', {id: 2});
      builder.expectGetRequest('/api/data/3', {id: 3});

      setTimeout(() => {
        expect(results.length).toBe(3);
        expect(results[0].id).toBe(1);
        expect(results[1].id).toBe(2);
        expect(results[2].id).toBe(3);
        done();
      }, 50);
    });
  });
});
