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

import {RBACMockService} from './rbac-mock';
import {fakeClusterBinding, fakeClusterRoleNames, fakeNamespaceBinding, fakeNamespaceRoleNames} from '../data/rbac';

describe('RBACMockService', () => {
  let service: RBACMockService;

  beforeEach(() => {
    service = new RBACMockService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Cluster Role Names', () => {
    it('should return cluster role names observable', (done) => {
      service.getClusterRoleNames('cluster-1', 'proj-1').subscribe(roleNames => {
        expect(Array.isArray(roleNames)).toBe(true);
        expect(roleNames.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should return expected role name structure', (done) => {
      service.getClusterRoleNames('cluster-1', 'proj-1').subscribe(roleNames => {
        expect(roleNames[0].name).toBeTruthy();
        done();
      });
    });

    it('should match fakeClusterRoleNames output', (done) => {
      service.getClusterRoleNames('cluster-1', 'proj-1').subscribe(roleNames => {
        const expected = fakeClusterRoleNames();
        expect(roleNames).toEqual(expected);
        done();
      });
    });
  });

  describe('Cluster Bindings', () => {
    it('should return cluster bindings observable', (done) => {
      service.getClusterBindings('cluster-1', 'proj-1').subscribe(bindings => {
        expect(Array.isArray(bindings)).toBe(true);
        expect(bindings.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should return expected binding structure', (done) => {
      service.getClusterBindings('cluster-1', 'proj-1').subscribe(bindings => {
        expect(bindings[0].roleRefName).toBeTruthy();
        expect(bindings[0].subjects).toBeTruthy();
        done();
      });
    });

    it('refreshClusterBindings should be callable', () => {
      expect(() => service.refreshClusterBindings()).not.toThrow();
    });

    it('createClusterBinding should return binding with create data', (done) => {
      const createBinding = {subjects: []} as any;
      service.createClusterBinding('cluster-1', 'proj-1', 'role-1', createBinding).subscribe(result => {
        expect(result).toBeTruthy();
        expect(result.roleRefName).toBeTruthy();
        done();
      });
    });

    it('deleteClusterBinding should return binding observable', (done) => {
      service.deleteClusterBinding('cluster-1', 'proj-1', 'role-1', 'User', 'user@example.com', 'default').subscribe(result => {
        expect(result).toBeTruthy();
        done();
      });
    });
  });

  describe('Namespace Role Names', () => {
    it('should return namespace role names observable', (done) => {
      service.getNamespaceRoleNames('cluster-1', 'proj-1').subscribe(roleNames => {
        expect(Array.isArray(roleNames)).toBe(true);
        expect(roleNames.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should match fakeNamespaceRoleNames output', (done) => {
      service.getNamespaceRoleNames('cluster-1', 'proj-1').subscribe(roleNames => {
        const expected = fakeNamespaceRoleNames();
        expect(roleNames.length).toBe(expected.length);
        done();
      });
    });
  });

  describe('Namespace Bindings', () => {
    it('should return namespace bindings observable', (done) => {
      service.getNamespaceBindings('cluster-1', 'proj-1').subscribe(bindings => {
        expect(Array.isArray(bindings)).toBe(true);
        expect(bindings.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should return expected binding structure', (done) => {
      service.getNamespaceBindings('cluster-1', 'proj-1').subscribe(bindings => {
        expect(bindings[0].namespace).toBeTruthy();
        expect(bindings[0].subjects).toBeTruthy();
        done();
      });
    });

    it('refreshNamespaceBindings should be callable', () => {
      expect(() => service.refreshNamespaceBindings()).not.toThrow();
    });

    it('createNamespaceBinding should return binding with create data', (done) => {
      const createBinding = {subjects: []} as any;
      service.createNamespaceBinding('cluster-1', 'proj-1', 'role-1', 'default', createBinding).subscribe(result => {
        expect(result).toBeTruthy();
        expect(result.namespace).toBeTruthy();
        done();
      });
    });

    it('deleteNamespaceBinding should return binding observable', (done) => {
      service.deleteNamespaceBinding('cluster-1', 'proj-1', 'role-1', 'default', 'User', 'user@example.com', 'default').subscribe(result => {
        expect(result).toBeTruthy();
        done();
      });
    });
  });

  describe('Cluster Namespaces', () => {
    it('should return namespaces observable', (done) => {
      service.getClusterNamespaces('proj-1', 'cluster-1').subscribe(namespaces => {
        expect(Array.isArray(namespaces)).toBe(true);
        expect(namespaces.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should include default namespace', (done) => {
      service.getClusterNamespaces('proj-1', 'cluster-1').subscribe(namespaces => {
        expect(namespaces).toContain('default');
        done();
      });
    });

    it('should include kube-system namespace', (done) => {
      service.getClusterNamespaces('proj-1', 'cluster-1').subscribe(namespaces => {
        expect(namespaces).toContain('kube-system');
        done();
      });
    });
  });
});
