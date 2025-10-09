# GitHub Actions Setup for Auto-Deploy

## 📋 What This Does

When you push to `main` or `master` branch:
1. GitHub Actions builds your Next.js app with Docker
2. Pushes image to `ghcr.io/pyro1121/hetzner:latest`
3. Automatically updates your K3s deployment

## 🔐 Required GitHub Secrets

Go to your repo: **Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

### Required for Build:
```
NEXT_PUBLIC_SENTRY_DSN=https://e128b83fbb7e9c3f8fd97705b289e55f@o970025.ingest.us.sentry.io/4508842398384128
SENTRY_AUTH_TOKEN=b1764404ee4111efa447166616ac1d1f
REDIS_URL=redis://default:ld2SuNFmezD5Je8U9clCNMmMCSTlPRJf@redis-13404.c309.us-east-2-1.ec2.redns.redis-cloud.com:13404
GAMEINFO_BASE_URL=https://gameinfo.albiononline.com/api/gameinfo
SUPABASE_URL=https://oamrxxzpehglcghfergh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbXJ4eHpwZWhnbGNnaGZlcmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNjA3ODAsImV4cCI6MjA3NDgzNjc4MH0.-A5f8qiwu3nOxVjfgoJLsj9bUtxj50JN--b4rKPizwI
S3_ENDPOINT=https://f1e95b3e1b502cf366dfc81a863695fa.r2.cloudflarestorage.com/albion-online
S3_ACCESS_KEY=92cf4b9b16f6fa790159014736ba4a35
S3_SECRET_KEY=e33ee6b8ac1619d7824d73d74eda63b1775121ccbf5a5864db68fc3cfeeaf32f
```

### Optional for Auto-Deploy:
```
KUBECONFIG=(base64 encoded kubeconfig - see below)
```

## 🔑 How to Get KUBECONFIG Secret

On your server, run:
```bash
cat /etc/rancher/k3s/k3s.yaml | base64 -w 0
```

Copy the output and add it as a GitHub secret named `KUBECONFIG`.

## 📦 Package Permissions

Make sure your GitHub package is public or accessible:
1. Go to https://github.com/PyRo1121/hetzner/pkgs/container/hetzner
2. Click **Package settings**
3. Scroll to **Danger Zone**
4. Change visibility to **Public** (or add your K3s cluster as allowed)

## 🚀 First Deployment

After setting up secrets:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add GitHub Actions workflow"
   git push origin main
   ```

2. **Watch the build**:
   - Go to **Actions** tab in your repo
   - Watch the workflow run

3. **Verify deployment**:
   ```bash
   kubectl get pods -n nextjs
   kubectl logs -f deployment/nextjs-app -n nextjs
   ```

4. **Check your site**:
   - https://pyro1121.com
   - https://admin.pyro1121.com

## 🔄 Future Deployments

Just push to main:
```bash
git add .
git commit -m "Your changes"
git push
```

GitHub Actions will automatically:
- Build new Docker image
- Push to ghcr.io
- Update K3s deployment
- Your site updates in ~2-3 minutes!

## 🐛 Troubleshooting

### Build fails:
- Check GitHub Actions logs
- Verify all secrets are set correctly

### Image won't pull:
```bash
# Make package public or create image pull secret
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=PyRo1121 \
  --docker-password=YOUR_GITHUB_TOKEN \
  -n nextjs

# Update deployment to use secret
kubectl patch serviceaccount default -n nextjs \
  -p '{"imagePullSecrets": [{"name": "ghcr-secret"}]}'
```

### Manual deploy:
```bash
kubectl set image deployment/nextjs-app nextjs=ghcr.io/pyro1121/hetzner:latest -n nextjs
kubectl rollout status deployment/nextjs-app -n nextjs
```

## ✅ Success!

Once set up, every git push automatically deploys to production! 🎉
