# Feature Test Coverage Index

**Last Updated:** 2026-03-06

## Coverage Matrix

| Feature | PRD | Components | Tested | Coverage | Priority | Status |
|---|---|---|---|---|---|---|
| **[Shared Components](shared-components.md)** | YES | 54 | 49 | 91% | P0 | 5 gaps identified |
| **[Core Services](core-services.md)** | YES | 39 | 16 | 41% | P0 | 23 gaps identified |
| **[Cluster](cluster.md)** | YES | 63 | 46 | 73% | P0 | 17 gaps identified |
| **[Wizard](wizard.md)** | YES | 7 steps | 7 | 100% | P0 | Step interaction gaps |
| **[Project](project.md)** | YES | 3 | 3 | 100% | P0 | Edge case gaps |
| **[Node Data](node-data.md)** | YES | 35 | 0 | 0% | P1 | **Complete gap** |
| **[Backup](backup.md)** | YES | 11 | 0 | 0% | P1 | **Complete gap** |
| **[Member / SA / SSH Key](member-serviceaccount-sshkey.md)** | YES | 10 | 10 | 100% | P1 | Minor gaps |
| **[Project Overview](remaining-features.md#prd-project-overview)** | YES | 5 | 0 | 0% | P2 | Complete gap |
| **[External Cluster Wizard](remaining-features.md#prd-external-cluster-wizard)** | YES | 10 | 0 | 0% | P2 | Complete gap |
| **[KubeOne Wizard](remaining-features.md#prd-kubeone-wizard)** | YES | 14 | 0 | 0% | P2 | Complete gap |
| **[Cluster Template](remaining-features.md#prd-cluster-template)** | YES | 1 | 0 | 0% | P2 | Complete gap |
| **[Admin Settings](remaining-features.md#prd-admin-settings)** | YES | 55 | 8 | 15% | P2 | 47 gaps |
| **[User Settings](remaining-features.md#prd-user-settings)** | YES | 1 | 1 | 100% | P2 | — |
| **[Dynamic/Enterprise](remaining-features.md#prd-dynamicenterprise-features)** | YES | 24+ | 8 | ~33% | P2 | EE-specific |

## Totals

| Metric | Count |
|---|---|
| Total component files | ~330 |
| Components with tests | ~148 |
| Overall coverage | ~45% |
| Unit spec files | ~204 |
| E2E spec files | ~30 |
| Mock services | 26 |
| Mock data factories | 18 |
| Test utilities | 7 |

## Implementation Order

### Phase 1 — P0 (Critical Path)
1. Write `annotation-form` tests (highest ROI untested shared component)
2. Rewrite `ClusterListComponent` edge-case tests (deleted broken 735-line file)
3. Add `cluster-spec.ts` service tests (used by wizard + cluster edit)
4. Add `external-cluster.ts` service tests
5. Add `cluster-templates.ts` service tests

### Phase 2 — P1 (Important)
6. Node Data: core component + dialog + kubelet version
7. Node Data: AWS, GCP, Azure, OpenStack provider forms
8. Backup: list + automatic backup + snapshot CRUD
9. Core Services: remaining P1 services (backup, label, params, eol, mla)

### Phase 3 — P1 Continued
10. Node Data: remaining providers
11. Cluster: external cluster detail views (5 components)
12. Cluster: KubeOne detail views (3 components)
13. Core Services: P1 service tests continued

### Phase 4 — P2 (Lower Priority)
14. Project Overview (5 display components)
15. External Cluster Wizard (follows main wizard patterns)
16. KubeOne Wizard (follows main wizard patterns)
17. Admin Settings: Presets (16 components)
18. Admin Settings: Dynamic Datacenters (3 components)
19. Remaining admin settings components
20. Enterprise-only features

## File Organization

```
docs/
├── testing/
│   ├── README.md              ← How to run tests, mock inventory, conventions
│   └── _archive/              ← Previous 35+ docs (archived, not deleted)
├── features/
│   ├── README.md              ← This file (coverage matrix)
│   ├── shared-components.md   ← P0 PRD
│   ├── core-services.md       ← P0 PRD
│   ├── cluster.md             ← P0 PRD
│   ├── wizard.md              ← P0 PRD
│   ├── project.md             ← P0 PRD
│   ├── node-data.md           ← P1 PRD
│   ├── backup.md              ← P1 PRD
│   ├── member-serviceaccount-sshkey.md ← P1 PRD
│   └── remaining-features.md  ← P2 PRDs (project-overview, wizards, settings, EE)
└── plan.md                    ← Original planning document
```
