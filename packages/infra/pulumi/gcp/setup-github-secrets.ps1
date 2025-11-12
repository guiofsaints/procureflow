# ============================================================================
# ProcureFlow - GitHub Actions Service Account Setup
# ============================================================================
# 
# This script creates a GCP Service Account for GitHub Actions and generates
# the necessary secrets for CI/CD deployment.
#
# Prerequisites:
# - gcloud CLI installed and authenticated
# - PowerShell 5.1 or later
# - Owner/Editor permissions on GCP project
#
# Usage:
#   .\setup-github-secrets.ps1
#
# ============================================================================

param(
    [string]$ProjectId = "procureflow-dev",
    [string]$ServiceAccountName = "github-actions"
)

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  ProcureFlow - GitHub Actions Service Account Setup" -ForegroundColor Cyan
Write-Host "============================================================================`n" -ForegroundColor Cyan

# Ensure gcloud is in PATH
$env:Path += ";C:\Users\guilh\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin"

# Set active project
Write-Host "📋 Setting active GCP project: $ProjectId" -ForegroundColor Yellow
gcloud config set project $ProjectId

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set project. Please check project ID." -ForegroundColor Red
    exit 1
}

# Check if service account already exists
$SA_EMAIL = "$ServiceAccountName@$ProjectId.iam.gserviceaccount.com"
Write-Host "`n🔍 Checking if service account already exists..." -ForegroundColor Yellow

$existingSA = gcloud iam service-accounts list --filter="email:$SA_EMAIL" --format="value(email)" 2>$null

if ($existingSA) {
    Write-Host "⚠️  Service account already exists: $SA_EMAIL" -ForegroundColor Yellow
    $response = Read-Host "Do you want to continue and create a new key? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "❌ Aborted by user." -ForegroundColor Red
        exit 0
    }
} else {
    # Create service account
    Write-Host "`n🔧 Creating service account: $ServiceAccountName" -ForegroundColor Green
    gcloud iam service-accounts create $ServiceAccountName `
        --display-name="GitHub Actions Deployer" `
        --description="Service account for GitHub Actions CI/CD pipeline"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create service account." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Service account created successfully!" -ForegroundColor Green
}

# Grant permissions
Write-Host "`n🔑 Granting IAM permissions..." -ForegroundColor Yellow

$roles = @(
    "roles/run.admin",
    "roles/iam.serviceAccountUser",
    "roles/artifactregistry.writer",
    "roles/secretmanager.admin",
    "roles/storage.admin"
)

foreach ($role in $roles) {
    Write-Host "   - Granting $role..." -ForegroundColor Gray
    gcloud projects add-iam-policy-binding $ProjectId `
        --member="serviceAccount:$SA_EMAIL" `
        --role="$role" `
        --quiet 2>$null | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "     ✅ $role granted" -ForegroundColor Green
    } else {
        Write-Host "     ⚠️  $role may already exist" -ForegroundColor Yellow
    }
}

# Create key file
Write-Host "`n🔐 Creating service account key..." -ForegroundColor Yellow
$keyFile = "github-actions-key.json"

if (Test-Path $keyFile) {
    Remove-Item $keyFile -Force
}

gcloud iam service-accounts keys create $keyFile `
    --iam-account=$SA_EMAIL

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create service account key." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Key file created: $keyFile" -ForegroundColor Green

# Convert to Base64
Write-Host "`n🔄 Converting key to Base64..." -ForegroundColor Yellow
$keyBytes = [System.IO.File]::ReadAllBytes($keyFile)
$keyBase64 = [System.Convert]::ToBase64String($keyBytes)

Write-Host "✅ Base64 conversion complete!" -ForegroundColor Green

# Get Pulumi config values
Write-Host "`n📝 Reading Pulumi configuration..." -ForegroundColor Yellow
$pulumiConfig = pulumi config --show-secrets 2>$null

# Parse Pulumi config
$nextauthSecret = ($pulumiConfig | Select-String "nextauth-secret\s+(.+)").Matches.Groups[1].Value.Trim()
$openaiApiKey = ($pulumiConfig | Select-String "openai-api-key\s+(.+)").Matches.Groups[1].Value.Trim()
$mongodbConnectionString = ($pulumiConfig | Select-String "mongodb-connection-string\s+(.+)").Matches.Groups[1].Value.Trim()
$mongodbAtlasPublicKey = ($pulumiConfig | Select-String "mongodbatlas:publicKey\s+(.+)").Matches.Groups[1].Value.Trim()
$mongodbAtlasPrivateKey = ($pulumiConfig | Select-String "mongodbatlas:privateKey\s+(.+)").Matches.Groups[1].Value.Trim()
$mongodbProjectId = ($pulumiConfig | Select-String "mongodb-project-id\s+(.+)").Matches.Groups[1].Value.Trim()

# Display GitHub Secrets
Write-Host "`n============================================================================" -ForegroundColor Cyan
Write-Host "  GitHub Secrets Configuration" -ForegroundColor Cyan
Write-Host "============================================================================`n" -ForegroundColor Cyan

Write-Host "📍 Go to: https://github.com/guiofsaints/procureflow/settings/secrets/actions`n" -ForegroundColor White

Write-Host "Copy and paste these values into GitHub Secrets:`n" -ForegroundColor Yellow

$secrets = @(
    @{Name="GCP_PROJECT_ID"; Value=$ProjectId; Description="GCP Project ID"},
    @{Name="GCP_SA_KEY"; Value=$keyBase64; Description="Service Account Key (Base64)"},
    @{Name="NEXTAUTH_SECRET"; Value=$nextauthSecret; Description="NextAuth.js secret"},
    @{Name="OPENAI_API_KEY"; Value=$openaiApiKey; Description="OpenAI API Key"},
    @{Name="MONGODB_CONNECTION_STRING"; Value=$mongodbConnectionString; Description="MongoDB connection string"},
    @{Name="MONGODB_ATLAS_PUBLIC_KEY"; Value=$mongodbAtlasPublicKey; Description="MongoDB Atlas public API key"},
    @{Name="MONGODB_ATLAS_PRIVATE_KEY"; Value=$mongodbAtlasPrivateKey; Description="MongoDB Atlas private API key"},
    @{Name="MONGODB_PROJECT_ID"; Value=$mongodbProjectId; Description="MongoDB Atlas project ID"}
)

foreach ($secret in $secrets) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "Secret Name: " -NoNewline -ForegroundColor Cyan
    Write-Host $secret.Name -ForegroundColor White
    Write-Host "Description: " -NoNewline -ForegroundColor Gray
    Write-Host $secret.Description -ForegroundColor Gray
    
    if ($secret.Value.Length -gt 100) {
        Write-Host "Value:       " -NoNewline -ForegroundColor Yellow
        Write-Host "$($secret.Value.Substring(0, 80))..." -ForegroundColor White
        Write-Host "             (truncated - full value in secrets-output.txt)" -ForegroundColor DarkGray
    } else {
        Write-Host "Value:       " -NoNewline -ForegroundColor Yellow
        Write-Host $secret.Value -ForegroundColor White
    }
    Write-Host ""
}

# Save to file for easy copy-paste
$outputFile = "github-secrets-output.txt"
$secretsText = @"
============================================================================
  GitHub Secrets for ProcureFlow CI/CD
  Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
============================================================================

Add these secrets to: https://github.com/guiofsaints/procureflow/settings/secrets/actions

"@

foreach ($secret in $secrets) {
    $secretsText += @"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Secret Name: $($secret.Name)
Description: $($secret.Description)
Value:
$($secret.Value)

"@
}

$secretsText += @"

============================================================================
IMPORTANT: 
1. Add PULUMI_ACCESS_TOKEN manually (get from https://app.pulumi.com/account/tokens)
2. Delete this file after copying secrets: $outputFile
3. Delete service account key file: $keyFile
============================================================================
"@

$secretsText | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Write-Host "`n💾 All secrets saved to: " -NoNewline -ForegroundColor Yellow
Write-Host $outputFile -ForegroundColor White

Write-Host "`n⚠️  MISSING SECRET:" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Secret Name: " -NoNewline -ForegroundColor Cyan
Write-Host "PULUMI_ACCESS_TOKEN" -ForegroundColor White
Write-Host "Description: " -NoNewline -ForegroundColor Gray
Write-Host "Pulumi Cloud access token" -ForegroundColor Gray
Write-Host "Get from:    " -NoNewline -ForegroundColor Yellow
Write-Host "https://app.pulumi.com/account/tokens" -ForegroundColor White
Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "  1. Go to https://app.pulumi.com/account/tokens" -ForegroundColor Gray
Write-Host "  2. Click 'Create token'" -ForegroundColor Gray
Write-Host "  3. Name: 'github-actions-procureflow'" -ForegroundColor Gray
Write-Host "  4. Copy the token value" -ForegroundColor Gray
Write-Host "  5. Add to GitHub Secrets as PULUMI_ACCESS_TOKEN" -ForegroundColor Gray
Write-Host ""

Write-Host "`n🧹 Cleanup:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$cleanup = Read-Host "Do you want to delete the local key file now? (Y/n)"
if ($cleanup -ne 'n' -and $cleanup -ne 'N') {
    Remove-Item $keyFile -Force
    Write-Host "✅ Deleted: $keyFile" -ForegroundColor Green
} else {
    Write-Host "⚠️  Remember to delete $keyFile manually!" -ForegroundColor Yellow
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`n📚 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Open GitHub: https://github.com/guiofsaints/procureflow/settings/secrets/actions" -ForegroundColor Gray
Write-Host "  2. Add all secrets from $outputFile" -ForegroundColor Gray
Write-Host "  3. Get PULUMI_ACCESS_TOKEN from https://app.pulumi.com/account/tokens" -ForegroundColor Gray
Write-Host "  4. Delete $outputFile after copying secrets" -ForegroundColor Gray
Write-Host "  5. Push to 'main' branch to trigger deployment" -ForegroundColor Gray
Write-Host "`n============================================================================`n" -ForegroundColor Cyan
