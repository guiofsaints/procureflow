# Runbook: Build and Deploy

**Executive Summary**: Deploy ProcureFlow to GCP Cloud Run using GitHub Actions automated CI/CD or manual Pulumi execution. Automated approach: push to `main` triggers 3-job pipeline (Build Docker image → Deploy with Pulumi → Health check), completes in ~5-8 minutes. Manual approach: execute Pulumi commands locally to deploy specific stack (dev/staging/production), useful for troubleshooting or infrastructure changes. Post-deployment verification includes health check (HTTP 200), smoke tests (login, search, cart, checkout), and monitoring deployment in Cloud Run console.

---

## Metadata

- **Owner**: Platform Team
- **Last Verified**: 2025-11-12
- **Verification Frequency**: Weekly (every production deploy)
- **Estimated Duration**: 5-8 minutes (automated), 10-15 minutes (manual)
- **Complexity**: 🟡 Medium
- **Prerequisites**: GCP access with Cloud Run Admin role, Pulumi access, GitHub access

---

## Prerequisites

### For Automated Deployment (GitHub Actions)

- [ ] **GitHub Access**: Write access to `guiofsaints/procureflow` repository
- [ ] **GitHub Secrets Configured**: `GCP_SA_KEY`, `PULUMI_ACCESS_TOKEN`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY`, `MONGODB_CONNECTION_STRING`
- [ ] **Changes Pushed to `main` Branch**: Code changes committed and pushed

### For Manual Deployment (Pulumi CLI)

- [ ] **GCP Access**: Cloud Run Admin, Artifact Registry Writer, Secret Manager Admin roles
- [ ] **gcloud CLI Installed and Authenticated**:
  ```powershell
  gcloud auth login
  gcloud config set project procureflow-dev
  ```
- [ ] **Pulumi CLI Installed**:
  ```powershell
  pulumi version  # Should show v3.x.x
  ```
- [ ] **Pulumi Access Token Configured**:
  ```powershell
  pulumi login
  # Enter access token from https://app.pulumi.com/account/tokens
  ```
- [ ] **Docker Image Built and Pushed** (for manual Pulumi deploy):
  ```powershell
  # Build and push Docker image manually (if not using GitHub Actions)
  # See Step 3 in Manual Procedure
  ```

---

## Procedure A: Automated Deployment (GitHub Actions)

### Step 1: Verify Code Changes Pushed to `main`

**Description**: Ensure your code changes are committed and pushed to `main` branch

**Commands**:

```powershell
# Check current branch
git branch --show-current
# Expected: main

# Check status (should be clean)
git status

# If changes not committed, commit them:
git add .
git commit -m "feat: your feature description"

# Push to main (triggers deployment)
git push origin main
```

**Expected Output**:

```
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Writing objects: 100% (3/3), 1.23 KiB | 1.23 MiB/s, done.
Total 3 (delta 2), reused 0 (delta 0)
To https://github.com/guiofsaints/procureflow.git
   abc123f..def456a  main -> main
```

**Verification**:

- [ ] `git status` shows "nothing to commit, working tree clean"
- [ ] `git push` completed successfully
- [ ] Changes visible on GitHub: https://github.com/guiofsaints/procureflow/commits/main

---

### Step 2: Monitor GitHub Actions Workflow

**Description**: Watch deployment progress in GitHub Actions UI

**Navigate To**:

```
https://github.com/guiofsaints/procureflow/actions
```

**Workflow Triggered**:

- **Name**: "Deploy to GCP (FREE TIER)"
- **Trigger**: Push to `main` branch
- **Duration**: ~5-8 minutes

**Monitor Jobs**:

1. **Job 1: Build Docker Image** (~3-4 minutes)
   - ✅ Checkout code
   - ✅ Authenticate to GCP
   - ✅ Generate image tag (e.g., `sha-abc123f`)
   - ✅ Build Docker image
   - ✅ Push to Artifact Registry

2. **Job 2: Deploy with Pulumi** (~2-3 minutes)
   - ✅ Setup Node.js and pnpm
   - ✅ Install Pulumi dependencies
   - ✅ Select Pulumi stack (`dev`)
   - ✅ Configure stack (secrets, image tag)
   - ✅ Pulumi preview (dry-run)
   - ✅ Pulumi up (apply changes)
   - ✅ Export service URL

3. **Job 3: Health Check** (~30 seconds)
   - ✅ Wait 30 seconds (service startup)
   - ✅ Check `/api/health` (HTTP 200)
   - ✅ Check `/` (HTTP 200 or 302)

**Verification**:

- [ ] All 3 jobs show ✅ green checkmark
- [ ] Total workflow time: ~5-8 minutes
- [ ] No red ❌ failures

---

### Step 3: Verify Deployment in Cloud Run Console

**Description**: Confirm new revision deployed and serving traffic

**Navigate To**:

```
https://console.cloud.google.com/run/detail/us-central1/procureflow-web
```

**Check Revision**:

- **Latest Revision**: Should show new tag (e.g., `procureflow-web-00042-sha-abc123f`)
- **Traffic**: Should show **100%** traffic to new revision
- **Status**: Should show ✅ **Healthy**

**Check Logs**:

```
Click "Logs" tab → Filter by "Severity: Error" → Should see no errors in last 5 minutes
```

**Verification**:

- [ ] New revision deployed (matches git commit SHA)
- [ ] New revision serving 100% traffic
- [ ] Status shows ✅ Healthy
- [ ] No errors in logs

---

### Step 4: Run Smoke Tests

**Description**: Manually test critical user flows to ensure deployment successful

**Test 1: Health Check** (Automated in Job 3, verify manually):

```powershell
# Get service URL from Cloud Run console or Pulumi output
$SERVICE_URL = "https://procureflow-web-xyz.run.app"

# Test health endpoint
curl -s $SERVICE_URL/api/health

# Expected: {"status":"ok","timestamp":"2025-11-12T..."}
```

**Test 2: Login Flow**:

1. Navigate to: $SERVICE_URL
2. Login with: `demo@procureflow.com` / `demo123`
3. Expected: Redirect to `/catalog`

**Test 3: Catalog Search**:

1. Search for: "pen"
2. Expected: 5+ results displayed

**Test 4: Add to Cart**:

1. Click "Add to Cart" on any item
2. Enter quantity: 5
3. Expected: Cart badge shows "1"

**Test 5: Checkout**:

1. Navigate to Cart
2. Click "Checkout"
3. Expected: PR number displayed, cart cleared

**Verification**:

- [ ] Health check returns 200
- [ ] Login successful
- [ ] Catalog search works
- [ ] Add to cart works
- [ ] Checkout completes

---

## Procedure B: Manual Deployment (Pulumi CLI)

### Step 1: Authenticate to GCP

**Description**: Authenticate gcloud CLI with GCP project

**Commands**:

```powershell
# Login to GCP
gcloud auth login

# Set project
gcloud config set project procureflow-dev

# Verify authentication
gcloud auth list

# Expected: Active account shown
```

**Verification**:

- [ ] `gcloud auth list` shows active account
- [ ] `gcloud config get-value project` returns `procureflow-dev`

---

### Step 2: Login to Pulumi

**Description**: Authenticate Pulumi CLI with Pulumi Cloud

**Commands**:

```powershell
# Login to Pulumi (opens browser for authentication)
pulumi login

# Verify login
pulumi whoami

# Expected: Your Pulumi username
```

**Verification**:

- [ ] `pulumi whoami` returns your username
- [ ] No "not logged in" error

---

### Step 3: Build and Push Docker Image (Manual)

**Description**: Build Docker image locally and push to Artifact Registry

**Commands**:

```powershell
# Navigate to project root
cd C:\Workspace\procureflow

# Authenticate Docker to Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Set variables
$GCP_PROJECT_ID = "procureflow-dev"
$IMAGE_TAG = "manual-$(git rev-parse --short HEAD)"
$IMAGE_URL = "us-central1-docker.pkg.dev/$GCP_PROJECT_ID/procureflow/web"

# Build Docker image
docker build `
  -f packages/infra/docker/Dockerfile.web `
  --build-arg GIT_COMMIT_SHA=$(git rev-parse HEAD) `
  --build-arg BUILD_DATE=$(Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ") `
  --build-arg VERSION=$IMAGE_TAG `
  -t $IMAGE_URL:$IMAGE_TAG `
  -t $IMAGE_URL:latest `
  .

# Push Docker image
docker push $IMAGE_URL:$IMAGE_TAG
docker push $IMAGE_URL:latest

# Verify image pushed
gcloud artifacts docker images list us-central1-docker.pkg.dev/$GCP_PROJECT_ID/procureflow/web
```

**Expected Output**:

```
Successfully built abc123def456
Successfully tagged us-central1-docker.pkg.dev/procureflow-dev/procureflow/web:manual-abc123f
Successfully tagged us-central1-docker.pkg.dev/procureflow-dev/procureflow/web:latest
Pushing...
Pushed: manual-abc123f
```

**Verification**:

- [ ] Docker build completed successfully
- [ ] Docker push completed (2 tags: manual-abc123f, latest)
- [ ] Image visible in Artifact Registry console

---

### Step 4: Deploy with Pulumi

**Description**: Execute Pulumi deployment to selected stack (dev/staging/production)

**Commands**:

```powershell
# Navigate to Pulumi project
cd packages/infra/pulumi/gcp

# Install Pulumi dependencies
pnpm install

# Select stack (dev/staging/production)
pulumi stack select dev  # or staging, production

# Configure stack
pulumi config set gcp:project procureflow-dev
pulumi config set gcp:region us-central1
pulumi config set environment dev
pulumi config set image-tag $IMAGE_TAG  # From Step 3

# Set secrets (replace with actual values)
pulumi config set --secret nextauth-secret "your-secret-here"
pulumi config set --secret openai-api-key "your-key-here"
pulumi config set --secret mongodb-connection-string "mongodb+srv://..."

# Preview changes (dry-run)
pulumi preview

# Review preview output (shows resources to create/update/delete)
# If looks good, apply changes:
pulumi up

# Pulumi prompts: "Do you want to perform this update? yes/no"
# Type: yes
```

**Expected Output**:

```
Updating (dev)

View Live: https://app.pulumi.com/...

     Type                           Name                   Status
     pulumi:pulumi:Stack            procureflow-dev
 ~   └─ gcp:cloudrun:Service        procureflow-web        updated (2)

Outputs:
    serviceUrl: "https://procureflow-web-xyz.run.app"

Resources:
    ~ 1 updated
    1 unchanged

Duration: 45s
```

**Verification**:

- [ ] `pulumi preview` shows expected changes (1-2 resources updated)
- [ ] `pulumi up` completes successfully
- [ ] Service URL output displayed

---

### Step 5: Update NEXTAUTH_URL

**Description**: Update Cloud Run env var with actual service URL

**Commands**:

```powershell
# Get service URL from Pulumi output
$SERVICE_URL = pulumi stack output serviceUrl

# Update Cloud Run env var
gcloud run services update procureflow-web `
  --region=us-central1 `
  --update-env-vars="NEXTAUTH_URL=$SERVICE_URL"

# Verify env var updated
gcloud run services describe procureflow-web `
  --region=us-central1 `
  --format=yaml | Select-String "NEXTAUTH_URL"
```

**Expected Output**:

```
Deploying container to Cloud Run service [procureflow-web]...
✓ Deploying... Done.
  ✓ Creating Revision...
  ✓ Routing traffic...
Done.
```

**Verification**:

- [ ] Env var update completed
- [ ] `NEXTAUTH_URL` matches service URL

---

### Step 6: Verify Deployment

**Description**: Run health check and smoke tests (same as Procedure A, Step 4)

**Commands**:

```powershell
# Wait 30 seconds for service startup
Start-Sleep -Seconds 30

# Health check
$SERVICE_URL = pulumi stack output serviceUrl
curl -s $SERVICE_URL/api/health

# Expected: {"status":"ok","timestamp":"..."}
```

**Manual Smoke Tests**: Follow Step 4 from Procedure A

**Verification**:

- [ ] Health check returns 200
- [ ] Smoke tests pass (login, search, cart, checkout)

---

## Verification

### Final Checks

**Deployment Status**:

- [ ] GitHub Actions workflow shows ✅ all jobs passed (Procedure A) OR Pulumi up succeeded (Procedure B)
- [ ] Cloud Run console shows new revision deployed
- [ ] New revision serving 100% traffic
- [ ] Service status shows ✅ Healthy

**Application Health**:

- [ ] Health endpoint returns 200: `GET /api/health`
- [ ] Root endpoint returns 200 or 302: `GET /`
- [ ] Smoke tests passed: Login, search, cart, checkout all working

**Monitoring**:

- [ ] Cloud Run logs show no errors in last 5 minutes
- [ ] No alerts triggered (if monitoring configured)

---

## Rollback

### If Deployment Fails

**GitHub Actions Job 3 (Health Check) Failed**:

```
❌ Health check failed (HTTP 500)
```

**Action**:

1. GitHub Actions workflow stops (no traffic routed to new revision)
2. Cloud Run automatically serves previous revision (zero downtime)
3. Investigate failure: Check Cloud Run logs for errors
4. Fix issue, push new commit to trigger re-deployment

---

**Pulumi Up Failed**:

```
error: update failed
```

**Action**:

1. Review error message (Pulumi output shows detailed error)
2. Fix infrastructure code or configuration
3. Re-run `pulumi up`
4. If state corrupted: See [Rollback Runbook](./rollback.md) for Pulumi state rollback

---

**Deployment Succeeded but Application Broken**:

```
✅ Health check passed, but critical feature broken (e.g., checkout fails)
```

**Action**:

1. Execute [Rollback Runbook](./rollback.md) → Cloud Run traffic split to previous revision
2. Rollback time: ~2-5 minutes
3. Investigate issue in rolled-back environment
4. Fix and re-deploy

---

## Troubleshooting

### Common Issues

**Issue 1: "Docker build failed"**

```
ERROR: failed to solve: dockerfile parse error
```

**Solution**:

```powershell
# Check Dockerfile syntax
cat packages/infra/docker/Dockerfile.web

# Verify Dockerfile exists
Test-Path packages/infra/docker/Dockerfile.web

# If syntax error, fix Dockerfile and rebuild
```

---

**Issue 2: "Pulumi preview shows unexpected changes"**

```
~ 5 to update
- 2 to delete
```

**Solution**:

```powershell
# Review detailed preview
pulumi preview --diff

# If changes unexpected, check:
# 1. Pulumi stack selected: pulumi stack
# 2. Pulumi config: pulumi config
# 3. GCP project: gcloud config get-value project

# If config incorrect, reconfigure and re-preview
```

---

**Issue 3: "Health check failed (HTTP 500)"**

```
❌ Health check failed (HTTP 500)
```

**Solution**:

```powershell
# Check Cloud Run logs
gcloud run services logs read procureflow-web `
  --region=us-central1 `
  --limit=50

# Look for error messages (MongoDB connection, env var issues, etc.)
# Fix issue and re-deploy
```

---

**Issue 4: "NEXTAUTH_URL not updated"**

```
Login redirects to wrong URL (old service URL)
```

**Solution**:

```powershell
# Get correct service URL
$SERVICE_URL = pulumi stack output serviceUrl

# Update env var manually
gcloud run services update procureflow-web `
  --region=us-central1 `
  --update-env-vars="NEXTAUTH_URL=$SERVICE_URL"
```

---

## Escalation Path

**If deployment fails after troubleshooting**:

1. **First**: Review [Deployment Strategy](../../operations/deployment-strategy.md) documentation
2. **Second**: Execute [Rollback Runbook](./rollback.md) to restore previous working state
3. **Third**: Check Cloud Run service logs for detailed error messages:
   ```powershell
   gcloud run services logs read procureflow-web --region=us-central1 --limit=100
   ```
4. **Fourth**: Post in team Slack channel #platform-support with:
   - Deployment attempt timestamp
   - Environment (dev/staging/production)
   - GitHub Actions workflow URL (if automated)
   - Error message from logs
   - Steps already attempted
5. **Fifth**: If production deployment blocked, escalate to Tech Lead or on-call engineer

---

## References

### Internal Documents

- [Deployment Strategy](../../operations/deployment-strategy.md) - Deployment process overview
- [Rollback Runbook](./rollback.md) - Rollback procedures
- [Infrastructure Documentation](../../architecture/infrastructure.md) - GCP setup and architecture

### External Resources

- [GCP Cloud Run Documentation](https://cloud.google.com/run/docs) - Cloud Run reference
- [Pulumi GCP Provider](https://www.pulumi.com/registry/packages/gcp/) - Pulumi IaC reference
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions) - CI/CD syntax

---

**Last Updated**: 2025-11-12  
**Status**: ✅ Verified (Platform Team deployed to dev environment successfully)
