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
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {UserMockService} from '@test/services/user-mock';
import {EventCardComponent} from './component';
import {Event} from '@shared/entity/event';

describe('EventCardComponent', () => {
  let fixture: ComponentFixture<EventCardComponent>;
  let component: EventCardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      providers: [{provide: UserService, useClass: UserMockService}],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventCardComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with empty events array', () => {
      expect(component.events).toEqual([]);
    });

    it('should initialize with isShowEvents as false', () => {
      expect(component.isShowEvents).toBe(false);
    });
  });

  describe('@Input properties', () => {
    it('should accept events input', () => {
      const events: Event[] = [
        {type: 'Normal', message: 'Event 1'} as Event,
        {type: 'Warning', message: 'Event 2'} as Event,
      ];
      component.events = events;
      expect(component.events).toEqual(events);
    });

    it('should accept empty events array', () => {
      component.events = [];
      expect(component.events).toEqual([]);
    });

    it('should accept null events', () => {
      component.events = null as any;
      expect(component.events).toEqual(null);
    });
  });

  describe('hasEvents', () => {
    it('should return false when events array is empty', () => {
      component.events = [];
      expect(component.hasEvents()).toBe(false);
    });

    it('should return true when events array has items', () => {
      component.events = [{type: 'Normal'} as Event];
      expect(component.hasEvents()).toBe(true);
    });

    it('should return true when events array has multiple items', () => {
      component.events = [
        {type: 'Normal'} as Event,
        {type: 'Warning'} as Event,
        {type: 'Normal'} as Event,
      ];
      expect(component.hasEvents()).toBe(true);
    });

    it('should return false when events is null', () => {
      component.events = null;
      expect(component.hasEvents()).toBe(false);
    });

    it('should return false when events is undefined', () => {
      component.events = undefined as any;
      expect(component.hasEvents()).toBe(false);
    });
  });

  describe('toggleEvents', () => {
    it('should toggle isShowEvents from false to true', () => {
      component.isShowEvents = false;
      component.toggleEvents();
      expect(component.isShowEvents).toBe(true);
    });

    it('should toggle isShowEvents from true to false', () => {
      component.isShowEvents = true;
      component.toggleEvents();
      expect(component.isShowEvents).toBe(false);
    });

    it('should toggle multiple times consecutively', () => {
      component.isShowEvents = false;

      component.toggleEvents();
      expect(component.isShowEvents).toBe(true);

      component.toggleEvents();
      expect(component.isShowEvents).toBe(false);

      component.toggleEvents();
      expect(component.isShowEvents).toBe(true);
    });

    it('should maintain toggle state correctly', () => {
      for (let i = 0; i < 5; i++) {
        component.toggleEvents();
      }

      expect(component.isShowEvents).toBe(true);
    });
  });

  describe('getTypeIcon', () => {
    it('should return warning icon when events contain Warning type', () => {
      component.events = [
        {type: 'Warning', message: 'Warning event'} as Event,
        {type: 'Normal', message: 'Normal event'} as Event,
      ];

      expect(component.getTypeIcon()).toBe('km-icon-warning-event');
    });

    it('should return check icon when events only contain Normal type', () => {
      component.events = [{type: 'Normal', message: 'Normal event'} as Event];

      expect(component.getTypeIcon()).toBe('km-icon-check');
    });

    it('should return warning icon when all events are Warning type', () => {
      component.events = [
        {type: 'Warning', message: 'Warning 1'} as Event,
        {type: 'Warning', message: 'Warning 2'} as Event,
      ];

      expect(component.getTypeIcon()).toBe('km-icon-warning-event');
    });

    it('should return check icon when all events are Normal type', () => {
      component.events = [
        {type: 'Normal', message: 'Normal 1'} as Event,
        {type: 'Normal', message: 'Normal 2'} as Event,
      ];

      expect(component.getTypeIcon()).toBe('km-icon-check');
    });

    it('should return empty string when events array is empty', () => {
      component.events = [];

      expect(component.getTypeIcon()).toBe('');
    });

    it('should return empty string when events is null', () => {
      component.events = null;

      expect(component.getTypeIcon()).toBe('');
    });

    it('should return empty string when events is undefined', () => {
      component.events = undefined as any;

      expect(component.getTypeIcon()).toBe('');
    });

    it('should return empty string when events have unknown type', () => {
      component.events = [{type: 'Unknown', message: 'Unknown event'} as Event];

      expect(component.getTypeIcon()).toBe('');
    });

    it('should prioritize Warning icon over Normal icon', () => {
      component.events = [
        {type: 'Normal', message: 'First'} as Event,
        {type: 'Warning', message: 'Second'} as Event,
      ];

      expect(component.getTypeIcon()).toBe('km-icon-warning-event');
    });

    it('should handle multiple warning events', () => {
      component.events = [
        {type: 'Warning', message: 'Warning 1'} as Event,
        {type: 'Warning', message: 'Warning 2'} as Event,
        {type: 'Warning', message: 'Warning 3'} as Event,
      ];

      expect(component.getTypeIcon()).toBe('km-icon-warning-event');
    });

    it('should detect single Warning among many Normal events', () => {
      component.events = [
        {type: 'Normal'} as Event,
        {type: 'Normal'} as Event,
        {type: 'Normal'} as Event,
        {type: 'Warning'} as Event,
        {type: 'Normal'} as Event,
      ];

      expect(component.getTypeIcon()).toBe('km-icon-warning-event');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete flow with Warning events', () => {
      const events: Event[] = [
        {type: 'Warning', message: 'Pod failed'} as Event,
        {type: 'Warning', message: 'Disk full'} as Event,
      ];

      component.events = events;

      expect(component.hasEvents()).toBe(true);
      expect(component.getTypeIcon()).toBe('km-icon-warning-event');

      component.toggleEvents();
      expect(component.isShowEvents).toBe(true);

      component.toggleEvents();
      expect(component.isShowEvents).toBe(false);
    });

    it('should handle complete flow with Normal events', () => {
      const events: Event[] = [{type: 'Normal', message: 'Pod started'} as Event];

      component.events = events;

      expect(component.hasEvents()).toBe(true);
      expect(component.getTypeIcon()).toBe('km-icon-check');

      component.toggleEvents();
      expect(component.isShowEvents).toBe(true);
    });

    it('should handle complete flow with no events', () => {
      component.events = [];

      expect(component.hasEvents()).toBe(false);
      expect(component.getTypeIcon()).toBe('');
      expect(component.isShowEvents).toBe(false);

      component.toggleEvents();
      expect(component.isShowEvents).toBe(true);
    });

    it('should update icon when events change', () => {
      component.events = [{type: 'Normal'} as Event];
      expect(component.getTypeIcon()).toBe('km-icon-check');

      component.events = [{type: 'Warning'} as Event];
      expect(component.getTypeIcon()).toBe('km-icon-warning-event');

      component.events = [];
      expect(component.getTypeIcon()).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large events array', () => {
      const largeEventArray: Event[] = Array.from({length: 1000}, (_, i) => ({
        type: i % 2 === 0 ? 'Warning' : 'Normal',
        message: `Event ${i}`,
      } as Event));

      component.events = largeEventArray;

      expect(component.hasEvents()).toBe(true);
      expect(component.getTypeIcon()).toBe('km-icon-warning-event');
    });

    it('should handle events with special characters in messages', () => {
      component.events = [
        {type: 'Warning', message: 'Error: "$#@!%"'} as Event,
        {type: 'Normal', message: '✓ Success'} as Event,
      ];

      expect(component.hasEvents()).toBe(true);
      expect(component.getTypeIcon()).toBe('km-icon-warning-event');
    });

    it('should handle case-sensitive type matching', () => {
      component.events = [{type: 'warning', message: 'lowercase'} as Event];

      expect(component.getTypeIcon()).toBe('');
    });

    it('should handle events with missing type property', () => {
      component.events = [{message: 'No type'} as Event];

      expect(component.getTypeIcon()).toBe('');
    });
  });
});
