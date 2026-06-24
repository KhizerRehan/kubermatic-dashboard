# Fix CI Failure: post-dashboard-push-ce-main Go version mismatch

## Context

The postsubmit CI job **`post-dashboard-push-ce-main`** is failing on `main` with:

```
go: go.mod requires go >= 1.26.4 (running go 1.25.7; GOTOOLCHAIN=local)
```

Build log: failed command was
`GOOS=linux go build -a -tags "ce" ... -o _build/dashboard ./cmd/dashboard` (`modules/web/Makefile:67`), invoked by `KUBERMATIC_EDITION=ce make ADDITIONAL_TAGS="main" docker-push`.

### Root cause

Commit `93f1c4c83` ("Bump Go version to 1.26.4", PR #8121) bumped both `go.mod` files to `go 1.26.4` and updated **presubmit** builder images (`.prow/*.yaml`) to `go-1.26-node-22-...`. But the **postsubmit push jobs are defined in the external `k8c-infra` repo**, which was NOT updated. They still run inside `quay.io/kubermatic/build:go-1.25-node-22-kind-0.30-6` → Go 1.25.7, which refuses to build a `go 1.26.4` module under `GOTOOLCHAIN=local`.

| Layer | Go version | Status |
|---|---|---|
| `modules/{web,api}/go.mod` line 3 | `go 1.26.4` | ✅ bumped |
| dashboard `.prow/*.yaml` presubmits | `go-1.26-node-22-...` | ✅ bumped |
| **k8c-infra main postsubmits** | `go-1.25-node-22-kind-0.30-6` | ❌ stale → **failure** |
| chrome-headless Dockerfile | `go-1.25-node-22-kind-0.30-8` | ❌ stale (secondary) |

Intended outcome: postsubmit push/deploy jobs build under Go 1.26, matching `go.mod` and the presubmits; CI goes green.

## Primary fix — `k8c-infra` repo (fixes the failing job)

File: `/Users/mac/Work/Github/kubermatic/k8c-infra/prow/jobs/dashboard/dashboard-postsubmits-main.yaml`

Replace the builder image on these 3 jobs, all currently
`quay.io/kubermatic/build:go-1.25-node-22-kind-0.30-6` → `quay.io/kubermatic/build:go-1.26-node-22-kind-0.32-1` (the exact tag the presubmits already use):

- Line 49 — `post-dashboard-push-and-deploy-ee-main`
- Line 87 — `post-dashboard-push-ce-main`  ← **the failing job**
- Line 115 — `post-dashboard-upload-gocache-main`

All three must move together: the gocache job carries the comment *"This must match the go version used for building, else go will rightfully not use the cache"* (lines 113–114), so the build jobs and the cache job must share one Go version.

> This change lives in a separate repo and requires its own PR/approval. It is the only change that unblocks `post-dashboard-push-ce-main`.

## Secondary cleanup (consistency, not the failing job)

1. **chrome-headless Dockerfile** — `modules/web/containers/chrome-headless/Dockerfile:15`
   `FROM quay.io/kubermatic/build:go-1.25-node-22-kind-0.30-8` → `go-1.26-node-22-kind-0.32-1`.
   This image is built/pushed separately and used by `post-dashboard-coverage-main`; not part of the failing build, but the last stale `go-1.25` ref inside the dashboard repo.

2. **k8c-infra release-branch postsubmits** (`dashboard-postsubmits-2.30.yaml` etc.) also pin `go-1.25`. Leave as-is unless those release branches also bump `go.mod`; bumping them without a matching `go.mod` bump on the release branch would be wrong. Track separately.

## Verification

- Re-run `post-dashboard-push-ce-main` (Prow `/retest` or re-trigger after the k8c-infra PR merges). Build should pass the `go build ./cmd/dashboard` step.
- Sanity locally inside the new image:
  `docker run --rm quay.io/kubermatic/build:go-1.26-node-22-kind-0.32-1 go version` → expect `go1.26.x`.
- Confirm no `go-1.25` refs remain in the failing path:
  `grep -rn "go-1.25" /Users/mac/Work/Github/kubermatic/k8c-infra/prow/jobs/dashboard/dashboard-postsubmits-main.yaml` → no hits after edit.
  `grep -rn "go-1.25\|go1.25" /Users/mac/Work/Github/kubermatic/dashboard` → only chrome-headless if secondary cleanup skipped.
