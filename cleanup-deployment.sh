#!/bin/bash

# Fast cleanup script for world-class deployment
# Optimized for speed with parallel operations

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️${NC} $1"; }

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

log "🧹 Fast cleanup starting..."

# Quick namespace deletion (no finalizer removal - let K8s handle it)
delete_namespace_fast() {
    local ns=$1
    kubectl delete namespace "$ns" --grace-period=0 --force 2>/dev/null &
}

# Fast Helm uninstall
uninstall_helm_fast() {
    helm uninstall "$1" -n "$2" --no-hooks --timeout 10s 2>/dev/null &
}

log "Step 1: Uninstalling Helm releases (parallel)..."

# Uninstall all Helm releases in parallel
uninstall_helm_fast "prometheus" "monitoring"
uninstall_helm_fast "loki" "monitoring"
uninstall_helm_fast "redis" "databases"
uninstall_helm_fast "minio" "databases"
uninstall_helm_fast "longhorn" "longhorn-system"
uninstall_helm_fast "traefik" "traefik"
uninstall_helm_fast "cert-manager" "cert-manager"
uninstall_helm_fast "kyverno" "kyverno"

wait  # Wait for all Helm uninstalls

log "Step 2: Deleting namespaces (parallel)..."

# Delete all namespaces in parallel (including old deployments)
for ns in nextjs admin ml monitoring uptime-kuma databases kyverno cert-manager traefik longhorn-system albion-stack argocd; do
    delete_namespace_fast "$ns"
done

wait  # Wait for namespace deletions to start

log "Step 3: Cleaning up cluster resources (parallel)..."

# Delete everything in parallel with timeout
(timeout 30 kubectl get crds -o name | grep -E "(longhorn|cert-manager|kyverno|traefik|monitoring.coreos)" | xargs -r kubectl delete --grace-period=0 --force 2>/dev/null) &
(timeout 10 kubectl delete validatingwebhookconfigurations --all --grace-period=0 --force 2>/dev/null) &
(timeout 10 kubectl delete mutatingwebhookconfigurations --all --grace-period=0 --force 2>/dev/null) &
(timeout 20 kubectl get clusterroles -o name | grep -E "(longhorn|traefik|cert-manager|kyverno|prometheus)" | xargs -r kubectl delete --grace-period=0 --force 2>/dev/null) &
(timeout 20 kubectl get clusterrolebindings -o name | grep -E "(longhorn|traefik|cert-manager|kyverno|prometheus)" | xargs -r kubectl delete --grace-period=0 --force 2>/dev/null) &
(timeout 30 kubectl delete pvc --all --all-namespaces --grace-period=0 --force 2>/dev/null) &
(timeout 30 kubectl get pv -o name | xargs -r kubectl delete --grace-period=0 --force 2>/dev/null) &

# Wait max 60 seconds for all background jobs
wait_pids=$!
sleep 60 &
wait -n  # Wait for first to complete (either cleanup or timeout)

log "Step 4: Cleaning up storage..."
rm -rf /var/lib/longhorn/* 2>/dev/null || true

# Kill any remaining background processes
jobs -p | xargs -r kill -9 2>/dev/null || true

log "✅ Fast cleanup completed!"
log "🚀 Ready to deploy: sudo -E bash deploy-worldclass-hybrid-2025.sh"
log ""
log "Note: Some resources may still be terminating in the background."
log "This is normal and won't affect the new deployment."
