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

# Testing Workshop: 2-Hour Team Training Session

This document provides a complete agenda for a 2-hour team workshop on testing practices for the Kubermatic Dashboard. It includes live coding demonstrations, interactive exercises, and Q&A sessions.

---

## Workshop Overview

**Duration:** 2 hours (120 minutes)
**Target Audience:** All developers (new and experienced)
**Format:** Interactive workshop with live coding demos and hands-on exercises
**Requirements:** Laptop with development environment set up
**Outcome:** Team members can write and maintain quality tests

---

## Agenda at a Glance

| Time | Duration | Activity | Format |
|------|----------|----------|--------|
| 0:00 - 0:05 | 5 min | Welcome & Goals | Presentation |
| 0:05 - 0:15 | 10 min | Testing Fundamentals | Presentation + Q&A |
| 0:15 - 0:30 | 15 min | **LIVE DEMO #1:** Simple Component Test | Live Coding |
| 0:30 - 0:40 | 10 min | Exercise #1: Write Your First Test | Hands-On |
| 0:40 - 0:45 | 5 min | Break & Q&A | Discussion |
| 0:45 - 1:05 | 20 min | **LIVE DEMO #2:** Service Testing & Mocks | Live Coding |
| 1:05 - 1:15 | 10 min | Exercise #2: Test a Service | Hands-On |
| 1:15 - 1:20 | 5 min | Quick Q&A | Discussion |
| 1:20 - 1:35 | 15 min | **LIVE DEMO #3:** Debugging a Failing Test | Live Coding |
| 1:35 - 1:45 | 10 min | Exercise #3: Debug & Fix Tests | Hands-On |
| 1:45 - 2:00 | 15 min | Recap, Resources & Final Q&A | Presentation |

---

## Detailed Agenda

### 0:00 - 0:05 | Welcome & Goals (5 minutes)

**Presenter Notes:**
- Welcome everyone to the testing workshop!
- This is a hands-on session, not just theory
- By end of 2 hours, everyone should feel confident writing tests

**Key Points to Communicate:**
- Testing is a core skill for this team
- We'll learn by doing (live coding + hands-on exercises)
- Questions are encouraged - ask anytime
- There are no "dumb questions" in testing

**Slide 1 Content:**
```
Testing Workshop: 2-Hour Team Training
===================================
Goals for Today:
✓ Understand testing fundamentals
✓ Write your first Jest test
✓ Test services and mocks
✓ Debug failing tests
✓ Know where to get help

No prior testing experience required!
```

---

### 0:05 - 0:15 | Testing Fundamentals (10 minutes)

**Presenter Notes:**
Explain why testing matters and our approach at high level.

**Content to Cover:**

1. **Why We Test** (2 min)
   - Prevents regressions in complex cluster management features
   - Enables safe refactoring
   - Documents expected behavior
   - Provides confidence when deploying

2. **Three Levels of Testing** (3 min)
   - Unit tests (Jest) - Test components & services in isolation (~3 min to run)
   - Integration tests - Test features together
   - E2E tests (Cypress) - Test complete user workflows
   - We focus on unit tests in this workshop

3. **Our Testing Tools** (3 min)
   - **Jest:** Fast test runner with great output
   - **TestBed:** Angular's testing utility
   - **HttpTestingController:** Mock HTTP requests
   - **@testing-library/angular:** DOM testing utilities (if used)

4. **Testing Mindset** (2 min)
   - Test behavior, not implementation
   - One assertion per test (usually)
   - Test should document what the code does
   - Failing tests should be informative

**Slides Content:**

```
Why We Test
===========
✓ Prevents bugs from sneaking in
✓ Makes refactoring safer
✓ Documents expected behavior
✓ Enables CI/CD confidence

Our Testing Pyramid
===================
        E2E Tests (slow)
       / Integration Tests
      /__ Unit Tests (fast)

Test Tools We Use
=================
Jest - Test runner & assertions
TestBed - Angular testing utility
HttpTestingController - Mock HTTP
Common utilities - See src/test/
```

**Q&A:** (1-2 min)
- "What's the difference between unit and integration tests?"
- "Do I need to test everything?"
- "How do I decide what to test?"

---

### 0:15 - 0:30 | LIVE DEMO #1: Simple Component Test (15 minutes)

**Presenter Notes:**
This is your first live coding demo. Go slowly, explain each step. Show code being typed in real IDE.

**Demo Scenario:**
Create a simple button component test from scratch. Show:
1. Component structure (template, class)
2. Test file setup (TestBed, fixture, component)
3. Writing test cases
4. Running the test
5. Fixing a failing test

**Step-by-Step Demo:**

**Step 1: Show the Component Being Tested** (2 min)
```typescript
// button.component.ts
@Component({
  selector: 'km-button',
  template: `
    <button
      [disabled]="disabled"
      (click)="handleClick()"
    >
      {{ label }}
    </button>
  `
})
export class ButtonComponent {
  @Input() label = 'Click me';
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<void>();

  handleClick(): void {
    this.clicked.emit();
  }
}
```

**Explain:** This is a simple button component with:
- Input properties for label and disabled state
- Output event when clicked
- No complex logic (perfect for first test!)

**Step 2: Create Test File** (1 min)
```typescript
// button.component.spec.ts
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ButtonComponent} from './button.component';

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<ButtonComponent>;
  let component: ButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Tests will go here
});
```

**Explain:** The beforeEach setup:
- `TestBed.configureTestingModule()` = declares component, imports modules, sets up services
- `createComponent()` creates the component in a test fixture
- `fixture.detectChanges()` runs Angular's change detection

**Step 3: Write First Test** (3 min)
Type this test slowly, explain each line:
```typescript
it('should create the button', () => {
  expect(component).toBeTruthy();
});
```

**Explain:**
- `it()` defines a single test case
- Test name describes what it tests
- `expect().toBeTruthy()` is an assertion

**Run the test:**
```bash
npm test -- src/app/shared/components/button.component.spec.ts
```

**Show output:** ✓ Test passes (show green checkmark)

**Step 4: Write More Tests** (6 min)

**Test 2: Render label from input**
```typescript
it('should display the label text', () => {
  component.label = 'Submit';
  fixture.detectChanges(); // Apply input changes

  const button = fixture.nativeElement.querySelector('button');
  expect(button.textContent).toContain('Submit');
});
```

**Explain:**
- We set @Input property
- Call `detectChanges()` to apply changes
- Query the DOM with `nativeElement.querySelector()`
- Assert the rendered text

**Run it** - should pass ✓

**Test 3: Disable state**
```typescript
it('should disable button when disabled input is true', () => {
  component.disabled = true;
  fixture.detectChanges();

  const button = fixture.nativeElement.querySelector('button');
  expect(button.disabled).toBe(true);
});
```

**Test 4: Emit click event**
```typescript
it('should emit clicked event when button is clicked', () => {
  spyOn(component.clicked, 'emit');

  const button = fixture.nativeElement.querySelector('button');
  button.click();

  expect(component.clicked.emit).toHaveBeenCalled();
});
```

**Explain:**
- `spyOn()` allows us to watch method calls
- We can assert methods were called with what arguments
- `button.click()` simulates user clicking

**Run all tests:**
```bash
npm test -- button.component.spec.ts
```

**Show output:** ✓ All 4 tests pass!

**Live Demo Tips:**
- Type slowly so people can follow
- Explain what you're typing before you type
- Ask for questions after each test
- Show the test running and passing
- If a test fails, debug it live (show common error patterns)

**Q&A:** (1-2 min)
- "Why did we call detectChanges() twice?"
- "What does spyOn do?"
- "How do we know what to test?"

---

### 0:30 - 0:40 | Exercise #1: Write Your First Test (10 minutes)

**Exercise Instructions:**

**Task:** Write tests for a simple form input component

**Component Code:**
```typescript
@Component({
  selector: 'km-text-input',
  template: `
    <input
      type="text"
      [(ngModel)]="value"
      [placeholder]="placeholder"
      [required]="required"
    />
  `
})
export class TextInputComponent {
  @Input() placeholder = 'Enter text...';
  @Input() required = false;
  @Output() valueChange = new EventEmitter<string>();

  value = '';

  onValueChange(newValue: string): void {
    this.value = newValue;
    this.valueChange.emit(newValue);
  }
}
```

**What to Test:** (write 3-4 tests)
1. Component creates successfully
2. Input displays placeholder text
3. Value changes when user types
4. valueChange event emits new value

**Skeleton Code:**
```typescript
describe('TextInputComponent', () => {
  let fixture: ComponentFixture<TextInputComponent>;
  let component: TextInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextInputComponent],
      imports: [FormsModule], // Required for ngModel
    }).compileComponents();

    fixture = TestBed.createComponent(TextInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Add more tests here
});
```

**Tips for Participants:**
- Start simple (just checking component creates)
- Then add tests for @Input properties
- Then add tests for @Output events
- Use the demo as a template

**Facilitator Notes:**
- Walk around the room, help people who are stuck
- Show how to run tests on their machine
- For errors, debug together:
  - "What does the error message say?"
  - "What should happen instead?"
  - "Where's the mismatch?"
- Have 1-2 people share their tests with the group

**Time Management:**
- 6 minutes: People writing tests
- 3 minutes: Facilitator debugging + Q&A
- 1 minute: Wrap up

---

### 0:40 - 0:45 | Break & Q&A (5 minutes)

**Presenter Notes:**
Quick break to refresh before next demo.

**During Break:**
- People can ask questions one-on-one
- Help anyone who got stuck on exercise
- Collect feedback if using feedback forms

**Topics to Address:**
- "That was faster/slower than I expected"
- Specific errors people hit
- Confidence levels with what they've learned so far

---

### 0:45 - 1:05 | LIVE DEMO #2: Service Testing & Mocks (20 minutes)

**Presenter Notes:**
This demo shows how to test services that make HTTP calls. Key new concepts:
- HttpTestingController
- Mock services
- Observables in tests

**Demo Scenario:**
Create a data service test that shows:
1. Service setup with HttpTestingController
2. Mocking HTTP requests
3. Verifying correct requests were made
4. Testing error handling

**Step-by-Step Demo:**

**Step 1: Show the Service Being Tested** (2 min)
```typescript
// data.service.ts
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({providedIn: 'root'})
export class DataService {
  constructor(private http: HttpClient) {}

  getData(id: string): Observable<{id: string; name: string}> {
    return this.http.get<{id: string; name: string}>(`/api/data/${id}`);
  }

  saveData(data: {id: string; name: string}): Observable<void> {
    return this.http.post<void>('/api/data', data);
  }
}
```

**Explain:** This service:
- Fetches data from an API
- Saves data to an API
- Returns observables (async operations)
- We need to mock the HTTP calls in tests

**Step 2: Create Test File with HttpTestingController** (3 min)
```typescript
// data.service.spec.ts
import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {DataService} from './data.service';

describe('DataService', () => {
  let service: DataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DataService],
    });

    service = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding requests
  });

  // Tests will go here
});
```

**Explain:**
- `HttpClientTestingModule` provides fake HTTP that doesn't make real requests
- `HttpTestingController` lets us mock responses
- `afterEach()` with `verify()` ensures all mocked requests were used

**Step 3: Write First Test - Successful Data Fetch** (5 min)
```typescript
it('should fetch data successfully', (done) => {
  const mockData = {id: '123', name: 'Test Data'};

  service.getData('123').subscribe(data => {
    expect(data).toEqual(mockData);
    done(); // Tell test we're done with async
  });

  // Expect a GET request to the API
  const req = httpMock.expectOne('/api/data/123');
  expect(req.request.method).toBe('GET');

  // Respond with mock data
  req.flush(mockData);
});
```

**Explain line-by-line:**
- Observable subscription with a callback
- `expectOne()` asserts exactly one request was made
- Check the HTTP method is GET
- `req.flush(mockData)` sends mock response
- `done()` callback tells test when async is complete

**Run the test** - should pass ✓

**Step 4: Write Test for Error Handling** (5 min)
```typescript
it('should handle API errors', (done) => {
  service.getData('invalid').subscribe(
    () => {
      fail('should have failed');
    },
    (error) => {
      expect(error.status).toBe(404);
      done();
    }
  );

  const req = httpMock.expectOne('/api/data/invalid');
  req.flush(
    {message: 'Not found'},
    {status: 404, statusText: 'Not Found'}
  );
});
```

**Explain:**
- Observables have two callbacks: success and error
- We test the error path
- `flush()` can send error responses with status codes

**Step 5: Write Test for POST/Save** (3 min)
```typescript
it('should save data with POST request', () => {
  const newData = {id: '456', name: 'New Item'};

  service.saveData(newData).subscribe();

  const req = httpMock.expectOne('/api/data');
  expect(req.request.method).toBe('POST');
  expect(req.request.body).toEqual(newData);

  req.flush(undefined, {status: 200, statusText: 'OK'});
});
```

**Explain:**
- POST requests include a body with data
- We verify the body contains what we sent
- `flush()` can send success responses

**Run all service tests:**
```bash
npm test -- data.service.spec.ts
```

**Show output:** ✓ All 3 tests pass!

**Key Takeaways from Demo:**
- Services talk to APIs via HttpClient
- We mock HTTP using HttpTestingController
- Tests verify requests were made correctly
- Tests verify error handling works

**Q&A:** (1-2 min)
- "What does flush() do?"
- "Why call done()?"
- "What's the difference between expectOne and expect?"

---

### 1:05 - 1:15 | Exercise #2: Test a Service (10 minutes)

**Exercise Instructions:**

**Task:** Write tests for a simple auth service

**Service Code:**
```typescript
@Injectable({providedIn: 'root'})
export class AuthService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<{token: string}> {
    return this.http.post<{token: string}>('/api/login', {
      email,
      password,
    });
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/logout', {});
  }
}
```

**What to Test:** (write 2-3 tests)
1. Login sends POST with credentials
2. Login response contains token
3. Login handles 401 (unauthorized) error
4. Logout sends POST to logout endpoint

**Skeleton Code:**
```typescript
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Write tests here
});
```

**Starter Test:**
```typescript
it('should send login request with credentials', () => {
  service.login('user@example.com', 'password123').subscribe();

  const req = httpMock.expectOne('/api/login');
  expect(req.request.method).toBe('POST');
  expect(req.request.body).toEqual({
    email: 'user@example.com',
    password: 'password123',
  });
});
```

**Tips for Participants:**
- Use the service demo as a template
- Copy structure from demo, adapt URLs/methods
- Remember: `subscribe()` is required to actually trigger HTTP
- Use `expectOne()` to verify request
- Use `flush()` to send response

**Facilitator Notes:**
- Help people get tests running
- Walk through one test completely with someone struggling
- Show how small changes break tests (helps debugging)
- Have people try different error scenarios

**Time Management:**
- 6 minutes: People writing tests
- 3 minutes: Facilitator help + debugging
- 1 minute: Quick recap

---

### 1:15 - 1:20 | Quick Q&A (5 minutes)

**Presenter Notes:**
Quick discussion before the debugging demo.

**Topics to Address:**
- Common errors people hit on exercise
- Confidence with httpMock pattern
- Questions about observables or async

---

### 1:20 - 1:35 | LIVE DEMO #3: Debugging a Failing Test (15 minutes)

**Presenter Notes:**
This demo is crucial - shows how to solve problems in tests. Deliberately create a failing test, then debug it step-by-step.

**Demo Scenario:**
Start with a broken test, debug it using:
1. Error message analysis
2. Console logging
3. Breakpoints
4. Isolating the problem
5. Fixing the issue

**The Broken Test:**

```typescript
// Start with this intentionally broken test
it('should load user data on init', (done) => {
  const user = {id: 1, name: 'John Doe'};

  component.loadUser('john');

  fixture.detectChanges();

  // This will fail - wrong assertion
  expect(component.userData).toEqual(user);
  done();
});
```

**Step 1: Run the Test and See the Error** (2 min)

```bash
npm test -- component.spec.ts
```

**Show Error Output:**
```
FAIL  src/app/example.spec.ts
● Example Suite › should load user data on init

  Expected: {"id": 1, "name": "John Doe"}
  Received: undefined

    at Object.<anonymous> (src/app/example.spec.ts:45:12)
```

**Explain:** The error message tells us:
- Test name: "should load user data on init"
- What failed: userData is undefined (not the user object)
- Why: probably the HTTP request hasn't completed yet

**Step 2: Check the Component Code** (2 min)

```typescript
loadUser(id: string): void {
  this.userService.getUser(id).subscribe(user => {
    this.userData = user; // Sets userData asynchronously
  });
}
```

**Explain:** The problem is clear now:
- `loadUser()` is asynchronous
- It makes an HTTP request
- We're checking userData before the response arrives
- We need to mock the HTTP response!

**Step 3: Add Console Logging to Debug** (2 min)

```typescript
it('should load user data on init', (done) => {
  const user = {id: 1, name: 'John Doe'};

  console.log('Before loadUser:', component.userData);
  component.loadUser('john');
  console.log('After loadUser (before mock):', component.userData);

  // ... rest of test
});
```

**Run test and show console output:**
- Shows userData is undefined at all stages
- Proves we need to mock the response

**Step 4: Add HTTP Mock** (4 min)

```typescript
it('should load user data on init', (done) => {
  const user = {id: 1, name: 'John Doe'};

  // Subscribe to the observable and check when data arrives
  component.loadUser('john');

  // Mock the HTTP request
  const req = httpMock.expectOne('/api/users/john');
  req.flush(user); // Send mock response

  // Now userData should be set
  expect(component.userData).toEqual(user);
  done();
});
```

**Run test** - should pass ✓

**Explain:** The fix:
- We need to mock the HTTP call
- Use httpMock to wait for request
- Use flush() to send response
- Now userData is set before assertion

**Step 5: Show Alternative Using fakeAsync** (3 min)

```typescript
it('should load user data on init', fakeAsync(() => {
  const user = {id: 1, name: 'John Doe'};

  component.loadUser('john');

  const req = httpMock.expectOne('/api/users/john');
  req.flush(user);

  // No done() needed with fakeAsync
  expect(component.userData).toEqual(user);
}));
```

**Explain:** Two ways to handle async tests:
- Using `(done)` callback (traditional)
- Using `fakeAsync` (cleaner, no callback needed)

**Key Debugging Lessons:**
1. **Read the error** - It usually tells you what's wrong
2. **Think about async** - Most test failures are timing issues
3. **Use console.log** - Print values before/after operations
4. **Mock at the boundary** - Mock HTTP, not internal logic
5. **Isolate the problem** - Test one thing at a time
6. **Use breakpoints** - Set debugger in VS Code or Chrome

**Debugging Tools Demonstrated:**
- Error message analysis
- Console logging
- HTTP mocking
- fakeAsync operator

**Q&A:** (1-2 min)
- "How do I know if it's an async issue?"
- "When should I use fakeAsync vs done callback?"
- "Can I use debugger in tests?"

---

### 1:35 - 1:45 | Exercise #3: Debug & Fix Tests (10 minutes)

**Exercise Instructions:**

**Task:** Fix a broken test and make it pass

**Broken Test Code:**
```typescript
describe('CommentComponent', () => {
  let fixture: ComponentFixture<CommentComponent>;
  let component: CommentComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommentComponent],
      imports: [HttpClientTestingModule],
      providers: [CommentService],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  // BROKEN TEST - Fix this!
  it('should load comments', (done) => {
    const mockComments = [
      {id: 1, text: 'Great!'},
      {id: 2, text: 'Nice work'},
    ];

    component.loadComments();
    fixture.detectChanges();

    // This fails because HTTP hasn't completed yet
    expect(component.comments.length).toBe(2);
    done();
  });
});
```

**What's Wrong:**
The test doesn't mock the HTTP request. When `loadComments()` is called, it makes an async HTTP call, but the test checks the result before the response arrives.

**How to Fix:**
Add HTTP mocking using `httpMock.expectOne()` and `flush()`.

**Skeleton Fix:**
```typescript
it('should load comments', (done) => {
  const mockComments = [
    {id: 1, text: 'Great!'},
    {id: 2, text: 'Nice work'},
  ];

  component.loadComments();

  // Add HTTP mock here
  const req = httpMock.expectOne('/api/comments');
  req.flush(mockComments);

  // Assertion
  expect(component.comments.length).toBe(2);
  done();
});
```

**What to Verify:**
- [ ] Test runs without errors
- [ ] Test passes (green checkmark)
- [ ] HTTP request was mocked
- [ ] Response was sent with flush()

**Debugging Checklist:**
- [ ] Run test and read error message
- [ ] Check if it's an async/timing issue
- [ ] Look for missing HTTP mock
- [ ] Verify HTTP URL is correct
- [ ] Check mock data is complete
- [ ] Test passes after fix

**Facilitator Notes:**
- Give people the broken test to fix
- They should identify the problem first
- Then apply the fix from demo
- Help anyone stuck after 5 minutes
- Have people share their fixed test

**Time Management:**
- 2 minutes: Read broken test, identify problem
- 3 minutes: Write fix
- 3 minutes: Run and verify passes
- 2 minutes: Facilitator Q&A & help

---

### 1:45 - 2:00 | Recap, Resources & Final Q&A (15 minutes)

**Presenter Notes:**
Final session summarizing what was learned and pointing to resources.

**Part 1: Recap What We Learned** (5 min)

**Slide Content:**
```
What We've Learned Today
=========================

✓ Component Testing
  - Create components in TestBed
  - Test @Input and @Output
  - Query and trigger DOM events

✓ Service Testing
  - Mock HTTP with HttpTestingController
  - Test success and error paths
  - Verify correct requests

✓ Debugging Techniques
  - Analyze error messages
  - Use console.log
  - Mock HTTP requests properly
  - Use async patterns (fakeAsync, done)
```

**Key Takeaways:**
1. Tests document expected behavior
2. Always mock external dependencies (HTTP, services)
3. Test both success and failure paths
4. Error messages are your friend - read them carefully
5. Async tests need proper handling (fakeAsync or done callback)

**Part 2: Testing Excellence Goals** (3 min)

**Communicate Your Team's Testing Standards:**
```
Our Testing Goals
=================
✓ Aim for >80% coverage on shared components
✓ All new features must include tests
✓ Tests should complete in <100ms each
✓ Full test suite runs in <5 minutes
✓ Code reviews include test quality review
```

**Part 3: Resources & Documentation** (4 min)

**Point to Key Documents:**
- [TEAM-ONBOARDING.md](./TEAM-ONBOARDING.md) - Guided learning path
- [TESTING-PATTERNS.md](./TESTING-PATTERNS.md) - Pattern reference
- [TESTING-BEST-PRACTICES.md](./TESTING-BEST-PRACTICES.md) - Quality guidelines
- [MOCK-SERVICES-REFERENCE.md](./MOCK-SERVICES-REFERENCE.md) - Available mocks
- [DEBUGGING-TESTS.md](./DEBUGGING-TESTS.md) - Troubleshooting guide

**Useful Commands to Memorize:**
```bash
npm test                    # Run all tests
npm run test:watch         # Run with file watching
npm test -- component.spec.ts  # Run single test file
npm run test:ci             # CI mode with coverage
```

**Where to Get Help:**
- Slack channel: `#testing-help` (if applicable)
- Peer review code reviews
- Ask testing champions
- Read the documentation

**Part 4: Next Steps for Developers** (2 min)

**What to Do After Workshop:**
1. Complete [TEAM-ONBOARDING.md](./TEAM-ONBOARDING.md) hands-on exercises
2. Write tests for your next feature
3. Ask for feedback during code review
4. Study 2-3 example tests from the codebase
5. Contribute to testing when you can

**What Your Tech Lead Will Do:**
- Review test quality in code reviews
- Help with complex testing scenarios
- Assign testing improvements as needed
- Share learnings with the team

**Part 5: Final Q&A & Feedback** (1 min)

**Open for Questions:**
- "What questions do you have?"
- "What was most confusing?"
- "What do you want to learn more about?"

**Feedback Collection:**
If you have a feedback form:
- What was helpful?
- What was confusing?
- What should we cover next?
- Would you attend a follow-up session?

---

## Post-Workshop Activities

### For Team Members

**Week 1 After Workshop:**
- [ ] Complete TEAM-ONBOARDING.md learning path (2.5 hours)
- [ ] Write tests for your current feature
- [ ] Ask for testing feedback in code review
- [ ] Study 2 example test files from the codebase

**Week 2-4:**
- [ ] Share learnings with team members
- [ ] Help review tests in code reviews
- [ ] Ask questions in #testing-help channel
- [ ] Identify patterns in your own testing

### For Team Lead

**Week 1 After Workshop:**
- [ ] Gather feedback from participants
- [ ] Identify anyone needing extra help
- [ ] Schedule office hours if needed

**Ongoing:**
- [ ] Review test quality in code reviews
- [ ] Share testing improvements
- [ ] Mentor new team members
- [ ] Keep testing documentation updated

---

## Facilitator Notes

### How to Run This Workshop Successfully

**Before the Workshop:**
1. Set up a test environment on your machine (or use a VM for demo)
2. Prepare the live demos - test them beforehand!
3. Make sure all developers have dependencies installed (`npm install`)
4. Prepare exercise code snippets in advance
5. Set up a shared folder/gist with exercise code

**Equipment Needed:**
- Projector/screen for presenter demo
- Developer laptop with IDE (VS Code)
- WiFi for participants
- Code editor on participant laptops

**During the Workshop:**
- Start on time, set expectations for participation
- Encourage questions - pause for Q&A regularly
- Go slowly on live coding - people are taking notes
- When debugging: narrate your thought process
- Have backup explanations ready for concepts people struggle with

**Common Questions & Answers:**

**Q: "Do I need to test private methods?"**
A: Generally no. If you need to test private logic, consider extracting it into a public method or separate service.

**Q: "What's the difference between a unit test and an integration test?"**
A: Unit tests test isolated units (components, services). Integration tests test how units work together.

**Q: "How do I know if my test coverage is enough?"**
A: Run `npm run test:ci` to see coverage. Aim for >80%. Focus on critical paths and error handling.

**Q: "Can tests be slow?"**
A: Tests should complete in <100ms. If slower, look for excessive setup, real network calls, or unnecessary async.

**Q: "Should I test the Angular framework?"**
A: No - assume Angular works. Test your own code (components, services, directives).

### Troubleshooting Demo Issues

**If live coding demo breaks:**
1. Don't panic - this is normal!
2. Explain what went wrong (great learning moment)
3. Use this as debugging lesson
4. Have backup demo ready to continue

**If tests fail during demo:**
1. This is actually good - use it to debug live
2. Walk through error message
3. Ask audience for ideas
4. Fix it together

**If internet is slow:**
1. Pre-load documentation pages
2. Have PDF backups of docs
3. Run tests locally (not online)

### Timing Tips

- Budget 1-2 extra minutes per section for Q&A
- If running late, skip advanced content - focus on fundamentals
- Always leave 5 min at end for final Q&A
- Have optional "deep dive" content ready for extra time

---

## Workshop Materials Checklist

Before running the workshop, ensure you have:

- [ ] This agenda document (printed or displayed)
- [ ] Live demo code prepared and tested
- [ ] Exercise code snippets ready (copy/paste ready)
- [ ] Example test files to show during discussions
- [ ] Documentation links working and accessible
- [ ] Participant setup verified (npm install complete)
- [ ] Projector/display working
- [ ] Backup internet connection ready
- [ ] Feedback form (optional but recommended)

---

## Follow-Up Resources

### For Participants to Study After Workshop

**Level:** Beginner
- TEAM-ONBOARDING.md (2.5 hours)
- TESTING-PATTERNS.md (read slowly, focus on component section)

**Level:** Intermediate
- TESTING-BEST-PRACTICES.md
- TESTING-PATTERNS.md (full read)
- Example test files in codebase

**Level:** Advanced
- ADVANCED-TESTING-PATTERNS.md
- MOCK-SERVICES-REFERENCE.md
- DEBUGGING-TESTS.md

---

**Last Updated:** March 2026
**Format:** 2-hour interactive workshop
**Estimated Preparation Time:** 2-3 hours for facilitator
**Recommended Frequency:** Quarterly for new team members, annually for full team refresher
