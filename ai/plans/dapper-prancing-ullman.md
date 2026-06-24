# OpenStack Image Dropdown — Issue #3024

## Status: Pending Internal Alignment

Implementation drafted but approach needs team sign-off before merge. See Open Questions below.

---

## Open Questions (Ask on Slack)

1. Should we add a new API endpoint to fetch images live from Glance, or follow the admin-managed static pattern already used for KubeVirt/Baremetal (images defined in `dc.spec.openstack.images`, updated via infra repo)?

2. Should the dropdown show images for all OSes (Ubuntu, Flatcar, RHEL, Rocky, Amazon Linux), or only Ubuntu?

3. If using a live Glance endpoint — what is the project/tenant scoping for image visibility? Should we show only project-owned images, all public images, or both?

4. Should image list management be delegated to admins (same as current KKP approach) rather than fetching dynamically per user?

5. If going with static admin-managed approach — should `dc.spec.openstack.images` be extended from one-image-per-OS to a list-per-OS, or a flat `[{name, os}]` list like KubeVirt/Baremetal?

---

## Context

OpenStack image field in node deployment editor is a plain text input. Users must manually type the exact image name. Scoped ask (internal 9092, @dakraus):

- Fetch project-specific OpenStack images
- Include seed datacenter image (`dc.spec.openstack.images[os]`) in list
- Display as dropdown instead of free-text input

---

## Approach A — Live Glance Endpoint (Currently Implemented)

Fetch images dynamically from OpenStack image service (Glance) at node-creation time.

**Status**: ✅ Code written, TypeScript + Go compile clean. Pending alignment.

### Backend changes (`modules/api`)

| File | Change |
|------|--------|
| `pkg/api/v1/types.go` | Add `OpenstackImage{ID, Name}` response type |
| `pkg/provider/cloud/openstack/provider.go` | Add `GetImages()` via `gophercloud/imageservice/v2/images` |
| `pkg/handler/common/provider/openstack.go` | Add `OpenstackImageWithClusterCredentialsEndpoint()` + `GetOpenstackImages()` |
| `pkg/handler/v2/provider/openstack.go` | Add `OpenstackImageEndpoint()` + `OpenstackImageWithClusterCredentialsEndpoint()` |
| `pkg/handler/v2/routes_v2.go` | Register two new routes (with + without cluster credentials) |
| `vendor/` | `go mod vendor` to bring in `gophercloud/openstack/imageservice/v2/images` |

New routes:
```
GET /api/v2/projects/{project_id}/providers/openstack/images
GET /api/v2/projects/{project_id}/clusters/{cluster_id}/providers/openstack/images
```

### Frontend changes (`modules/web`)

| File | Change |
|------|--------|
| `shared/entity/provider/openstack.ts` | Add `OpenstackImage{id, name}` |
| `core/services/provider/openstack.ts` | Add `getImages()` (dialog/cluster-credentials mode) |
| `core/services/wizard/provider/openstack.ts` | Add `images()` (wizard/user-credentials mode) |
| `core/services/node-data/provider/openstack.ts` | Add `images()` with wizard/dialog switch |
| `node-data/basic/provider/openstack/component.ts` | Add `ImageState` enum, image state fields, observables, callbacks |
| `node-data/basic/provider/openstack/template.html` | Replace `<input type="text">` with `<km-combobox>` |

DC default image always included in dropdown even if not returned by API.

### Pros / Cons
- ✅ Always fresh, no admin maintenance
- ✅ Shows all available images the user's project can access
- ❌ New API surface + Glance dependency
- ❌ Project scoping ambiguity (public vs project-owned)
- ❌ Inconsistent with KubeVirt/Baremetal pattern

---

## Approach B — Static Admin-Managed DC Spec

Extend `dc.spec.openstack.images` to hold a list per OS (or flat list). Admins update via infra repo (same as current KKP workflow). Frontend converts existing text input to dropdown using DC spec values only.

**Status**: 🔲 Not implemented.

### What changes

**KKP seed CRD** (`DatacenterSpecOpenstack`): extend `images` field from `map[os]string` to one of:
- Option 1: `map[os][]string` (list per OS)
- Option 2: `[]OpenstackImageEntry{Name, OS}` (flat list, like KubeVirt/Baremetal)

**Backend**: no new API endpoint needed. Datacenter spec already returned in existing DC endpoints.

**Frontend**: `_setDefaultImage()` reads `dc.spec.openstack.images` — if extended to list, populate dropdown from that list instead of single string.

### Pros / Cons
- ✅ Consistent with KubeVirt/Baremetal pattern
- ✅ Admin controls visibility (no surprise images in dropdown)
- ✅ No new API surface
- ❌ Admin must update infra repo when images change
- ❌ CRD schema change required

---

## Verification (Approach A)

1. Wizard: Create OpenStack cluster → node pool step → Image dropdown loads, DC default pre-selected
2. Dialog: Edit existing node deployment → dropdown populated via cluster credentials
3. Fallback: API failure → "No Images Available", DC default still present in list
4. Custom image: user can type name not in list (combobox allows free text via filter input)
