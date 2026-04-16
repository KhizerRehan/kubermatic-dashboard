# Domain Concepts and Configuration

Key domain concepts and configuration reference for the KKP Dashboard API.

## Seeds (Kubernetes Clusters)

**Definition**: A "Seed" is a Kubernetes cluster that hosts user clusters (via KubeVirt or similar).

**Location**: Kubermatic CRD `kubermaticv1.Seed`

The API needs to:
1. Discover available seeds via `SeedsGetter`
2. Get kubeconfig for each seed via `SeedKubeconfigGetter`
3. Create seed-specific providers via getters (e.g., `ClusterProviderGetter`)

**Example Flow**:
```
Client request for clusters in project X
-> Get all seeds
-> For each seed: create ClusterProvider
-> List clusters on each seed
-> Combine and return to client
```

## Projects

**Definition**: Logical namespace for resources owned by users/teams.

**Hierarchy**:
```
Kubermatic Installation
└── Project (team/org)
    ├── Cluster A
    ├── Cluster B
    └── Resources (users, SSH keys, etc.)
```

## User Context

Throughout the request, user information is maintained in context:

```go
type UserInfo struct {
    Email          string         // User identifier
    Groups         []string       // OIDC groups
    Roles          sets.Set[string]
    IsAdmin        bool
    IsGlobalViewer bool
}
```

Used by middleware to:
- Enforce RBAC via impersonation clients
- Track resource ownership
- Log audit information

## Privileged Operations

Some operations bypass user RBAC (admin-only):
- Creating/deleting projects
- Modifying KubermaticConfiguration
- Accessing all users' SSH keys

These use "privileged" providers that don't impersonate the user.

## Configuration and Flags

Important command-line flags:

```
-address                           Listen address (default: :8080)
-ca-bundle                         CA certificate bundle path (required)
-oidc-url                          OIDC provider URL
-oidc-authenticator-client-id      Client ID for user auth
-oidc-issuer-client-id             Client ID for issuer role (EE)
-oidc-issuer-client-secret         Issuer client secret (EE)
-oidc-issuer-redirect-uri          Callback URL (EE)
-service-account-signing-key       JWT signing key
-feature-gates                     Feature gate configuration
-kubermatic-configuration-file     Config file (development only)
-namespace                         Kubermatic namespace
```
