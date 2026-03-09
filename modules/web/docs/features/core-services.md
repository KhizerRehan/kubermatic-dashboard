# PRD: Core Services

**Location:** `src/app/core/services/`
**Priority:** P0

## Service Inventory (39 total)

### Tested (16 services)

| Service | Spec File | Error Scenarios? |
|---|---|---|
| addon.ts | YES | — |
| application.ts | YES | — |
| cluster.ts | YES | YES (cluster.error-scenarios.spec.ts) |
| datacenter.ts | YES | — |
| feature-gate.ts | YES | — |
| history.ts | YES | — |
| machine-deployment.ts | YES | YES (machine-deployment.error-scenarios.spec.ts) |
| member.ts | YES | — |
| node.ts | YES | — |
| notification.ts | YES | — |
| opa.ts | YES | — |
| project.ts | YES | YES (project.error-scenarios.spec.ts) |
| rbac.ts | YES | — |
| settings.ts | YES | — |
| user.ts | YES | — |
| websocket.ts | YES | — |

### Untested (23 services)

#### P0 — Critical Path Services

**1. cluster-spec.ts** — Cluster specification management
- Holds the current cluster spec state during wizard flow
- Used by wizard steps, cluster edit, provider settings
- User Stories:
  - Service stores cluster name, version, provider, networking config
  - Service emits changes when spec properties updated
  - Service resets state for new cluster creation
- Test Scenarios:
  1. Should initialize with default cluster spec
  2. Should update and emit on cluster name change
  3. Should update and emit on provider change
  4. Should reset spec for new wizard session
  5. Should merge partial spec updates

**2. external-cluster.ts** — External cluster management
- CRUD operations for imported external clusters
- User Stories:
  - Service fetches external cluster list for project
  - Service creates/deletes external clusters
  - Service fetches external cluster details and metrics
- Test Scenarios:
  1. Should fetch external clusters for project
  2. Should create external cluster with provider config
  3. Should delete external cluster
  4. Should fetch cluster details
  5. Should handle API errors gracefully

**3. cluster-templates.ts** — Cluster template management
- Template CRUD + template-based cluster creation
- Test Scenarios:
  1. Should list templates for project
  2. Should create template from cluster spec
  3. Should create cluster from template
  4. Should delete template

**4. service-account.ts** — Service account operations
- Service account CRUD + token management
- Test Scenarios:
  1. Should list service accounts for project
  2. Should create service account with group
  3. Should delete service account
  4. Should create/list/delete tokens

#### P1 — Important Services

**5. backup.ts** — Backup/snapshot management
- Backup CRUD, snapshot operations, restore triggers
- Test Scenarios:
  1. Should list backups for cluster
  2. Should create automatic backup
  3. Should create/delete snapshots
  4. Should trigger restore from snapshot

**6. cluster-backup.ts** — Enterprise cluster backup (Velero)
- Enterprise backup/restore/schedule operations
- Test Scenarios:
  1. Should list cluster backups
  2. Should create backup from schedule
  3. Should restore from backup
  4. Should manage backup storage locations

**7. label.ts** — Label management
- Kubernetes label validation and management
- Test Scenarios:
  1. Should validate label key format
  2. Should validate label value format
  3. Should detect duplicate labels
  4. Should handle system labels

**8. params.ts** — Route parameter management
- Extract and provide project/cluster/other IDs from route
- Test Scenarios:
  1. Should extract projectID from route
  2. Should extract clusterID from route
  3. Should handle missing params

**9. eol.ts** — End-of-life service
- Version EOL checking
- Test Scenarios:
  1. Should identify EOL Kubernetes versions
  2. Should return correct EOL status

**10. mla.ts** — Monitoring/Logging/Alerting
- MLA configuration management
- Test Scenarios:
  1. Should fetch MLA config for cluster
  2. Should update alertmanager config
  3. Should manage rule groups

**11. name-generator.ts** — Random name generation
- Generates human-readable names for clusters/resources
- Test Scenarios:
  1. Should generate non-empty name
  2. Should generate unique names

#### P2 — Lower Priority Services

**12. branding.ts** — Branding/theming service
- Test Scenarios: Should load branding config, should provide theme colors

**13. cluster-service-account.ts** — Cluster-level service accounts
- Test Scenarios: Should list cluster SAs, should create/delete

**14. dialog-mode.ts** — Dialog mode tracking
- Test Scenarios: Should track active dialog mode

**15. external-machine-deployment.ts** — External cluster MDs
- Test Scenarios: Should list external MDs, should create/delete

**16. kubeone-cluster-spec.ts** — KubeOne cluster spec
- Test Scenarios: Should manage KubeOne spec state

**17. kyverno.ts** — Kyverno policy management
- Test Scenarios: Should list policies, should create/delete

**18. operating-system-manager.ts** — OS manager service
- Test Scenarios: Should list OS profiles

**19. page-title.ts** — Page title management
- Test Scenarios: Should update document title

**20. previous-route.ts** — Previous route tracking
- Test Scenarios: Should track previous route

**21. theme-informer.ts** — Theme change notifications
- Test Scenarios: Should emit theme changes

**22. token.ts** — Token management
- Test Scenarios: Should manage auth tokens

**23. user-cluster-config.ts** — User cluster configuration
- Test Scenarios: Should store/retrieve user cluster preferences

## Service Subdirectories (not covered in this PRD)

| Subdirectory | Separate PRD? |
|---|---|
| auth/ | Part of core services |
| external-cluster-wizard/ | Part of external-cluster-wizard.md |
| global/ | Part of core services |
| kubeone-wizard/ | Part of kubeone-wizard.md |
| node-data/ | Part of node-data.md |
| provider/ | Part of wizard.md / cluster.md |
| ssh-key/ | Part of ssh-key.md |
| wizard/ | Part of wizard.md |
