# Error Scenario Testing - Quick Reference Guide
## Kubermatic Dashboard Error Testing Cheat Sheet

---

## 1. Critical Services Quick Map

```
┌─────────────────────┬──────────────┬─────────────────┐
│ Service             │ Key Methods  │ Error Handling  │
├─────────────────────┼──────────────┼─────────────────┤
│ ClusterService      │ create, list │ Inconsistent    │
│ ProjectService      │ create, list │ Inconsistent    │
│ MachineDeployment   │ create, list │ Minimal         │
│ MemberService       │ list, add    │ Retry (5x)      │
│ NodeService         │ wrapper      │ Inherited       │
└─────────────────────┴──────────────┴─────────────────┘
```

---

## 2. Error Scenarios by HTTP Status Code

### Network/Connection Errors
```typescript
// Timeout
req.error(new ErrorEvent('Timeout'), {status: 0});

// Connection refused
httpController.expectOne(url).error(
  new ErrorEvent('Connection refused'),
  {status: 0}
);

// Offline (no network)
// Same as connection refused - status 0
```

### 4xx Client Errors
```typescript
// 400 Bad Request (validation)
req.error(new ErrorEvent('Invalid cluster spec'), {status: 400});

// 401 Unauthorized (auth)
req.error(new ErrorEvent('Unauthorized'), {status: 401});

// 403 Forbidden (permissions)
req.error(new ErrorEvent('Forbidden'), {status: 403});

// 404 Not Found
req.error(new ErrorEvent('Not Found'), {status: 404});

// 409 Conflict (concurrent)
req.error(new ErrorEvent('Conflict'), {status: 409});
```

### 5xx Server Errors
```typescript
// 500 Internal Server Error
req.error(new ErrorEvent('Server Error'), {status: 500});

// 503 Service Unavailable
req.error(new ErrorEvent('Service Unavailable'), {status: 503});
```

---

## 3. Service-Specific Error Scenarios

### ClusterService
```typescript
// Network timeouts
describe('Network Errors', () => {
  it('should handle projectClusterList timeout', async () => {
    const result = lastValueFrom(service.projectClusterList(projectID));
    const req = httpController.expectOne(url);
    req.error(new ErrorEvent('Timeout'), {status: 0});
    // Verify error thrown to subscriber
  });
});

// Concurrent operations
describe('Concurrent Operations', () => {
  it('should handle 409 Conflict on cluster creation', async () => {
    const result = lastValueFrom(service.create(projectID, model));
    const req = httpController.expectOne(url);
    req.error(new ErrorEvent('Conflict'), {status: 409});
    // Verify conflict error
  });
});

// Permission errors
describe('Permission Errors', () => {
  it('should handle 403 Forbidden on delete', async () => {
    const result = lastValueFrom(service.delete(projectID, clusterID));
    const req = httpController.expectOne(url);
    req.error(new ErrorEvent('Forbidden'), {status: 403});
    // Verify forbidden error
  });
});
```

### ProjectService
```typescript
// Search errors
describe('Search Errors', () => {
  it('should handle search timeout gracefully', async () => {
    const result = lastValueFrom(
      service.searchProjects('query', false)
    );
    const req = httpController.expectOne(/search=/);
    req.error(new ErrorEvent('Timeout'), {status: 0});
    // Should return empty array (graceful degradation)
  });
});

// Delete conflicts
describe('Delete Conflicts', () => {
  it('should handle 409 when deleting project with clusters', async () => {
    const result = lastValueFrom(service.delete(projectID));
    const req = httpController.expectOne(url);
    req.error(
      new ErrorEvent('Project has active clusters'),
      {status: 409}
    );
    // Verify conflict error
  });
});
```

### MemberService
```typescript
// Retry behavior
describe('Retry Logic', () => {
  it('should retry 5 times before throwing', async () => {
    const result = lastValueFrom(service.list(projectID));

    for (let i = 0; i < 5; i++) {
      const req = httpController.expectOne(url);
      req.error(new ErrorEvent('Transient error'), {status: 500});
      // After 5 retries...
    }

    // Final attempt fails
    try {
      await result;
      fail('Should throw after retries exhausted');
    } catch (error) {
      expect(error.status).toBe(500);
    }
  });
});

// Duplicate member
describe('Duplicate Member', () => {
  it('should handle 409 when member already exists', async () => {
    const model = {email: 'existing@example.com'};
    const result = lastValueFrom(service.add(model as any, projectID));
    const req = httpController.expectOne(url);
    req.error(
      new ErrorEvent('Member already exists'),
      {status: 409}
    );
  });
});
```

### MachineDeploymentService
```typescript
// Validation errors
describe('Validation Errors', () => {
  it('should handle 400 invalid replica count', async () => {
    const model = createInvalidMD(); // min > max
    const result = lastValueFrom(
      service.create(model, clusterID, projectID)
    );
    const req = httpController.expectOne(url);
    req.error(
      new ErrorEvent('Invalid replica bounds'),
      {status: 400}
    );
  });
});

// Cloud quota errors
describe('Cloud Quota Errors', () => {
  it('should handle insufficient cloud resources', async () => {
    const result = lastValueFrom(service.create(md, clusterID, projectID));
    const req = httpController.expectOne(url);
    req.error(
      new ErrorEvent('Insufficient quota'),
      {status: 500}
    );
  });
});
```

---

## 4. Component Error Testing

### Cluster List Component
```typescript
describe('ClusterListComponent Error Handling', () => {
  it('should show error when cluster list fails to load', () => {
    // Simulate error in child component
    // Verify error notification is shown
    // Check UI state (loading -> error)
  });

  it('should disable create button on permission denied', () => {
    // Simulate 403 on cluster creation attempt
    // Verify button is disabled
    // Verify error message shown
  });
});
```

### Project Component
```typescript
describe('ProjectComponent Error Handling', () => {
  it('should redirect to login on 401 Unauthorized', () => {
    // Simulate 401 on project list
    // Verify auth service is called
    // Verify navigation to login
  });

  it('should show conflict error when deleting project', () => {
    // Simulate 409 on delete (active clusters)
    // Verify error notification
    // Verify project still in list
  });

  it('should handle search timeout gracefully', () => {
    // Trigger search
    // Simulate timeout
    // Verify loading state cleared
    // Verify "No results" message
  });
});
```

---

## 5. Test Pattern Template

```typescript
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {lastValueFrom} from 'rxjs';

describe('ServiceUnderTest - Error Scenarios', () => {
  let service: ServiceUnderTest;
  let httpController: HttpTestingController;

  // Test data
  const projectID = 'test-project';
  const mockData = {id: 'test', name: 'Test'};
  const url = `${environment.restRoot}/path/to/resource`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServiceUnderTest],
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ServiceUnderTest);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();  // Critical: verifies all requests handled
  });

  describe('Network Errors', () => {
    it('should handle timeout on method()', async () => {
      const result = lastValueFrom(service.method(projectID));
      const req = httpController.expectOne(url);

      req.error(new ErrorEvent('Timeout'), {status: 0});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe('HTTP 4xx Errors', () => {
    it('should handle 401 Unauthorized', async () => {
      const result = lastValueFrom(service.method(projectID));
      const req = httpController.expectOne(url);

      req.error(new ErrorEvent('Unauthorized'), {status: 401});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.status).toBe(401);
      }
    });

    it('should handle 403 Forbidden', async () => {
      const result = lastValueFrom(service.method(projectID));
      const req = httpController.expectOne(url);

      req.error(new ErrorEvent('Forbidden'), {status: 403});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.status).toBe(403);
      }
    });

    it('should handle 404 Not Found', async () => {
      const result = lastValueFrom(service.method(projectID));
      const req = httpController.expectOne(url);

      req.error(new ErrorEvent('Not Found'), {status: 404});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.status).toBe(404);
      }
    });

    it('should handle 409 Conflict', async () => {
      const result = lastValueFrom(service.method(projectID));
      const req = httpController.expectOne(url);

      req.error(new ErrorEvent('Conflict'), {status: 409});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.status).toBe(409);
      }
    });
  });

  describe('HTTP 5xx Errors', () => {
    it('should handle 500 Internal Server Error', async () => {
      const result = lastValueFrom(service.method(projectID));
      const req = httpController.expectOne(url);

      req.error(new ErrorEvent('Server Error'), {status: 500});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.status).toBe(500);
      }
    });
  });

  describe('Graceful Degradation (where implemented)', () => {
    it('should return empty array on timeout', async () => {
      // For methods that implement: catchError(() => of([]))
      const result = lastValueFrom(service.methodWithFallback(projectID));
      const req = httpController.expectOne(url);

      req.error(new ErrorEvent('Timeout'), {status: 0});

      const data = await result;
      expect(data).toEqual([]);
    });
  });
});
```

---

## 6. Testing Utilities Reference

### HttpTestingController
```typescript
// Expect single request
const req = httpController.expectOne(url);
const req = httpController.expectOne(request =>
  request.url === url && request.method === 'GET'
);

// Match multiple requests
const reqs = httpController.match(url);

// Flush response
req.flush(data);
req.flush(data, {status: 200, statusText: 'OK'});

// Send error
req.error(new ErrorEvent('message'), {status: 401});

// Verify no outstanding requests
httpController.verify();
```

### lastValueFrom with Error Handling
```typescript
// Pattern for error-throwing observables
const result = lastValueFrom(observable);
try {
  const data = await result;
  // Success case
} catch (error) {
  expect(error.status).toBe(401);
}

// For observables with error handling (empty arrays)
const result = lastValueFrom(observable);
const data = await result;
expect(data).toEqual([]); // Graceful degradation
```

### MockObservableBuilder (Available Utility)
```typescript
import {MockObservableBuilder} from '@test/utils/mock-observable-builder';

// Create success observable
const obs = MockObservableBuilder.success(mockData, 100); // 100ms delay

// Create error observable
const obs = MockObservableBuilder.error(
  new Error('Network error'),
  50  // 50ms delay
);

// Create timeout (never emits)
const obs = MockObservableBuilder.timeout();

// Create subject (manual control)
const {subject, observable} = MockObservableBuilder.createSubject();
```

---

## 7. Critical Test Scenarios Checklist

### High Priority (Must Test)
- [ ] Cluster list 401 Unauthorized
- [ ] Project list 403 Forbidden (non-admin viewing all projects)
- [ ] Machine deployment creation 400 Bad Request
- [ ] Member add 409 Duplicate (already exists)
- [ ] Delete project 409 Conflict (active clusters)
- [ ] Network timeout on cluster fetch
- [ ] Service retry exhaustion (MemberService)

### Medium Priority (Should Test)
- [ ] 404 Not Found (resource deleted)
- [ ] Search timeout (ProjectService)
- [ ] Invalid node configuration (replica bounds)
- [ ] Concurrent operations (409)
- [ ] Permission denied (403) on specific operations

### Component-Specific
- [ ] Cluster list shows error state
- [ ] Project list handles 401 with redirect
- [ ] Search displays "no results" on empty
- [ ] Delete operation shows confirmation + error
- [ ] Machine deployment metrics show "unavailable" on error

---

## 8. Error Message Examples

### From ErrorNotificationsInterceptor
```
"Invalid credentials provided" ← Maps to multiple errors:
  - "AccessKeyId" is not valid
  - InvalidAccessKeySecret
  - Unauthorized
  - Authentication failed

"Invalid tenant ID provided" ← "Check to make sure you have the correct tenant ID"

"Invalid resource group provided" ← "failed to list.*Resource group.*could not be found"
```

### Expected Component Messaging
```
Network Error: "Unable to load clusters. Please check your connection."
401: "Your session has expired. Please log in again."
403: "You don't have permission to perform this action."
404: "The requested resource was not found."
409: "This resource is already in use or was recently modified."
500: "Server error occurred. Please try again later."
```

---

## 9. File Paths Quick Reference

### Services (Need Error Tests)
```
src/app/core/services/
├── cluster.ts                    # 18+ new tests needed
├── project.ts                    # 13+ new tests needed
├── machine-deployment.ts         # 13+ new tests needed
├── member.ts                     # 10+ new tests needed (enhance existing)
└── node.ts                       # 11+ new tests needed
```

### Components (Error Display Tests)
```
src/app/cluster/list/component.ts          # 3+ new tests
src/app/project/component.ts               # 4+ new tests
src/app/cluster/details/.../component.ts   # 2+ new tests
```

### Interceptors (Error Handling)
```
src/app/core/interceptors/
└── error-notifications.ts        # Reference only - core error handling
```

### Test Utilities (Available)
```
src/test/
├── utils/mock-observable-builder.ts
├── utils/http-mock-builder.ts
├── utils/test-bed-setup.ts
├── services/app-config-mock.ts
├── services/cluster-mock.ts
└── data/cluster.ts, project.ts, member.ts, ...
```

---

## 10. Execution Tips

### Running Tests
```bash
# Run all service tests
npm test -- src/app/core/services

# Run specific service tests
npm test -- cluster.spec.ts
npm test -- project.spec.ts

# Run with coverage
npm run test:ci

# Watch mode for development
npm run test:watch

# Run single test
npm test -- --testNamePattern="should handle timeout"
```

### Debugging Tests
```bash
# Run with inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Log HTTP requests
httpController.expectOne(url);  // Will fail with list of requests
```

---

## Summary

**Total Error Test Cases Recommended: 65+**

- ClusterService: 18 tests
- ProjectService: 13 tests
- MachineDeploymentService: 13 tests
- MemberService: 10 tests
- NodeService: 11 tests
- Components: 11 tests

**Implementation Timeline:**
1. Week 1: ClusterService + ProjectService error tests
2. Week 2: MachineDeploymentService + NodeService error tests
3. Week 3: MemberService enhancements + Component tests
4. Week 4: Review, documentation, and refactoring

**Key Patterns to Use:**
- HttpTestingController for HTTP mocking
- lastValueFrom for async/await testing
- ErrorEvent for network errors
- Status codes for HTTP errors
- afterEach httpController.verify() for validation
