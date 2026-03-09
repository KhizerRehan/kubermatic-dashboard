# PRD: Backup Module

**Route:** `projects/:projectID/backups`, `projects/:projectID/snapshots`, `projects/:projectID/restores`
**Location:** `src/app/backup/`
**Priority:** P1
**Test Coverage:** 0/11 components tested

## Overview

Backup management for KKP clusters — automatic backup schedules, manual snapshots, and restore operations. This is the non-Enterprise backup module (separate from the Enterprise Velero-based cluster-backups).

## Components (11)

### List Views

| # | Component | Purpose |
|---|---|---|
| 1 | list/component.ts | Root list with tab navigation (backups/snapshots/restores) |
| 2 | list/automatic-backup/component.ts | Automatic backup schedule table |
| 3 | list/automatic-backup/add-dialog/component.ts | Create automatic backup schedule dialog |
| 4 | list/snapshot/component.ts | Snapshot table |
| 5 | list/snapshot/add-dialog/component.ts | Create manual snapshot dialog |
| 6 | list/snapshot/delete-dialog/component.ts | Delete snapshot confirmation |
| 7 | list/snapshot/restore-dialog/component.ts | Restore from snapshot dialog |
| 8 | list/restore/component.ts | Restore operation table |

### Detail Views

| # | Component | Purpose |
|---|---|---|
| 9 | details/automatic-backup/component.ts | Automatic backup schedule details |
| 10 | details/automatic-backup/backups/component.ts | Backups created by schedule |
| 11 | details/snapshot/component.ts | Snapshot detail view |

## User Stories

1. User views list of automatic backup schedules for a cluster
2. User creates an automatic backup schedule (cron, retention, destination)
3. User views list of snapshots
4. User creates a manual snapshot
5. User deletes a snapshot
6. User restores a cluster from a snapshot
7. User views restore operation status
8. User views backup schedule details and its created backups
9. User views snapshot details

## Acceptance Criteria

- Backup list loads for correct project/cluster context
- Create automatic backup validates cron expression
- Create automatic backup validates retention period
- Delete snapshot requires confirmation
- Restore dialog shows available snapshots
- Restore operation creates a restore record
- Tables support sort and pagination

## Test Strategy

### P1 — List & CRUD Operations (8 tests)

**1. Root list component**
- Test Scenarios:
  1. Should render tab navigation (backups/snapshots/restores)
  2. Should load data for selected tab
  3. Should handle empty data states

**2. Automatic backup list + dialog**
- Test Scenarios:
  1. Should display backup schedules in table
  2. Should open create dialog
  3. Should validate cron expression
  4. Should validate retention settings
  5. Should submit creation to API

**3. Snapshot list + dialogs**
- Test Scenarios:
  1. Should display snapshots in table
  2. Should open create snapshot dialog
  3. Should confirm delete with dialog
  4. Should open restore dialog
  5. Should submit restore to API

**4. Restore list**
- Test Scenarios:
  1. Should display restore operations in table
  2. Should show restore status (pending/complete/failed)

### P2 — Detail Views (3 tests)

**5-7. Detail components**
- Test Scenarios per component:
  1. Should load and display resource details
  2. Should handle missing/loading resource
