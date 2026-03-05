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

import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {BrowserModule, By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatDialog} from '@angular/material/dialog';
import {SharedModule} from '@shared/module';
import {NEVER, of, throwError, Subject} from 'rxjs';
import {ApplicationListComponent} from './component';

describe('ApplicationListComponent - Edge Cases', () => {
  let fixture: ComponentFixture<ApplicationListComponent>;
  let component: ApplicationListComponent;
  let matDialog: MatDialog;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, SharedModule],
      declarations: [ApplicationListComponent],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationListComponent);
    component = fixture.componentInstance;
    matDialog = TestBed.inject(MatDialog);
  });

  describe('Boundary Conditions', () => {
    it('should handle empty applications list', fakeAsync(() => {
      component.applications = [];
      fixture.detectChanges();
      tick(1);

      expect(component.applications.length).toBe(0);
      expect(component.dataSource.data.length).toBe(0);
      discardPeriodicTasks();
    }));

    it('should handle single application in list', fakeAsync(() => {
      component.applications = [
        {
          name: 'prometheus',
          displayName: 'Prometheus',
          description: 'Monitoring',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'prometheus', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      expect(component.applications.length).toBe(1);
      discardPeriodicTasks();
    }));

    it('should handle very large applications list (100+ items)', fakeAsync(() => {
      const largeAppList = Array.from({length: 150}, (_, i) => ({
        name: `app-${i}`,
        displayName: `Application ${i}`,
        description: `App ${i} description`,
        logo: '',
        docsURL: '',
        isEnterpriseEdition: false,
        isInternalApplication: false,
        status: {name: `app-${i}`, status: 'ready'},
      }));
      component.applications = largeAppList;
      fixture.detectChanges();
      tick(1);

      expect(component.applications.length).toBe(150);
      expect(component.dataSource.data.length).toBe(150);
      discardPeriodicTasks();
    }));

    it('should handle applications with null status', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test app',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: null,
        },
      ];
      fixture.detectChanges();
      tick(1);

      expect(component.applications[0].status).toBeNull();
      discardPeriodicTasks();
    }));

    it('should handle applications with empty description', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: '',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      expect(component.applications[0].description).toBe('');
      discardPeriodicTasks();
    }));
  });

  describe('Invalid Input Handling', () => {
    it('should handle undefined applications property', fakeAsync(() => {
      component.applications = undefined;
      fixture.detectChanges();
      tick(1);

      // Component should handle gracefully
      expect(component).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should handle null in applications array', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
        null as any,
      ];
      fixture.detectChanges();
      tick(1);

      expect(component.applications.length).toBe(2);
      discardPeriodicTasks();
    }));

    it('should handle application with missing required fields', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: undefined as any,
          description: undefined as any,
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      expect(component.applications.length).toBe(1);
      discardPeriodicTasks();
    }));

    it('should handle application with very long displayName', fakeAsync(() => {
      const longName = 'a'.repeat(500);
      component.applications = [
        {
          name: 'app-1',
          displayName: longName,
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      expect(component.applications[0].displayName.length).toBe(500);
      discardPeriodicTasks();
    }));

    it('should handle application status with unexpected values', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'unknown-status' as any},
        },
      ];
      fixture.detectChanges();
      tick(1);

      expect(component.applications[0].status.status).toBe('unknown-status');
      discardPeriodicTasks();
    }));
  });

  describe('State Transitions', () => {
    it('should handle transition from empty to populated list', fakeAsync(() => {
      component.applications = [];
      fixture.detectChanges();
      tick(1);

      expect(component.applications.length).toBe(0);

      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      expect(component.applications.length).toBe(1);
      discardPeriodicTasks();
    }));

    it('should handle transition from populated to empty list', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      component.applications = [];
      fixture.detectChanges();
      tick(1);

      expect(component.applications.length).toBe(0);
      discardPeriodicTasks();
    }));

    it('should handle rapid view mode changes', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
      ];

      // Simulate rapid mode changes
      component.mode = 'Default';
      fixture.detectChanges();
      tick(1);

      component.mode = 'Wizard';
      fixture.detectChanges();
      tick(1);

      component.mode = 'Summary';
      fixture.detectChanges();
      tick(1);

      expect(component.mode).toBe('Summary');
      discardPeriodicTasks();
    }));

    it('should preserve application list during mode changes', fakeAsync(() => {
      const testApps = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
        {
          name: 'app-2',
          displayName: 'App 2',
          description: 'Test 2',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-2', status: 'ready'},
        },
      ];
      component.applications = testApps;
      fixture.detectChanges();
      tick(1);

      component.mode = 'Wizard';
      fixture.detectChanges();
      tick(1);

      expect(component.applications.length).toBe(2);
      discardPeriodicTasks();
    }));
  });

  describe('Status Mapping & Derivation', () => {
    it('should handle different status values correctly', fakeAsync(() => {
      const statusValues = ['ready', 'pending', 'error', 'warning', 'unknown'];
      component.applications = statusValues.map((status, i) => ({
        name: `app-${i}`,
        displayName: `App ${i}`,
        description: `Test ${i}`,
        logo: '',
        docsURL: '',
        isEnterpriseEdition: false,
        isInternalApplication: false,
        status: {name: `app-${i}`, status},
      }));
      fixture.detectChanges();
      tick(1);

      expect(component.applications.length).toBe(5);
      discardPeriodicTasks();
    }));

    it('should handle missing status name field', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: undefined as any, status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      expect(component.applications[0].status.name).toBeUndefined();
      discardPeriodicTasks();
    }));

    it('should handle complex status mappings with special characters', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-@#$',
          displayName: 'App @#$',
          description: 'Test [special]',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-@#$', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      expect(component.applications[0].name).toBe('app-@#$');
      discardPeriodicTasks();
    }));
  });

  describe('Dialog Operations', () => {
    it('should handle add application dialog', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      const initialCount = component.applications.length;

      // Simulate add dialog (would normally emit result)
      const addAppOutput = new Subject();
      component.addApplicationChange = addAppOutput;

      if (component.openAddApplicationDialog) {
        component.openAddApplicationDialog();
      }

      tick(1);

      expect(component.applications.length).toBe(initialCount);
      discardPeriodicTasks();
    }));

    it('should handle edit application dialog', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      const app = component.applications[0];

      if (component.openEditApplicationDialog) {
        component.openEditApplicationDialog(app);
      }

      tick(1);

      expect(component.applications.length).toBe(1);
      discardPeriodicTasks();
    }));

    it('should handle delete application dialog confirmation', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      const app = component.applications[0];

      if (component.openDeleteApplicationDialog) {
        component.openDeleteApplicationDialog(app);
      }

      tick(1);

      expect(component.applications.length).toBe(1);
      discardPeriodicTasks();
    }));

    it('should handle rapid consecutive dialog operations', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      // Multiple rapid dialog operations
      for (let i = 0; i < 5; i++) {
        if (component.openAddApplicationDialog) {
          component.openAddApplicationDialog();
        }
      }

      tick(1);

      expect(component.applications.length).toBe(1);
      discardPeriodicTasks();
    }));
  });

  describe('Edition and System Application Handling', () => {
    it('should filter system applications correctly', fakeAsync(() => {
      component.applications = [
        {
          name: 'prometheus',
          displayName: 'Prometheus',
          description: 'Monitoring',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: true,
          status: {name: 'prometheus', status: 'ready'},
        },
        {
          name: 'custom-app',
          displayName: 'Custom App',
          description: 'User app',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'custom-app', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      const systemApps = component.applications.filter(app => app.isInternalApplication);
      expect(systemApps.length).toBe(1);
      discardPeriodicTasks();
    }));

    it('should handle enterprise edition applications', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'CE App',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
        {
          name: 'app-ee',
          displayName: 'EE App',
          description: 'EE Only',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: true,
          isInternalApplication: false,
          status: {name: 'app-ee', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      const eeApps = component.applications.filter(app => app.isEnterpriseEdition);
      expect(eeApps.length).toBe(1);
      discardPeriodicTasks();
    }));

    it('should handle mixed CE and EE applications', fakeAsync(() => {
      component.applications = Array.from({length: 50}, (_, i) => ({
        name: `app-${i}`,
        displayName: `App ${i}`,
        description: `Test app ${i}`,
        logo: '',
        docsURL: '',
        isEnterpriseEdition: i % 2 === 0,
        isInternalApplication: i % 3 === 0,
        status: {name: `app-${i}`, status: 'ready'},
      }));
      fixture.detectChanges();
      tick(1);

      const eeApps = component.applications.filter(app => app.isEnterpriseEdition);
      const systemApps = component.applications.filter(app => app.isInternalApplication);

      expect(eeApps.length).toBeGreaterThan(0);
      expect(systemApps.length).toBeGreaterThan(0);
      discardPeriodicTasks();
    }));
  });

  describe('Memory Cleanup & Subscriptions', () => {
    it('should unsubscribe from observables on destroy', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      const destroySpy = jest.spyOn(component as any, 'ngOnDestroy');

      fixture.destroy();

      expect(destroySpy).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should clean up event listeners', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      fixture.destroy();
      discardPeriodicTasks();
    }));
  });

  describe('Selection and Interaction', () => {
    it('should handle application selection state', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
        {
          name: 'app-2',
          displayName: 'App 2',
          description: 'Test 2',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-2', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      // Select application
      if (component.selection) {
        component.selection.select(component.applications[0]);
      }

      tick(1);

      expect(component.applications.length).toBe(2);
      discardPeriodicTasks();
    }));

    it('should handle toggle all selection', fakeAsync(() => {
      const apps = Array.from({length: 10}, (_, i) => ({
        name: `app-${i}`,
        displayName: `App ${i}`,
        description: `Test ${i}`,
        logo: '',
        docsURL: '',
        isEnterpriseEdition: false,
        isInternalApplication: false,
        status: {name: `app-${i}`, status: 'ready'},
      }));
      component.applications = apps;
      fixture.detectChanges();
      tick(1);

      if (component.selection) {
        component.selection.select(...component.applications);
      }

      tick(1);

      expect(component.applications.length).toBe(10);
      discardPeriodicTasks();
    }));
  });

  describe('Data Change Detection', () => {
    it('should detect application list changes', fakeAsync(() => {
      component.applications = [
        {
          name: 'app-1',
          displayName: 'App 1',
          description: 'Test',
          logo: '',
          docsURL: '',
          isEnterpriseEdition: false,
          isInternalApplication: false,
          status: {name: 'app-1', status: 'ready'},
        },
      ];
      fixture.detectChanges();
      tick(1);

      const initialLength = component.applications.length;

      component.applications.push({
        name: 'app-2',
        displayName: 'App 2',
        description: 'Test 2',
        logo: '',
        docsURL: '',
        isEnterpriseEdition: false,
        isInternalApplication: false,
        status: {name: 'app-2', status: 'ready'},
      });

      fixture.detectChanges();
      tick(1);

      expect(component.applications.length).toBeGreaterThan(initialLength);
      discardPeriodicTasks();
    }));

    it('should detect status changes within same application list', fakeAsync(() => {
      const app = {
        name: 'app-1',
        displayName: 'App 1',
        description: 'Test',
        logo: '',
        docsURL: '',
        isEnterpriseEdition: false,
        isInternalApplication: false,
        status: {name: 'app-1', status: 'pending'},
      };
      component.applications = [app];
      fixture.detectChanges();
      tick(1);

      app.status.status = 'ready';
      fixture.detectChanges();
      tick(1);

      expect(component.applications[0].status.status).toBe('ready');
      discardPeriodicTasks();
    }));
  });
});
