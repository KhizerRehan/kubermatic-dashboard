Focus on Test Cases that are valid and useful avoid Test cases as below

## Dont's

- Avoid which checks if a service is injected or not, as these are basic checks that do not provide meaningful insights into the functionality of the code. Instead, we should focus on writing test cases that validate the actual behavior and outcomes of the features we are testing. This will help us ensure that our tests are more relevant and valuable in identifying issues and improving the quality of our codebase.

```ts
describe('Service Integration', () => {
  it('should have ClusterService injected', () => {
    expect(clusterService).toBeDefined();
  });

  it('should have ClusterSpecService injected', () => {
    expect(clusterSpecService).toBeDefined();
  });

  it('should have DatacenterService injected', () => {
    expect(datacenterService).toBeDefined();
  });

  it('should have SettingsService injected', () => {
    expect(settingsService).toBeDefined();
  });

  it('should have ApplicationService injected', () => {
    expect(applicationService).toBeDefined();
  });
});
```

- Avoid test cases that check for the existence of form controls instead focus on testing the actual functionality and behavior of those controls we can focus if any control changes in case other parts of the codebase are affected by that change. This will help us ensure that our tests are more meaningful and provide valuable insights into the functionality of our application rather than just checking for the presence of certain elements.

```ts
describe('Feature Controls', () => {
  it('should have OPA integration control', () => {
    fixture.detectChanges();
    const opaControl = component.form.get('opaIntegration');
    expect(opaControl).toBeDefined();
  });

  it('should have Kyverno integration control', () => {
    fixture.detectChanges();
    const kyvernoControl = component.form.get('kyvernoIntegration');
    expect(kyvernoControl).toBeDefined();
  });

  it('should have Konnectivity control', () => {
    fixture.detectChanges();
    const konnectivityControl = component.form.get('konnectivity');
    expect(konnectivityControl).toBeDefined();
  });

  it('should have KubeLB control', () => {
    fixture.detectChanges();
    const kubelbControl = component.form.get('kubelb');
    expect(kubelbControl).toBeDefined();
  });
});
```

- Tests that validates against mock data instead of real data. While using mock data can be useful in certain scenarios, it is important to ensure that our tests are validating against real data whenever possible. This will help us catch issues in case when data is fetched from real api does it saves the data in variable and is that variable used in the codebase. This will help us ensure that our tests are more accurate and reflective of real-world scenarios, which can lead to better insights and improvements in our codebase.

```ts
describe('Application Settings Loading', () => {
  it('should load application settings on init', () => {
    fixture.detectChanges();
    expect(applicationService.getApplicationSettings).toHaveBeenCalled();
  });

  it('should store loaded application settings', done => {
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      expect((component as any)._applicationSettings).toEqual(mockApplicationSettings);
      done();
    });
  });
});
```

- Take modules/web/src/app/wizard/step/applications/component.spec.ts as Good exmaple of how to write test cases and follow the same pattern for other components as well. This file contains meaningful test cases that validate the functionality of the component in a clear and concise manner. By using this file as a reference to test behavior of the component rather than just checking for the presence of certain elements or services, we can ensure that our tests are more relevant and provide valuable insights into the functionality of our application. This will help us improve the quality of our codebase and catch potential issues more effectively.

But we can still avoid test cases like check method to be defined because at any POINT of time method name can be changed and that will break the test case without providing any meaningful insights into the functionality of the code. Instead, we should focus on writing test cases that validate the actual behavior and outcomes of the features we are testing. This will help us ensure that our tests are more relevant and valuable in identifying issues and improving the quality of our codebase.

```ts
it('should have onApplicationAdded method', () => {
  expect(component.onApplicationAdded).toBeDefined();
});

it('should have onApplicationUpdated method', () => {
  expect(component.onApplicationUpdated).toBeDefined();
});

it('should have onApplicationDeleted method', () => {
  expect(component.onApplicationDeleted).toBeDefined();
});
```

## Do's

- Check if any comonent implements ControlValueAccessor and if it does then we should have test cases to check if the implementation is correct and if the component is working as expected. This will help us ensure that our components are properly integrated with Angular forms and that they behave correctly when used in form contexts. By writing test cases for ControlValueAccessor implementations, we can catch potential issues early on and improve the overall quality of our codebase.

```ts
describe('ControlValueAccessor Implementation', () => {
  beforeEach(() => {
    fixture.detectChanges();
  });

  it('should implement writeValue method', () => {
    expect(component.writeValue).toBeDefined();
    expect(typeof component.writeValue).toBe('function');
  });

  it('should implement registerOnChange method', () => {
    expect(component.registerOnChange).toBeDefined();
    expect(typeof component.registerOnChange).toBe('function');
  });

  it('should implement registerOnTouched method', () => {
    expect(component.registerOnTouched).toBeDefined();
    expect(typeof component.registerOnTouched).toBe('function');
  });

  it('should write value to form via writeValue', () => {
    const value = {name: 'test-cluster', version: 'v1.26.0'};
    component.writeValue(value);
    expect(component.form.value.name).toEqual('test-cluster');
  });
});
```


## Anti-patterns removed:

- "should have X injected" service existence checks
- "should have X control" form control existence checks
- "should have X method" method existence checks



