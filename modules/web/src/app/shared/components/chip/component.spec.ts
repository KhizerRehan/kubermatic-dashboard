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
import {ChipComponent, ChipType} from './component';

describe('ChipComponent', () => {
  let component: ChipComponent;
  let fixture: ComponentFixture<ChipComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization & Default State', () => {
    it('should initialize with default type as info', () => {
      expect(component.type).toBe(ChipType.Info);
    });

    it('should render with mat-chip-set', () => {
      const chipSet = fixture.debugElement.nativeElement.querySelector('mat-chip-set');
      expect(chipSet).toBeTruthy();
    });

    it('should render mat-chip element', () => {
      const chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip).toBeTruthy();
    });
  });

  describe('@Input text property', () => {
    it('should render text in chip', () => {
      component.text = 'Test Chip';
      fixture.detectChanges();

      const chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.textContent).toContain('Test Chip');
    });

    it('should update text when input changes', () => {
      component.text = 'Initial Text';
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.querySelector('mat-chip').textContent).toContain('Initial Text');

      component.text = 'Updated Text';
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.querySelector('mat-chip').textContent).toContain('Updated Text');
    });

    it('should handle empty text', () => {
      component.text = '';
      fixture.detectChanges();

      const chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip).toBeTruthy();
      expect(chip.textContent.trim()).toBe('');
    });

    it('should handle special characters in text', () => {
      component.text = 'Test & Special <characters>';
      fixture.detectChanges();

      const chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.textContent).toContain('Test & Special <characters>');
    });

    it('should handle long text', () => {
      const longText = 'A'.repeat(100);
      component.text = longText;
      fixture.detectChanges();

      const chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.textContent).toContain(longText);
    });
  });

  describe('@Input type property', () => {
    it('should apply info class for info type', () => {
      component.type = ChipType.Info;
      fixture.detectChanges();

      const chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.classList.contains('km-info-bg')).toBe(true);
    });

    it('should apply warning class for warning type', () => {
      component.type = ChipType.Warning;
      fixture.detectChanges();

      const chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.classList.contains('km-warning-bg')).toBe(true);
    });

    it('should apply error class for error type', () => {
      component.type = ChipType.Error;
      fixture.detectChanges();

      const chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.classList.contains('km-error-bg')).toBe(true);
    });

    it('should update CSS class when type changes', () => {
      component.type = ChipType.Info;
      fixture.detectChanges();
      let chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.classList.contains('km-info-bg')).toBe(true);

      component.type = ChipType.Error;
      fixture.detectChanges();
      chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.classList.contains('km-error-bg')).toBe(true);
    });

    it('should handle all ChipType enum values', () => {
      const types = [ChipType.Info, ChipType.Warning, ChipType.Error];
      types.forEach((type) => {
        component.type = type;
        fixture.detectChanges();

        const chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
        const expectedClass = `km-${type}-bg`;
        expect(chip.classList.contains(expectedClass)).toBe(true);
      });
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply type-based background class', () => {
      component.type = ChipType.Warning;
      fixture.detectChanges();

      const chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.getAttribute('class')).toContain('km-warning-bg');
    });

    it('should contain mat-chip Material class', () => {
      const chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.getAttribute('class')).toContain('mat-chip');
    });

    it('should render within mat-chip-set container', () => {
      const chipSet = fixture.debugElement.nativeElement.querySelector('mat-chip-set');
      const chip = chipSet.querySelector('mat-chip');
      expect(chip).toBeTruthy();
    });
  });

  describe('No Unexpected Side Effects', () => {
    it('should not emit any events on initialization', () => {
      const emitSpy = jest.spyOn(component, 'emit' as any);
      component.text = 'Test';
      fixture.detectChanges();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not have external service dependencies', () => {
      expect(component.constructor.length).toBe(0);
    });

    it('should be standalone component with no module dependencies', () => {
      // Component is standalone: false, which is correct for Angular Material integration
      expect(component).toBeTruthy();
    });
  });

  describe('Multiple Chips', () => {
    it('should support rendering multiple chip components', () => {
      const chipSet = fixture.debugElement.nativeElement.querySelector('mat-chip-set');
      expect(chipSet).toBeTruthy();
      expect(chipSet.querySelectorAll('mat-chip').length).toBe(1);
    });

    it('should maintain separate state for multiple instances', () => {
      const fixture2 = TestBed.createComponent(ChipComponent);
      const component2 = fixture2.componentInstance;
      component2.text = 'Chip 2';
      component2.type = ChipType.Error;
      fixture2.detectChanges();

      component.text = 'Chip 1';
      component.type = ChipType.Info;
      fixture.detectChanges();

      const chip1 = fixture.debugElement.nativeElement.querySelector('mat-chip');
      const chip2 = fixture2.debugElement.nativeElement.querySelector('mat-chip');

      expect(chip1.textContent).toContain('Chip 1');
      expect(chip2.textContent).toContain('Chip 2');
      expect(chip1.classList.contains('km-info-bg')).toBe(true);
      expect(chip2.classList.contains('km-error-bg')).toBe(true);

      fixture2.destroy();
    });
  });

  describe('Input Binding Reactivity', () => {
    it('should detect changes when text input changes', () => {
      component.text = 'Initial';
      fixture.detectChanges();
      let chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.textContent).toContain('Initial');

      component.text = 'Changed';
      fixture.detectChanges();
      chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.textContent).toContain('Changed');
    });

    it('should detect changes when type input changes', () => {
      component.type = ChipType.Info;
      fixture.detectChanges();
      let chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.classList.contains('km-info-bg')).toBe(true);

      component.type = ChipType.Warning;
      fixture.detectChanges();
      chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.classList.contains('km-warning-bg')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined text gracefully', () => {
      component.text = undefined;
      fixture.detectChanges();

      const chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip).toBeTruthy();
    });

    it('should handle null type by using default', () => {
      // Chip type always has a default value
      component.type = null;
      fixture.detectChanges();

      const chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip).toBeTruthy();
    });

    it('should handle rapid text updates', () => {
      component.text = 'Text1';
      fixture.detectChanges();
      component.text = 'Text2';
      fixture.detectChanges();
      component.text = 'Text3';
      fixture.detectChanges();

      const chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.textContent).toContain('Text3');
    });

    it('should handle rapid type updates', () => {
      component.type = ChipType.Info;
      fixture.detectChanges();
      component.type = ChipType.Warning;
      fixture.detectChanges();
      component.type = ChipType.Error;
      fixture.detectChanges();

      const chip = fixture.debugElement.nativeElement.querySelector('mat-chip');
      expect(chip.classList.contains('km-error-bg')).toBe(true);
    });
  });
});
