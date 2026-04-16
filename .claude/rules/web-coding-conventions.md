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
