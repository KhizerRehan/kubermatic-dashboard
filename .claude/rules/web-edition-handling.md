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
