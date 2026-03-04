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

import {ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {Subscription, delay} from 'rxjs';

/**
 * Mock User type
 */
export interface User {
  id: number;
  name: string;
  email: string;
}

/**
 * Async Service Component
 *
 * This component demonstrates async/observable patterns including:
 * - Initializing component data from service observables
 * - Handling loading states
 * - Error handling from failed requests
 * - Subscription cleanup on component destroy
 */
@Component({
  selector: 'km-async-service',
  templateUrl: './async-service.component.html',
  styleUrls: ['./async-service.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsyncServiceComponent implements OnInit, OnDestroy {
  user: User | null = null;
  isLoading: boolean = true;
  error: Error | null = null;

  protected userSubscription!: Subscription;

  constructor(@Inject('DataService') private dataService: any) {}

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {
    this.isLoading = true;
    this.error = null;

    this.userSubscription = this.dataService.getUser(1).subscribe({
      next: (user: User) => {
        this.user = user;
        this.isLoading = false;
      },
      error: (err: Error) => {
        this.error = err;
        this.isLoading = false;
      },
    });
  }

  loadUserWithDelay(): void {
    this.isLoading = true;
    this.error = null;

    this.userSubscription = this.dataService
      .getUserWithDelay(1)
      .pipe(delay(0))
      .subscribe({
        next: (user: User) => {
          this.user = user;
          this.isLoading = false;
        },
        error: (err: Error) => {
          this.error = err;
          this.isLoading = false;
        },
      });
  }

  loadWithError(): void {
    this.isLoading = true;
    this.error = null;

    this.userSubscription = this.dataService.failedRequest().subscribe({
      next: (user: User) => {
        this.user = user;
        this.isLoading = false;
      },
      error: (err: Error) => {
        this.error = err;
        this.isLoading = false;
      },
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
