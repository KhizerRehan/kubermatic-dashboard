<!-- Copyright 2020 The Kubermatic Kubernetes Platform contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. -->

# Angular Testing Patterns Guide

This guide documents comprehensive testing patterns for the Kubermatic Dashboard. It covers Jest setup, component testing, service testing, forms, async operations, and Material components.

## Table of Contents

1. [Jest Setup & Configuration](#jest-setup--configuration)
2. [Component Testing Patterns](#component-testing-patterns)
3. [Service Testing Patterns](#service-testing-patterns)
4. [Form Testing Patterns](#form-testing-patterns)
5. [Async & Observable Testing Patterns](#async--observable-testing-patterns)
6. [Dialog & Material Component Testing](#dialog--material-component-testing)
7. [Testing Utilities Reference](#testing-utilities-reference)
8. [Best Practices](#best-practices)

---

## Jest Setup & Configuration

### Configuration Overview

The dashboard uses Jest with `jest-preset-angular` for Angular-specific test support. The configuration is in `jest.config.cjs`:

```javascript
module.exports = {
  preset: 'jest-preset-angular',
  roots: ['<rootDir>/src'],
  setupFiles: ['jest-canvas-mock'],
  setupFilesAfterEnv: ['<rootDir>/src/test.base.ts'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@environments/(.*)$': '<rootDir>/src/environments/$1',
    '^@test/(.*)$': '<rootDir>/src/test/$1',
  },
};
```

### Key Setup Points

**Setup File (`src/test.base.ts`):**
- Loads `@angular/localize` for i18n support
- Configures Jest Zone environment
- Sets async timeout to 15 seconds
- Imports mocks from `test.base.mocks.ts`

**Module Name Mapping:**
- `@app/*` → `src/app/*`
- `@core/*` → `src/app/core/*`
- `@shared/*` → `src/app/shared/*`
- `@test/*` → `src/test/*`

### Running Tests

```bash
# Run all tests once
npm test

# Watch mode for development
npm run test:watch

# CI mode with coverage
npm run test:ci

# Run specific file
npm test -- --testPathPattern="component.name"

# Run with coverage
npm test -- --coverage
```

---

## Component Testing Patterns

### Basic Component Setup

Every component test follows this pattern:

```typescript
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MyComponent} from './component';

describe('MyComponent', () => {
  let fixture: ComponentFixture<MyComponent>;
  let component: MyComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      providers: [/* mock services */],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

**Key Points:**
- `TestBed` configures the test module with imports, declarations, and providers
- `ComponentFixture` provides access to the component and DOM
- `compileComponents()` compiles component templates and CSS
- `beforeEach` setup runs before each test
- `teardown: {destroyAfterEach: false}` can be omitted for default behavior

### Testing @Input and @Output

#### Input Properties

```typescript
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';

describe('DisplayComponent', () => {
  let fixture: ComponentFixture<DisplayComponent>;
  let component: DisplayComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayComponent);
    component = fixture.componentInstance;
  });

  it('should display input title', () => {
    component.title = 'Test Title';
    fixture.detectChanges(); // Trigger change detection

    const titleElement: DebugElement = fixture.debugElement.query(By.css('.title'));
    expect(titleElement.nativeElement.textContent).toBe('Test Title');
  });

  it('should apply CSS class based on input', () => {
    component.isActive = true;
    fixture.detectChanges();

    const container = fixture.debugElement.query(By.css('.container'));
    expect(container.nativeElement.classList.contains('active')).toBe(true);
  });
});
```

**Key Patterns:**
- Set `@Input` properties directly on component instance
- Call `fixture.detectChanges()` to trigger change detection
- Use `fixture.debugElement.query(By.css())` to select DOM elements
- Access native element with `.nativeElement`

#### Output Events

```typescript
describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
  });

  it('should emit click event with data', () => {
    spyOn(component.buttonClicked, 'emit');

    const button = fixture.debugElement.query(By.css('button'));
    button.nativeElement.click();

    expect(component.buttonClicked.emit).toHaveBeenCalledWith('button-clicked');
  });

  it('should emit event when method called', (done) => {
    component.itemSelected.subscribe((value) => {
      expect(value).toBe(42);
      done(); // Signal async test completion
    });

    component.selectItem(42);
  });
});
```

**Key Patterns:**
- Use `spyOn()` to spy on `@Output()` EventEmitters
- Subscribe to emitters and use `done()` callback for async verification
- Trigger events by calling methods or simulating user interactions

### Change Detection Strategy

The dashboard uses `ChangeDetectionStrategy.OnPush` on most components. This requires:

```typescript
import {ChangeDetectionStrategy} from '@angular/core';

@Component({
  selector: 'km-my-component',
  templateUrl: './template.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent {
  constructor(private cdr: ChangeDetectorRef) {}

  updateData(): void {
    this.data = newData;
    this.cdr.markForCheck(); // Manually trigger change detection
  }
}

describe('MyComponent', () => {
  it('should update on property change', () => {
    component.data = newData;
    fixture.detectChanges(); // Always call this

    expect(component.data).toEqual(newData);
  });
});
```

**Key Patterns:**
- Always call `fixture.detectChanges()` after setting properties
- Use `ChangeDetectorRef.markForCheck()` when manually updating
- Components with OnPush strategy only detect changes when:
  - @Input properties change
  - @Output events are triggered
  - Observables emit (with async pipe)

---

## Service Testing Patterns

### Basic Service Test

```typescript
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {MyService} from './service';

describe('MyService', () => {
  let service: MyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MyService],
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(MyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

**Key Points:**
- Use `HttpClientTestingModule` instead of real HTTP client
- Always call `httpMock.verify()` in `afterEach()` to catch unexpected requests
- Use `TestBed.inject()` to get service and HTTP mock instances

### HTTP Request Testing

```typescript
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService],
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch users', () => {
    const mockUsers = [{id: 1, name: 'John'}];

    service.getUsers().subscribe((users) => {
      expect(users.length).toBe(1);
      expect(users[0].name).toBe('John');
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers); // Respond with mock data
  });

  it('should post user data', () => {
    const newUser = {name: 'Jane'};

    service.createUser(newUser).subscribe((response) => {
      expect(response.id).toBe(2);
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newUser);
    req.flush({id: 2, ...newUser});
  });

  it('should handle HTTP errors', () => {
    service.getUsers().subscribe(
      () => fail('Should have failed'),
      (error) => {
        expect(error.status).toBe(404);
      }
    );

    const req = httpMock.expectOne('/api/users');
    req.flush('Not found', {status: 404, statusText: 'Not found'});
  });
});
```

**Key Patterns:**
- `httpMock.expectOne(url)` - Assert exactly one request to URL
- `req.flush(data)` - Send response with data
- `req.flush(error, {status, statusText})` - Send error response
- `httpMock.expectNone(url)` - Assert no requests to URL

### Observable Caching Pattern

The dashboard caches observables to avoid duplicate HTTP requests:

```typescript
// Example from ClusterService
export class ClusterService {
  private _clusters$ = new Map<string, Observable<Cluster>>();

  getCluster(projectId: string, clusterId: string): Observable<Cluster> {
    const key = `${projectId}/${clusterId}`;

    if (!this._clusters$.get(key)) {
      const cluster$ = this._http
        .get<Cluster>(`/api/projects/${projectId}/clusters/${clusterId}`)
        .pipe(shareReplay({refCount: true, bufferSize: 1}));

      this._clusters$.set(key, cluster$);
    }

    return this._clusters$.get(key);
  }
}

// Test the caching behavior
describe('ClusterService Caching', () => {
  let service: ClusterService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClusterService],
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(ClusterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should cache observable and avoid duplicate requests', () => {
    const mockCluster = {id: '1', name: 'cluster-1'};

    // First subscription
    service.getCluster('proj1', 'cluster1').subscribe();

    // Second subscription should use cache
    service.getCluster('proj1', 'cluster1').subscribe();

    // Only one request should be made
    const req = httpMock.expectOne('/api/projects/proj1/clusters/cluster1');
    req.flush(mockCluster);

    // No additional requests
    httpMock.expectNone('/api/projects/proj1/clusters/cluster1');
  });
});
```

### Mocking Dependencies

```typescript
describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;
  let authService: AuthMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProjectService,
        {provide: AuthService, useClass: AuthMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
      ],
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as AuthMockService;
  });

  it('should use mocked auth service', () => {
    expect(authService.isLoggedIn).toBeDefined();
  });
});
```

---

## Form Testing Patterns

### Reactive Form Initialization

```typescript
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormComponent} from './form.component';

describe('FormComponent', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, SharedModule],
      declarations: [FormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize form with default values', () => {
    expect(component.form.get('username').value).toBe('');
    expect(component.form.get('email').value).toBe('');
    expect(component.form.valid).toBe(false);
  });

  it('should update form value when setting initial data', () => {
    component.initForm({username: 'john', email: 'john@example.com'});

    expect(component.form.get('username').value).toBe('john');
    expect(component.form.get('email').value).toBe('john@example.com');
  });
});
```

### Form Validation Testing

```typescript
describe('FormComponent - Validation', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, SharedModule],
      declarations: [FormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should validate required field', () => {
    const control = component.form.get('username');

    // Empty value should be invalid
    control.setValue('');
    expect(control.hasError('required')).toBe(true);
    expect(control.valid).toBe(false);

    // Valid value should pass
    control.setValue('john');
    expect(control.hasError('required')).toBe(false);
    expect(control.valid).toBe(true);
  });

  it('should validate email pattern', () => {
    const control = component.form.get('email');

    control.setValue('invalid-email');
    expect(control.hasError('email')).toBe(true);

    control.setValue('valid@example.com');
    expect(control.hasError('email')).toBe(false);
  });

  it('should validate custom validators', () => {
    const control = component.form.get('password');

    control.setValue('short'); // Too short
    expect(control.hasError('minlength')).toBe(true);

    control.setValue('strongPassword123'); // Valid
    expect(control.valid).toBe(true);
  });

  it('should mark control as touched and show errors', () => {
    const control = component.form.get('username');

    expect(control.touched).toBe(false);

    control.markAsTouched();
    control.setValue('');

    expect(control.touched).toBe(true);
    expect(control.invalid).toBe(true);
  });
});
```

### Form Submission

```typescript
describe('FormComponent - Submission', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, SharedModule],
      declarations: [FormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should submit valid form data', () => {
    spyOn(component.formSubmitted, 'emit');

    component.form.patchValue({
      username: 'john',
      email: 'john@example.com',
    });

    component.onSubmit();

    expect(component.formSubmitted.emit).toHaveBeenCalledWith({
      username: 'john',
      email: 'john@example.com',
    });
  });

  it('should not submit invalid form', () => {
    spyOn(component.formSubmitted, 'emit');

    component.form.patchValue({username: ''}); // Invalid

    component.onSubmit();

    expect(component.formSubmitted.emit).not.toHaveBeenCalled();
  });

  it('should display error messages on submission attempt', () => {
    component.form.patchValue({username: ''});
    component.form.get('username').markAsTouched();

    fixture.detectChanges();

    const errorMsg = fixture.debugElement.query(By.css('.error-message'));
    expect(errorMsg).toBeTruthy();
  });
});
```

### Form Array Testing

```typescript
describe('FormComponent - FormArray', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, SharedModule],
      declarations: [FormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should add item to form array', () => {
    const items = component.form.get('items') as FormArray;

    expect(items.length).toBe(0);

    component.addItem();

    expect(items.length).toBe(1);
  });

  it('should remove item from form array', () => {
    const items = component.form.get('items') as FormArray;

    component.addItem();
    component.addItem();
    expect(items.length).toBe(2);

    component.removeItem(0);
    expect(items.length).toBe(1);
  });

  it('should validate all items in array', () => {
    const items = component.form.get('items') as FormArray;

    component.addItem();

    const firstItem = items.at(0);
    firstItem.patchValue({name: '', value: ''});

    expect(firstItem.invalid).toBe(true);
    expect(items.invalid).toBe(true);
  });
});
```

---

## Async & Observable Testing Patterns

### waitForAsync Pattern (for setTimeout/Promises)

```typescript
import {fakeAsync, tick, waitForAsync} from '@angular/core/testing';

describe('AsyncComponent', () => {
  let component: AsyncComponent;
  let fixture: ComponentFixture<AsyncComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
      declarations: [AsyncComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AsyncComponent);
    component = fixture.componentInstance;
  });

  // Use waitForAsync for Promise-based operations
  it('should load data with waitForAsync', waitForAsync(() => {
    component.ngOnInit();

    fixture.whenStable().then(() => {
      expect(component.data).toBeDefined();
      expect(component.isLoading).toBe(false);
    });
  }));

  it('should handle promise rejection', waitForAsync(() => {
    component.loadDataWithError();

    fixture.whenStable().then(() => {
      expect(component.error).toBe('Failed to load data');
    });
  }));
});
```

### fakeAsync/tick Pattern (for Timers)

```typescript
describe('TimerComponent', () => {
  let component: TimerComponent;
  let fixture: ComponentFixture<TimerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
      declarations: [TimerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimerComponent);
    component = fixture.componentInstance;
  });

  it('should increment counter with setInterval', fakeAsync(() => {
    component.startTimer();

    expect(component.counter).toBe(0);

    tick(1000); // Advance 1 second
    expect(component.counter).toBe(1);

    tick(2000); // Advance 2 more seconds
    expect(component.counter).toBe(3);

    component.stopTimer();
  }));

  it('should handle debounced input', fakeAsync(() => {
    component.onInputChange('a');
    tick(300);
    component.onInputChange('ab');
    tick(300);

    expect(component.searchResults.length).toBe(1);
  }));
});
```

### Observable Testing with Marble Testing

```typescript
import {TestScheduler} from 'rxjs/testing';
import {map} from 'rxjs/operators';

describe('DataService - Marble Testing', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should transform data stream', () => {
    testScheduler.run(({cold, expectObservable}) => {
      const source$ = cold('a-b-c|', {
        a: 1,
        b: 2,
        c: 3,
      });

      const result$ = source$.pipe(map((x) => x * 2));

      expectObservable(result$).toBe('a-b-c|', {
        a: 2,
        b: 4,
        c: 6,
      });
    });
  });

  it('should handle observable errors', () => {
    testScheduler.run(({cold, expectObservable}) => {
      const source$ = cold('a-b-#', {a: 1, b: 2}, new Error('Test error'));

      expectObservable(source$).toBe('a-b-#', {a: 1, b: 2}, new Error('Test error'));
    });
  });
});
```

### Subscription Testing with subscribeSpyTo

```typescript
import {lastValueFrom, of} from 'rxjs';

describe('ObservableComponent', () => {
  let component: ObservableComponent;
  let fixture: ComponentFixture<ObservableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
      declarations: [ObservableComponent],
      providers: [DataService],
    }).compileComponents();

    fixture = TestBed.createComponent(ObservableComponent);
    component = fixture.componentInstance;
  });

  it('should subscribe to observable on init', (done) => {
    component.ngOnInit();

    component.data$.subscribe((data) => {
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
      done();
    });
  });

  it('should handle observable error', (done) => {
    component.loadDataWithError();

    component.data$.subscribe(
      () => fail('Should have errored'),
      (error) => {
        expect(error.message).toBe('Expected error');
        done();
      }
    );
  });

  it('should convert observable to promise', async () => {
    const data = await lastValueFrom(component.data$);
    expect(data).toBeDefined();
  });
});
```

### lastValueFrom/firstValueFrom

```typescript
import {lastValueFrom, firstValueFrom} from 'rxjs';

describe('Service Observable Methods', () => {
  let service: DataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataService],
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Test observable that emits multiple values
  it('should get last value from observable', async () => {
    lastValueFrom(service.getData()).then((data) => {
      expect(data.id).toBe(3); // Last emitted value
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({id: 3});
  });

  // Test observable that emits single value
  it('should get first value from single-value observable', async () => {
    const data = await firstValueFrom(service.getUser(1));
    expect(data.name).toBe('John');

    const req = httpMock.expectOne('/api/users/1');
    req.flush({id: 1, name: 'John'});
  });
});
```

---

## Dialog & Material Component Testing

### Testing MatDialog

```typescript
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatDialogMock, MatDialogRefMock} from '@test/services/mat-dialog-mock';

describe('DialogOpeningComponent', () => {
  let component: DialogOpeningComponent;
  let fixture: ComponentFixture<DialogOpeningComponent>;
  let dialog: MatDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
      declarations: [DialogOpeningComponent],
      providers: [
        {provide: MatDialog, useClass: MatDialogMock},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogOpeningComponent);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
  });

  it('should open dialog with data', () => {
    spyOn(dialog, 'open').and.returnValue({
      afterClosed: () => of({result: 'confirmed'}),
    } as MatDialogRef<any>);

    component.openDialog();

    expect(dialog.open).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalledWith(jasmine.any(Object), {
      width: '500px',
      data: {title: 'Confirm'},
    });
  });

  it('should handle dialog result', (done) => {
    spyOn(dialog, 'open').and.returnValue({
      afterClosed: () => of({confirmed: true}),
    } as MatDialogRef<any>);

    component.openDialog();

    component.dialogResult$.subscribe((result) => {
      expect(result.confirmed).toBe(true);
      done();
    });
  });
});
```

### Testing Dialog Content Component

```typescript
describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRef: MatDialogRef<ConfirmDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
      declarations: [ConfirmDialogComponent],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {
          provide: MAT_DIALOG_DATA,
          useValue: {title: 'Confirm Action', message: 'Are you sure?'},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef);
    fixture.detectChanges();
  });

  it('should display dialog data', () => {
    const title = fixture.debugElement.query(By.css('h2'));
    expect(title.nativeElement.textContent).toContain('Confirm Action');

    const message = fixture.debugElement.query(By.css('p'));
    expect(message.nativeElement.textContent).toContain('Are you sure?');
  });

  it('should close dialog on confirm', () => {
    spyOn(dialogRef, 'close');

    const confirmBtn = fixture.debugElement.query(By.css('.confirm-btn'));
    confirmBtn.nativeElement.click();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close dialog on cancel', () => {
    spyOn(dialogRef, 'close');

    const cancelBtn = fixture.debugElement.query(By.css('.cancel-btn'));
    cancelBtn.nativeElement.click();

    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});
```

### Testing Material Components (MatSelect, MatInput, etc.)

```typescript
describe('FormWithMaterialComponents', () => {
  let component: FormWithMaterialComponents;
  let fixture: ComponentFixture<FormWithMaterialComponents>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatInputModule, SharedModule],
      declarations: [FormWithMaterialComponents],
    }).compileComponents();

    fixture = TestBed.createComponent(FormWithMaterialComponents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set and get MatSelect value', () => {
    const selectControl = component.form.get('provider');
    selectControl.setValue('aws');

    expect(selectControl.value).toBe('aws');
  });

  it('should validate MatInput', () => {
    const input = component.form.get('name');

    input.setValue('');
    expect(input.hasError('required')).toBe(true);

    input.setValue('Valid Name');
    expect(input.valid).toBe(true);
  });

  it('should display MatError messages', () => {
    const control = component.form.get('email');
    control.setValue('invalid');
    control.markAsTouched();

    fixture.detectChanges();

    const errorElement = fixture.debugElement.query(By.css('mat-error'));
    expect(errorElement).toBeTruthy();
  });
});
```

---

## Testing Utilities Reference

The dashboard provides comprehensive test utilities in `src/test/`:

### Mock Services

The most commonly used mocks:

**AppConfigMockService** - Mocks application configuration
```typescript
import {AppConfigMockService} from '@test/services/app-config-mock';

providers: [
  {provide: AppConfigService, useClass: AppConfigMockService}
]
```

**AuthMockService** - Mocks authentication
```typescript
import {AuthMockService} from '@test/services/auth-mock';

providers: [
  {provide: Auth, useClass: AuthMockService}
]
```

**ProjectMockService** - Mocks project operations
```typescript
import {ProjectMockService} from '@test/services/project-mock';

providers: [
  {provide: ProjectService, useClass: ProjectMockService}
]
```

**ClusterMockService** - Mocks cluster operations
```typescript
import {ClusterMockService} from '@test/services/cluster-mock';

providers: [
  {provide: ClusterService, useClass: ClusterMockService}
]
```

**MatDialogMock & MatDialogRefMock** - Mocks Material dialogs
```typescript
import {MatDialogMock, MatDialogRefMock} from '@test/services/mat-dialog-mock';

providers: [
  {provide: MatDialog, useClass: MatDialogMock},
  {provide: MatDialogRef, useClass: MatDialogRefMock}
]
```

### Mock Data Factories

Use data factories to create consistent test data:

```typescript
import {fakeCluster} from '@test/data/cluster';
import {fakeProject} from '@test/data/project';
import {fakeUser} from '@test/data/user';

// Use in tests
const mockCluster = fakeCluster();
const mockProject = fakeProject();
const mockUser = fakeUser();
```

### Router Stubs

```typescript
import {RouterTestingModule} from '@angular/router/testing';
import {ActivatedRoute} from '@angular/router';

TestBed.configureTestingModule({
  imports: [RouterTestingModule],
  providers: [
    {
      provide: ActivatedRoute,
      useValue: {
        snapshot: {params: {projectID: 'test-project'}},
        params: of({projectID: 'test-project'}),
      },
    },
  ],
});
```

---

## Best Practices

### What To Test

1. **Component Logic:**
   - User interactions (clicks, inputs, selections)
   - Conditional rendering based on state/inputs
   - Form validation and submission
   - Event emissions

2. **Service Behavior:**
   - HTTP requests (correct URLs, methods, data)
   - Observable emissions and subscriptions
   - Error handling and recovery
   - Data transformation and caching

3. **State Management:**
   - Observable state changes
   - Subject event emissions
   - Subscription cleanup

4. **Validation:**
   - Form validators
   - Custom validators
   - Cross-field validation

### What NOT To Test

1. **Don't test third-party libraries:**
   - Angular Material behavior (already tested)
   - RxJS operators (already tested)
   - Framework internals

2. **Don't test implementation details:**
   - Private methods (they should be covered by public method tests)
   - Internal state that isn't part of the interface
   - Method call order unless it affects behavior

3. **Don't over-specify tests:**
   - Avoid testing unrelated code in the same spec
   - Don't use arbitrary delays/waits
   - Don't couple tests to implementation details

### Performance Considerations

1. **Minimize Test Setup:**
   ```typescript
   // Good: Reuse setup
   beforeEach(() => {
     TestBed.configureTestingModule({...});
   });

   // Avoid: Recreating TestBed in each test
   it('test', () => {
     TestBed.configureTestingModule({...});
   });
   ```

2. **Use fakeAsync for timers:**
   ```typescript
   // Good: Instant execution with fakeAsync/tick
   it('should debounce', fakeAsync(() => {
     component.search('test');
     tick(300); // Advance time instantly
   }));

   // Avoid: setTimeout waits actual time
   it('should debounce', (done) => {
     setTimeout(() => done(), 300); // Slow!
   });
   ```

3. **Clean up subscriptions:**
   ```typescript
   // Good: Unsubscribe after test
   it('test', (done) => {
     const sub = service.data$.subscribe(() => {
       sub.unsubscribe();
       done();
     });
   });

   // Better: Use takeUntil pattern
   it('test', (done) => {
     const destroy$ = new Subject();
     service.data$.pipe(takeUntil(destroy$)).subscribe(() => {
       destroy$.complete();
       done();
     });
   });
   ```

4. **Avoid unnecessary change detection:**
   ```typescript
   // Only call when needed
   component.property = newValue;
   fixture.detectChanges(); // Only here

   // Not after every interaction if testing synchronously
   ```

### Common Mistakes

1. **Forgetting httpMock.verify():**
   ```typescript
   // Bad: Outstanding requests not caught
   afterEach(() => {
     // Missing httpMock.verify()
   });

   // Good: Catches unexpected requests
   afterEach(() => {
     httpMock.verify();
   });
   ```

2. **Not handling async operations:**
   ```typescript
   // Bad: Test completes before async operation
   it('loads data', () => {
     service.loadData(); // Observable not subscribed
     expect(component.data).toBeDefined(); // Fails!
   });

   // Good: Subscribe and use done callback
   it('loads data', (done) => {
     service.loadData().subscribe(() => {
       expect(component.data).toBeDefined();
       done();
     });
   });
   ```

3. **Not cleaning up resources:**
   ```typescript
   // Bad: Memory leaks in tests
   it('subscribes', () => {
     component.data$.subscribe(data => {
       // Never unsubscribed
     });
   });

   // Good: Explicit cleanup
   it('subscribes', (done) => {
     const sub = component.data$.subscribe(() => {
       sub.unsubscribe();
       done();
     });
   });
   ```

### Test Naming Conventions

- Use `it('should...')` format
- Be specific about the behavior being tested
- Include the condition and expected outcome

```typescript
// Good names
it('should display error message when form is invalid')
it('should emit itemSelected when item is clicked')
it('should cache observable and avoid duplicate requests')
it('should throw error when HTTP request fails')

// Bad names
it('works')
it('test form')
it('handles error')
it('displays stuff')
```

---

## Phase 03: Advanced Shared Component Testing Patterns

This section documents patterns discovered and refined during Phase 03 comprehensive shared component testing (1,120+ tests across 43+ components).

### Testing Form Controls with ControlValueAccessor

Many shared components implement `ControlValueAccessor` to integrate with Angular reactive forms. Testing requires special considerations:

```typescript
describe('CustomInputComponent', () => {
  let component: CustomInputComponent;
  let fixture: ComponentFixture<CustomInputComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, CustomInputComponent],
    });
    fixture = TestBed.createComponent(CustomInputComponent);
    component = fixture.componentInstance;
  });

  describe('ControlValueAccessor Integration', () => {
    it('should write value via writeValue', () => {
      const testValue = 'test input';
      component.writeValue(testValue);
      expect(component.value).toBe(testValue);
    });

    it('should register onChange callback', () => {
      const onChangeFn = jasmine.createSpy('onChange');
      component.registerOnChange(onChangeFn);

      component.value = 'new value';
      component.onChange(); // Trigger change

      expect(onChangeFn).toHaveBeenCalledWith('new value');
    });

    it('should register onTouched callback', () => {
      const onTouchedFn = jasmine.createSpy('onTouched');
      component.registerOnTouched(onTouchedFn);

      const input = fixture.nativeElement.querySelector('input');
      input.dispatchEvent(new Event('blur'));

      expect(onTouchedFn).toHaveBeenCalled();
    });

    it('should disable input via setDisabledState', () => {
      component.setDisabledState(true);
      expect(component.disabled).toBe(true);

      component.setDisabledState(false);
      expect(component.disabled).toBe(false);
    });

    // Integration with FormControl
    it('should work with FormControl', () => {
      const control = new FormControl('initial value');
      component.writeValue(control.value);

      component.registerOnChange(value => {
        control.setValue(value);
      });

      component.value = 'updated';
      component.onChange();

      expect(control.value).toBe('updated');
    });
  });
});
```

**Key Patterns:**
- Test `writeValue()` for value binding
- Test `registerOnChange()` for change emission
- Test `registerOnTouched()` for blur/touch
- Test `setDisabledState()` for enabled/disabled state
- Verify integration with FormControl and FormGroup

### Testing Material Components

Phase 03 tests extensively use Angular Material components. Common patterns:

```typescript
describe('DialogComponent', () => {
  let component: DialogComponent;
  let fixture: ComponentFixture<DialogComponent>;
  let dialogRef: MatDialogRef<DialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatDialogModule, MatButtonModule, DialogComponent],
      providers: [
        {provide: MAT_DIALOG_DATA, useValue: {title: 'Test'}},
        {provide: MatDialogRef, useValue: {close: jasmine.createSpy('close')}},
      ],
    });
    fixture = TestBed.createComponent(DialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef);
  });

  describe('Material Dialog Integration', () => {
    it('should inject dialog data', () => {
      expect(component.data.title).toBe('Test');
    });

    it('should close dialog with data', () => {
      component.onSave({result: true});
      expect(dialogRef.close).toHaveBeenCalledWith({result: true});
    });

    it('should handle button clicks', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('[mat-dialog-close]');
      button.click();
      expect(dialogRef.close).toHaveBeenCalled();
    });
  });

  describe('Material Form Field', () => {
    it('should display error messages', () => {
      component.form.get('email').setErrors({required: true});
      fixture.detectChanges();

      const error = fixture.nativeElement.querySelector('mat-error');
      expect(error).toBeTruthy();
    });

    it('should apply error styles to input', () => {
      component.form.get('email').markAsTouched();
      component.form.get('email').setErrors({invalid: true});
      fixture.detectChanges();

      const formField = fixture.debugElement.query(By.directive(MatFormField));
      expect(formField.componentInstance.isErrorState(
        component.form.get('email'),
        component.form
      )).toBe(true);
    });
  });

  describe('Material Chips', () => {
    it('should render chip set', () => {
      component.items = ['item1', 'item2'];
      fixture.detectChanges();

      const chips = fixture.debugElement.queryAll(By.directive(MatChip));
      expect(chips.length).toBe(2);
    });

    it('should handle chip removal', () => {
      component.items = ['item1', 'item2'];
      fixture.detectChanges();

      const removeButton = fixture.nativeElement.querySelector('button[matChipRemove]');
      removeButton.click();

      expect(component.items.length).toBe(1);
    });
  });
});
```

**Key Patterns:**
- Mock `MatDialogRef` and `MAT_DIALOG_DATA`
- Test dialog closing with return data
- Verify error message display on form fields
- Test Material-specific directives and components

### Testing Components with @ContentChild and @ViewChild

Layout and container components often use content and view child references:

```typescript
describe('ExpansionPanelComponent', () => {
  let component: ExpansionPanelComponent;
  let fixture: ComponentFixture<ExpansionPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ExpansionPanelComponent],
    });
    fixture = TestBed.createComponent(ExpansionPanelComponent);
    component = fixture.componentInstance;
  });

  describe('@ViewChild Elements', () => {
    it('should reference header element after view init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const header = component.headerRef;
      expect(header).toBeTruthy();
    }));

    it('should toggle header class on expanded', () => {
      fixture.detectChanges();
      component.expanded = true;
      fixture.detectChanges();

      const headerElement = component.headerRef.nativeElement;
      expect(headerElement.classList.contains('expanded')).toBe(true);
    });
  });

  describe('Content Projection (@ContentChild)', () => {
    it('should project custom content', () => {
      @Component({
        selector: 'app-test-wrapper',
        template: `
          <km-expansion-panel>
            <div class="custom-content">Projected Content</div>
          </km-expansion-panel>
        `,
      })
      class TestWrapperComponent {}

      const wrapperFixture = TestBed.createComponent(TestWrapperComponent);
      wrapperFixture.detectChanges();

      const projectedContent = wrapperFixture.nativeElement.querySelector('.custom-content');
      expect(projectedContent.textContent).toBe('Projected Content');
    });

    it('should access @ContentChild from parent', () => {
      @Component({
        selector: 'app-tab-panel',
        template: `<ng-content></ng-content>`,
      })
      class TabPanelComponent {
        @ContentChild('tabHeader') header: TemplateRef<any>;
      }

      @Component({
        template: `
          <app-tab-panel>
            <ng-template #tabHeader>Header Content</ng-template>
          </app-tab-panel>
        `,
      })
      class TestComponent {}

      const testFixture = TestBed.configureTestingModule({
        declarations: [TabPanelComponent, TestComponent],
      }).createComponent(TestComponent);
      testFixture.detectChanges();

      const panelComponent = testFixture.debugElement.query(By.directive(TabPanelComponent)).componentInstance;
      expect(panelComponent.header).toBeTruthy();
    });
  });
});
```

**Key Patterns:**
- Use `fakeAsync`/`tick` to wait for view initialization
- Access `@ViewChild` references after `detectChanges()`
- Test content projection with wrapper components
- Verify @ContentChild references are available

### Testing Components with Complex Change Detection

OnPush change detection strategy requires careful handling:

```typescript
describe('HighPerformanceComponentWithOnPush', () => {
  let component: HighPerformanceComponent;
  let fixture: ComponentFixture<HighPerformanceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HighPerformanceComponent],
    });
    fixture = TestBed.createComponent(HighPerformanceComponent);
    component = fixture.componentInstance;
  });

  describe('OnPush Change Detection Strategy', () => {
    it('should not detect changes for in-place modifications', () => {
      component.items = [{name: 'Item 1'}];
      fixture.detectChanges();

      // In-place modification - no new reference
      component.items[0].name = 'Modified Item';
      fixture.detectChanges();

      // Component won't detect change without new array reference
      const content = fixture.nativeElement.textContent;
      expect(content).not.toContain('Modified Item');
    });

    it('should detect changes with new object reference', () => {
      component.items = [{name: 'Item 1'}];
      fixture.detectChanges();

      // New array reference
      component.items = [{name: 'Modified Item'}];
      fixture.detectChanges();

      // Component detects change
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Modified Item');
    });

    it('should manually trigger change detection with markForCheck', () => {
      spyOn(component['_cdr'], 'markForCheck');

      component.updateData({newValue: true});

      expect(component['_cdr'].markForCheck).toHaveBeenCalled();
    });

    it('should detect changes from observable subscriptions', fakeAsync(() => {
      const data$ = of({name: 'Updated'}).pipe(delay(100));
      component.data$ = data$;
      fixture.detectChanges();

      tick(100);
      fixture.detectChanges();

      expect(component.data.name).toBe('Updated');
    }));

    it('should verify component has OnPush strategy', () => {
      const metadata = (HighPerformanceComponent as any).__annotations__[0];
      expect(metadata.changeDetection).toBe(ChangeDetectionStrategy.OnPush);
    });
  });
});
```

**Key Patterns:**
- Test that in-place modifications don't trigger change detection
- Verify new object references trigger changes
- Test `markForCheck()` calls
- Use `fixture.detectChanges()` explicitly after state changes
- Verify `ChangeDetectionStrategy.OnPush` is applied

### Testing Components with Animations and Transitions

Shared components use Angular animations for smooth UX:

```typescript
describe('ExpansionPanelWithAnimation', () => {
  let component: ExpansionPanelComponent;
  let fixture: ComponentFixture<ExpansionPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, ExpansionPanelComponent],
      // Note: Use BrowserAnimationsModule, not NoopAnimationsModule to test animations
    });
    fixture = TestBed.createComponent(ExpansionPanelComponent);
    component = fixture.componentInstance;
  });

  describe('Animation Triggers', () => {
    it('should trigger shrinkGrow animation on toggle', fakeAsync(() => {
      fixture.detectChanges();

      // Initial state: collapsed
      expect(component.expanded).toBe(false);

      // Toggle to expanded
      component.onClick();
      fixture.detectChanges();
      tick(500); // Wait for animation duration

      expect(component.expanded).toBe(true);

      // Verify animation element is present
      const animatedDiv = fixture.nativeElement.querySelector('[ng-if] div');
      expect(animatedDiv).toBeTruthy();
    }));

    it('should handle rapid animation toggling', fakeAsync(() => {
      fixture.detectChanges();

      // Toggle multiple times rapidly
      component.onClick();
      fixture.detectChanges();
      tick(100);

      component.onClick();
      fixture.detectChanges();
      tick(100);

      component.onClick();
      fixture.detectChanges();
      tick(500);

      expect(component.expanded).toBe(true);
    }));

    it('should apply animation state classes', fakeAsync(() => {
      fixture.detectChanges();

      // Expand with animation
      component.expanded = true;
      fixture.detectChanges();
      tick(); // Micro-task queue

      const element = fixture.nativeElement.querySelector('.expandable-content');
      expect(element).toBeTruthy();
    }));
  });

  describe('Animation Performance', () => {
    it('should not cause memory leaks during animations', fakeAsync(() => {
      const initialSubscriptions = component['_unsubscribe'].observers.length;

      // Multiple animation cycles
      for (let i = 0; i < 10; i++) {
        component.onClick();
        fixture.detectChanges();
        tick(500);
      }

      component.ngOnDestroy();

      // Verify cleanup happened
      expect(component['_unsubscribe'].closed).toBe(true);
    }));
  });
});
```

**Key Patterns:**
- Use `BrowserAnimationsModule` instead of `NoopAnimationsModule` to test animations
- Use `fakeAsync`/`tick` to control animation timing
- Wait for animation duration before verifying state
- Test rapid animation toggling
- Verify cleanup on component destroy

### Common Pitfalls in Shared Component Testing

Based on Phase 03 experience, avoid these common mistakes:

```typescript
describe('Common Testing Pitfalls', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MyComponent],
    });
    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
  });

  describe('Pitfall 1: Forgetting fixture.detectChanges()', () => {
    // BAD - Template not rendered
    it('should display text - WRONG', () => {
      component.text = 'Hello';
      // Missing: fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('.text');
      expect(element).toBeFalsy(); // Fails - element not rendered yet!
    });

    // GOOD - Template rendered
    it('should display text - CORRECT', () => {
      component.text = 'Hello';
      fixture.detectChanges(); // ✓ Now template is rendered

      const element = fixture.nativeElement.querySelector('.text');
      expect(element.textContent).toBe('Hello');
    });
  });

  describe('Pitfall 2: Not unsubscribing from observables', () => {
    // BAD - Memory leak in tests
    it('should subscribe - WRONG', (done) => {
      component.data$.subscribe(data => {
        // Never unsubscribed
        done();
      });
    });

    // GOOD - Explicit cleanup
    it('should subscribe - CORRECT', (done) => {
      const subscription = component.data$.subscribe(data => {
        subscription.unsubscribe();
        done();
      });
    });

    // BETTER - Using takeUntil pattern
    it('should subscribe - BEST PRACTICE', (done) => {
      const destroy$ = new Subject<void>();

      component.data$.pipe(takeUntil(destroy$)).subscribe(() => {
        destroy$.complete();
        done();
      });
    });
  });

  describe('Pitfall 3: Testing implementation instead of behavior', () => {
    // BAD - Tests private implementation
    it('should set private variable - WRONG', () => {
      component.toggle();
      expect(component['_expanded']).toBe(true); // Tests private field!
    });

    // GOOD - Tests public API
    it('should expand when toggled - CORRECT', () => {
      expect(component.expanded).toBe(false);
      component.toggle();
      expect(component.expanded).toBe(true); // Tests public property
    });
  });

  describe('Pitfall 4: Incomplete Material setup', () => {
    // BAD - Missing Material modules
    it('should show error - WRONG', () => {
      TestBed.configureTestingModule({
        imports: [MyFormComponent],
        // Missing: MatFormFieldModule, MatInputModule, etc.
      });

      const testFixture = TestBed.createComponent(MyFormComponent);
      testFixture.detectChanges();
      // Fails - Material directives not loaded
    });

    // GOOD - Complete Material modules
    it('should show error - CORRECT', () => {
      TestBed.configureTestingModule({
        imports: [
          MyFormComponent,
          MatFormFieldModule,
          MatInputModule,
          ReactiveFormsModule,
        ],
      });

      const testFixture = TestBed.createComponent(MyFormComponent);
      testFixture.detectChanges();
      // Works - All dependencies available
    });
  });

  describe('Pitfall 5: Mixing async patterns incorrectly', () => {
    // BAD - Mixing done callback and fakeAsync
    it('should load data - WRONG', fakeAsync((done) => {
      // Don't mix fakeAsync and done callback
      component.loadData();
      tick(1000);
      done(); // Confusing and error-prone
    }) as any);

    // GOOD - Using fakeAsync without done
    it('should load data - CORRECT', fakeAsync(() => {
      component.loadData();
      tick(1000);
      expect(component.data).toBeDefined();
    }));

    // GOOD - Using waitForAsync with promises
    it('should load data - ALSO CORRECT', waitForAsync(() => {
      component.loadPromise().then(() => {
        expect(component.data).toBeDefined();
      });
    }));
  });
});
```

**Common Pitfalls to Avoid:**
1. Forgetting `fixture.detectChanges()` after state changes
2. Not unsubscribing from observables (memory leaks)
3. Testing private implementation instead of public behavior
4. Missing Material module imports in TestBed setup
5. Mixing async patterns (fakeAsync + done callback)
6. Not resetting component state between tests
7. Accessing DOM before change detection
8. Not cleaning up setTimeout/setInterval
9. Assuming synchronous behavior for async operations
10. Not verifying mock call arguments and counts

---

## Summary

This guide provides comprehensive patterns for testing the Kubermatic Dashboard. Key takeaways:

- Always use `httpMock.verify()` to catch unexpected requests
- Use `fakeAsync`/`tick` for timers, `waitForAsync` for promises
- Test behavior, not implementation
- Use provided mock services and data factories
- Keep tests focused and fast
- Document complex test scenarios with comments

For detailed examples of working tests, see the test files in `modules/web/src/app/` and the mock services in `src/test/services/`.
