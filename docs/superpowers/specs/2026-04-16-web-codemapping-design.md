# Web Module CodeMapping — Design Spec

**Goal:** Create token-optimized context documentation for the Angular frontend module (`modules/web/`) using `.claude/rules/` with glob-scoped rule files and a lean CLAUDE.md.

**Approach:** Rules-based progressive disclosure. CLAUDE.md stays ~75 lines (commands, directories, tech stack). Six rule files in `.claude/rules/` auto-load only when Claude touches matching file paths. No `@agent_docs/` imports.

**Why rules over agent_docs:** `@` imports in CLAUDE.md expand at session start — always loaded. Rules fire only on matching globs. Typical task loads 1-2 rules (~135-195 lines) instead of all ~375 lines every session.

---

## 1. `modules/web/CLAUDE.md` (~75 lines)

Rewrite the existing 40-line file. Keep existing build commands, CE/EE, and testing sections. Add:

- **Key Directories** — expand to include `shared/validators/`, `shared/utils/`, `shared/entity/`, `shared/components/`, `shared/pipes/`, `shared/directives/`, `core/services/`, `dynamic/enterprise/`, `dynamic/community/`, `test/`
- **Feature Modules** — list lazy-loaded features: project, cluster, wizard, external-cluster-wizard, kubeone-wizard, member, serviceaccount, sshkey, settings, admin-settings
- **Path Aliases** — `@app/*`, `@core/*`, `@shared/*`, `@dynamic/*`, `@test/*`, `@assets/*`, `@environments/*`

No `@` imports. No detailed conventions.

---

## 2. Rule Files (`.claude/rules/`)

### `web-coding-conventions.md`

**Glob:** `modules/web/src/**/*.{ts,html,scss}`
**~60 lines. Fires on any web module source file.**

Content:
- Component file naming: `component.ts`, `template.html`, `style.scss`, `theme.scss` (no `.component.ts` suffix)
- Selector prefix: `km-` always
- `ChangeDetectionStrategy.OnPush` on all components
- `standalone: false` — use NgModule system
- New components must be declared in parent NgModule (SharedModule for shared, feature module for feature)
- Path aliases required: `@core/*`, `@shared/*`, `@app/*`, `@test/*`
- Before creating new validators, regex, utilities, or helpers — check `shared/` first
- SCSS: `@use 'variables'`, `@use 'mixins'`, alphabetical property order
- HTML: use `km-` shared components, Material via `mat-` prefix
- License headers on new files: `npm run fix:license`
- No magic numbers, no `console.log` — ESLint enforced

### `web-shared-utilities.md`

**Glob:** `modules/web/src/app/shared/**/*`
**~70 lines. Fires when touching shared code.**

Content:
- **Validators** — `KmValidators` facade in `shared/validators/validators.ts`. Key exports: `largerThan()`, `requiredIf()`, `unique()`, `chipPattern()`, `cronExpression()`, `yaml()`
- **Regex patterns** — `shared/validators/others.ts`. Key exports: `KUBERNETES_RESOURCE_NAME_PATTERN`, `KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR`, `IPV4_CIDR_PATTERN`, `IPV6_CIDR_PATTERN`, `DNS_NAME_PATTERN`. Convention: `_PATTERN` for string, `_PATTERN_VALIDATOR` for Angular ValidatorFn
- **Utils** — `shared/utils/common.ts`: `objectDiff()`, `isObjectEmpty()`, `compare()`, `getPercentage()`, `verifyYAML()`, `verifyJSON()`. `shared/utils/member.ts`: `MemberUtils`, permission/group enums. Also: `form.ts`, `cluster.ts`, `node.ts`, `health-status.ts`
- **Entity models** — `shared/entity/`. Namespace pattern for enum utilities: `HealthState.isUp()`, `HealthState.isDown()`. Domain types: `Cluster`, `Project`, `Member`, `NodeDeployment`
- **Shared components** — `shared/components/` with `km-` prefix. Key: `km-confirmation-dialog`, `km-label-form`, `km-combobox`, `km-property`, `km-editor`
- **Pipes and directives** — `shared/pipes/`, `shared/directives/`

### `web-service-patterns.md`

**Glob:** `modules/web/src/app/core/services/**/*`
**~50 lines. Fires when working on services.**

Content:
- `@Injectable({ providedIn: 'root' })` for all singleton services
- State via `BehaviorSubject` — expose as `Observable` via getter, never expose subject directly
- Subscription cleanup: `takeUntil(this._unsubscribe)` with `Subject` in `ngOnDestroy`
- HTTP caching: `Map<string, Observable>` keyed by ID, `shareReplay({refCount: true, bufferSize: 1})`
- Refresh pattern: `timer(0, refreshInterval)` merged with manual trigger `Subject`
- Error notification: use `NotificationService` — queue-based, deduplicates, Material SnackBar
- No nested subscriptions — use `switchMap()`, `mergeMap()`
- Provider services in `core/services/provider/` — one per cloud provider

### `web-form-dialog-patterns.md`

**Glob:** `modules/web/src/app/**/*component*`, `modules/web/src/app/**/*dialog*`
**~45 lines. Fires on component and dialog files.**

Content:
- Reactive forms only: `FormBuilder.group()`, `FormArray` for dynamic fields
- Custom form controls: implement `ControlValueAccessor` interface
- Async validators: implement `AsyncValidator` interface
- Use `KmValidators` facade — never create inline validators
- Dialogs: `MatDialog.open(ComponentClass, {data: config})`, receive via `@Inject(MAT_DIALOG_DATA)`, close via `MatDialogRef.close(result)`
- Config interfaces: typed `*DialogConfig` interface for each dialog
- Form value subscriptions: use `debounceTime()` consistently
- `FormControl.updateValueAndValidity()` after dynamic validator changes

### `web-edition-handling.md`

**Glob:** `modules/web/src/app/dynamic/**/*`
**~35 lines. Fires when touching CE/EE dynamic code.**

Content:
- Module registry: `module-registry.ts` (EE) / `module-registry.ce.ts` (CE) — swapped via `fileReplacements` in `angular.json`
- `DynamicModule` namespace: lazy `import()` promises for edition-specific modules
- `DynamicModule.isEnterpriseEdition` for runtime checks
- EE in `dynamic/enterprise/`, CE stubs in `dynamic/community/`
- TypeScript configs: `tsconfig.ee.json` excludes `community/`, `tsconfig.ce.json` excludes `enterprise/`
- Default build is EE. `KUBERMATIC_EDITION=ce` for CE
- Never import from `enterprise/` or `community/` directly — go through `DynamicModule`

### `web-testing-patterns.md`

**Glob:** `modules/web/src/**/*.spec.ts`
**~40 lines. Fires on test files.**

Content:
- Jest with `jest-preset-angular`
- Co-located: `component.spec.ts` next to `component.ts`
- Mock services: `src/test/services/` — naming: `[Service]MockService`
- Test data factories: `src/test/data/` — naming: `fake[Entity]()`
- Import mocks via `@test/*` alias
- TestBed: `TestBed.configureTestingModule({imports: [...], teardown: {destroyAfterEach: false}})`
- Provide mocks: `{provide: ServiceClass, useClass: MockServiceClass}`
- No `xit()` or `xdescribe()`
- Stub components: `src/test/components/`

---

## Token Budget

| File | Location | Lines | Loaded |
|------|----------|-------|--------|
| `CLAUDE.md` | `modules/web/` | ~75 | Every session |
| `web-coding-conventions.md` | `.claude/rules/` | ~60 | Any `.ts/.html/.scss` in web |
| `web-shared-utilities.md` | `.claude/rules/` | ~70 | Touching `shared/` |
| `web-service-patterns.md` | `.claude/rules/` | ~50 | Touching `core/services/` |
| `web-form-dialog-patterns.md` | `.claude/rules/` | ~45 | Component/dialog files |
| `web-edition-handling.md` | `.claude/rules/` | ~35 | Touching `dynamic/` |
| `web-testing-patterns.md` | `.claude/rules/` | ~40 | Touching `*.spec.ts` |

**Worst case (all rules):** ~375 lines
**Typical task (CLAUDE.md + 1-2 rules):** ~135-195 lines

---

## Self-Review

- **Placeholder scan:** None found. All sections have concrete content.
- **Internal consistency:** Globs don't conflict. `web-coding-conventions.md` is broadest (cross-cutting). Others are scoped tighter.
- **Scope check:** Single implementation plan — rewrite 1 file, create 6 rule files.
- **Ambiguity check:** Rule file globs are explicit. Content is directive ("always X", "never Y").
