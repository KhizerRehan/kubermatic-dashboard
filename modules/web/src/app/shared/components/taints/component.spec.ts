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
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatChipsModule} from '@angular/material/core';

import {TaintsComponent} from './component';
import {Taint} from '../../entity/node';

describe('TaintsComponent', () => {
  let fixture: ComponentFixture<TaintsComponent>;
  let component: TaintsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TaintsComponent, NoopAnimationsModule, MatChipsModule],
    });

    fixture = TestBed.createComponent(TaintsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty taints array', () => {
    expect(component.taints).toEqual([]);
  });

  describe('Display with taints', () => {
    it('should render mat-chip-set when taints are provided', () => {
      const taint1: Taint = {key: 'gpu', value: 'true', effect: Taint.NO_SCHEDULE};
      component.taints = [taint1];
      fixture.detectChanges();

      const chipSet = fixture.nativeElement.querySelector('mat-chip-set');
      expect(chipSet).toBeTruthy();
    });

    it('should render chips for each taint', () => {
      const taints: Taint[] = [
        {key: 'gpu', value: 'true', effect: Taint.NO_SCHEDULE},
        {key: 'memory', value: 'high', effect: Taint.PREFER_NO_SCHEDULE},
        {key: 'disk', value: 'limited', effect: Taint.NO_EXECUTE},
      ];
      component.taints = taints;
      fixture.detectChanges();

      const chips = fixture.nativeElement.querySelectorAll('mat-chip');
      expect(chips.length).toBe(3);
    });

    it('should display taint key in first div', () => {
      const taint: Taint = {key: 'gpu', value: 'true', effect: Taint.NO_SCHEDULE};
      component.taints = [taint];
      fixture.detectChanges();

      const chip = fixture.nativeElement.querySelector('mat-chip');
      const divs = chip.querySelectorAll('div');
      expect(divs[0].textContent).toBe('gpu');
    });

    it('should display taint value in second div with km-chip-accent class', () => {
      const taint: Taint = {key: 'gpu', value: 'true', effect: Taint.NO_SCHEDULE};
      component.taints = [taint];
      fixture.detectChanges();

      const chip = fixture.nativeElement.querySelector('mat-chip');
      const valueDiv = chip.querySelector('.km-chip-accent');
      expect(valueDiv).toBeTruthy();
      expect(valueDiv.textContent).toBe('true');
    });

    it('should display taint effect in third div', () => {
      const taint: Taint = {key: 'gpu', value: 'true', effect: Taint.NO_SCHEDULE};
      component.taints = [taint];
      fixture.detectChanges();

      const chip = fixture.nativeElement.querySelector('mat-chip');
      const divs = chip.querySelectorAll('div');
      expect(divs[2].textContent).toBe('NoSchedule');
    });

    it('should render NoSchedule effect correctly', () => {
      const taint: Taint = {key: 'test', value: 'val', effect: Taint.NO_SCHEDULE};
      component.taints = [taint];
      fixture.detectChanges();

      const chip = fixture.nativeElement.querySelector('mat-chip');
      const divs = chip.querySelectorAll('div');
      expect(divs[2].textContent).toBe(Taint.NO_SCHEDULE);
    });

    it('should render PreferNoSchedule effect correctly', () => {
      const taint: Taint = {key: 'test', value: 'val', effect: Taint.PREFER_NO_SCHEDULE};
      component.taints = [taint];
      fixture.detectChanges();

      const chip = fixture.nativeElement.querySelector('mat-chip');
      const divs = chip.querySelectorAll('div');
      expect(divs[2].textContent).toBe(Taint.PREFER_NO_SCHEDULE);
    });

    it('should render NoExecute effect correctly', () => {
      const taint: Taint = {key: 'test', value: 'val', effect: Taint.NO_EXECUTE};
      component.taints = [taint];
      fixture.detectChanges();

      const chip = fixture.nativeElement.querySelector('mat-chip');
      const divs = chip.querySelectorAll('div');
      expect(divs[2].textContent).toBe(Taint.NO_EXECUTE);
    });

    it('should display multiple taints with different effects', () => {
      const taints: Taint[] = [
        {key: 'gpu', value: 'true', effect: Taint.NO_SCHEDULE},
        {key: 'memory', value: 'high', effect: Taint.PREFER_NO_SCHEDULE},
        {key: 'disk', value: 'limited', effect: Taint.NO_EXECUTE},
      ];
      component.taints = taints;
      fixture.detectChanges();

      const chips = fixture.nativeElement.querySelectorAll('mat-chip');
      const effects = Array.from(chips).map(chip => {
        const divs = (chip as HTMLElement).querySelectorAll('div');
        return divs[2].textContent;
      });

      expect(effects).toEqual([Taint.NO_SCHEDULE, Taint.PREFER_NO_SCHEDULE, Taint.NO_EXECUTE]);
    });

    it('should handle special characters in taint key', () => {
      const taint: Taint = {
        key: 'node.kubernetes.io/gpu',
        value: 'true',
        effect: Taint.NO_SCHEDULE,
      };
      component.taints = [taint];
      fixture.detectChanges();

      const chip = fixture.nativeElement.querySelector('mat-chip');
      const divs = chip.querySelectorAll('div');
      expect(divs[0].textContent).toBe('node.kubernetes.io/gpu');
    });

    it('should handle special characters in taint value', () => {
      const taint: Taint = {key: 'custom-key', value: 'v1.2.3-alpha+build', effect: Taint.NO_EXECUTE};
      component.taints = [taint];
      fixture.detectChanges();

      const chip = fixture.nativeElement.querySelector('mat-chip');
      const valueDiv = chip.querySelector('.km-chip-accent');
      expect(valueDiv.textContent).toBe('v1.2.3-alpha+build');
    });

    it('should handle empty taint value', () => {
      const taint: Taint = {key: 'test-key', value: '', effect: Taint.NO_SCHEDULE};
      component.taints = [taint];
      fixture.detectChanges();

      const chip = fixture.nativeElement.querySelector('mat-chip');
      const valueDiv = chip.querySelector('.km-chip-accent');
      expect(valueDiv.textContent).toBe('');
    });

    it('should not be selectable', () => {
      component.taints = [{key: 'gpu', value: 'true', effect: Taint.NO_SCHEDULE}];
      fixture.detectChanges();

      const chipSet = fixture.nativeElement.querySelector('mat-chip-set');
      expect(chipSet.getAttribute('selectable')).toBe('false');
    });
  });

  describe('Display without taints', () => {
    it('should display "No assigned taints" message when taints array is empty', () => {
      component.taints = [];
      fixture.detectChanges();

      const message = fixture.nativeElement.querySelector('div');
      expect(message.textContent).toBe('No assigned taints');
    });

    it('should not render mat-chip-set when taints array is empty', () => {
      component.taints = [];
      fixture.detectChanges();

      const chipSet = fixture.nativeElement.querySelector('mat-chip-set');
      expect(chipSet).toBeFalsy();
    });

    it('should display "No assigned taints" message when taints is null', () => {
      component.taints = null as any;
      fixture.detectChanges();

      const message = fixture.nativeElement.querySelector('div');
      expect(message.textContent).toBe('No assigned taints');
    });

    it('should not render mat-chip-set when taints is null', () => {
      component.taints = null as any;
      fixture.detectChanges();

      const chipSet = fixture.nativeElement.querySelector('mat-chip-set');
      expect(chipSet).toBeFalsy();
    });

    it('should not render mat-chip-set when taints is undefined', () => {
      component.taints = undefined as any;
      fixture.detectChanges();

      const chipSet = fixture.nativeElement.querySelector('mat-chip-set');
      expect(chipSet).toBeFalsy();
    });
  });

  describe('Dynamic updates', () => {
    it('should update display when taints are added', () => {
      component.taints = [];
      fixture.detectChanges();

      let message = fixture.nativeElement.querySelector('div');
      expect(message.textContent).toBe('No assigned taints');

      component.taints = [{key: 'gpu', value: 'true', effect: Taint.NO_SCHEDULE}];
      fixture.detectChanges();

      const chipSet = fixture.nativeElement.querySelector('mat-chip-set');
      expect(chipSet).toBeTruthy();

      const chips = fixture.nativeElement.querySelectorAll('mat-chip');
      expect(chips.length).toBe(1);
    });

    it('should update display when taints are removed', () => {
      component.taints = [{key: 'gpu', value: 'true', effect: Taint.NO_SCHEDULE}];
      fixture.detectChanges();

      let chipSet = fixture.nativeElement.querySelector('mat-chip-set');
      expect(chipSet).toBeTruthy();

      component.taints = [];
      fixture.detectChanges();

      chipSet = fixture.nativeElement.querySelector('mat-chip-set');
      expect(chipSet).toBeFalsy();

      const message = fixture.nativeElement.querySelector('div');
      expect(message.textContent).toBe('No assigned taints');
    });

    it('should update display when taint properties change', () => {
      const taint: Taint = {key: 'gpu', value: 'true', effect: Taint.NO_SCHEDULE};
      component.taints = [taint];
      fixture.detectChanges();

      let divs = fixture.nativeElement.querySelector('mat-chip').querySelectorAll('div');
      expect(divs[0].textContent).toBe('gpu');

      taint.key = 'cpu';
      fixture.detectChanges();

      divs = fixture.nativeElement.querySelector('mat-chip').querySelectorAll('div');
      expect(divs[0].textContent).toBe('cpu');
    });

    it('should update display when taint value changes', () => {
      const taint: Taint = {key: 'gpu', value: 'true', effect: Taint.NO_SCHEDULE};
      component.taints = [taint];
      fixture.detectChanges();

      let valueDiv = fixture.nativeElement.querySelector('.km-chip-accent');
      expect(valueDiv.textContent).toBe('true');

      taint.value = 'false';
      fixture.detectChanges();

      valueDiv = fixture.nativeElement.querySelector('.km-chip-accent');
      expect(valueDiv.textContent).toBe('false');
    });

    it('should update display when taint effect changes', () => {
      const taint: Taint = {key: 'gpu', value: 'true', effect: Taint.NO_SCHEDULE};
      component.taints = [taint];
      fixture.detectChanges();

      let divs = fixture.nativeElement.querySelector('mat-chip').querySelectorAll('div');
      expect(divs[2].textContent).toBe(Taint.NO_SCHEDULE);

      taint.effect = Taint.NO_EXECUTE;
      fixture.detectChanges();

      divs = fixture.nativeElement.querySelector('mat-chip').querySelectorAll('div');
      expect(divs[2].textContent).toBe(Taint.NO_EXECUTE);
    });

    it('should handle replacing entire taints array', () => {
      component.taints = [{key: 'gpu', value: 'true', effect: Taint.NO_SCHEDULE}];
      fixture.detectChanges();

      let chips = fixture.nativeElement.querySelectorAll('mat-chip');
      expect(chips.length).toBe(1);

      component.taints = [
        {key: 'cpu', value: '8', effect: Taint.PREFER_NO_SCHEDULE},
        {key: 'memory', value: '16Gi', effect: Taint.NO_EXECUTE},
      ];
      fixture.detectChanges();

      chips = fixture.nativeElement.querySelectorAll('mat-chip');
      expect(chips.length).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle taint with very long key', () => {
      const longKey = 'a'.repeat(255);
      const taint: Taint = {key: longKey, value: 'value', effect: Taint.NO_SCHEDULE};
      component.taints = [taint];
      fixture.detectChanges();

      const chip = fixture.nativeElement.querySelector('mat-chip');
      const divs = chip.querySelectorAll('div');
      expect(divs[0].textContent).toBe(longKey);
    });

    it('should handle taint with very long value', () => {
      const longValue = 'x'.repeat(255);
      const taint: Taint = {key: 'key', value: longValue, effect: Taint.NO_SCHEDULE};
      component.taints = [taint];
      fixture.detectChanges();

      const chip = fixture.nativeElement.querySelector('mat-chip');
      const valueDiv = chip.querySelector('.km-chip-accent');
      expect(valueDiv.textContent).toBe(longValue);
    });

    it('should handle 10+ taints', () => {
      const taints: Taint[] = Array.from({length: 15}, (_, i) => ({
        key: `taint-${i}`,
        value: `value-${i}`,
        effect: [Taint.NO_SCHEDULE, Taint.PREFER_NO_SCHEDULE, Taint.NO_EXECUTE][i % 3],
      }));
      component.taints = taints;
      fixture.detectChanges();

      const chips = fixture.nativeElement.querySelectorAll('mat-chip');
      expect(chips.length).toBe(15);
    });

    it('should handle taints with duplicate keys', () => {
      const taints: Taint[] = [
        {key: 'gpu', value: 'true', effect: Taint.NO_SCHEDULE},
        {key: 'gpu', value: 'false', effect: Taint.NO_EXECUTE},
      ];
      component.taints = taints;
      fixture.detectChanges();

      const chips = fixture.nativeElement.querySelectorAll('mat-chip');
      expect(chips.length).toBe(2);
    });

    it('should handle numeric strings in taint key and value', () => {
      const taint: Taint = {key: '123', value: '456', effect: Taint.NO_SCHEDULE};
      component.taints = [taint];
      fixture.detectChanges();

      const chip = fixture.nativeElement.querySelector('mat-chip');
      const divs = chip.querySelectorAll('div');
      expect(divs[0].textContent).toBe('123');
      expect(divs[1].textContent).toBe('456');
    });
  });
});
