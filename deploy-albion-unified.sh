#!/usr/bin/bash
# ============================================================================
# ALBION ONLINE WORLD-CLASS WEB HOSTING STACK DEPLOYMENT SCRIPT
# ============================================================================
# Complete Web Hosting Infrastructure for October 2025 Standards
# Features: k3s Orchestration, Supabase, CockroachDB (Low-Latency Replica), DragonflyDB (Redis Drop-In), Grafana v12.2, Loki, Varnish Caching, Next.js Integration, ArgoCD GitOps
# 13 Essential Services - Optimized for Next.js + Enterprise Analytics & Low-Latency GitOps
# ============================================================================

# Exit on any error, unset vars, pipe failures
set -euo pipefail

# ============================================================================
# CONFIGURATION FLAGS - ENABLE/DISABLE SERVICES
# ============================================================================

# Core Infrastructure (Always enabled for web hosting)
ENABLE_K3S=true             # Lightweight Kubernetes for orchestration
ENABLE_SUPABASE=true        # Database backend (with CockroachDB replica)
ENABLE_MINIO=true          # File storage for web assets
ENABLE_CADDY=false         # Legacy; use Traefik Ingress in k3s

# Essential Web Infrastructure (Keep enabled)
ENABLE_DRAGONFLY=true      # High-throughput caching (Redis-compatible)
ENABLE_PROMETHEUS=true     # Metrics collection
ENABLE_GRAFANA=true        # Dashboards (v12.2)
ENABLE_LOKI=true          # Log aggregation

# Optional Advanced Features
ENABLE_COCKROACH=true      # Distributed low-latency DB replica
ENABLE_VARNISH=true        # Edge caching for sub-50ms responses
ENABLE_NEXTJS=true         # Next.js app deployment
ENABLE_ARGOCD=true         # GitOps with ArgoCD (v2.13.0 / Helm 8.5.8)

# Management Tools
ENABLE_PGADMIN=true        # Database admin
ENABLE_UPTIME_KUMA=true    # Uptime monitoring

# Logging & Observability
ENABLE_PROMTAIL=true       # Log shipping
ENABLE_NODE_EXPORTER=true  # System metrics
ENABLE_CADVISOR=true       # Container metrics

# Optional: Docker auth (for fallback pulls)
ENABLE_DOCKER_AUTH="${ENABLE_DOCKER_AUTH:-false}"

# Core configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-production}"
K3S_VERSION="v1.34.1+k3s1"  # Latest as of Oct 2025
DOCKER_VERSION="28.5"       # Fallback if needed
SUPABASE_HELM_VERSION="0.1.0"  # Latest Helm chart
GRAFANA_VERSION="12.2.0"    # Latest Oct 2025
REDIS_VERSION="7.2"         # Open-source base for Dragonfly
CADDY_VERSION="2.9"         # If enabled
ARGOCD_HELM_VERSION="8.5.8"  # Latest Helm chart as of Oct 2025

# Enhanced logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] [DEPLOY]${NC} $*"; }
success() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS]${NC} $*"; }
warning() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] [WARNING]${NC} $*"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR]${NC} $*" >&2; }

# Trap errors for cleanup
trap 'error "Script failed at line $LINENO"; cleanup' ERR

cleanup() {
    log "🧹 Running cleanup..."
    k3s kubectl delete ns albion-stack --ignore-not-found || true
    k3s kubectl delete ns argocd --ignore-not-found || true
}

# Enhanced retry with backoff
retry_with_backoff() {
    local max_attempts=$1 delay=$2; shift 2
    local attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        log "Executing: $* (attempt $attempt)"
        if (set -o pipefail; eval "$@"); then
            return 0
        fi
        if [[ $attempt -eq $max_attempts ]]; then
            error "Failed after $max_attempts attempts: $*"
            return 1
        fi
        warning "Retry in ${delay}s..."
        sleep $delay
        delay=$((delay * 2))
        ((attempt++))
    done
}

# Health wait for k8s resources
wait_for_health() {
    local resource=$1 namespace=${2:-albion-stack}
    retry_with_backoff 30 10 "k3s kubectl wait --for=condition=ready $resource -n $namespace --timeout=60s"
    success "$resource is healthy"
}

# ============================================================================
# PREREQUISITE CHECKS - OCTOBER 2025 STANDARDS
# ============================================================================

check_prerequisites() {
    log "🔍 Running prerequisite checks (October 2025 standards)..."

    if [[ $EUID -ne 0 ]]; then
        error "Run as root: sudo bash $0"
        exit 1
    fi

    if [[ ! -f "${SCRIPT_DIR}/.env" ]]; then
        error "Secrets file not found!"
        error "Please create a '.env' file in the script directory: ${SCRIPT_DIR}/.env"
        exit 1
    fi

    if ! curl -s --connect-timeout 5 https://cloudflare.com >/dev/null; then
        error "No internet"
        exit 1
    fi

    if [[ $(free -m | awk '/Mem:/ {print $2}') -lt 4096 ]]; then
        warning "Low RAM (<4GB); may impact k3s"
    fi

    success "✅ Checks passed"
}

# ============================================================================
# PHASE 1: SYSTEM SETUP - 2025 STANDARDS
# ============================================================================

setup_system() {
    log "🔧 === PHASE 1: System Setup ==="

    retry_with_backoff 3 5 "apt-get update -y"
    retry_with_backoff 3 5 "apt-get upgrade -y"
    retry_with_backoff 3 5 "apt-get autoremove -y"

    retry_with_backoff 3 5 "apt-get install -y \
        ufw fail2ban unattended-upgrades apt-transport-https \
        ca-certificates curl wget jq unzip htop iotop ncdu git openssl \
        containerd.io build-essential python3 python3-pip"

    # UFW: Tighten for k3s
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 6443/tcp
    ufw limit ssh
    echo "y" | ufw enable

    # Unattended upgrades
    cat >/etc/apt/apt.conf.d/50unattended-upgrades <<EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}";
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "02:00";
EOF
    systemctl enable --now unattended-upgrades

    success "✅ System setup done"
}

# ============================================================================
# PHASE 2: K3S CLUSTER - 2025 STANDARDS
# ============================================================================

setup_k3s() {
    log "☸️ === PHASE 2: k3s Setup (v1.34.1) ==="

    # Check if k3s is already running to avoid reinstallation
    if ! systemctl is-active --quiet k3s; then
        curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="$K3S_VERSION" sh -s - server --disable=traefik --write-kubeconfig-mode 644
    else
        log "✅ k3s is already running"
    fi

    export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

    # Wait for k3s to be ready with better error handling
    retry_with_backoff 10 15 "k3s kubectl get nodes | grep -q Ready"

    # Install Helm if not present
    if ! command -v helm &> /dev/null; then
        curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    fi

    # Longhorn for PVs (skip if already installed)
    helm repo add longhorn https://charts.longhorn.io 2>/dev/null || true
    helm repo update
    k3s kubectl create ns longhorn-system --dry-run=client -o yaml | k3s kubectl apply -f - || true

    if ! helm list -n longhorn-system | grep -q longhorn; then
        helm upgrade --install longhorn longhorn/longhorn --namespace longhorn-system --wait
    else
        log "✅ Longhorn already installed"
    fi

    # Traefik Ingress (skip if already installed)
    helm repo add traefik https://traefik.github.io/charts 2>/dev/null || true
    if ! helm list -n traefik | grep -q traefik; then
        helm upgrade --install traefik traefik/traefik --namespace traefik --create-namespace \
          --set providers.kubernetesIngress.enabled=true \
          --set logs.general.level=INFO
    else
        log "✅ Traefik already installed"
    fi

    # App namespace
    k3s kubectl create ns albion-stack --dry-run=client -o yaml | k3s kubectl apply -f - || true

    # Docker Content Trust
    export DOCKER_CONTENT_TRUST=1
    echo 'export DOCKER_CONTENT_TRUST=1' >> /etc/environment

    [[ "$ENABLE_DOCKER_AUTH" == "true" ]] && setup_docker_auth

    success "✅ k3s cluster ready"
}

# ============================================================================
# SECRETS MANAGEMENT - 2025 STANDARDS (FIXED)
# ============================================================================

# Helper function to validate .env file format
validate_env_file() {
    local env_file="$1"
    local line_num=0

    while IFS= read -r line || [[ -n "$line" ]]; do
        ((line_num++))

        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

        # Basic format check - just ensure there's an equals sign somewhere in the line
        if ! [[ "$line" =~ = ]]; then
            error "Line $line_num: Invalid format - missing equals sign"
            error "Line: $line"
            return 1
        fi
    done < "$env_file"

    return 0
}

setup_secrets() {
    log "🔐 === Secrets Setup from local .env file ==="

    SECRETS_FILE="${SCRIPT_DIR}/.env"

    # Check if .env file exists
    if [[ ! -f "$SECRETS_FILE" ]]; then
        error "❌ Secrets file $SECRETS_FILE not found"
        log "Please create a .env file based on scripts/infra/.env.example"
        exit 1
    fi

    # Validate .env file format before sourcing
    log "Validating .env file format..."
    if ! validate_env_file "$SECRETS_FILE"; then
        error "❌ Invalid .env file format. Please check for unquoted special characters."
        exit 1
    fi

    # Source the .env file with error handling
    log "Sourcing environment variables from $SECRETS_FILE"
    set -a  # Automatically export all variables

    # Use a safer method to source the file
    if ! (set -e; source "$SECRETS_FILE"); then
        error "❌ Failed to source .env file. Check for syntax errors."
        log "Common issues:"
        log "  - Unquoted values with special characters (use quotes: VAR=\"value\")"
        log "  - Missing = signs"
        log "  - Invalid variable names"
        exit 1
    fi

    set +a
    success "✅ Environment variables sourced from $SECRETS_FILE"

    # Validate required variables
    local required_vars=("DOMAIN" "EMAIL" "POSTGRES_PASSWORD")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required variable '$var' is not set in your .env file."
            exit 1
        fi
    done

    if ! [[ "$DOMAIN" =~ ^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        error "Invalid DOMAIN in .env file: $DOMAIN"
        exit 1
    fi

    # Create k8s Secret
    k3s kubectl create secret generic app-secrets --from-env-file="$SECRETS_FILE" -n albion-stack --dry-run=client -o yaml | k3s kubectl apply -f -

    # ArgoCD secret
    k3s kubectl create ns argocd --dry-run=client -o yaml | k3s kubectl apply -f - || true
    if [[ -n "${ARGOCD_ADMIN_PASS:-}" ]]; then
        k3s kubectl create secret generic argocd-secrets \
          --from-literal=admin.password="$ARGOCD_ADMIN_PASS" \
          -n argocd --dry-run=client -o yaml | k3s kubectl apply -f -
    else
        warning "ARGOCD_ADMIN_PASS not set, using default ArgoCD password"
    fi

    success "✅ Secrets loaded from ${SECRETS_FILE}"
}

# ============================================================================
# DOCKER AUTH (FALLBACK)
# ============================================================================

setup_docker_auth() {
    log "🐳 Docker Auth for Rate Limits"
    if docker info 2>/dev/null | grep -q "Username:"; then
        log "✅ Authenticated"
        return
    fi
    read -p "Docker username: " DOCKER_USER
    read -s -p "Token: " DOCKER_TOKEN
    echo "$DOCKER_TOKEN" | docker login --username "$DOCKER_USER" --password-stdin
    success "✅ Auth done"
}

# ============================================================================
# PHASE 3: ARGOCD GITOPS - 2025 HELM
# ============================================================================

setup_argocd() {
    [[ "$ENABLE_ARGOCD" != "true" ]] && return

    log "🔄 === PHASE 3: ArgoCD GitOps (Helm 8.5.8) ==="

    helm repo add argo https://argoproj.github.io/argo-helm 2>/dev/null || true
    helm repo update

    cat > /tmp/argocd-values.yaml << EOF
server:
  extraArgs:
  - --insecure
  resources:
    requests:
      cpu: 250m
      memory: 64Mi
    limits:
      cpu: 500m
      memory: 128Mi
configs:
  params:
  - server.insecure=true
  rbacConfig: |
    policy.default: role:readonly
repoAccess:
  enablePrivateRepo: true
EOF

    k3s kubectl create ns argocd --dry-run=client -o yaml | k3s kubectl apply -f - || true

    if ! helm list -n argocd | grep -q argocd; then
        helm upgrade --install argocd argo/argo-cd --namespace argocd \
          -f /tmp/argocd-values.yaml \
          --version $ARGOCD_HELM_VERSION --wait
    else
        log "✅ ArgoCD already installed"
    fi

    wait_for_health "deployment/argocd-server" "argocd"

    # Ingress
    cat > /tmp/argocd-ingress.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-ingress
  namespace: argocd
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
spec:
  rules:
  - host: argocd.$DOMAIN
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: argocd-server
            port:
              number: 80
  tls:
  - secretName: argocd-tls
EOF
    k3s kubectl apply -f /tmp/argocd-ingress.yaml

    # Example App
    if [[ -n "${GIT_REPO_URL:-}" ]]; then
        cat > /tmp/albion-app.yaml << EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: albion-stack
  namespace: argocd
spec:
  project: default
  source:
    repoURL: $GIT_REPO_URL
    targetRevision: HEAD
    path: k8s/manifests
    helm:
      values: |
        global:
          domain: $DOMAIN
  destination:
    server: https://kubernetes.default.svc
    namespace: albion-stack
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
EOF
        k3s kubectl apply -f /tmp/albion-app.yaml
    fi

    ARGOCD_PASS=$(k3s kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>/dev/null | base64 -d || echo "Not available")
    log "ArgoCD admin password: $ARGOCD_PASS"

    success "✅ ArgoCD deployed at https://argocd.$DOMAIN"
}

# ============================================================================
# PHASE 4: SUPABASE ON K3S
# ============================================================================

setup_supabase() {
    [[ "$ENABLE_SUPABASE" != "true" ]] && return
    log "🐘 === PHASE 4: Supabase (Helm) ==="

    helm repo add supabase https://supabase.github.io/charts 2>/dev/null || true
    helm repo update

    cat > /tmp/supabase-values.yaml << EOF
global:
  domain: ${DOMAIN:-localhost}
auth:
  jwtSecret: ${SUPABASE_JWT_SECRET:-default-jwt-secret}
postgres:
  password: ${POSTGRES_PASSWORD}
  pgVersion: "16"
kong:
  enabled: true
storage:
  anonKey: ${SUPABASE_ANON_KEY:-default-anon-key}
  serviceRoleKey: ${SUPABASE_SERVICE_ROLE_KEY:-default-service-key}
EOF

    if ! helm list -n albion-stack | grep -q supabase; then
        helm upgrade --install supabase supabase/supabase --namespace albion-stack \
          -f /tmp/supabase-values.yaml \
          --set global.database.existingSecret=app-secrets --wait
    else
        log "✅ Supabase already installed"
    fi

    wait_for_health "pod -l app.kubernetes.io/name=postgres"

    success "✅ Supabase deployed"
}

# ============================================================================
# PHASE 5: COCKROACHDB REPLICA
# ============================================================================

setup_cockroach() {
    [[ "$ENABLE_COCKROACH" != "true" ]] && return

    log "🪳 === PHASE 5: CockroachDB Replica ==="

    helm repo add cockroachdb https://charts.cockroachdb.com/ 2>/dev/null || true
    helm repo update

    if ! helm list -n albion-stack | grep -q cockroachdb; then
        helm upgrade --install cockroachdb cockroachdb/cockroachdb --namespace albion-stack \
          --set statefulset.replicas=3 \
          --set tls.enabled=false \
          --set conf.insecure=true \
          --set resources.requests.memory="2Gi" --wait
    else
        log "✅ CockroachDB already installed"
    fi

    wait_for_health "statefulset/cockroachdb"

    success "✅ CockroachDB ready"
}

# ============================================================================
# PHASE 6: DRAGONFLYDB CACHING
# ============================================================================

setup_dragonfly() {
    [[ "$ENABLE_DRAGONFLY" != "true" ]] && return
    log "🐉 === PHASE 6: DragonflyDB ==="

    helm repo add dragonflydb https://charts.dragonflydb.io 2>/dev/null || true
    helm repo update

    if ! helm list -n albion-stack | grep -q dragonfly; then
        helm upgrade --install dragonfly dragonflydb/dragonfly --namespace albion-stack \
          --set auth.password="${DRAGONFLY_PASS:-default-pass}" \
          --set persistence.enabled=true --wait
    else
        log "✅ DragonflyDB already installed"
    fi

    wait_for_health "statefulset/dragonfly"

    success "✅ DragonflyDB ready"
}

# ============================================================================
# PHASE 7: MINIO STORAGE
# ============================================================================

setup_minio() {
    [[ "$ENABLE_MINIO" != "true" ]] && return
    log "🗄️ === PHASE 7: MinIO ==="

    helm repo add minio https://charts.min.io/ 2>/dev/null || true
    helm repo update

    if ! helm list -n albion-stack | grep -q minio; then
        helm upgrade --install minio minio/minio --namespace albion-stack \
          --set rootUser="${MINIO_ROOT_USER:-admin}" \
          --set rootPassword="${MINIO_ROOT_PASS:-changeme}" \
          --set resources.requests.memory="256Mi" --wait
    else
        log "✅ MinIO already installed"
    fi

    wait_for_health "deployment/minio"

    success "✅ MinIO ready"
}

# ============================================================================
# PHASE 8: MONITORING STACK
# ============================================================================

setup_monitoring() {
    [[ "$ENABLE_PROMETHEUS" != "true" ]] && return
    log "📊 === PHASE 8: Monitoring ==="

    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>/dev/null || true
    helm repo update

    if ! helm list -n albion-stack | grep -q monitoring; then
        helm upgrade --install monitoring prometheus-community/kube-prometheus-stack --namespace albion-stack \
          --set grafana.adminPassword="${GRAFANA_ADMIN_PASS:-admin}" \
          --set grafana.enabled=true \
          --set prometheus.prometheusSpec.retention=15d --wait
    else
        log "✅ Monitoring stack already installed"
    fi

    # Loki
    helm repo add grafana https://grafana.github.io/helm-charts 2>/dev/null || true
    if ! helm list -n albion-stack | grep -q loki; then
        helm upgrade --install loki grafana/loki --namespace albion-stack \
          --set persistence.enabled=true --wait
    fi

    if ! helm list -n albion-stack | grep -q promtail; then
        helm upgrade --install promtail grafana/promtail --namespace albion-stack \
          --set config.clients[0].url=http://loki-stack.albion-stack.svc.cluster.local:3100/loki/api/v1/push --wait
    fi

    wait_for_health "deployment/monitoring-grafana"

    success "✅ Monitoring ready"
}

# ============================================================================
# PHASE 9: VARNISH CACHING
# ============================================================================

setup_varnish() {
    [[ "$ENABLE_VARNISH" != "true" ]] && return

    log "⚡ === PHASE 9: Varnish Edge Cache ==="

    cat > /tmp/varnish-cm.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: varnish-config
  namespace: albion-stack
data:
  default.vcl: |
    vcl 4.1;
    backend default { .host = "supabase-kong.albion-stack.svc.cluster.local"; .port = "8000"; }
    sub vcl_recv { if (req.method == "GET") { return(hash); } }
EOF
    k3s kubectl apply -f /tmp/varnish-cm.yaml

    k3s kubectl apply -f - << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: varnish
  namespace: albion-stack
spec:
  replicas: 1
  selector:
    matchLabels:
      app: varnish
  template:
    metadata:
      labels:
        app: varnish
    spec:
      containers:
      - name: varnish
        image: varnish:7.4-alpine
        ports:
        - containerPort: 80
        volumeMounts:
        - name: config
          mountPath: /etc/varnish
      volumes:
      - name: config
        configMap:
          name: varnish-config
EOF

    wait_for_health "deployment/varnish"

    success "✅ Varnish ready"
}

# ============================================================================
# PHASE 10: NEXT.JS DASHBOARD DEPLOYMENT (YOUR GITHUB REPO)
# ============================================================================

setup_nextjs() {
    [[ "$ENABLE_NEXTJS" != "true" ]] && return

    log "🌐 === PHASE 10: Next.js Dashboard (PyRo1121/hetzner) ==="

    # Clone and build your Next.js dashboard
    local repo_dir="/opt/hetzner-dashboard"

    if [[ ! -d "$repo_dir" ]]; then
        log "📥 Cloning your Next.js dashboard from GitHub..."
        git clone https://github.com/PyRo1121/hetzner.git "$repo_dir"
    else
        log "🔄 Updating existing dashboard repository..."
        cd "$repo_dir" && git pull
    fi

    # Build the Docker image
    log "🐳 Building Docker image for Next.js dashboard..."
    cd "$repo_dir"

    # Create a Dockerfile if not present
    if [[ ! -f "Dockerfile" ]]; then
        cat > Dockerfile << 'EOF'
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
EOF
    fi

    # Build and tag the image
    docker build -t albion-nextjs-dashboard:latest .

    # Deploy to k3s
    log "🚀 Deploying Next.js dashboard to k3s..."
    k3s kubectl apply -f - << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nextjs-dashboard
  namespace: albion-stack
  labels:
    app: nextjs-dashboard
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nextjs-dashboard
  template:
    metadata:
      labels:
        app: nextjs-dashboard
    spec:
      containers:
      - name: nextjs
        image: albion-nextjs-dashboard:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: app-secrets
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
---
apiVersion: v1
kind: Service
metadata:
  name: nextjs-dashboard-service
  namespace: albion-stack
  labels:
    app: nextjs-dashboard
spec:
  selector:
    app: nextjs-dashboard
  ports:
  - name: http
    port: 80
    targetPort: 3000
  type: ClusterIP
EOF

    wait_for_health "deployment/nextjs-dashboard"

    # Main domain ingress - your dashboard at root domain
    k3s kubectl apply -f - << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dashboard-root-ingress
  namespace: albion-stack
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  rules:
  - host: $DOMAIN
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nextjs-dashboard-service
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: supabase-kong
            port:
              number: 8000
  tls:
  - hosts:
    - $DOMAIN
    secretName: wildcard-tls
EOF

    success "✅ Next.js dashboard deployed at https://$DOMAIN"
}

# ============================================================================
# PHASE 11: MANAGEMENT TOOLS
# ============================================================================

setup_pgadmin() {
    [[ "$ENABLE_PGADMIN" != "true" ]] && return
    log "🐘 === PHASE 11: pgAdmin ==="

    helm repo add runix https://helm.runix.net/ 2>/dev/null || true
    helm repo update

    if ! helm list -n albion-stack | grep -q pgadmin4; then
        helm upgrade --install pgadmin4 runix/pgadmin4 --namespace albion-stack \
          --set env.email="${EMAIL}" \
          --set env.password="${GRAFANA_ADMIN_PASS:-admin}" --wait
    else
        log "✅ pgAdmin already installed"
    fi

    wait_for_health "deployment/pgadmin4"

    success "✅ pgAdmin ready"
}

setup_uptime_kuma() {
    [[ "$ENABLE_UPTIME_KUMA" != "true" ]] && return
    log "⏱️ === Uptime Kuma ==="

    helm repo add uptime-kuma https://uptime-kuma-helm.dev/ 2>/dev/null || true
    helm repo update

    if ! helm list -n albion-stack | grep -q uptime-kuma; then
        helm upgrade --install uptime-kuma uptime-kuma/uptime-kuma --namespace albion-stack --wait
    else
        log "✅ Uptime Kuma already installed"
    fi

    wait_for_health "deployment/uptime-kuma"

    success "✅ Uptime Kuma ready"
}

# ============================================================================
# PHASE 12: BACKUPS & MONITORING SCRIPTS
# ============================================================================

setup_backups_and_monitoring() {
    log "💾 === PHASE 12: Backups & Monitoring ==="

    # Backup script
    cat >/opt/backup-albion.sh << 'EOF'
#!/bin/bash
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
PGPOD=$(/usr/local/bin/k3s kubectl get pods -n albion-stack -l app.kubernetes.io/name=postgres -o jsonpath='{.items[0].metadata.name}')
/usr/local/bin/k3s kubectl exec -n albion-stack "$PGPOD" -- pg_dumpall -U postgres > "/opt/backups/db-$(date +%Y%m%d).sql"
EOF
    chmod +x /opt/backup-albion.sh
    mkdir -p /opt/backups
    (crontab -l 2>/dev/null | grep -v backup-albion || true; echo "0 2 * * * /opt/backup-albion.sh") | crontab -

    # Monitor script
    cat >/opt/monitor-albion.sh << 'EOF'
#!/bin/bash
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
echo "=== Albion Stack Status ==="
/usr/local/bin/k3s kubectl get pods -A
/usr/local/bin/k3s kubectl top pods -A
df -h /var/lib/rancher/k3s
free -h
EOF
    chmod +x /opt/monitor-albion.sh

    success "✅ Backups & monitoring set"
}

# ============================================================================
# FINALIZATION
# ============================================================================

finalize_deployment() {
    log "🎉 === Finalization ==="

    cat >/opt/albion-deployment-summary.txt << EOF
=== ALBION NEXT.JS STACK SUMMARY - OCT 2025 ===
Date: $(date)
Domain: $DOMAIN
Orchestration: k3s $K3S_VERSION

SERVICES DEPLOYED:
✅ k3s + Traefik Ingress
✅ ArgoCD (GitOps)
✅ Supabase (PostgreSQL 16)
✅ CockroachDB Replica
✅ DragonflyDB Caching
✅ MinIO Storage
✅ Prometheus/Grafana/Loki
✅ Varnish Edge Cache
✅ Next.js Dashboard (PyRo1121/hetzner)
✅ pgAdmin & Uptime Kuma

ACCESS:
- Dashboard: https://$DOMAIN
- ArgoCD: https://argocd.$DOMAIN
- Grafana: via Ingress

NEXT STEPS:
1. Set up cert-manager for TLS
2. Configure DNS records to point to your server
3. Monitor via Grafana
4. Your Next.js dashboard is live at the root domain!
EOF

    cat /opt/albion-deployment-summary.txt

    success "🚀 Deployment complete! Your Next.js dashboard is ready at https://$DOMAIN"
}

# ============================================================================
# MAIN ORCHESTRATION
# ============================================================================

main() {
    log "🚀 Albion Next.js Stack Deploy - Oct 2025"
    check_prerequisites
    setup_system
    [[ "$ENABLE_K3S" == "true" ]] && setup_k3s
    setup_secrets
    [[ "$ENABLE_ARGOCD" == "true" ]] && setup_argocd
    [[ "$ENABLE_SUPABASE" == "true" ]] && setup_supabase
    [[ "$ENABLE_COCKROACH" == "true" ]] && setup_cockroach
    [[ "$ENABLE_DRAGONFLY" == "true" ]] && setup_dragonfly
    [[ "$ENABLE_MINIO" == "true" ]] && setup_minio
    [[ "$ENABLE_PROMETHEUS" == "true" ]] && setup_monitoring
    [[ "$ENABLE_VARNISH" == "true" ]] && setup_varnish
    [[ "$ENABLE_NEXTJS" == "true" ]] && setup_nextjs
    [[ "$ENABLE_PGADMIN" == "true" ]] && setup_pgadmin
    [[ "$ENABLE_UPTIME_KUMA" == "true" ]] && setup_uptime_kuma
    setup_backups_and_monitoring
    finalize_deployment
}

main "$@"
