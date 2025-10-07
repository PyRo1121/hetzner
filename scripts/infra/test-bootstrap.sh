#!/bin/bash

# Test Bootstrap Script - Dry Run Version
# This script validates the environment and checks prerequisites without making changes
# Use this to test the bootstrap script logic before running on your server

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

log_success() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log_error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Test functions
test_domain_resolution() {
  local domain="$1"
  log "Testing domain resolution for: $domain"

  if command -v nslookup >/dev/null 2>&1; then
    if nslookup "$domain" >/dev/null 2>&1; then
      log_success "Domain $domain resolves successfully"
      return 0
    else
      log_warning "Domain $domain does not resolve. Ensure DNS is configured."
      return 1
    fi
  else
    log_warning "nslookup not available. Skipping DNS test."
    return 0
  fi
}

test_email_format() {
  local email="$1"
  log "Validating email format: $email"

  if [[ "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    log_success "Email format is valid"
    return 0
  else
    log_error "Invalid email format: $email"
    return 1
  fi
}

check_system_requirements() {
  log "Checking system requirements..."

  # Check OS
  if [[ -f /etc/os-release ]]; then
    source /etc/os-release
    log "Detected OS: $NAME $VERSION"

    if [[ "$ID" == "ubuntu" ]]; then
      if [[ "$VERSION_ID" == "22.04" || "$VERSION_ID" == "24.04" ]]; then
        log_success "Ubuntu version is supported: $VERSION_ID"
      else
        log_warning "Ubuntu version $VERSION_ID may not be fully tested"
      fi
    else
      log_warning "Non-Ubuntu OS detected. Script is optimized for Ubuntu 22.04/24.04"
    fi
  else
    log_warning "Cannot detect OS version"
  fi

  # Check available disk space
  local available_space=$(df / | awk 'NR==2 {print $4}')
  local available_gb=$((available_space / 1024 / 1024))

  log "Available disk space: ${available_gb}GB"
  if [[ $available_gb -ge 20 ]]; then
    log_success "Sufficient disk space available"
  else
    log_error "Insufficient disk space. Need at least 20GB, have ${available_gb}GB"
  fi

  # Check available memory
  local total_mem=$(free -m | awk 'NR==2{print $2}')
  log "Total memory: ${total_mem}MB"

  if [[ $total_mem -ge 4096 ]]; then
    log_success "Sufficient memory available"
  elif [[ $total_mem -ge 2048 ]]; then
    log_warning "Memory is below recommended 4GB but may work"
  else
    log_error "Insufficient memory. Need at least 2GB, have ${total_mem}MB"
  fi

  # Check CPU cores
  local cpu_cores=$(nproc)
  log "CPU cores: $cpu_cores"

  if [[ $cpu_cores -ge 2 ]]; then
    log_success "Sufficient CPU cores available"
  else
    log_warning "Only $cpu_cores CPU core available. 2+ recommended"
  fi
}

check_network_connectivity() {
  log "Checking network connectivity..."

  # Test internet connectivity
  if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    log_success "Internet connectivity confirmed"
  else
    log_error "No internet connectivity detected"
    return 1
  fi

  # Test HTTPS connectivity
  if command -v curl >/dev/null 2>&1; then
    if curl -s --connect-timeout 5 https://google.com >/dev/null; then
      log_success "HTTPS connectivity confirmed"
    else
      log_warning "HTTPS connectivity issues detected"
    fi
  else
    log_warning "curl not available for HTTPS test"
  fi
}

check_required_ports() {
  log "Checking if required ports are available..."

  local ports=(22 80 443)
  if [[ "${EXPOSE_MINIO_CONSOLE:-false}" == "true" ]]; then
    ports+=(9001)
  fi
  if [[ "${ENABLE_K3S_MONITORING:-false}" == "true" ]]; then
    ports+=(3000 6443 9090)
  fi

  for port in "${ports[@]}"; do
    if command -v netstat >/dev/null 2>&1; then
      if netstat -tuln | grep -q ":$port "; then
        log_warning "Port $port is already in use"
      else
        log_success "Port $port is available"
      fi
    elif command -v ss >/dev/null 2>&1; then
      if ss -tuln | grep -q ":$port "; then
        log_warning "Port $port is already in use"
      else
        log_success "Port $port is available"
      fi
    else
      log_warning "Cannot check port $port (netstat/ss not available)"
    fi
  done
}

validate_environment_variables() {
  log "Validating environment variables..."

  # Required variables
  if [[ -z "${DOMAIN:-}" ]]; then
    log_error "DOMAIN environment variable is required"
    return 1
  else
    log_success "DOMAIN is set: $DOMAIN"
    test_domain_resolution "$DOMAIN"
  fi

  if [[ -z "${EMAIL:-}" ]]; then
    log_error "EMAIL environment variable is required"
    return 1
  else
    log_success "EMAIL is set: $EMAIL"
    test_email_format "$EMAIL"
  fi

  # Optional variables with defaults
  log "Optional environment variables:"
  echo "  TZ: ${TZ:-UTC}"
  echo "  HARDEN_SSH: ${HARDEN_SSH:-false}"
  echo "  EXPOSE_MINIO_CONSOLE: ${EXPOSE_MINIO_CONSOLE:-false}"
  echo "  ENABLE_K3S_MONITORING: ${ENABLE_K3S_MONITORING:-false}"
  echo "  DEBUG: ${DEBUG:-false}"
  echo "  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-<will be generated>}"
}

check_existing_installations() {
  log "Checking for existing installations..."

  # Check Docker
  if command -v docker >/dev/null 2>&1; then
    local docker_version=$(docker --version 2>/dev/null || echo "unknown")
    log_warning "Docker is already installed: $docker_version"
  else
    log_success "Docker not installed (will be installed by script)"
  fi

  # Check Caddy
  if command -v caddy >/dev/null 2>&1; then
    local caddy_version=$(caddy version 2>/dev/null || echo "unknown")
    log_warning "Caddy is already installed: $caddy_version"
  else
    log_success "Caddy not installed (will be installed by script)"
  fi

  # Check k3s
  if command -v k3s >/dev/null 2>&1; then
    log_warning "k3s is already installed"
  else
    log_success "k3s not installed (will be installed if monitoring enabled)"
  fi

  # Check for existing Supabase installation
  if [[ -d "/opt/supabase" ]]; then
    log_warning "Existing Supabase installation found at /opt/supabase"
  else
    log_success "No existing Supabase installation found"
  fi
}

generate_test_summary() {
  log "Generating test summary..."

  echo ""
  echo -e "${GREEN}=== TEST SUMMARY ===${NC}"
  echo -e "${CYAN}Domain:${NC} ${DOMAIN:-<not set>}"
  echo -e "${CYAN}Email:${NC} ${EMAIL:-<not set>}"
  echo -e "${CYAN}Monitoring Enabled:${NC} ${ENABLE_K3S_MONITORING:-false}"
  echo -e "${CYAN}MinIO Console:${NC} ${EXPOSE_MINIO_CONSOLE:-false}"
  echo -e "${CYAN}SSH Hardening:${NC} ${HARDEN_SSH:-false}"
  echo ""

  echo -e "${BLUE}=== NEXT STEPS ===${NC}"
  echo "1. Review any warnings or errors above"
  echo "2. Ensure DNS is properly configured for your domain"
  echo "3. Upload the bootstrap script to your server"
  echo "4. Run the actual bootstrap script with these environment variables:"
  echo ""
  echo -e "${YELLOW}sudo DOMAIN=${DOMAIN:-yourdomain.com} \\"
  echo "     EMAIL=${EMAIL:-admin@yourdomain.com} \\"
  echo "     ENABLE_K3S_MONITORING=${ENABLE_K3S_MONITORING:-false} \\"
  echo "     EXPOSE_MINIO_CONSOLE=${EXPOSE_MINIO_CONSOLE:-false} \\"
  echo "     HARDEN_SSH=${HARDEN_SSH:-false} \\"
  echo "     DEBUG=true \\"
  echo -e "     bash /root/bootstrap-supabase-workers.sh${NC}"
}

main() {
  echo -e "${GREEN}=== BOOTSTRAP SCRIPT TEST ===${NC}"
  echo "This script validates your environment before running the actual bootstrap."
  echo ""

  # Validate environment variables first
  if ! validate_environment_variables; then
    log_error "Environment validation failed. Please set required variables."
    exit 1
  fi

  # Run all checks
  check_system_requirements
  check_network_connectivity
  check_required_ports
  check_existing_installations

  # Generate summary
  generate_test_summary

  log_success "Test completed! Review the summary above before proceeding."
}

# Check if running as root (recommended but not required for testing)
if [[ $EUID -eq 0 ]]; then
  log "Running as root (recommended for actual deployment)"
else
  log_warning "Not running as root. Some checks may be limited."
fi

main "$@"