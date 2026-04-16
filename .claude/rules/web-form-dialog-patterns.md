---
globs: modules/web/src/app/**/*component*,modules/web/src/app/**/*dialog*
---

# Web Module — Form & Dialog Patterns

## Reactive Forms

Always use Reactive Forms. Never use template-driven forms.

- Build forms with `FormBuilder.group()` and `FormArray` for dynamic fields
- Typed form groups: `FormGroup<{ name: FormControl<string> }>`
- Call `FormControl.updateValueAndValidity()` after adding/removing dynamic validators

## Custom Form Controls

Implement `ControlValueAccessor` for reusable form inputs:

```ts
@Component({
  selector: 'km-custom-input',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CustomInputComponent),
    multi: true,
  }],
})
export class CustomInputComponent implements ControlValueAccessor {
  writeValue(value: any): void { ... }
  registerOnChange(fn: any): void { ... }
  registerOnTouched(fn: any): void { ... }
}
```

## Validators

- Use `KmValidators` facade from `@shared/validators/validators.ts` — never create inline validators
- Use pre-built regex from `@shared/validators/others.ts` — never define regex inline in components
- For async validation: implement `AsyncValidator` interface

## Dialog Pattern

Standard dialog flow:

1. Define a typed config interface:
```ts
export interface MyDialogConfig {
  title: string;
  entity: MyEntity;
}
```

2. Open dialog with typed data:
```ts
this._dialog.open(MyDialogComponent, {
  data: { title: 'Edit', entity: this.entity } as MyDialogConfig,
});
```

3. Receive data in dialog component:
```ts
constructor(
  public dialogRef: MatDialogRef<MyDialogComponent>,
  @Inject(MAT_DIALOG_DATA) public data: MyDialogConfig
) {}
```

4. Close with result:
```ts
this.dialogRef.close(result);
```

## Form Value Subscriptions

- Always use `debounceTime()` on form `valueChanges` subscriptions
- Always clean up with `takeUntil(this._unsubscribe)` pattern
- Use `filter()` to skip empty/invalid states before processing
