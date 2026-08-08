#!/usr/bin/env bash
# Headlamp Integration — Local Testing Commands
# Cluster: idqz8k2vr2 | Worktree: kkp.worktree/headlamp-migration
# Updated: 2026-04-01

set -euo pipefail

KUBECONFIG=~/.kube/dev.kubeconfig
export KUBECONFIG
CLUSTER_ID="v99jth46cb"
CLUSTER_NS="cluster-${CLUSTER_ID}"
USER_KUBECONFIG=~/.kube/interim-${CLUSTER_NS}
WORKTREE="/Users/mac/Work/Github/kubermatic/kkp.worktree/headlamp-migration"
CRD_FILE="${WORKTREE}/pkg/crd/k8c.io/kubermatic.k8c.io_clusters.yaml"
WEBHOOK_BACKUP="/tmp/mutating-webhook-clusters-backup.yaml"

# =============================================================================
# STEP 0: Pre-flight — Scale down operator + patch CRD + webhook
# =============================================================================

# Backup mutating webhook (only needed once)
# kubectl get mutatingwebhookconfiguration kubermatic-clusters -o yaml > ${WEBHOOK_BACKUP}

# Scale down operator (it overwrites CRD and restores webhook)
kubectl -n kubermatic scale deploy kubermatic-operator --replicas=0

# Wait for operator pod to terminate
sleep 5

# Replace CRD with headlamp field
kubectl replace -f ${CRD_FILE}

# Delete mutating webhook (it strips unknown fields like spec.headlamp)
kubectl delete mutatingwebhookconfiguration kubermatic-clusters

# Enable headlamp on test cluster
kubectl patch cluster ${CLUSTER_ID} --type=merge -p '{"spec":{"headlamp":{"enabled":true}}}'

# Verify headlamp spec persisted
kubectl get cluster ${CLUSTER_ID} -o jsonpath='{.spec.headlamp}'
echo

# =============================================================================
# STEP 1: Build
# =============================================================================

cd ${WORKTREE}

# Clean build
rm -rf _build
make seed-controller-manager
make user-cluster-controller-manager

# =============================================================================
# STEP 2: Label cluster (only needed once)
# =============================================================================

kubectl label cluster ${CLUSTER_ID} worker-name=headlamplocaltest --overwrite

# =============================================================================
# STEP 3a: Run seed-controller-manager (Terminal 1)
# =============================================================================

# Via script (preferred — auto-fetches Vault secrets):
cd ${WORKTREE}
KUBECONFIG=~/.kube/dev.kubeconfig \
KUBERMATIC_WORKERNAME=headlamplocaltest \
KUBERMATICCOMMIT=$(git rev-parse HEAD) \
  ./hack/run-seed-controller-manager.sh

# =============================================================================
# STEP 3b: Run user-cluster-controller-manager (Terminal 2)
# =============================================================================

# Set namespace context first
kubectl config set-context --current --namespace=${CLUSTER_NS}

cd ${WORKTREE}
OWNER_EMAIL=khizer@kubermatic.com \
KUBECONFIG=~/.kube/dev.kubeconfig \
PPROF_PORT=6601 \
  ./hack/run-user-cluster-controller-manager.sh

# =============================================================================
# STEP 4: Verify — Seed side
# =============================================================================

# Headlamp deployment + secret on seed
kubectl -n ${CLUSTER_NS} get deploy,secret | grep headlamp

# Headlamp pods running?
kubectl -n ${CLUSTER_NS} get pods | grep headlamp

# Pod logs (should have no read-only FS errors)
kubectl -n ${CLUSTER_NS} logs deploy/headlamp -c headlamp

# Init container logs (copy-frontend)
kubectl -n ${CLUSTER_NS} logs deploy/headlamp -c copy-frontend

# =============================================================================
# STEP 5: Verify — User cluster side (RBAC + namespace)
# =============================================================================

# ClusterRole and ClusterRoleBinding created?
KUBECONFIG=${USER_KUBECONFIG} kubectl get clusterrole,clusterrolebinding | grep headlamp

# Headlamp namespace created?
KUBECONFIG=${USER_KUBECONFIG} kubectl get ns headlamp

# =============================================================================
# STEP 6: Port-forward and test UI
# =============================================================================

# Open http://localhost:4466 in browser
kubectl -n ${CLUSTER_NS} port-forward deploy/headlamp 4466:4466

# =============================================================================
# STEP 7: Test disable (optional)
# =============================================================================

# Disable headlamp
kubectl patch cluster ${CLUSTER_ID} --type=merge -p '{"spec":{"headlamp":{"enabled":false}}}'

# Verify resources cleaned up (should return nothing)
kubectl -n ${CLUSTER_NS} get deploy | grep headlamp
KUBECONFIG=${USER_KUBECONFIG} kubectl get clusterrole,clusterrolebinding | grep headlamp

# Re-enable
kubectl patch cluster ${CLUSTER_ID} --type=merge -p '{"spec":{"headlamp":{"enabled":true}}}'

# =============================================================================
# STEP 8: Cleanup — restore operator + webhook
# =============================================================================

# Restore mutating webhook
kubectl apply -f ${WEBHOOK_BACKUP}

# Scale operator back up
kubectl -n kubermatic scale deploy kubermatic-operator --replicas=1

# Remove worker-name label
kubectl label cluster ${CLUSTER_ID} worker-name-

# =============================================================================
# TROUBLESHOOTING
# =============================================================================

# Check if operator is overwriting CRD:
# kubectl -n kubermatic get deploy kubermatic-operator -o jsonpath='{.spec.replicas}'

# Check if headlamp field exists in live CRD:
# kubectl get crd clusters.kubermatic.k8c.io -o json | python3 -c "
# import json,sys
# crd = json.load(sys.stdin)
# props = crd['spec']['versions'][0]['schema']['openAPIV3Schema']['properties']['spec']['properties']
# print('headlamp in CRD:', 'headlamp' in props)"

# Check if webhook is stripping fields:
# kubectl get mutatingwebhookconfiguration kubermatic-clusters

# Kill stuck controller on port 6600:
# lsof -ti :6600 | xargs kill -9

# Kill stuck controller on port 6601:
# lsof -ti :6601 | xargs kill -9
