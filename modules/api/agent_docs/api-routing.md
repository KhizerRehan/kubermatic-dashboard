# API Versions and Routing

Detailed reference for the REST API versioning and route organization.

## V1 API (`/api/v1/*`)

**Location**: `pkg/handler/v1/`, `pkg/api/v1/`

Legacy REST API with separate handler functions per HTTP method:
- GET `/api/v1/projects` - List user's projects
- POST `/api/v1/projects` - Create project
- GET `/api/v1/projects/{projectID}/clusters` - List clusters in project
- DELETE `/api/v1/projects/{projectID}` - Delete project
- WebSocket `/api/v1/projects/{projectID}/clusters/{clusterID}/logs` - Stream logs

**Resource Handlers**:
```
addon/              cluster/            dc/                 label/
node/               presets/            project/            seed/
serviceaccount/     ssh/                user/
admin/              (admin-only routes)
```

## V2 API (`/api/v2/*`)

**Location**: `pkg/handler/v2/`, `pkg/api/v2/`

Newer unified API with consistent patterns across resources:
- RESTful design with consistent CRUD operations
- Support for additional features like:
  - Cluster backups (EE only)
  - Resource quotas (EE only)
  - Kyverno policies (EE only)
  - Constraint templates
  - Applications

**Resource Handlers** (42+ resources):
```
addon/                     alertmanager/              application_definition/
application_installation/  cluster/                   cluster_template/
clusterbackup/            constraint/                constraint_template/
etcdbackupconfig/         etcdrestore/               allowed_registry/
... (many more)
```
