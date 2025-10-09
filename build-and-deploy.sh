#!/bin/bash
set -e

# Build and Deploy Script for K3s
# This runs on your server to build and deploy your Next.js app

REPO_DIR="/opt/hetzner"
IMAGE_NAME="nextjs-app:latest"
NAMESPACE="nextjs"

echo "🚀 Building and deploying Next.js app..."

cd $REPO_DIR

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main || git pull origin master

# Build Docker image locally
echo "🔨 Building Docker image..."
docker build -t $IMAGE_NAME \
  --build-arg REDIS_URL=redis://redis-master.databases.svc.cluster.local:6379 \
  --build-arg GAMEINFO_BASE_URL=https://gameinfo.albiononline.com/api/gameinfo \
  --build-arg DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgresql.databases.svc.cluster.local:5432/albion \
  --build-arg S3_ENDPOINT=${S3_ENDPOINT} \
  --build-arg S3_ACCESS_KEY=${S3_ACCESS_KEY} \
  --build-arg S3_SECRET_KEY=${S3_SECRET_KEY} \
  --build-arg NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN} \
  --build-arg SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN} \
  .

# Import image into K3s
echo "📦 Importing image into K3s..."
docker save $IMAGE_NAME | sudo k3s ctr images import -

# Update deployments
echo "🔄 Updating Kubernetes deployments..."
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

# Update Next.js deployment
sudo kubectl set image deployment/nextjs-app nextjs=$IMAGE_NAME -n $NAMESPACE
sudo kubectl set image deployment/admin-backend admin=$IMAGE_NAME -n admin

# Wait for rollout
echo "⏳ Waiting for deployment to complete..."
sudo kubectl rollout status deployment/nextjs-app -n $NAMESPACE --timeout=5m

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your sites:"
echo "  - https://pyro1121.com"
echo "  - https://admin.pyro1121.com"
echo ""
echo "📊 Check status:"
echo "  sudo kubectl get pods -n $NAMESPACE"
echo "  sudo kubectl logs -f deployment/nextjs-app -n $NAMESPACE"
