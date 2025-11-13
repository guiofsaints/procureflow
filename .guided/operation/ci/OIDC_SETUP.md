# OIDC Setup Guide for GitHub Actions → GCP

**Purpose**: Configure Workload Identity Federation for keyless authentication from GitHub Actions to Google Cloud Platform.

**Status**: ⚠️ **REQUIRED** - Workflows configured but OIDC not yet set up

---

## Quick Setup (Automated)

Run this script to set up OIDC automatically:

```powershell
# From repository root
cd packages/infra/pulumi/gcp/scripts/setup
.\setup-oidc.ps1
```

Or manually follow the steps below.

---

## Manual Setup Instructions

### Step 1: Get GCP Project Information

```bash
# Get your project ID and number
export GCP_PROJECT_ID=$(gcloud config get-value project)
export GCP_PROJECT_NUMBER=$(gcloud projects describe $GCP_PROJECT_ID --format='value(projectNumber)')

echo "Project ID: $GCP_PROJECT_ID"
echo "Project Number: $GCP_PROJECT_NUMBER"
```

### Step 2: Enable Required APIs

```bash
gcloud services enable \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  sts.googleapis.com
```

### Step 3: Create Workload Identity Pool

```bash
gcloud iam workload-identity-pools create github \
  --location=global \
  --display-name="GitHub Actions" \
  --description="Workload Identity Pool for GitHub Actions CI/CD"
```

### Step 4: Create OIDC Provider

```bash
gcloud iam workload-identity-pools providers create-oidc github-oidc \
  --workload-identity-pool=github \
  --location=global \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'guiofsaints'"
```

**Important**: The `attribute-condition` restricts access to repositories owned by `guiofsaints`. Adjust if needed.

### Step 5: Create Service Accounts (if not exists)

```bash
# CI service account (for building and pushing images)
gcloud iam service-accounts create github-actions-ci \
  --display-name="GitHub Actions CI" \
  --description="Service account for GitHub Actions CI workflows"

# Deploy service account (for deploying infrastructure)
gcloud iam service-accounts create github-actions-deploy \
  --display-name="GitHub Actions Deploy" \
  --description="Service account for GitHub Actions deploy workflows"
```

### Step 6: Grant IAM Permissions

#### CI Service Account (Build & Push)

```bash
# Artifact Registry Writer (push Docker images)
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-actions-ci@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

#### Deploy Service Account (Infrastructure)

```bash
# Cloud Run Developer (deploy services)
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-actions-deploy@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.developer"

# Secret Manager Viewer (read secrets for Pulumi)
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-actions-deploy@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.viewer"

# Secret Manager Admin (create/update secrets)
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-actions-deploy@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.admin"

# Service Account User (impersonate Cloud Run service account)
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-actions-deploy@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# IAM Service Account Admin (manage service accounts)
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-actions-deploy@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountAdmin"

# Compute Viewer (list regions)
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-actions-deploy@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/compute.viewer"
```

### Step 7: Bind Service Accounts to Workload Identity Pool

#### Bind CI Service Account

```bash
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-ci@$GCP_PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$GCP_PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/guiofsaints/procureflow"
```

#### Bind Deploy Service Account

```bash
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-deploy@$GCP_PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$GCP_PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/guiofsaints/procureflow"
```

### Step 8: Get Workload Identity Provider Resource Name

```bash
export WIF_PROVIDER="projects/$GCP_PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github-oidc"

echo "Workload Identity Provider:"
echo $WIF_PROVIDER
```

### Step 9: Configure GitHub Repository Variables

Go to: `https://github.com/guiofsaints/procureflow/settings/variables/actions`

Create the following **Repository Variables** (not secrets):

| Variable Name | Value | Example |
|---------------|-------|---------|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | (from Step 8) | `projects/123456789/locations/global/workloadIdentityPools/github/providers/github-oidc` |
| `GCP_SERVICE_ACCOUNT_EMAIL` | Deploy SA email | `github-actions-deploy@procureflow-dev.iam.gserviceaccount.com` |

**Note**: These are **variables**, not secrets. They are not sensitive.

### Step 10: Test OIDC Authentication

Trigger a deploy workflow:

```bash
# Push to main or manual trigger
git push origin main
```

**Expected behavior**:
- Workflows use OIDC authentication (no `GCP_SA_KEY` used)
- Authentication succeeds with short-lived tokens
- No errors in workflow logs

### Step 11: Verify and Remove Legacy Key

After successful OIDC deploy:

1. Verify workflows are using OIDC:
   ```bash
   # Check workflow logs for "Authenticating with Workload Identity"
   ```

2. **Delete legacy service account key**:
   - Go to: `https://github.com/guiofsaints/procureflow/settings/secrets/actions`
   - Delete secret: `GCP_SA_KEY`

3. **Revoke any downloaded keys**:
   ```bash
   # List keys
   gcloud iam service-accounts keys list \
     --iam-account=github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com
   
   # Delete key (if any)
   gcloud iam service-accounts keys delete KEY_ID \
     --iam-account=github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com
   ```

---

## Verification Checklist

- [ ] Workload Identity Pool created
- [ ] OIDC provider configured with repository restriction
- [ ] CI service account created and bound
- [ ] Deploy service account created and bound
- [ ] GitHub variables configured (GCP_WORKLOAD_IDENTITY_PROVIDER, GCP_SERVICE_ACCOUNT_EMAIL)
- [ ] Test deploy succeeded with OIDC
- [ ] Legacy GCP_SA_KEY secret deleted
- [ ] No service account keys exist

---

## Troubleshooting

### Error: "Permission denied on workload identity pool"

**Cause**: Service account not bound to WIF pool

**Fix**:
```bash
# Re-run Step 7 binding commands
```

### Error: "Invalid value for field 'resource.name'"

**Cause**: Wrong project number or pool name

**Fix**:
```bash
# Verify project number
gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)'

# Verify pool exists
gcloud iam workload-identity-pools list --location=global
```

### Error: "Token request failed"

**Cause**: OIDC provider misconfigured

**Fix**:
```bash
# Check provider attribute mapping
gcloud iam workload-identity-pools providers describe github-oidc \
  --workload-identity-pool=github \
  --location=global
```

### Workflows still using GCP_SA_KEY

**Cause**: GitHub variables not set

**Fix**:
- Verify variables exist: `https://github.com/guiofsaints/procureflow/settings/variables/actions`
- Variable names must match exactly: `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT_EMAIL`

---

## Security Benefits

✅ **No long-lived credentials** in GitHub Secrets  
✅ **Short-lived tokens** (1 hour expiry, automatically rotated)  
✅ **Audit trail** in Cloud IAM logs  
✅ **Repository-scoped** (only guiofsaints/procureflow can authenticate)  
✅ **Least-privilege** (separate CI and deploy service accounts)  
✅ **Revocable** (disable pool to revoke all access instantly)

---

## Cost

**OIDC/Workload Identity Federation**: ✅ **FREE** (no charges)

---

## References

- [GitHub Actions OIDC with GCP](https://github.com/google-github-actions/auth#setup)
- [GCP Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [OIDC Best Practices](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-13  
**Status**: Ready for implementation
