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
import {ClusterBinding, ClusterRoleName, CreateBinding, NamespaceBinding, RoleName} from '@shared/entity/rbac';
import {fakeClusterBinding, fakeClusterRoleNames, fakeNamespaceBinding, fakeNamespaceRoleNames} from '../data/rbac';

/**
 * Mock implementation of RBACService for testing role-based access control features.
 *
 * Provides cluster bindings, namespace bindings, role names, and namespace operations
 * without real API calls. Useful for testing RBAC setup, role assignment, and
 * permission management features.
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: RBACService, useClass: RBACMockService}
 *   ]
 * });
 * const rbacMock = TestBed.inject(RBACService) as RBACMockService;
 * ```
 *
 * @see {@link RBACService} - Real RBAC service implementation
 * @see {@link test/data/rbac} - Source of test data
 */
@Injectable()
export class RBACMockService {
  /**
   * Gets available cluster role names for a cluster.
   *
   * Mock returns array of 3 fake cluster role names.
   *
   * @param {string} _clusterID - Cluster ID (ignored)
   * @param {string} _projectID - Project ID (ignored)
   * @returns {Observable<ClusterRoleName[]>} Observable emitting cluster role names
   *
   * @example
   * ```typescript
   * rbacMock.getClusterRoleNames('cluster-1', 'proj-1').subscribe(roleNames => {
   *   expect(roleNames.length).toBeGreaterThan(0);
   *   expect(roleNames[0].name).toBeTruthy();
   * });
   * ```
   */
  getClusterRoleNames(_clusterID: string, _projectID: string): Observable<ClusterRoleName[]> {
    return of(fakeClusterRoleNames());
  }

  /**
   * Gets cluster role bindings for a cluster.
   *
   * Mock returns array with 1 fake cluster binding.
   *
   * @param {string} _clusterID - Cluster ID (ignored)
   * @param {string} _projectID - Project ID (ignored)
   * @returns {Observable<ClusterBinding[]>} Observable emitting cluster bindings
   *
   * @example
   * ```typescript
   * rbacMock.getClusterBindings('cluster-1', 'proj-1').subscribe(bindings => {
   *   expect(bindings.length).toBeGreaterThan(0);
   *   expect(bindings[0].roleRefName).toBeTruthy();
   * });
   * ```
   */
  getClusterBindings(_clusterID: string, _projectID: string): Observable<ClusterBinding[]> {
    return of([fakeClusterBinding()]);
  }

  /**
   * Gets available namespace (role) names for a cluster.
   *
   * Mock returns array of 3 fake role names.
   *
   * @param {string} _clusterID - Cluster ID (ignored)
   * @param {string} _projectID - Project ID (ignored)
   * @returns {Observable<RoleName[]>} Observable emitting namespace role names
   *
   * @example
   * ```typescript
   * rbacMock.getNamespaceRoleNames('cluster-1', 'proj-1').subscribe(roleNames => {
   *   expect(roleNames.length).toBeGreaterThan(0);
   * });
   * ```
   */
  getNamespaceRoleNames(_clusterID: string, _projectID: string): Observable<RoleName[]> {
    return of(fakeNamespaceRoleNames() as RoleName[]);
  }

  /**
   * Gets namespace role bindings for a cluster.
   *
   * Mock returns array with 1 fake namespace binding.
   *
   * @param {string} _clusterID - Cluster ID (ignored)
   * @param {string} _projectID - Project ID (ignored)
   * @returns {Observable<NamespaceBinding[]>} Observable emitting namespace bindings
   *
   * @example
   * ```typescript
   * rbacMock.getNamespaceBindings('cluster-1', 'proj-1').subscribe(bindings => {
   *   expect(bindings.length).toBeGreaterThan(0);
   *   expect(bindings[0].namespace).toBeTruthy();
   * });
   * ```
   */
  getNamespaceBindings(_clusterID: string, _projectID: string): Observable<NamespaceBinding[]> {
    return of([fakeNamespaceBinding()]);
  }

  /**
   * Gets available namespaces in a cluster.
   *
   * Mock returns array with 'default' namespace.
   *
   * @param {string} _projectID - Project ID (ignored)
   * @param {string} _clusterID - Cluster ID (ignored)
   * @returns {Observable<string[]>} Observable emitting namespace names
   *
   * @example
   * ```typescript
   * rbacMock.getClusterNamespaces('proj-1', 'cluster-1').subscribe(namespaces => {
   *   expect(namespaces).toContain('default');
   * });
   * ```
   */
  getClusterNamespaces(_projectID: string, _clusterID: string): Observable<string[]> {
    return of(['default', 'kube-system', 'kube-public']);
  }

  /**
   * Triggers a refresh of cluster bindings.
   *
   * Mock is a no-op but available for component compatibility.
   *
   * @example
   * ```typescript
   * rbacMock.refreshClusterBindings();
   * ```
   */
  refreshClusterBindings(): void {
    // Mock: no-op refresh
  }

  /**
   * Triggers a refresh of namespace bindings.
   *
   * Mock is a no-op but available for component compatibility.
   *
   * @example
   * ```typescript
   * rbacMock.refreshNamespaceBindings();
   * ```
   */
  refreshNamespaceBindings(): void {
    // Mock: no-op refresh
  }

  /**
   * Creates a new cluster role binding.
   *
   * Mock returns the input binding wrapped in Observable.
   *
   * @param {string} _clusterID - Cluster ID (ignored)
   * @param {string} _projectID - Project ID (ignored)
   * @param {string} _roleID - Role ID (ignored)
   * @param {CreateBinding} createClusterRole - Binding to create
   * @returns {Observable<ClusterBinding>} Observable emitting created binding
   *
   * @example
   * ```typescript
   * const binding: CreateBinding = {subjects: [{...}]};
   * rbacMock.createClusterBinding('cluster-1', 'proj-1', 'role-1', binding).subscribe(created => {
   *   expect(created.roleRefName).toBeTruthy();
   * });
   * ```
   */
  createClusterBinding(
    _clusterID: string,
    _projectID: string,
    _roleID: string,
    createClusterRole: CreateBinding
  ): Observable<ClusterBinding> {
    return of({...fakeClusterBinding(), ...createClusterRole});
  }

  /**
   * Deletes a cluster role binding.
   *
   * Mock always returns successful deletion (binding Observable).
   *
   * @param {string} _clusterID - Cluster ID (ignored)
   * @param {string} _projectID - Project ID (ignored)
   * @param {string} _roleID - Role ID (ignored)
   * @param {string} _kind - Subject kind (ignored)
   * @param {string} _name - Subject name (ignored)
   * @param {string} _namespace - Subject namespace (ignored)
   * @returns {Observable<ClusterBinding>} Observable emitting deleted binding
   *
   * @example
   * ```typescript
   * rbacMock.deleteClusterBinding('cluster-1', 'proj-1', 'role-1', 'User', 'user@example.com', 'default')
   *   .subscribe(() => {
   *     expect(component.bindings.length).toBeLessThan(previousCount);
   *   });
   * ```
   */
  deleteClusterBinding(
    _clusterID: string,
    _projectID: string,
    _roleID: string,
    _kind: string,
    _name: string,
    _namespace: string
  ): Observable<ClusterBinding> {
    return of(fakeClusterBinding());
  }

  /**
   * Creates a new namespace role binding.
   *
   * Mock returns the input binding wrapped in Observable.
   *
   * @param {string} _clusterID - Cluster ID (ignored)
   * @param {string} _projectID - Project ID (ignored)
   * @param {string} _roleID - Role ID (ignored)
   * @param {string} _namespace - Namespace (ignored)
   * @param {CreateBinding} createRole - Binding to create
   * @returns {Observable<NamespaceBinding>} Observable emitting created binding
   *
   * @example
   * ```typescript
   * const binding: CreateBinding = {subjects: [{...}]};
   * rbacMock.createNamespaceBinding('cluster-1', 'proj-1', 'role-1', 'default', binding)
   *   .subscribe(created => {
   *     expect(created.namespace).toBe('default');
   *   });
   * ```
   */
  createNamespaceBinding(
    _clusterID: string,
    _projectID: string,
    _roleID: string,
    _namespace: string,
    createRole: CreateBinding
  ): Observable<NamespaceBinding> {
    return of({...fakeNamespaceBinding(), ...createRole});
  }

  /**
   * Deletes a namespace role binding.
   *
   * Mock always returns successful deletion (binding Observable).
   *
   * @param {string} _clusterID - Cluster ID (ignored)
   * @param {string} _projectID - Project ID (ignored)
   * @param {string} _roleID - Role ID (ignored)
   * @param {string} _namespace - Namespace (ignored)
   * @param {string} _kind - Subject kind (ignored)
   * @param {string} _name - Subject name (ignored)
   * @param {string} _subjectNamespace - Subject namespace (ignored)
   * @returns {Observable<NamespaceBinding>} Observable emitting deleted binding
   *
   * @example
   * ```typescript
   * rbacMock.deleteNamespaceBinding('cluster-1', 'proj-1', 'role-1', 'default', 'User', 'user@example.com', 'default')
   *   .subscribe(() => {
   *     expect(component.bindings.length).toBeLessThan(previousCount);
   *   });
   * ```
   */
  deleteNamespaceBinding(
    _clusterID: string,
    _projectID: string,
    _roleID: string,
    _namespace: string,
    _kind: string,
    _name: string,
    _subjectNamespace: string
  ): Observable<NamespaceBinding> {
    return of(fakeNamespaceBinding());
  }
}
