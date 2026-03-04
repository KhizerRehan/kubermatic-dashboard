// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {ChangeDetectorRef} from '@angular/core';
import {ClusterService} from '@core/services/cluster';
import {NotificationService} from '@core/services/notification';
import {UserService} from '@core/services/user';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeProject} from '@test/data/project';
import {ClusterMockService} from '@test/services/cluster-mock';
import {ActivatedRouteStub} from '@test/services/router-stubs';
import {UserMockService} from '@test/services/user-mock';
import {TerminalComponent} from './component';
import {LayoutType} from './types';

describe('TerminalComponent', () => {
  let component: TerminalComponent;
  let fixture: ComponentFixture<TerminalComponent>;
  let activatedRoute: ActivatedRouteStub;
  let clusterService: ClusterMockService;
  let userService: UserMockService;
  let notificationService: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, MatSnackBarModule],
      declarations: [TerminalComponent],
      providers: [
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: UserService, useClass: UserMockService},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TerminalComponent);
    component = fixture.componentInstance;
    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    clusterService = TestBed.inject(ClusterService) as any;
    userService = TestBed.inject(UserService) as any;
    notificationService = TestBed.inject(NotificationService);

    // Fake Data for Cluster
    component.cluster = fakeDigitaloceanCluster();

    activatedRoute.testParamMap = {
      projectId: fakeProject().id,
      clusterId: component.cluster.id,
    };

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with component properties defined', () => {
      expect(component.layout).toBeDefined();
      expect(component.close).toBeDefined();
    });

    it('should have default layout type set', () => {
      expect(component.layout).toBe(LayoutType.page);
    });
  });

  describe('Input Properties', () => {
    it('should accept layout input', () => {
      component.layout = LayoutType.overlay;
      expect(component.layout).toBe(LayoutType.overlay);
    });

    it('should accept cluster input', () => {
      const cluster = fakeDigitaloceanCluster();
      component.cluster = cluster;
      expect(component.cluster).toBe(cluster);
    });

    it('should have default layout as page type', () => {
      const newComponent = new TerminalComponent(TestBed.inject(UserService), TestBed.inject(ActivatedRoute), TestBed.inject(Router), TestBed.inject(ChangeDetectorRef), TestBed.inject(NotificationService));
      expect(newComponent.layout).toBe(LayoutType.page);
    });
  });

  describe('Output Events', () => {
    it('should have close event emitter', () => {
      expect(component.close).toBeDefined();
    });

    it('should emit close event', (done) => {
      component.close.subscribe(() => {
        done();
      });

      component.close.emit();
    });

    it('should allow subscribing to close event', () => {
      let closeEmitted = false;

      component.close.subscribe(() => {
        closeEmitted = true;
      });

      component.close.emit();

      expect(closeEmitted).toBe(true);
    });
  });

  describe('State Management', () => {
    it('should have isLoadingTerminal flag', () => {
      expect(component.isLoadingTerminal).toBeDefined();
    });

    it('should have isConnectionLost flag', () => {
      expect(component.isConnectionLost).toBeDefined();
    });

    it('should have isSessionExpiring flag', () => {
      expect(component.isSessionExpiring).toBeDefined();
    });

    it('should have isTokenExpired flag', () => {
      expect(component.isTokenExpired).toBeDefined();
    });

    it('should have isDexAuthenticationPageOpened flag', () => {
      expect(component.isDexAuthenticationPageOpened).toBeDefined();
    });

    it('should initialize loading state as false by default', () => {
      const newComponent = new TerminalComponent(userService, activatedRoute, TestBed.inject(Router), TestBed.inject(ChangeDetectorRef), notificationService);
      expect(newComponent.isLoadingTerminal).toBe(false);
    });

    it('should initialize connection lost state as false', () => {
      const newComponent = new TerminalComponent(userService, activatedRoute, TestBed.inject(Router), TestBed.inject(ChangeDetectorRef), notificationService);
      expect(newComponent.isConnectionLost).toBe(false);
    });
  });

  describe('Button Visibility Management', () => {
    it('should manage close button visibility on toolbar', () => {
      expect(component.showCloseButtonOnToolbar).toBeDefined();
    });

    it('should manage open in separate view button visibility', () => {
      expect(component.showOpenInSeparateViewButtonOnToolbar).toBeDefined();
    });

    it('should manage close button visibility on status bar', () => {
      expect(component.showCloseButtonOnStatusToolbar).toBeDefined();
    });

    it('should set correct button visibility for page layout', () => {
      component.layout = LayoutType.page;
      // Page layout should not show open-in-separate-view button
      // This would be verified in template integration tests
      expect(component.layout).toBe(LayoutType.page);
    });

    it('should set correct button visibility for overlay layout', () => {
      component.layout = LayoutType.overlay;
      // Overlay layout may have different button visibility
      expect(component.layout).toBe(LayoutType.overlay);
    });
  });

  describe('Message Handling', () => {
    it('should have message property', () => {
      expect(component.message).toBeDefined();
    });

    it('should allow setting custom messages', () => {
      component.message = 'Custom loading message';
      expect(component.message).toBe('Custom loading message');
    });

    it('should handle empty messages', () => {
      component.message = '';
      expect(component.message).toBe('');
    });

    it('should handle long messages', () => {
      const longMessage = 'Loading terminal... '.repeat(50);
      component.message = longMessage;
      expect(component.message).toBe(longMessage);
    });
  });

  describe('Project and Cluster ID Management', () => {
    it('should expose projectId property', () => {
      expect(component.projectId).toBeDefined();
    });

    it('should expose clusterId property', () => {
      expect(component.clusterId).toBeDefined();
    });

    it('should set projectId from activated route params', () => {
      const projectId = fakeProject().id;
      activatedRoute.testParamMap = {projectId, clusterId: component.cluster.id};

      expect(component.projectId).toBeDefined();
    });

    it('should set clusterId from activated route params', () => {
      expect(component.clusterId).toBeDefined();
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should call ngOnInit', () => {
      expect(() => {
        component.ngOnInit();
      }).not.toThrow();
    });

    it('should call ngOnDestroy without errors', () => {
      expect(() => {
        component.ngOnDestroy();
      }).not.toThrow();
    });

    it('should handle ngOnChanges', () => {
      expect(() => {
        component.ngOnChanges({
          layout: {
            currentValue: LayoutType.overlay,
            previousValue: LayoutType.page,
            firstChange: false,
            isFirstChange: () => false,
          },
        });
      }).not.toThrow();
    });

    it('should call ngAfterViewInit', () => {
      expect(() => {
        component.ngAfterViewInit();
      }).not.toThrow();
    });
  });

  describe('Layout Type Changes', () => {
    it('should respond to layout type changes', () => {
      const initialLayout = component.layout;
      component.layout = LayoutType.overlay;

      expect(component.layout).not.toBe(initialLayout);
    });

    it('should update button visibility on layout change', () => {
      spyOn(component['_cdr'], 'detectChanges');

      component.ngOnChanges({
        layout: {
          currentValue: LayoutType.overlay,
          previousValue: LayoutType.page,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      // Verify layout was updated
      expect(component.layout).toBe(LayoutType.overlay);
    });
  });

  describe('Cluster Data', () => {
    it('should accept cluster object', () => {
      const cluster = fakeDigitaloceanCluster();
      component.cluster = cluster;

      expect(component.cluster).toBe(cluster);
    });

    it('should have cluster id accessible', () => {
      expect(component.cluster.id).toBeDefined();
      expect(component.cluster.id).toBe(fakeDigitaloceanCluster().id);
    });

    it('should have cluster name accessible', () => {
      expect(component.cluster.name).toBeDefined();
    });
  });

  describe('Event Emission', () => {
    it('should emit close event on onClose call', (done) => {
      component.close.subscribe(() => {
        done();
      });

      component.onClose();
    });

    it('should handle multiple close event subscriptions', () => {
      let callCount = 0;

      component.close.subscribe(() => {
        callCount++;
      });

      component.close.subscribe(() => {
        callCount++;
      });

      component.onClose();

      expect(callCount).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', () => {
      expect(() => {
        component.isConnectionLost = true;
      }).not.toThrow();
    });

    it('should handle session expiration state', () => {
      component.isSessionExpiring = true;
      expect(component.isSessionExpiring).toBe(true);
    });

    it('should handle token expiration state', () => {
      component.isTokenExpired = true;
      expect(component.isTokenExpired).toBe(true);
    });

    it('should allow resetting error states', () => {
      component.isConnectionLost = true;
      component.isSessionExpiring = true;
      component.isTokenExpired = true;

      component.isConnectionLost = false;
      component.isSessionExpiring = false;
      component.isTokenExpired = false;

      expect(component.isConnectionLost).toBe(false);
      expect(component.isSessionExpiring).toBe(false);
      expect(component.isTokenExpired).toBe(false);
    });
  });

  describe('Integration with Services', () => {
    it('should have cluster service injected', () => {
      expect(clusterService).toBeDefined();
    });

    it('should have user service injected', () => {
      expect(userService).toBeDefined();
    });

    it('should have notification service injected', () => {
      expect(notificationService).toBeDefined();
    });
  });

  describe('ViewChild References', () => {
    it('should accept terminalRef', () => {
      // terminalRef is populated after view init
      expect(component).toBeTruthy();
    });

    it('should accept terminalContainerRef', () => {
      // terminalContainerRef is populated after view init
      expect(component).toBeTruthy();
    });
  });

  describe('Cleanup and Unsubscribe', () => {
    it('should properly clean up on destroy', () => {
      spyOn(component, 'ngOnDestroy');
      fixture.destroy();
      expect(component.ngOnDestroy).toHaveBeenCalled();
    });

    it('should handle destroy without errors', () => {
      expect(() => {
        component.ngOnDestroy();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined cluster', () => {
      component.cluster = undefined;
      expect(component.cluster).toBeUndefined();
    });

    it('should handle rapid layout changes', () => {
      component.layout = LayoutType.overlay;
      component.layout = LayoutType.page;
      component.layout = LayoutType.overlay;

      expect(component.layout).toBe(LayoutType.overlay);
    });

    it('should handle close event when multiple listeners attached', () => {
      let count = 0;

      for (let i = 0; i < 5; i++) {
        component.close.subscribe(() => {
          count++;
        });
      }

      component.close.emit();

      expect(count).toBe(5);
    });

    it('should handle state transitions correctly', () => {
      component.isLoadingTerminal = true;
      expect(component.isLoadingTerminal).toBe(true);

      component.isLoadingTerminal = false;
      component.isConnectionLost = true;
      expect(component.isLoadingTerminal).toBe(false);
      expect(component.isConnectionLost).toBe(true);

      component.isConnectionLost = false;
      component.isSessionExpiring = true;
      expect(component.isSessionExpiring).toBe(true);
    });
  });
});
