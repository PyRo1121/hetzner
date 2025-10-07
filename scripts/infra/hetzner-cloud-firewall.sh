#!/usr/bin/env bash
# Configure Hetzner Cloud Firewall for a Supabase + Workers PoC
# This can be run on any Linux host with internet access (including the server).
#
# Requirements:
# - Hetzner Cloud API token with permission to manage firewalls and servers
# - Server ID or name to attach the firewall to
#
# Usage examples:
#   HCLOUD_TOKEN=xxxx SERVER_NAME=my-server bash hetzner-cloud-firewall.sh
#   HCLOUD_TOKEN=xxxx SERVER_ID=123456 ALLOW_MINIO_CONSOLE=true ALLOW_STUDIO=false bash hetzner-cloud-firewall.sh
#
# Optional env vars:
#   FIREWALL_NAME            Name for firewall (default: supabase-poc-fw)
#   IP_ALLOWLIST_SSH         Comma-separated list of CIDRs for SSH (default: 0.0.0.0/0)
#   ALLOW_MINIO_CONSOLE      true to allow TCP 9001 from 0.0.0.0/0 (default: false)
#   ALLOW_STUDIO             true to allow TCP 3000 from 0.0.0.0/0 (default: false)

set -euo pipefail

log() { echo "[hcloud-fw] $*"; }
err() { echo "[hcloud-fw:ERROR] $*" >&2; }

# Minimum hcloud CLI version required for --rules-from support
HC_VER="v1.42.0"

require_var() {
  local name="$1"; local val
  val=$(printenv "$name" || true)
  if [[ -z "$val" ]]; then
    err "Missing required env var: $name"; exit 1
  fi
}

ensure_jq() {
  if command -v jq >/dev/null 2>&1; then
    log "jq present"
    return
  fi
  log "Installing jq"
  if command -v apt-get >/dev/null 2>&1; then
    if [[ $EUID -eq 0 ]]; then
      apt-get update -y && apt-get install -y jq
    else
      sudo apt-get update -y && sudo apt-get install -y jq
    fi
  elif command -v yum >/dev/null 2>&1; then
    if [[ $EUID -eq 0 ]]; then
      yum install -y jq
    else
      sudo yum install -y jq
    fi
  elif command -v apk >/dev/null 2>&1; then
    if [[ $EUID -eq 0 ]]; then
      apk add --no-cache jq
    else
      sudo apk add --no-cache jq
    fi
  else
    err "jq command not found and automatic install unsupported. Please install jq via your package manager."; exit 1
  fi
}

install_hcloud_cli() {
  local need_install="true"
  if command -v hcloud >/dev/null 2>&1; then
    if hcloud firewall create --help 2>&1 | grep -q -- "--rules-from"; then
      log "hcloud CLI present (supports --rules-from)"
      need_install="false"
    else
      log "hcloud CLI present but missing --rules-from; installing ${HC_VER}"
    fi
  else
    log "Installing hcloud CLI"
  fi
  if [[ "$need_install" != "true" ]]; then
    return
  fi
  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64|amd64) ARCH_LABEL=amd64 ;;
    aarch64|arm64) ARCH_LABEL=arm64 ;;
    *) err "Unsupported architecture: $ARCH"; exit 1 ;;
  esac
  TMP=$(mktemp -d)
  curl -L "https://github.com/hetznercloud/cli/releases/download/${HC_VER}/hcloud-linux-${ARCH_LABEL}.tar.gz" -o "$TMP/hcloud.tar.gz"
  tar -xzf "$TMP/hcloud.tar.gz" -C "$TMP"
  # Locate extracted binary (release archives may be flat or in a subdir)
  if [[ -f "$TMP/hcloud-linux-${ARCH_LABEL}/hcloud" ]]; then
    SRC="$TMP/hcloud-linux-${ARCH_LABEL}/hcloud"
  elif [[ -f "$TMP/hcloud" ]]; then
    SRC="$TMP/hcloud"
  else
    SRC=$(find "$TMP" -maxdepth 2 -type f -name hcloud | head -n1 || true)
    if [[ -z "${SRC:-}" ]]; then
      err "Failed to locate hcloud binary after extraction"; rm -rf "$TMP"; exit 1
    fi
  fi
  install -m 0755 "$SRC" /usr/local/bin/hcloud
  rm -rf "$TMP"
  # Ensure new binary is picked up
  hash -r
}

main() {
  export FIREWALL_NAME=${FIREWALL_NAME:-supabase-poc-fw}
  export IP_ALLOWLIST_SSH=${IP_ALLOWLIST_SSH:-0.0.0.0/0}
  export ALLOW_MINIO_CONSOLE=${ALLOW_MINIO_CONSOLE:-false}
  export ALLOW_STUDIO=${ALLOW_STUDIO:-false}

  require_var HCLOUD_TOKEN
  if [[ -z "${SERVER_ID:-}" && -z "${SERVER_NAME:-}" ]]; then
    err "Provide SERVER_ID or SERVER_NAME"; exit 1
  fi

  install_hcloud_cli
  ensure_jq
  export HCLOUD_TOKEN

  # Resolve server ID if name provided
  if [[ -n "${SERVER_NAME:-}" ]]; then
    SERVER_ID=$(hcloud server list -o columns=ID,NAME | awk -v name="$SERVER_NAME" '$2==name {print $1}')
    if [[ -z "$SERVER_ID" ]]; then
      err "Server named '$SERVER_NAME' not found"; exit 1
    fi
  fi

  log "Creating firewall rules: $FIREWALL_NAME"
  # Build rule set JSON
  RULES=$(jq -n --arg ssh_cidrs "$IP_ALLOWLIST_SSH" --argjson allow_minio $([[ "$ALLOW_MINIO_CONSOLE" == "true" ]] && echo true || echo false) \
                 --argjson allow_studio $([[ "$ALLOW_STUDIO" == "true" ]] && echo true || echo false) '
    def cidrs: ($ssh_cidrs | split(","));
    def base_rules: [
      {direction:"in", protocol:"tcp", port:"22", source_ips: cidrs},
      {direction:"in", protocol:"tcp", port:"80", source_ips: ["0.0.0.0/0","::/0"]},
      {direction:"in", protocol:"tcp", port:"443", source_ips: ["0.0.0.0/0","::/0"]}
    ];
    def minio: [{direction:"in", protocol:"tcp", port:"9001", source_ips: ["0.0.0.0/0","::/0"]}];
    def studio: [{direction:"in", protocol:"tcp", port:"3000", source_ips: ["0.0.0.0/0","::/0"]}];
    {
      rules: (base_rules
        + (if $allow_minio then minio else [] end)
        + (if $allow_studio then studio else [] end)
      )
    }
  ')

  # Create or update firewall
  FW_ID=$(hcloud firewall list -o columns=ID,NAME | awk -v name="$FIREWALL_NAME" '$2==name {print $1}')
  if [[ -z "$FW_ID" ]]; then
    log "Creating new firewall: $FIREWALL_NAME"
    FW_ID=$(echo "$RULES" | hcloud firewall create --name "$FIREWALL_NAME" --rules-from - -o columns=ID | tail -n1)
  else
    log "Updating firewall: $FIREWALL_NAME"
    echo "$RULES" | hcloud firewall update "$FW_ID" --rules-from - >/dev/null
  fi

  log "Attaching firewall ($FW_ID) to server ($SERVER_ID)"
  hcloud firewall apply-to-resource "$FW_ID" --type server --server "$SERVER_ID" >/dev/null

  log "Firewall configured and attached. Rules:"
  hcloud firewall describe "$FW_ID" | sed -n '/rules:/,$p'
}

main "$@"