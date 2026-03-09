// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
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
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Auth} from '@core/services/auth/service';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {WizardService} from '@core/services/wizard/wizard';
import {SharedModule} from '@shared/module';
import {EventRateLimitConfig} from '@shared/entity/cluster';
import {AuthMockService} from '@test/services/auth-mock';
import {EventRateLimitComponent} from './component';

describe('EventRateLimitComponent', () => {
  let fixture: ComponentFixture<EventRateLimitComponent>;
  let component: EventRateLimitComponent;
  let dialogModeService: jasmine.SpyObj<DialogModeService>;

  const mockEventRateLimitConfig: EventRateLimitConfig = {
    namespace: {
      qps: 50,
      burst: 100,
      cacheSize: 4096,
    },
    server: {
      qps: 100,
      burst: 200,
      cacheSize: 8192,
    },
  };

  beforeEach(waitForAsync(() => {
    const dialogModeSpy = jasmine.createSpyObj('DialogModeService', [], {isEditDialog: false});

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
      declarations: [EventRateLimitComponent],
      providers: [
        WizardService,
        ClusterSpecService,
        {provide: Auth, useClass: AuthMockService},
        {provide: DialogModeService, useValue: dialogModeSpy},
      ],
    }).compileComponents();

    dialogModeService = TestBed.inject(DialogModeService) as jasmine.SpyObj<DialogModeService>;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventRateLimitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create event-rate-limit component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with FormArray', () => {
    expect(component.form).toBeTruthy();
    expect(component.eventRateLimitConfigArray).toBeTruthy();
  });

  it('should disable all controls when disableAll is true', () => {
    component.disableAll = true;
    fixture.detectChanges();
    expect(component.disableAll).toBeTrue();
  });

  it('should enforce admin settings when isEnforcedByAdmin is true', () => {
    component.isEnforcedByAdmin = true;
    fixture.detectChanges();
    component.ngOnInit();
    expect(component.disableAll).toBeTrue();
  });

  it('should add event type with default values', () => {
    const initialLength = component.eventRateLimitConfigArray.length;
    component.addEventType();
    expect(component.eventRateLimitConfigArray.length).toBe(initialLength + 1);
  });

  it('should add event type with custom values', () => {
    component.addEventType('namespace', 50, 100, 4096);
    expect(component.eventRateLimitConfigArray.length).toBeGreaterThan(0);
    const group = component.eventRateLimitConfigArray.at(0);
    expect(group.get('limitType').value).toBe('namespace');
    expect(group.get('qps').value).toBe(50);
    expect(group.get('burst').value).toBe(100);
    expect(group.get('cacheSize').value).toBe(4096);
  });

  it('should auto-populate default values when limit type is selected', () => {
    component.addEventType();
    const group = component.eventRateLimitConfigArray.at(0);
    component.onChangeType('namespace', 0);
    fixture.detectChanges();

    expect(group.get('qps').value).toBe(50);
    expect(group.get('burst').value).toBe(100);
    expect(group.get('cacheSize').value).toBe(4096);
  });

  it('should mark control as required when limit type is selected', () => {
    component.addEventType();
    const group = component.eventRateLimitConfigArray.at(0);
    group.get('limitType').setValue('namespace');
    fixture.detectChanges();

    expect(component.isRequired(0)).toBeTrue();
  });

  it('should block deletion when only two elements remain', () => {
    component.addEventType('namespace', 50, 100, 4096);
    component.addEventType('server', 100, 200, 8192);
    fixture.detectChanges();

    expect(component.blockDeletion()).toBeTrue();
  });

  it('should prevent duplicate event rate limit types', () => {
    component.addEventType('namespace', 50, 100, 4096);
    component.addEventType('server', 100, 200, 8192);
    fixture.detectChanges();

    const firstGroup = component.eventRateLimitConfigArray.at(0);
    const secondGroup = component.eventRateLimitConfigArray.at(1);

    const isDuplicate = component.isChosenType('namespace', secondGroup);
    expect(isDuplicate).toBe(true);
  });

  it('should clean up form on destroy', () => {
    spyOn(component.form, 'reset');
    spyOn(component['_unsubscribe'], 'next');
    spyOn(component['_unsubscribe'], 'complete');

    component.ngOnDestroy();

    expect(component.form.reset).toHaveBeenCalled();
    expect(component['_unsubscribe'].next).toHaveBeenCalled();
    expect(component['_unsubscribe'].complete).toHaveBeenCalled();
  });
});
