# Setup Scripts

Automated scripts to configure GCP service accounts and GitHub Actions for ProcureFlow deployment.

## 📋 Available Scripts

### `setup-github-actions-permissions.ps1` / `.sh`

Configures the GitHub Actions service account with all necessary IAM roles for CI/CD deployments.

**Permissions Granted:**

- `roles/run.admin` - Deploy Cloud Run services
- `roles/iam.serviceAccountUser` - Use service accounts
- `roles/artifactregistry.writer` - Push Docker images
- `roles/secretmanager.admin` - Manage secrets
- `roles/iam.serviceAccountAdmin` - Update service accounts
- `roles/compute.viewer` - List GCP regions

## 🚀 Quick Start

### PowerShell (Windows/macOS/Linux)

```powershell
cd packages/infra/pulumi/gcp/scripts/setup
.\setup-github-actions-permissions.ps1
```

### Bash (macOS/Linux)

```bash
cd packages/infra/pulumi/gcp/scripts/setup
chmod +x setup-github-actions-permissions.sh
./setup-github-actions-permissions.sh
```

## 📝 What the Script Does

1. **Checks** if the `github-actions` service account exists
2. **Creates** the service account if it doesn't exist
3. **Grants** all necessary IAM roles
4. **Displays** a summary of granted permissions
5. **Provides** next steps for creating keys and configuring GitHub Secrets

## 🔑 After Running the Script

### 1. Create Service Account Key

```bash
PROJECT_ID=$(gcloud config get-value project)
SA_EMAIL="github-actions@$PROJECT_ID.iam.gserviceaccount.com"

gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=$SA_EMAIL
```

### 2. Add to GitHub Secrets

Go to: `https://github.com/YOUR_ORG/procureflow/settings/secrets/actions`

Create the following secrets:

| Secret Name                 | Value                                | Notes                                      |
| --------------------------- | ------------------------------------ | ------------------------------------------ |
| `GCP_PROJECT_ID`            | Your GCP project ID                  | e.g., `procureflow-dev`                    |
| `GCP_SA_KEY`                | Content of `github-actions-key.json` | Copy entire JSON, not base64               |
| `PULUMI_ACCESS_TOKEN`       | Pulumi token                         | From https://app.pulumi.com/account/tokens |
| `NEXTAUTH_SECRET`           | Random string                        | Generate: `openssl rand -base64 32`        |
| `OPENAI_API_KEY`            | OpenAI API key                       | Or `"not-set"` if not using AI features    |
| `MONGODB_CONNECTION_STRING` | MongoDB URI                          | `mongodb+srv://...`                        |

### 3. Delete Local Key File

```bash
# Security best practice: delete the local key file
rm github-actions-key.json
```

## ⚠️ Security Notes

- **Never commit** service account keys to Git
- **Delete** local key files after uploading to GitHub Secrets
- **Use least-privilege** permissions (scripts already do this)
- **Rotate** service account keys periodically

## 🔍 Troubleshooting

### "Permission denied" errors

Make sure you have `roles/resourcemanager.projectIamAdmin` on the GCP project:

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:YOUR_EMAIL@example.com" \
  --role="roles/resourcemanager.projectIamAdmin"
```

### Service account already exists

The script will detect existing service accounts and skip creation, only granting missing permissions.

### GitHub Actions still failing

1. Verify all secrets are set in GitHub
2. Check service account has all roles (run script again)
3. Verify service account key is valid (not expired)

## 📚 Related Documentation

- [GitHub Actions Workflow](../../../../../.github/workflows/deploy-gcp.yml)
- [Pulumi Documentation](../../docs/SETUP.md)
- [GCP IAM Roles](https://cloud.google.com/iam/docs/understanding-roles)
