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

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ClusterSpecService} from '@app/core/services/cluster-spec';
import {WizardService} from '@app/core/services/wizard/wizard';
import {SharedModule} from '@shared/module';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Subject} from 'rxjs';
import {NodeSettingsStepComponent} from './component';
import {WizardMockService} from '@test/services/wizard-mock';

describe('NodeSettingsStepComponent', () => {
  let fixture: ComponentFixture<NodeSettingsStepComponent>;
  let component: NodeSettingsStepComponent;
  let providerChanges$: Subject<NodeProvider>;

  beforeEach(waitForAsync(() => {
    providerChanges$ = new Subject<NodeProvider>();

    const clusterSpecServiceMock = {
      provider: NodeProvider.AWS,
      providerChanges: providerChanges$,
    };

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule],
      declarations: [NodeSettingsStepComponent],
      providers: [
        {provide: ClusterSpecService, useValue: clusterSpecServiceMock},
        {provide: WizardService, useValue: new WizardMockService()},
      ],
      schemas: [NO_ERRORS_SCHEMA],
      teardown: {destroyAfterEach: false},
    })
      .overrideComponent(NodeSettingsStepComponent, {
        set: {providers: [], template: '<div></div>'},
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeSettingsStepComponent);
    component = fixture.componentInstance;
  });

  it('should create and initialize form with nodeDataBasic and nodeDataExtended controls', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.form).toBeDefined();
    expect(component.form.get('nodeDataBasic')).toBeTruthy();
    expect(component.form.get('nodeDataExtended')).toBeTruthy();
  });

  it('should set provider from ClusterSpecService.provider on init', () => {
    fixture.detectChanges();

    expect(component.provider).toBe(NodeProvider.AWS);
  });

  it('should update provider when providerChanges emits a new value', () => {
    fixture.detectChanges();

    providerChanges$.next(NodeProvider.GCP);

    expect(component.provider).toBe(NodeProvider.GCP);
  });

  it('should track latest value when multiple provider changes emitted rapidly', () => {
    fixture.detectChanges();

    providerChanges$.next(NodeProvider.AWS);
    providerChanges$.next(NodeProvider.AZURE);
    providerChanges$.next(NodeProvider.GCP);

    expect(component.provider).toBe(NodeProvider.GCP);
  });

  it('should write value to form via writeValue', () => {
    fixture.detectChanges();

    const value = {
      nodeDataBasic: {machine_type: 't2.medium'},
      nodeDataExtended: {},
    };
    component.writeValue(value);

    expect(component.form.value).toEqual(value);
  });

  it('should fire onChange callback on form value change', () => {
    fixture.detectChanges();

    let lastEmitted: any;
    component.registerOnChange((value: any) => {
      lastEmitted = value;
    });

    component.form.patchValue({nodeDataBasic: {machine_type: 't2.large'}});

    expect(lastEmitted).toBeDefined();
    expect(lastEmitted.nodeDataBasic).toEqual({machine_type: 't2.large'});
  });

  it('should return null from validate() when form is valid', () => {
    fixture.detectChanges();

    const result = component.validate(null);

    expect(result).toBeNull();
  });

  it('should return validation error from validate() when form is invalid', () => {
    fixture.detectChanges();

    component.form.get('nodeDataBasic').setErrors({required: true});

    const result = component.validate(null);

    expect(result).toEqual({
      invalidForm: {valid: false, message: 'Node settings validation failed.'},
    });
  });

  it('should unsubscribe on destroy', () => {
    fixture.detectChanges();

    const unsubscribeSpy = jest.spyOn(component['_unsubscribe'], 'next');

    fixture.destroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
