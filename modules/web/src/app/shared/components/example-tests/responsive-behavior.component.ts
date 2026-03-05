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

import {Component, OnInit, OnDestroy, HostListener, ChangeDetectionStrategy} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

/**
 * Component demonstrating responsive behavior and cross-browser compatibility.
 *
 * This component showcases:
 * - Responsive layout changes based on window size
 * - Mobile-specific UI elements that show/hide at different breakpoints
 * - Touch event handling for mobile devices
 * - LocalStorage integration with fallback behavior
 * - Print styling considerations
 * - Window resize event handling
 *
 * @example
 * ```html
 * <km-responsive-behavior></km-responsive-behavior>
 * ```
 */
@Component({
  selector: 'km-responsive-behavior',
  templateUrl: './responsive-behavior.component.html',
  styleUrls: ['./responsive-behavior.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponsiveBehaviorComponent implements OnInit, OnDestroy {
  // Window size tracking
  windowWidth: number = window.innerWidth;
  windowHeight: number = window.innerHeight;

  // Breakpoint tracking
  isMobileViewport: boolean = false;
  isTabletViewport: boolean = false;
  isDesktopViewport: boolean = false;

  // Responsive state
  layoutMode: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  sidenavOpen: boolean = true;

  // Touch event tracking
  lastTouchEvent: string | null = null;
  touchStartPos: {x: number; y: number} | null = null;

  // LocalStorage state
  storedValue: string | null = null;
  localStorageAvailable: boolean = true;

  // Print state
  isPrinting: boolean = false;

  // Internal state
  private destroy$ = new Subject<void>();
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {}

  ngOnInit(): void {
    this.checkBreakpoints();
    this.loadFromLocalStorage();
    this.setupPrintListener();
  }

  ngOnDestroy(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Window resize event handler with debouncing.
   * Updates viewport size and checks breakpoints.
   */
  @HostListener('window:resize', ['$event'])
  onWindowResize(event?: Event): void {
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;

    // Debounce resize events for better performance
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      this.checkBreakpoints();
    }, 250);
  }

  /**
   * Touch start event handler.
   * Records initial touch position for gesture detection.
   */
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.lastTouchEvent = 'touchstart';
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.touchStartPos = {x: touch.clientX, y: touch.clientY};
    }
  }

  /**
   * Touch move event handler.
   * Detects swipe gestures for navigation.
   */
  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    this.lastTouchEvent = 'touchmove';
  }

  /**
   * Touch end event handler.
   * Completes gesture detection and triggers appropriate actions.
   */
  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    this.lastTouchEvent = 'touchend';
    if (event.changedTouches.length > 0 && this.touchStartPos) {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - this.touchStartPos.x;
      const deltaY = touch.clientY - this.touchStartPos.y;

      // Detect horizontal swipe for navigation
      if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 50) {
        if (deltaX > 0) {
          this.handleSwipeRight();
        } else {
          this.handleSwipeLeft();
        }
      }
    }
  }

  /**
   * Check breakpoints and update layout mode.
   * Breakpoints:
   * - Mobile: < 768px
   * - Tablet: 768px - 1024px
   * - Desktop: > 1024px
   */
  checkBreakpoints(): void {
    const width = this.windowWidth;

    this.isMobileViewport = width < 768;
    this.isTabletViewport = width >= 768 && width < 1024;
    this.isDesktopViewport = width >= 1024;

    // Update layout mode
    if (this.isMobileViewport) {
      this.layoutMode = 'mobile';
      // Close sidenav on mobile for better space usage
      this.sidenavOpen = false;
    } else if (this.isTabletViewport) {
      this.layoutMode = 'tablet';
    } else {
      this.layoutMode = 'desktop';
      // Keep sidenav open on desktop
      this.sidenavOpen = true;
    }
  }

  /**
   * Save value to LocalStorage with fallback handling.
   * If LocalStorage is not available, stores in memory only.
   */
  saveToLocalStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
      this.storedValue = value;
      this.localStorageAvailable = true;
    } catch (error) {
      // LocalStorage not available (private browsing, quota exceeded, etc.)
      console.warn('LocalStorage not available:', error);
      this.localStorageAvailable = false;
      this.storedValue = value; // Store in memory as fallback
    }
  }

  /**
   * Load value from LocalStorage with fallback handling.
   */
  loadFromLocalStorage(key: string = 'responsive-preference'): void {
    try {
      const value = localStorage.getItem(key);
      this.storedValue = value;
      this.localStorageAvailable = true;
    } catch (error) {
      console.warn('LocalStorage not available:', error);
      this.localStorageAvailable = false;
      this.storedValue = null;
    }
  }

  /**
   * Remove value from LocalStorage with fallback handling.
   */
  removeFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(key);
      this.storedValue = null;
      this.localStorageAvailable = true;
    } catch (error) {
      console.warn('LocalStorage not available:', error);
      this.localStorageAvailable = false;
    }
  }

  /**
   * Toggle sidenav visibility (useful on mobile).
   */
  toggleSidenav(): void {
    this.sidenavOpen = !this.sidenavOpen;
  }

  /**
   * Handle right swipe gesture.
   */
  private handleSwipeRight(): void {
    if (this.isMobileViewport && !this.sidenavOpen) {
      this.sidenavOpen = true;
    }
  }

  /**
   * Handle left swipe gesture.
   */
  private handleSwipeLeft(): void {
    if (this.isMobileViewport && this.sidenavOpen) {
      this.sidenavOpen = false;
    }
  }

  /**
   * Setup print listener for print mode detection.
   */
  private setupPrintListener(): void {
    // Detect when print dialog is opened/closed
    if (window.matchMedia) {
      const printMediaQuery = window.matchMedia('print');
      printMediaQuery.addListener((mq: MediaQueryListEvent) => {
        this.isPrinting = mq.matches;
      });
    }
  }

  /**
   * Get CSS class for current viewport.
   */
  getViewportClass(): string {
    if (this.isMobileViewport) return 'viewport-mobile';
    if (this.isTabletViewport) return 'viewport-tablet';
    return 'viewport-desktop';
  }

  /**
   * Get readable display size.
   */
  getDisplaySize(): string {
    return `${this.windowWidth}x${this.windowHeight}`;
  }
}
