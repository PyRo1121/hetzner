#!/bin/bash

# Complete Reset Script for Albion Deployment
# This will delete everything and start fresh

echo "🔥 COMPLETE RESET - This will delete EVERYTHING!"
echo "Press Ctrl+C within 10 seconds to cancel..."
sleep 10

echo "🛑 Stopping any running deployment processes..."
pkill -f "deploy-albion-unified.sh" || true

echo "🗑️ Deleting all namespaces and resources..."
k3s kubectl delete namespace albion-stack --force --grace-period=0 || true
k3s kubectl delete namespace argocd --force --grace-period=0 || true
k3s kubectl delete namespace supabase --force --grace-period=0 || true
k3s kubectl delete namespace redis --force --grace-period=0 || true
k3s kubectl delete namespace minio --force --grace-period=0 || true

echo "🧹 Cleaning up any remaining resources..."
k3s kubectl delete all --all -A --force --grace-period=0 || true
k3s kubectl delete pvc --all -A --force --grace-period=0 || true
k3s kubectl delete pv --all --force --grace-period=0 || true

echo "🔄 Restarting k3s service..."
systemctl restart k3s

echo "⏳ Waiting for k3s to be ready..."
sleep 30

echo "✅ Reset complete! You can now run the deployment script fresh."
echo "Run: ./deploy-albion-unified.sh"