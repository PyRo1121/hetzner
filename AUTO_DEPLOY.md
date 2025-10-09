# Auto-Deploy Without GitHub Actions

Since you're on GitHub free tier, we'll build images directly on your server instead!

## 🎯 Two Options:

### Option 1: Manual Deploy (Simple)

Whenever you push code to GitHub, run on your server:

```bash
cd /opt/hetzner
./build-and-deploy.sh
```

This will:
1. Pull latest code from GitHub
2. Build Docker image locally
3. Import into K3s
4. Update deployments
5. Your sites go live!

### Option 2: Auto-Deploy with Webhook (Advanced)

Set up a webhook so GitHub automatically triggers deployment on push.

#### Step 1: Install webhook listener

```bash
# Install webhook tool
sudo apt install webhook -y

# Create webhook script
sudo tee /opt/hetzner/webhook-deploy.sh << 'EOF'
#!/bin/bash
cd /opt/hetzner
git pull origin main || git pull origin master
./build-and-deploy.sh >> /var/log/auto-deploy.log 2>&1
EOF

sudo chmod +x /opt/hetzner/webhook-deploy.sh

# Create webhook config
sudo tee /etc/webhook.conf << 'EOF'
[
  {
    "id": "deploy-nextjs",
    "execute-command": "/opt/hetzner/webhook-deploy.sh",
    "command-working-directory": "/opt/hetzner",
    "response-message": "Deployment triggered!",
    "trigger-rule": {
      "match": {
        "type": "payload-hash-sha256",
        "secret": "YOUR_WEBHOOK_SECRET_HERE",
        "parameter": {
          "source": "header",
          "name": "X-Hub-Signature-256"
        }
      }
    }
  }
]
EOF

# Start webhook service
sudo webhook -hooks /etc/webhook.conf -verbose -port 9000 &
```

#### Step 2: Add GitHub Webhook

1. Go to: https://github.com/PyRo1121/hetzner/settings/hooks
2. Click "Add webhook"
3. Payload URL: `http://YOUR_SERVER_IP:9000/hooks/deploy-nextjs`
4. Content type: `application/json`
5. Secret: (same as YOUR_WEBHOOK_SECRET_HERE above)
6. Events: Just the push event
7. Click "Add webhook"

#### Step 3: Open firewall

```bash
sudo ufw allow 9000/tcp
```

Now every git push automatically deploys! 🎉

## 🔧 Environment Variables

The build script uses variables from your .env file. Make sure these are set:

```bash
# Source .env before building
source /opt/hetzner/.env
./build-and-deploy.sh
```

Or add to your ~/.bashrc:
```bash
echo 'source /opt/hetzner/.env' >> ~/.bashrc
```

## 🚀 Quick Deploy

```bash
cd /opt/hetzner
source .env
./build-and-deploy.sh
```

## 📊 Check Status

```bash
# View pods
sudo kubectl get pods -n nextjs

# View logs
sudo kubectl logs -f deployment/nextjs-app -n nextjs

# Restart if needed
sudo kubectl rollout restart deployment/nextjs-app -n nextjs
```

## 🐛 Troubleshooting

### Build fails:
```bash
# Check Docker
docker ps
docker images

# Check disk space
df -h
```

### Image won't import:
```bash
# List K3s images
sudo k3s crictl images

# Force reload
docker save nextjs-app:latest | sudo k3s ctr images import -
```

### Deployment stuck:
```bash
# Check events
sudo kubectl get events -n nextjs --sort-by='.lastTimestamp'

# Force new rollout
sudo kubectl rollout restart deployment/nextjs-app -n nextjs
```

## ✅ Benefits of Local Build:

- ✅ No GitHub Actions minutes used
- ✅ Faster builds (no upload/download)
- ✅ Full control over build process
- ✅ Can test locally before deploying
- ✅ Works with private repos

## 🎉 You're All Set!

Just run `./build-and-deploy.sh` whenever you want to deploy! 🚀
