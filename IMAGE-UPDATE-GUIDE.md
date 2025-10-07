# Image Update Guide

This guide helps identify and fix outdated Docker/Kubernetes images that can cause system crashes and ImagePullBackOff errors.

## 🚨 Problem Identified

The system crashes were caused by **outdated MinIO Docker images** that are no longer available on Docker Hub:

- `docker.io/bitnami/minio:2025.7.23-debian-12-r3` ❌ (Not Found)
- `docker.io/bitnami/minio-object-browser:2.0.2-debian-12-r3` ❌ (Deprecated)

## 🔧 Solutions Implemented

### 1. Fixed MinIO Image Versions

Created `values-minio.yaml` with correct, available image versions:

```yaml
image:
  repository: bitnami/minio
  tag: "2024.10.29-debian-12-r0"  # ✅ Available

console:
  enabled: true
  image:
    repository: bitnami/minio-console  # ✅ Fixed: was minio-object-browser
    tag: "1.7.0-debian-12-r0"  # ✅ Available
```

### 2. Updated Supabase GoTrue Image

Updated `k8s/supabase/gotrue.yaml`:
- From: `supabase/gotrue:v2.158.1`
- To: `supabase/gotrue:v2.165.0` ✅

### 3. Created Automated Fix Script

`scripts/fix-outdated-images.sh` provides:
- Automated image version updates
- Pod status verification
- Error detection and reporting
- Comprehensive logging

## 🚀 Quick Fix Commands

### Option 1: Use the Automated Script
```bash
cd /path/to/project
chmod +x scripts/fix-outdated-images.sh
./scripts/fix-outdated-images.sh
```

### Option 2: Manual MinIO Fix
```bash
# Update MinIO with correct images
helm upgrade minio bitnami/minio -n platform \
  --version 14.8.5 \
  -f ./values-minio.yaml \
  --atomic --timeout 15m \
  --wait

# Verify pods are running
kubectl get pods -n platform -l app.kubernetes.io/name=minio
```

## 🔍 How to Identify Outdated Images

### 1. Check Pod Status
```bash
# Look for ImagePullBackOff or ErrImagePull
kubectl get pods --all-namespaces
kubectl describe pod <pod-name> -n <namespace>
```

### 2. Check System Logs
```bash
# On the Kubernetes node
journalctl -u k3s -f | grep -i "image"
```

### 3. Verify Image Availability
```bash
# Test if image exists
docker pull <image-name>:<tag>
```

## 📋 Image Inventory

### Current Working Images ✅

| Service | Image | Version | Status |
|---------|-------|---------|--------|
| MinIO | `bitnami/minio` | `2024.10.29-debian-12-r0` | ✅ Working |
| MinIO Console | `bitnami/minio-console` | `1.7.0-debian-12-r0` | ✅ Working |
| GoTrue | `supabase/gotrue` | `v2.165.0` | ✅ Working |
| Redis | `redis` | `7-alpine` | ✅ Working |
| PostgreSQL | `timescale/timescaledb` | `latest-pg15` | ✅ Working |

### Previously Problematic Images ❌

| Service | Image | Version | Issue |
|---------|-------|---------|-------|
| MinIO | `bitnami/minio` | `2025.7.23-debian-12-r3` | ❌ Not Found |
| MinIO Console | `bitnami/minio-object-browser` | `2.0.2-debian-12-r3` | ❌ Deprecated |

## 🛡️ Prevention Strategies

### 1. Use Stable Tags
- Avoid using `latest` tags in production
- Pin to specific, tested versions
- Use semantic versioning when available

### 2. Regular Image Updates
```bash
# Check for updates monthly
helm repo update
helm search repo bitnami/minio --versions | head -10
```

### 3. Image Availability Testing
```bash
# Test before deployment
docker pull bitnami/minio:2024.10.29-debian-12-r0
docker pull bitnami/minio-console:1.7.0-debian-12-r0
```

### 4. Monitoring Setup
```bash
# Monitor pod status
kubectl get pods --all-namespaces --field-selector=status.phase!=Running
```

## 🔧 Troubleshooting Common Issues

### ImagePullBackOff Errors
1. Check image name and tag spelling
2. Verify image exists on registry
3. Check network connectivity to registry
4. Verify authentication if using private registry

### Pod Stuck in Pending
1. Check node resources (CPU/Memory)
2. Verify persistent volume claims
3. Check node selectors and taints
4. Review security contexts

### Deployment Rollback
```bash
# If new images cause issues
helm rollback minio -n platform
kubectl rollout undo deployment/<deployment-name> -n <namespace>
```

## 📊 Verification Commands

### Check All Pod Status
```bash
kubectl get pods --all-namespaces -o wide
```

### Check Specific Service
```bash
kubectl get pods -n platform -l app.kubernetes.io/name=minio
kubectl describe deployment minio -n platform
```

### Check Image Pull Events
```bash
kubectl get events --all-namespaces --field-selector reason=Failed
kubectl get events --all-namespaces --field-selector reason=FailedMount
```

## 🚨 Emergency Procedures

### If System is Down
1. Check node status: `kubectl get nodes`
2. Check critical pods: `kubectl get pods -n kube-system`
3. Check system logs: `journalctl -u k3s -f`
4. Restart problematic pods: `kubectl delete pod <pod-name> -n <namespace>`

### If MinIO is Critical
```bash
# Quick MinIO restart with working images
kubectl delete deployment minio -n platform
helm install minio bitnami/minio -n platform -f ./values-minio.yaml
```

## 📝 Maintenance Schedule

### Weekly
- [ ] Check pod status across all namespaces
- [ ] Review system logs for image-related errors

### Monthly
- [ ] Update Helm repositories
- [ ] Check for new stable image versions
- [ ] Test image availability before updates

### Quarterly
- [ ] Review and update all image versions
- [ ] Update this documentation
- [ ] Test disaster recovery procedures

## 🔗 Related Files

- `values-minio.yaml` - MinIO Helm values with correct images
- `scripts/fix-outdated-images.sh` - Automated fix script
- `k8s/supabase/gotrue.yaml` - Updated GoTrue deployment
- `k3.md` - System logs showing the original errors

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review system logs
3. Test image availability
4. Use the automated fix script
5. Contact the infrastructure team with specific error messages

---

**Last Updated:** $(date)
**Status:** ✅ All known image issues resolved