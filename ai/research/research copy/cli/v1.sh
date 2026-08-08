#!/usr/bin/env bash
# Headlamp Integration — Local Testing Commands
# Cluster: idqz8k2vr2 | Worktree: kkp.worktree/headlamp-migration
# Updated: 2026-04-01

set -euo pipefail

KUBECONFIG=~/.kube/dev.kubeconfig
export KUBECONFIG
CLUSTER_ID="bdjghjndvs"
CLUSTER_NS="cluster-${CLUSTER_ID}"
USER_KUBECONFIG="~/.kube/interim-${CLUSTER_NS}"
WORKTREE="/Users/mac/Work/Github/kubermatic/kkp.worktree/headlamp-migration"
CRD_FILE="${WORKTREE}/pkg/crd/k8c.io/kubermatic.k8c.io_clusters.yaml"
WEBHOOK_BACKUP="/tmp/mutating-webhook-clusters-backup.yaml"

# Backup webhook (once)
kubectl get mutatingwebhookconfiguration kubermatic-clusters -o yaml > /tmp/mutating-webhook-clusters-backup.yaml

# Scale down operator
kubectl -n kubermatic scale deploy kubermatic-operator --replicas=0

# Replace CRD (adds spec.headlamp)
kubectl replace -f ${CRD_FILE}

# Delete webhook (stops it stripping unknown fields)
kubectl delete mutatingwebhookconfiguration kubermatic-clusters

# Enable headlamp
kubectl patch cluster ${CLUSTER_ID} --type=merge -p '{"spec":{"headlamp":{"enabled":true}}}'

# Verify it persisted
kubectl get cluster ${CLUSTER_ID} -o jsonpath='{.spec.headlamp}' && echo

# # Step 1: Build
# cd ${WORKTREE}
# rm -rf _build
# make seed-controller-manager
# make user-cluster-controller-manager

# Step 1: Label cluster
kubectl label cluster ${CLUSTER_ID} worker-name=headlamplocaltest --overwrite

# Step 2a: Run seed controller (Terminal 1)
cd ${WORKTREE}
KUBECONFIG=~/.kube/dev.kubeconfig \
KUBERMATIC_WORKERNAME=headlamplocaltest \
KUBERMATICCOMMIT=$(git rev-parse HEAD) \
  ./hack/run-seed-controller-manager.sh

# Step 2b: Run user-cluster controller (Terminal 2)
kubectl config set-context --current --namespace=${CLUSTER_NS}

cd ${WORKTREE}
OWNER_EMAIL=khizer@kubermatic.com \
KUBECONFIG=~/.kube/dev.kubeconfig \
PPROF_PORT=6601 \
  ./hack/run-user-cluster-controller-manager.sh

# Step 4: Verify seed side
kubectl -n ${CLUSTER_NS} get deploy,secret | grep headlamp
kubectl -n ${CLUSTER_NS} get pods | grep headlamp
kubectl -n ${CLUSTER_NS} logs deploy/headlamp -c headlamp

# Step 5: Verify user cluster RBAC
KUBECONFIG=~/.kube/interim-${CLUSTER_NS} kubectl get clusterrole,clusterrolebinding | grep headlamp
KUBECONFIG=~/.kube/interim-${CLUSTER_NS} kubectl get ns headlamp

# Step 6: Test UI
kubectl -n ${CLUSTER_NS} port-forward deploy/headlamp 4466:4466
# Open http://localhost:4466

# Step 7: Test disable/enable lifecycle
# Disable
kubectl patch cluster ${CLUSTER_ID} --type=merge -p '{"spec":{"headlamp":{"enabled":false}}}'
kubectl -n ${CLUSTER_NS} get deploy | grep headlamp  # should be empty

# Re-enable
kubectl patch cluster ${CLUSTER_ID} --type=merge -p '{"spec":{"headlamp":{"enabled":true}}}'

# Step 8: Cleanup
kubectl apply -f /tmp/mutating-webhook-clusters-backup.yaml
kubectl -n kubermatic scale deploy kubermatic-operator --replicas=1
kubectl label cluster ${CLUSTER_ID} worker-name-

# Troubleshooting
# Kill stuck controller on port 6600/6601
lsof -ti :6600 | xargs kill -9
lsof -ti :6601 | xargs kill -9

# Check if headlamp field exists in CRD
kubectl get crd clusters.kubermatic.k8c.io -o json | python3 -c "
import json,sys
props=json.load(sys.stdin)['spec']['versions'][0]['schema']['openAPIV3Schema']['properties']['spec']['properties']
print('headlamp in CRD:', 'headlamp' in props)"
