#!/usr/bin/env pwsh
#
# Setup OIDC (Workload Identity Federation) for GitHub Actions → GCP
#
# This script configures keyless authentication from GitHub Actions to Google Cloud Platform
# using Workload Identity Federation.
#
# Prerequisites:
# - gcloud CLI installed and authenticated
# - Active GCP project configured
# - Appropriate IAM permissions (Owner or Security Admin + Service Account Admin)
#
# Usage:
#   .\setup-oidc.ps1
#

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OIDC Setup for GitHub Actions → GCP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Step 1: Get GCP Project Information
# ============================================================================
Write-Host "Step 1: Getting GCP project information..." -ForegroundColor Yellow

$GCP_PROJECT_ID = gcloud config get-value project 2>$null
if (-not $GCP_PROJECT_ID) {
    Write-Host "❌ Error: No active GCP project. Run 'gcloud config set project PROJECT_ID'" -ForegroundColor Red
    exit 1
}

$GCP_PROJECT_NUMBER = gcloud projects describe $GCP_PROJECT_ID --format='value(projectNumber)' 2>$null
if (-not $GCP_PROJECT_NUMBER) {
    Write-Host "❌ Error: Could not get project number" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project ID: $GCP_PROJECT_ID" -ForegroundColor Green
Write-Host "✅ Project Number: $GCP_PROJECT_NUMBER" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 2: Enable Required APIs
# ============================================================================
Write-Host "Step 2: Enabling required APIs..." -ForegroundColor Yellow

$APIs = @(
    "iamcredentials.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "sts.googleapis.com"
)

foreach ($API in $APIs) {
    Write-Host "  Enabling $API..." -NoNewline
    gcloud services enable $API --project=$GCP_PROJECT_ID 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ⚠️ (may already be enabled)" -ForegroundColor Yellow
    }
}
Write-Host ""

# ============================================================================
# Step 3: Create Workload Identity Pool
# ============================================================================
Write-Host "Step 3: Creating Workload Identity Pool..." -ForegroundColor Yellow

$poolExists = gcloud iam workload-identity-pools describe github --location=global 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Workload Identity Pool 'github' already exists. Skipping creation." -ForegroundColor Yellow
} else {
    gcloud iam workload-identity-pools create github `
        --location=global `
        --display-name="GitHub Actions" `
        --description="Workload Identity Pool for GitHub Actions CI/CD" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Workload Identity Pool created" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create Workload Identity Pool" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# ============================================================================
# Step 4: Create OIDC Provider
# ============================================================================
Write-Host "Step 4: Creating OIDC provider..." -ForegroundColor Yellow

$providerExists = gcloud iam workload-identity-pools providers describe github-oidc `
    --workload-identity-pool=github `
    --location=global 2>$null
    
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  OIDC provider 'github-oidc' already exists. Skipping creation." -ForegroundColor Yellow
} else {
    gcloud iam workload-identity-pools providers create-oidc github-oidc `
        --workload-identity-pool=github `
        --location=global `
        --issuer-uri=https://token.actions.githubusercontent.com `
        --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" `
        --attribute-condition="assertion.repository_owner == 'guiofsaints'" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ OIDC provider created" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create OIDC provider" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# ============================================================================
# Step 5: Create Service Accounts
# ============================================================================
Write-Host "Step 5: Creating service accounts..." -ForegroundColor Yellow

# CI Service Account
$ciSaExists = gcloud iam service-accounts describe "github-actions-ci@$GCP_PROJECT_ID.iam.gserviceaccount.com" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Service account 'github-actions-ci' already exists. Skipping creation." -ForegroundColor Yellow
} else {
    gcloud iam service-accounts create github-actions-ci `
        --display-name="GitHub Actions CI" `
        --description="Service account for GitHub Actions CI workflows" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ CI service account created" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create CI service account" -ForegroundColor Red
        exit 1
    }
}

# Deploy Service Account
$deploySaExists = gcloud iam service-accounts describe "github-actions-deploy@$GCP_PROJECT_ID.iam.gserviceaccount.com" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Service account 'github-actions-deploy' already exists. Skipping creation." -ForegroundColor Yellow
} else {
    gcloud iam service-accounts create github-actions-deploy `
        --display-name="GitHub Actions Deploy" `
        --description="Service account for GitHub Actions deploy workflows" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deploy service account created" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create Deploy service account" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# ============================================================================
# Step 6: Grant IAM Permissions
# ============================================================================
Write-Host "Step 6: Granting IAM permissions..." -ForegroundColor Yellow

# CI Service Account Permissions
Write-Host "  Granting permissions to CI service account..." -ForegroundColor Gray
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID `
    --member="serviceAccount:github-actions-ci@$GCP_PROJECT_ID.iam.gserviceaccount.com" `
    --role="roles/artifactregistry.writer" `
    --condition=None 2>&1 | Out-Null

# Deploy Service Account Permissions
Write-Host "  Granting permissions to Deploy service account..." -ForegroundColor Gray

$deployRoles = @(
    "roles/run.developer",
    "roles/secretmanager.viewer",
    "roles/secretmanager.admin",
    "roles/iam.serviceAccountUser",
    "roles/iam.serviceAccountAdmin",
    "roles/compute.viewer"
)

foreach ($role in $deployRoles) {
    gcloud projects add-iam-policy-binding $GCP_PROJECT_ID `
        --member="serviceAccount:github-actions-deploy@$GCP_PROJECT_ID.iam.gserviceaccount.com" `
        --role=$role `
        --condition=None 2>&1 | Out-Null
}

Write-Host "✅ IAM permissions granted" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 7: Bind Service Accounts to Workload Identity Pool
# ============================================================================
Write-Host "Step 7: Binding service accounts to Workload Identity Pool..." -ForegroundColor Yellow

# Bind CI Service Account
gcloud iam service-accounts add-iam-policy-binding `
    "github-actions-ci@$GCP_PROJECT_ID.iam.gserviceaccount.com" `
    --role="roles/iam.workloadIdentityUser" `
    --member="principalSet://iam.googleapis.com/projects/$GCP_PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/guiofsaints/procureflow" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ CI service account bound to WIF pool" -ForegroundColor Green
} else {
    Write-Host "⚠️  CI service account binding may have failed (check manually)" -ForegroundColor Yellow
}

# Bind Deploy Service Account
gcloud iam service-accounts add-iam-policy-binding `
    "github-actions-deploy@$GCP_PROJECT_ID.iam.gserviceaccount.com" `
    --role="roles/iam.workloadIdentityUser" `
    --member="principalSet://iam.googleapis.com/projects/$GCP_PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/guiofsaints/procureflow" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy service account bound to WIF pool" -ForegroundColor Green
} else {
    Write-Host "⚠️  Deploy service account binding may have failed (check manually)" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================================
# Step 8: Generate Workload Identity Provider Resource Name
# ============================================================================
Write-Host "Step 8: Generating configuration..." -ForegroundColor Yellow

$WIF_PROVIDER = "projects/$GCP_PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github-oidc"
$DEPLOY_SA_EMAIL = "github-actions-deploy@$GCP_PROJECT_ID.iam.gserviceaccount.com"

Write-Host "✅ Configuration generated" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 9: Display GitHub Configuration
# ============================================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ OIDC Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configure GitHub Repository Variables:" -ForegroundColor White
Write-Host "   Go to: https://github.com/guiofsaints/procureflow/settings/variables/actions" -ForegroundColor Gray
Write-Host ""
Write-Host "   Create these VARIABLES (not secrets):" -ForegroundColor White
Write-Host ""
Write-Host "   Variable Name: GCP_WORKLOAD_IDENTITY_PROVIDER" -ForegroundColor Cyan
Write-Host "   Value:" -ForegroundColor Gray
Write-Host "   $WIF_PROVIDER" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Variable Name: GCP_SERVICE_ACCOUNT_EMAIL" -ForegroundColor Cyan
Write-Host "   Value:" -ForegroundColor Gray
Write-Host "   $DEPLOY_SA_EMAIL" -ForegroundColor Yellow
Write-Host ""

Write-Host "2. Test OIDC Authentication:" -ForegroundColor White
Write-Host "   - Push a commit to main branch or trigger a manual deploy" -ForegroundColor Gray
Write-Host "   - Check workflow logs for 'Authenticating with Workload Identity'" -ForegroundColor Gray
Write-Host "   - Verify no errors in authentication step" -ForegroundColor Gray
Write-Host ""

Write-Host "3. After Successful Test:" -ForegroundColor White
Write-Host "   - Delete GCP_SA_KEY secret from GitHub" -ForegroundColor Gray
Write-Host "   - Go to: https://github.com/guiofsaints/procureflow/settings/secrets/actions" -ForegroundColor Gray
Write-Host "   - Delete secret: GCP_SA_KEY" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Verification Commands:" -ForegroundColor White
Write-Host "   # List all service account keys (should be empty after cleanup)" -ForegroundColor Gray
Write-Host "   gcloud iam service-accounts keys list --iam-account=$DEPLOY_SA_EMAIL" -ForegroundColor Yellow
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration saved to: oidc-config.txt" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Save configuration to file
@"
OIDC Configuration for GitHub Actions
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

GCP Project ID: $GCP_PROJECT_ID
GCP Project Number: $GCP_PROJECT_NUMBER

Workload Identity Provider:
$WIF_PROVIDER

Service Account Email:
$DEPLOY_SA_EMAIL

GitHub Repository Variables (to be set):
- GCP_WORKLOAD_IDENTITY_PROVIDER = $WIF_PROVIDER
- GCP_SERVICE_ACCOUNT_EMAIL = $DEPLOY_SA_EMAIL

Next Steps:
1. Set GitHub variables: https://github.com/guiofsaints/procureflow/settings/variables/actions
2. Test deploy workflow
3. Delete GCP_SA_KEY secret after successful test
4. Verify no service account keys exist
"@ | Out-File -FilePath "oidc-config.txt" -Encoding UTF8

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
