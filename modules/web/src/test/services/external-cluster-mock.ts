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

import {Injectable} from '@angular/core';
import {ExternalCluster, ExternalClusterProvider} from '@shared/entity/external-cluster';
import {BehaviorSubject, Observable, of, Subject} from 'rxjs';

/**
 * Mock implementation of ExternalClusterService for testing components that depend
 * on external cluster management functionality.
 *
 * Provides lightweight stubs for:
 * - Provider and preset management
 * - Cluster dialog operations (disconnect, delete)
 * - Credential validation methods
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({
 *   providers: [
 *     {provide: ExternalClusterService, useClass: ExternalClusterMockService}
 *   ]
 * });
 * ```
 */
@Injectable()
export class ExternalClusterMockService {
  providerChanges = new BehaviorSubject<ExternalClusterProvider>(undefined);
  presetStatusChanges = new Subject<boolean>();

  private _disconnectDialogCallCount = 0;
  private _disconnectDialogCallArguments: Array<{cluster: ExternalCluster; projectID: string}> = [];

  get provider(): ExternalClusterProvider {
    return this.providerChanges.value;
  }

  set provider(provider: ExternalClusterProvider) {
    this.providerChanges.next(provider);
  }

  get preset(): string {
    return null;
  }

  get region(): string {
    return null;
  }

  get presetChanges(): Observable<string> {
    return of(null);
  }

  get regionChanges(): Observable<string> {
    return of(null);
  }

  get isCredentialsStepValid(): boolean {
    return false;
  }

  get isClusterStepValid(): boolean {
    return false;
  }

  get isClusterDetailsStepValid(): boolean {
    return false;
  }

  /**
   * Simulates showing a disconnect dialog. No-op in mock.
   * Tracks call count and arguments for assertions.
   */
  showDisconnectClusterDialog(cluster: ExternalCluster, projectID: string): void {
    this._disconnectDialogCallCount++;
    this._disconnectDialogCallArguments.push({cluster, projectID});
  }

  deleteExternalCluster(_projectID: string, _clusterID: string, _action: any): Observable<void> {
    return of(undefined);
  }

  reset(): void {}

  /**
   * Gets the number of times showDisconnectClusterDialog() was called.
   */
  get disconnectDialogCallCount(): number {
    return this._disconnectDialogCallCount;
  }

  /**
   * Gets the arguments passed to showDisconnectClusterDialog() calls.
   */
  get disconnectDialogCallArguments(): Array<{cluster: ExternalCluster; projectID: string}> {
    return this._disconnectDialogCallArguments;
  }

  /**
   * Resets all call tracking state.
   */
  resetCallTracking(): void {
    this._disconnectDialogCallCount = 0;
    this._disconnectDialogCallArguments = [];
  }
}
