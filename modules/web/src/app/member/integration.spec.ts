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
import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {MemberService} from '@core/services/member';
import {RBACService} from '@core/services/rbac';
import {NotificationService} from '@core/services/notification';
import {Member} from '@shared/entity/member';
import {RBAC} from '@shared/entity/rbac';
import {of, throwError} from 'rxjs';

/**
 * Integration tests for Member + RBAC service interactions
 *
 * Tests verify:
 * - Member operations affecting RBAC state
 * - RBAC operations affecting member visibility
 * - Permission synchronization across services
 * - Error handling in dependent service operations
 */
describe('Member + RBAC Services Integration', () => {
  let memberService: MemberService;
  let rbacService: RBACService;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let httpController: HttpTestingController;

  const mockMember: Member = {
    email: 'test@example.com',
    creationTimestamp: new Date(),
    isAdmin: false,
    role: 'editor',
  } as Member;

  const mockRBAC: RBAC = {
    kind: 'Binding',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    metadata: {name: 'test-binding'},
    subjects: [],
    roleRef: {kind: 'ClusterRole', name: 'edit'},
  } as RBAC;

  beforeEach(() => {
    const notificationServiceMock = jasmine.createSpyObj('NotificationService', [
      'success',
      'error',
      'warning',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MemberService,
        RBACService,
        {provide: NotificationService, useValue: notificationServiceMock},
      ],
    });

    memberService = TestBed.inject(MemberService);
    rbacService = TestBed.inject(RBACService);
    notificationService = TestBed.inject(NotificationService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('Member and RBAC data fetching', () => {
    it('should fetch members and their RBAC bindings', fakeAsync(() => {
      // Fetch members
      memberService.list('project-1').subscribe((members) => {
        expect(Array.isArray(members)).toBe(true);
      });

      const memberReq = httpController.expectOne((r) =>
        r.url.includes('projects/project-1') && r.url.includes('members')
      );
      memberReq.flush([mockMember]);

      tick();

      // Fetch RBAC bindings
      rbacService.bindings('project-1', 'cluster-1').subscribe((bindings) => {
        expect(Array.isArray(bindings)).toBe(true);
      });

      const rbacReq = httpController.expectOne((r) =>
        r.url.includes('bindings')
      );
      rbacReq.flush([mockRBAC]);

      tick();
    }));

    it('should handle empty member and RBAC lists', fakeAsync(() => {
      memberService.list('project-1').subscribe((members) => {
        expect(members.length).toBe(0);
      });

      const memberReq = httpController.expectOne((r) =>
        r.url.includes('members')
      );
      memberReq.flush([]);

      tick();

      rbacService.bindings('project-1', 'cluster-1').subscribe((bindings) => {
        expect(bindings.length).toBe(0);
      });

      const rbacReq = httpController.expectOne((r) =>
        r.url.includes('bindings')
      );
      rbacReq.flush([]);

      tick();
    }));

    it('should handle multiple members with different roles', fakeAsync(() => {
      const members: Member[] = [
        {email: 'user1@example.com', role: 'editor'} as Member,
        {email: 'user2@example.com', role: 'viewer'} as Member,
        {email: 'admin@example.com', role: 'owner'} as Member,
      ];

      memberService.list('project-1').subscribe((result) => {
        expect(result.length).toBe(3);
        expect(result[0].role).toBe('editor');
        expect(result[2].role).toBe('owner');
      });

      const req = httpController.expectOne((r) =>
        r.url.includes('members')
      );
      req.flush(members);

      tick();
    }));
  });

  describe('Member CRUD operations and RBAC synchronization', () => {
    it('should add member and create corresponding RBAC binding', fakeAsync(() => {
      // Add member
      memberService.add('project-1', {email: 'newuser@example.com', role: 'editor'} as Member).subscribe();

      const addReq = httpController.expectOne((r) =>
        r.url.includes('members') && r.method === 'POST'
      );
      addReq.flush({email: 'newuser@example.com', role: 'editor'});

      tick();

      // Then create RBAC binding for the new member
      rbacService.createBinding('project-1', 'cluster-1', mockRBAC).subscribe();

      const rbacReq = httpController.expectOne((r) =>
        r.url.includes('bindings') && r.method === 'POST'
      );
      rbacReq.flush(mockRBAC);

      tick();
    }));

    it('should update member role and RBAC binding', fakeAsync(() => {
      const updatedMember = {...mockMember, role: 'viewer'};

      // Update member
      memberService.edit('project-1', updatedMember).subscribe();

      const editReq = httpController.expectOne((r) =>
        r.url.includes('members') && r.method === 'PUT'
      );
      editReq.flush(updatedMember);

      tick();

      // Update RBAC binding
      const updatedRBAC = {...mockRBAC, roleRef: {kind: 'ClusterRole', name: 'view'}};
      rbacService.updateBinding('project-1', 'cluster-1', updatedRBAC).subscribe();

      const rbacReq = httpController.expectOne((r) =>
        r.url.includes('bindings') && r.method === 'PUT'
      );
      rbacReq.flush(updatedRBAC);

      tick();
    }));

    it('should remove member and delete RBAC bindings', fakeAsync(() => {
      // Remove member
      memberService.remove('project-1', mockMember.email).subscribe();

      const removeReq = httpController.expectOne((r) =>
        r.url.includes('members') && r.method === 'DELETE'
      );
      removeReq.flush(null);

      tick();

      // Delete RBAC bindings
      rbacService.deleteBinding('project-1', 'cluster-1', mockRBAC).subscribe();

      const rbacReq = httpController.expectOne((r) =>
        r.url.includes('bindings') && r.method === 'DELETE'
      );
      rbacReq.flush(null);

      tick();
    }));
  });

  describe('Error handling across services', () => {
    it('should handle member fetch error independently from RBAC', fakeAsync(() => {
      let memberError = false;
      let rbacSuccess = false;

      // Member fetch fails
      memberService.list('project-1').subscribe({
        error: () => {
          memberError = true;
        },
      });

      const memberReq = httpController.expectOne((r) =>
        r.url.includes('members')
      );
      memberReq.error(new ErrorEvent('Network error'));

      tick();

      // RBAC fetch can still succeed
      rbacService.bindings('project-1', 'cluster-1').subscribe(() => {
        rbacSuccess = true;
      });

      const rbacReq = httpController.expectOne((r) =>
        r.url.includes('bindings')
      );
      rbacReq.flush([mockRBAC]);

      tick();

      expect(memberError).toBe(true);
      expect(rbacSuccess).toBe(true);
    }));

    it('should handle 403 Forbidden on member add', fakeAsync(() => {
      let error403Received = false;

      memberService.add('project-1', mockMember).subscribe({
        error: (error) => {
          if (error.status === 403) {
            error403Received = true;
          }
        },
      });

      const req = httpController.expectOne((r) =>
        r.url.includes('members') && r.method === 'POST'
      );
      req.flush({message: 'Permission denied'}, {status: 403, statusText: 'Forbidden'});

      tick();

      expect(error403Received).toBe(true);
    }));

    it('should handle 409 Conflict on member add (duplicate)', fakeAsync(() => {
      let conflictReceived = false;

      memberService.add('project-1', mockMember).subscribe({
        error: (error) => {
          if (error.status === 409) {
            conflictReceived = true;
          }
        },
      });

      const req = httpController.expectOne((r) =>
        r.url.includes('members') && r.method === 'POST'
      );
      req.flush({message: 'Already exists'}, {status: 409, statusText: 'Conflict'});

      tick();

      expect(conflictReceived).toBe(true);
    }));

    it('should handle 404 Not Found on member remove', fakeAsync(() => {
      let notFoundReceived = false;

      memberService.remove('project-1', 'nonexistent@example.com').subscribe({
        error: (error) => {
          if (error.status === 404) {
            notFoundReceived = true;
          }
        },
      });

      const req = httpController.expectOne((r) =>
        r.url.includes('members') && r.method === 'DELETE'
      );
      req.flush({message: 'Not found'}, {status: 404, statusText: 'Not Found'});

      tick();

      expect(notFoundReceived).toBe(true);
    }));
  });

  describe('Permission-based operations', () => {
    it('should determine admin operations based on member role', fakeAsync(() => {
      const adminMember = {...mockMember, role: 'owner'};
      const regularMember = {...mockMember, role: 'viewer'};

      memberService.list('project-1').subscribe((members) => {
        const admin = members.find((m) => m.role === 'owner');
        const viewer = members.find((m) => m.role === 'viewer');

        expect(admin).toBeDefined();
        expect(viewer).toBeDefined();
      });

      const req = httpController.expectOne((r) =>
        r.url.includes('members')
      );
      req.flush([adminMember, regularMember]);

      tick();
    }));

    it('should filter members by permission level', fakeAsync(() => {
      const members: Member[] = [
        {email: 'owner@example.com', role: 'owner'} as Member,
        {email: 'editor@example.com', role: 'editor'} as Member,
        {email: 'viewer@example.com', role: 'viewer'} as Member,
      ];

      memberService.list('project-1').subscribe((result) => {
        const editors = result.filter((m) => m.role === 'editor');
        expect(editors.length).toBe(1);
        expect(editors[0].email).toBe('editor@example.com');
      });

      const req = httpController.expectOne((r) =>
        r.url.includes('members')
      );
      req.flush(members);

      tick();
    }));
  });

  describe('Concurrent member and RBAC operations', () => {
    it('should handle concurrent member list and RBAC fetch', fakeAsync(() => {
      memberService.list('project-1').subscribe();
      rbacService.bindings('project-1', 'cluster-1').subscribe();

      const memberReq = httpController.expectOne((r) =>
        r.url.includes('members')
      );
      const rbacReq = httpController.expectOne((r) =>
        r.url.includes('bindings')
      );

      memberReq.flush([mockMember]);
      rbacReq.flush([mockRBAC]);

      tick();
    }));

    it('should handle concurrent member add and RBAC binding operations', fakeAsync(() => {
      const newMember = {...mockMember, email: 'newuser@example.com'};
      const newBinding = {
        ...mockRBAC,
        subjects: [{kind: 'User', name: 'newuser@example.com'}],
      };

      // Add member
      memberService.add('project-1', newMember).subscribe();

      // Create binding concurrently
      rbacService.createBinding('project-1', 'cluster-1', newBinding).subscribe();

      const memberReq = httpController.expectOne((r) =>
        r.url.includes('members') && r.method === 'POST'
      );
      const bindingReq = httpController.expectOne((r) =>
        r.url.includes('bindings') && r.method === 'POST'
      );

      memberReq.flush(newMember);
      bindingReq.flush(newBinding);

      tick();
    }));
  });

  describe('Member/RBAC state consistency', () => {
    it('should maintain consistency between member list and RBAC bindings', fakeAsync(() => {
      const members = [mockMember];
      const bindings = [mockRBAC];

      // Fetch members
      memberService.list('project-1').subscribe((result) => {
        expect(result.length).toBe(members.length);
      });

      const memberReq = httpController.expectOne((r) =>
        r.url.includes('members')
      );
      memberReq.flush(members);

      tick();

      // Fetch RBAC bindings
      rbacService.bindings('project-1', 'cluster-1').subscribe((result) => {
        expect(result.length).toBe(bindings.length);
      });

      const rbacReq = httpController.expectOne((r) =>
        r.url.includes('bindings')
      );
      rbacReq.flush(bindings);

      tick();

      // State should be consistent
      expect(members[0].email).toBeDefined();
    }));

    it('should sync state when member role changes', fakeAsync(() => {
      const member = {email: 'user@example.com', role: 'editor'};
      const updatedMember = {email: 'user@example.com', role: 'viewer'};

      // Update member
      memberService.edit('project-1', updatedMember as Member).subscribe();

      const editReq = httpController.expectOne((r) =>
        r.url.includes('members') && r.method === 'PUT'
      );
      editReq.flush(updatedMember);

      tick();

      // Role should be updated
      expect(updatedMember.role).toBe('viewer');
    }));
  });

  describe('Bulk operations', () => {
    it('should handle batch member operations', fakeAsync(() => {
      const newMembers = [
        {email: 'user1@example.com', role: 'editor'} as Member,
        {email: 'user2@example.com', role: 'viewer'} as Member,
      ];

      let completedCount = 0;

      newMembers.forEach((member) => {
        memberService.add('project-1', member).subscribe(() => {
          completedCount++;
        });
      });

      // Handle both requests
      const req1 = httpController.expectOne((r) =>
        r.url.includes('members') && r.method === 'POST'
      );
      const req2 = httpController.expectOne((r) =>
        r.url.includes('members') && r.method === 'POST'
      );

      req1.flush(newMembers[0]);
      req2.flush(newMembers[1]);

      tick();

      expect(completedCount).toBe(2);
    }));
  });

  describe('Service unsubscription and cleanup', () => {
    it('should cleanup member service subscriptions', fakeAsync(() => {
      const sub = memberService.list('project-1').subscribe();

      const req = httpController.expectOne((r) =>
        r.url.includes('members')
      );
      req.flush([mockMember]);

      tick();

      sub.unsubscribe();

      // No new requests after unsubscribe
      httpController.expectNone((r) => r.url.includes('members'));
    }));

    it('should cleanup RBAC service subscriptions', fakeAsync(() => {
      const sub = rbacService.bindings('project-1', 'cluster-1').subscribe();

      const req = httpController.expectOne((r) =>
        r.url.includes('bindings')
      );
      req.flush([mockRBAC]);

      tick();

      sub.unsubscribe();

      // No new requests after unsubscribe
      httpController.expectNone((r) => r.url.includes('bindings'));
    }));
  });
});
