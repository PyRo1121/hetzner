#!/usr/bin/env bash
# k3s bootstrap for Supabase (self-host PoC) + Observability + Backups
# Target: single-node Hetzner Cloud VM (e.g., CPX11). Requires Ubuntu 22.04.
#
# Usage (run on server via sudo):
#   sudo DOMAIN=example.com EMAIL=admin@example.com bash k3s-bootstrap.sh
#
# Optional env:
#   HCLOUD_TOKEN          Hetzner Cloud API token to configure provider firewall (optional)
#   SERVER_ID             Hetzner Cloud server ID (optional)
#   TZ                    Timezone (default: UTC)
#   PG_PASSWORD           Postgres password (random if omitted)
#   S3_ENDPOINT           S3 endpoint for Storage API (e.g., MinIO or Cloudflare R2)
#   S3_ACCESS_KEY         S3 access key
#   S3_SECRET_KEY         S3 secret key
#   GRAFANA_ADMIN_PASSWORD Grafana admin password (random if omitted)
#
# This script installs:
# - k3s, helm, ingress-nginx, cert-manager (Let's Encrypt HTTP-01)
# - Bitnami Postgres + PGBouncer
# - MinIO (optional if S3_ENDPOINT provided; otherwise local MinIO)
# - Prometheus + Alertmanager + Grafana (kube-prometheus-stack)
# - Loki + Promtail, Blackbox exporter (uptime checks)
# - Supabase core services (Auth/GoTrue, PostgREST, Realtime, Storage API) with path-based Ingress

set -euo pipefail

log() { echo "[k3s-bootstrap] $*"; }
err() { echo "[k3s-bootstrap:ERROR] $*" >&2; }

require_root() {
  if [[ $EUID -ne 0 ]]; then err "Run as root: sudo bash $0"; exit 1; fi
}

require_var() {
  local name="$1"; local val
  val=$(printenv "$name" || true)
  if [[ -z "$val" ]]; then err "Missing required env var: $name"; exit 1; fi
}

rand() { openssl rand -hex 16; }
b64() { printf '%s' "$1" | base64 -w0; }
b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }

generate_jwt() {
  local role="$1"; local secret="$2"; local iat exp header payload h b s
  iat=$(date +%s); exp=$(( iat + 31536000 ))
  header='{"alg":"HS256","typ":"JWT"}'
  payload=$(jq -nc --arg role "$role" --arg iss "supabase" --argjson iat "$iat" --argjson exp "$exp" '{role:$role, iss:$iss, iat:$iat, exp:$exp}')
  h=$(printf '%s' "$header" | b64url)
  b=$(printf '%s' "$payload" | b64url)
  s=$(printf '%s' "$h.$b" | openssl dgst -sha256 -hmac "$secret" -binary | b64url)
  printf '%s.%s.%s' "$h" "$b" "$s"
}

install_prereqs() {
  export TZ=${TZ:-UTC}
  timedatectl set-timezone "$TZ" || true
  apt-get update -y && apt-get upgrade -y
  apt-get install -y curl jq git ufw fail2ban ca-certificates gnupg lsb-release

  ufw default deny incoming
  ufw default allow outgoing
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  yes | ufw enable || true

  cat >/etc/fail2ban/jail.local <<'EOF'
[sshd]
enabled = true
bantime = 10m
findtime = 10m
maxretry = 5
EOF
  systemctl enable --now fail2ban

  # Hetzner provider firewall (optional)
  if [[ -n "${HCLOUD_TOKEN:-}" && -n "${SERVER_ID:-}" ]]; then
    log "Configuring Hetzner Cloud firewall"
    bash -lc "HCLOUD_TOKEN=$HCLOUD_TOKEN SERVER_ID=$SERVER_ID IP_ALLOWLIST_SSH=0.0.0.0/0 $(pwd)/scripts/infra/hetzner-cloud-firewall.sh" || true
  fi
}

install_k3s_helm() {
  log "Installing k3s"
  curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server --write-kubeconfig-mode 644" sh -
  export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
  ln -sf /usr/local/bin/kubectl /usr/bin/kubectl || true
  log "Installing helm"
  curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
}

install_ingress_certmanager() {
  log "Installing ingress-nginx"
  kubectl create namespace ingress-nginx || true
  helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
  helm repo update
  helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx \
    --set controller.metrics.enabled=true

  log "Installing cert-manager"
  kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.4/cert-manager.crds.yaml
  helm repo add jetstack https://charts.jetstack.io
  helm upgrade --install cert-manager jetstack/cert-manager -n cert-manager --create-namespace \
    --set installCRDs=false

  cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt
spec:
  acme:
    email: ${EMAIL}
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-key
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
}

install_db_pool() {
  log "Installing Postgres"
  kubectl create namespace platform || true
  helm repo add bitnami https://charts.bitnami.com/bitnami
  helm upgrade --install postgres bitnami/postgresql -n platform \
    --set auth.postgresPassword=${PG_PASSWORD:-$(rand)} \
    --set primary.persistence.size=20Gi

  log "Installing PGBouncer"
  helm upgrade --install pgbouncer bitnami/pgbouncer -n platform \
    --set auth.username=postgres \
    --set auth.password=$(kubectl get secret -n platform postgres-postgresql -o jsonpath='{.data.postgres-password}' | base64 -d) \
    --set database.host=postgres-postgresql.platform.svc.cluster.local \
    --set replicaCount=1
}

install_minio() {
  if [[ -n "${S3_ENDPOINT:-}" ]]; then
    log "External S3 endpoint provided; skipping MinIO install"
    return
  fi
  log "Installing MinIO"
  helm upgrade --install minio bitnami/minio -n platform --set mode=standalone \
    --set auth.rootUser=${S3_ACCESS_KEY:-minio_access} \
    --set auth.rootPassword=${S3_SECRET_KEY:-minio_secret} \
    --set persistence.size=25Gi
}

install_observability() {
  log "Installing kube-prometheus-stack"
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
  helm upgrade --install kube-prom-stack prometheus-community/kube-prometheus-stack -n monitoring --create-namespace \
    --set grafana.adminPassword=${GRAFANA_ADMIN_PASSWORD:-$(rand)}

  log "Installing Loki + Promtail"
  helm repo add grafana https://grafana.github.io/helm-charts
  helm upgrade --install loki grafana/loki -n monitoring --set persistence.enabled=false
  helm upgrade --install promtail grafana/promtail -n monitoring --set config.lokiAddress=http://loki.monitoring.svc.cluster.local:3100/loki/api/v1/push

  log "Installing Blackbox Exporter"
  helm upgrade --install blackbox-exporter prometheus-community/prometheus-blackbox-exporter -n monitoring
}

deploy_supabase() {
  log "Generating Supabase secrets"
  local jwt_secret anon_key service_role_key db_pass db_url
  jwt_secret=$(rand)
  anon_key=$(generate_jwt anon "$jwt_secret")
  service_role_key=$(generate_jwt service_role "$jwt_secret")
  db_pass=$(kubectl get secret -n platform postgres-postgresql -o jsonpath='{.data.postgres-password}' | base64 -d)
  db_url="postgresql://postgres:${db_pass}@pgbouncer.platform.svc.cluster.local:6432/postgres?sslmode=disable"

  cat <<EOF | kubectl apply -n platform -f -
apiVersion: v1
kind: Secret
metadata:
  name: supabase-secrets
type: Opaque
stringData:
  JWT_SECRET: ${jwt_secret}
  ANON_KEY: ${anon_key}
  SERVICE_ROLE_KEY: ${service_role_key}
  DB_PASSWORD: ${db_pass}
  DB_URL: ${db_url}
  SUPABASE_URL: https://${DOMAIN}
  S3_ENDPOINT: ${S3_ENDPOINT:-http://minio.platform.svc.cluster.local:9000}
  S3_ACCESS_KEY: ${S3_ACCESS_KEY:-minio_access}
  S3_SECRET_KEY: ${S3_SECRET_KEY:-minio_secret}
EOF

  log "Applying Supabase core manifests"
  kubectl apply -n platform -f /root/k8s/supabase/namespace.yaml || true
  DOMAIN=${DOMAIN} EMAIL=${EMAIL} envsubst < /root/k8s/supabase/gotrue.yaml | kubectl apply -n platform -f -
  DOMAIN=${DOMAIN} EMAIL=${EMAIL} envsubst < /root/k8s/supabase/postgrest.yaml | kubectl apply -n platform -f -
  DOMAIN=${DOMAIN} EMAIL=${EMAIL} envsubst < /root/k8s/supabase/realtime.yaml | kubectl apply -n platform -f -
  DOMAIN=${DOMAIN} EMAIL=${EMAIL} envsubst < /root/k8s/supabase/storage.yaml | kubectl apply -n platform -f -
  DOMAIN=${DOMAIN} EMAIL=${EMAIL} envsubst < /root/k8s/supabase/ingress.yaml | kubectl apply -n platform -f -
}

install_flux_gitops() {
  if [[ "${ENABLE_GITOPS:-false}" != "true" ]]; then
    log "GitOps disabled; skipping Flux installation"
    return
  fi
  require_var GIT_URL
  export GIT_BRANCH=${GIT_BRANCH:-main}
  export GIT_PATH=${GIT_PATH:-k8s}
  export GIT_INTERVAL=${GIT_INTERVAL:-1m}
  log "Installing Flux CD and bootstrapping GitOps"
  kubectl apply -f https://github.com/fluxcd/flux2/releases/latest/download/install.yaml
  # Wait for CRDs
  kubectl -n flux-system rollout status deployment/flux-controller --timeout=120s || true
  # Create Git source and kustomization
  kubectl -n flux-system apply -f - <<EOF
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: GitRepository
metadata:
  name: app
  namespace: flux-system
spec:
  interval: ${GIT_INTERVAL}
  url: ${GIT_URL}
  ref:
    branch: ${GIT_BRANCH}
EOF
  kubectl -n flux-system apply -f - <<EOF
apiVersion: kustomize.toolkit.fluxcd.io/v1beta2
kind: Kustomization
metadata:
  name: app
  namespace: flux-system
spec:
  interval: ${GIT_INTERVAL}
  path: ${GIT_PATH}
  prune: true
  wait: true
  sourceRef:
    kind: GitRepository
    name: app
EOF
}

print_summary() {
  log "Bootstrap complete"
  echo "Ingress: https://${DOMAIN}/ (TLS via cert-manager)"
  echo "Paths: /auth/v1, /rest/v1, /realtime/v1, /storage/v1"
  echo "Grafana: kube-prometheus-stack (monitoring namespace)"
  echo "Postgres DSN (internal): postgres-postgresql.platform.svc.cluster.local:5432"
  echo "PGBouncer: pgbouncer.platform.svc.cluster.local:6432"
}

main() {
  require_root
  require_var DOMAIN
  require_var EMAIL
  install_prereqs
  install_k3s_helm
  install_ingress_certmanager
  install_db_pool
  install_minio
  install_observability
  # Place manifests in /root/k8s
  mkdir -p /root/k8s/supabase
  cp -r $(pwd)/k8s/supabase/* /root/k8s/supabase/
  deploy_supabase
  install_flux_gitops
  print_summary
}

main "$@"