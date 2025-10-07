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

# hcloud CLI version for basic operations (list, describe, apply)
HC_VER="v1.53.0"
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
    log "hcloud CLI present"
    need_install="false"
  else
    log "Installing hcloud CLI ${HC_VER}"
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
  log "hcloud CLI installed successfully"
}

# ---- REST API helpers (primary method for rules) ----
api_get_firewall_id_by_name() {
  local name="$1"
  curl -sS -H "Authorization: Bearer $HCLOUD_TOKEN" "$HCLOUD_API/firewalls?per_page=50" \
    | jq -r --arg name "$name" '.firewalls[] | select(.name == $name) | .id' \
    | head -n1
}

api_create_firewall() {
  local name="$1"; local rules_json_array="$2"; local server_id="$3"
  local body response fw_id
  body=$(jq -n --arg name "$name" --argjson rules $rules_json_array --arg sid "$server_id" '{
    name: $name,
    rules: $rules,
    apply_to: [ { server: { id: ($sid|tonumber) } } ]
  }')
  response=$(curl -sS -w "%{http_code}" -X POST -H "Authorization: Bearer $HCLOUD_TOKEN" -H "Content-Type: application/json" \
    -d "$body" "$HCLOUD_API/firewalls")
  http_code="${response: -3}"
  response_body="${response%???}"
  if [[ "$http_code" != "201" ]]; then
    log "API create response (HTTP $http_code): $response_body"
    err "Failed to create firewall: HTTP $http_code (check token has Read & Write permissions for firewalls)"; exit 1
  fi
  fw_id=$(echo "$response_body" | jq -r '.firewall.id // empty')
  if [[ -z "$fw_id" ]]; then
    log "API create response body: $response_body"
    err "Failed to extract firewall ID from response"; exit 1
  fi
  echo "$fw_id"
}

api_set_firewall_rules() {
  local fw_id="$1"; local rules_json_array="$2"
  local body response http_code response_body
  body=$(jq -n --argjson rules $rules_json_array '{ rules: $rules }')
  response=$(curl -sS -w "%{http_code}" -X POST -H "Authorization: Bearer $HCLOUD_TOKEN" -H "Content-Type: application/json" \
    -d "$body" "$HCLOUD_API/firewalls/$fw_id/actions/set_rules")
  http_code="${response: -3}"
  response_body="${response%???}"
  if [[ "$http_code" != "202" ]]; then
    log "API set rules response (HTTP $http_code): $response_body"
    err "Failed to set firewall rules: HTTP $http_code"; exit 1
  fi
  if [[ "$(echo "$response_body" | jq -r '.action.id // empty')" == "empty" ]]; then
    log "API set rules response body: $response_body"
    err "Failed to extract action ID from set rules response"; exit 1
  fi
  log "Rules set successfully (action ID: $(echo "$response_body" | jq -r '.action.id'))"
}

api_apply_firewall_to_server() {
  local fw_id="$1"; local server_id="$2"
  local body response http_code response_body
  body=$(jq -n --arg sid "$server_id" '{ apply_to: [ { server: { id: ($sid|tonumber) } } ] }')
  response=$(curl -sS -w "%{http_code}" -X POST -H "Authorization: Bearer $HCLOUD_TOKEN" -H "Content-Type: application/json" \
    -d "$body" "$HCLOUD_API/firewalls/$fw_id/actions/apply_to_resources")
  http_code="${response: -3}"
  response_body="${response%???}"
  if [[ "$http_code" != "202" ]]; then
    log "API apply response (HTTP $http_code): $response_body"
    err "Failed to apply firewall to server: HTTP $http_code"; exit 1
  fi
  if [[ "$(echo "$response_body" | jq -r '.action.id // empty')" == "empty" ]]; then
    log "API apply response body: $response_body"
    err "Failed to extract action ID from apply response"; exit 1
  fi
  log "Firewall applied successfully (action ID: $(echo "$response_body" | jq -r '.action.id'))"
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

  # Use REST API for create/update/apply (reliable for multiple rules)
  log "Using Hetzner Cloud REST API for firewall management."
  RULES_ARRAY=$(echo "$RULES" | jq -c '.rules')
  # Find firewall by name via API
  FW_ID=$(api_get_firewall_id_by_name "$FIREWALL_NAME" || true)
  if [[ -z "${FW_ID:-}" ]]; then
    log "Creating new firewall via API: $FIREWALL_NAME"
    FW_ID=$(api_create_firewall "$FIREWALL_NAME" "$RULES_ARRAY" "$SERVER_ID")
  else
    log "Updating firewall rules via API: $FIREWALL_NAME ($FW_ID)"
    api_set_firewall_rules "$FW_ID" "$RULES_ARRAY"
    log "Re-attaching firewall via API to server ($SERVER_ID)"
    api_apply_firewall_to_server "$FW_ID" "$SERVER_ID"
  fi

  log "Firewall configured and attached. Rules:"
  hcloud firewall describe "$FW_ID" | sed -n '/rules:/,$p'
}

main "$@"
