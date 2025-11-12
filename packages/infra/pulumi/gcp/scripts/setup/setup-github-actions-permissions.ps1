<#
.SYNOPSIS
    Setup GitHub Actions Service Account Permissions

.DESCRIPTION
    This script grants the necessary IAM roles to the github-actions service account
    to deploy ProcureFlow infrastructure via Pulumi.

.EXAMPLE
    .\setup-github-actions-permissions.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "GitHub Actions Service Account Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Get current GCP project
$PROJECT_ID = gcloud config get-value project 2>$null

if ([string]::IsNullOrEmpty($PROJECT_ID)) {
    Write-Host "❌ Error: No GCP project configured." -ForegroundColor Red
    Write-Host "   Run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Project: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Service account email
$SA_NAME = "github-actions"
$SA_EMAIL = "${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

Write-Host "🔍 Checking if service account exists..." -ForegroundColor Cyan

# Check if service account exists
$saExists = gcloud iam service-accounts describe $SA_EMAIL --project=$PROJECT_ID 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Service account not found. Creating..." -ForegroundColor Yellow
    gcloud iam service-accounts create $SA_NAME `
        --display-name="GitHub Actions CI/CD" `
        --description="Service account for GitHub Actions deployments" `
        --project=$PROJECT_ID
    Write-Host "✅ Service account created: $SA_EMAIL" -ForegroundColor Green
} else {
    Write-Host "✅ Service account already exists: $SA_EMAIL" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔐 Granting IAM roles..." -ForegroundColor Cyan

# Array of roles to grant
$roles = @(
    # Cloud Run permissions
    "roles/run.admin",
    "roles/iam.serviceAccountUser",
    
    # Artifact Registry permissions
    "roles/artifactregistry.writer",
    
    # Secret Manager permissions
    "roles/secretmanager.admin",
    
    # Service Account permissions (to update service accounts)
    "roles/iam.serviceAccountAdmin",
    
    # Compute Engine permissions (for regions list)
    "roles/compute.viewer"
)

foreach ($role in $roles) {
    Write-Host "  → Granting $role..." -ForegroundColor Gray
    gcloud projects add-iam-policy-binding $PROJECT_ID `
        --member="serviceAccount:$SA_EMAIL" `
        --role="$role" `
        --condition=None `
        --quiet | Out-Null
}

Write-Host ""
Write-Host "✅ All permissions granted successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📋 Summary" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Account: $SA_EMAIL" -ForegroundColor White
Write-Host ""
Write-Host "Roles Granted:" -ForegroundColor White
foreach ($role in $roles) {
    Write-Host "  ✓ $role" -ForegroundColor Green
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📝 Next Steps" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create service account key (if not already created):" -ForegroundColor Yellow
Write-Host ""
Write-Host "   gcloud iam service-accounts keys create github-actions-key.json ``" -ForegroundColor Gray
Write-Host "     --iam-account=$SA_EMAIL" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Add key to GitHub Secrets:" -ForegroundColor Yellow
Write-Host "   - Go to: https://github.com/YOUR_ORG/procureflow/settings/secrets/actions" -ForegroundColor Gray
Write-Host "   - Create secret: GCP_SA_KEY" -ForegroundColor Gray
Write-Host "   - Value: Copy entire content of github-actions-key.json" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Delete local key file (security best practice):" -ForegroundColor Yellow
Write-Host "   Remove-Item github-actions-key.json" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
