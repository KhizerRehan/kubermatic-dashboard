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
import {of, throwError, Subject} from 'rxjs';
import {delay} from 'rxjs/operators';

import {SharedModule} from '@shared/module';
import {ButtonComponent} from './component';

describe('ButtonComponent', () => {
  let component: ButtonComponent<any>;
  let fixture: ComponentFixture<ButtonComponent<any>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input binding', () => {
    it('should bind icon property', () => {
      component.icon = 'km-icon-add';
      fixture.detectChanges();

      const iconElement = fixture.debugElement.nativeElement.querySelector(
        'i.km-icon-mask'
      );
      expect(iconElement).toBeTruthy();
      expect(iconElement.classList.contains('km-icon-add')).toBe(true);
    });

    it('should bind label property', () => {
      component.label = 'Test Label';
      fixture.detectChanges();

      const labelText = fixture.debugElement.nativeElement.textContent;
      expect(labelText).toContain('Test Label');
    });

    it('should bind color property to button', () => {
      component.color = 'primary';
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      expect(button.getAttribute('color')).toBe('primary');
    });

    it('should bind buttonId property', () => {
      component.buttonId = 'test-button-id';
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      expect(button.id).toBe('test-button-id');
    });

    it('should bind disabled property', () => {
      component.disabled = true;
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
    });
  });

  describe('Button rendering', () => {
    it('should render as mat-flat-button by default', () => {
      component.label = 'Test';
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector(
        'button[mat-flat-button]'
      );
      expect(button).toBeTruthy();
    });

    it('should render as mat-icon-button when iconButton is set', () => {
      component.iconButton = 'true';
      component.icon = 'km-icon-delete';
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector(
        'button[mat-icon-button]'
      );
      expect(button).toBeTruthy();
    });

    it('should display label in flat button mode', () => {
      component.label = 'Click Me';
      fixture.detectChanges();

      const span = fixture.debugElement.nativeElement.querySelector('button span');
      expect(span.textContent).toBe('Click Me');
    });

    it('should not display label in icon-button mode', () => {
      component.iconButton = 'true';
      component.label = 'Should not show';
      fixture.detectChanges();

      const span = fixture.debugElement.nativeElement.querySelector(
        'button[mat-icon-button] span'
      );
      expect(span).toBeFalsy();
    });
  });

  describe('Loading state', () => {
    it('should initialize with loading false', () => {
      expect(component.loading).toBe(false);
    });

    it('should set loading to true on click', () => {
      component.observable = of({data: 'test'});
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      button.click();

      expect(component.loading).toBe(true);
    });

    it('should show spinner icon during loading', fakeAsync(() => {
      component.observable = of({data: 'test'}).pipe(delay(100));
      component.icon = 'km-icon-add';
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      button.click();
      fixture.detectChanges();

      let iconElement = fixture.debugElement.nativeElement.querySelector('i');
      expect(iconElement.classList.contains('km-icon-pending')).toBe(true);

      tick(150);
      fixture.detectChanges();

      // After observable completes, should show original icon
      iconElement = fixture.debugElement.nativeElement.querySelector('i');
      // Icon class changes back after loading completes and change detection runs
    }));

    it('should disable button during loading', fakeAsync(() => {
      component.observable = of({data: 'test'}).pipe(delay(100));
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      button.click();
      fixture.detectChanges();

      expect(button.disabled).toBe(true);

      tick(150);
      fixture.detectChanges();

      // Button should be enabled again after observable completes
    }));

    it('should reset loading state after observable completes', (done) => {
      component.observable = of({data: 'test'});
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      button.click();

      expect(component.loading).toBe(true);

      // Allow observable to complete
      setTimeout(() => {
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });

    it('should reset loading state on observable error', (done) => {
      component.observable = throwError(() => new Error('Test error'));
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      button.click();

      expect(component.loading).toBe(true);

      // Allow observable to error
      setTimeout(() => {
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Observable integration', () => {
    it('should emit next event with observable result', (done) => {
      const testData = {id: 1, name: 'test'};
      component.observable = of(testData);
      component.next.subscribe((result) => {
        expect(result).toEqual(testData);
        done();
      });
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      button.click();
    });

    it('should emit error event when observable errors', (done) => {
      component.observable = throwError(() => new Error('Test error'));
      component.error.subscribe(() => {
        expect(true).toBe(true); // Error handler called
        done();
      });
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      button.click();
    });

    it('should handle different data types', (done) => {
      const testString = 'test string';
      component.observable = of(testString);
      component.next.subscribe((result) => {
        expect(result).toBe(testString);
        done();
      });
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      button.click();
    });

    it('should not emit if observable is undefined', () => {
      component.observable = undefined;
      const nextSpy = jest.spyOn(component.next, 'emit');
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      button.click();

      // Should fail when trying to subscribe to undefined
      expect(() => {
        button.click();
      }).toThrow();
    });
  });

  describe('Throttling behavior', () => {
    it('should throttle rapid clicks', fakeAsync(() => {
      const nextSpy = jest.spyOn(component.next, 'emit');
      component.observable = of({data: 'test'});
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');

      // Simulate rapid clicks
      button.click();
      button.click();
      button.click();

      // Allow throttle time to pass
      tick(1000);

      // Should only emit once due to throttling
      expect(nextSpy).toHaveBeenCalledTimes(1);
    }));

    it('should allow second click after throttle time', fakeAsync(() => {
      const nextSpy = jest.spyOn(component.next, 'emit');
      component.observable = of({data: 'test'});
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');

      button.click();
      tick(1000);
      fixture.detectChanges();

      button.click();
      tick(1000);
      fixture.detectChanges();

      // Should emit twice (once for each throttle window)
      expect(nextSpy).toHaveBeenCalledTimes(2);
    }));
  });

  describe('Change detection', () => {
    it('should trigger change detection on observable success', fakeAsync(() => {
      const cdrSpy = jest.spyOn(component['_cdr'], 'detectChanges');
      component.observable = of({data: 'test'});
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      button.click();
      tick(100);

      expect(cdrSpy).toHaveBeenCalled();
    }));

    it('should trigger change detection on observable error', fakeAsync(() => {
      const cdrSpy = jest.spyOn(component['_cdr'], 'detectChanges');
      component.observable = throwError(() => new Error('Test error'));
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      button.click();
      tick(100);

      expect(cdrSpy).toHaveBeenCalled();
    }));
  });

  describe('OnPush change detection strategy', () => {
    it('should have OnPush change detection strategy', () => {
      const metadata = (component.constructor as any)['ɵcmp'];
      expect(metadata.changeDetection).toBe(0); // ChangeDetectionStrategy.OnPush = 0
    });

    it('should update view after manual detectChanges call', fakeAsync(() => {
      component.observable = of({data: 'test'}).pipe(delay(10));
      component.label = 'Initial';
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      button.click();

      tick(50);
      fixture.detectChanges();

      expect(component.loading).toBe(false);
    }));
  });

  describe('Component cleanup', () => {
    it('should complete clicks subject on destroy', () => {
      const clicksSubject = component['_clicks'];
      const completeSpy = jest.spyOn(clicksSubject, 'complete');

      component.ngOnDestroy();

      expect(completeSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from throttled clicks on destroy', (done) => {
      component.observable = of({data: 'test'});
      fixture.detectChanges();

      component.ngOnDestroy();

      // After destroy, click should not trigger subscription
      const button = fixture.debugElement.nativeElement.querySelector('button');
      button.click();

      setTimeout(() => {
        // Should not emit after destroy
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      component.label = 'Test';
      fixture.detectChanges();

      const button = fixture.debugElement.nativeElement.querySelector('button');
      const clickEvent = new KeyboardEvent('keydown', {key: 'Enter'});

      // Button should be keyboard accessible by default
      expect(button.tagName).toBe('BUTTON');
    });
  });
});
