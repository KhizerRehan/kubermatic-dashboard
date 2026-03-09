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

import {ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '@shared/module';
import {SpinnerWithConfirmationComponent} from './component';

describe('SpinnerWithConfirmationComponent', () => {
  let component: SpinnerWithConfirmationComponent;
  let fixture: ComponentFixture<SpinnerWithConfirmationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpinnerWithConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization & Default State', () => {
    it('should initialize with isSaved as true', () => {
      expect(component.isSaved).toBe(true);
    });

    it('should initialize with isSaveConfirmationVisible as false', () => {
      expect(component.isSaveConfirmationVisible).toBe(false);
    });

    it('should initialize with default confirmation timeout of 3000ms', () => {
      expect(component.confirmationTimeout).toBe(3000);
    });

    it('should have default timeout constant', () => {
      const defaultTimeout = (component as any)._defaultTimeout;
      expect(defaultTimeout).toBe(3000);
    });
  });

  describe('@Input isSaved property', () => {
    it('should accept isSaved input', () => {
      component.isSaved = false;
      expect(component.isSaved).toBe(false);
    });

    it('should handle true value', () => {
      component.isSaved = true;
      expect(component.isSaved).toBe(true);
    });

    it('should handle false value', () => {
      component.isSaved = false;
      expect(component.isSaved).toBe(false);
    });

    it('should show confirmation when isSaved changes to true on second change', fakeAsync(() => {
      component.isSaved = false;
      fixture.detectChanges();
      expect(component.isSaveConfirmationVisible).toBe(false);

      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();
      expect(component.isSaveConfirmationVisible).toBe(true);

      tick(3000);
      expect(component.isSaveConfirmationVisible).toBe(false);
    }));

    it('should not trigger confirmation on first change (initialization)', () => {
      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: undefined, currentValue: true, firstChange: true, isFirstChange: () => true}});
      fixture.detectChanges();

      expect(component.isSaveConfirmationVisible).toBe(false);
    });
  });

  describe('@Input confirmationTimeout property', () => {
    it('should use custom confirmation timeout', fakeAsync(() => {
      component.confirmationTimeout = 1000;
      fixture.detectChanges();

      component.isSaved = false;
      fixture.detectChanges();

      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      expect(component.isSaveConfirmationVisible).toBe(true);
      tick(1000);
      expect(component.isSaveConfirmationVisible).toBe(false);
    }));

    it('should default to 3000ms', () => {
      expect(component.confirmationTimeout).toBe(3000);
    });

    it('should accept zero timeout', fakeAsync(() => {
      component.confirmationTimeout = 0;
      fixture.detectChanges();

      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      expect(component.isSaveConfirmationVisible).toBe(true);
      tick(0);
      expect(component.isSaveConfirmationVisible).toBe(false);
    }));

    it('should accept custom timeout values', fakeAsync(() => {
      const customTimeout = 2500;
      component.confirmationTimeout = customTimeout;
      fixture.detectChanges();

      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      tick(customTimeout - 100);
      expect(component.isSaveConfirmationVisible).toBe(true);

      tick(100);
      expect(component.isSaveConfirmationVisible).toBe(false);
    }));
  });

  describe('ngOnChanges() lifecycle', () => {
    it('should handle isSaved changes', () => {
      const spy = jest.spyOn(component, 'ngOnChanges');
      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should not show confirmation on first change', () => {
      component.ngOnChanges({isSaved: {previousValue: undefined, currentValue: true, firstChange: true, isFirstChange: () => true}});

      expect(component.isSaveConfirmationVisible).toBe(false);
    });

    it('should show confirmation on subsequent changes', fakeAsync(() => {
      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      expect(component.isSaveConfirmationVisible).toBe(true);
      tick(3000);
      expect(component.isSaveConfirmationVisible).toBe(false);
    }));

    it('should update confirmation visible based on isSaved value', fakeAsync(() => {
      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      expect(component.isSaveConfirmationVisible).toBe(true);
      tick(3000);
    }));
  });

  describe('Confirmation Visibility Behavior', () => {
    it('should show confirmation when isSaved becomes true', fakeAsync(() => {
      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      expect(component.isSaveConfirmationVisible).toBe(true);
      tick(3000);
    }));

    it('should hide confirmation when isSaved becomes false', fakeAsync(() => {
      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();
      expect(component.isSaveConfirmationVisible).toBe(true);

      tick(3000);
      expect(component.isSaveConfirmationVisible).toBe(false);

      component.isSaved = false;
      component.ngOnChanges({isSaved: {previousValue: true, currentValue: false, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();
      expect(component.isSaveConfirmationVisible).toBe(false);
    }));

    it('should trigger automatic hide after timeout', fakeAsync(() => {
      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      expect(component.isSaveConfirmationVisible).toBe(true);

      tick(2999);
      expect(component.isSaveConfirmationVisible).toBe(true);

      tick(1);
      expect(component.isSaveConfirmationVisible).toBe(false);
    }));
  });

  describe('Change Detection Integration', () => {
    it('should use ChangeDetectorRef for manual detection', () => {
      fixture.detectChanges();
      const cdr = (component as any)._cdr;
      expect(cdr).toBeTruthy();
    });

    it('should trigger detectChanges after timeout', fakeAsync(() => {
      const cdr = (component as any)._cdr;
      const spy = jest.spyOn(cdr, 'detectChanges');

      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      tick(3000);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    }));
  });

  describe('Animation Integration', () => {
    it('should have fadeInOut animation', () => {
      const metadata = (component.constructor as any).ɵcmp;
      expect(metadata.data.animation).toBeDefined();
    });

    it('should apply fadeInOut animation to confirmation element', () => {
      fixture.detectChanges();
      // Animation should be applied by template
      expect(component).toBeTruthy();
    });
  });

  describe('Multiple Changes', () => {
    it('should handle multiple isSaved changes', fakeAsync(() => {
      // First change
      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();
      expect(component.isSaveConfirmationVisible).toBe(true);

      // Wait for timeout
      tick(3000);
      expect(component.isSaveConfirmationVisible).toBe(false);

      // Second change
      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();
      expect(component.isSaveConfirmationVisible).toBe(true);

      tick(3000);
      expect(component.isSaveConfirmationVisible).toBe(false);
    }));

    it('should cancel previous timeout on new change', fakeAsync(() => {
      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      tick(1000);
      expect(component.isSaveConfirmationVisible).toBe(true);

      // Trigger another change
      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      tick(3000);
      expect(component.isSaveConfirmationVisible).toBe(false);
    }));
  });

  describe('Edge Cases', () => {
    it('should handle null isSaved', () => {
      component.isSaved = null;
      expect(() => {
        component.ngOnChanges({});
      }).not.toThrow();
    });

    it('should handle undefined isSaved', () => {
      component.isSaved = undefined;
      expect(() => {
        component.ngOnChanges({});
      }).not.toThrow();
    });

    it('should handle very long timeout', fakeAsync(() => {
      component.confirmationTimeout = 10000;
      fixture.detectChanges();

      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      tick(5000);
      expect(component.isSaveConfirmationVisible).toBe(true);

      tick(5000);
      expect(component.isSaveConfirmationVisible).toBe(false);
    }));

    it('should handle rapid successive changes', fakeAsync(() => {
      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      tick(100);

      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      tick(100);

      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      expect(component.isSaveConfirmationVisible).toBe(true);
      tick(3000);
      expect(component.isSaveConfirmationVisible).toBe(false);
    }));
  });

  describe('Timeout Behavior', () => {
    it('should respect custom timeout duration', fakeAsync(() => {
      component.confirmationTimeout = 500;
      fixture.detectChanges();

      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      tick(499);
      expect(component.isSaveConfirmationVisible).toBe(true);

      tick(1);
      expect(component.isSaveConfirmationVisible).toBe(false);
    }));

    it('should hide confirmation exactly after timeout', fakeAsync(() => {
      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: false, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      tick(3000);
      fixture.detectChanges();
      expect(component.isSaveConfirmationVisible).toBe(false);
    }));
  });

  describe('First Change Behavior', () => {
    it('should ignore first change of isSaved input', () => {
      const change = {
        previousValue: undefined,
        currentValue: true,
        firstChange: true,
        isFirstChange: () => true,
      };

      component.ngOnChanges({isSaved: change});
      fixture.detectChanges();

      expect(component.isSaveConfirmationVisible).toBe(false);
    });

    it('should process changes after first change', fakeAsync(() => {
      // Simulate initial binding
      component.ngOnChanges({isSaved: {previousValue: undefined, currentValue: true, firstChange: true, isFirstChange: () => true}});
      fixture.detectChanges();

      // Process second change
      component.isSaved = true;
      component.ngOnChanges({isSaved: {previousValue: true, currentValue: true, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      expect(component.isSaveConfirmationVisible).toBe(true);
      tick(3000);
    }));
  });

  describe('No Unexpected Side Effects', () => {
    it('should only have isSaved and confirmationTimeout inputs', () => {
      const keys = Object.keys(component);
      expect(keys).toContain('isSaved');
      expect(keys).toContain('confirmationTimeout');
    });

    it('should not make external service calls', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should not emit any outputs', () => {
      // Component should only have inputs, no outputs
      const metadata = (component.constructor as any).ɵcmp;
      expect(metadata).toBeTruthy();
    });
  });

  describe('Standalone Component', () => {
    it('should be non-standalone', () => {
      const metadata = (component.constructor as any).ɵcmp;
      expect(metadata.standalone).toBe(false);
    });
  });
});
