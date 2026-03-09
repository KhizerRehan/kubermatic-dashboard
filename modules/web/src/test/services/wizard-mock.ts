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

import {EventEmitter, Injectable} from '@angular/core';
import {MatStepper} from '@angular/material/stepper';
import {StepRegistry, steps, WizardStep} from '@app/wizard/config';
import {NodeProvider} from '@shared/model/NodeProviderConstants';

/**
 * Mock implementation of WizardService for testing wizard step components.
 *
 * @example
 * const wizardMock = new WizardService Mock();
 * TestBed.configureTestingModule({
 *   providers: [{provide: WizardService, useValue: wizardMock}]
 * });
 */
@Injectable()
export class WizardMockService {
  readonly stepsChanges = new EventEmitter<StepRegistry>();

  private _stepper: MatStepper;
  private _steps: WizardStep[] = [...steps];
  private _provider: NodeProvider = NodeProvider.AWS;

  // Track method calls for testing
  private _nextCallCount = 0;
  private _resetCallCount = 0;
  private _setStepperCallCount = 0;

  get stepper(): MatStepper {
    return this._stepper;
  }

  set stepper(stepper: MatStepper) {
    this._stepper = stepper;
    this._setStepperCallCount++;
  }

  get steps(): WizardStep[] {
    return this._steps;
  }

  set steps(steps: WizardStep[]) {
    this._steps = steps;
  }

  get provider(): NodeProvider {
    return this._provider;
  }

  set provider(provider: NodeProvider) {
    this._provider = provider;
  }

  /**
   * Mock next() method - simulates moving to next step.
   * Can be used to track if navigation was attempted.
   */
  next(): void {
    this._nextCallCount++;
  }

  /**
   * Reset wizard state (typically called when canceling wizard).
   */
  reset(): void {
    this._resetCallCount++;
    this._steps = [...steps];
    this._provider = NodeProvider.AWS;
  }

  /**
   * Force handle provider change (for testing conditional step logic).
   */
  forceHandleProviderChange(provider: NodeProvider): void {
    this._provider = provider;
    this.stepsChanges.emit(StepRegistry.Cluster);
  }

  /**
   * Get call count for next() - for testing navigation.
   */
  getNextCallCount(): number {
    return this._nextCallCount;
  }

  /**
   * Get call count for reset() - for testing cleanup.
   */
  getResetCallCount(): number {
    return this._resetCallCount;
  }

  /**
   * Get call count for stepper setter - for testing stepper initialization.
   */
  getSetStepperCallCount(): number {
    return this._setStepperCallCount;
  }

  /**
   * Reset call tracking - use in beforeEach for clean test state.
   */
  resetCallTracking(): void {
    this._nextCallCount = 0;
    this._resetCallCount = 0;
    this._setStepperCallCount = 0;
  }

  /**
   * Reset all state - use between tests.
   */
  resetAll(): void {
    this.resetCallTracking();
    this._steps = [...steps];
    this._provider = NodeProvider.AWS;
    this._stepper = null;
  }
}
