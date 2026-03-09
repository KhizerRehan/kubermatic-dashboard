# PRD: Member Module

**Route:** `projects/:projectID/members`, `projects/:projectID/groups`
**Location:** `src/app/member/`
**Priority:** P1
**Test Coverage:** 3/3 components tested + integration spec

## Components (all tested)

| Component | Spec? |
|---|---|
| component.ts | YES |
| add-member/component.ts | YES |
| edit-member/component.ts | YES |
| integration.spec.ts | YES |

## Test Gaps

### P1 — Strengthen Existing Coverage

**1. Member list edge cases**
- Test Scenarios:
  1. Should handle empty member list
  2. Should show current user's role
  3. Should disable edit/delete for owners (unless admin)
  4. Should refresh on member add/edit/delete

**2. Role-based visibility**
- Test Scenarios:
  1. Admin should see all members
  2. Editor should see members but not edit roles
  3. Viewer should see members but not add/edit/delete

---

# PRD: Service Account Module

**Route:** `projects/:projectID/serviceaccounts`
**Location:** `src/app/serviceaccount/`
**Priority:** P1
**Test Coverage:** 6/6 components tested

## Components (all tested)

| Component | Spec? |
|---|---|
| component.ts | YES |
| create-dialog/component.ts | YES |
| edit-dialog/component.ts | YES |
| token/component.ts | YES |
| token/add/component.ts | YES |
| token/add/steps/information/component.ts | YES |
| token/add/steps/name/component.ts | YES |

## Test Gaps

Minimal — existing coverage is good. Consider adding:
1. Token expiration display
2. Error handling for token creation failures

---

# PRD: SSH Key Module

**Route:** `projects/:projectID/sshkeys`
**Location:** `src/app/sshkey/`
**Priority:** P1
**Test Coverage:** 1/1 components tested

## Components (all tested)

| Component | Spec? |
|---|---|
| component.ts | YES |

## Test Gaps

Minimal — existing coverage is adequate. The SSH key creation dialog is in shared components (add-ssh-key-dialog, also tested).
