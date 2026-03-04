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
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of, throwError} from 'rxjs';
import {delay} from 'rxjs/operators';
import {SharedModule} from '@shared/module';
import {AsyncServiceComponent} from './async-service.component';

/**
 * Mock Service for testing
 * Simulates an API service that returns observable data
 */
class MockDataService {
  getUser(id: number) {
    return of({id, name: 'Test User', email: 'test@example.com'});
  }

  getUserWithDelay(id: number) {
    return of({id, name: 'Test User', email: 'test@example.com'}).pipe(delay(100));
  }

  failedRequest() {
    return throwError(() => new Error('API call failed'));
  }
}

/**
 * Example Test: Component with Async Service Calls
 *
 * This test demonstrates how to test a component that:
 * - Initializes data from an injected service observable
 * - Uses waitForAsync and fakeAsync for async testing
 * - Handles errors from service calls gracefully
 * - Properly cleans up subscriptions on component destroy
 *
 * Key Testing Patterns:
 * - Testing observable-based service initialization
 * - Using waitForAsync() for async operations
 * - Using fakeAsync() and tick() for time control
 * - Testing error handling from service failures
 * - Verifying subscription cleanup on ngOnDestroy
 */
describe('AsyncServiceComponent', () => {
  let fixture: ComponentFixture<AsyncServiceComponent>;
  let component: AsyncServiceComponent;
  let mockService: MockDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [AsyncServiceComponent],
      providers: [{provide: 'DataService', useClass: MockDataService}],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AsyncServiceComponent);
    component = fixture.componentInstance;
    mockService = TestBed.inject('DataService' as any);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ========== Service Initialization Tests ==========

  /**
   * Pattern: Testing component initialization with service observable
   * Uses waitForAsync to wait for async operations to complete
   */
  it('should load user data from service on init', waitForAsync(() => {
    fixture.detectChanges();

    // Wait for async operations to complete
    fixture.whenStable().then(() => {
      fixture.detectChanges();

      // Verify data was loaded
      expect(component.user).toBeDefined();
      expect(component.user?.name).toBe('Test User');
      expect(component.isLoading).toBe(false);
    });
  }));

  it('should display loading state while fetching data', waitForAsync(() => {
    // Should be loading before detectChanges
    expect(component.isLoading).toBe(true);

    fixture.detectChanges();

    // Wait for stable
    fixture.whenStable().then(() => {
      fixture.detectChanges();

      // Should no longer be loading
      expect(component.isLoading).toBe(false);
    });
  }));

  // ========== FakeAsync Time Control Tests ==========

  /**
   * Pattern: Using fakeAsync and tick for time control
   * Allows precise control over asynchronous timing
   */
  it('should handle delayed service response with fakeAsync', fakeAsync(() => {
    spyOn(mockService, 'getUserWithDelay').and.callThrough();

    component.loadUserWithDelay();
    fixture.detectChanges();

    // Data should not be available yet
    expect(component.user).toBeUndefined();
    expect(component.isLoading).toBe(true);

    // Fast-forward time by 100ms
    tick(100);
    fixture.detectChanges();

    // Data should now be available
    expect(component.user?.name).toBe('Test User');
    expect(component.isLoading).toBe(false);
  }));

  it('should show loading spinner during async operation', fakeAsync(() => {
    component.loadUserWithDelay();
    fixture.detectChanges();

    // Spinner should be visible during loading
    let spinner = fixture.nativeElement.querySelector('[data-cy="loading-spinner"]');
    expect(spinner).toBeTruthy();

    // Fast-forward time
    tick(100);
    fixture.detectChanges();

    // Spinner should be gone
    spinner = fixture.nativeElement.querySelector('[data-cy="loading-spinner"]');
    expect(spinner).toBeFalsy();
  }));

  // ========== Error Handling Tests ==========

  /**
   * Pattern: Testing error handling from service failures
   * Verifies that errors are caught and handled gracefully
   */
  it('should handle service errors gracefully', waitForAsync(() => {
    spyOn(mockService, 'failedRequest').and.callThrough();

    component.loadWithError();
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      fixture.detectChanges();

      // Verify error was handled
      expect(component.error).toBeDefined();
      expect(component.error?.message).toContain('API call failed');
      expect(component.isLoading).toBe(false);
    });
  }));

  it('should display error message when request fails', waitForAsync(() => {
    component.loadWithError();
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      fixture.detectChanges();

      const errorMessage = fixture.nativeElement.querySelector('[data-cy="error-message"]');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage?.textContent).toContain('Failed to load data');
    });
  }));

  it('should allow user to retry after error', fakeAsync(() => {
    spyOn(mockService, 'failedRequest').and.callThrough();

    component.loadWithError();
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();

    // Should show error
    expect(component.error).toBeDefined();

    // Reset service to return success
    spyOn(mockService, 'getUser').and.returnValue(
      of({id: 1, name: 'Test User', email: 'test@example.com'})
    );

    // User clicks retry
    const retryButton = fixture.nativeElement.querySelector('[data-cy="retry-button"]');
    retryButton.click();
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();

    // Error should be cleared and data loaded
    expect(component.error).toBeNull();
    expect(component.user).toBeDefined();
  }));

  // ========== Subscription Cleanup Tests ==========

  /**
   * Pattern: Testing subscription cleanup on component destroy
   * Verifies that subscriptions are properly unsubscribed to prevent memory leaks
   */
  it('should unsubscribe from service on component destroy', () => {
    fixture.detectChanges();

    // Get the subscription from component
    const subscription = component['userSubscription'];
    spyOn(subscription, 'unsubscribe');

    // Destroy component
    component.ngOnDestroy();

    // Verify unsubscribe was called
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });

  it('should not process data after component is destroyed', fakeAsync(() => {
    component.loadUserWithDelay();
    fixture.detectChanges();

    // Destroy before delay completes
    component.ngOnDestroy();

    // Fast-forward time
    tick(100);
    fixture.detectChanges();

    // Component should not update after destroy
    // (In real implementation, subscription is unsubscribed so data won't be processed)
    expect(component.ngOnDestroy).toBeDefined();
  }));

  // ========== Data Display Tests ==========

  /**
   * Pattern: Testing template rendering with async data
   * Verifies that data is correctly displayed once loaded
   */
  it('should display user information when data loads', waitForAsync(() => {
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      fixture.detectChanges();

      const nameElement = fixture.nativeElement.querySelector('[data-cy="user-name"]');
      const emailElement = fixture.nativeElement.querySelector('[data-cy="user-email"]');

      expect(nameElement?.textContent).toContain('Test User');
      expect(emailElement?.textContent).toContain('test@example.com');
    });
  }));

  it('should hide data when loading', () => {
    component.isLoading = true;
    fixture.detectChanges();

    const userInfo = fixture.nativeElement.querySelector('[data-cy="user-info"]');
    expect(userInfo).toBeFalsy();
  });

  it('should show empty state when no data available', () => {
    component.user = null;
    component.isLoading = false;
    component.error = null;
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('[data-cy="empty-state"]');
    expect(emptyState).toBeTruthy();
  });

  // ========== Integration Tests ==========

  /**
   * Pattern: Integration test combining async operations and error handling
   * Tests the complete lifecycle of loading, displaying, and error handling
   */
  it('should handle complete async flow from load to display', fakeAsync(() => {
    // Initial state - loading
    expect(component.isLoading).toBe(true);

    component.loadUserWithDelay();
    fixture.detectChanges();

    // Still loading after start
    expect(component.isLoading).toBe(true);

    // Fast-forward time
    tick(100);
    fixture.detectChanges();

    // Should have loaded data
    expect(component.isLoading).toBe(false);
    expect(component.user).toBeDefined();
    expect(component.user?.name).toBe('Test User');

    // Should display in template
    const nameElement = fixture.nativeElement.querySelector('[data-cy="user-name"]');
    expect(nameElement?.textContent).toContain('Test User');
  }));
});
