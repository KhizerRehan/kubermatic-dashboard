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

import {HistoryMockService} from './history-mock';

describe('HistoryMockService', () => {
  let service: HistoryMockService;

  beforeEach(() => {
    service = new HistoryMockService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('onNavigationChange', () => {
    it('should have onNavigationChange subject', () => {
      expect(service.onNavigationChange).toBeTruthy();
    });

    it('should be subscribable', (done) => {
      let emitted = false;
      service.onNavigationChange.subscribe(() => {
        emitted = true;
        done();
      });
      service.onNavigationChange.next();
      expect(emitted).toBe(true);
    });
  });

  describe('init', () => {
    it('should be callable without errors', () => {
      expect(() => service.init()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      expect(() => {
        service.init();
        service.init();
      }).not.toThrow();
    });
  });

  describe('goBack', () => {
    it('should return promise resolving to true', (done) => {
      service.goBack('/projects').then(result => {
        expect(result).toBe(true);
        done();
      });
    });

    it('should emit navigation change event', (done) => {
      let emitted = false;
      service.onNavigationChange.subscribe(() => {
        emitted = true;
      });

      service.goBack('/projects').then(() => {
        expect(emitted).toBe(true);
        done();
      });
    });

    it('should work with different default states', (done) => {
      const promises = [
        service.goBack('/'),
        service.goBack('/projects'),
        service.goBack('/settings'),
        service.goBack('/admin'),
      ];

      Promise.all(promises).then(results => {
        results.forEach(result => {
          expect(result).toBe(true);
        });
        done();
      });
    });

    it('should ignore defaultState parameter', (done) => {
      service.goBack('/projects').then(result => {
        expect(result).toBe(true);
      });

      service.goBack('/completely/different/route').then(result => {
        expect(result).toBe(true);
        done();
      });
    });

    it('should emit multiple navigation changes for multiple goBack calls', (done) => {
      let emitCount = 0;
      service.onNavigationChange.subscribe(() => {
        emitCount++;
      });

      Promise.all([service.goBack('/projects'), service.goBack('/settings')]).then(() => {
        expect(emitCount).toBe(2);
        done();
      });
    });
  });

  describe('Component Integration', () => {
    it('should work with typical component pattern', (done) => {
      // Simulate typical component usage
      const componentSub = service.onNavigationChange.subscribe(() => {
        expect(true).toBe(true);
      });

      service.init();
      service.goBack('/projects').then(navigated => {
        expect(navigated).toBe(true);
        componentSub.unsubscribe();
        done();
      });
    });
  });
});
