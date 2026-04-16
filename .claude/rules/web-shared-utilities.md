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
