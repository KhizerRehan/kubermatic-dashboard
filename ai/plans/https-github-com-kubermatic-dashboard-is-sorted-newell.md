# Issue #8190 — UI/UX enhancement (root cause + fix plan)

Issue: https://github.com/kubermatic/dashboard/issues/8190 · state: open · assignee: @Manyy8
Type: `fix` (Enhancement-1) + `feat`/`fix` polish (Enhancement-2). Suggested prefix: `fix(web)`.

## Context

The issue collects two unrelated UI/UX defects, both reported against the Angular v21 upgrade (#8052).

**Enhancement-1** — two dark-theme screenshots:
1. Flavor table (OpenStack node data): the selected radio renders an extra **black elliptical ring**, offset from the blue radio icon, and it *persists after a mouse click*.
2. Provider Preset dropdown: the active option renders a **black rounded-rect frame** inside the panel.

**Enhancement-2** — from PR #8161 review ([r3529060535](https://github.com/kubermatic/dashboard/pull/8161#discussion_r3529060535)): in the wizard Cluster step, `Audit Logging`, `User Cluster Logging` and `User Cluster Monitoring` show no `i` info icon, while every other checkbox in that column does. Inconsistent, and users get no explanation of what the option does.

## Root cause

### Enhancement-1 — one cause for both screenshots

Both black shapes are the **Material strong focus indicator**, rendering black because the app never defines M3 system variables.

Chain:

1. `modules/web/src/assets/css/theme/_main.scss:31-33` includes the mixin — added by commit `90e9db7e2` (PR #8084) purely to restore `overflow: visible` on chip cells:
   ```scss
   // Restores overflow:visible on chip cells (removed as a default in Angular Material v21 via
   // angular/components#31679 and now only re-applied through this mixin).
   @include mat.strong-focus-indicators;
   ```
2. `node_modules/@angular/material/core/focus-indicators/_private.scss:76-83` — the mixin's default config:
   ```scss
   $default-config: (
     border-color: var(--mat-sys-secondary, black),
     display: block,
   );
   ```
   It emits `--mat-focus-indicator-border-color` / `--mat-focus-indicator-display` on `html`.
3. The app is still on the **M2 theming API** (`mat.m2-define-dark-theme` + `mat.all-component-themes`, `src/assets/themes/dark.scss:83,129`). `grep -rn "\-\-mat-sys" src` → **zero hits**. So `--mat-sys-secondary` is undefined and the fallback wins: **black**, 3px solid, radius 4px.
4. Nothing overrides it. Only two `focus-indicator` hits exist in `src/`: the include above, and `src/assets/css/material/_theme.scss:228` which targets the wrong class (`.mat-mdc-focus-indicator`, not `.mat-focus-indicator`) and only sets `background-color`.

Why each screenshot shows it:

- **Radio**: `radio.mjs` ships `.mat-mdc-radio-button.cdk-focused .mat-focus-indicator::before { content: ""; }`. `cdk-focused` is set by `FocusMonitor` on **mouse** focus too, not just keyboard — hence the ring sticks after clicking a flavor row.
  The *ellipse* shape and offset come from the app's global override `src/assets/css/global/_main.scss:588-590`:
  ```scss
  .mdc-radio { padding: 0 5px 0 0 !important; }
  ```
  v21 sizes the state layer via `.mdc-radio { padding: calc((var(--mat-radio-state-layer-size, 40px) - 20px) / 2); }`, so the override shrinks the box from 40×40 to 25×20. `.mat-radio-ripple.mat-focus-indicator` is `inset: 0` with `border-radius: 50%` → a 25×20 ellipse whose centre is 2.5px off the 20×20 icon. This override is pre-existing but only became visible once the ring got a colour.
- **Preset dropdown**: `_option-chunk.mjs` ships `.mat-mdc-option-active .mat-focus-indicator::before { content: ""; }` and the option's ripple div carries `class="mat-mdc-option-ripple mat-focus-indicator"`. The first option is active on open → black 3px/radius-4px frame. The preset field is `mat-select` (`wizard/step/provider-settings/preset/template.html:20-25`, `panelClass="preset-dropdown"`).

Note: PR #8052 itself changed **no SCSS** (`git show 1384b2d26 --stat` — only `package.json`, `module.ts`, `ngx-clipboard`→`cdkCopyToClipboard`). The regression entered via the follow-up chip fix #8084. Same failure mode as the two already-fixed v21 regressions (#8084, #8189): hand-rolled overrides vs. changed Material defaults.

### Enhancement-2 — icons gated behind `isEnforced()`

The three checkboxes render their `i` only inside an enforcement guard, so with no admin enforcement no icon appears:

- `modules/web/src/app/wizard/step/cluster/template.html:459` (Audit Logging — icon at `:481-484` inside `@if (isEnforced(...))`), `:662-675` (MLALogging / MLAMonitoring, same pattern).
- `modules/web/src/app/cluster/details/cluster/edit-cluster/template.html:171-199` (Audit Logging, guard `@if (!!datacenter.spec.enforceAuditLogging)`), `:268-286` (MLALogging / MLAMonitoring).

Every other checkbox renders the icon unconditionally — e.g. Kyverno at `wizard/.../template.html:655-659`, User SSH Key Agent at `:678-682`.

## Plan

### 0. Isolate the work in a worktree

```bash
git worktree add -b 8190-ui-ux-enhancement /Users/mac/Work/Github/kubermatic/dashboard.worktree main
```

All edits below happen under `/Users/mac/Work/Github/kubermatic/dashboard.worktree/`; paths are given relative to the repo root. No push, no PR — local branch only.

### 1. Remove the black focus rings

`modules/web/src/assets/css/theme/_main.scss` — replace the mixin include with only the rule it was added for. Restores exact pre-#8084 focus behaviour (Material state layers) with no dead focus-indicator CSS shipped:

```scss
// Angular Material v21 removed `overflow: visible` on chip cells (angular/components#31679).
// Inlined instead of `mat.strong-focus-indicators` — that mixin also emits
// `--mat-focus-indicator-border-color: var(--mat-sys-secondary, black)`, and this app is still on
// the M2 theming API, so the fallback renders black rings in dark mode (issue #8190).
.mat-mdc-standard-chip {
  .mdc-evolution-chip__cell--primary,
  .mdc-evolution-chip__action--primary,
  .mat-mdc-chip-action-label {
    overflow: visible;
  }
}
```

Leave `.mdc-radio { padding: 0 5px 0 0 !important; }` alone — it only mattered because the ring was visible; touching it shifts radio spacing app-wide (out of scope).

### 2. Add the missing info icons

Reuse the existing pattern — the conditional-tooltip form already used for Audit Webhook Backend (`wizard/step/cluster/template.html:489-490`): always render the icon, swap the tooltip text when enforced.

`modules/web/src/app/wizard/step/cluster/template.html`
- Audit Logging (`:459`, guard at `:481-484`) → single unconditional `<i class="km-icon-info km-pointer">` with
  `[matTooltip]="isEnforced(Controls.AuditLogging) ? 'Audit Logging is enforced by your admin in the chosen datacenter.' : '<describe what audit logging does>'"`
- MLALogging (`:662-667`) and MLAMonitoring (`:669-675`) → same shape, enforced text kept as the truthy branch.

`modules/web/src/app/cluster/details/cluster/edit-cluster/template.html`
- Audit Logging (`:171-199`, guard `!!datacenter.spec.enforceAuditLogging`), MLALogging (`:268-275`), MLAMonitoring (`:279-286`) → identical treatment, so wizard and edit dialog stay in sync.

Non-enforced tooltip copy should match the house style of the neighbouring icons ("Enable to deploy … for this cluster"). Confirm final wording with @KhizerRehan before merge.

Out of scope (noted, not fixed): `Skip Router Reconciliation` (`wizard/.../template.html:685-687`) also has no icon; the dead `.preset-dropdown { margin-top: 42px; }` rules in `wizard/step/provider-settings/preset/style.scss:17-19` and the KubeOne twin (component-encapsulated CSS can't reach a CDK overlay panel).

## Verification

Manual, dark theme (theme switcher → Dark), EE build (`npm start`):

1. **Radio** — Wizard → OpenStack → Initial Nodes → Flavor table. Click a flavor row with the mouse. Expect: blue radio only, no black ellipse, no ring left behind after the click. Repeat in light theme.
2. **Dropdown** — Wizard → Provider Settings → open `Provider Preset`. Expect: no black frame around the active option.
3. **Chips regression guard** — the reason #8084 existed. Open a view with Material chips (e.g. cluster details labels / `km-labels`) and confirm no trailing grey artifact returned.
4. **Icons** — Wizard → Cluster step: `Audit Logging`, `User Cluster Logging`, `User Cluster Monitoring` each show an `i`, tooltip readable. Repeat in Edit Cluster dialog. With admin enforcement on, the tooltip still reads "… enforced by your admin …".
5. `npm run check` and `npm run test:ci` — per repo CLAUDE.md these are not run locally by the agent; CI covers them.
