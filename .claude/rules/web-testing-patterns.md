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
