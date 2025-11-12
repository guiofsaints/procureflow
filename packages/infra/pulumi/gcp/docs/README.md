# ProcureFlow GCP FREE TIER

### Scripts (Root)

✅ **`package.json`** (root)

- `pnpm run infra:install` – Install dependencies
- `pnpm run infra:preview` – Preview changes
- `pnpm run infra:deploy` – Full deploy
- `pnpm run infra:destroy` – Destroy infrastructure
- `pnpm run infra:output` – Show outputs
- `pnpm run infra:config` – Configure secrets

---

## 🎯 Stack (100% FREE)

```
GitHub (Free)
   ├── Repository (unlimited)
   ├── Actions (2000 min/month) ✅
   └── Secrets management ✅
        │
        ├── Trigger: git push
        └── Deploy via Pulumi
             │
             ├── Pulumi Cloud (Free)
             │   └── 1 stack, unlimited deploys ✅
             │
             └── Provision Infrastructure
                  │
                  ├── GCP Cloud Run (Always Free)
                  │   ├── 2M requests/month ✅
                  │   ├── 360k GB-sec/month ✅
                  │   ├── 180k vCPU-sec/month ✅
                  │   └── minScale: 0 (no idle cost) ✅
                  │
                  ├── GCP Secret Manager (Free)
                  │   ├── 6 secrets ✅
                  │   └── 10k accesses/month ✅
                  │
                  ├── GCP Artifact Registry
                  │   └── ~$0.30/month (only cost) ⚠️
                  │
                  └── MongoDB Atlas M0 (Free Forever)
                      ├── 512 MB storage ✅
                      ├── Shared CPU/RAM ✅
                      └── 100 connections ✅
```

**Total Cost:** $0.30–$0.50/month (Artifact Registry only)

---

## 🚀 Quick Start (Summary)

### 1. Prerequisites (15 min)

```powershell
# Check versions
node --version   # >= 18
pnpm --version   # >= 8
pulumi version   # Install if needed
gcloud --version # Install if needed

# Install dependencies
pnpm install
pnpm run infra:install
```

### 2. Create Accounts (30 min)

- ✅ MongoDB Atlas → [https://cloud.mongodb.com](https://cloud.mongodb.com) (FREE)
- ✅ GCP → [https://console.cloud.google.com](https://console.cloud.google.com) (FREE tier)
- ✅ Pulumi Cloud → [https://app.pulumi.com](https://app.pulumi.com) (FREE)

### 3. Configure Secrets (15 min)

```powershell
cd packages/infra/pulumi/gcp

# Initialize stack
pulumi login
pulumi stack init dev

# Configure GCP
pulumi config set gcp:project YOUR_PROJECT_ID
pulumi config set gcp:region us-central1

# Generate and set secrets
pulumi config set --secret nextauth-secret $(openssl rand -base64 32)
pulumi config set --secret mongodb-password $(openssl rand -base64 32)
pulumi config set --secret mongodb-atlas:publicKey "YOUR_ATLAS_KEY"
pulumi config set --secret mongodb-atlas:privateKey "YOUR_ATLAS_SECRET"
pulumi config set mongodb-atlas:orgId "YOUR_ATLAS_ORG_ID"
```

### 4. Deploy (60 min)

```powershell
# Preview
pnpm run infra:preview

# Deploy infrastructure
pnpm run infra:deploy  # ~10 min

# Build and push Docker image
cd ../../../..
docker build -f packages/infra/docker/Dockerfile.web -t temp .
gcloud auth configure-docker us-central1-docker.pkg.dev
docker tag temp us-central1-docker.pkg.dev/PROJECT/procureflow/web:v1
docker push us-central1-docker.pkg.dev/PROJECT/procureflow/web:v1

# Update Cloud Run
cd packages/infra/pulumi/gcp
pulumi config set image-tag v1
pnpm run deploy  # ~3 min
```

### 5. Set Up CI/CD (30 min)

```powershell
# Create GCP service account
gcloud iam service-accounts create github-actions

# Generate key and convert to base64
# Add secrets to GitHub

# Push to test
git add .
git commit -m "feat: enable CI/CD"
git push origin main
```

---

## 💰 Detailed Costs

### FREE TIER Breakdown

| Service               | FREE Quota    | Expected Usage | Cost            |
| --------------------- | ------------- | -------------- | --------------- |
| **Cloud Run**         | 2M req/month  | ~10k req/month | $0.00 ✅        |
| **Cloud Run Memory**  | 360k GB-sec   | ~50 GB-sec     | $0.00 ✅        |
| **Cloud Run CPU**     | 180k vCPU-sec | ~25 vCPU-sec   | $0.00 ✅        |
| **Secret Manager**    | 6 secrets     | 3 secrets      | $0.00 ✅        |
| **MongoDB Atlas M0**  | 512 MB        | Unlimited      | $0.00 ✅        |
| **GitHub Actions**    | 2000 min      | ~30 min/month  | $0.00 ✅        |
| **Pulumi Cloud**      | 1 stack       | 1 stack        | $0.00 ✅        |
| **Artifact Registry** | -             | 2 GB           | **$0.30** ⚠️    |
| **TOTAL**             |               |                | **$0.30/month** |

### Cost for 1 Day of Testing

With `minScale: 0` (scales to zero when idle):

| Period   | Cost   |
| -------- | ------ |
| 1 hour   | ~$0.01 |
| 8 hours  | ~$0.05 |
| 24 hours | ~$0.15 |

**Full teardown:** $0.00 (no residual costs)

---

## 📝 Essential Commands

```powershell
# Deploy
pnpm run infra:preview   # View changes
pnpm run infra:deploy    # Apply changes
pnpm run infra:output    # Show outputs (URLs, etc.)

# Configuration
pnpm run infra:config           # Show current config
pnpm run infra:config set ...   # Change config

# Destroy
pnpm run infra:destroy   # Remove all infrastructure

# Logs
gcloud run logs tail procureflow-web --region us-central1

# Status
pulumi stack
pulumi stack output serviceUrl
```

---

## 🔍 Post-Deploy Verification

```powershell
# 1. Get service URL
$SERVICE_URL = pulumi stack output serviceUrl

# 2. Test health endpoint
curl "$SERVICE_URL/api/health"
# Expected: {"status":"ok"}

# 3. Open in browser
Start-Process $SERVICE_URL

# 4. Log in with demo credentials
# Email: guilherme@procureflow.com
# Password: guigui123

# 5. Check costs (should be ~$0.00)
# https://console.cloud.google.com/billing
```

---

## 🗑️ Full Teardown

```powershell
# 1. Destroy Pulumi infrastructure
cd packages/infra/pulumi/gcp
pnpm run destroy

# 2. Delete MongoDB Atlas cluster (manual)
# https://cloud.mongodb.com

# 3. Delete Docker images (optional)
gcloud artifacts docker images delete \
  us-central1-docker.pkg.dev/PROJECT/procureflow/web:latest

# 4. Delete GCP project (full cleanup)
gcloud projects delete PROJECT_ID

# 5. Remove Pulumi stack
pulumi stack rm dev
```

**Post-destroy cost:** $0.00

---

## 📚 Documentation

| File                               | Purpose                              |
| ---------------------------------- | ------------------------------------ |
| `SETUP.md`                         | Full step-by-step guide (700+ lines) |
| `INFRAESTRUTURA_GCP_RELATORIO.md`  | Detailed analysis and plan           |
| `README.md`                        | Project overview                     |
| `.github/workflows/deploy-gcp.yml` | CI/CD with inline comments           |

---

## ✅ Implementation Checklist

- [x] Update Pulumi package.json
- [x] Create MongoDB Atlas module (`mongodb-atlas.ts`)
- [x] Create Secret Manager module (`secrets.ts`)
- [x] Create Cloud Run module (`cloudrun.ts`)
- [x] Refactor modular `index.ts`
- [x] Create GitHub Actions workflow
- [x] Add scripts to root `package.json`
- [x] Create full setup guide (`SETUP.md`)
- [x] Update report with FREE TIER plan

---

## 🎉 Final Result

**Production-ready infrastructure with:**

✅ **Zero monthly cost** (within free tier)
✅ **Automatic CI/CD** (GitHub Actions)
✅ **Managed database** (MongoDB Atlas M0)
✅ **Secure secrets** (Secret Manager)
✅ **Auto-scaling** (0 to 2 instances)
✅ **Built-in HTTPS** (Cloud Run)
✅ **Basic monitoring** (Cloud Logging)
✅ **Deploy in 2–3 hours** (first time)
✅ **Complete documentation** (700+ lines)

**Next steps:**

1. Follow `SETUP.md` step by step
2. Do a manual deploy first
3. Configure GitHub Actions
4. Test CI/CD with a push
5. Monitor costs (should be $0.00)

---

**Status:** 🟢 READY TO DEPLOY
**Cost:** 💚 $0.00–$0.50/month
**Complexity:** 🟡 Medium (well documented)
**Time:** ⏱️ 2–3 hours (full setup)
