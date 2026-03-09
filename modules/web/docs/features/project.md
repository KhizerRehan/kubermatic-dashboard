# PRD: Project Module

**Route:** `projects`
**Location:** `src/app/project/`
**Priority:** P0

## Overview

Project listing and management. Projects are the top-level organizational unit in KKP — all clusters, members, and resources belong to a project.

## Components (3 — all tested)

| Component | Spec? | Lines |
|---|---|---|
| component.ts | YES (523 lines) | Project list table |
| delete-project/component.ts | YES | Delete confirmation dialog |
| edit-project/component.ts | YES | Edit project name/labels dialog |
| integration.spec.ts | YES | Integration test for project service interactions |

## User Stories

1. User sees list of projects they have access to
2. User can create a new project (via add-project-dialog in shared)
3. User can edit project name and labels
4. User can delete a project (with confirmation)
5. User sees project status (Active, Inactive, Terminating)
6. User can click project to navigate to project overview
7. Admin users see all projects

## Current Coverage Assessment

The existing specs cover component creation, basic rendering, and mock service interactions. The integration spec tests project service HTTP calls.

## Test Gaps

### P0 — Critical

**1. Project List Table Behavior**
- Test Scenarios:
  1. Should display all user projects in table
  2. Should show project status correctly (Active/Inactive/Terminating)
  3. Should handle empty project list
  4. Should navigate to project overview on click
  5. Should show create button for authorized users
  6. Should hide create button for unauthorized users
  7. Should refresh project list on timer

**2. Delete Project Flow**
- Test Scenarios:
  1. Should only enable delete button when project name typed correctly
  2. Should call delete API with correct project ID
  3. Should handle delete API error
  4. Should close dialog on successful delete

**3. Edit Project Flow**
- Test Scenarios:
  1. Should pre-fill form with current project data
  2. Should validate project name format
  3. Should submit edits to API
  4. Should handle API error on edit

### P1 — Error Scenarios

**4. API Error Handling**
- Test Scenarios:
  1. Should handle 403 (no access to projects)
  2. Should handle 500 (server error loading projects)
  3. Should handle network timeout
  4. Should show notification on error
