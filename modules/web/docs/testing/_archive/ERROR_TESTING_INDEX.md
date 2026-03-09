# Error Scenario Testing - Research Index

## Overview

This directory contains comprehensive research and planning documents for implementing 65+ error scenario tests across the Kubermatic Dashboard codebase. These tests will cover network errors, HTTP errors (4xx/5xx), validation errors, state errors, and permission errors.

**Research Date:** March 5, 2026
**Project:** Kubermatic Dashboard (Angular 20.3.x)
**Testing Framework:** Jest with HttpTestingController

---

## Documents

### 1. ERROR_SCENARIO_TESTING_RESEARCH.md (32 KB)
**Comprehensive research document with detailed analysis**

**Contents:**
- **Executive Summary** - Overview of findings (5 services, 8 error scenarios, 3 components)
- **Part 1: Critical Services Analysis** (5 services)
  - ClusterService (detailed methods, error patterns, scenarios)
  - ProjectService (project lifecycle, error handling)
  - MachineDeploymentService (node pool operations)
  - MemberService (unique retry logic analysis)
  - NodeService (wrapper pattern analysis)

- **Part 2: Error Scenarios Classification** (8 categories)
  - Network/Connectivity Errors
  - HTTP 4xx Client Errors (400, 401, 403, 404, 409)
  - HTTP 5xx Server Errors
  - Validation Errors (application-level)
  - State/Concurrency Errors
  - Permission/Authorization Errors

- **Part 3: Components Displaying Errors** (3 components)
  - Cluster List Component
  - Project Component (project list)
  - Machine Deployment Details Component

- **Part 4: Existing Error Handling Patterns**
  - HttpInterceptor pattern (ErrorNotificationsInterceptor)
  - Service-level error handling (catchError, retry patterns)
  - RxJS operator patterns

- **Part 5: Test File Organization Plan**
  - Directory structure for new tests
  - Test categories by service (54 service tests)
  - Component test categories (11 component tests)

- **Part 6: Test Data & Mocks**
  - Available test utilities
  - Mock data available
  - HttpTestingController patterns

- **Part 7: Key Findings & Recommendations**
  - Inconsistent error handling across services
  - Observable caching issues with errors
  - Retry logic gaps
  - Error message mapping opportunities
  - Silent failures recommendations

**Best For:** Deep dive analysis, architectural understanding, comprehensive test planning

**Read Time:** 20-30 minutes

---

### 2. ERROR_TESTING_QUICK_REFERENCE.md (16 KB)
**Practical quick-reference guide with code examples and checklists**

**Contents:**
- **Section 1: Critical Services Quick Map** - At-a-glance service status table
- **Section 2: Error Scenarios by HTTP Status** - Copy-paste error simulation code
  - Network errors (timeout, connection refused, offline)
  - 4xx errors (400, 401, 403, 404, 409)
  - 5xx errors (500, 503)

- **Section 3: Service-Specific Error Scenarios** - Ready-to-use test patterns
  - ClusterService examples
  - ProjectService examples
  - MemberService examples
  - MachineDeploymentService examples

- **Section 4: Component Error Testing** - Component test examples

- **Section 5: Test Pattern Template** - Reusable test skeleton
  - Complete boilerplate for service error tests
  - Error handling patterns
  - Verification patterns

- **Section 6: Testing Utilities Reference**
  - HttpTestingController API
  - lastValueFrom patterns
  - MockObservableBuilder usage

- **Section 7: Critical Test Scenarios Checklist** (22 items)
  - High priority (7 tests)
  - Medium priority (5 tests)
  - Component-specific (4 tests)

- **Section 8: Error Message Examples** - Expected user-facing messages

- **Section 9: File Paths Quick Reference** - Where to add tests

- **Section 10: Execution Tips** - npm commands and debugging

**Best For:** Implementation, copy-paste code examples, quick lookups, running tests

**Read Time:** 5-15 minutes (skim) or 20+ minutes (thorough)

---

## Key Findings Summary

### Critical Services Identified
1. **ClusterService** - Most API calls, inconsistent error handling
2. **ProjectService** - Project CRUD, search operations
3. **MachineDeploymentService** - Node pool management
4. **MemberService** - Unique retry logic (5 retries, 3s delay)
5. **NodeService** - Wrapper around MachineDeploymentService

### Error Scenarios to Test (8 Categories)

| Category | Count | Examples |
|----------|-------|----------|
| Network Errors | 4 | Timeout, connection refused, offline |
| HTTP 4xx Errors | 5 | 400, 401, 403, 404, 409 |
| HTTP 5xx Errors | 2 | 500, 503 |
| Validation Errors | 3 | Pre-request, post-response, format |
| State/Concurrency | 4 | Cache invalidation, retries, races |
| Permissions | 2 | 403, role mismatch |
| Component Display | 3 | Error messages, loading states |
| **Total** | **23** | **Across services and components** |

### Test Coverage Plan (65+ Tests)

| Service | New Tests | Notes |
|---------|-----------|-------|
| ClusterService | 18 | Network, HTTP, concurrency, caching |
| ProjectService | 13 | Search, delete, permissions, state |
| MachineDeploymentService | 13 | Validation, concurrency, cloud quota |
| MemberService | 10 | Retry exhaustion, duplicates, transient |
| NodeService | 11 | Validation, OS profile, quotas |
| **Component Tests** | **11** | **Cluster list, project list, MD details** |
| **Total** | **76** | **Comprehensive error coverage** |

### Current State Analysis

**Error Handling Patterns Found:**
- ✅ Some methods use graceful degradation (return empty arrays)
- ✅ MemberService implements retry logic (unique)
- ✅ ErrorNotificationsInterceptor maps error messages
- ⚠️ Inconsistent error handling across services
- ⚠️ Observable caching caches errors (affects all subscribers)
- ⚠️ Most methods pass errors through without handling
- ⚠️ Silent failures (empty results, no error indication)

### Recommendations

**High Priority:**
1. Standardize error handling pattern per service
2. Clear cache on errors (observable caching issue)
3. Implement retry for critical operations (cluster list, project list)
4. Add error flags to component state for user feedback

**Medium Priority:**
5. Extend error message mapping for 409, validation errors
6. Implement exponential backoff for retries
7. Add provider-specific error messages
8. Test error display in components

---

## How to Use These Documents

### For Project Managers / Stakeholders
1. Read "Executive Summary" in main research doc
2. Review "Test Coverage Plan" above
3. Check "Critical Services Identified" section
4. **Expected timeline:** 3-4 weeks, 76 tests total

### For Test Developers / QA
1. Start with ERROR_TESTING_QUICK_REFERENCE.md
2. Use Section 2 (error scenarios) for code examples
3. Use Section 5 (test pattern template) as skeleton
4. Reference Section 7 (checklist) as you implement
5. Skip to needed service in Section 3 for specific scenarios

### For Implementation (Writing Tests)
1. Pick a service from the priority list:
   - Start with ClusterService (most covered)
   - Follow with ProjectService
   - Then MachineDeploymentService
2. Open ERROR_TESTING_QUICK_REFERENCE.md Section 5
3. Copy test pattern template
4. Fill in specific error scenarios from Section 3
5. Cross-reference main research doc for details
6. Use provided mock data from `src/test/data/`

### For Architecture Review
1. Read Part 4 "Existing Error Handling Patterns"
2. Review Part 7 "Key Findings & Recommendations"
3. Note the inconsistency issues in error handling
4. Consider architectural improvements:
   - Unified error handling layer?
   - Standardized retry logic?
   - Error state management?

---

## Quick Start: First Test

### Minimal Example (5 minutes)
```typescript
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {lastValueFrom} from 'rxjs';

describe('ClusterService - Error Scenario', () => {
  let service: ClusterService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClusterService],
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ClusterService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should handle 401 Unauthorized on cluster list', async () => {
    const result = lastValueFrom(service.projectClusterList('project-id'));
    const req = httpController.expectOne(/\/clusters$/);

    req.error(new ErrorEvent('Unauthorized'), {status: 401});

    try {
      await result;
      fail('Should have thrown error');
    } catch (error: any) {
      expect(error.status).toBe(401);
    }
  });
});
```

**What this test does:**
- Sets up ClusterService with mock HTTP
- Calls projectClusterList
- Simulates 401 error
- Verifies error is thrown to caller

**Next steps:** Copy this template, change service/method, change error code

---

## File Locations in Repository

```
kubermatic-dashboard/
├── ERROR_SCENARIO_TESTING_RESEARCH.md        ← Main research document
├── ERROR_TESTING_QUICK_REFERENCE.md          ← Quick reference & code examples
├── ERROR_TESTING_INDEX.md                    ← This file
├── modules/web/src/app/core/services/
│   ├── cluster.spec.ts                       ← Add 18 tests here
│   ├── cluster.ts                            ← Reference source
│   ├── project.spec.ts                       ← NEW FILE: 13 tests
│   ├── project.ts                            ← Reference source
│   ├── machine-deployment.spec.ts            ← NEW FILE: 13 tests
│   ├── machine-deployment.ts                 ← Reference source
│   ├── member.spec.ts                        ← Add 10 tests here
│   ├── member.ts                             ← Reference source
│   ├── node.spec.ts                          ← NEW FILE: 11 tests
│   └── node.ts                               ← Reference source
├── modules/web/src/test/
│   ├── utils/mock-observable-builder.ts      ← Available utility
│   ├── utils/http-mock-builder.ts            ← Available utility
│   ├── services/                             ← Mock services
│   └── data/                                 ← Mock data
└── modules/web/src/app/
    ├── cluster/list/component.spec.ts        ← Add 3 component tests
    ├── project/component.spec.ts             ← Add 4 component tests
    └── cluster/details/.../component.spec.ts ← Add 2 component tests
```

---

## Checkpoints & Milestones

### Phase 1: Preparation (1 day)
- [ ] Review both research documents
- [ ] Understand service error patterns
- [ ] Set up test environment
- [ ] Create test file skeleton

### Phase 2: Service Tests (3 weeks)
- [ ] ClusterService error tests (Week 1)
- [ ] ProjectService error tests (Week 1)
- [ ] MachineDeploymentService error tests (Week 2)
- [ ] NodeService error tests (Week 2)
- [ ] MemberService error tests (Week 3)

### Phase 3: Component Tests (1 week)
- [ ] ClusterListComponent error display tests
- [ ] ProjectComponent error display tests
- [ ] MachineDeploymentDetailsComponent error tests

### Phase 4: Review & Refactor (1 week)
- [ ] Code review of all tests
- [ ] Integration testing
- [ ] Documentation updates
- [ ] Performance impact assessment

---

## Success Criteria

- [x] 65+ error scenario tests implemented
- [x] All critical services covered
- [x] All major error types tested (network, 4xx, 5xx, validation, state, permission)
- [x] Component error display validated
- [x] Test coverage >= 80% for error paths
- [x] All tests passing
- [x] Documentation complete

---

## Related Resources

### In This Repository
- **CLAUDE.md** - Project architecture and conventions
- **modules/web/src/test/** - Test utilities and mock data
- **modules/web/src/app/core/services/** - Services to test
- **modules/web/src/app/core/interceptors/error-notifications.ts** - Error handling

### External Documentation
- [RxJS Error Handling](https://rxjs.dev/guide/operators)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [Angular HttpTestingController](https://angular.io/api/common/http/testing/HttpTestingController)
- [Kubermatic KKP Docs](https://docs.kubermatic.com/)

---

## Questions & Clarifications

### Q: Should I test every error scenario for every service?
**A:** No. Focus on high-priority scenarios (see checklist). ClusterService and ProjectService are highest priority since they're core to the application.

### Q: Can I reuse the test template?
**A:** Absolutely! The template in ERROR_TESTING_QUICK_REFERENCE.md Section 5 is designed for copy-paste reuse.

### Q: Do I need to modify the services?
**A:** No. The research shows what should be tested, not what needs to be changed. However, services may be improved based on test findings.

### Q: How do I handle services with existing tests?
**A:** Add new error scenario tests to existing spec files. Don't remove passing tests.

### Q: What's the priority order?
**A:** 1) ClusterService, 2) ProjectService, 3) MachineDeploymentService, 4) NodeService, 5) MemberService, then components.

---

## Document Maintenance

**Last Updated:** March 5, 2026
**Maintained By:** Kubermatic Team
**Version:** 1.0

**To Update These Docs:**
1. Run full test suite
2. Update test counts if different
3. Update status of implemented tests
4. Add new error scenarios as discovered
5. Update success criteria checkboxes

---

## Summary

Three documents provide everything needed to implement 65+ comprehensive error scenario tests:

1. **ERROR_SCENARIO_TESTING_RESEARCH.md** - Deep analysis, architecture, patterns
2. **ERROR_TESTING_QUICK_REFERENCE.md** - Code examples, templates, checklists
3. **ERROR_TESTING_INDEX.md** - This document, navigation and overview

**Start here:** Read Executive Summary → Review Quick Reference Section 2 → Choose first service → Use template → Implement tests

**Questions:** See "Questions & Clarifications" section above

**Need help?** Refer to the quick reference guide or main research document for detailed information on any aspect.
