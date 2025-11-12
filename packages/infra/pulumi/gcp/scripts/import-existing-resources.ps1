# Import existing GCP resources into Pulumi state
# Run this script if you see "already exists" errors during pulumi up

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Importing Existing GCP Resources" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Get project ID from Pulumi config
$PROJECT_ID = pulumi config get gcp:project

if (-not $PROJECT_ID) {
    Write-Host "Error: GCP project ID not configured" -ForegroundColor Red
    Write-Host "Run: pulumi config set gcp:project YOUR_PROJECT_ID"
    exit 1
}

Write-Host "Project ID: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Import Service Account
Write-Host "1. Importing Service Account..." -ForegroundColor Yellow
pulumi import gcp:serviceaccount/account:Account cloudrun-sa `
    "projects/$PROJECT_ID/serviceAccounts/procureflow-cloudrun@$PROJECT_ID.iam.gserviceaccount.com" `
    2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Service account already imported or doesn't exist" -ForegroundColor Yellow
}

# Import Secrets
Write-Host "2. Importing Secrets..." -ForegroundColor Yellow

Write-Host "   - nextauth-secret"
pulumi import gcp:secretmanager/secret:Secret nextauth-secret `
    "projects/$PROJECT_ID/secrets/nextauth-secret" `
    2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "     Already imported or doesn't exist" -ForegroundColor Yellow
}

Write-Host "   - openai-api-key"
pulumi import gcp:secretmanager/secret:Secret openai-api-key `
    "projects/$PROJECT_ID/secrets/openai-api-key" `
    2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "     Already imported or doesn't exist" -ForegroundColor Yellow
}

Write-Host "   - mongodb-uri"
pulumi import gcp:secretmanager/secret:Secret mongodb-uri `
    "projects/$PROJECT_ID/secrets/mongodb-uri" `
    2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "     Already imported or doesn't exist" -ForegroundColor Yellow
}

Write-Host "   Note: Secret versions will be recreated automatically" -ForegroundColor Yellow

# Import Artifact Registry (only if it exists - will fail if no permission)
Write-Host "3. Checking Artifact Registry..." -ForegroundColor Yellow
Write-Host "   Note: Skipping import due to permission restrictions" -ForegroundColor Yellow
Write-Host "   Artifact Registry will be managed outside Pulumi" -ForegroundColor Yellow

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Import Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run: pulumi up --yes"
Write-Host "2. The update should now succeed without 'already exists' errors"
Write-Host ""
