# Angular 21 → 22 Upgrade (modules/web)

## Context

`modules/web` runs Angular `21.2.17` (cdk/material `21.2.14`, `@angular/build` `21.2.18`, `@angular/cli` `21.2.15`, all exact-pinned). Angular 22 is out — `@angular/core`/`material` `22.1.0`, `@angular/cli`/`build` `22.1.1`.

Angular 22 is a *behavioral* major, not just a version bump. Three defaults flip in ways that change how this app runs: change detection becomes OnPush, HttpClient switches to Fetch, and the router starts inheriting params from parent routes. Two of those have automatic migrations; one does not. On top of that, Node 20 support is dropped and the repo's pinned Node is below the new floor.

Goal: land on Angular 22 with **zero behavior change**, and file the opt-in modernizations (OnPush, strictTemplates, flex-layout removal) as separate follow-ups.

Sources: [Angular 22.0.0 release notes](https://github.com/angular/angular/releases/tag/v22.0.0) · [angular-cli CHANGELOG](https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md) · [core migrations.json](https://raw.githubusercontent.com/angular/angular/main/packages/core/schematics/migrations.json) · [Ninja Squad: What's new in Angular 22](https://blog.ninja-squad.com/2026/06/03/what-is-new-angular-22.0)

---

## Verified constraints

| Constraint | Required by v22 | Repo today | Action |
|---|---|---|---|
| Node | `^22.22.3 \|\| ^24.15.0 \|\| >=26` | `.nvmrc` `v22.20.0`; `engines.node ">=20.0.0"` | **Must bump** |
| TypeScript | `>=6.0 <6.1` | `6.0.3` | ✔ leave alone — TS 7 is out of range |
| rxjs | `^6.5.3 \|\| ^7.4.0` | `7.8.2` | ✔ |
| zone.js | `~0.15.0 \|\| ~0.16.0` | `0.16.2` | ✔ |

Third-party (verified via `npm view`):

| Package | Now | Target | Note |
|---|---|---|---|
| `@angular/material` / `cdk` | 21.2.14 | 22.1.0 | peer `^22 \|\| ^23` ✔ |
| `jest-preset-angular` | 16.2.0 | 17.0.0 | 16.x peer caps at `<22.0.0` — **hard block** |
| `@swimlane/ngx-charts` | ^23.1.0 | 25.0.0 | 23.x peer caps at `20.x`; v25 covers `22.x` → its `overrides` entry becomes unnecessary |
| `ngx-cookie-service` | 21.3.1 | 22.0.0 | peer `^22` — can only land *with* the bump |
| `ngx-monaco-editor-v2` | ^21.1.4 | 22.0.4 | peer `^22.0.4`; needs `monaco-editor ^0.55.1` (repo has 0.55.1) ✔ |
| `@angular/flex-layout` | 15.0.0-beta.42 | — | EOL/archived. Peers open-ended (`>=15.0.2`) so npm won't warn. See Risk R3 |

**Not a blocker (checked):** Material 22.1.0's `_index.scss` still has `@forward './core/m2' as m2-*;`, so the 24 `mat.m2-*` calls in `src/assets/themes/{light,dark}.scss` and `src/assets/css/theme/_main.scss` keep compiling. Those files ship to customers via `dist/assets/themes/` → `hack/extract-themes.sh`, so this mattered.

---

## Step 0 — Pre-flight gates

Run before writing code. Each can reshape the plan.

**0.1 CI Node patch level.** `node-22` in an image tag is a minor-line marker; v22 needs `>= 22.22.3`.
```bash
docker run --rm quay.io/kubermatic/chrome-headless:v1.9.2 node -v
docker run --rm quay.io/kubermatic/build:go-1.26-node-22-kind-0.32-1 node -v
```
`chrome-headless:v1.9.2` runs 3 of the 4 npm jobs in `.prow/frontend.yaml` (`pre-dashboard-web-unit`, `-integration-tests`, `-ce`); only `pre-dashboard-web-check` uses the `build:` image. If either is below 22.22.3 → file an issue against `kubermatic/infra` for rebuilt images. **No in-repo workaround.**

**0.2 flex-layout spike.** Scratch branch, install Angular 22 + flex-layout, load cluster details / wizard / node-data. Confirm layouts hold. 2617 `fx*` usages behind a single import at `src/app/shared/module.ts:19` — if it breaks there is no upgrade path (project archived).

**0.3 `jest-preset-angular@17` entry point.** Confirm `jest-preset-angular/setup-env/zone` still exists — `src/test.base.ts:20` imports it. `jest.config.cjs` has no `globals: {ngJest}` block, so v17's "ngJest via globals removed" is a no-op here.

---

## Step 1 — PR #1 "Prep for Angular 22" (valid on Angular 21)

Everything here works on 21 and narrows PR #2 to a framework-only diff.

**1a. Node floor** — 4 locations:
- `.nvmrc`: `v22.20.0` → `v22.22.3`+
- `modules/web/package.json` `engines.node`: `">=20.0.0"` → `"^22.22.3 || ^24.15.0 || >=26.0.0"` (mirror Angular's range; `npm: ">=10.0.0"` stays — node 22.22.x ships npm 10.9.x)
- `modules/web/hack/run-in-docker.sh:19`: `IMAGE_NAME="node:20"` → node 22.22.3+
- `.prow/frontend.yaml` + `.prow/common.yaml`: image tags from Step 0.1

**1b. Third-party bumps that remove `ng update` peer conflicts:**
- `@swimlane/ngx-charts` `^23.1.0` → `25.0.0`, then **delete its `overrides` block** from `package.json` — that block exists only to paper over the stale peer range. Only import site is `src/app/shared/module.ts`; smoke-test cluster/project metrics charts.
- `jest-preset-angular` `16.2.0` → `17.0.0`.

Leave the `gts` / `monaco-editor` / `license-compliance` / `@aws-sdk/xml-builder` overrides alone — unrelated security pins. Keep the `@angular/flex-layout` override.

**1c. Two forward-compatible source fixes** (no-ops on 21, required on 22):

- `src/app/shared/components/number-stepper/component.ts:74-75` — Angular 22 forms reject string `min`/`max`. Inputs are declared `number` but **72 static attribute bindings across 27 templates pass strings** (`min="0"`, `max="50"` — 63 `min=`, 9 `max=`). Those flow to `[min]`/`[max]` on the inner `<input type="number">` in `number-stepper/template.html:30-31`, activating `MinValidator`/`MaxValidator`. Result on v22: **min/max validation silently stops firing** on quotas, metering, node-data, and every provider wizard. `strictTemplates: false` will not catch it.
  ```ts
  import {numberAttribute} from '@angular/core';
  @Input({transform: numberAttribute}) min: number;
  @Input({transform: numberAttribute}) max: number;
  ```
  Fixes all 72 call sites with no template churn. Add a spec asserting `min="0"` yields `min === 0`.

- `src/app/routing.ts:146` — pin the router default explicitly:
  ```ts
  RouterModule.forRoot(createRouting(), {
    preloadingStrategy: SelectedPreloadingStrategy,
    paramsInheritanceStrategy: 'emptyOnly',
  })
  ```
  **Decision: pin `'emptyOnly'`, do not adopt `'always'` here.** `ParamsService` (`src/app/core/services/params.ts:41-52`) walks `while (active.firstChild)` to the deepest route and reads only that route's `paramMap`. Under `emptyOnly` a deep child contributes an empty map so `get('projectID')` returns `null`; under `always` it would start returning the inherited value. 41 param-read sites across cluster details, machine-deployment details, wizards, and the terminal. No automatic migration exists. Adopt `'always'` later as its own tested change.

---

## Step 2 — PR #2 "Angular 22"

**2a. Run the update.**
```bash
cd modules/web
npx ng update @angular/core@22.1.0 @angular/cli@22.1.1 @angular/cdk@22.1.0 @angular/material@22.1.0 --force
npm install --save-exact ngx-cookie-service@22.0.0 ngx-monaco-editor-v2@22.0.4
rm -rf node_modules package-lock.json && npm install
```
`--force` is still needed but now only because `ngx-cookie-service@21.3.1` and `ngx-monaco-editor-v2@21.1.4` peer on `^21` — their v22 releases peer on `^22`, so they can't be pre-bumped in PR #1. Narrow, understood exemption.

**2b. Restore exact pinning.** `ng update` rewrites `@angular/*` to carets. Repo convention is bare exact versions. Strip carets for: `animations, cdk, common, compiler, core, forms, localize, material, platform-browser, platform-browser-dynamic, router, build, cli, compiler-cli`. Re-run `npm install`. **Do not touch `typescript`.**

**2c. Migration decisions** — all 8 core schematics are `v22.0.0`:

| Migration | Applies | Decision |
|---|---|---|
| `change-detection-eager` | **Yes, ~334 files** | **Accept as-is.** 381 `@Component` − 47 already OnPush. Adds `changeDetection: ChangeDetectionStrategy.Eager` + import. Purely mechanical, zero semantic change — exactly the point. Do **not** hand-pick OnPush candidates here: 388 `standalone: false` components with heavy mutable-object binding. Follow-up issue. |
| `safe-optional-chaining` | Yes, ~1100 sites | **Skip.** ⚠️ *open decision* — see below. |
| `strict-templates-default` | Yes | **Accept, then consolidate.** No `angularCompilerOptions` block exists in any tsconfig, so it injects `{"strictTemplates": false}`. Collapse to a single block in `modules/web/tsconfig.json` (the base both `src/tsconfig.ee.json` and `.ce.json` extend); delete duplicates. Do not enable it — base config is `strict: false` + `noImplicitAny: false`. Add a TODO + issue link. |
| `http-xhr-backend` | No-op | Zero `HttpXhrBackend`/`HttpBackend` refs. But the *default* still flips to fetch — see R4. |
| `can-match-snapshot-required` | No-op | Zero `canMatch` usages. |
| `incremental-hydration` | No-op | No SSR / `@angular/ssr` / `platform-server` / `provideClientHydration`. |
| `model-output` | No-op | Zero `model()` signal inputs. |
| `strict-safe-navigation-narrow` | Inert | Only fires under `strictTemplates`, which stays false. |

> ⚠️ **Open decision — `safe-optional-chaining`.** Angular 22 makes `?.` return `undefined` instead of `null` (TS semantics). The migration wraps ~1100 sites across 378 templates in `$safeNavigationMigration()` to preserve the old value. **Recommendation: skip it.** Those results land in `@if` guards, interpolations, and `[disabled]`/`[ngClass]` — all treat `null` and `undefined` identically. Accepting adds ~1100 permanent wrapper calls, fights `npm run fix:html`, and leaves scaffolding nobody removes. Targeted audit instead:
> ```bash
> grep -rnE '\?\.[^ ]*\s*[!=]==\s*null' --include="*.html" src
> ```
> Expect single-digit hits. Fix by hand.

**2d. Manual, non-migrated changes.**
- Verify `ng update` didn't touch `paramsInheritanceStrategy` (set in PR #1).
- Audit the 27 `Validators.min(...)` / `Validators.max(...)` `.ts` call sites for string args — reading them, all pass numbers. `metering/schedule-config/add-dialog/component.ts:137` sets the control's *initial value* to `'1'` while `Validators.min(1)` is numeric; that's fine (value, not bound).
- Data-prefixed attribute bindings: **zero** `[data-*]` / `(data-*)` in 378 templates. No-op.
- Duplicate `@Input`/`@Output` name: v22 throws at compile time, so the build is the audit. 49 `@Output()` total.
- `in` operator in template expressions: zero hits.
- Multiple matching directive selectors: now a compile error. **Both EE and CE builds must run** — `fileReplacements` swaps `module-registry.ts`, so a CE-only collision is invisible in an EE build.
- `ChangeDetectionStrategy.Default` → `Eager` rename: zero source usages of `.Default`.

**2e. Reformat.** The ~334-file diff won't match repo style:
```bash
npm run fix:ts && npm run format:prettier && npm run fix:html
```
Keep as a **separate commit** so reviewers can diff the raw migration output alone.

---

## Step 3 — PR #3 "Dependency cleanup" (after #2 is green)

Deliberately last, so a bisect on any v22 regression isn't polluted.

- `rxjs-compat@6.6.7` — **not** dead weight. Imported at `src/app/cluster/list/external-cluster/component.spec.ts:39` and `src/test/services/cluster-mock.ts:31` (`import {async} from 'rxjs-compat/scheduler/async'`). Swap to `import {asyncScheduler} from 'rxjs'`, then drop the package.
- `browserlist@1.0.2` — typo of `browserslist`, zero references. Drop.
- `react@19` / `react-dom@18` / `@types/react*` — zero source imports; `swagger-ui-dist` ships React internally (`src/app/pages/api-docs/component.ts:19` imports the prebuilt bundle). Mismatched major pair is further evidence they're vestigial. Verify `/api-docs` renders after removal.
- `btoa`, `stream` devDeps — zero references.
- `HttpClientModule` (24 specs) / `HttpClientTestingModule` (4 specs) → `provideHttpClient()` / `provideHttpClientTesting()`. App code already migrated at `src/app/core/module.ts:172`.
- 15 `core-js/es/*` imports in `src/polyfills.ts` — dead weight against a `last 2 versions` browserslist. Own PR + e2e run; touches the boot path.

---

## Verification

I don't build/lint/test per repo convention. Run after **each** PR:

```bash
cd modules/web
node -v                                   # must be >= 22.22.3
rm -rf node_modules dist dist-themes && npm ci
npm run check                             # gts lint + stylelint + license
npm run test:ci
KUBERMATIC_EDITION=ee npm run build
KUBERMATIC_EDITION=ce npm run build
npm run build:themes                      # exercises hack/extract-themes.sh
npm run e2e:mock
```

**Flat-dist assertion** — nothing automated covers this:
```bash
ls -1 modules/web/dist/index.html         # MUST be at dist/ root
ls -1d modules/web/dist/browser 2>/dev/null && echo "REGRESSION: nested output"
ls -1 modules/web/dist/assets/themes/*.scss
ls -1 modules/web/dist-themes/*.scss
```
`outputPath: {"base":"dist","browser":""}` in `angular.json` is load-bearing for `modules/web/cmd/dashboard/main.go:110` (`http.Dir("./dist")`), `main.go:118` (`ServeFile "./dist/index.html"`), and root `Dockerfile` (`COPY ./modules/web/dist /dist`). CLI 22 documents no change here, but a regression surfaces only in a deployed container.

**Manual smoke** (not covered by mock e2e):
- Light + dark theme, plus a custom theme built from `dist-themes/`
- Monaco: cluster constraints, constraint templates, alertmanager config, rule groups, gatekeeper config
- xterm web terminal (`src/app/shared/components/terminal/`) — reads route params, doubly exposed to R5
- ngx-charts 25 in cluster/project metrics
- Swagger UI at `/api-docs`
- **number-stepper boundary check** — project quota dialog, type `-1` into CPU, confirm the min error still appears. Direct check for the Step 1c fix.

---

## Risk register

| ID | Risk | Detection | Mitigation |
|---|---|---|---|
| **R1** | CI images ship Node < 22.22.3 → every npm job dies at `ng` invocation | Step 0.1 | Blocked on `kubermatic/infra` rebuild. Don't merge `.prow` bumps until new tags exist. |
| **R2** | `@angular/flex-layout` EOL breaks on v22. 2617 `fx*` usages, open peers so **npm gives no warning** | Visual only. e2e catches gross breakage; subtle `fxLayoutGap`/`fxFlex` drift it won't | Step 0.2 spike. If broken there is no rollback — contingency is a 2617-site `fx*` → CSS flex/grid migration. |
| **R3** | HttpClient defaults to fetch. No `reportProgress`/`HttpEventType`/`observe:'events'` usages and uploads go through `@aws-sdk/client-s3`, so progress isn't the concern — error-response shape, `withCredentials`, and abort semantics are. `AuthInterceptor` + other `HTTP_INTERCEPTORS` in `src/app/core/module.ts` are the exposure | 401/403 redirect behavior, token refresh, error-toast text | One-line lever: `provideHttpClient(withXhr(), withInterceptorsFromDi())` at `src/app/core/module.ts:172` |
| **R4** | `change-detection-eager` misses a component → it silently becomes OnPush → stale UI, no error | Not caught by build or unit tests. Post-migration `ChangeDetectionStrategy` count should reach ~381 (334 Eager + 47 OnPush) | `grep -rL "changeDetection:" $(grep -rl "@Component" --include="*.ts" src)` lists stragglers |
| **R5** | Flat `dist/` regresses to `dist/browser/` | The `ls` assertions above | Re-pin `outputPath.browser: ""`. Breaks at runtime, not build time. |
| **R6** | Dev-server `PORT` env now outranks `angular.json`'s `port: 8000`, hanging `start-server-and-test` (polls `http-get://localhost:8000`) | e2e job times out | `unset PORT` in `modules/web/hack/e2e/run-tests.sh`, or pass `--port 8000`. Check whether a Prow `preset-*` label injects `PORT`. |
| **R7** | `jest-preset-angular` 17 breaks the 108 spec files (esbuild ≥0.28, dropped zoneless fallback) | `npm run test:ci` in PR #1 | Isolated in PR #1 — revert one dep without touching Angular. Main argument for the 3-PR split. |

---

## Sequencing

**Three PRs**, in order:

1. **Prep for Angular 22** — node floor (4 files), ngx-charts 25 + overrides prune, jest-preset-angular 17, `numberAttribute` on number-stepper (+ spec), explicit `paramsInheritanceStrategy`. All Angular-21-valid, independently revertable. Its job is to make PR #2 framework-only.
2. **Angular 22** — three commits: (a) raw `ng update` output, (b) manual tsconfig/pin/overrides fixes, (c) reformat. The ~334-file diff is unreviewable line-by-line; the commit split is what makes it reviewable at all.
3. **Dependency cleanup** — rxjs-compat, browserlist typo, react/react-dom, HttpClientModule in specs, core-js audit.

Against a single PR: >400 changed files with the framework bump buried inside, and `git bisect` landing on an undifferentiated blob. The Angular 21 upgrade (`1384b2d26`, 29 files) was one PR — that precedent doesn't scale to a 334-file mechanical migration.

**Also:** pause the `angular` dependabot group (`.github/dependabot.yml`) for the duration, or it will open competing `@angular/*` bumps and thrash `package-lock.json`.

---

## Open decisions

Recommendations are baked into the plan above; flip any of these before execution:

1. **PR split** — 3 PRs (planned) vs 2 vs 1
2. **`safe-optional-chaining`** — skip + targeted audit (planned) vs run and keep ~1100 wrappers
3. **flex-layout** — spike first (planned) vs assume-and-catch-in-e2e vs migrate off first
