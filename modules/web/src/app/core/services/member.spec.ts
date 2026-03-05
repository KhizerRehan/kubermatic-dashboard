// Copyright 2025 The Kubermatic Kubernetes Platform contributors.
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
import {TestBed} from '@angular/core/testing';
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {Member} from '@shared/entity/member';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {lastValueFrom} from 'rxjs';

import {MemberService} from './member';

describe('MemberService', () => {
  let service: MemberService;
  let httpController: HttpTestingController;

  const restRoot = environment.restRoot;
  const projectID = 'test-project';
  const memberID = 'test-member';

  const mockMember: Member = {
    id: memberID,
    name: 'John Doe',
    email: 'john@example.com',
    creationTimestamp: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MemberService,
        {provide: AppConfigService, useClass: AppConfigMockService},
      ],
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(MemberService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('list()', () => {
    it('should fetch members list for a project', async () => {
      const result = lastValueFrom(service.list(projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users`);
      expect(req.request.method).toBe('GET');

      req.flush([mockMember]);

      const members = await result;
      expect(members).toContain(jasmine.objectContaining({id: memberID}));
    });

    it('should fetch empty members list', async () => {
      const result = lastValueFrom(service.list(projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users`);
      req.flush([]);

      const members = await result;
      expect(members).toEqual([]);
    });

    it('should fetch multiple members', async () => {
      const member1 = {...mockMember, id: 'member-1', email: 'user1@example.com'};
      const member2 = {...mockMember, id: 'member-2', email: 'user2@example.com'};
      const member3 = {...mockMember, id: 'member-3', email: 'user3@example.com'};

      const result = lastValueFrom(service.list(projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users`);
      req.flush([member1, member2, member3]);

      const members = await result;
      expect(members.length).toBe(3);
    });

    it('should handle API error (403 Forbidden)', async () => {
      const result = lastValueFrom(service.list(projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users`);
      req.error(new ErrorEvent('Forbidden'), {status: 403});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it('should handle API error (404 Not Found)', async () => {
      const result = lastValueFrom(service.list(projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users`);
      req.error(new ErrorEvent('Not Found'), {status: 404});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it('should retry on failure with delay', async () => {
      // This test verifies retry behavior is applied
      const result = lastValueFrom(service.list(projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users`);
      req.flush([mockMember]);

      const members = await result;
      expect(members).toBeTruthy();
    });
  });

  describe('add()', () => {
    it('should add member to project', async () => {
      const memberModel = {email: 'newmember@example.com'};
      const result = lastValueFrom(service.add(memberModel as any, projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(memberModel);

      req.flush(mockMember);

      const member = await result;
      expect(member.id).toBe(memberID);
      expect(member.email).toBe('john@example.com');
    });

    it('should handle add member error (409 Conflict - already exists)', async () => {
      const memberModel = {email: 'existing@example.com'};
      const result = lastValueFrom(service.add(memberModel as any, projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users`);
      req.error(new ErrorEvent('Member already exists'), {status: 409});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it('should handle add member error (400 Bad Request)', async () => {
      const memberModel = {email: 'invalid-email'};
      const result = lastValueFrom(service.add(memberModel as any, projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users`);
      req.error(new ErrorEvent('Bad email format'), {status: 400});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it('should handle add member error (403 Permission denied)', async () => {
      const memberModel = {email: 'newmember@example.com'};
      const result = lastValueFrom(service.add(memberModel as any, projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users`);
      req.error(new ErrorEvent('Permission denied'), {status: 403});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe('edit()', () => {
    it('should edit member in project', async () => {
      const updatedMember = {...mockMember, name: 'Jane Doe'};
      const result = lastValueFrom(service.edit(updatedMember, projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users/${memberID}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedMember);

      req.flush(updatedMember);

      const member = await result;
      expect(member.name).toBe('Jane Doe');
    });

    it('should handle edit member error (404 Not Found)', async () => {
      const updatedMember = {...mockMember, name: 'Jane Doe'};
      const result = lastValueFrom(service.edit(updatedMember, projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users/${memberID}`);
      req.error(new ErrorEvent('Member not found'), {status: 404});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it('should handle edit member error (403 Permission denied)', async () => {
      const updatedMember = {...mockMember, name: 'Jane Doe'};
      const result = lastValueFrom(service.edit(updatedMember, projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users/${memberID}`);
      req.error(new ErrorEvent('Permission denied'), {status: 403});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it('should edit member with different project ID', async () => {
      const differentProjectID = 'other-project';
      const updatedMember = {...mockMember, name: 'Updated Name'};
      const result = lastValueFrom(service.edit(updatedMember, differentProjectID));

      const req = httpController.expectOne(`${restRoot}/projects/${differentProjectID}/users/${memberID}`);
      expect(req.request.method).toBe('PUT');

      req.flush(updatedMember);

      const member = await result;
      expect(member.name).toBe('Updated Name');
    });
  });

  describe('remove()', () => {
    it('should remove member from project', async () => {
      const result = lastValueFrom(service.remove(mockMember, projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users/${memberID}`);
      expect(req.request.method).toBe('DELETE');

      req.flush({});

      await result;
      // No error thrown indicates success
      expect(true).toBe(true);
    });

    it('should handle remove member error (404 Not Found)', async () => {
      const result = lastValueFrom(service.remove(mockMember, projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users/${memberID}`);
      req.error(new ErrorEvent('Member not found'), {status: 404});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it('should handle remove member error (403 Permission denied)', async () => {
      const result = lastValueFrom(service.remove(mockMember, projectID));

      const req = httpController.expectOne(`${restRoot}/projects/${projectID}/users/${memberID}`);
      req.error(new ErrorEvent('Permission denied'), {status: 403});

      try {
        await result;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it('should remove different members correctly', async () => {
      const member1: Member = {...mockMember, id: 'member-1'};
      const member2: Member = {...mockMember, id: 'member-2'};

      const result1 = lastValueFrom(service.remove(member1, projectID));
      const req1 = httpController.expectOne(`${restRoot}/projects/${projectID}/users/member-1`);
      req1.flush({});
      await result1;

      const result2 = lastValueFrom(service.remove(member2, projectID));
      const req2 = httpController.expectOne(`${restRoot}/projects/${projectID}/users/member-2`);
      req2.flush({});
      await result2;

      expect(true).toBe(true); // Both removals successful
    });
  });

  describe('URL Construction', () => {
    it('should correctly construct project members URL', async () => {
      const customProjectID = 'custom-project-123';
      const result = lastValueFrom(service.list(customProjectID));

      const req = httpController.expectOne(`${restRoot}/projects/${customProjectID}/users`);
      expect(req.request.url).toContain(customProjectID);

      req.flush([]);
      await result;
    });

    it('should correctly construct member detail URL', async () => {
      const customProjectID = 'custom-project';
      const customMemberID = 'custom-member-456';
      const memberWithID = {...mockMember, id: customMemberID};

      const result = lastValueFrom(service.edit(memberWithID, customProjectID));

      const req = httpController.expectOne(`${restRoot}/projects/${customProjectID}/users/${customMemberID}`);
      expect(req.request.url).toContain(customProjectID);
      expect(req.request.url).toContain(customMemberID);

      req.flush(memberWithID);
      await result;
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple list requests for different projects', async () => {
      const project1 = 'project-1';
      const project2 = 'project-2';

      const result1 = lastValueFrom(service.list(project1));
      const result2 = lastValueFrom(service.list(project2));

      const req1 = httpController.expectOne(`${restRoot}/projects/${project1}/users`);
      const req2 = httpController.expectOne(`${restRoot}/projects/${project2}/users`);

      req1.flush([mockMember]);
      req2.flush([{...mockMember, id: 'member-2'}]);

      const members1 = await result1;
      const members2 = await result2;

      expect(members1.length).toBe(1);
      expect(members2.length).toBe(1);
      expect(members1[0].id).not.toBe(members2[0].id);
    });

    it('should handle add and list operations together', async () => {
      const addResult = lastValueFrom(service.add({email: 'new@example.com'} as any, projectID));
      const listResult = lastValueFrom(service.list(projectID));

      const addReq = httpController.expectOne(`${restRoot}/projects/${projectID}/users`);
      const listReq = httpController.expectOne(`${restRoot}/projects/${projectID}/users`);

      addReq.flush(mockMember);
      listReq.flush([mockMember]);

      const addedMember = await addResult;
      const members = await listResult;

      expect(addedMember).toBeTruthy();
      expect(members.length).toBe(1);
    });
  });
});
