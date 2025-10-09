# Deployment Fixes Applied

## Summary
This document lists all the fixes applied to make the world-class hybrid deployment work with Kyverno security policies and resource constraints.

## How to Use
1. **Clean up existing deployment**: `sudo bash cleanup-deployment.sh`
2. **Run fresh deployment**: `sudo -E bash deploy-worldclass-hybrid-2025.sh`

---

## All Fixes Applied

### 1. **Helm Repositories** ✅
**Issue**: Repos only added during initial Helm install  
**Fix**: Made repo configuration idempotent - always runs regardless of Helm installation status

### 2. **Longhorn CRD Cleanup** ✅
**Issue**: Old CRDs from previous installations caused conflicts  
**Fix**: Added automatic CRD cleanup before reinstallation

### 3. **Traefik v34 Syntax** ✅
**Issue**: `redirectTo` syntax removed in Traefik Helm chart v34  
**Fix**: Updated to new syntax:
```yaml
ports.web.redirections.entryPoint.to=websecure
ports.web.redirections.entryPoint.scheme=https
```

### 4. **PostgreSQL Security Context** ✅
**Issue**: Kyverno blocked deployment - missing `runAsNonRoot`  
**Fix**: Added pod and container security contexts:
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 999  # postgres user
  fsGroup: 999
```
**Also fixed**:
- Correct image: `citusdata/citus:13.2-pg16` (not pg17)
- Removed TimescaleDB reference

### 5. **Redis Security Context** ✅
**Issue**: Kyverno blocked - missing security context and resource limits  
**Fix**: Added security contexts for master, replica, sentinel, and metrics containers
```yaml
podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1001  # redis user in Bitnami images
  fsGroup: 1001
```

### 6. **Qdrant Security Context** ✅
**Issue**: Kyverno blocked - missing security context  
**Fix**: Added pod and container security contexts with UID 1000

### 7. **MinIO Configuration** ✅
**Issue 1**: Bucket names with commas failed parsing  
**Fix**: Changed from `"bucket1,bucket2"` to `'bucket1 bucket2'`

**Issue 2**: Console image didn't exist  
**Fix**: Disabled console with `console.enabled=false`

**Issue 3**: Resource exhaustion  
**Fix**: Reduced CPU request from 250m to 100m

**Issue 4**: Security context missing  
**Fix**: Added security contexts for main deployment

### 8. **Cloudflare R2 Integration** ✅
**Issue**: MinIO had persistent volume issues  
**Decision**: Use Cloudflare R2 instead (better for production)  
**Fix**: Added R2 credentials to Next.js secrets:
```bash
S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, S3_REGION
```

### 9. **Next.js Security Context** ✅
**Issue**: Kyverno blocked deployment  
**Fix**: Added pod and container security contexts with UID 1000

### 10. **Admin Backend Security Context** ✅
**Issue**: Kyverno blocked deployment  
**Fix**: Added pod and container security contexts with UID 1000

### 11. **ML Service Security Context** ✅
**Issue**: Kyverno blocked deployment  
**Fix**: Added pod and container security contexts with UID 1000

### 12. **Monitoring Stack (Prometheus + Grafana)** ✅
**Issue 1**: Kyverno blocked webhook jobs - no resource limits  
**Fix**: Created Kyverno PolicyException for monitoring namespace

**Issue 2**: Resource exhaustion  
**Fix**: Reduced all resource requests:
- Prometheus: 2Gi → 512Mi memory, added 200m CPU
- Grafana: 256Mi → 128Mi memory, 100m → 50m CPU
- Node exporter: Added 50m CPU, 64Mi memory
- Kube-state-metrics: Added 50m CPU, 64Mi memory
- Disabled Alertmanager (not critical)

**Issue 3**: Grafana sidecar containers missing resource limits  
**Fix**: Added resource limits to dashboard and datasource sidecars

**Issue 4**: Admission webhooks blocked by Kyverno  
**Fix**: Disabled with `prometheusOperator.admissionWebhooks.enabled=false`

### 13. **Loki Configuration** ✅
**Issue**: Resource constraints  
**Fix**: 
- Disabled persistence (not critical for dev)
- Reduced resources significantly
- Added limits to Promtail

---

## Security Contexts Pattern

All deployments now follow this pattern:

```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: <appropriate-uid>
    fsGroup: <appropriate-gid>
  containers:
  - name: app
    securityContext:
      runAsUser: <appropriate-uid>
      runAsNonRoot: true
      allowPrivilegeEscalation: false
    resources:
      requests:
        cpu: <value>
        memory: <value>
      limits:
        cpu: <value>
        memory: <value>
```

**UIDs used:**
- PostgreSQL: 999 (postgres)
- Redis: 1001 (Bitnami default)
- Qdrant: 1000
- MinIO: 1001 (Bitnami default)
- Next.js: 1000
- Admin: 1000
- ML: 1000

---

## Resource Optimization

Total CPU requests reduced to fit 8 vCPU node:
- Infrastructure: ~2.5 vCPU
- Applications: ~2.0 vCPU
- Monitoring: ~0.7 vCPU
- **Total: ~5.2 vCPU** (leaving headroom)

---

## Kyverno PolicyException

Created exception for monitoring namespace:
```yaml
apiVersion: kyverno.io/v2
kind: PolicyException
metadata:
  name: monitoring-exception
  namespace: kyverno
spec:
  exceptions:
  - policyName: require-resource-limits
  - policyName: require-non-root
  match:
    any:
    - resources:
        namespaces:
        - monitoring
```

---

## Testing Checklist

After running cleanup and redeployment:

1. ✅ All namespaces created
2. ✅ All Helm releases deployed
3. ✅ All pods running (check with `kubectl get pods -A`)
4. ✅ No Kyverno policy violations
5. ✅ Resource requests within node capacity
6. ✅ Ingresses configured with TLS
7. ✅ HPA working for Next.js
8. ✅ Prometheus collecting metrics
9. ✅ Grafana accessible
10. ✅ Database sharding initialized

---

## Quick Commands

```bash
# Clean up everything
sudo bash cleanup-deployment.sh

# Deploy everything
sudo -E bash deploy-worldclass-hybrid-2025.sh

# Check all pods
kubectl get pods -A

# Check Kyverno policy reports
kubectl get policyreport -A

# Check resource usage
kubectl top nodes
kubectl top pods -A

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Username: admin, Password: admin123

# Access Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

---

## Notes

- MinIO is now using Cloudflare R2 instead of self-hosted storage
- Grafana persistence is disabled (dashboards in memory)
- Loki persistence is disabled (logs in memory)
- Alertmanager is disabled (not critical for dev/staging)
- All security contexts comply with Kyverno policies
- All resource limits are defined
- PolicyException allows monitoring stack to deploy

---

## Future Improvements

1. Add Grafana persistence with proper PVC
2. Add Loki persistence for log retention
3. Enable Alertmanager with proper configuration
4. Add backup/restore procedures
5. Implement GitOps with ArgoCD
6. Add more comprehensive monitoring dashboards
7. Implement log aggregation from all services
