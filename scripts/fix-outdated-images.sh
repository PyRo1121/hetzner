#!/bin/bash

# Fix Outdated Kubernetes Images Script
# Addresses ImagePullBackOff errors caused by outdated Docker images

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log "kubectl is available and cluster is accessible"
}

# Check if helm is available
check_helm() {
    if ! command -v helm &> /dev/null; then
        error "helm is not installed or not in PATH"
        exit 1
    fi
    
    log "helm is available"
}

# Update Helm repositories
update_helm_repos() {
    log "Updating Helm repositories..."
    helm repo add bitnami https://charts.bitnami.com/bitnami || true
    helm repo update
    log "Helm repositories updated"
}

# Fix MinIO deployment with correct image versions
fix_minio_images() {
    log "Fixing MinIO deployment with correct image versions..."
    
    # Check if MinIO is already deployed
    if helm list -n platform | grep -q minio; then
        log "MinIO deployment found, upgrading with correct images..."
        helm upgrade minio bitnami/minio -n platform \
            --version 14.8.5 \
            --atomic --timeout 15m \
            -f ./values-minio.yaml \
            --wait
    else
        log "MinIO not found, installing with correct images..."
        kubectl create namespace platform --dry-run=client -o yaml | kubectl apply -f -
        helm install minio bitnami/minio -n platform \
            --version 14.8.5 \
            --atomic --timeout 15m \
            -f ./values-minio.yaml \
            --wait
    fi
    
    log "MinIO deployment updated successfully"
}

# Check pod status and wait for readiness
check_pod_status() {
    log "Checking pod status..."
    
    # Wait for MinIO pods to be ready
    kubectl wait --for=condition=Ready pods -l app.kubernetes.io/name=minio -n platform --timeout=300s || {
        warn "MinIO pods not ready within timeout, checking status..."
        kubectl get pods -n platform -l app.kubernetes.io/name=minio
        kubectl describe pods -n platform -l app.kubernetes.io/name=minio
        return 1
    }
    
    log "All MinIO pods are ready"
}

# Verify no ImagePullBackOff errors
verify_no_image_errors() {
    log "Verifying no ImagePullBackOff errors..."
    
    local failed_pods=$(kubectl get pods -n platform --field-selector=status.phase=Failed -o jsonpath='{.items[*].metadata.name}')
    local pending_pods=$(kubectl get pods -n platform --field-selector=status.phase=Pending -o jsonpath='{.items[*].metadata.name}')
    
    if [[ -n "$failed_pods" ]]; then
        warn "Found failed pods: $failed_pods"
        kubectl describe pods $failed_pods -n platform
        return 1
    fi
    
    if [[ -n "$pending_pods" ]]; then
        warn "Found pending pods: $pending_pods"
        kubectl describe pods $pending_pods -n platform
        return 1
    fi
    
    log "No ImagePullBackOff or failed pods found"
}

# Update other potentially outdated images
update_other_images() {
    log "Checking for other outdated images..."
    
    # Check Supabase images
    if kubectl get deployment gotrue -n platform &> /dev/null; then
        local current_image=$(kubectl get deployment gotrue -n platform -o jsonpath='{.spec.template.spec.containers[0].image}')
        info "Current GoTrue image: $current_image"
        
        # Update to latest stable version if needed
        if [[ "$current_image" == *"v2.158.1"* ]]; then
            log "GoTrue image is up to date"
        else
            warn "GoTrue image might need updating: $current_image"
        fi
    fi
    
    # Check Redis image
    if kubectl get deployment redis -n albion-production &> /dev/null; then
        local redis_image=$(kubectl get deployment redis -n albion-production -o jsonpath='{.spec.template.spec.containers[0].image}')
        info "Current Redis image: $redis_image"
        
        if [[ "$redis_image" == "redis:7-alpine" ]]; then
            log "Redis image is up to date"
        else
            warn "Redis image might need updating: $redis_image"
        fi
    fi
    
    # Check PostgreSQL image
    if kubectl get deployment postgres -n albion-production &> /dev/null; then
        local postgres_image=$(kubectl get deployment postgres -n albion-production -o jsonpath='{.spec.template.spec.containers[0].image}')
        info "Current PostgreSQL image: $postgres_image"
        
        if [[ "$postgres_image" == "timescale/timescaledb:latest-pg15" ]]; then
            log "PostgreSQL image is up to date"
        else
            warn "PostgreSQL image might need updating: $postgres_image"
        fi
    fi
}

# Main execution
main() {
    log "Starting outdated image fix process..."
    
    # Check prerequisites
    check_kubectl
    check_helm
    
    # Update repositories
    update_helm_repos
    
    # Fix MinIO images (main issue)
    fix_minio_images
    
    # Check pod status
    check_pod_status
    
    # Verify no image errors
    verify_no_image_errors
    
    # Update other images
    update_other_images
    
    log "Outdated image fix process completed successfully!"
    log "All pods should now be running without ImagePullBackOff errors"
    
    # Show final status
    info "Final pod status:"
    kubectl get pods -n platform
    kubectl get pods -n albion-production
}

# Run main function
main "$@"