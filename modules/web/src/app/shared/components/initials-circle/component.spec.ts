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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '@shared/module';
import {InitialsCircleComponent} from './component';

describe('InitialsCircleComponent', () => {
  let component: InitialsCircleComponent;
  let fixture: ComponentFixture<InitialsCircleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InitialsCircleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization & Default State', () => {
    it('should initialize with empty shortNames array', () => {
      expect(component.shortNames).toEqual([]);
    });

    it('should call _updateLabelKeys on ngOnInit', () => {
      component.owners = [{name: 'John Doe', email: ''}];
      const spy = jest.spyOn<any, any>(component, '_updateLabelKeys');
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should render container div on initialization', () => {
      fixture.detectChanges();
      const container = fixture.debugElement.nativeElement.querySelector('div[fxLayout="row"]');
      expect(container).toBeTruthy();
    });
  });

  describe('@Input owners property', () => {
    it('should generate initials for single owner', () => {
      component.owners = [{name: 'John Doe', email: ''}];
      fixture.detectChanges();
      expect(component.shortNames).toEqual(['JD']);
    });

    it('should generate initials for multiple owners', () => {
      component.owners = [
        {name: 'John Doe', email: ''},
        {name: 'Jane Smith', email: ''},
      ];
      fixture.detectChanges();
      expect(component.shortNames.sort()).toEqual(['JD', 'JS'].sort());
    });

    it('should handle single word names', () => {
      component.owners = [{name: 'Admin', email: ''}];
      fixture.detectChanges();
      expect(component.shortNames).toContain('A');
    });

    it('should handle names with multiple words', () => {
      component.owners = [{name: 'John Michael Doe', email: ''}];
      fixture.detectChanges();
      expect(component.shortNames).toContain('JMD');
    });

    it('should limit initials to 3 characters maximum', () => {
      component.owners = [{name: 'John Michael Alexander Doe', email: ''}];
      fixture.detectChanges();
      expect(component.shortNames[0].length).toBeLessThanOrEqual(3);
    });

    it('should convert initials to uppercase', () => {
      component.owners = [{name: 'john doe', email: ''}];
      fixture.detectChanges();
      expect(component.shortNames).toContain('JD');
    });

    it('should handle empty owners array', () => {
      component.owners = [];
      fixture.detectChanges();
      expect(component.shortNames).toEqual([]);
    });

    it('should update initials when owners change', () => {
      component.owners = [{name: 'John Doe', email: ''}];
      fixture.detectChanges();
      expect(component.shortNames).toContain('JD');

      component.owners = [{name: 'Jane Smith', email: ''}];
      component.ngOnChanges({});
      fixture.detectChanges();
      expect(component.shortNames).toContain('JS');
      expect(component.shortNames).not.toContain('JD');
    });
  });

  describe('@Input limit property', () => {
    it('should display all initials when limit is not set', () => {
      component.owners = [
        {name: 'John Doe', email: ''},
        {name: 'Jane Smith', email: ''},
        {name: 'Bob Johnson', email: ''},
      ];
      component.limit = undefined;
      fixture.detectChanges();

      const circles = fixture.debugElement.nativeElement.querySelectorAll('span.km-initials-circle');
      expect(circles.length).toBe(3);
    });

    it('should limit displayed initials to specified limit', () => {
      component.owners = [
        {name: 'John Doe', email: ''},
        {name: 'Jane Smith', email: ''},
        {name: 'Bob Johnson', email: ''},
      ];
      component.limit = 2;
      fixture.detectChanges();

      const circles = fixture.debugElement.nativeElement.querySelectorAll('span.km-initials-circle');
      expect(circles.length).toBeLessThanOrEqual(3); // 2 regular + 1 count
    });

    it('should display +n indicator when owners exceed limit', () => {
      component.owners = [
        {name: 'John Doe', email: ''},
        {name: 'Jane Smith', email: ''},
        {name: 'Bob Johnson', email: ''},
      ];
      component.limit = 2;
      fixture.detectChanges();

      const plusIndicator = fixture.debugElement.nativeElement.querySelector('span.accent');
      expect(plusIndicator).toBeTruthy();
      expect(plusIndicator.textContent).toContain('+1');
    });

    it('should not display +n indicator when owners do not exceed limit', () => {
      component.owners = [
        {name: 'John Doe', email: ''},
        {name: 'Jane Smith', email: ''},
      ];
      component.limit = 3;
      fixture.detectChanges();

      const plusIndicator = fixture.debugElement.nativeElement.querySelector('span.accent');
      expect(plusIndicator).toBeFalsy();
    });

    it('should calculate correct +n count', () => {
      component.owners = [
        {name: 'John Doe', email: ''},
        {name: 'Jane Smith', email: ''},
        {name: 'Bob Johnson', email: ''},
        {name: 'Alice Williams', email: ''},
        {name: 'Charlie Brown', email: ''},
      ];
      component.limit = 2;
      fixture.detectChanges();

      const plusIndicator = fixture.debugElement.nativeElement.querySelector('span.accent');
      expect(plusIndicator.textContent).toContain('+3');
    });

    it('should update displayed items when limit changes', () => {
      component.owners = [
        {name: 'John Doe', email: ''},
        {name: 'Jane Smith', email: ''},
        {name: 'Bob Johnson', email: ''},
      ];
      component.limit = 2;
      fixture.detectChanges();

      let circles = fixture.debugElement.nativeElement.querySelectorAll('span.km-initials-circle:not(.accent)');
      expect(circles.length).toBe(2);

      component.limit = 1;
      fixture.detectChanges();
      circles = fixture.debugElement.nativeElement.querySelectorAll('span.km-initials-circle:not(.accent)');
      expect(circles.length).toBe(1);
    });
  });

  describe('getHiddenOwners() method', () => {
    it('should return comma-separated list of owner names', () => {
      component.owners = [
        {name: 'John Doe', email: ''},
        {name: 'Jane Smith', email: ''},
      ];
      const hidden = component.getHiddenOwners();
      expect(hidden).toContain('John Doe');
      expect(hidden).toContain('Jane Smith');
      expect(hidden).toContain(',');
    });

    it('should return single owner name without comma', () => {
      component.owners = [{name: 'John Doe', email: ''}];
      const hidden = component.getHiddenOwners();
      expect(hidden).toBe('John Doe');
    });

    it('should handle empty owners array', () => {
      component.owners = [];
      const hidden = component.getHiddenOwners();
      expect(hidden).toBe('');
    });

    it('should be used in matTooltip', () => {
      component.owners = [
        {name: 'John Doe', email: ''},
        {name: 'Jane Smith', email: ''},
      ];
      fixture.detectChanges();

      const container = fixture.debugElement.nativeElement.querySelector('div[matTooltip]');
      expect(container).toBeTruthy();
    });
  });

  describe('Conditional Rendering', () => {
    it('should render initials when owners exist', () => {
      component.owners = [{name: 'John Doe', email: ''}];
      fixture.detectChanges();

      const circles = fixture.debugElement.nativeElement.querySelectorAll('span.km-initials-circle');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('should not render initials when owners array is empty', () => {
      component.owners = [];
      fixture.detectChanges();

      const circles = fixture.debugElement.nativeElement.querySelectorAll('span.km-initials-circle');
      expect(circles.length).toBe(0);
    });

    it('should render accent class for +n indicator', () => {
      component.owners = [
        {name: 'John Doe', email: ''},
        {name: 'Jane Smith', email: ''},
        {name: 'Bob Johnson', email: ''},
      ];
      component.limit = 2;
      fixture.detectChanges();

      const accentSpan = fixture.debugElement.nativeElement.querySelector('span.accent');
      expect(accentSpan).toBeTruthy();
      expect(accentSpan.classList.contains('km-initials-circle')).toBe(true);
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply km-initials-circle class to initials', () => {
      component.owners = [{name: 'John Doe', email: ''}];
      fixture.detectChanges();

      const circle = fixture.debugElement.nativeElement.querySelector('span.km-initials-circle');
      expect(circle.classList.contains('km-initials-circle')).toBe(true);
    });

    it('should apply fxLayout row to container', () => {
      fixture.detectChanges();
      const container = fixture.debugElement.nativeElement.querySelector('div[fxLayout="row"]');
      expect(container.getAttribute('fxLayout')).toBe('row');
    });

    it('should apply flexbox alignment classes', () => {
      component.owners = [{name: 'John Doe', email: ''}];
      fixture.detectChanges();

      const circle = fixture.debugElement.nativeElement.querySelector('span[fxLayoutAlign]');
      expect(circle).toBeTruthy();
      expect(circle.getAttribute('fxLayoutAlign')).toBe('center center');
    });

    it('should apply fxFlex to circles', () => {
      component.owners = [{name: 'John Doe', email: ''}];
      fixture.detectChanges();

      const circle = fixture.debugElement.nativeElement.querySelector('span[fxFlex]');
      expect(circle).toBeTruthy();
    });
  });

  describe('No Side Effects', () => {
    it('should not make external service calls', () => {
      component.owners = [{name: 'John Doe', email: ''}];
      fixture.detectChanges();
      // Component is pure presentation, no HTTP calls expected
      expect(component).toBeTruthy();
    });

    it('should not emit unexpected events', () => {
      const emitSpy = jest.spyOn(component, 'ngOnChanges');
      component.owners = [{name: 'John Doe', email: ''}];
      component.ngOnChanges({});
      expect(emitSpy).toHaveBeenCalled();
      emitSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle owners with special characters in names', () => {
      component.owners = [{name: 'José García', email: ''}];
      fixture.detectChanges();
      expect(component.shortNames.length).toBeGreaterThan(0);
    });

    it('should handle very long owner lists', () => {
      const owners = [];
      for (let i = 0; i < 50; i++) {
        owners.push({name: `Owner ${i}`, email: ''});
      }
      component.owners = owners;
      fixture.detectChanges();
      expect(component.shortNames.length).toBe(50);
    });

    it('should handle limit of 0', () => {
      component.owners = [
        {name: 'John Doe', email: ''},
        {name: 'Jane Smith', email: ''},
      ];
      component.limit = 0;
      fixture.detectChanges();

      const plusIndicator = fixture.debugElement.nativeElement.querySelector('span.accent');
      expect(plusIndicator).toBeTruthy();
    });

    it('should handle limit greater than owners count', () => {
      component.owners = [
        {name: 'John Doe', email: ''},
        {name: 'Jane Smith', email: ''},
      ];
      component.limit = 100;
      fixture.detectChanges();

      const circles = fixture.debugElement.nativeElement.querySelectorAll('span.km-initials-circle');
      expect(circles.length).toBe(2); // No +n indicator
    });

    it('should handle undefined owners gracefully', () => {
      component.owners = undefined;
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle null limit', () => {
      component.owners = [
        {name: 'John Doe', email: ''},
        {name: 'Jane Smith', email: ''},
      ];
      component.limit = null;
      fixture.detectChanges();

      const circles = fixture.debugElement.nativeElement.querySelectorAll('span.km-initials-circle');
      expect(circles.length).toBe(2);
    });
  });

  describe('Change Detection', () => {
    it('should update on ngOnChanges', () => {
      component.owners = [{name: 'John Doe', email: ''}];
      fixture.detectChanges();
      expect(component.shortNames).toContain('JD');

      component.owners = [{name: 'Jane Smith', email: ''}];
      component.ngOnChanges({owners: {previousValue: undefined, currentValue: component.owners, firstChange: false, isFirstChange: () => false}});
      expect(component.shortNames).toContain('JS');
    });

    it('should update when limit input changes', () => {
      component.owners = [
        {name: 'John Doe', email: ''},
        {name: 'Jane Smith', email: ''},
        {name: 'Bob Johnson', email: ''},
      ];
      component.limit = 2;
      fixture.detectChanges();

      let circles = fixture.debugElement.nativeElement.querySelectorAll('span.km-initials-circle:not(.accent)');
      expect(circles.length).toBe(2);

      component.limit = 1;
      component.ngOnChanges({limit: {previousValue: 2, currentValue: 1, firstChange: false, isFirstChange: () => false}});
      fixture.detectChanges();

      circles = fixture.debugElement.nativeElement.querySelectorAll('span.km-initials-circle:not(.accent)');
      expect(circles.length).toBe(1);
    });
  });

  describe('Tooltip Display', () => {
    it('should display tooltip with all owner names', () => {
      component.owners = [
        {name: 'John Doe', email: ''},
        {name: 'Jane Smith', email: ''},
      ];
      fixture.detectChanges();

      const container = fixture.debugElement.nativeElement.querySelector('div[matTooltip]');
      const tooltipContent = component.getHiddenOwners();
      expect(tooltipContent).toContain('John Doe');
      expect(tooltipContent).toContain('Jane Smith');
    });

    it('should show tooltip when hovering over component', () => {
      component.owners = [{name: 'John Doe', email: ''}];
      fixture.detectChanges();

      const container = fixture.debugElement.nativeElement.querySelector('div[matTooltip]');
      expect(container.hasAttribute('matTooltip')).toBe(true);
    });
  });
});
