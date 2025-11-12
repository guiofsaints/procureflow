#!/bin/bash
#
# Setup GitHub Actions Service Account Permissions
#
# This script grants the necessary IAM roles to the github-actions service account
# to deploy ProcureFlow infrastructure via Pulumi.
#
# Usage:
#   chmod +x setup-github-actions-permissions.sh
#   ./setup-github-actions-permissions.sh
#
# Or from PowerShell:
#   bash setup-github-actions-permissions.sh

set -e

echo "========================================="
echo "GitHub Actions Service Account Setup"
echo "========================================="
echo ""

# Get current GCP project
PROJECT_ID=$(gcloud config get-value project)

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: No GCP project configured."
  echo "   Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "📋 Project: $PROJECT_ID"
echo ""

# Service account email
SA_NAME="github-actions"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🔍 Checking if service account exists..."
if ! gcloud iam service-accounts describe $SA_EMAIL --project=$PROJECT_ID &>/dev/null; then
  echo "⚠️  Service account not found. Creating..."
  gcloud iam service-accounts create $SA_NAME \
    --display-name="GitHub Actions CI/CD" \
    --description="Service account for GitHub Actions deployments" \
    --project=$PROJECT_ID
  echo "✅ Service account created: $SA_EMAIL"
else
  echo "✅ Service account already exists: $SA_EMAIL"
fi

echo ""
echo "🔐 Granting IAM roles..."

# Array of roles to grant
roles=(
  # Cloud Run permissions
  "roles/run.admin"
  "roles/iam.serviceAccountUser"
  
  # Artifact Registry permissions
  "roles/artifactregistry.writer"
  
  # Secret Manager permissions
  "roles/secretmanager.admin"
  
  # Service Account permissions (to update service accounts)
  "roles/iam.serviceAccountAdmin"
  
  # Compute Engine permissions (for regions list)
  "roles/compute.viewer"
)

for role in "${roles[@]}"; do
  echo "  → Granting $role..."
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$role" \
    --condition=None \
    --quiet >/dev/null
done

echo ""
echo "✅ All permissions granted successfully!"
echo ""
echo "========================================="
echo "📋 Summary"
echo "========================================="
echo ""
echo "Service Account: $SA_EMAIL"
echo ""
echo "Roles Granted:"
for role in "${roles[@]}"; do
  echo "  ✓ $role"
done

echo ""
echo "========================================="
echo "📝 Next Steps"
echo "========================================="
echo ""
echo "1. Create service account key (if not already created):"
echo ""
echo "   gcloud iam service-accounts keys create github-actions-key.json \\"
echo "     --iam-account=$SA_EMAIL"
echo ""
echo "2. Add key to GitHub Secrets:"
echo "   - Go to: https://github.com/YOUR_ORG/procureflow/settings/secrets/actions"
echo "   - Create secret: GCP_SA_KEY"
echo "   - Value: Copy entire content of github-actions-key.json"
echo ""
echo "3. Delete local key file (security best practice):"
echo "   rm github-actions-key.json"
echo ""
echo "✅ Setup complete!"
