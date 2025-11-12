# Pulumi Infrastructure Commands & Setup Guide

**Project**: procureflow-gcp  
**Last Updated**: 2025-11-11  
**Pulumi Version**: v3.205.0

---

## Quick Reference

**Most Common Commands**:
```bash
pulumi preview              # Preview changes
pulumi up                   # Apply changes
pulumi refresh              # Sync state with reality
pulumi stack output         # View outputs
pulumi config               # List config
```

---

## Prerequisites

### Required Tools

| Tool | Version | Install | Verify |
|------|---------|---------|--------|
| Node.js | 20.x | [nodejs.org](https://nodejs.org) | `node --version` |
| pnpm | 10.x | `npm install -g pnpm` | `pnpm --version` |
| Pulumi CLI | 3.x | [pulumi.com](https://pulumi.com/docs/get-started/install) | `pulumi version` |
| Google Cloud SDK | Latest | [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install) | `gcloud --version` |
| TypeScript | 5.x | Installed via pnpm | `pnpm tsc --version` |

### Optional Tools

| Tool | Purpose | Install |
|------|---------|---------|
| Docker | Local development | [docker.com](https://docker.com) |
| Infracost | Cost estimation | [infracost.io](https://infracost.io/docs) |
| MongoDB Compass | Database UI | [mongodb.com/compass](https://mongodb.com/products/compass) |

---

## Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/guiofsaints/procureflow.git
cd procureflow
```

---

### 2. Install Dependencies

```bash
# Install root dependencies
pnpm install

# Install Pulumi project dependencies
cd packages/infra/pulumi/gcp
pnpm install
```

---

### 3. Authenticate with Pulumi

**Option A: Pulumi Cloud (Recommended)**
```bash
pulumi login
```

**Option B: Local State**
```bash
pulumi login file://~/.pulumi
```

**Option C: Self-Hosted Backend**
```bash
pulumi login s3://my-bucket/pulumi
```

---

### 4. Authenticate with GCP

```bash
# Login
gcloud auth login

# Set application default credentials
gcloud auth application-default login

# Set active project
gcloud config set project procureflow-dev
```

**Verify**:
```bash
gcloud config list
gcloud auth list
```

---

### 5. Select or Create Stack

**List Existing Stacks**:
```bash
pulumi stack ls
```

**Select Stack**:
```bash
pulumi stack select dev
```

**Create New Stack**:
```bash
pulumi stack init <stack-name>
```

---

## Configuration Management

### View Configuration

**List All Config**:
```bash
pulumi config
```

**View Secrets (Decrypted)**:
```bash
pulumi config --show-secrets
```

**Get Single Value**:
```bash
pulumi config get gcp:project
pulumi config get nextauth-secret --show-secrets
```

---

### Set Configuration

**Non-Secret Values**:
```bash
pulumi config set gcp:project procureflow-dev
pulumi config set gcp:region us-central1
pulumi config set environment dev
pulumi config set image-tag latest
```

**Secret Values**:
```bash
pulumi config set --secret nextauth-secret $(openssl rand -base64 32)
pulumi config set --secret openai-api-key sk-proj-...
pulumi config set --secret mongodb-connection-string mongodb+srv://...
```

---

### Remove Configuration

```bash
pulumi config rm <key>
```

---

## Stack Operations

### Preview Changes

```bash
pulumi preview
```

**With Diff**:
```bash
pulumi preview --diff
```

**Preview Specific Resource**:
```bash
pulumi preview --target urn:pulumi:dev::procureflow-gcp::gcp:cloudrun/service:Service::procureflow-web
```

---

### Apply Changes

**Interactive (with approval)**:
```bash
pulumi up
```

**Non-Interactive (auto-approve)**:
```bash
pulumi up --yes
```

**With Parallelism Control**:
```bash
pulumi up --parallel 1  # Sequential
pulumi up --parallel 10 # Up to 10 resources in parallel
```

---

### Refresh State

**Sync state with actual infrastructure**:
```bash
pulumi refresh
```

**Preview refresh first**:
```bash
pulumi refresh --preview-only
```

---

### Destroy Infrastructure

**Interactive**:
```bash
pulumi destroy
```

**Non-Interactive**:
```bash
pulumi destroy --yes
```

**Destroy Specific Resource**:
```bash
pulumi destroy --target urn:pulumi:dev::procureflow-gcp::gcp:cloudrun/service:Service::procureflow-web
```

---

## Stack Outputs

### View All Outputs

```bash
pulumi stack output
```

**As JSON**:
```bash
pulumi stack output --json
```

**Specific Output**:
```bash
pulumi stack output serviceUrl
pulumi stack output artifactRegistryUrl
```

---

## Import Existing Resources

**Import Cloud Run Service**:
```bash
pulumi import gcp:cloudrun/service:Service procureflow-web \
  projects/procureflow-dev/locations/us-central1/services/procureflow-web
```

**Import Secret**:
```bash
pulumi import gcp:secretmanager/secret:Secret nextauth-secret \
  projects/procureflow-dev/secrets/nextauth-secret
```

---

## State Management

### Export State

```bash
pulumi stack export > stack-backup.json
```

**Encrypt Export**:
```bash
pulumi stack export | gpg --encrypt > stack-backup.json.gpg
```

---

### Import State

```bash
pulumi stack import < stack-backup.json
```

---

### View State

```bash
pulumi stack --show-urns
```

---

## Development Workflow

### Local Development (Docker Compose)

```bash
# From project root
cd packages/infra
pnpm docker:up          # Start MongoDB
pnpm docker:logs        # View logs
pnpm docker:down        # Stop and remove
```

---

### Build Infrastructure Code

```bash
# Compile TypeScript
pnpm build

# Or via tsc directly
npx tsc
```

---

### Lint & Format

```bash
# From root
pnpm lint
pnpm format
```

---

## CI/CD Commands

### Trigger Deployment (GitHub Actions)

**Via Git Push**:
```bash
git push origin main  # Auto-triggers deploy workflow
```

**Manual Trigger**:
```bash
gh workflow run deploy-gcp.yml
```

**View Workflow Status**:
```bash
gh run list --workflow=deploy-gcp.yml
gh run view <run-id>
```

---

### Deploy Manually (Local)

```bash
# 1. Build Docker image
cd ../../../../
docker build -f packages/infra/docker/Dockerfile.web \
  -t us-central1-docker.pkg.dev/procureflow-dev/procureflow/web:latest .

# 2. Push to Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev
docker push us-central1-docker.pkg.dev/procureflow-dev/procureflow/web:latest

# 3. Deploy infrastructure
cd packages/infra/pulumi/gcp
pnpm run deploy  # Alias for pulumi up --yes

# 4. Update Cloud Run env var (if needed)
gcloud run services update procureflow-web \
  --region=us-central1 \
  --update-env-vars="NEXTAUTH_URL=https://procureflow-web-592353558869.us-central1.run.app"
```

---

## GCP-Specific Commands

### View Cloud Run Services

```bash
gcloud run services list --region=us-central1
```

**Service Details**:
```bash
gcloud run services describe procureflow-web --region=us-central1
```

---

### View Cloud Run Logs

```bash
gcloud run logs tail procureflow-web --region=us-central1
```

---

### Update Cloud Run Env Vars

```bash
gcloud run services update procureflow-web \
  --region=us-central1 \
  --update-env-vars="KEY=value"
```

---

### View Secrets

```bash
gcloud secrets list
```

**Get Secret Value**:
```bash
gcloud secrets versions access latest --secret=nextauth-secret
```

---

### View Artifact Registry Repositories

```bash
gcloud artifacts repositories list --location=us-central1
```

**List Images**:
```bash
gcloud artifacts docker images list \
  us-central1-docker.pkg.dev/procureflow-dev/procureflow
```

---

## Troubleshooting Commands

### Check Pulumi Stack Health

```bash
pulumi stack
pulumi stack --show-urns
pulumi refresh --preview-only
```

---

### Validate TypeScript

```bash
npx tsc --noEmit
```

---

### Test GCP Credentials

```bash
gcloud auth application-default print-access-token
gcloud projects describe procureflow-dev
```

---

### Check Resource State

```bash
# Cloud Run
gcloud run services describe procureflow-web --region=us-central1 --format=json

# Secrets
gcloud secrets describe nextauth-secret --format=json

# Artifact Registry
gcloud artifacts repositories describe procureflow --location=us-central1
```

---

## Advanced Operations

### Stack Renaming

```bash
pulumi stack rename <new-name>
```

---

### Stack Tagging

```bash
pulumi stack tag set environment dev
pulumi stack tag set cost-center engineering
pulumi stack tag ls
```

---

### Policy Enforcement (Future)

```bash
pulumi preview --policy-pack policy/
```

---

### Resource Dependencies

**View Dependency Graph**:
```bash
pulumi stack graph stack-graph.dot
dot -Tpng stack-graph.dot -o stack-graph.png
```

---

## Package.json Scripts

**Available in `packages/infra/pulumi/gcp/package.json`**:

```bash
pnpm run preview       # pulumi preview
pnpm run deploy        # pulumi up --yes
pnpm run destroy       # pulumi destroy --yes
pnpm run refresh       # pulumi refresh
pnpm run stack:init    # pulumi stack init
pnpm run stack:select  # pulumi stack select
pnpm run stack:output  # pulumi stack output
pnpm run config        # pulumi config
pnpm run build         # tsc
pnpm run clean         # rm -rf node_modules dist
```

---

## Environment-Specific Commands

### Development

```bash
pulumi stack select dev
pulumi up --yes  # Auto-approve for dev
```

---

### Test

```bash
pulumi stack select test
pulumi preview   # Review first
pulumi up        # Require approval
```

---

### Production

```bash
pulumi stack select prod
pulumi preview --diff  # Detailed review
# Manual approval required
pulumi up
```

---

## Backup & Recovery

### Create Backup

```bash
# Export stack state
pulumi stack export > backups/stack-$(date +%Y%m%d).json

# Export all stacks
for stack in dev test prod; do
  pulumi stack select $stack
  pulumi stack export > backups/stack-$stack-$(date +%Y%m%d).json
done
```

---

### Restore from Backup

```bash
pulumi stack select <stack-name>
pulumi stack import < backups/stack-<name>-<date>.json
```

---

## Cost Management Commands

### View GCP Costs

```bash
# Open billing dashboard
gcloud alpha billing accounts list

# View project billing info
gcloud billing projects describe procureflow-dev
```

---

### Infracost Integration (Future)

```bash
# Install Infracost
brew install infracost  # macOS
# or curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh

# Generate cost estimate
infracost breakdown --path .
infracost diff --path .
```

---

## Monitoring Commands

### Health Check

```bash
curl https://procureflow-web-592353558869.us-central1.run.app/api/health
```

---

### View Metrics

```bash
gcloud monitoring dashboards list
```

---

### View Alerts

```bash
gcloud alpha monitoring policies list
```

---

## Common Workflows

### New Developer Onboarding

```bash
# 1. Clone repo
git clone https://github.com/guiofsaints/procureflow.git
cd procureflow/packages/infra/pulumi/gcp

# 2. Install dependencies
pnpm install

# 3. Authenticate
pulumi login
gcloud auth login
gcloud auth application-default login

# 4. Select dev stack
pulumi stack select dev

# 5. Preview (read-only)
pulumi preview

# Done! Developer can now view infrastructure
```

**Time**: ~15 minutes

---

### Deploy New Feature

```bash
# 1. Create feature branch
git checkout -b feature/new-resource

# 2. Make changes to Pulumi code
# (edit TypeScript files)

# 3. Preview locally
pulumi preview

# 4. If looks good, commit
git add .
git commit -m "feat: add new resource"

# 5. Push and create PR
git push origin feature/new-resource
gh pr create

# 6. After approval, merge
gh pr merge

# 7. Main branch CI/CD auto-deploys
```

---

### Emergency Rollback

```bash
# 1. View recent deployments
pulumi history

# 2. Rollback to previous state
pulumi stack export --version <version-number> | pulumi stack import

# Or use git revert
git revert <commit-hash>
git push origin main

# CI/CD will re-deploy previous version
```

---

### Add New Environment

```bash
# 1. Create stack
pulumi stack init staging

# 2. Configure
pulumi config set gcp:project procureflow-staging
pulumi config set gcp:region us-central1
pulumi config set environment staging

# 3. Copy secrets from dev
pulumi config set --secret nextauth-secret "$(pulumi config get nextauth-secret --stack dev --show-secrets)"
# ... repeat for other secrets

# 4. Deploy
pulumi up

# 5. Update CI/CD to include staging
# (edit .github/workflows/deploy-gcp.yml)
```

---

## Cheat Sheet

**Most Used Commands**:
```bash
# Daily
pulumi preview
pulumi up
pulumi stack output serviceUrl

# Weekly
pulumi refresh
pulumi stack

# Monthly
pulumi stack export > backup.json
pnpm update @pulumi/gcp @pulumi/pulumi

# As Needed
gcloud run logs tail procureflow-web --region=us-central1
gcloud secrets versions access latest --secret=nextauth-secret
```

---

## Keyboard Shortcuts

**Pulumi CLI**:
- `Ctrl+C` - Cancel operation
- `y` - Approve during `pulumi up`
- `n` - Reject during `pulumi up`
- `d` - Show details during preview

---

## Environment Variables

**Pulumi**:
```bash
export PULUMI_ACCESS_TOKEN=pul-...          # Pulumi Cloud token
export PULUMI_SKIP_UPDATE_CHECK=true        # Disable update check
export PULUMI_CONFIG_PASSPHRASE=...         # For local state encryption
```

**GCP**:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
export GOOGLE_PROJECT=procureflow-dev
export GOOGLE_REGION=us-central1
```

---

## Debugging

**Enable Verbose Logging**:
```bash
pulumi up --logtostderr -v=9
```

**Debug TypeScript**:
```bash
node --inspect-brk $(which pulumi) preview
# Attach debugger in VS Code
```

---

## References

- **Pulumi Docs**: https://pulumi.com/docs
- **GCP Pulumi Provider**: https://pulumi.com/registry/packages/gcp
- **GCP Docs**: https://cloud.google.com/docs
- **Internal Docs**: See `docs/` folder

---

**Commands Guide Maintained By**: GitHub Copilot AI Agent  
**Last Updated**: 2025-11-11  
**Next Review**: Quarterly
