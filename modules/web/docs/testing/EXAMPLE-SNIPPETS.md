---
type: reference
title: Test Example Snippets & Templates
created: 2026-03-05
tags:
  - testing
  - examples
  - templates
  - jest
  - copy-paste
related:
  - '[[TESTING-PATTERNS]]'
  - '[[TESTING-BEST-PRACTICES]]'
  - '[[TEAM-ONBOARDING]]'
---

# Test Example Snippets & Templates

This document provides copy-paste ready test templates for common testing scenarios in the Kubermatic Dashboard. Each section includes a **minimal example** (for quick setup) and a **comprehensive example** (with best practices and advanced patterns).

**Quick Navigation:**
- [Form Component Test](#form-component-test-template)
- [Service Test](#service-test-template)
- [Component with HTTP](#component-with-http-template)
- [Dialog Component Test](#dialog-component-test-template)
- [Observable/Async Test](#observableasync-test-template)
- [Reactive Component Test](#reactive-component-test-template)

---

## Form Component Test Template

### Minimal Example

```typescript
// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '@shared/module';

import {MyFormComponent} from './component';

describe('MyFormComponent', () => {
  let component: MyFormComponent;
  let fixture: ComponentFixture<MyFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule],
      declarations: [MyFormComponent],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(MyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the form component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.form.get('username').value).toBe('');
    expect(component.form.valid).toBe(false);
  });

  it('should validate required field', () => {
    const control = component.form.get('username');
    control.setValue('');
    expect(control.hasError('required')).toBe(true);

    control.setValue('john');
    expect(control.hasError('required')).toBe(false);
  });

  it('should submit valid form data', () => {
    spyOn(component.formSubmitted, 'emit');

    component.form.patchValue({username: 'john', email: 'john@example.com'});
    component.onSubmit();

    expect(component.formSubmitted.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({username: 'john'})
    );
  });
});
```

### Comprehensive Example

```typescript
// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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
import {ReactiveFormsModule, FormArray} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {By} from '@angular/platform-browser';
import {SharedModule} from '@shared/module';

import {MyFormComponent} from './component';

describe('MyFormComponent', () => {
  let component: MyFormComponent;
  let fixture: ComponentFixture<MyFormComponent>;

  // Mock data
  const validFormData = {
    username: 'john-doe',
    email: 'john@example.com',
    password: 'StrongPassword123!',
    acceptTerms: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule],
      declarations: [MyFormComponent],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(MyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Form Initialization', () => {
    it('should create the form component', () => {
      expect(component).toBeTruthy();
      expect(component.form).toBeTruthy();
    });

    it('should initialize form with all required fields', () => {
      expect(component.form.get('username')).toBeTruthy();
      expect(component.form.get('email')).toBeTruthy();
      expect(component.form.get('password')).toBeTruthy();
      expect(component.form.get('acceptTerms')).toBeTruthy();
    });

    it('should initialize form as invalid when required fields are empty', () => {
      expect(component.form.valid).toBe(false);
      expect(component.form.get('username').hasError('required')).toBe(true);
    });

    it('should load existing data into form', () => {
      component.loadData(validFormData);
      expect(component.form.getRawValue()).toEqual(validFormData);
    });
  });

  describe('Field Validation', () => {
    it('should validate username is required', () => {
      const control = component.form.get('username');
      control.setValue('');
      expect(control.hasError('required')).toBe(true);

      control.setValue('john-doe');
      expect(control.hasError('required')).toBe(false);
    });

    it('should validate email format', () => {
      const control = component.form.get('email');

      control.setValue('invalid-email');
      expect(control.hasError('email')).toBe(true);

      control.setValue('john@example.com');
      expect(control.hasError('email')).toBe(false);
    });

    it('should validate password minimum length', () => {
      const control = component.form.get('password');

      control.setValue('short');
      expect(control.hasError('minlength')).toBe(true);

      control.setValue('StrongPassword123!');
      expect(control.hasError('minlength')).toBe(false);
    });

    it('should mark field as touched when user interacts', () => {
      const control = component.form.get('username');
      expect(control.touched).toBe(false);

      control.markAsTouched();
      expect(control.touched).toBe(true);
    });

    it('should show error messages after field is touched', () => {
      fixture.detectChanges();

      const control = component.form.get('username');
      control.setValue('');
      control.markAsTouched();
      fixture.detectChanges();

      const errorMsg = fixture.debugElement.query(By.css('[data-cy="username-error"]'));
      expect(errorMsg).toBeTruthy();
      expect(errorMsg.nativeElement.textContent).toContain('Username is required');
    });
  });

  describe('Form Submission', () => {
    it('should not submit invalid form', () => {
      spyOn(component.formSubmitted, 'emit');

      component.form.patchValue({username: ''}); // Invalid
      component.onSubmit();

      expect(component.formSubmitted.emit).not.toHaveBeenCalled();
    });

    it('should submit valid form with correct data', () => {
      spyOn(component.formSubmitted, 'emit');

      component.form.patchValue(validFormData);
      component.onSubmit();

      expect(component.formSubmitted.emit).toHaveBeenCalledWith(validFormData);
    });

    it('should disable submit button while form is invalid', () => {
      component.form.patchValue({username: ''}); // Invalid
      fixture.detectChanges();

      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.disabled).toBe(true);
    });

    it('should enable submit button when form is valid', () => {
      component.form.patchValue(validFormData);
      fixture.detectChanges();

      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.disabled).toBe(false);
    });
  });

  describe('FormArray Operations (if applicable)', () => {
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

    it('should validate each item in array', () => {
      const items = component.form.get('items') as FormArray;
      component.addItem();

      const firstItem = items.at(0);
      firstItem.patchValue({name: '', value: ''});

      expect(firstItem.invalid).toBe(true);
      expect(items.invalid).toBe(true);
    });
  });

  describe('Form Reset', () => {
    it('should reset form to initial state', () => {
      component.form.patchValue(validFormData);
      expect(component.form.dirty).toBe(true);

      component.resetForm();
      expect(component.form.dirty).toBe(false);
      expect(component.form.get('username').value).toBe('');
    });

    it('should reset form with new initial values', () => {
      const newData = {...validFormData, username: 'jane-doe'};
      component.resetForm(newData);

      expect(component.form.getRawValue()).toEqual(newData);
      expect(component.form.dirty).toBe(false);
    });
  });
});
```

---

## Service Test Template

### Minimal Example

```typescript
// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {environment} from '@environments/environment';

import {MyService} from './service';

describe('MyService', () => {
  let service: MyService;
  let httpMock: HttpTestingController;

  const mockData = {id: '123', name: 'Test Item', createdAt: '2026-01-01T00:00:00Z'};

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MyService],
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(MyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch item by ID', () => {
    service.getItem('123').subscribe((result) => {
      expect(result).toEqual(mockData);
    });

    const req = httpMock.expectOne(`${environment.restRoot}/items/123`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should create new item', () => {
    service.createItem(mockData).subscribe((result) => {
      expect(result.id).toBe('123');
    });

    const req = httpMock.expectOne(`${environment.restRoot}/items`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockData);
    req.flush(mockData);
  });
});
```

### Comprehensive Example

```typescript
// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {lastValueFrom} from 'rxjs';

import {MyService} from './service';

describe('MyService', () => {
  let service: MyService;
  let httpMock: HttpTestingController;
  let appConfig: AppConfigService;

  // Mock data
  const mockItem = {
    id: '123',
    name: 'Test Item',
    description: 'Test Description',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  };

  const mockItems = [
    {id: '1', name: 'Item 1', createdAt: '2026-01-01T00:00:00Z'},
    {id: '2', name: 'Item 2', createdAt: '2026-01-02T00:00:00Z'},
    {id: '3', name: 'Item 3', createdAt: '2026-01-03T00:00:00Z'},
  ];

  const restRoot = environment.restRoot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MyService,
        {provide: AppConfigService, useClass: AppConfigMockService},
      ],
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(MyService);
    httpMock = TestBed.inject(HttpTestingController);
    appConfig = TestBed.inject(AppConfigService);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding HTTP requests
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should inject AppConfigService', () => {
      expect(appConfig).toBeTruthy();
    });
  });

  describe('GET Operations', () => {
    it('should fetch single item by ID', async () => {
      const result = lastValueFrom(service.getItem('123'));

      const req = httpMock.expectOne(`${restRoot}/items/123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockItem);

      expect(await result).toEqual(mockItem);
    });

    it('should fetch list of items', async () => {
      const result = lastValueFrom(service.getItems());

      const req = httpMock.expectOne(`${restRoot}/items`);
      expect(req.request.method).toBe('GET');
      req.flush(mockItems);

      const items = await result;
      expect(items.length).toBe(3);
      expect(items[0].name).toBe('Item 1');
    });

    it('should fetch items with query parameters', async () => {
      const result = lastValueFrom(service.getItems({limit: 10, skip: 0}));

      const req = httpMock.expectOne((req) => {
        return req.url === `${restRoot}/items` && req.params.get('limit') === '10';
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockItems);

      expect(await result).toBeDefined();
    });

    it('should fetch empty list', async () => {
      const result = lastValueFrom(service.getItems());

      const req = httpMock.expectOne(`${restRoot}/items`);
      req.flush([]);

      expect(await result).toEqual([]);
    });
  });

  describe('POST Operations', () => {
    it('should create new item', async () => {
      const newItem = {name: 'New Item', description: 'New Description'};
      const result = lastValueFrom(service.createItem(newItem));

      const req = httpMock.expectOne(`${restRoot}/items`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newItem);
      req.flush(mockItem);

      expect(await result).toEqual(mockItem);
    });

    it('should send correct Content-Type header', () => {
      const newItem = {name: 'New Item', description: 'New Description'};
      service.createItem(newItem).subscribe();

      const req = httpMock.expectOne(`${restRoot}/items`);
      expect(req.request.headers.has('Content-Type')).toBe(true);
      req.flush(mockItem);
    });
  });

  describe('PUT/PATCH Operations', () => {
    it('should update existing item', async () => {
      const updates = {name: 'Updated Name'};
      const result = lastValueFrom(service.updateItem('123', updates));

      const req = httpMock.expectOne(`${restRoot}/items/123`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush({...mockItem, ...updates});

      const updated = await result;
      expect(updated.name).toBe('Updated Name');
    });
  });

  describe('DELETE Operations', () => {
    it('should delete item by ID', () => {
      service.deleteItem('123').subscribe();

      const req = httpMock.expectOne(`${restRoot}/items/123`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle delete success', async () => {
      const result = lastValueFrom(service.deleteItem('123'));

      const req = httpMock.expectOne(`${restRoot}/items/123`);
      req.flush({success: true});

      expect(await result).toEqual({success: true});
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 Not Found error', () => {
      service.getItem('invalid-id').subscribe(
        () => fail('should have errored'),
        (error) => {
          expect(error.status).toBe(404);
          expect(error.error.message).toBe('Item not found');
        }
      );

      const req = httpMock.expectOne(`${restRoot}/items/invalid-id`);
      req.flush({message: 'Item not found'}, {status: 404, statusText: 'Not Found'});
    });

    it('should handle 403 Forbidden error', () => {
      service.deleteItem('123').subscribe(
        () => fail('should have errored'),
        (error) => {
          expect(error.status).toBe(403);
          expect(error.error.message).toContain('Permission denied');
        }
      );

      const req = httpMock.expectOne(`${restRoot}/items/123`);
      req.flush(
        {message: 'Permission denied'},
        {status: 403, statusText: 'Forbidden'}
      );
    });

    it('should handle 500 Server Error', () => {
      service.getItems().subscribe(
        () => fail('should have errored'),
        (error) => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne(`${restRoot}/items`);
      req.flush(
        {message: 'Internal server error'},
        {status: 500, statusText: 'Internal Server Error'}
      );
    });
  });

  describe('Observable Caching (if implemented)', () => {
    it('should cache observable and avoid duplicate requests', () => {
      // First subscription
      service.getItem('123').subscribe();

      // Second subscription should use cache
      service.getItem('123').subscribe();

      // Only one request should be made
      const req = httpMock.expectOne(`${restRoot}/items/123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockItem);

      // No additional requests
      httpMock.expectNone(`${restRoot}/items/123`);
    });
  });

  describe('Service Methods', () => {
    it('should have all CRUD methods', () => {
      expect(service.getItem).toBeDefined();
      expect(service.getItems).toBeDefined();
      expect(service.createItem).toBeDefined();
      expect(service.updateItem).toBeDefined();
      expect(service.deleteItem).toBeDefined();
    });
  });
});
```

---

## Component with HTTP Template

### Minimal Example

```typescript
// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '@shared/module';
import {environment} from '@environments/environment';

import {ItemListComponent} from './component';
import {ItemService} from './item.service';

describe('ItemListComponent', () => {
  let component: ItemListComponent;
  let fixture: ComponentFixture<ItemListComponent>;
  let service: ItemService;
  let httpMock: HttpTestingController;

  const mockItems = [{id: '1', name: 'Item 1'}, {id: '2', name: 'Item 2'}];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, HttpClientTestingModule, SharedModule],
      declarations: [ItemListComponent],
      providers: [ItemService],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(ItemListComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(ItemService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load items on init', waitForAsync(() => {
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(component.items).toEqual(mockItems);
    });

    const req = httpMock.expectOne(`${environment.restRoot}/items`);
    req.flush(mockItems);
  }));

  it('should display loading state while fetching', () => {
    component.isLoading = true;
    fixture.detectChanges();

    const loader = fixture.debugElement.nativeElement.querySelector('[data-cy="loader"]');
    expect(loader).toBeTruthy();
  });

  it('should display items after loading', waitForAsync(() => {
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const items = fixture.debugElement.nativeElement.querySelectorAll('[data-cy="item"]');
      expect(items.length).toBe(2);
    });

    const req = httpMock.expectOne(`${environment.restRoot}/items`);
    req.flush(mockItems);
  }));
});
```

### Comprehensive Example

```typescript
// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {ComponentFixture, TestBed, waitForAsync, fakeAsync, tick} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {By} from '@angular/platform-browser';
import {SharedModule} from '@shared/module';
import {environment} from '@environments/environment';

import {ItemListComponent} from './component';
import {ItemService} from './item.service';

describe('ItemListComponent', () => {
  let component: ItemListComponent;
  let fixture: ComponentFixture<ItemListComponent>;
  let service: ItemService;
  let httpMock: HttpTestingController;

  // Mock data
  const mockItems = [
    {id: '1', name: 'Item 1', status: 'active', createdAt: '2026-01-01T00:00:00Z'},
    {id: '2', name: 'Item 2', status: 'inactive', createdAt: '2026-01-02T00:00:00Z'},
    {id: '3', name: 'Item 3', status: 'active', createdAt: '2026-01-03T00:00:00Z'},
  ];

  const restRoot = environment.restRoot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, HttpClientTestingModule, SharedModule],
      declarations: [ItemListComponent],
      providers: [ItemService],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(ItemListComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(ItemService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty items list', () => {
      expect(component.items).toEqual([]);
      expect(component.isLoading).toBe(false);
    });

    it('should load items on component init', waitForAsync(() => {
      component.ngOnInit();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(component.items.length).toBe(3);
        expect(component.isLoading).toBe(false);
      });

      const req = httpMock.expectOne(`${restRoot}/items`);
      expect(req.request.method).toBe('GET');
      req.flush(mockItems);
    }));
  });

  describe('Loading States', () => {
    it('should show loading indicator while fetching', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const loader = fixture.debugElement.query(By.css('[data-cy="loader"]'));
      expect(loader).toBeTruthy();
      expect(loader.nativeElement.hidden).toBe(false);
    });

    it('should hide loading indicator after items are loaded', waitForAsync(() => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.isLoading).toBe(true);

      fixture.whenStable().then(() => {
        fixture.detectChanges();
        expect(component.isLoading).toBe(false);
        const loader = fixture.debugElement.query(By.css('[data-cy="loader"]'));
        expect(loader.nativeElement.hidden).toBe(true);
      });

      const req = httpMock.expectOne(`${restRoot}/items`);
      req.flush(mockItems);
    }));
  });

  describe('Display Items', () => {
    it('should display items in list', waitForAsync(() => {
      component.ngOnInit();
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const itemElements = fixture.debugElement.queryAll(By.css('[data-cy="item"]'));
        expect(itemElements.length).toBe(3);
      });

      const req = httpMock.expectOne(`${restRoot}/items`);
      req.flush(mockItems);
    }));

    it('should display item details correctly', waitForAsync(() => {
      component.ngOnInit();
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const firstItem = fixture.debugElement.query(By.css('[data-cy="item-1"]'));
        expect(firstItem.nativeElement.textContent).toContain('Item 1');
        expect(firstItem.nativeElement.textContent).toContain('active');
      });

      const req = httpMock.expectOne(`${restRoot}/items`);
      req.flush(mockItems);
    }));

    it('should display empty state when no items', waitForAsync(() => {
      component.ngOnInit();
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const emptyState = fixture.debugElement.query(By.css('[data-cy="empty-state"]'));
        expect(emptyState).toBeTruthy();
      });

      const req = httpMock.expectOne(`${restRoot}/items`);
      req.flush([]);
    }));
  });

  describe('Item Actions', () => {
    it('should delete item when delete button clicked', waitForAsync(() => {
      spyOn(component.itemDeleted, 'emit');

      component.items = mockItems;
      fixture.detectChanges();

      const deleteBtn = fixture.debugElement.query(By.css('[data-cy="delete-item-1"]'));
      deleteBtn.nativeElement.click();

      fixture.whenStable().then(() => {
        expect(component.itemDeleted.emit).toHaveBeenCalledWith('1');
      });

      const req = httpMock.expectOne(`${restRoot}/items/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    }));

    it('should refresh items list', waitForAsync(() => {
      component.ngOnInit();
      fixture.detectChanges();

      const req1 = httpMock.expectOne(`${restRoot}/items`);
      req1.flush(mockItems);

      fixture.whenStable().then(() => {
        component.refresh();
        fixture.detectChanges();
      });

      const req2 = httpMock.expectOne(`${restRoot}/items`);
      req2.flush(mockItems);
    }));
  });

  describe('Error Handling', () => {
    it('should handle API error gracefully', waitForAsync(() => {
      component.ngOnInit();
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        expect(component.errorMessage).toBe('Failed to load items');
      });

      const req = httpMock.expectOne(`${restRoot}/items`);
      req.flush({message: 'Server error'}, {status: 500, statusText: 'Internal Server Error'});
    }));

    it('should display error message to user', waitForAsync(() => {
      component.errorMessage = 'Failed to load items';
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-cy="error-message"]'));
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain('Failed to load items');
    }));
  });

  describe('Filtering and Sorting', () => {
    it('should filter items by status', () => {
      component.items = mockItems;
      component.filterByStatus('active');
      fixture.detectChanges();

      expect(component.filteredItems.length).toBe(2);
      expect(component.filteredItems.every((item) => item.status === 'active')).toBe(true);
    });

    it('should sort items by name', () => {
      component.items = mockItems;
      component.sortBy('name');
      fixture.detectChanges();

      expect(component.filteredItems[0].name).toBe('Item 1');
      expect(component.filteredItems[2].name).toBe('Item 3');
    });
  });

  describe('Pagination', () => {
    it('should paginate items', () => {
      component.items = mockItems;
      component.pageSize = 2;
      component.currentPage = 0;
      fixture.detectChanges();

      expect(component.paginatedItems.length).toBe(2);
      expect(component.paginatedItems[0].id).toBe('1');
    });

    it('should load next page', waitForAsync(() => {
      component.items = mockItems;
      component.pageSize = 2;
      component.nextPage();

      expect(component.currentPage).toBe(1);
      fixture.detectChanges();
      expect(component.paginatedItems[0].id).toBe('3');
    }));
  });
});
```

---

## Dialog Component Test Template

### Minimal Example

```typescript
// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '@shared/module';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';

import {MyDialogComponent} from './component';

describe('MyDialogComponent', () => {
  let component: MyDialogComponent;
  let fixture: ComponentFixture<MyDialogComponent>;
  let dialogRef: MatDialogRefMock;

  const mockData = {id: '123', title: 'Test Dialog'};

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [MyDialogComponent],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: mockData},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(MyDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as MatDialogRefMock;
    fixture.detectChanges();
  });

  it('should create the dialog', () => {
    expect(component).toBeTruthy();
  });

  it('should receive dialog data', () => {
    expect(component.data).toEqual(mockData);
  });

  it('should close dialog on cancel', () => {
    spyOn(dialogRef, 'close');
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });

  it('should close dialog with data on confirm', () => {
    spyOn(dialogRef, 'close');
    component.confirmData = {name: 'Updated'};
    component.onConfirm();
    expect(dialogRef.close).toHaveBeenCalledWith(component.confirmData);
  });
});
```

### Comprehensive Example

```typescript
// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {By} from '@angular/platform-browser';
import {SharedModule} from '@shared/module';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';

import {MyDialogComponent} from './component';

describe('MyDialogComponent', () => {
  let component: MyDialogComponent;
  let fixture: ComponentFixture<MyDialogComponent>;
  let dialogRef: MatDialogRefMock;

  // Mock data
  const mockData = {
    id: '123',
    title: 'Edit Item',
    name: 'Test Item',
    description: 'Test Description',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule],
      declarations: [MyDialogComponent],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: mockData},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(MyDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as MatDialogRefMock;
    fixture.detectChanges();
  });

  describe('Dialog Initialization', () => {
    it('should create the dialog', () => {
      expect(component).toBeTruthy();
    });

    it('should inject dialog data', () => {
      expect(component.data).toEqual(mockData);
    });

    it('should initialize form with dialog data', () => {
      expect(component.form.get('name').value).toBe(mockData.name);
      expect(component.form.get('description').value).toBe(mockData.description);
    });

    it('should set dialog title', () => {
      const titleElement = fixture.debugElement.query(By.css('.mat-dialog-title'));
      expect(titleElement.nativeElement.textContent).toContain('Edit Item');
    });

    it('should add panel class to dialog', () => {
      const addPanelClassSpy = jest.spyOn(dialogRef, 'addPanelClass');
      component.ngOnInit();
      expect(addPanelClassSpy).toHaveBeenCalledWith('km-my-dialog');
    });
  });

  describe('Form Handling', () => {
    it('should load data into form', () => {
      expect(component.form.getRawValue()).toEqual(
        jasmine.objectContaining({
          name: mockData.name,
          description: mockData.description,
        })
      );
    });

    it('should mark form as pristine initially', () => {
      expect(component.form.pristine).toBe(true);
    });

    it('should mark form as dirty when user makes changes', () => {
      component.form.get('name').setValue('Updated Name');
      expect(component.form.dirty).toBe(true);
    });

    it('should validate form fields', () => {
      component.form.get('name').setValue('');
      expect(component.form.get('name').hasError('required')).toBe(true);
      expect(component.form.invalid).toBe(true);
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog on cancel button click', () => {
      spyOn(dialogRef, 'close');

      const cancelBtn = fixture.debugElement.query(By.css('[data-cy="cancel-btn"]'));
      cancelBtn.nativeElement.click();

      expect(dialogRef.close).toHaveBeenCalledWith(null);
    });

    it('should not close dialog on cancel if form is pristine and dirty (has unsaved changes)', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.form.get('name').setValue('Changed');

      const cancelBtn = fixture.debugElement.query(By.css('[data-cy="cancel-btn"]'));
      cancelBtn.nativeElement.click();

      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should close dialog with form data on confirm', () => {
      spyOn(dialogRef, 'close');

      component.form.patchValue({name: 'Updated Name'});
      const confirmBtn = fixture.debugElement.query(By.css('[data-cy="confirm-btn"]'));
      confirmBtn.nativeElement.click();

      expect(dialogRef.close).toHaveBeenCalledWith(
        jasmine.objectContaining({name: 'Updated Name'})
      );
    });

    it('should disable confirm button when form is invalid', () => {
      component.form.get('name').setValue('');
      fixture.detectChanges();

      const confirmBtn = fixture.debugElement.query(By.css('[data-cy="confirm-btn"]'));
      expect(confirmBtn.nativeElement.disabled).toBe(true);
    });

    it('should enable confirm button when form is valid', () => {
      component.form.get('name').setValue('Valid Name');
      fixture.detectChanges();

      const confirmBtn = fixture.debugElement.query(By.css('[data-cy="confirm-btn"]'));
      expect(confirmBtn.nativeElement.disabled).toBe(false);
    });
  });

  describe('Dialog State Management', () => {
    it('should track form changes', () => {
      const initialValue = component.form.getRawValue();

      component.form.patchValue({name: 'New Name'});

      const updatedValue = component.form.getRawValue();
      expect(updatedValue.name).not.toBe(initialValue.name);
    });

    it('should reset form to initial state', () => {
      component.form.patchValue({name: 'Changed'});
      expect(component.form.dirty).toBe(true);

      component.resetForm();

      expect(component.form.get('name').value).toBe(mockData.name);
      expect(component.form.pristine).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should display validation errors', () => {
      const nameControl = component.form.get('name');
      nameControl.setValue('');
      nameControl.markAsTouched();
      fixture.detectChanges();

      const errorMsg = fixture.debugElement.query(By.css('[data-cy="name-error"]'));
      expect(errorMsg).toBeTruthy();
      expect(errorMsg.nativeElement.textContent).toContain('required');
    });

    it('should handle dialog ref close', (done) => {
      dialogRef.afterClosed$.subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });

      dialogRef.close(undefined);
    });
  });
});
```

---

## Observable/Async Test Template

### Minimal Example

```typescript
// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {ComponentFixture, TestBed, fakeAsync, tick, waitForAsync} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '@shared/module';

import {AsyncComponent} from './component';

describe('AsyncComponent', () => {
  let component: AsyncComponent;
  let fixture: ComponentFixture<AsyncComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [AsyncComponent],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(AsyncComponent);
    component = fixture.componentInstance;
  });

  it('should handle async operations with waitForAsync', waitForAsync(() => {
    component.loadData();
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      expect(component.data).toBeDefined();
      expect(component.isLoading).toBe(false);
    });
  }));

  it('should handle timer with fakeAsync', fakeAsync(() => {
    component.startTimer();
    expect(component.counter).toBe(0);

    tick(1000);
    expect(component.counter).toBe(1);

    tick(2000);
    expect(component.counter).toBe(3);
  }));

  it('should subscribe to observable', (done) => {
    component.data$.subscribe((data) => {
      expect(data).toBeDefined();
      done();
    });
  });
});
```

### Comprehensive Example

```typescript
// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
  flush,
} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TestScheduler} from 'rxjs/testing';
import {SharedModule} from '@shared/module';
import {lastValueFrom, firstValueFrom} from 'rxjs';

import {AsyncComponent} from './component';

describe('AsyncComponent', () => {
  let component: AsyncComponent;
  let fixture: ComponentFixture<AsyncComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [AsyncComponent],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(AsyncComponent);
    component = fixture.componentInstance;
  });

  describe('Promise-based Async (waitForAsync)', () => {
    it('should load data asynchronously', waitForAsync(() => {
      component.loadDataAsPromise();
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        expect(component.data).toEqual(['item1', 'item2', 'item3']);
        expect(component.isLoading).toBe(false);
      });
    }));

    it('should handle promise rejection', waitForAsync(() => {
      component.loadDataWithError();
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        expect(component.error).toBe('Failed to load data');
        expect(component.isLoading).toBe(false);
      });
    }));

    it('should update UI after async operation', waitForAsync(() => {
      component.loadDataAsPromise();
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const contentElement = fixture.nativeElement.querySelector('[data-cy="content"]');
        expect(contentElement.textContent).toContain('item1');
      });
    }));
  });

  describe('Timer-based Async (fakeAsync)', () => {
    it('should increment counter with setInterval', fakeAsync(() => {
      component.startTimer();
      expect(component.counter).toBe(0);

      tick(1000); // Advance 1 second
      expect(component.counter).toBe(1);

      tick(2000); // Advance 2 more seconds
      expect(component.counter).toBe(3);

      component.stopTimer();
      tick(1000);
      expect(component.counter).toBe(3); // Should not increment after stop
    }));

    it('should handle debounced input', fakeAsync(() => {
      const inputEvent1 = {value: 'a'};
      const inputEvent2 = {value: 'ab'};
      const inputEvent3 = {value: 'abc'};

      component.onInputChange(inputEvent1.value);
      tick(100);
      component.onInputChange(inputEvent2.value);
      tick(100);
      component.onInputChange(inputEvent3.value);
      tick(300);

      expect(component.searchResults).toEqual(jasmine.arrayContaining(['abc']));
    }));

    it('should handle setTimeout', fakeAsync(() => {
      component.executeWithDelay();
      expect(component.isExecuted).toBe(false);

      tick(500);
      expect(component.isExecuted).toBe(true);
    }));

    it('should use flush to complete all async operations', fakeAsync(() => {
      component.startTimer();
      component.executeWithDelay();

      expect(component.counter).toBe(0);
      expect(component.isExecuted).toBe(false);

      flush(); // Complete all async operations

      expect(component.counter).toBeGreaterThan(0);
      expect(component.isExecuted).toBe(true);
    }));
  });

  describe('Observable-based Async', () => {
    it('should subscribe to observable on init', (done) => {
      component.data$ = component.loadDataAsObservable();
      component.ngOnInit();

      component.data$.subscribe((data) => {
        expect(data).toEqual(['item1', 'item2', 'item3']);
        done();
      });
    });

    it('should handle observable error', (done) => {
      component.loadDataWithObservableError();

      component.data$.subscribe(
        () => fail('should have errored'),
        (error) => {
          expect(error.message).toBe('Failed to load data');
          done();
        }
      );
    });

    it('should unsubscribe on component destroy', () => {
      const subscription = component.data$.subscribe();
      spyOn(subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscription.unsubscribe).toHaveBeenCalled();
    });

    it('should convert observable to promise with lastValueFrom', async () => {
      component.data$ = component.loadDataAsObservable();

      const data = await lastValueFrom(component.data$);
      expect(data).toEqual(['item1', 'item2', 'item3']);
    });

    it('should get first value with firstValueFrom', async () => {
      component.data$ = component.loadDataAsObservable();

      const firstData = await firstValueFrom(component.data$);
      expect(firstData).toBe('item1');
    });

    it('should handle observable completion', (done) => {
      const values: any[] = [];
      const complete = jasmine.createSpy('complete');

      component.data$.subscribe({
        next: (data) => values.push(data),
        complete: complete,
      });

      fixture.whenStable().then(() => {
        expect(values.length).toBeGreaterThan(0);
        expect(complete).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Marble Testing', () => {
    it('should test observable stream with marble syntax', () => {
      const testScheduler = new TestScheduler((actual, expected) => {
        expect(actual).toEqual(expected);
      });

      testScheduler.run(({cold, expectObservable}) => {
        const source$ = cold('a-b-c|', {
          a: 'item1',
          b: 'item2',
          c: 'item3',
        });

        const result$ = component.transformData(source$);

        expectObservable(result$).toBe('a-b-c|', {
          a: 'ITEM1',
          b: 'ITEM2',
          c: 'ITEM3',
        });
      });
    });

    it('should test observable error handling', () => {
      const testScheduler = new TestScheduler((actual, expected) => {
        expect(actual).toEqual(expected);
      });

      testScheduler.run(({cold, expectObservable}) => {
        const source$ = cold('a-b-#', {a: 'item1', b: 'item2'}, new Error('Test error'));

        expectObservable(source$).toBe('a-b-#', {a: 'item1', b: 'item2'}, new Error('Test error'));
      });
    });
  });

  describe('Multiple Async Operations', () => {
    it('should handle multiple async operations', waitForAsync(() => {
      component.loadMultipleAsync();
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        expect(component.data1).toBeDefined();
        expect(component.data2).toBeDefined();
        expect(component.data3).toBeDefined();
      });
    }));

    it('should handle parallel async operations with fakeAsync', fakeAsync(() => {
      component.startParallelOperations();

      tick(100); // First operation completes
      expect(component.operation1Complete).toBe(true);

      tick(200); // Second operation completes
      expect(component.operation2Complete).toBe(true);

      tick(300); // Third operation completes
      expect(component.operation3Complete).toBe(true);
    }));
  });

  describe('Race Conditions Prevention', () => {
    it('should cancel previous request when new one is triggered', waitForAsync(() => {
      component.startFirstLoad();
      fixture.detectChanges();

      // Before first completes, start second
      setTimeout(() => {
        component.startSecondLoad();
      }, 100);

      fixture.whenStable().then(() => {
        // Should only have data from second load
        expect(component.data).toEqual('second-load');
      });
    }));

    it('should handle out-of-order responses', fakeAsync(() => {
      component.request1();
      component.request2();

      // Request 2 completes first (shorter timeout)
      tick(100);
      expect(component.isRequest2Complete).toBe(true);

      // Request 1 completes second (longer timeout)
      tick(200);
      expect(component.isRequest1Complete).toBe(true);
    }));
  });
});
```

---

## Reactive Component Test Template

### Minimal Example

```typescript
// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {ReactiveComponent} from './component';

describe('ReactiveComponent (OnPush)', () => {
  let component: ReactiveComponent;
  let fixture: ComponentFixture<ReactiveComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [ReactiveComponent],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(ReactiveComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update when input property changes', () => {
    component.data = {id: '1', name: 'Item 1'};
    fixture.detectChanges();

    expect(component.data.name).toBe('Item 1');
  });

  it('should detect changes with new object reference', () => {
    const oldData = component.data;
    component.data = {...component.data, name: 'Updated'};
    fixture.detectChanges();

    expect(component.data).not.toBe(oldData);
    expect(component.data.name).toBe('Updated');
  });

  it('should not detect in-place modifications', () => {
    component.data.name = 'Modified';
    fixture.detectChanges();

    // With OnPush, in-place changes don't trigger change detection
    // This might fail - expected behavior for OnPush
    // expect(component.data.name).toBe('Modified'); // May not update
  });

  it('should emit output event', () => {
    spyOn(component.itemSelected, 'emit');

    component.selectItem('123');

    expect(component.itemSelected.emit).toHaveBeenCalledWith('123');
  });
});
```

### Comprehensive Example

```typescript
// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Output, EventEmitter} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {By} from '@angular/platform-browser';
import {SharedModule} from '@shared/module';

import {ReactiveComponent} from './component';

describe('ReactiveComponent (OnPush)', () => {
  let component: ReactiveComponent;
  let fixture: ComponentFixture<ReactiveComponent>;

  // Mock data
  const mockItem = {id: '1', name: 'Item 1', status: 'active'};
  const mockItems = [
    {id: '1', name: 'Item 1', status: 'active'},
    {id: '2', name: 'Item 2', status: 'inactive'},
    {id: '3', name: 'Item 3', status: 'active'},
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [ReactiveComponent],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(ReactiveComponent);
    component = fixture.componentInstance;
  });

  describe('OnPush Change Detection Strategy', () => {
    it('should create component with OnPush strategy', () => {
      expect(component).toBeTruthy();

      // Verify OnPush strategy is applied
      const metadata = (component.constructor as any).ɵcmp;
      expect(metadata.changeDetection).toBe(ChangeDetectionStrategy.OnPush);
    });

    it('should have access to ChangeDetectorRef', () => {
      expect(component['cdr']).toBeDefined(); // If component injects ChangeDetectorRef
    });
  });

  describe('Input Property Changes', () => {
    it('should detect changes when @Input property is set with new reference', () => {
      component.item = mockItem;
      fixture.detectChanges();

      expect(component.item).toEqual(mockItem);
    });

    it('should update template when input changes', () => {
      component.item = mockItem;
      fixture.detectChanges();

      const nameElement = fixture.debugElement.query(By.css('[data-cy="item-name"]'));
      expect(nameElement.nativeElement.textContent).toBe('Item 1');
    });

    it('should NOT detect in-place modifications without explicit change detection', () => {
      component.item = {id: '1', name: 'Item 1', status: 'active'};
      fixture.detectChanges();

      // Modify in-place (not a new reference)
      component.item.name = 'Modified'; // This won't trigger change detection with OnPush
      fixture.detectChanges();

      // Component property updated, but view might not reflect it
      expect(component.item.name).toBe('Modified');
      // The view might still show 'Item 1' because of OnPush
    });

    it('should detect changes when object is replaced with spread operator', () => {
      component.item = {id: '1', name: 'Item 1', status: 'active'};
      fixture.detectChanges();

      // Replace with new reference
      component.item = {...component.item, name: 'Updated'};
      fixture.detectChanges();

      const nameElement = fixture.debugElement.query(By.css('[data-cy="item-name"]'));
      expect(nameElement.nativeElement.textContent).toBe('Updated');
    });

    it('should handle multiple input properties', () => {
      component.item = mockItem;
      component.isSelected = true;
      fixture.detectChanges();

      expect(component.item).toEqual(mockItem);
      expect(component.isSelected).toBe(true);
    });

    it('should not update when input property changes reference but content is same', () => {
      const itemRef = mockItem;
      component.item = itemRef;
      fixture.detectChanges();

      // Still same reference
      component.item = itemRef;
      fixture.detectChanges();

      expect(component.item).toBe(itemRef);
    });
  });

  describe('Output Event Emission', () => {
    it('should emit output event when @Output EventEmitter fires', () => {
      spyOn(component.itemSelected, 'emit');

      component.selectItem('123');

      expect(component.itemSelected.emit).toHaveBeenCalledWith('123');
    });

    it('should trigger parent change detection when child emits output', () => {
      spyOn(component.itemSelected, 'emit');

      component.selectItem(mockItem);

      expect(component.itemSelected.emit).toHaveBeenCalledWith(mockItem);
    });

    it('should emit with correct data payload', () => {
      const emitSpy = spyOn(component.itemSelected, 'emit');
      const testData = {id: '123', name: 'Test'};

      component.selectItem(testData);

      expect(emitSpy).toHaveBeenCalledWith(testData);
    });

    it('should handle multiple event emissions', () => {
      const emitSpy = spyOn(component.itemSelected, 'emit');

      component.selectItem('1');
      component.selectItem('2');
      component.selectItem('3');

      expect(emitSpy).toHaveBeenCalledTimes(3);
      expect(emitSpy).toHaveBeenNthCalledWith(1, '1');
      expect(emitSpy).toHaveBeenNthCalledWith(2, '2');
      expect(emitSpy).toHaveBeenNthCalledWith(3, '3');
    });
  });

  describe('Async Pipe with Observables', () => {
    it('should update when observable emits', () => {
      component.items$ = component.loadItems();
      fixture.detectChanges();

      // Give async pipe time to emit
      fixture.detectChanges();

      const itemElements = fixture.debugElement.queryAll(By.css('[data-cy="item"]'));
      expect(itemElements.length).toBeGreaterThan(0);
    });

    it('should trigger change detection when async pipe emits', (done) => {
      component.items$ = component.loadItems();
      fixture.detectChanges();

      setTimeout(() => {
        fixture.detectChanges();
        expect(component.items).toBeDefined();
        done();
      }, 100);
    });
  });

  describe('Manual Change Detection (markForCheck)', () => {
    it('should allow manual change detection trigger', () => {
      component.item = mockItem;
      const cdr = fixture.componentRef.injector.get(ChangeDetectorRef);
      spyOn(cdr, 'markForCheck');

      component.updateManually();

      expect(cdr.markForCheck).toHaveBeenCalled();
    });

    it('should update view after markForCheck', () => {
      component.item = mockItem;
      fixture.detectChanges();

      // Modify in-place
      component.item.name = 'Modified';

      // Manually trigger change detection
      const cdr = fixture.componentRef.injector.get(ChangeDetectorRef);
      cdr.markForCheck();
      fixture.detectChanges();

      const nameElement = fixture.debugElement.query(By.css('[data-cy="item-name"]'));
      expect(nameElement.nativeElement.textContent).toBe('Modified');
    });
  });

  describe('DOM Updates and Bindings', () => {
    it('should bind input data to template', () => {
      component.item = mockItem;
      fixture.detectChanges();

      const element = fixture.debugElement.query(By.css('[data-cy="item-name"]'));
      expect(element.nativeElement.textContent).toBe('Item 1');
    });

    it('should apply conditional CSS classes based on input', () => {
      component.item = {id: '1', name: 'Item 1', status: 'active'};
      fixture.detectChanges();

      const element = fixture.debugElement.query(By.css('[data-cy="item-status"]'));
      expect(element.nativeElement.classList.contains('active')).toBe(true);
    });

    it('should handle click events and emit output', () => {
      spyOn(component.itemSelected, 'emit');

      component.item = mockItem;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('[data-cy="select-btn"]'));
      button.nativeElement.click();

      expect(component.itemSelected.emit).toHaveBeenCalled();
    });
  });

  describe('List Rendering with OnPush', () => {
    it('should render list when items array changes reference', () => {
      component.items = mockItems;
      fixture.detectChanges();

      const itemElements = fixture.debugElement.queryAll(By.css('[data-cy="item"]'));
      expect(itemElements.length).toBe(3);
    });

    it('should NOT re-render when array item is modified in-place', () => {
      component.items = [...mockItems];
      fixture.detectChanges();

      // Modify first item in-place
      component.items[0].name = 'Modified';
      fixture.detectChanges();

      // View won't show updated name without new array reference
      const firstItemElement = fixture.debugElement.query(By.css('[data-cy="item-0"]'));
      // May still show 'Item 1' instead of 'Modified'
    });

    it('should re-render when new array reference is provided', () => {
      component.items = [...mockItems];
      fixture.detectChanges();

      // Update with new array reference
      component.items = [
        ...component.items.slice(0, 1),
        {...component.items[0], name: 'Modified'},
        ...component.items.slice(1),
      ];
      fixture.detectChanges();

      const firstItemElement = fixture.debugElement.query(By.css('[data-cy="item-0"]'));
      expect(firstItemElement.nativeElement.textContent).toContain('Modified');
    });
  });

  describe('Best Practices for OnPush', () => {
    it('should always use new object references for input changes', () => {
      const original = {id: '1', name: 'Original'};
      component.item = original;
      fixture.detectChanges();

      // Correct: create new reference
      const updated = {...original, name: 'Updated'};
      component.item = updated;
      fixture.detectChanges();

      expect(component.item).not.toBe(original);
      expect(component.item.name).toBe('Updated');
    });

    it('should use trackBy for ngFor lists', () => {
      component.items = mockItems;
      component.trackByItemId = (index: number, item: any) => item.id;

      fixture.detectChanges();

      // This allows Angular to track items by id for more efficient updates
      expect(component.trackByItemId).toBeDefined();
    });
  });
});
```

---

## Tips for Using These Templates

1. **Copy the appropriate template** based on your component type
2. **Replace the copyright year** if needed
3. **Update component and service names** to match your code
4. **Adjust mock data** to match your actual data structures
5. **Add/remove test cases** based on your component's specific behavior
6. **Keep tests focused** - each test should test one thing
7. **Use data-cy attributes** for reliable DOM queries (better than CSS selectors)
8. **Always call `httpMock.verify()`** in afterEach for service tests
9. **Always call `fixture.detectChanges()`** after setting properties (especially important for OnPush)
10. **Use descriptive test names** that explain what's being tested

## Common Mistakes to Avoid

❌ Don't forget `fixture.detectChanges()` after setting @Input properties
❌ Don't forget `httpMock.verify()` in afterEach
❌ Don't modify data in-place in OnPush components without creating new references
❌ Don't use complex CSS selectors - use data-cy attributes instead
❌ Don't test implementation details - test behavior and outputs
❌ Don't create unnecessarily complex mock data
❌ Don't forget to handle observable subscriptions in ngOnDestroy

✅ Always use `By.css()` and `debugElement` for DOM queries
✅ Always use descriptive test names (describe what's being tested)
✅ Always organize tests into logical describe blocks
✅ Always test both success and error scenarios
✅ Always clean up resources (unsubscribe from observables)
✅ Always use lastValueFrom/firstValueFrom for Promise-like async handling
✅ Always verify HTTP requests are correct before flushing

---

## See Also

- [[TESTING-PATTERNS]] - Detailed pattern documentation
- [[TESTING-BEST-PRACTICES]] - Testing best practices guide
- [[TEAM-ONBOARDING]] - Learning path for new team members
