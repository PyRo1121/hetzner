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

# Prefer /usr/local/bin over system paths (sudo may prioritize /usr/bin)
export PATH="/usr/local/bin:$PATH"

# Minimum hcloud CLI version required for --rules-from support
HC_VER="v1.42.0"
HCLOUD_API="https://api.hetzner.cloud/v1"

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

# ---- REST API helpers (fallback for legacy CLI) ----
api_get_firewall_id_by_name() {
  local name="$1"
  curl -sS -H "Authorization: Bearer $HCLOUD_TOKEN" "$HCLOUD_API/firewalls?per_page=50" \
    | jq -r --arg name "$name" '.firewalls[] | select(.name == $name) | .id' \
    | head -n1
}

api_create_firewall() {
  local name="$1"; local rules_json_array="$2"; local server_id="$3"
  local body
  body=$(jq -n --arg name "$name" --argjson rules $rules_json_array --arg sid "$server_id" '{
    name: $name,
    rules: $rules,
    apply_to: [ { server: { id: ($sid|tonumber) } } ]
  }')
  curl -sS -X POST -H "Authorization: Bearer $HCLOUD_TOKEN" -H "Content-Type: application/json" \
    -d "$body" "$HCLOUD_API/firewalls" \
    | jq -r '.firewall.id'
}

api_set_firewall_rules() {
  local fw_id="$1"; local rules_json_array="$2"
  local body
  body=$(jq -n --argjson rules $rules_json_array '{ rules: $rules }')
  curl -sS -X POST -H "Authorization: Bearer $HCLOUD_TOKEN" -H "Content-Type: application/json" \
    -d "$body" "$HCLOUD_API/firewalls/$fw_id/actions/set_rules" >/dev/null
}

api_apply_firewall_to_server() {
  local fw_id="$1"; local server_id="$2"
  local body
  body=$(jq -n --arg sid "$server_id" '{ apply_to: [ { server: { id: ($sid|tonumber) } } ] }')
  curl -sS -X POST -H "Authorization: Bearer $HCLOUD_TOKEN" -H "Content-Type: application/json" \
    -d "$body" "$HCLOUD_API/firewalls/$fw_id/actions/apply_to_resources" >/dev/null
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
  if hcloud firewall create --help 2>&1 | grep -q -- "--rules-from"; then
    if [[ -z "$FW_ID" ]]; then
      log "Creating new firewall: $FIREWALL_NAME"
      FW_ID=$(echo "$RULES" | hcloud firewall create --name "$FIREWALL_NAME" --rules-from - -o columns=ID | tail -n1)
    else
      log "Updating firewall: $FIREWALL_NAME"
      # Prefer set-rules if available; fallback to update
      if hcloud firewall set-rules --help >/dev/null 2>&1; then
        echo "$RULES" | hcloud firewall set-rules "$FW_ID" --rules-from - >/dev/null
      else
        echo "$RULES" | hcloud firewall update "$FW_ID" --rules-from - >/dev/null
      fi
    fi
  else
    # Legacy CLI fallback: use Hetzner Cloud REST API to set rules and attach
    log "Legacy hcloud CLI detected (no --rules-from). Using REST API fallback."
    RULES_ARRAY=$(echo "$RULES" | jq -c '.rules')
    # Find firewall by name via API
    FW_ID_API=$(api_get_firewall_id_by_name "$FIREWALL_NAME" || true)
    if [[ -z "${FW_ID_API:-}" ]]; then
      log "Creating new firewall via API: $FIREWALL_NAME"
      FW_ID_API=$(api_create_firewall "$FIREWALL_NAME" "$RULES_ARRAY" "$SERVER_ID")
      if [[ -z "${FW_ID_API:-}" ]]; then
        err "API create failed: could not obtain firewall ID"; exit 1
      fi
    else
      log "Updating firewall rules via API: $FIREWALL_NAME ($FW_ID_API)"
      api_set_firewall_rules "$FW_ID_API" "$RULES_ARRAY"
      log "Attaching firewall via API to server ($SERVER_ID)"
      api_apply_firewall_to_server "$FW_ID_API" "$SERVER_ID"
    fi
    FW_ID=${FW_ID_API}
  fi

  log "Attaching firewall ($FW_ID) to server ($SERVER_ID)"
  if hcloud firewall apply-to-resource --help >/dev/null 2>&1; then
    hcloud firewall apply-to-resource "$FW_ID" --type server --server "$SERVER_ID" >/dev/null
  else
    # Already handled via API in legacy branch; no-op
    :
  fi

  log "Firewall configured and attached. Rules:"
  hcloud firewall describe "$FW_ID" | sed -n '/rules:/,$p'
}

main "$@"