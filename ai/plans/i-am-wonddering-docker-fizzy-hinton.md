# Fix: Number Inputs React to Mouse Scroll (Issue #7642)

## Context

All `input[type="number"]` fields in the dashboard respond to mouse wheel events, causing accidental value changes when users scroll past them (e.g. cluster creation wizard, Admin Settings). Fix: blur the input on wheel events so scroll is ignored when the input isn't intentionally focused.

Number inputs in this codebase are wrapped in a custom `km-number-stepper` component — there is exactly **one** `<input type="number">` in the app (`number-stepper/template.html`), so adding a directive there fixes the issue everywhere at once.

---

## Approach

Add a `kmNumberWheelBlur` directive that calls `.blur()` on wheel events. Follow the existing directive pattern (all input behaviors are directives, declared in `SharedModule`).

### 1. Create directive
**File**: `modules/web/src/app/shared/directives/number-wheel-blur.ts`

```typescript
import {Directive, ElementRef, HostListener} from '@angular/core';

@Directive({selector: 'input[type="number"][kmNumberWheelBlur]'})
export class NumberWheelBlurDirective {
  constructor(private readonly _el: ElementRef<HTMLInputElement>) {}

  @HostListener('wheel')
  onWheel(): void {
    this._el.nativeElement.blur();
  }
}
```

### 2. Register in SharedModule
**File**: `modules/web/src/app/shared/module.ts`

Add `NumberWheelBlurDirective` to the `directives` array (alongside `AutofocusDirective`, `ThrottleClickDirective`, etc.).

### 3. Apply in number-stepper template
**File**: `modules/web/src/app/shared/components/number-stepper/template.html`

Add `kmNumberWheelBlur` attribute to the `<input>` element (line ~21).

---

## Files to Modify

| File | Change |
|------|--------|
| `shared/directives/number-wheel-blur.ts` | New directive (create) |
| `shared/module.ts` | Import + add to `directives` array |
| `shared/components/number-stepper/template.html` | Add `kmNumberWheelBlur` to `<input>` |

## Existing Patterns to Reuse

- Directive structure: mirror `shared/directives/throttle-click.ts` (`@HostListener` pattern)
- SharedModule registration: mirror how `ThrottleClickDirective` is added in `module.ts`
- License header: `hack/boilerplate/ee/boilerplate.ts`

## Verification

1. Build/serve: `npm start` in `modules/web/`
2. Open cluster creation wizard → node count field
3. Hover over the number input and scroll — value should NOT change
4. Click the input then scroll — value should NOT change (focus is immediately lost on wheel)
5. Check Admin Settings quota fields — same behavior
