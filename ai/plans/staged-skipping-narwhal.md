# AWS instance sizes — root cause, fix, and follow-ups

## Context

The cluster wizard's AWS machine-type list never showed the `m6id` / `m6in` / `m6idn` families,
and on the local dev setup every call to
`GET /api/v2/projects/{project_id}/providers/aws/sizes` returned:

```json
{"error":{"code":500,"message":"AWS instance type data not initialized"}}
```

Investigation found **two unrelated defects** behind these symptoms — one user-visible product bug
that affects every KKP installation, and one robustness bug that turns any bad instance-data blob
into an opaque 500. The fix for both is already applied in the working tree; this plan covers
landing it, the regression test it needs, and the follow-ups.

Supersedes/absorbs `ai/plans/aws-instance-data-refresh.plan.md` (delete that file when this lands).

---

## Issue 1 — AWS size list is missing m6id / m6in / m6idn (and other modern families)

**Labels:** `kind/bug`, `sig/api`, `provider/aws`

### Symptom

Families visible on ec2instances.info for `eu-central-1` (`m6id.*`, `m6in.*`, `m6idn.*`) never
appear in the KKP wizard's AWS machine-type selector, at any node size.

### Root cause

Two independent filters, both in `modules/api/pkg/handler/common/provider/aws.go`.

**1a. The bundled instance dataset is from November 2022.**

AWS sizes are not read from the EC2 API. `init()` loads a static JSON blob embedded in
`github.com/cristim/ec2-instances-info`, pinned at `v0.0.0-20221130144415-da4474e2a3d1`.
That library has had no release since Nov 2022 and its blob has 615 instance types.

`m6id`/`m6in`/`m6idn` launched at re:Invent 2022, so the blob contains the *types* but only
carries pricing for the 3–6 launch regions. `AWSSizes()` skips any type with no
`pricing[region].linux.ondemand` entry (`aws.go:239-247`), so in `eu-central-1` — and most other
regions — they are dropped before any quota is applied. Same for everything newer:
`m7i`, `c7i`, `r7i`, `m8g`, … are absent from the dataset entirely.

**1b. A hardcoded $1/hour price cap.**

```go
// aws.go, filterMachineFlavorsForAWS
// Filter too expensive instance types (>1$ per hour) if GPU not enabled
if !filter.EnableGPU && r.Price > 1 {
    continue
}
```

AWS is the **only** provider with such a cap — `gcp.go`, `azure.go`, `digitalocean.go`,
`hetzner.go`, `openstack.go`, `alibaba.go` all filter on CPU / RAM / GPU only. It is not
configurable, it is coupled to an unrelated `EnableGPU` flag, and it is applied on top of the
admin-configurable `MachineFlavorFilter`.

Measured on `eu-central-1`, x64, with the default quota from
`modules/api/pkg/provider/kubernetes/settings.go:92-98` (`MinCPU 2`, `MaxCPU 32`, `MinRAM 2`,
`MaxRAM 128`, GPU off) — the cap alone removes **514 of 781** eligible types:

| drop reason | count |
|---|--:|
| `Price > 1` cap | 514 |
| ARM (x64 requested) | 262 |
| no pricing for region | 83 |
| no linux on-demand price | 87 |
| vCPU outside 2–32 | 11 |
| GPU present | 11 |
| RAM outside 2–128 GiB | 4 |

So even once the data is fresh, `m6id.4xlarge` ($1.1424), `m6id.8xlarge` ($2.2848) and every
equivalent in `m6in`/`m6idn` stay hidden despite fitting comfortably inside the configured quota.

### Fix

1. Swap the dependency to the maintained fork:
   `github.com/cristim/ec2-instances-info v0.0.0-20221130144415`
   → `github.com/LeanerCloud/ec2-instances-info v0.0.0-20241101103313-93438b48d82f`
   (861 types, Nov 2024; identical package name, `Data()` signature, and struct fields —
   drop-in, only the import path changes in `aws.go` and `eks.go`).
2. Delete the `Price > 1` cut. CPU / RAM / GPU quota from `MachineFlavorFilter` still applies,
   which is the documented, admin-controlled knob.

### Impact (eu-central-1, x64, default quota)

**192 → 263 sizes returned.**

| instance | vCPU | RAM | $/hr | before | after |
|---|--:|--:|--:|:--:|:--:|
| m6id.large / xlarge / 2xlarge | 2–8 | 8–32 GiB | 0.14–0.57 | ✅ | ✅ |
| m6id.4xlarge | 16 | 64 GiB | 1.1424 | ❌ | ✅ |
| m6id.8xlarge | 32 | 128 GiB | 2.2848 | ❌ | ✅ |
| m6in.large / xlarge / 2xlarge | 2–8 | 8–32 GiB | 0.16–0.66 | ✅ | ✅ |
| m6in.4xlarge | 16 | 64 GiB | 1.3198 | ❌ | ✅ |
| m6in.8xlarge | 32 | 128 GiB | 2.6395 | ❌ | ✅ |
| m6idn.large / xlarge / 2xlarge | 2–8 | 8–32 GiB | 0.19–0.76 | ✅ | ✅ |
| m6idn.4xlarge | 16 | 64 GiB | 1.5163 | ❌ | ✅ |
| m6idn.8xlarge | 32 | 128 GiB | 3.0326 | ❌ | ✅ |

`12xlarge` and larger remain hidden — correctly, by the `MaxCPU: 32` / `MaxRAM: 128` defaults,
not by price. Admins raise them via global settings or the seed's `machineFlavorFilter`.

---

## Issue 2 — A bad instance-data blob fails silently, then 500s on every AWS sizes request

**Labels:** `kind/bug`, `sig/api`, `provider/aws`

### Symptom

`GET /api/v2/projects/{id}/providers/aws/sizes` → `500 AWS instance type data not initialized`,
with nothing in the API server logs explaining why.

### Root cause

**2a. The load error is discarded.**

```go
// aws.go
func init() {
    data, _ = ec2.Data()          // error dropped on the floor
}
```

`eks.go` had a **second** `init()` doing exactly the same to the same package-level `data`.
When `Data()` fails, `data` stays `nil` and the only signal is the generic 500 raised later at
`aws.go:233-235` and `eks.go:161-163` — per request, with no cause attached.

**2b. What made `Data()` fail: fractional-GPU instances.**

The library models GPU count as `int`:

```go
GPU int `json:"GPU"`
```

AWS's G6f / Gr6f families expose *fractional* GPUs, and the dataset encodes them as floats:

| instance | `"GPU"` |
|---|--:|
| g6f.large, g6f.xlarge | 0.125 |
| g6f.2xlarge | 0.25 |
| g6f.4xlarge, gr6f.4xlarge | 0.5 |

`json.Unmarshal` cannot put `0.25` into an `int`, so the **whole** decode fails and `Data()`
returns `nil, err` — one unparseable field kills the entire catalog.

On the affected machine the fractional-GPU data arrived because the extracted module-cache copy of
`data/instances.json` had been overwritten with a hand-downloaded ec2instances.info dump
(226 MB / 1213 types, vs the module's genuine 63 MB / 615 types), and `go mod vendor` then
propagated it into `modules/api/vendor/`. `go mod verify` flagged both
`cristim/ec2-instances-info` and `LeanerCloud/ec2-instances-info` as
`dir has been modified`; restoring both from their verified zips cleared it.

The local tampering is not the interesting part — it is a preview of what happens to *everyone*
the moment the bundled dataset is refreshed past mid-2025, since g6f/gr6f will be in it.

### Fix (this repo)

1. `init()` logs the error via `kubermaticlog.Logger.Errorw` instead of discarding it.
2. Remove the duplicate `init()` in `eks.go`.

### Fix (upstream, tracked as follow-up 3 below)

Parse GPU tolerantly, mirroring how the library already handles `vCPU` / `ECU` / `memory`:

```go
- GPU int `json:"GPU"`
+ GPURaw json.RawMessage `json:"GPU"`
+ GPU    int

  // in Data(), next to the existing VCPU/ECU/Memory handling:
+ var gpuFloat float64
+ if json.Unmarshal(d[i].GPURaw, &gpuFloat) == nil {
+     d[i].GPU = int(math.Ceil(gpuFloat))   // 0.25 GPU -> 1, preserves FilterGPU semantics
+ }
```

---

## Work plan

### 1. Land the fix (already in the working tree — needs branch + PR)

```
 modules/api/go.mod                             |  2 +-   dep swap
 modules/api/go.sum                             |  5 +-
 modules/api/pkg/handler/common/provider/aws.go | 15 +-   price cap out, init logs error
 modules/api/pkg/handler/common/provider/eks.go |  6 -    duplicate init removed
 modules/api/vendor/…                           |         re-vendored (LeanerCloud in, cristim out)
```

- Branch off `main`, e.g. `fix/aws-instance-types-m6id-m6in`.
- Commit message body should carry the Issue 1 + Issue 2 root causes and link both issues.
- Sanity-check that `go mod verify` still reports `all modules verified` before pushing —
  a tampered cache is what started this.

### 2. Regression test

Extend `modules/api/pkg/handler/common/provider/aws_test.go` (currently only asserts that ARM
prefixes are absent, using `genDefaultMachineDeploymentVMResourceQuota()`), adding a case that
calls `provider.AWSSizes("eu-central-1", "x64", filter)` and asserts:

- `m6id.large`, `m6id.4xlarge`, `m6in.2xlarge`, `m6idn.8xlarge` are present
  (catches both a stale dataset and a reintroduced price cap);
- the returned list is non-empty (catches a `nil` `data` / failed `Data()` outright);
- nothing above `MaxCPU` / `MaxRAM` leaks through.

### 3. Follow-up — data freshness + fractional GPU

LeanerCloud's blob is Nov 2024, so `m8i`, `m8a`, `c8i`, `r8i`, `i7i`, `i7ie`, `p6-b200`,
`p6-b300`, `g6f`, `gr6f`, `c7i-flex`, `m7i-flex` are still missing. In order of preference:

- **a.** Ask LeanerCloud to regenerate `data/instances.json`, then bump the pin.
- **b.** Fork to `kubermatic/ec2-instances-info`, regenerate the data **and** apply the
  `GPURaw` change from Issue 2, wire it in with a `replace` directive, and PR both upstream.
- **c.** Longer term: drop the embedded blob and source sizes from `DescribeInstanceTypes` +
  the Pricing API behind a cache. Correct, but needs credentials at list time and a caching
  layer — its own epic, not part of this fix.

### 4. Follow-up — embedded blob size

The vendored `instances.json` is 89 MB and is linked into `kubermatic-api` in full. KKP reads
only `instance_type`, `pretty_name`, `memory`, `vCPU`, `GPU`, `arch`, `physical_processor`, and
`pricing.<region>.linux.ondemand`. If we own a fork (3b), strip everything else before embedding
— should cut it by >90%.

---

## Verification

1. Restart the API server, then:

```bash
curl -s -H "Authorization: Bearer $TOKEN" -H "Region: eu-central-1" \
  "$KKP/api/v2/projects/$PROJECT_ID/providers/aws/sizes?architecture=x64" \
  | jq -r '.[].name' | grep -E '^m6i(d|n|dn)\.' | sort
```

Expect `large`, `xlarge`, `2xlarge`, `4xlarge`, `8xlarge` for each of `m6id`, `m6in`, `m6idn`.

2. Total count sanity: `… | jq 'length'` → ~263 for `eu-central-1` / x64 / default quota
   (was 192).

3. Negative check — confirm the quota, not price, is what bounds the list:
   `… | jq -r '.[] | select(.vcpus > 32) | .name'` → empty.

4. Confirm the silent-failure path is gone: temporarily point the loader at a corrupt blob and
   check the API server logs contain `failed to load AWS instance type data` at startup, instead
   of only per-request 500s.

5. Wizard: Create Cluster → AWS → node data — `m6id.4xlarge` and `m6in.4xlarge` selectable.

6. `cd modules/api && go test ./pkg/handler/common/provider/...` (per repo convention, run by
   the author before the PR, not by the agent).
