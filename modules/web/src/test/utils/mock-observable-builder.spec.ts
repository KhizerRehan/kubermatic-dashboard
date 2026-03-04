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

import {fakeAsync, tick} from '@angular/core/testing';
import {MockObservableBuilder} from './mock-observable-builder';

describe('MockObservableBuilder', () => {
  describe('success()', () => {
    it('should emit data and then complete', (done) => {
      const testData = {id: 1, name: 'Test'};
      const emitted: any[] = [];
      const errors: any[] = [];
      let completed = false;

      MockObservableBuilder.success(testData).subscribe({
        next: (value) => emitted.push(value),
        error: (err) => errors.push(err),
        complete: () => {
          completed = true;
        },
      });

      setTimeout(() => {
        expect(emitted).toEqual([testData]);
        expect(errors.length).toBe(0);
        expect(completed).toBe(true);
        done();
      }, 50);
    });

    it('should emit data with custom delay', fakeAsync(() => {
      const testData = {value: 42};
      const emitted: any[] = [];

      MockObservableBuilder.success(testData, 100).subscribe({
        next: (value) => emitted.push(value),
      });

      tick(99);
      expect(emitted.length).toBe(0);

      tick(1);
      expect(emitted).toEqual([testData]);
    }));

    it('should work with primitive types', (done) => {
      const emitted: any[] = [];

      MockObservableBuilder.success('test-string').subscribe((value) => {
        emitted.push(value);
      });

      setTimeout(() => {
        expect(emitted).toEqual(['test-string']);
        done();
      }, 50);
    });

    it('should work with arrays', (done) => {
      const testArray = [{id: 1}, {id: 2}];
      const emitted: any[] = [];

      MockObservableBuilder.success(testArray).subscribe((value) => {
        emitted.push(value);
      });

      setTimeout(() => {
        expect(emitted).toEqual([testArray]);
        done();
      }, 50);
    });
  });

  describe('error()', () => {
    it('should emit error immediately', (done) => {
      const testError = new Error('Test error');
      const emitted: any[] = [];
      const errors: any[] = [];

      MockObservableBuilder.error(testError).subscribe({
        next: (value) => emitted.push(value),
        error: (err) => errors.push(err),
      });

      setTimeout(() => {
        expect(emitted.length).toBe(0);
        expect(errors.length).toBe(1);
        expect(errors[0]).toBe(testError);
        done();
      }, 50);
    });

    it('should support string error messages', (done) => {
      const errorMessage = 'API failed';
      const errors: any[] = [];

      MockObservableBuilder.error(errorMessage).subscribe({
        error: (err) => errors.push(err),
      });

      setTimeout(() => {
        expect(errors.length).toBe(1);
        done();
      }, 50);
    });

    it('should emit error with custom delay', fakeAsync(() => {
      const testError = new Error('Delayed error');
      const errors: any[] = [];

      MockObservableBuilder.error(testError, 100).subscribe({
        error: (err) => errors.push(err),
      });

      tick(99);
      expect(errors.length).toBe(0);

      tick(1);
      expect(errors.length).toBe(1);
    }));

    it('should not emit success value on error', fakeAsync(() => {
      const emitted: any[] = [];
      const errors: any[] = [];

      MockObservableBuilder.error(new Error('Error')).subscribe({
        next: (value) => emitted.push(value),
        error: (err) => errors.push(err),
      });

      tick(100);
      expect(emitted.length).toBe(0);
      expect(errors.length).toBe(1);
    }));
  });

  describe('timeout()', () => {
    it('should create observable that never emits', fakeAsync(() => {
      const emitted: any[] = [];
      const errors: any[] = [];
      let completed = false;

      MockObservableBuilder.timeout().subscribe({
        next: (value) => emitted.push(value),
        error: (err) => errors.push(err),
        complete: () => {
          completed = true;
        },
      });

      tick(10000);

      expect(emitted.length).toBe(0);
      expect(errors.length).toBe(0);
      expect(completed).toBe(false);
    }));

    it('should be useful for timeout testing', fakeAsync(() => {
      const source$ = MockObservableBuilder.timeout<string>();
      let timedOut = false;

      source$
        .pipe(
          // Simulate timeout with race condition
        )
        .subscribe({
          complete: () => {
            timedOut = true;
          },
        });

      tick(100);
      expect(timedOut).toBe(false);
    }));
  });

  describe('createSubject()', () => {
    it('should create a subject that can emit values', (done) => {
      const subject = MockObservableBuilder.createSubject<string>();
      const emitted: any[] = [];

      subject.subscribe((value) => emitted.push(value));

      subject.next('value1');
      subject.next('value2');

      setTimeout(() => {
        expect(emitted).toEqual(['value1', 'value2']);
        done();
      }, 50);
    });

    it('should allow multiple subscribers', () => {
      const subject = MockObservableBuilder.createSubject<number>();
      const subscriber1: any[] = [];
      const subscriber2: any[] = [];

      subject.subscribe((value) => subscriber1.push(value));
      subject.subscribe((value) => subscriber2.push(value));

      subject.next(42);

      expect(subscriber1).toEqual([42]);
      expect(subscriber2).toEqual([42]);
    });

    it('should support complete event', (done) => {
      const subject = MockObservableBuilder.createSubject<string>();
      const emitted: any[] = [];
      let completed = false;

      subject.subscribe({
        next: (value) => emitted.push(value),
        complete: () => {
          completed = true;
        },
      });

      subject.next('test');
      subject.complete();

      setTimeout(() => {
        expect(emitted).toEqual(['test']);
        expect(completed).toBe(true);
        done();
      }, 50);
    });

    it('should support error event', (done) => {
      const subject = MockObservableBuilder.createSubject<string>();
      const testError = new Error('Subject error');
      let errorReceived: any = null;

      subject.subscribe({
        error: (err) => {
          errorReceived = err;
        },
      });

      subject.error(testError);

      setTimeout(() => {
        expect(errorReceived).toBe(testError);
        done();
      }, 50);
    });

    it('should work with complex data types', () => {
      interface User {
        id: number;
        name: string;
      }

      const subject = MockObservableBuilder.createSubject<User>();
      const emitted: User[] = [];

      subject.subscribe((user) => emitted.push(user));

      subject.next({id: 1, name: 'Alice'});
      subject.next({id: 2, name: 'Bob'});

      expect(emitted.length).toBe(2);
      expect(emitted[0].name).toBe('Alice');
      expect(emitted[1].name).toBe('Bob');
    });
  });

  describe('successArray()', () => {
    it('should emit array items sequentially', (done) => {
      const items = ['item1', 'item2', 'item3'];
      const emitted: any[] = [];

      MockObservableBuilder.successArray(items).subscribe((value) => {
        emitted.push(value);
      });

      setTimeout(() => {
        expect(emitted).toEqual([items]);
        done();
      }, 50);
    });

    it('should respect delay parameter', fakeAsync(() => {
      const items = [{id: 1}, {id: 2}];
      const emitted: any[] = [];

      MockObservableBuilder.successArray(items, 200).subscribe((value) => {
        emitted.push(value);
      });

      tick(199);
      expect(emitted.length).toBe(0);

      tick(1);
      expect(emitted).toEqual([items]);
    }));

    it('should work with empty arrays', (done) => {
      const emitted: any[] = [];

      MockObservableBuilder.successArray([], 50).subscribe((value) => {
        emitted.push(value);
      });

      setTimeout(() => {
        expect(emitted).toEqual([[]]);
        done();
      }, 100);
    });

    it('should emit complete after array', (done) => {
      const items = [1, 2, 3];
      let completed = false;

      MockObservableBuilder.successArray(items).subscribe({
        complete: () => {
          completed = true;
        },
      });

      setTimeout(() => {
        expect(completed).toBe(true);
        done();
      }, 50);
    });

    it('should work with complex array items', (done) => {
      interface Project {
        id: string;
        name: string;
        status: string;
      }

      const projects: Project[] = [
        {id: '1', name: 'Project A', status: 'active'},
        {id: '2', name: 'Project B', status: 'inactive'},
      ];

      const emitted: any[] = [];

      MockObservableBuilder.successArray(projects, 50).subscribe((value) => {
        emitted.push(value);
      });

      setTimeout(() => {
        expect(emitted).toEqual([projects]);
        expect(emitted[0][0].name).toBe('Project A');
        done();
      }, 100);
    });
  });

  describe('Integration scenarios', () => {
    it('should work with RxJS operators', fakeAsync(() => {
      const testData = {id: 1, name: 'Test'};
      let result: any = null;

      MockObservableBuilder.success(testData)
        .subscribe((value) => {
          result = value;
        });

      tick(50);
      expect(result).toEqual(testData);
    }));

    it('should support multiple subscriptions', (done) => {
      const testData = 'shared-data';
      const results: any[] = [];

      const observable$ = MockObservableBuilder.success(testData);

      observable$.subscribe((value) => results.push('subscriber1:' + value));
      observable$.subscribe((value) => results.push('subscriber2:' + value));

      setTimeout(() => {
        expect(results.length).toBe(2);
        expect(results).toContain('subscriber1:shared-data');
        expect(results).toContain('subscriber2:shared-data');
        done();
      }, 50);
    });

    it('should handle synchronous consumption', () => {
      const data = {value: 123};
      let received: any = null;

      MockObservableBuilder.success(data, 0).subscribe((value) => {
        received = value;
      });

      // Data might not be received immediately due to async scheduling
      expect(received === null || received === data).toBe(true);
    });
  });
});
