# Web Module CodeMapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `modules/web/CLAUDE.md` as a lean ~75-line index and create 6 glob-scoped rule files in `.claude/rules/` for token-optimized progressive disclosure of Angular frontend conventions.

**Architecture:** CLAUDE.md provides always-loaded essentials (commands, directories, tech stack). Six `.claude/rules/` files auto-load only when Claude touches matching file paths — coding conventions (broadest), shared utilities, service patterns, form/dialog patterns, CE/EE edition handling, and testing patterns.

**Tech Stack:** Markdown with `.claude/rules/` glob-scoped rule files (Claude Code built-in feature)

---

## File Structure

```
modules/web/
└── CLAUDE.md                                    # Rewrite: ~75 lines (lean index)

.claude/rules/
├── web-coding-conventions.md                    # Create: ~60 lines, glob: modules/web/src/**/*.{ts,html,scss}
├── web-shared-utilities.md                      # Create: ~70 lines, glob: modules/web/src/app/shared/**/*
├── web-service-patterns.md                      # Create: ~50 lines, glob: modules/web/src/app/core/services/**/*
├── web-form-dialog-patterns.md                  # Create: ~45 lines, glob: modules/web/src/app/**/*component*,modules/web/src/app/**/*dialog*
├── web-edition-handling.md                      # Create: ~35 lines, glob: modules/web/src/app/dynamic/**/*
└── web-testing-patterns.md                      # Create: ~40 lines, glob: modules/web/src/**/*.spec.ts
```

---

## Chunk 1: Create `.claude/rules/` Directory and Rule Files

### Task 1: Create `web-coding-conventions.md`

**Files:**
- Create: `.claude/rules/web-coding-conventions.md`

- [ ] **Step 1: Create the rules directory and coding conventions rule file**

```markdown
---
globs: modules/web/src/**/*.{ts,html,scss}
---

# Web Module — Coding Conventions

## File Naming

- Components: `component.ts`, `template.html`, `style.scss`, optional `theme.scss`
- No `.component.ts` suffix — use `component.ts`
- Modules: `module.ts`. Routing: `routing.ts`
- Co-located tests: `component.spec.ts` next to `component.ts`

## Component Rules

- Selector prefix: `km-` always (e.g., `km-label-form`, `km-confirmation-dialog`)
- Use `ChangeDetectionStrategy.OnPush` on all components
- Use `standalone: false` — this codebase uses NgModule system
- New components must be declared in parent NgModule:
  - Reusable components → `SharedModule` (`src/app/shared/shared.module.ts`)
  - Feature-specific → feature's `module.ts` (e.g., `src/app/cluster/module.ts`)

## Import Path Aliases

Always use path aliases, never relative paths crossing module boundaries:

- `@app/*` → `app/*`
- `@core/*` → `app/core/*` (services, guards, interceptors)
- `@shared/*` → `app/shared/*` (components, validators, utils, entity, pipes)
- `@dynamic/*` → `app/dynamic/*` (CE/EE modules)
- `@test/*` → `test/*` (mock services, test data)
- `@assets/*` → `assets/*`
- `@environments/*` → `environments/*`

## Before Creating New Code

Check `src/app/shared/` first:
- Validators → `shared/validators/` (KmValidators facade)
- Regex patterns → `shared/validators/others.ts`
- Utility functions → `shared/utils/`
- Domain helpers → `shared/entity/`
- UI components → `shared/components/`

## SCSS Conventions

- Import shared variables: `@use 'variables'`
- Import shared mixins: `@use 'mixins'`
- CSS property order: alphabetical (Stylelint enforced)
- CSS class prefix: `km-` for dashboard classes, `mat-` for Material

## HTML Template Conventions

- Use existing `km-` shared components from `shared/components/`
- Material components via `mat-` prefix
- Angular Flex Layout: `fxLayout`, `fxFlex` for responsive layouts

## Enforced by Tooling

- No magic numbers — ESLint error
- No `console.log` — ESLint error, caught by pre-commit hook
- License headers required on new files — run `npm run fix:license`
- Formatting: Prettier (single quotes, 120-char lines, no bracket spacing)
- Pre-commit hooks (Husky): `gts fix`, stylelint, HTML beautify
```

- [ ] **Step 2: Commit**

```bash
mkdir -p .claude/rules
git add .claude/rules/web-coding-conventions.md
git commit -m "docs(web): add coding conventions rule file for web module"
```

---

### Task 2: Create `web-shared-utilities.md`

**Files:**
- Create: `.claude/rules/web-shared-utilities.md`

- [ ] **Step 1: Create the shared utilities rule file**

```markdown
---
globs: modules/web/src/app/shared/**/*
---

# Web Module — Shared Utilities Reference

This directory contains reusable code. Check here before creating new validators, utils, or components.

## Validators (`shared/validators/`)

**Facade:** `KmValidators` in `shared/validators/validators.ts` — single entry point for all validators.

Key factory methods:
- `KmValidators.largerThan(min, inclusive?)` → numeric comparison
- `KmValidators.requiredIf(condition)` → conditional required
- `KmValidators.unique(existingValues)` → uniqueness check
- `KmValidators.chipPattern(pattern)` → chip input validation
- `KmValidators.cronExpression()` → cron syntax
- `KmValidators.yaml()` → YAML syntax
- `KmValidators.encryptionKey()` → encryption key format

Individual validator classes in separate files: `duplicate.validator.ts`, `unique.validator.ts`, `at-least-one.validator.ts`, `larger-than.validator.ts`, `cron.validator.ts`, `yaml.validator.ts`.

Async validators: `async.validators.ts`, `async-label-form.validator.ts`.

Label-specific: `label-form.validators.ts` — Kubernetes label key/value syntax rules.

## Regex Patterns (`shared/validators/others.ts`)

Pre-built patterns and Angular ValidatorFn exports. Convention: `_PATTERN` suffix for string, `_PATTERN_VALIDATOR` suffix for ValidatorFn.

Key exports:
- `KUBERNETES_RESOURCE_NAME_PATTERN` / `KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR`
- `IPV4_CIDR_PATTERN` / `IPV4_CIDR_PATTERN_VALIDATOR`
- `IPV6_CIDR_PATTERN` / `IPV6_CIDR_PATTERN_VALIDATOR`
- `DNS_NAME_PATTERN`
- `AKS_POOL_NAME_PATTERN_VALIDATOR`
- `GKE_POOL_NAME_PATTERN_VALIDATOR`
- `CBSL_SYNC_PERIOD_PATTERN_VALIDATOR`
- `CLUSTER_BACKUP_EXPIRY_PATTERN_VALIDATOR`

## Utils (`shared/utils/`)

- `common.ts` — `objectDiff()`, `isObjectEmpty()`, `compare()`, `getPercentage()`, `verifyYAML()`, `verifyJSON()`, `convertArrayToObject()`
- `member.ts` — `MemberUtils` class, `Permission` enum, `GroupConfig`, role/group operations
- `form.ts` — form-related helpers
- `cluster.ts` — cluster-specific helpers
- `node.ts` — node/machine deployment helpers
- `health-status.ts` — health state display logic

## Entity Models (`shared/entity/`)

Domain types and enums. Key pattern — TypeScript namespace on enums for utility functions:

```ts
// Example: HealthState enum + namespace in shared/entity/health.ts
HealthState.isUp(state)
HealthState.isDown(state)
HealthState.isProvisioning(state)
```

Key entities: `Cluster`, `Project`, `Member`, `NodeDeployment`, `MachineDeployment`, `SSHKey`, `ServiceAccount`, `Preset`, `Datacenter`.

## Shared Components (`shared/components/`)

56+ reusable components with `km-` prefix. Key components:
- `km-confirmation-dialog` — standard delete/confirm dialog
- `km-label-form` — Kubernetes label key-value editor (ControlValueAccessor)
- `km-combobox` — searchable dropdown
- `km-property` — key-value display row
- `km-editor` — code/YAML editor
- `km-chip-list` — tag/chip input

## Pipes and Directives

- `shared/pipes/` — custom Angular pipes
- `shared/directives/` — custom Angular directives
```

- [ ] **Step 2: Commit**

```bash
git add .claude/rules/web-shared-utilities.md
git commit -m "docs(web): add shared utilities rule file for web module"
```

---

### Task 3: Create `web-service-patterns.md`

**Files:**
- Create: `.claude/rules/web-service-patterns.md`

- [ ] **Step 1: Create the service patterns rule file**

```markdown
---
globs: modules/web/src/app/core/services/**/*
---

# Web Module — Service Patterns

All singleton services live in `src/app/core/services/`. Follow these patterns.

## Service Declaration

- Always use `@Injectable({ providedIn: 'root' })`
- One service per file
- Provider-specific services in `core/services/provider/` — one per cloud provider

## State Management

- Use `BehaviorSubject<T>` for state that has a current value
- Use `Subject<T>` for event streams (no initial value)
- Expose state as `Observable` via getter — never expose the Subject directly

```ts
// Correct
private readonly _currentUser$ = new BehaviorSubject<Member>(undefined);
get currentUser(): Observable<Member> {
  return this._currentUser$.pipe(filter(user => !!user));
}

// Wrong — never expose Subject
public currentUser$ = new BehaviorSubject<Member>(undefined);
```

## Subscription Cleanup

Use `takeUntil` pattern with a destroy Subject:

```ts
private _unsubscribe = new Subject<void>();

ngOnDestroy(): void {
  this._unsubscribe.next();
  this._unsubscribe.complete();
}

// In subscriptions:
this.someObservable$.pipe(takeUntil(this._unsubscribe)).subscribe(...);
```

Never use manual subscription arrays. Never leave subscriptions unmanaged.

## HTTP Caching Pattern

Cache observables keyed by resource ID using `Map` + `shareReplay`:

```ts
private _cache$ = new Map<string, Observable<Resource>>();

getResource(id: string): Observable<Resource> {
  if (!this._cache$.get(id)) {
    const resource$ = merge(this._onUpdate, this._refreshTimer$).pipe(
      switchMapTo(this._http.get<Resource>(`${this._restRoot}/${id}`)),
      shareReplay({refCount: true, bufferSize: 1})
    );
    this._cache$.set(id, resource$);
  }
  return this._cache$.get(id);
}
```

## Refresh Pattern

Combine timer with manual trigger:

```ts
private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * 10);
private _onUpdate = new Subject<void>();
```

## Error Handling

- Use `NotificationService` for user-facing errors — queue-based, deduplicates, dispatches via Material SnackBar
- Use `catchError()` operator with fallback Observables
- Do not use `try/catch` around Observable chains

## RxJS Operator Rules

- No nested subscriptions — use `switchMap()` or `mergeMap()`
- Use `take(1)` instead of `first()` (ESLint enforced)
- Use `debounceTime()` on form value subscriptions
- Use `distinctUntilChanged()` to prevent redundant emissions
```

- [ ] **Step 2: Commit**

```bash
git add .claude/rules/web-service-patterns.md
git commit -m "docs(web): add service patterns rule file for web module"
```

---

### Task 4: Create `web-form-dialog-patterns.md`

**Files:**
- Create: `.claude/rules/web-form-dialog-patterns.md`

- [ ] **Step 1: Create the form and dialog patterns rule file**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add .claude/rules/web-form-dialog-patterns.md
git commit -m "docs(web): add form and dialog patterns rule file for web module"
```

---

### Task 5: Create `web-edition-handling.md`

**Files:**
- Create: `.claude/rules/web-edition-handling.md`

- [ ] **Step 1: Create the edition handling rule file**

```markdown
---
globs: modules/web/src/app/dynamic/**/*
---

# Web Module — CE/EE Edition Handling

## Module Registry

- EE: `src/app/dynamic/module-registry.ts`
- CE: `src/app/dynamic/module-registry.ce.ts`
- Swapped at build time via `fileReplacements` in `angular.json`

Both export the `DynamicModule` namespace with lazy `import()` promises:

```ts
export namespace DynamicModule {
  export const Theming = import('./enterprise/theming/module').then(m => m.ThemingModule);
  export const Quotas = import('./enterprise/quotas/module').then(m => m.QuotasModule);
  export const isEnterpriseEdition = true; // false in CE
}
```

## Directory Structure

- `dynamic/enterprise/` — EE-only modules (excluded in CE builds)
- `dynamic/community/` — CE stubs (excluded in EE builds)

## TypeScript Configs

- `src/tsconfig.ee.json` — excludes `community/`
- `src/tsconfig.ce.json` — excludes `enterprise/`

## Build Defaults

- Default build is EE
- CE build: `KUBERMATIC_EDITION=ce npm start` or `KUBERMATIC_EDITION=ce npm run build`

## Rules

- Never import from `enterprise/` or `community/` directly — always go through `DynamicModule` namespace
- Use `DynamicModule.isEnterpriseEdition` for runtime edition checks
- New EE features: create module in `dynamic/enterprise/`, add lazy import to both `module-registry.ts` (real) and `module-registry.ce.ts` (stub or omit)
- CE stubs should provide minimal no-op implementations
```

- [ ] **Step 2: Commit**

```bash
git add .claude/rules/web-edition-handling.md
git commit -m "docs(web): add edition handling rule file for web module"
```

---

### Task 6: Create `web-testing-patterns.md`

**Files:**
- Create: `.claude/rules/web-testing-patterns.md`

- [ ] **Step 1: Create the testing patterns rule file**

```markdown
---
globs: modules/web/src/**/*.spec.ts
---

# Web Module — Testing Patterns

## Framework

Jest with `jest-preset-angular`. Run: `npm run test:ci` (with coverage).

## File Location

Co-located: `component.spec.ts` next to `component.ts`. Same directory, same name prefix.

## TestBed Setup

```ts
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [BrowserModule, NoopAnimationsModule, SharedModule],
    declarations: [ComponentUnderTest],
    providers: [
      {provide: ClusterService, useClass: ClusterMockService},
      {provide: ProjectService, useClass: ProjectMockService},
    ],
    teardown: {destroyAfterEach: false},
  }).compileComponents();
});
```

## Mock Services (`src/test/services/`)

Naming: `[Service]MockService` (e.g., `ClusterMockService`, `ProjectMockService`)

Provide via `useClass`:
```ts
{provide: RealService, useClass: MockService}
```

Import mocks using `@test/*` alias:
```ts
import {ClusterMockService} from '@test/services/cluster-mock';
```

## Test Data Factories (`src/test/data/`)

Naming: `fake[EntityName]()` (e.g., `fakeClusters()`, `fakeDigitaloceanCluster()`, `fakeProject()`)

```ts
import {fakeClusters} from '@test/data/cluster';
```

## Stub Components (`src/test/components/`)

No-op component stubs for dialog and complex component dependencies.

## Rules

- No `xit()` or `xdescribe()` — skipped tests rot
- No `fdescribe()` or `fit()` — focused tests break CI
- Use `NoopAnimationsModule` in test imports to avoid animation timing issues
- Use `asyncData()` / `asyncError()` helpers for Observable mocks
```

- [ ] **Step 2: Commit**

```bash
git add .claude/rules/web-testing-patterns.md
git commit -m "docs(web): add testing patterns rule file for web module"
```

---

## Chunk 2: Rewrite `modules/web/CLAUDE.md`

### Task 7: Rewrite CLAUDE.md as lean index (~75 lines)

**Files:**
- Modify: `modules/web/CLAUDE.md` (full rewrite)

- [ ] **Step 1: Replace CLAUDE.md with concise version**

```markdown
# KKP Dashboard — Angular Frontend

Angular 20.x SPA for the Kubermatic Kubernetes Platform. TypeScript, Angular Material, RxJS. Supports CE and EE editions via build-time module swapping.

## Build Commands

```bash
npm start                           # Dev server at localhost:8000 (EE default)
npm run start:local                 # Dev with local API proxy (127.0.0.1:8080)
KUBERMATIC_EDITION=ce npm start     # Dev CE edition
npm run build                       # Production build
npm run build:themes                # Build + extract theme bundles

npm run test:ci                     # Jest with coverage
npm run e2e:mock                    # Cypress E2E with mocked API
npm run e2e                         # Cypress E2E against dev server

npm run check                       # All checks (TS, SCSS, licenses)
npm run fix                         # Auto-fix all (TS, SCSS, HTML, licenses)
```

## Key Directories

- `src/app/core/services/` — Singleton API client services, auth guards
- `src/app/shared/components/` — 56+ reusable UI components (`km-` prefix)
- `src/app/shared/validators/` — KmValidators facade, regex patterns
- `src/app/shared/utils/` — Object, form, cluster, member utilities
- `src/app/shared/entity/` — Domain models and type definitions
- `src/app/shared/pipes/` — Custom Angular pipes
- `src/app/shared/directives/` — Custom Angular directives
- `src/app/dynamic/enterprise/` — EE-only modules (excluded in CE builds)
- `src/app/dynamic/community/` — CE stubs (excluded in EE builds)
- `src/test/` — Mock services (`@test/services/`), test data factories (`@test/data/`)

## Feature Modules

Lazy-loaded via Angular Router in `src/app/routing.ts`:

project, project-overview, cluster, cluster-template, wizard, external-cluster-wizard, kubeone-wizard, member, serviceaccount, sshkey, backup, settings (user), settings (admin), pages

EE-only (via DynamicModule): cluster-backups, kyverno-policies, quotas, theming

## Path Aliases

Defined in `tsconfig.json`. Always use these instead of deep relative paths:

- `@app/*` → `app/*`
- `@core/*` → `app/core/*`
- `@shared/*` → `app/shared/*`
- `@dynamic/*` → `app/dynamic/*`
- `@test/*` → `test/*`
- `@assets/*` → `assets/*`
- `@environments/*` → `environments/*`

## CE/EE Edition System

- **Module registry**: `src/app/dynamic/module-registry.ts` (EE) and `module-registry.ce.ts` (CE) swapped via `fileReplacements` in `angular.json`.
- **TypeScript configs**: `src/tsconfig.ee.json` excludes `community/`, `src/tsconfig.ce.json` excludes `enterprise/`.
- **Default**: EE. Set `KUBERMATIC_EDITION=ce` to build CE.

## Testing

- **Unit tests** (Jest): Co-located `component.spec.ts`. Mocks in `src/test/services/`. Import via `@test/*`.
- **E2E tests** (Cypress): `npm run e2e:mock` for mocked API, `npm run e2e` for live server.
```

- [ ] **Step 2: Verify line count is under 80**

```bash
wc -l modules/web/CLAUDE.md
```

Expected: ~75 lines

- [ ] **Step 3: Commit**

```bash
git add modules/web/CLAUDE.md
git commit -m "docs(web): rewrite CLAUDE.md as lean index with progressive disclosure via rules"
```

---

## Chunk 3: Verification

### Task 8: Verify all files and globs

- [ ] **Step 1: Verify all rule files exist**

```bash
ls -la .claude/rules/web-*.md
```

Expected: 6 files — `web-coding-conventions.md`, `web-shared-utilities.md`, `web-service-patterns.md`, `web-form-dialog-patterns.md`, `web-edition-handling.md`, `web-testing-patterns.md`

- [ ] **Step 2: Verify all globs are valid frontmatter**

```bash
head -3 .claude/rules/web-*.md
```

Expected: Each file starts with `---` / `globs:` / `---`

- [ ] **Step 3: Verify CLAUDE.md has no `@` imports**

```bash
grep -c '@agent_docs' modules/web/CLAUDE.md
```

Expected: 0

- [ ] **Step 4: Count total lines across all files**

```bash
wc -l modules/web/CLAUDE.md .claude/rules/web-*.md
```

Expected: CLAUDE.md ~75, rules total ~300, grand total ~375

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add modules/web/CLAUDE.md .claude/rules/web-*.md
git commit -m "docs(web): finalize web module codemapping"
```
