<!-- DO NOT EDIT - AUTO-GENERATED CODEBASE ANALYSIS -->

# Coding Conventions

**Analysis Date:** 2026-04-09

**Scope:** `modules/web/` - Angular frontend codebase

## File and Component Naming

**Components:**
- File structure: `component.ts`, `template.html`, `style.scss` (no `component.html` or `.component.ts` suffix)
- Component selectors: `km-` prefix (e.g., `km-button`, `km-admin-settings`)
- Example: `src/app/shared/components/button/` contains `component.ts`, `template.html`, `style.scss`

**Services:**
- File: `service-name.ts` (e.g., `cluster.ts`, `user.ts`)
- Location: `src/app/core/services/` for singleton services
- Example: `src/app/core/services/cluster.ts`

**Modules:**
- File: `module.ts` (not `.module.ts`)
- Example: `src/app/shared/module.ts`, `src/app/module.ts`

**Test files:**
- Co-located with source: `component.spec.ts` (for components), `service.spec.ts` (for services)
- Pattern: `[filename].spec.ts`
- Example: `src/app/settings/admin/component.spec.ts`

**Directories:**
- Lowercase with hyphens: `shared/`, `core/`, `admin-settings/`
- Feature modules group related code: `cluster/`, `project/`, `serviceaccount/`

## TypeScript Conventions

**Naming:**
- Variables/functions: camelCase (e.g., `projectID`, `onSettingsChange`)
- Classes/Interfaces: PascalCase (e.g., `AdminSettingsComponent`, `Cluster`)
- Private class members: leading underscore + camelCase (e.g., `_settingsChange`, `_unsubscribe`)
- Constants: UPPER_SNAKE_CASE in component/service class level (e.g., `private readonly _debounceTime = 500`)

**Imports:**
- Path aliases (configured in `tsconfig.json`):
  - `@app/*` → `src/app/*`
  - `@core/*` → `src/app/core/*`
  - `@shared/*` → `src/app/shared/*`
  - `@dynamic/*` → `src/app/dynamic/*`
  - `@assets/*` → `src/assets/*`
  - `@environments/*` → `src/environments/*`
  - `@test/*` → `src/test/*` (for test files only)
- Order: Angular imports first, then third-party, then local imports
- Example:
  ```typescript
  import {Component, OnDestroy, OnInit} from '@angular/core';
  import {Observable, Subject} from 'rxjs';
  import {debounceTime, switchMap, take, takeUntil} from 'rxjs/operators';
  import {NotificationService} from '@core/services/notification';
  import {SettingsService} from '@core/services/settings';
  import {UserService} from '@core/services/user';
  import {Member} from '@shared/entity/member';
  ```

**Type Annotations:**
- Avoid using `any` (ESLint rule disabled but avoid in practice)
- Use `Observable<T>` for RxJS streams
- Generics for components: `ButtonComponent<T>`

## Angular Component Patterns

**Component Declaration:**
- Metadata decorator format:
  ```typescript
  @Component({
    selector: 'km-admin-settings',
    templateUrl: 'template.html',
    styleUrls: ['style.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
  })
  ```
- Always set `standalone: false` for non-standalone components
- Use `changeDetection: ChangeDetectionStrategy.OnPush` where possible for performance

**Lifecycle Hooks:**
- Implement `OnInit`, `OnDestroy` as needed
- Implement `OnDestroy` if using RxJS subscriptions
- Example lifecycle:
  ```typescript
  export class AdminSettingsComponent implements OnInit, OnDestroy {
    ngOnInit(): void {
      // Initialize subscriptions
    }

    ngOnDestroy(): void {
      // Complete subjects/unsubscribe
    }
  }
  ```

**Input/Output Decorators:**
- All inputs with `@Input` decorator
- All outputs as `@Output() name = new EventEmitter<T>()`
- Example:
  ```typescript
  @Input() icon: string;
  @Input() label: string;
  @Input() observable: Observable<T>;
  @Output() next = new EventEmitter<T>();
  @Output() error = new EventEmitter<void>();
  ```

**Dependency Injection:**
- Constructor parameters: private readonly (e.g., `private readonly _userService: UserService`)
- Services injected as dependencies
- Example:
  ```typescript
  constructor(
    private readonly _userService: UserService,
    private readonly _settingsService: SettingsService,
    private readonly _notificationService: NotificationService
  ) {}
  ```

## RxJS Patterns

**Unsubscribe Strategy:**
- Use `Subject` pattern with `takeUntil()` for automatic unsubscribe in `OnDestroy`
- Do NOT use manual subscription arrays
- Pattern:
  ```typescript
  private _unsubscribe = new Subject<void>();

  ngOnInit(): void {
    this._userService.currentUser
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(user => this.user = user);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
  ```

**Common Operators:**
- `takeUntil()` - unsubscribe on destroy
- `take(1)` - complete after first emission
- `debounceTime(ms)` - debounce rapid emissions
- `switchMap()` - switch to new observable (cancels previous)
- `shareReplay()` - cache and replay last value
- `catchError(() => of(...))` - provide fallback value on error
- Ban `first()` - use `take(1)` instead (enforced by ESLint)
- Avoid nested subscriptions - use `switchMap()` or `mergeMap()`
- ESLint error: `rxjs/no-nested-subscribe`

**Subject Usage:**
- `Subject<T>` for event emitters and state changes
- Example: `private _settingsChange = new Subject<void>()`
- Complete in `OnDestroy`: `this._settingsChange.complete()`

## Error Handling

**RxJS Error Handling:**
- Use `catchError()` operator to provide fallback values
- Pattern:
  ```typescript
  return this._http.get<MasterVersion[]>(url).pipe(
    catchError(() => of<MasterVersion[]>([]))
  );
  ```
- Log errors via `NotificationService` if user should be notified
- Do not throw in catchError unless rethrowing

**Notification Service:**
- Use `NotificationService` for user-facing messages
- Methods: `.success()`, `.error()`, etc.
- Example:
  ```typescript
  this._notificationService.success('Updated the admin settings');
  ```

## Code Formatting and Linting

**ESLint Configuration:**
- Config file: `.eslintrc.yml`
- Extends: Google TypeScript Style (gts)
- JavaScript files ignored: `ignorePatterns: ["**/*.js"]`

**ESLint Rules:**
- `@typescript-eslint/no-magic-numbers`: Error (ignored: -1, 0, 1 and array indexes)
- `no-console`: Error (remove console statements)
- `no-else-return`: Error
- `complexity`: Error, max 15 cyclomatic complexity
- `rxjs/no-ignored-observable`: Error - don't ignore observables
- `rxjs/no-nested-subscribe`: Error - use switchMap instead
- `rxjs/no-unbound-methods`: Error
- `rxjs/no-unsafe-takeuntil`: Error
- `rxjs/ban-operators`: Error - use `take(1)` instead of `first()`
- `eol-last`: Error - require newline at end of file

**Prettier Configuration:**
- Config file: `.prettierrc.cjs`
- Extends: gts default prettier config
- Key settings:
  - `semi: true` - require semicolons
  - `singleQuote: true` - use single quotes
  - `arrowParens: 'avoid'` - omit parens for single arrow function params: `x => x`
  - `bracketSpacing: false` - no spaces in object literals: `{x}` not `{ x }`
  - `printWidth: 120` - wrap lines at 120 characters
  - `endOfLine: "lf"` - unix line endings

**Auto-Fix Commands:**
- `npm run fix:ts` - ESLint fix with gts
- `npm run fix:scss` - stylelint fix
- `npm run fix:html` - HTML beautify
- `npm run fix:license` - Add license headers

## SCSS/CSS Conventions

**Stylelint Configuration:**
- Config file: `.stylelintrc.yml`
- Extends: `stylelint-config-standard-scss`

**SCSS Rules:**
- `order/properties-alphabetical-order: true` - properties alphabetically ordered
- `order/order` - specific ordering: variables, extends, includes, declarations, at-rules
- `selector-class-pattern: null` - allows any class name (including `km-` prefix)
- `alpha-value-notation: percentage` - use percentages for opacity

**File naming:**
- `style.scss` for component styles (co-located)
- Global styles in `src/styles/`
- Example: `src/app/shared/components/button/style.scss`

**Naming conventions:**
- Class names with hyphens: `.admin-settings`, `.km-button`
- Component-scoped styles encapsulated in component files

## License Boilerplate

**Requirement:**
- Every new file must have Apache 2.0 license header
- Template: `hack/boilerplate/` directory
- Years format: `Copyright YYYY The Kubermatic Kubernetes Platform contributors`
- Always use current year or range

**License Header:**
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
```

**SCSS License Header:**
```scss
// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// ...
```

**Adding License:**
- Run `npm run fix:license` to add headers to unlicensed files
- Command updates all files in `src/` with current year

## Quality Checks Workflow

**Check all:**
```bash
npm run check                # Run TS, SCSS, license checks
```

**Individual checks:**
```bash
npm run check:ts                        # TypeScript lint (gts lint)
npm run check:scss                      # SCSS lint
npm run check:dependency-licenses       # License audit
```

**Auto-fix all:**
```bash
npm run fix                   # Fix TS, SCSS, HTML, licenses
```

**Individual fixes:**
```bash
npm run fix:ts                # ESLint + Prettier fix
npm run fix:scss              # stylelint fix
npm run fix:html              # HTML beautify
npm run fix:license           # Add license headers
```

**Pre-commit Hook:**
- Husky configured in `.husky/`
- Runs `gts fix` on `src/**/*.ts`
- Runs `stylelint --fix` on `src/**/*.scss`
- Runs HTML beautify on `src/**/*.html`

## Module Structure

**Shared Module:**
- Location: `src/app/shared/module.ts`
- Exports: Common components, directives, pipes, validators used across features
- Example exports: `km-button`, `km-chip`, form validators

**Feature Modules:**
- Located in feature directories: `src/app/cluster/`, `src/app/project/`
- Provide feature-specific components and services
- Often lazy-loaded via routing

**Dynamic Module (CE/EE):**
- Location: `src/app/dynamic/`
- Community edition stubs: `src/app/dynamic/community/`
- Enterprise edition features: `src/app/dynamic/enterprise/`
- Module registry swapped at build time via `angular.json` fileReplacements

---

*Convention analysis: 2026-04-09*
