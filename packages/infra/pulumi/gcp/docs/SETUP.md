# ProcureFlow GCP Infrastructure - FREE TIER Setup Guide

**Complete step-by-step guide for deploying ProcureFlow on GCP with $0.00/month cost**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [MongoDB Atlas Configuration](#mongodb-atlas-configuration)
4. [GCP Project Setup](#gcp-project-setup)
5. [Pulumi Configuration](#pulumi-configuration)
6. [Manual Deployment](#manual-deployment)
7. [GitHub Actions Setup (CI/CD)](#github-actions-setup-cicd)
8. [Verification](#verification)
9. [Teardown](#teardown)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts (All FREE)

- ✅ **GitHub Account** - For repository and Actions
- ✅ **GCP Account** - Free tier (credit card required but won't be charged)
- ✅ **MongoDB Atlas Account** - Free M0 cluster
- ✅ **Pulumi Cloud Account** - Free tier (1 stack)
- ✅ **OpenAI Account** - Optional (for AI features)

### Required Software

```powershell
# Check versions
node --version    # Should be >= 18.0.0
pnpm --version    # Should be >= 8.0.0
git --version     # Any recent version
docker --version  # For local image builds

# Install if missing:
# Node.js: https://nodejs.org/
# pnpm: npm install -g pnpm
# Git: https://git-scm.com/
# Docker: https://www.docker.com/
```

### Install Pulumi CLI

```powershell
# Windows (PowerShell)
choco install pulumi

# Or download from: https://www.pulumi.com/docs/get-started/install/
```

### Install GCP CLI

```powershell
# Download from: https://cloud.google.com/sdk/docs/install
# After installation, initialize:
gcloud init
gcloud auth login
```

---

## Initial Setup

### 1. Clone Repository

```powershell
git clone https://github.com/YOUR_USERNAME/procureflow.git
cd procureflow
```

### 2. Install Dependencies

```powershell
# Install root dependencies
pnpm install

# Install infrastructure dependencies
pnpm run infra:install
```

---

## MongoDB Atlas Configuration

### 1. Create Atlas Account

1. Go to https://cloud.mongodb.com/
2. Sign up (free, no credit card required)
3. Verify email

### 2. Create Organization

1. Click **+ New Organization**
2. Name: `ProcureFlow`
3. Click **Next** → **Create Organization**

### 3. Create Project

1. Click **+ New Project**
2. Name: `procureflow-dev`
3. Click **Next** → **Create Project**

### 4. Generate API Keys

1. Go to **Organization Settings** (top left) → **Access Manager**
2. Click **API Keys** tab
3. Click **+ Create API Key**
4. Name: `pulumi-github-actions`
5. Permissions: **Organization Owner** (for testing) or **Organization Project Creator**
6. Click **Next**
7. **⚠️ SAVE THESE VALUES:**
   ```
   Public Key:  xxxx-xxxx-xxxx-xxxx
   Private Key: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
8. Add your current IP to access list (or 0.0.0.0/0 for testing)

### 5. Get Organization ID

1. Go to **Organization Settings**
2. Copy **Organization ID** (bottom of page)
3. Example: `507f1f77bcf86cd799439011`

---

## GCP Project Setup

### 1. Create New Project

```powershell
# Set project name
$PROJECT_ID = "procureflow-dev-$(Get-Random -Minimum 1000 -Maximum 9999)"

# Create project
gcloud projects create $PROJECT_ID --name="ProcureFlow Dev"

# Set as active project
gcloud config set project $PROJECT_ID

# Save for later
Write-Output "GCP Project ID: $PROJECT_ID"
```

### 2. Enable Billing

1. Go to https://console.cloud.google.com/billing
2. Link billing account to `$PROJECT_ID` project
3. ⚠️ **Note:** Credit card required, but FREE TIER won't charge

### 3. Enable Required APIs

```powershell
# Enable all required APIs
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable iam.googleapis.com

# Verify
gcloud services list --enabled
```

### 4. Create Artifact Registry Repository

```powershell
gcloud artifacts repositories create procureflow \
  --repository-format=docker \
  --location=us-central1 \
  --description="ProcureFlow container images"
```

---

## Pulumi Configuration

### 1. Create Pulumi Account

1. Go to https://app.pulumi.com/signup
2. Sign up with GitHub (easiest)
3. Create free account

### 2. Login to Pulumi

```powershell
pulumi login
# Will open browser for authentication
```

### 3. Initialize Stack

```powershell
cd packages/infra/pulumi/gcp

# Create dev stack
pulumi stack init dev

# Verify
pulumi stack ls
```

### 4. Configure Stack

```powershell
# GCP Configuration
pulumi config set gcp:project $PROJECT_ID
pulumi config set gcp:region us-central1

# Application Configuration
pulumi config set environment dev
pulumi config set image-tag latest

# Generate and set secrets
$NEXTAUTH_SECRET = openssl rand -base64 32
pulumi config set --secret nextauth-secret $NEXTAUTH_SECRET

$MONGODB_PASSWORD = openssl rand -base64 32
pulumi config set --secret mongodb-password $MONGODB_PASSWORD

# MongoDB Atlas (use values from earlier)
pulumi config set --secret mongodb-atlas:publicKey "YOUR_ATLAS_PUBLIC_KEY"
pulumi config set --secret mongodb-atlas:privateKey "YOUR_ATLAS_PRIVATE_KEY"
pulumi config set mongodb-atlas:orgId "YOUR_ATLAS_ORG_ID"

# Optional: OpenAI API Key
# pulumi config set --secret openai-api-key "sk-your-key-here"
# Or leave empty:
pulumi config set --secret openai-api-key ""

# Verify configuration
pulumi config
```

Expected output:
```
KEY                              VALUE
environment                      dev
gcp:project                      procureflow-dev-1234
gcp:region                       us-central1
image-tag                        latest
mongodb-atlas:orgId              507f1f77bcf86cd799439011
mongodb-atlas:privateKey         [secret]
mongodb-atlas:publicKey          [secret]
mongodb-password                 [secret]
nextauth-secret                  [secret]
openai-api-key                   [secret]
```

---

## Manual Deployment

### 1. Preview Infrastructure

```powershell
# From root directory
pnpm run infra:preview
```

This will show all resources that will be created:
- MongoDB Atlas M0 cluster
- GCP Secret Manager secrets (3)
- GCP Cloud Run service
- GCP Artifact Registry repository
- IAM bindings

### 2. Deploy Infrastructure

```powershell
pnpm run infra:deploy
```

⏱️ **Expected time:** 5-10 minutes (MongoDB cluster creation is slow)

### 3. Build Docker Image

```powershell
# From root directory
cd ..\..\..

# Authenticate Docker with GCP
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build image
docker build -f packages/infra/docker/Dockerfile.web -t temp-image .

# Tag for Artifact Registry
docker tag temp-image us-central1-docker.pkg.dev/$PROJECT_ID/procureflow/web:v1.0.0
docker tag temp-image us-central1-docker.pkg.dev/$PROJECT_ID/procureflow/web:latest

# Push to registry
docker push us-central1-docker.pkg.dev/$PROJECT_ID/procureflow/web:v1.0.0
docker push us-central1-docker.pkg.dev/$PROJECT_ID/procureflow/web:latest
```

### 4. Update Cloud Run with Image

```powershell
cd packages/infra/pulumi/gcp

# Update image tag
pulumi config set image-tag v1.0.0

# Redeploy
pnpm run deploy
```

### 5. Get Service URL

```powershell
pnpm run infra:output

# Or specific output:
pulumi stack output serviceUrl
```

---

## GitHub Actions Setup (CI/CD)

### 1. Create GCP Service Account

```powershell
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployer"

# Get service account email
$SA_EMAIL = "github-actions@$PROJECT_ID.iam.gserviceaccount.com"

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/secretmanager.admin"

# Create key file
gcloud iam service-accounts keys create github-actions-key.json `
  --iam-account=$SA_EMAIL

# Convert to base64 (PowerShell)
$KEY_BASE64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("github-actions-key.json"))
Write-Output $KEY_BASE64 > github-key-base64.txt

# ⚠️ IMPORTANT: Delete local key file after adding to GitHub
# Remove-Item github-actions-key.json
```

### 2. Get Pulumi Access Token

1. Go to https://app.pulumi.com/account/tokens
2. Click **Create token**
3. Name: `github-actions-procureflow`
4. Copy token value

### 3. Add GitHub Secrets

1. Go to your repository: `https://github.com/YOUR_USERNAME/procureflow/settings/secrets/actions`
2. Click **New repository secret**
3. Add these secrets:

| Secret Name | Value | How to get |
|-------------|-------|------------|
| `GCP_PROJECT_ID` | `procureflow-dev-1234` | From `$PROJECT_ID` |
| `GCP_SA_KEY` | Base64 key | From `github-key-base64.txt` |
| `PULUMI_ACCESS_TOKEN` | Token value | From Pulumi dashboard |
| `NEXTAUTH_SECRET` | Secret value | From `pulumi config` |
| `MONGODB_PASSWORD` | Password value | From `pulumi config` |
| `MONGODB_ATLAS_PUBLIC_KEY` | Public key | From MongoDB Atlas |
| `MONGODB_ATLAS_PRIVATE_KEY` | Private key | From MongoDB Atlas |
| `MONGODB_ATLAS_ORG_ID` | Org ID | From MongoDB Atlas |
| `OPENAI_API_KEY` | API key (optional) | From OpenAI |

### 4. Test GitHub Actions

```powershell
# Make a change
git add .
git commit -m "feat: enable CI/CD"
git push origin main

# Monitor workflow
# https://github.com/YOUR_USERNAME/procureflow/actions
```

---

## Verification

### 1. Check Service Health

```powershell
# Get service URL
$SERVICE_URL = pulumi stack output serviceUrl

# Test health endpoint
curl $SERVICE_URL/api/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### 2. Test Application

```powershell
# Open in browser
Start-Process $SERVICE_URL

# Login with demo credentials:
# Email: demo@procureflow.com
# Password: demo123
```

### 3. Verify MongoDB Connection

```powershell
# View logs
gcloud run logs tail procureflow-web --region us-central1

# Should see: "MongoDB connected successfully"
```

### 4. Check Costs (Should be $0.00)

1. Go to https://console.cloud.google.com/billing
2. Navigate to your project
3. Check **Cost table**
4. Should show ~$0.00 or very minimal cost (~$0.30 for Artifact Registry)

---

## Teardown

### Complete Cleanup

```powershell
# 1. Destroy Pulumi infrastructure
cd packages/infra/pulumi/gcp
pnpm run destroy
# Type 'yes' to confirm

# 2. Delete MongoDB cluster manually
# Go to Atlas console and delete cluster

# 3. Delete GCP Artifact Registry images
gcloud artifacts docker images delete `
  us-central1-docker.pkg.dev/$PROJECT_ID/procureflow/web:latest --quiet

# 4. Delete GCP project (optional - complete cleanup)
gcloud projects delete $PROJECT_ID

# 5. Remove Pulumi stack
pulumi stack rm dev

# 6. Verify no orphaned resources
gcloud run services list
gcloud secrets list
```

---

## Troubleshooting

### Issue: MongoDB cluster creation fails

**Error:** `TENANT provider not available in region`

**Solution:** Change region in `mongodb-atlas.ts`:
```typescript
providerRegionName: 'CENTRAL_US', // Try: EASTERN_US, WESTERN_US
```

### Issue: Cloud Run deployment fails

**Error:** `Container failed to start`

**Check:**
```powershell
# View logs
gcloud run logs tail procureflow-web --region us-central1

# Common issues:
# 1. Missing environment variables
# 2. MongoDB connection timeout
# 3. Image not found
```

### Issue: Pulumi preview shows errors

**Error:** `secret not found`

**Solution:**
```powershell
# Re-add secret
pulumi config set --secret nextauth-secret $(openssl rand -base64 32)
```

### Issue: Docker push fails

**Error:** `denied: Permission "artifactregistry.repositories.uploadArtifacts" denied`

**Solution:**
```powershell
# Re-authenticate
gcloud auth configure-docker us-central1-docker.pkg.dev
gcloud auth login
```

### Issue: High costs

**Check free tier limits:**
- Cloud Run: 2M requests/month (within free tier?)
- Artifact Registry: Only ~$0.30/month expected
- MongoDB Atlas: M0 is always free

**Solution:**
```powershell
# Check current usage
gcloud run services describe procureflow-web --region us-central1 --format="value(status.traffic.percent)"

# Ensure minScale: 0 (scales to zero when idle)
pulumi config set cloud-run:min-instances 0
pnpm run infra:deploy
```

---

## Cost Monitoring

### Set up Billing Alerts

```powershell
# Create budget alert
gcloud billing budgets create `
  --billing-account=BILLING_ACCOUNT_ID `
  --display-name="ProcureFlow Budget" `
  --budget-amount=5 `
  --threshold-rule=percent=50 `
  --threshold-rule=percent=90 `
  --threshold-rule=percent=100
```

### Daily Cost Check

```powershell
# View current month costs
gcloud billing projects describe $PROJECT_ID

# View detailed breakdown
# https://console.cloud.google.com/billing/reports
```

---

## Next Steps

- ✅ Infrastructure deployed
- ✅ CI/CD configured
- ✅ Application running

**Production Readiness:**
1. Add custom domain
2. Configure HTTPS/SSL
3. Set up monitoring alerts
4. Implement backup strategy
5. Review security (IAM, secrets rotation)
6. Load testing
7. Upgrade MongoDB to M10 for production features

---

## Support

- **Pulumi:** https://www.pulumi.com/docs/
- **GCP Cloud Run:** https://cloud.google.com/run/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **GitHub Actions:** https://docs.github.com/en/actions

---

**Status:** ✅ FREE TIER DEPLOYMENT COMPLETE  
**Monthly Cost:** $0.00 - $0.50  
**Last Updated:** November 11, 2025
