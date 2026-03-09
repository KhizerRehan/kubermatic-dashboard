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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '@shared/module';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {ExpansionPanelComponent} from './component';

describe('ExpansionPanelComponent', () => {
  let fixture: ComponentFixture<ExpansionPanelComponent>;
  let component: ExpansionPanelComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: {}},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpansionPanelComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  describe('Initialization', () => {
    it('should initialize with default expand label', () => {
      expect(component.expandLabel).toBe('Show more');
    });

    it('should initialize with default collapse label', () => {
      expect(component.collapseLabel).toBe('Show less');
    });

    it('should initialize as not expanded', () => {
      expect(component.expanded).toBe(false);
    });

    it('should not be initialized on first creation', () => {
      expect(component['_initialized']).toBe(false);
    });
  });

  describe('@Input properties', () => {
    it('should accept expandLabel input', () => {
      component.expandLabel = 'Custom expand';
      expect(component.expandLabel).toBe('Custom expand');
    });

    it('should accept collapseLabel input', () => {
      component.collapseLabel = 'Custom collapse';
      expect(component.collapseLabel).toBe('Custom collapse');
    });

    it('should set expanded property on initial input', () => {
      component.expanded = true;
      expect(component.expanded).toBe(true);
      expect(component['_initialized']).toBe(true);
    });

    it('should set expanded to false on initial input', () => {
      component.expanded = false;
      expect(component.expanded).toBe(false);
      expect(component['_initialized']).toBe(true);
    });

    it('should not update expanded after initialization', () => {
      component.expanded = true;
      expect(component.expanded).toBe(true);

      component.expanded = false;
      expect(component.expanded).toBe(true);
    });

    it('should ignore null expanded input', () => {
      component.expanded = null;
      expect(component['_initialized']).toBe(false);
    });

    it('should ignore undefined expanded input', () => {
      component.expanded = undefined;
      expect(component['_initialized']).toBe(false);
    });
  });

  describe('Toggle Functionality', () => {
    beforeEach(() => {
      component.expanded = false;
    });

    it('should toggle expanded from false to true', () => {
      expect(component.expanded).toBe(false);

      component.onClick();

      expect(component.expanded).toBe(true);
    });

    it('should toggle expanded from true to false', () => {
      component.expanded = true;

      component.onClick();

      expect(component.expanded).toBe(false);
    });

    it('should toggle multiple times consecutively', () => {
      expect(component.expanded).toBe(false);

      component.onClick();
      expect(component.expanded).toBe(true);

      component.onClick();
      expect(component.expanded).toBe(false);

      component.onClick();
      expect(component.expanded).toBe(true);
    });

    it('should maintain toggled state between multiple calls', () => {
      component.onClick();
      component.onClick();
      component.onClick();

      const stateAfterThreeClicks = component.expanded;

      component.onClick();

      expect(component.expanded).not.toBe(stateAfterThreeClicks);
    });
  });

  describe('Label Management', () => {
    it('should display custom expand label', () => {
      component.expandLabel = 'Expand details';
      expect(component.expandLabel).toBe('Expand details');
    });

    it('should display custom collapse label', () => {
      component.collapseLabel = 'Collapse details';
      expect(component.collapseLabel).toBe('Collapse details');
    });

    it('should support empty expand label', () => {
      component.expandLabel = '';
      expect(component.expandLabel).toBe('');
    });

    it('should support empty collapse label', () => {
      component.collapseLabel = '';
      expect(component.collapseLabel).toBe('');
    });

    it('should support special characters in expand label', () => {
      component.expandLabel = 'Show more... »';
      expect(component.expandLabel).toBe('Show more... »');
    });

    it('should support special characters in collapse label', () => {
      component.collapseLabel = '« Show less';
      expect(component.collapseLabel).toBe('« Show less');
    });

    it('should support very long labels', () => {
      const longLabel = 'Show more details about this particular section'.repeat(5);
      component.expandLabel = longLabel;
      expect(component.expandLabel).toBe(longLabel);
    });
  });

  describe('State Management', () => {
    it('should maintain expanded state correctly', () => {
      component.expanded = true;

      expect(component.expanded).toBe(true);
      expect(component['_initialized']).toBe(true);
    });

    it('should allow state changes via onClick after initial expansion', () => {
      component.expanded = true;

      component.onClick();
      expect(component.expanded).toBe(false);

      component.onClick();
      expect(component.expanded).toBe(true);
    });

    it('should preserve expanded state through multiple property accesses', () => {
      component.expanded = true;

      const state1 = component.expanded;
      const state2 = component.expanded;
      const state3 = component.expanded;

      expect(state1).toBe(state2);
      expect(state2).toBe(state3);
      expect(state1).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle clicking when not initialized', () => {
      expect(component['_initialized']).toBe(false);

      component.onClick();

      expect(component.expanded).toBe(true);
    });

    it('should handle multiple rapid clicks', () => {
      component.expanded = false;

      for (let i = 0; i < 10; i++) {
        component.onClick();
      }

      expect(component.expanded).toBe(true);
    });

    it('should handle numeric labels', () => {
      component.expandLabel = '123';
      component.collapseLabel = '456';

      expect(component.expandLabel).toBe('123');
      expect(component.collapseLabel).toBe('456');
    });

    it('should handle unicode characters in labels', () => {
      component.expandLabel = '展开更多 ▼';
      component.collapseLabel = '折叠 ▲';

      expect(component.expandLabel).toBe('展开更多 ▼');
      expect(component.collapseLabel).toBe('折叠 ▲');
    });
  });

  describe('Animation Support', () => {
    it('should be configured with shrinkGrow animation', () => {
      const metadata = (ExpansionPanelComponent as any).__annotations__[0];
      expect(metadata.animations).toBeDefined();
    });

    it('should support expansion state for animations', () => {
      component.expanded = false;
      expect(component.expanded).toBe(false);

      component.onClick();
      expect(component.expanded).toBe(true);
    });
  });
});
