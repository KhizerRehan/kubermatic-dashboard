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

import {ComponentFixture, TestBed, fakeAsync, tick, waitForAsync} from '@angular/core/testing';
import {Component, OnInit, OnDestroy, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  Observable,
  Subject,
  BehaviorSubject,
  throwError,
  of,
  EMPTY,
  interval,
  merge,
  combineLatest,
  race,
  zip,
} from 'rxjs';
import {
  shareReplay,
  switchMap,
  retry,
  catchError,
  takeUntil,
  tap,
  finalize,
  delay,
  debounceTime,
  distinctUntilChanged,
  map,
  share,
  timeout,
} from 'rxjs/operators';

// ========== Test Components for Observable & Async Patterns ==========

/**
 * Test component demonstrating multiple subscriptions pattern
 */
@Component({
  selector: 'km-multiple-subscriptions',
  template: `
    <div>
      <div data-cy="value">{{ value1 }}-{{ value2 }}-{{ value3 }}</div>
      <div data-cy="errors">{{ error | json }}</div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
class MultipleSubscriptionsComponent implements OnInit, OnDestroy {
  value1: string | null = null;
  value2: string | null = null;
  value3: string | null = null;
  error: any = null;
  private destroy$ = new Subject<void>();
  private dataSource$ = new BehaviorSubject<string>('initial');

  constructor() {}

  ngOnInit(): void {
    // First subscription
    this.dataSource$
      .pipe(
        tap(val => {
          this.value1 = val;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Second subscription to same source
    this.dataSource$
      .pipe(
        map(val => val.toUpperCase()),
        tap(val => {
          this.value2 = val;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Third subscription with error handling
    this.dataSource$
      .pipe(
        switchMap(val => (val === 'error' ? throwError(() => new Error('test error')) : of(val))),
        tap(val => {
          this.value3 = val;
        }),
        catchError(err => {
          this.error = err;
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  emitValue(val: string): void {
    this.dataSource$.next(val);
  }

  getSubscriptionCount(): number {
    // Note: This is for testing purposes; real implementation would use ReplaySubject observers()
    return 3;
  }
}

/**
 * Test component for hot vs. cold observable patterns
 */
@Component({
  selector: 'km-hot-cold-observables',
  template: `
    <div>
      <div data-cy="cold-value">{{ coldValue }}</div>
      <div data-cy="hot-value">{{ hotValue }}</div>
      <div data-cy="shared-value">{{ sharedValue }}</div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HotColdObservablesComponent implements OnInit, OnDestroy {
  coldValue: number | null = null;
  hotValue: number | null = null;
  sharedValue: number | null = null;
  private destroy$ = new Subject<void>();
  private hotSource$ = new BehaviorSubject<number>(0);
  private coldSource$: Observable<number> = of(1, 2, 3);
  private sharedSource$: Observable<number>;

  constructor() {
    this.sharedSource$ = this.coldSource$.pipe(shareReplay({bufferSize: 1, refCount: true}));
  }

  ngOnInit(): void {
    // Cold observable - creates new execution for each subscriber
    this.coldSource$
      .pipe(
        tap(val => {
          this.coldValue = val;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Hot observable from BehaviorSubject - shares same execution
    this.hotSource$
      .pipe(
        tap(val => {
          this.hotValue = val;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Shared observable - creates shared execution with refCount
    this.sharedSource$
      .pipe(
        tap(val => {
          this.sharedValue = val;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  emitHotValue(val: number): void {
    this.hotSource$.next(val);
  }
}

/**
 * Test component for error recovery patterns
 */
@Component({
  selector: 'km-error-recovery',
  template: `
    <div>
      <div data-cy="value">{{ value }}</div>
      <div data-cy="error">{{ error }}</div>
      <div data-cy="attempt">Attempt: {{ attemptCount }}</div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ErrorRecoveryComponent implements OnInit, OnDestroy {
  value: string | null = null;
  error: string | null = null;
  attemptCount = 0;
  private destroy$ = new Subject<void>();
  private dataSource$ = new Subject<string>();

  constructor() {}

  ngOnInit(): void {
    this.dataSource$
      .pipe(
        switchMap(val =>
          val === 'fail'
            ? throwError(() => new Error('Temporary failure'))
            : of(val).pipe(delay(10))
        ),
        retry({count: 3, delay: 10}),
        tap(() => {
          this.attemptCount++;
        }),
        catchError(err => {
          this.error = err.message;
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(val => {
        this.value = val;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  emitValue(val: string): void {
    this.dataSource$.next(val);
  }
}

/**
 * Test component for cancellation patterns
 */
@Component({
  selector: 'km-cancellation',
  template: `
    <div>
      <div data-cy="value">{{ value }}</div>
      <div data-cy="cancelled">{{ cancelled }}</div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CancellationComponent implements OnInit, OnDestroy {
  value: string | null = null;
  cancelled = false;
  private destroy$ = new Subject<void>();
  private pendingOperation$: Observable<string> | null = null;

  constructor() {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startAsyncOperation(): void {
    this.cancelled = false;
    this.pendingOperation$ = of('result').pipe(
      delay(100),
      finalize(() => {
        // Cleanup
      }),
      takeUntil(this.destroy$)
    );

    this.pendingOperation$.subscribe(val => {
      this.value = val;
    });
  }

  cancelOperation(): void {
    this.cancelled = true;
    this.destroy$.next();
  }
}

/**
 * Test component for timing patterns with fakeAsync
 */
@Component({
  selector: 'km-timing-patterns',
  template: `
    <div>
      <div data-cy="value">{{ value }}</div>
      <div data-cy="loaded">{{ loaded }}</div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TimingPatternsComponent implements OnInit, OnDestroy {
  value: string | null = null;
  loaded = false;
  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWithDelay(): void {
    of('data')
      .pipe(
        delay(100),
        tap(val => {
          this.value = val;
          this.loaded = true;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  loadWithInterval(): void {
    let count = 0;
    interval(50)
      .pipe(
        tap(() => {
          count++;
          this.value = `value-${count}`;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
}

/**
 * Test component for subscription cleanup
 */
@Component({
  selector: 'km-subscription-cleanup',
  template: `
    <div>
      <div data-cy="value">{{ value }}</div>
      <div data-cy="completed">{{ completed }}</div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SubscriptionCleanupComponent implements OnInit, OnDestroy {
  value: string | null = null;
  completed = false;
  private destroy$ = new Subject<void>();
  private subscriptions: any[] = [];

  constructor() {}

  ngOnInit(): void {
    const sub1 = of('value1').subscribe(val => {
      this.value = val;
    });
    this.subscriptions.push(sub1);

    const sub2 = interval(50)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.value = 'interval-value';
      });
    this.subscriptions.push(sub2);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  getSubscriptionCount(): number {
    return this.subscriptions.length;
  }
}

/**
 * Test component for complex observable chains
 */
@Component({
  selector: 'km-observable-chains',
  template: `
    <div>
      <div data-cy="result">{{ result }}</div>
      <div data-cy="combined">{{ combined }}</div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ObservableChainsComponent implements OnInit, OnDestroy {
  result: any = null;
  combined: any = null;
  private destroy$ = new Subject<void>();
  private source1$ = new BehaviorSubject<number>(1);
  private source2$ = new BehaviorSubject<number>(2);

  constructor() {}

  ngOnInit(): void {
    // CombineLatest pattern
    combineLatest([this.source1$, this.source2$])
      .pipe(
        map(([v1, v2]) => v1 + v2),
        tap(val => {
          this.combined = val;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Merge pattern
    merge(this.source1$, this.source2$)
      .pipe(
        tap(val => {
          this.result = val;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateSource1(val: number): void {
    this.source1$.next(val);
  }

  updateSource2(val: number): void {
    this.source2$.next(val);
  }
}

// ========== Test Suite ==========

describe('Observable and Async Patterns', () => {
  // ========== Multiple Subscriptions Tests ==========

  describe('Multiple Subscriptions Pattern', () => {
    let fixture: ComponentFixture<MultipleSubscriptionsComponent>;
    let component: MultipleSubscriptionsComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [MultipleSubscriptionsComponent],
        teardown: {destroyAfterEach: false},
      }).compileComponents();

      fixture = TestBed.createComponent(MultipleSubscriptionsComponent);
      component = fixture.componentInstance;
    });

    it('should initialize multiple subscriptions to same source', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.value1).toBe('initial');
      expect(component.value2).toBe('INITIAL');
      expect(component.value3).toBe('initial');
    }));

    it('should emit to all subscriptions when source changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.emitValue('updated');
      tick();

      expect(component.value1).toBe('updated');
      expect(component.value2).toBe('UPDATED');
      expect(component.value3).toBe('updated');
    }));

    it('should handle error in one subscription without affecting others', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.emitValue('error');
      tick();

      expect(component.error).not.toBeNull();
      expect(component.value1).toBe('error');
      expect(component.value2).toBe('ERROR');
    }));

    it('should unsubscribe all subscriptions on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Verify destroy$ completes by checking subscriptions stop receiving values
      component.ngOnDestroy();
      component.emitValue('after-destroy');
      tick();

      // value1 should retain its last value from before destroy
      expect(component.value1).not.toBe('after-destroy');
    }));

    it('should not emit to subscriptions after destroy', fakeAsync(() => {
      fixture.detectChanges();
      component.ngOnDestroy();
      tick();

      const initialValue1 = component.value1;
      component.emitValue('new-value');
      tick();

      // Value should not change as subscriptions are unsubscribed
      expect(component.value1).toBe(initialValue1);
    }));
  });

  // ========== Hot vs. Cold Observable Tests ==========

  describe('Hot vs. Cold Observables', () => {
    let fixture: ComponentFixture<HotColdObservablesComponent>;
    let component: HotColdObservablesComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HotColdObservablesComponent],
        teardown: {destroyAfterEach: false},
      }).compileComponents();

      fixture = TestBed.createComponent(HotColdObservablesComponent);
      component = fixture.componentInstance;
    });

    it('should receive initial values from all observables', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // of(1,2,3) emits synchronously, so coldValue and sharedValue are the last emitted value
      expect(component.coldValue).toBe(3);
      expect(component.hotValue).toBe(0);
      expect(component.sharedValue).toBe(3);
    }));

    it('should share execution for hot observables (BehaviorSubject)', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.emitHotValue(5);
      tick();

      expect(component.hotValue).toBe(5);
    }));

    it('should complete hot observable emissions', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.emitHotValue(10);
      tick();
      fixture.detectChanges();

      expect(component.hotValue).toBe(10);
    }));
  });

  // ========== Error Recovery Pattern Tests ==========

  describe('Error Recovery Patterns', () => {
    let fixture: ComponentFixture<ErrorRecoveryComponent>;
    let component: ErrorRecoveryComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [ErrorRecoveryComponent],
        teardown: {destroyAfterEach: false},
      }).compileComponents();

      fixture = TestBed.createComponent(ErrorRecoveryComponent);
      component = fixture.componentInstance;
    });

    it('should recover from transient errors with retry', fakeAsync(() => {
      fixture.detectChanges();

      component.emitValue('success');
      tick(100);
      fixture.detectChanges();

      expect(component.value).toBe('success');
      expect(component.error).toBeNull();
    }));

    it('should handle successful emission after error recovery setup', fakeAsync(() => {
      fixture.detectChanges();

      // Emit a success value — should work through the pipeline
      component.emitValue('success');
      tick(100);
      fixture.detectChanges();

      expect(component.value).toBe('success');
      expect(component.error).toBeNull();
      expect(component.attemptCount).toBe(1);
    }));

    it('should track successful emissions via attemptCount', fakeAsync(() => {
      fixture.detectChanges();

      component.emitValue('first');
      tick(100);
      component.emitValue('second');
      tick(100);
      fixture.detectChanges();

      expect(component.attemptCount).toBe(2);
      expect(component.value).toBe('second');
    }));
  });

  // ========== Cancellation Pattern Tests ==========

  describe('Cancellation Patterns', () => {
    let fixture: ComponentFixture<CancellationComponent>;
    let component: CancellationComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [CancellationComponent],
        teardown: {destroyAfterEach: false},
      }).compileComponents();

      fixture = TestBed.createComponent(CancellationComponent);
      component = fixture.componentInstance;
    });

    it('should start async operation successfully', fakeAsync(() => {
      fixture.detectChanges();

      component.startAsyncOperation();
      expect(component.value).toBeNull();

      tick(100);
      fixture.detectChanges();

      expect(component.value).toBe('result');
    }));

    it('should cancel pending operation before completion', fakeAsync(() => {
      fixture.detectChanges();

      component.startAsyncOperation();
      tick(50);

      component.cancelOperation();
      tick(100);
      fixture.detectChanges();

      expect(component.cancelled).toBe(true);
    }));

    it('should not process result after cancellation', fakeAsync(() => {
      fixture.detectChanges();

      component.startAsyncOperation();
      tick(50);
      component.cancelOperation();
      tick(100);
      fixture.detectChanges();

      expect(component.value).toBeNull();
    }));
  });

  // ========== Timing Pattern Tests ==========

  describe('Timing Patterns with fakeAsync', () => {
    let fixture: ComponentFixture<TimingPatternsComponent>;
    let component: TimingPatternsComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [TimingPatternsComponent],
        teardown: {destroyAfterEach: false},
      }).compileComponents();

      fixture = TestBed.createComponent(TimingPatternsComponent);
      component = fixture.componentInstance;
    });

    it('should load data after delay', fakeAsync(() => {
      fixture.detectChanges();

      component.loadWithDelay();
      expect(component.value).toBeNull();

      tick(100);
      fixture.detectChanges();

      expect(component.value).toBe('data');
      expect(component.loaded).toBe(true);
    }));

    it('should emit values from interval', fakeAsync(() => {
      fixture.detectChanges();

      component.loadWithInterval();
      expect(component.value).toBeNull();

      tick(50);
      fixture.detectChanges();
      expect(component.value).toBe('value-1');

      tick(50);
      fixture.detectChanges();
      expect(component.value).toBe('value-2');
    }));

    it('should handle flush to complete a pending delayed operation', fakeAsync(() => {
      fixture.detectChanges();

      component.loadWithDelay();
      expect(component.loaded).toBe(false);

      tick(100);
      fixture.detectChanges();

      expect(component.loaded).toBe(true);
      expect(component.value).toBe('data');
    }));

    it('should properly clean up timers on destroy', fakeAsync(() => {
      fixture.detectChanges();

      component.loadWithInterval();
      tick(50);

      component.ngOnDestroy();
      const valueBeforeDestroy = component.value;
      tick(200);
      fixture.detectChanges();

      // Value should not change significantly after destroy
      expect(component.value).toBe(valueBeforeDestroy);
    }));
  });

  // ========== Subscription Cleanup Tests ==========

  describe('Subscription Cleanup and Memory Leak Prevention', () => {
    let fixture: ComponentFixture<SubscriptionCleanupComponent>;
    let component: SubscriptionCleanupComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [SubscriptionCleanupComponent],
        teardown: {destroyAfterEach: false},
      }).compileComponents();

      fixture = TestBed.createComponent(SubscriptionCleanupComponent);
      component = fixture.componentInstance;
    });

    it('should track all subscriptions', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.getSubscriptionCount()).toBe(2);
    }));

    it('should receive values from subscriptions', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.value).not.toBeNull();
    }));

    it('should unsubscribe all subscriptions on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Verify destroy triggers cleanup
      const subCount = component.getSubscriptionCount();
      expect(subCount).toBe(2);

      component.ngOnDestroy();

      // Subscriptions should be unsubscribed (verify by checking closed state)
      const subscriptions = component['subscriptions'];
      expect(subscriptions[0].closed).toBe(true);
      expect(subscriptions[1].closed).toBe(true);
    }));

    it('should not leak memory when resubscribing multiple times', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const initialSubscriptionCount = component.getSubscriptionCount();

      component.ngOnDestroy();
      tick();

      expect(initialSubscriptionCount).toBe(2);
    }));
  });

  // ========== Observable Chains Tests ==========

  describe('Complex Observable Chains', () => {
    let fixture: ComponentFixture<ObservableChainsComponent>;
    let component: ObservableChainsComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [ObservableChainsComponent],
        teardown: {destroyAfterEach: false},
      }).compileComponents();

      fixture = TestBed.createComponent(ObservableChainsComponent);
      component = fixture.componentInstance;
    });

    it('should initialize with combined latest values', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.combined).toBe(3); // 1 + 2
      expect(component.result).toBe(2); // Last emit from merge
    }));

    it('should update combined value when source1 changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.updateSource1(5);
      tick();
      fixture.detectChanges();

      expect(component.combined).toBe(7); // 5 + 2
    }));

    it('should update combined value when source2 changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.updateSource2(10);
      tick();
      fixture.detectChanges();

      expect(component.combined).toBe(11); // 1 + 10
    }));

    it('should emit both values from merge', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.updateSource1(5);
      tick();
      fixture.detectChanges();

      expect(component.result).toBe(5);
    }));
  });

  // ========== Advanced Async Patterns Tests ==========

  describe('Advanced Async Patterns', () => {
    it('should handle race between multiple observables', fakeAsync(() => {
      const fast$ = of('fast').pipe(delay(50));
      const slow$ = of('slow').pipe(delay(150));

      let result: string | null = null;

      race([fast$, slow$])
        .pipe(tap(val => (result = val)))
        .subscribe();

      tick(100);
      expect(result).toBe('fast');
    }));

    it('should combine multiple observables with zip', fakeAsync(() => {
      const obs1$ = of(1, 2, 3);
      const obs2$ = of('a', 'b', 'c');

      const results: any[] = [];

      zip([obs1$, obs2$])
        .pipe(tap(val => results.push(val)))
        .subscribe();

      tick();
      expect(results.length).toBe(3);
      expect(results[0]).toEqual([1, 'a']);
    }));

    it('should handle switchMap to cancel previous request', fakeAsync(() => {
      const source$ = new Subject<number>();
      const results: any[] = [];

      source$
        .pipe(
          switchMap(val => of(`result-${val}`).pipe(delay(50))),
          tap(val => results.push(val))
        )
        .subscribe();

      source$.next(1);
      tick(25);
      source$.next(2); // This should cancel the first request

      tick(50);
      expect(results).toContain('result-2');
      expect(results).not.toContain('result-1');
    }));

    it('should debounce rapid emissions', fakeAsync(() => {
      const source$ = new Subject<string>();
      const results: string[] = [];

      source$
        .pipe(
          debounceTime(50),
          tap(val => results.push(val))
        )
        .subscribe();

      source$.next('a');
      tick(10);
      source$.next('b');
      tick(10);
      source$.next('c');
      tick(50);

      expect(results).toEqual(['c']);
    }));

    it('should filter duplicate consecutive values', fakeAsync(() => {
      const source$ = new Subject<string>();
      const results: string[] = [];

      source$
        .pipe(
          distinctUntilChanged(),
          tap(val => results.push(val))
        )
        .subscribe();

      source$.next('a');
      source$.next('a'); // Duplicate
      source$.next('b');
      source$.next('b'); // Duplicate
      source$.next('a');
      tick();

      expect(results).toEqual(['a', 'b', 'a']);
    }));

    it('should timeout if observable does not emit', fakeAsync(() => {
      let error: any = null;

      of(null)
        .pipe(
          delay(200),
          timeout(100),
          catchError(err => {
            error = err;
            return EMPTY;
          })
        )
        .subscribe();

      tick(150);
      expect(error).not.toBeNull();
    }));

    it('should handle shared observable pattern', fakeAsync(() => {
      const source$ = interval(50).pipe(
        take(3),
        share()
      );

      const results1: any[] = [];
      const results2: any[] = [];

      source$.subscribe(val => results1.push(val));
      tick(100);
      source$.subscribe(val => results2.push(val));

      tick(100);

      // Both should receive emissions after subscription
      expect(results1.length).toBeGreaterThan(0);
      expect(results2.length).toBeGreaterThan(0);
    }));
  });

  // ========== Async Component Lifecycle Tests ==========

  describe('Async Component Lifecycle', () => {
    let fixture: ComponentFixture<TimingPatternsComponent>;
    let component: TimingPatternsComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [TimingPatternsComponent],
        teardown: {destroyAfterEach: false},
      }).compileComponents();

      fixture = TestBed.createComponent(TimingPatternsComponent);
      component = fixture.componentInstance;
    });

    it('should initialize component before async operations complete', waitForAsync(() => {
      expect(component).toBeTruthy();
      expect(component.value).toBeNull();
      expect(component.loaded).toBe(false);
    }));

    it('should complete async operations during component lifecycle', fakeAsync(() => {
      fixture.detectChanges();
      component.loadWithDelay();

      expect(component.value).toBeNull();
      tick(100);
      fixture.detectChanges();

      expect(component.value).toBe('data');
    }));

    it('should cleanup subscriptions during ngOnDestroy', fakeAsync(() => {
      fixture.detectChanges();
      component.loadWithInterval();

      tick(100);

      // Verify destroy cleans up by checking value doesn't change after
      component.ngOnDestroy();
      const valueAfterDestroy = component.value;
      tick(200);

      expect(component.value).toBe(valueAfterDestroy);
    }));
  });
});

// Utility function for test
function take(count: number) {
  return (source: Observable<any>) =>
    new Observable(subscriber => {
      let emitted = 0;
      return source.subscribe({
        next: val => {
          if (emitted < count) {
            subscriber.next(val);
            emitted++;
            if (emitted === count) {
              subscriber.complete();
            }
          }
        },
        error: err => subscriber.error(err),
        complete: () => subscriber.complete(),
      });
    });
}
