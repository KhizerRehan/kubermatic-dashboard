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
import {Addon} from '@shared/entity/addon';
import {
  Cluster,
  ClusterPatch,
  CNIPluginVersions,
  CreateClusterModel,
  MasterVersion,
  ProviderSettingsPatch,
} from '@shared/entity/cluster';
import {Event} from '@shared/entity/event';
import {Health} from '@shared/entity/health';
import {ClusterMetrics} from '@shared/entity/metrics';
import {Node} from '@shared/entity/node';
import {SSHKey} from '@shared/entity/ssh-key';
import {defer, Observable, of, Subject} from 'rxjs';
import {async} from 'rxjs-compat/scheduler/async';
import {fakeClusters, fakeDigitaloceanCluster} from '../data/cluster';
import {fakeEvents} from '../data/event';
import {fakeHealth} from '../data/health';
import {nodesFake} from '../data/node';
import {fakeSSHKeys} from '../data/sshkey';

/**
 * Mock implementation of ClusterService for testing cluster management features.
 *
 * Provides comprehensive cluster CRUD operations, health monitoring, node management,
 * and SSH key operations without real API calls. Uses asyncData() for realistic
 * async behavior in tests.
 *
 * All methods return observables of fake data. Override private properties to
 * test different cluster scenarios.
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: ClusterService, useClass: ClusterMockService}
 *   ]
 * });
 * const clusterMock = TestBed.inject(ClusterService) as ClusterMockService;
 * clusterMock.cluster('cluster-1', 'dc-1', 'project-1').subscribe(cluster => {
 *   expect(cluster.name).toBeTruthy();
 * });
 * ```
 *
 * @see {@link ClusterService} - Real cluster service implementation
 * @see {@link test/data/cluster} - Source of fake cluster data
 * @see {@link asyncData} - Wraps response in async observable
 */
@Injectable()
export class ClusterMockService {
  /**
   * @private Mocked single cluster instance (DigitalOcean by default)
   */
  private _cluster: Cluster = fakeDigitaloceanCluster();

  /**
   * @private Mocked cluster list
   */
  private _clusters: Cluster[] = fakeClusters();

  /**
   * @private Mocked SSH keys for cluster access
   */
  private _sshKeys: SSHKey[] = fakeSSHKeys();

  /**
   * @private Mocked nodes in cluster
   */
  private _nodes: Node[] = nodesFake();

  /**
   * @private Mocked cluster health status
   */
  private _health: Health = fakeHealth();

  /**
   * Observable for provider settings patch changes.
   *
   * Emitted when provider-specific settings are modified.
   *
   * @type {Observable<ProviderSettingsPatch>}
   *
   * @example
   * ```typescript
   * clusterMock.providerSettingsPatchChanges$.subscribe(patch => {
   *   console.log('Provider settings changed:', patch);
   * });
   * ```
   */
  providerSettingsPatchChanges$ = new Subject<ProviderSettingsPatch>().asObservable();

  /**
   * Triggers provider settings patch change notification.
   *
   * No-op in mock. In real service, notifies subscribers of settings changes.
   *
   * @example
   * ```typescript
   * clusterMock.changeProviderSettingsPatch();
   * ```
   */
  changeProviderSettingsPatch(): void {}

  /**
   * Fetches a single cluster by ID.
   *
   * Returns mocked DigitalOcean cluster after async delay.
   * Ignore parameters and always returns the same mock instance.
   *
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {string} _dc - Datacenter name (ignored)
   * @param {string} _projectID - Project ID (ignored)
   * @returns {Observable<Cluster>} Observable emitting cluster after async delay
   *
   * @example
   * ```typescript
   * clusterMock.cluster('cluster-1', 'dc-1', 'proj-1').subscribe(cluster => {
   *   expect(cluster.id).toBeTruthy();
   * });
   * ```
   */
  cluster(_clusterId: string, _dc: string, _projectID: string): Observable<Cluster> {
    return asyncData(this._cluster);
  }

  /**
   * Lists all clusters in a project.
   *
   * Returns mocked array of clusters after async delay.
   * Default returns 2 fake clusters.
   *
   * @param {string} _projectID - Project ID (ignored)
   * @returns {Observable<Cluster[]>} Observable emitting cluster array
   *
   * @example
   * ```typescript
   * clusterMock.clusters('proj-1').subscribe(clusters => {
   *   expect(clusters.length).toBe(2);
   * });
   * ```
   */
  clusters(_projectID: string): Observable<Cluster[]> {
    return asyncData(this._clusters);
  }

  /**
   * Gets cluster health status.
   *
   * Returns mocked health object after async delay.
   * Test component health display without real cluster checks.
   *
   * @param {string} _cluster - Cluster identifier (ignored)
   * @param {string} _dc - Datacenter name (ignored)
   * @param {string} _projectID - Project ID (ignored)
   * @returns {Observable<Health>} Observable emitting health status
   *
   * @example
   * ```typescript
   * clusterMock.health('cluster-1', 'dc-1', 'proj-1').subscribe(health => {
   *   expect(health.apiserver).toBeTruthy();
   * });
   * ```
   */
  health(_cluster: string, _dc: string, _projectID: string): Observable<Health> {
    return asyncData(this._health);
  }

  /**
   * Lists SSH keys for cluster access.
   *
   * Returns mocked SSH keys after async delay.
   * Default returns 2 fake SSH keys.
   *
   * @returns {Observable<SSHKey[]>} Observable emitting SSH keys array
   *
   * @example
   * ```typescript
   * clusterMock.sshKeys().subscribe(keys => {
   *   expect(keys.length).toBeGreaterThan(0);
   * });
   * ```
   */
  sshKeys(): Observable<SSHKey[]> {
    return asyncData(this._sshKeys);
  }

  /**
   * Deletes an SSH key by fingerprint.
   *
   * Returns null after async delay to indicate successful deletion.
   *
   * @param {string} _fingerprint - SSH key fingerprint (ignored)
   * @returns {Observable<any>} Observable emitting null on success
   *
   * @example
   * ```typescript
   * clusterMock.deleteSSHKey('fingerprint').subscribe(() => {
   *   expect(component.sshKeys.length).toBeLessThan(previousCount);
   * });
   * ```
   */
  deleteSSHKey(_fingerprint: string): Observable<any> {
    return asyncData(null);
  }

  /**
   * Creates a new cluster.
   *
   * Returns mocked cluster after async delay.
   * Test cluster creation flow without real cluster provisioning.
   *
   * @param {CreateClusterModel} _createClusterModel - Cluster creation payload (ignored)
   * @param {string} _dc - Datacenter name (ignored)
   * @param {string} _projectID - Project ID (ignored)
   * @returns {Observable<Cluster>} Observable emitting created cluster
   *
   * @example
   * ```typescript
   * const model = createClusterModel();
   * clusterMock.create(model, 'dc-1', 'proj-1').subscribe(cluster => {
   *   expect(cluster.id).toBeTruthy();
   * });
   * ```
   */
  create(_createClusterModel: CreateClusterModel, _dc: string, _projectID: string): Observable<Cluster> {
    return asyncData(this._cluster);
  }

  /**
   * Deletes a cluster.
   *
   * Returns null after async delay to indicate successful deletion.
   *
   * @param {string} _clusterName - Cluster name (ignored)
   * @param {string} _dc - Datacenter name (ignored)
   * @param {string} _projectID - Project ID (ignored)
   * @returns {Observable<any>} Observable emitting null on success
   *
   * @example
   * ```typescript
   * clusterMock.delete('cluster-1', 'dc-1', 'proj-1').subscribe(() => {
   *   expect(router.navigate).toHaveBeenCalledWith(['/projects/proj-1']);
   * });
   * ```
   */
  delete(_clusterName: string, _dc: string, _projectID: string): Observable<any> {
    return asyncData(null);
  }

  /**
   * Edits cluster configuration.
   *
   * Returns mocked cluster after async delay.
   * Test cluster update flows without real API changes.
   *
   * @param {Cluster} _cluster - Updated cluster object (ignored)
   * @param {string} _dc - Datacenter name (ignored)
   * @param {string} _projectID - Project ID (ignored)
   * @returns {Observable<Cluster>} Observable emitting updated cluster
   *
   * @example
   * ```typescript
   * clusterMock.edit(updatedCluster, 'dc-1', 'proj-1').subscribe(cluster => {
   *   expect(cluster).toEqual(jasmine.any(Object));
   * });
   * ```
   */
  edit(_cluster: Cluster, _dc: string, _projectID: string): Observable<Cluster> {
    return asyncData(this._cluster);
  }

  /**
   * Applies a JSON patch to cluster configuration.
   *
   * Returns mocked cluster after async delay.
   * Test partial cluster updates without full re-provisioning.
   *
   * @param {string} _projectID - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {string} _datacenter - Datacenter name (ignored)
   * @param {ClusterPatch} _patch - JSON patch operations (ignored)
   * @returns {Observable<Cluster>} Observable emitting patched cluster
   *
   * @example
   * ```typescript
   * const patch: ClusterPatch = {spec: {enableOperatingSystemManager: true}};
   * clusterMock.patch('proj-1', 'cluster-1', 'dc-1', patch).subscribe(cluster => {
   *   expect(cluster.spec.enableOperatingSystemManager).toBe(true);
   * });
   * ```
   */
  patch(_projectID: string, _clusterId: string, _datacenter: string, _patch: ClusterPatch): Observable<Cluster> {
    return asyncData(this._cluster);
  }

  /**
   * Deletes a node from the cluster.
   *
   * Returns null after async delay to indicate successful deletion.
   *
   * @param {string} _clusterName - Cluster name (ignored)
   * @param {string} _nodeName - Node name (ignored)
   * @param {string} _dc - Datacenter name (ignored)
   * @param {string} _projectID - Project ID (ignored)
   * @returns {Observable<any>} Observable emitting null on success
   *
   * @example
   * ```typescript
   * clusterMock.deleteNode('cluster-1', 'node-1', 'dc-1', 'proj-1').subscribe(() => {
   *   expect(component.nodes.length).toBeLessThan(previousCount);
   * });
   * ```
   */
  deleteNode(_clusterName: string, _nodeName: string, _dc: string, _projectID: string): Observable<any> {
    return asyncData(null);
  }

  /**
   * Lists nodes in a cluster (deprecated, use nodes() instead).
   *
   * Returns mocked nodes array after async delay.
   *
   * @param {string} _cluster - Cluster identifier (ignored)
   * @param {string} _dc - Datacenter name (ignored)
   * @param {string} _projectID - Project ID (ignored)
   * @returns {Observable<Node[]>} Observable emitting nodes array
   *
   * @deprecated Use nodes() method instead
   * @example
   * ```typescript
   * clusterMock.getNodes('cluster-1', 'dc-1', 'proj-1').subscribe(nodes => {
   *   expect(nodes.length).toBeGreaterThan(0);
   * });
   * ```
   */
  getNodes(_cluster: string, _dc: string, _projectID: string): Observable<Node[]> {
    return asyncData(this._nodes);
  }

  /**
   * Gets available master version upgrades.
   *
   * Returns empty array after async delay.
   * Test upgrade availability checks and UI display.
   *
   * @param {string} _cluster - Cluster identifier (ignored)
   * @returns {Observable<MasterVersion[]>} Observable emitting versions array
   *
   * @example
   * ```typescript
   * clusterMock.upgrades('cluster-1').subscribe(versions => {
   *   expect(versions.length).toBe(0); // No upgrades available
   * });
   * ```
   */
  upgrades(_cluster: string): Observable<MasterVersion[]> {
    return asyncData([]);
  }

  /**
   * Gets CNI plugin versions for cluster.
   *
   * Returns null after async delay.
   * Test network configuration display.
   *
   * @param {string} _projectID - Project ID (ignored)
   * @param {string} _clusterID - Cluster ID (ignored)
   * @returns {Observable<CNIPluginVersions>} Observable emitting CNI versions
   *
   * @example
   * ```typescript
   * clusterMock.cniVersions('proj-1', 'cluster-1').subscribe(versions => {
   *   expect(versions).toBeNull();
   * });
   * ```
   */
  cniVersions(_projectID: string, _clusterID: string): Observable<CNIPluginVersions> {
    return asyncData(null);
  }

  /**
   * Lists nodes in a cluster.
   *
   * Returns mocked nodes array after async delay.
   * Always returns fresh fakeNodes from test data.
   *
   * @param {string} _projectID - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {string} _datacenter - Datacenter name (ignored)
   * @returns {Observable<Node[]>} Observable emitting nodes array
   *
   * @example
   * ```typescript
   * clusterMock.nodes('proj-1', 'cluster-1', 'dc-1').subscribe(nodes => {
   *   expect(nodes.length).toBeGreaterThan(0);
   * });
   * ```
   */
  nodes(_projectID: string, _clusterId: string, _datacenter: string): Observable<Node[]> {
    return asyncData(nodesFake());
  }

  /**
   * Gets cluster performance metrics.
   *
   * Returns null after async delay.
   * Test metrics display and monitoring features.
   *
   * @param {string} _projectID - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {string} _datacenter - Datacenter name (ignored)
   * @returns {Observable<ClusterMetrics>} Observable emitting metrics
   *
   * @example
   * ```typescript
   * clusterMock.metrics('proj-1', 'cluster-1', 'dc-1').subscribe(metrics => {
   *   expect(metrics).toBeNull();
   * });
   * ```
   */
  metrics(_projectID: string, _clusterId: string, _datacenter: string): Observable<ClusterMetrics> {
    return asyncData(null);
  }

  /**
   * Gets available node upgrades for a control plane version.
   *
   * Returns empty array after async delay.
   * Test node upgrade availability checks.
   *
   * @param {string} _controlPlaneVersion - Control plane version (ignored)
   * @param {string} _type - Node type (ignored)
   * @returns {Observable<MasterVersion[]>} Observable emitting versions array
   *
   * @example
   * ```typescript
   * clusterMock.nodeUpgrades('1.20.0', 'ubuntu').subscribe(versions => {
   *   expect(versions.length).toBe(0); // No upgrades available
   * });
   * ```
   */
  nodeUpgrades(_controlPlaneVersion: string, _type: string): Observable<MasterVersion[]> {
    return asyncData([]);
  }

  /**
   * Lists machine deployments available for upgrade.
   *
   * Returns empty array synchronously.
   * Quick response for upgrade availability checks.
   *
   * @returns {Observable<any[]>} Observable emitting machine deployments
   *
   * @example
   * ```typescript
   * clusterMock.upgradeMachineDeployments().subscribe(deployments => {
   *   expect(deployments.length).toBe(0);
   * });
   * ```
   */
  upgradeMachineDeployments(): Observable<any[]> {
    return of([]);
  }

  /**
   * Creates a new SSH key for cluster access.
   *
   * Returns null synchronously.
   * Test SSH key creation flows without real key generation.
   *
   * @param {SSHKey} _sshKey - SSH key object (ignored)
   * @returns {Observable<SSHKey>} Observable emitting null
   *
   * @example
   * ```typescript
   * clusterMock.createSSHKey(sshKey).subscribe(result => {
   *   expect(result).toBeNull();
   * });
   * ```
   */
  createSSHKey(_sshKey: SSHKey): Observable<SSHKey> {
    return of(null);
  }

  /**
   * Gets cluster events.
   *
   * Returns mocked events array synchronously.
   * Test event display without real event polling.
   *
   * @param {string} _projectID - Project ID (ignored)
   * @param {string} _clusterId - Cluster ID (ignored)
   * @param {string} _datacenter - Datacenter name (ignored)
   * @returns {Observable<Event[]>} Observable emitting events array
   *
   * @example
   * ```typescript
   * clusterMock.events('proj-1', 'cluster-1', 'dc-1').subscribe(events => {
   *   expect(events.length).toBeGreaterThan(0);
   * });
   * ```
   */
  events(_projectID: string, _clusterId: string, _datacenter: string): Observable<Event[]> {
    return of(fakeEvents());
  }

  /**
   * Lists cluster add-ons (Helm charts, operators, etc.).
   *
   * Returns empty array synchronously.
   * Test add-on management UI without real add-on data.
   *
   * @param {string} _projectID - Project ID (ignored)
   * @param {string} _cluster - Cluster identifier (ignored)
   * @param {string} _dc - Datacenter name (ignored)
   * @returns {Observable<Addon[]>} Observable emitting add-ons array
   *
   * @example
   * ```typescript
   * clusterMock.addons('proj-1', 'cluster-1', 'dc-1').subscribe(addons => {
   *   expect(addons.length).toBe(0);
   * });
   * ```
   */
  addons(_projectID: string, _cluster: string, _dc: string): Observable<Addon[]> {
    return of([]);
  }

  /**
   * Triggers cluster list refresh.
   *
   * No-op in mock. In real service, forces refresh of cluster list
   * from API, bypassing cache.
   *
   * @example
   * ```typescript
   * clusterMock.refreshClusters(); // Does nothing
   * ```
   */
  refreshClusters(): void {}
}

export function asyncData<T>(data: T): Observable<T> {
  return defer(() => of(data, async));
}
