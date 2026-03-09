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

import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '@shared/module';
import {MachineFlavorFilter} from '@shared/entity/datacenter';
import {MachineFlavorFilterComponent} from './component';

describe('MachineFlavorFilterComponent', () => {
  let fixture: ComponentFixture<MachineFlavorFilterComponent>;
  let component: MachineFlavorFilterComponent;

  const mockFilter: MachineFlavorFilter = {
    minCPU: 2,
    maxCPU: 8,
    minRAM: 4096,
    maxRAM: 16384,
    enableGPU: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineFlavorFilterComponent);
    component = fixture.componentInstance;
    component.machineFlavorFilter = mockFilter;
  });

  it('should initialize component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should create form with filter controls', () => {
    fixture.detectChanges();
    expect(component.form).toBeTruthy();
    expect(component.form.get('minCPU')).toBeTruthy();
    expect(component.form.get('maxCPU')).toBeTruthy();
    expect(component.form.get('minRAM')).toBeTruthy();
    expect(component.form.get('maxRAM')).toBeTruthy();
    expect(component.form.get('enableGPU')).toBeTruthy();
  });

  it('should initialize form with filter values', () => {
    fixture.detectChanges();
    expect(component.form.get('minCPU').value).toBe(2);
    expect(component.form.get('maxCPU').value).toBe(8);
    expect(component.form.get('minRAM').value).toBe(4096);
    expect(component.form.get('maxRAM').value).toBe(16384);
    expect(component.form.get('enableGPU').value).toBe(false);
  });

  it('should initialize with default values when filter is null', () => {
    component.machineFlavorFilter = null;
    fixture.detectChanges();
    expect(component.form.get('minCPU').value).toBe(0);
    expect(component.form.get('maxCPU').value).toBe(0);
    expect(component.form.get('minRAM').value).toBe(0);
    expect(component.form.get('maxRAM').value).toBe(0);
    expect(component.form.get('enableGPU').value).toBe(false);
  });

  it('should emit onChange event with debounce on minCPU change', fakeAsync(() => {
    fixture.detectChanges();
    let emittedValue: MachineFlavorFilter;
    component.onChange.subscribe(value => {
      emittedValue = value;
    });

    component.form.get('minCPU').setValue(4);
    tick(100); // Before debounce time
    expect(emittedValue).toBeUndefined();

    tick(400); // After debounce time
    expect(emittedValue).toBeDefined();
    expect(emittedValue.minCPU).toBe(4);
  }));

  it('should emit onChange event on maxCPU change', fakeAsync(() => {
    fixture.detectChanges();
    let emittedValue: MachineFlavorFilter;
    component.onChange.subscribe(value => {
      emittedValue = value;
    });

    component.form.get('maxCPU').setValue(16);
    tick(500);
    expect(emittedValue.maxCPU).toBe(16);
  }));

  it('should emit onChange event on minRAM change', fakeAsync(() => {
    fixture.detectChanges();
    let emittedValue: MachineFlavorFilter;
    component.onChange.subscribe(value => {
      emittedValue = value;
    });

    component.form.get('minRAM').setValue(8192);
    tick(500);
    expect(emittedValue.minRAM).toBe(8192);
  }));

  it('should emit onChange event on maxRAM change', fakeAsync(() => {
    fixture.detectChanges();
    let emittedValue: MachineFlavorFilter;
    component.onChange.subscribe(value => {
      emittedValue = value;
    });

    component.form.get('maxRAM').setValue(32768);
    tick(500);
    expect(emittedValue.maxRAM).toBe(32768);
  }));

  it('should emit onChange event on enableGPU toggle', fakeAsync(() => {
    fixture.detectChanges();
    let emittedValue: MachineFlavorFilter;
    component.onChange.subscribe(value => {
      emittedValue = value;
    });

    component.form.get('enableGPU').setValue(true);
    tick(500);
    expect(emittedValue.enableGPU).toBe(true);
  }));

  it('should validate minimum values', () => {
    fixture.detectChanges();
    const minCpuControl = component.form.get('minCPU');
    minCpuControl.setValue(-1);
    expect(minCpuControl.valid).toBeFalse();
    minCpuControl.setValue(0);
    expect(minCpuControl.valid).toBeTrue();
  });

  it('should combine multiple field changes before emitting', fakeAsync(() => {
    fixture.detectChanges();
    let emittedCount = 0;
    component.onChange.subscribe(() => {
      emittedCount++;
    });

    component.form.get('minCPU').setValue(4);
    component.form.get('maxCPU').setValue(16);
    tick(500);

    // Both changes should result in one emission after debounce
    expect(emittedCount).toBe(1);
  }));

  it('should clean up subscriptions on destroy', () => {
    fixture.detectChanges();
    spyOn(component['_unsubscribe'], 'next');
    spyOn(component['_unsubscribe'], 'complete');

    component.ngOnDestroy();

    expect(component['_unsubscribe'].next).toHaveBeenCalled();
    expect(component['_unsubscribe'].complete).toHaveBeenCalled();
  });
});
