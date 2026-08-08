

## Kubernestes Dashboard
- https://github.com/kubernetes-retired/dashboard

## Migration to Headlamp
- Issue: https://github.com/kubermatic/kubermatic/issues/15287

- Headlamp: https://github.com/kubernetes-sigs/headlamp



## Investigation

See [headlamp-migration-investigation.md](./headlamp-migration-investigation.md) for the full investigation with diagrams covering:
- How K8s Dashboard is currently deployed per user cluster
- End-to-end OIDC proxy flow
- All files that need changes (across both repos)
- Challenges and risks with severity ratings
- Recommended migration approach with timeline

See [headlamp-migration-proposal.pdf](./headlamp-migration-proposal.pdf) for the formal proposal document.

## Required changes
We need to change the following things in order to migrate to Headlamp:


- Figure out how currently the dashboard is deployed and how to deploy Headlamp instead.
- How current endpoint currently to work with Kubernetes Dashboard

Investigate KKP Repo `k8c.io/kubermatic` check how Kubenetes Dashboard is deployed inside a User Cluster and how it is exposed to the user. Then figure out how to deploy Headlamp instead and how to expose it to the user.


- What are the required changes in the codebase to support Headlamp instead of Kubernetes Dashboard?

- What would be challenges and blockers to migrate to Headlamp instead of Kubernetes Dashboard?