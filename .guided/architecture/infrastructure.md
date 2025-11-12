# Infrastructure Documentation

**Executive Summary**: ProcureFlow deploys on GCP Cloud Run (serverless containers, auto-scaling 0-100 instances) with MongoDB Atlas M0 (512 MB free tier), Artifact Registry (Docker images), and Secret Manager (encrypted secrets). Local development uses Docker Compose. Deployment via GitHub Actions CI/CD with Pulumi TypeScript IaC. Observability includes Winston JSON logging (console in dev, Loki in prod future), Prometheus metrics at `/api/metrics`, and health check at `/api/health`. Monthly cost ~$0.30-$2.10 (Artifact Registry $0.10 + OpenAI API $2.00, Cloud Run/MongoDB/Secret Manager free). Only dev environment configured in v1.0; staging/production require setup.

---

## Table of Contents

- [Environments](#environments)
- [Deployment Architecture](#deployment-architecture)
- [Secrets Management](#secrets-management)
- [Observability and Monitoring](#observability-and-monitoring)
- [Autoscaling Capabilities](#autoscaling-capabilities)
- [Cost Management](#cost-management)
- [Assumptions and Limitations](#assumptions-and-limitations)
- [References](#references)

---

## Environments

### Environment Matrix

| Environment    | Status            | Deploy Target               | Database                | URL Pattern                        | Auto-Deploy                               | Cost Estimate    |
| -------------- | ----------------- | --------------------------- | ----------------------- | ---------------------------------- | ----------------------------------------- | ---------------- |
| **Local**      | ✅ Active         | Docker Compose              | MongoDB local container | http://localhost:3000              | Manual: `pnpm docker:up`                  | $0               |
| **Dev**        | ✅ Active         | GCP Cloud Run (us-central1) | MongoDB Atlas M0        | https://procureflow-web-\*.run.app | GitHub Actions on push to `main`          | ~$2.10/month     |
| **Staging**    | ⏸️ Not Configured | GCP Cloud Run (us-central1) | MongoDB Atlas M2        | TBD                                | Manual: `workflow_dispatch`               | TBD (~$15/month) |
| **Production** | ⏸️ Not Configured | GCP Cloud Run (us-central1) | MongoDB Atlas M10       | TBD                                | Manual: `workflow_dispatch` with approval | TBD (~$50/month) |

---

### Local Environment

**Purpose**: Developer workstations for feature development, debugging, and integration testing.

**Services** (via Docker Compose `packages/infra/compose.yaml`):

| Service           | Image                       | Ports       | Volumes                     | Purpose                            |
| ----------------- | --------------------------- | ----------- | --------------------------- | ---------------------------------- |
| **web**           | Built from `Dockerfile.web` | 3000:3000   | Source code (bind mount)    | Next.js app with hot reload        |
| **mongo**         | mongo:8.10.6                | 27017:27017 | `mongo-data` (named volume) | MongoDB server for local dev       |
| **mongo-express** | mongo-express:latest        | 8081:8081   | None                        | MongoDB UI (http://localhost:8081) |

**Environment Variables** (from `.env.local`):

```bash
MONGODB_URI=mongodb://mongo:27017/procureflow
NEXTAUTH_SECRET=dev-secret-key-not-for-production
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=sk-proj-... # Optional, customer-provided
NODE_ENV=development
```

**Startup Procedure**:

```powershell
# From repository root
pnpm docker:up            # Start all services
pnpm --filter web db:create-text-index  # Create MongoDB text index (required once)
pnpm --filter web db:seed-office-items  # Seed 200 test items (optional)
pnpm --filter web db:seed-initial-user  # Create admin user (optional)
```

**Health Check**:

- Web app: http://localhost:3000/api/health (should return `{ "status": "ok", "timestamp": "..." }`)
- MongoDB UI: http://localhost:8081 (admin/password)

**Data Persistence**:

- MongoDB data persists in Docker named volume `mongo-data`
- Survives container restarts (`pnpm docker:down` + `pnpm docker:up`)
- Delete volume with `docker volume rm procureflow-mongo-data` to reset database

---

### Dev Environment

**Purpose**: Integration environment for testing deployed builds, CI/CD validation, stakeholder demos.

**Infrastructure** (Pulumi stack: `dev`):

| Component              | Resource                   | Configuration                                                                       | Cost                       |
| ---------------------- | -------------------------- | ----------------------------------------------------------------------------------- | -------------------------- |
| **Compute**            | GCP Cloud Run gen2         | minScale: 0, maxScale: 2, concurrency: 80, timeout: 300s, CPU: 1000m, memory: 512Mi | Free (within 2M req/month) |
| **Container Registry** | GCP Artifact Registry      | Docker format, us-central1, vulnerability scanning enabled                          | ~$0.10/month (storage)     |
| **Secrets**            | GCP Secret Manager         | 6 secrets (NEXTAUTH_SECRET, MONGODB_URI, OPENAI_API_KEY, etc.)                      | Free (first 6 secrets)     |
| **Database**           | MongoDB Atlas M0 Free Tier | 512 MB storage, 500 max connections, shared vCPU, no backups                        | Free forever               |
| **Networking**         | Cloud Run public HTTPS     | Auto-provisioned SSL certificate, no load balancer                                  | Free (1 GB egress/month)   |

**Environment Variables** (Secret Manager):

```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/procureflow
NEXTAUTH_SECRET=<generated-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://procureflow-web-*.run.app
OPENAI_API_KEY=sk-proj-... # Customer-provided
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

**Deployment**:

- **Trigger**: Push to `main` branch with changes in `packages/web/**` or `packages/infra/**`
- **CI/CD**: GitHub Actions workflow `.github/workflows/deploy-gcp.yml`
- **Steps**:
  1. Build Docker image → tag with git SHA (e.g., `sha-a1b2c3d`)
  2. Push image to Artifact Registry → `us-central1-docker.pkg.dev/PROJECT_ID/procureflow/web:sha-a1b2c3d`
  3. Pulumi up → Update Cloud Run service with new image
  4. Health check → Verify `/api/health` returns 200

**Access**:

- Service URL: https://procureflow-web-\*.run.app (auto-generated by Cloud Run)
- Cloud Run Console: https://console.cloud.google.com/run
- Logs: `gcloud run logs tail procureflow-web --region us-central1`

---

### Staging Environment (Future)

**Purpose**: Pre-production environment for UAT, performance testing, release candidate validation.

**Planned Configuration**:

- **Compute**: Cloud Run minScale: 1, maxScale: 10
- **Database**: MongoDB Atlas M2 ($9/month, 2 GB storage, 500 connections, backups)
- **Custom Domain**: procureflow-staging.example.com (requires Cloud Domains or external DNS)
- **Auto-Deploy**: Manual `workflow_dispatch` with environment selection
- **Approval Gates**: None (auto-deploy after build success)

**Setup Steps** (when ready):

1. Create Pulumi stack: `pulumi stack init staging`
2. Configure MongoDB Atlas M2 cluster
3. Set secrets in Pulumi config: `pulumi config set --secret mongodb-connection-string "mongodb+srv://..."`
4. Run Pulumi deployment: `pulumi up`
5. Configure custom domain in Cloud Run
6. Update GitHub Actions environment with staging URL

---

### Production Environment (Future)

**Purpose**: Live customer-facing environment with SLA guarantees, backups, and monitoring.

**Planned Configuration**:

- **Compute**: Cloud Run minScale: 2, maxScale: 100, multi-region (us-central1 + europe-west1)
- **Database**: MongoDB Atlas M10 ($57/month, 10 GB storage, dedicated vCPU, automated backups, PITR)
- **CDN**: Cloud CDN for static assets (Next.js `/_next/static/`)
- **Custom Domain**: procureflow.example.com with SSL certificate
- **Auto-Deploy**: Manual `workflow_dispatch` with approval gates
- **Approval Gates**: Require tech lead approval for production deployment
- **Monitoring**: GCP Cloud Monitoring with Uptime Checks, Error Reporting, Trace

**Setup Steps** (when ready):

1. Create Pulumi stack: `pulumi stack init production`
2. Configure MongoDB Atlas M10 cluster with backups
3. Set secrets in Pulumi config
4. Enable Cloud CDN in Cloud Run
5. Configure custom domain with SSL
6. Set up monitoring alerts (error rate > 1%, latency p95 > 2s)
7. Document rollback procedure (see `operations/rollback-strategy.md`)

---

## Deployment Architecture

### GCP Cloud Run Architecture

```mermaid
graph TD
    %% External Users
    Users[End Users<br/>Employees, Buyers]:::external

    %% Cloud Run Service
    CloudRun[GCP Cloud Run Service<br/>procureflow-web<br/>Container: Next.js 15]:::compute

    %% Auto-scaling
    Instance1[Instance 1<br/>512 MB, 1 vCPU]:::instance
    Instance2[Instance 2<br/>512 MB, 1 vCPU]:::instance
    InstanceN[Instance N<br/>Up to 100 instances]:::instance

    %% Artifact Registry
    ArtifactRegistry[GCP Artifact Registry<br/>us-central1-docker.pkg.dev<br/>procureflow/web:sha-*]:::storage

    %% Secret Manager
    SecretManager[GCP Secret Manager<br/>NEXTAUTH_SECRET<br/>MONGODB_URI<br/>OPENAI_API_KEY]:::security

    %% MongoDB Atlas
    MongoDB[MongoDB Atlas M0<br/>512 MB Free Tier<br/>procureflow-dev cluster]:::database

    %% OpenAI API
    OpenAI[OpenAI API<br/>GPT-3.5-turbo<br/>Function Calling]:::external

    %% GitHub Actions
    GitHub[GitHub Actions<br/>CI/CD Pipeline<br/>.github/workflows/deploy-gcp.yml]:::cicd

    %% Flows
    Users -->|HTTPS requests<br/>TLS 1.3| CloudRun
    CloudRun -->|Auto-scale<br/>0-100 instances| Instance1
    CloudRun -->|Auto-scale| Instance2
    CloudRun -->|Auto-scale| InstanceN

    GitHub -->|Build Docker image<br/>Push| ArtifactRegistry
    GitHub -->|Pulumi deploy<br/>Update revision| CloudRun

    CloudRun -->|Pull image<br/>On deploy| ArtifactRegistry
    CloudRun -->|Inject secrets<br/>Runtime| SecretManager

    Instance1 & Instance2 & InstanceN -->|MongoDB Wire Protocol<br/>TLS| MongoDB
    Instance1 & Instance2 & InstanceN -->|HTTPS REST<br/>Function calling| OpenAI

    %% Styling
    classDef external fill:#999999,stroke:#6B6B6B,color:#fff
    classDef compute fill:#438DD5,stroke:#2E6295,color:#fff
    classDef instance fill:#85BBF0,stroke:#5A9DD1,color:#333
    classDef storage fill:#FFA500,stroke:#CC8400,color:#fff
    classDef security fill:#FF6B6B,stroke:#CC5555,color:#fff
    classDef database fill:#4CAF50,stroke:#388E3C,color:#fff
    classDef cicd fill:#9C27B0,stroke:#7B1FA2,color:#fff
```

---

### CI/CD Pipeline (GitHub Actions)

**Workflow**: `.github/workflows/deploy-gcp.yml`

**Triggers**:

- **Automatic**: Push to `main` branch with changes in `packages/web/**`, `packages/infra/**`, or `.github/workflows/deploy-gcp.yml`
- **Manual**: `workflow_dispatch` with environment selection (dev/staging/production)

**Pipeline Stages**:

```mermaid
flowchart LR
    Start([Push to main]) --> Build[Job 1: Build Docker Image]
    Build -->|Generate SHA tag| Tag[Tag: sha-a1b2c3d]
    Tag --> Push[Push to Artifact Registry]
    Push --> Deploy[Job 2: Deploy with Pulumi]
    Deploy -->|Select stack| Stack{Environment?}
    Stack -->|dev| DevDeploy[Pulumi up --stack dev]
    Stack -->|staging| StagingDeploy[Pulumi up --stack staging]
    Stack -->|production| ProdDeploy[Pulumi up --stack production]
    DevDeploy & StagingDeploy & ProdDeploy --> Update[Update Cloud Run revision]
    Update --> Health[Job 3: Health Check]
    Health -->|200 OK| Success([Deployment Success])
    Health -->|Non-200| Fail([Deployment Failed])

    style Build fill:#438DD5,stroke:#2E6295,color:#fff
    style Deploy fill:#9C27B0,stroke:#7B1FA2,color:#fff
    style Health fill:#4CAF50,stroke:#388E3C,color:#fff
    style Success fill:#4CAF50,stroke:#388E3C,color:#fff
    style Fail fill:#FF6B6B,stroke:#CC5555,color:#fff
```

**Job 1: Build Docker Image** (~3-4 minutes)

1. Checkout code
2. Authenticate to GCP with service account key (`GCP_SA_KEY` secret)
3. Configure Docker for Artifact Registry
4. Generate image tag (SHA-based: `sha-a1b2c3d` or `latest`)
5. Build Docker image with multi-stage Dockerfile (`packages/infra/docker/Dockerfile.web`)
   - Build args: `GIT_COMMIT_SHA`, `BUILD_DATE`, `VERSION`
   - Stages: Dependencies → Build → Production
6. Push image to Artifact Registry (2 tags: SHA + `latest`)

**Job 2: Deploy with Pulumi** (~2-3 minutes)

1. Checkout code
2. Setup Node.js 20, pnpm 10.21.0
3. Install Pulumi CLI and dependencies
4. Authenticate to GCP
5. Select Pulumi stack (dev/staging/production)
6. Configure Pulumi:
   - Set GCP project ID, region
   - Set environment, image tag (from Job 1)
   - Set secrets (NEXTAUTH_SECRET, MONGODB_URI, OPENAI_API_KEY) from GitHub secrets
7. Run `pulumi up --yes` to deploy infrastructure
8. Export Cloud Run service URL

**Job 3: Health Check** (~10 seconds)

1. Wait 30 seconds for Cloud Run to stabilize
2. Curl `/api/health` endpoint
3. Verify HTTP 200 response
4. Fail deployment if health check fails

**Required GitHub Secrets**:

| Secret Name                 | Purpose                                     | Example Value                                             | Setup                                                                                              |
| --------------------------- | ------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `GCP_PROJECT_ID`            | GCP project identifier                      | `procureflow-dev-123456`                                  | GCP Console → Project Settings                                                                     |
| `GCP_SA_KEY`                | Service account JSON key for GitHub Actions | `{ "type": "service_account", ... }`                      | Create service account with roles: Cloud Run Admin, Artifact Registry Writer, Secret Manager Admin |
| `PULUMI_ACCESS_TOKEN`       | Pulumi Cloud authentication                 | `pul-abc123...`                                           | Pulumi Console → Access Tokens                                                                     |
| `NEXTAUTH_SECRET`           | NextAuth.js session encryption key          | `<32-byte-base64-string>`                                 | Generate: `openssl rand -base64 32`                                                                |
| `MONGODB_CONNECTION_STRING` | MongoDB Atlas connection string             | `mongodb+srv://user:pass@cluster.mongodb.net/procureflow` | MongoDB Atlas → Clusters → Connect                                                                 |
| `OPENAI_API_KEY`            | OpenAI API key for agent                    | `sk-proj-...`                                             | OpenAI Platform → API Keys                                                                         |

---

### Infrastructure as Code (Pulumi)

**Stack**: `packages/infra/pulumi/gcp/`

**Resources Provisioned**:

| Resource Type                    | Resource Name                                      | Purpose                                                    | Cost                          |
| -------------------------------- | -------------------------------------------------- | ---------------------------------------------------------- | ----------------------------- |
| **Artifact Registry Repository** | `procureflow-images`                               | Docker image storage (format: DOCKER, region: us-central1) | ~$0.10/month (0.1 GB storage) |
| **Cloud Run Service**            | `procureflow-web`                                  | Next.js app container (gen2, 512 MB, 1 vCPU, timeout 300s) | Free (within 2M req/month)    |
| **Service Account**              | `procureflow-cloudrun`                             | Least-privilege IAM for Cloud Run                          | Free                          |
| **IAM Policy**                   | `cloudrun-public-access`                           | Allow `allUsers` to invoke Cloud Run service               | Free                          |
| **Secret Manager Secrets**       | `nextauth-secret`, `mongodb-uri`, `openai-api-key` | Encrypted environment variables                            | Free (first 6 secrets)        |
| **IAM Bindings**                 | Secret accessor roles                              | Grant Cloud Run SA access to secrets                       | Free                          |

**Pulumi Commands**:

```powershell
# Navigate to Pulumi project
cd packages/infra/pulumi/gcp

# Initialize stack (first time only)
pulumi stack init dev
pulumi config set gcp:project YOUR_PROJECT_ID
pulumi config set gcp:region us-central1

# Set secrets (encrypted in Pulumi state)
pulumi config set --secret nextauth-secret $(openssl rand -base64 32)
pulumi config set --secret mongodb-connection-string "mongodb+srv://..."
pulumi config set --secret openai-api-key "sk-proj-..."

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# Destroy infrastructure
pulumi destroy
```

**Outputs**:

- `serviceUrl`: Cloud Run service HTTPS URL
- `artifactRegistryUrl`: Artifact Registry repository URL
- `mongodbConnectionUri`: MongoDB connection string (masked)
- `deploymentInstructions`: Formatted deployment guide

---

## Secrets Management

### Secret Storage

**Development** (Local):

- **File**: `.env.local` (gitignored)
- **Security**: Plain text file, secured by filesystem permissions
- **Rotation**: Manual (update file, restart container)

**Production** (GCP Cloud Run):

- **Service**: GCP Secret Manager
- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Access Control**: IAM-based, Cloud Run service account has `secretmanager.secretAccessor` role
- **Versioning**: Automatic versioning, can rollback to previous secret versions
- **Rotation**: Manual (update secret version via Pulumi or `gcloud`)

---

### Secret Injection Pattern

**Environment Variables** (Cloud Run):

```yaml
envs:
  - name: NEXTAUTH_SECRET
    valueFrom:
      secretKeyRef:
        name: nextauth-secret # Secret Manager secret ID
        key: latest # Always use latest version
```

**Runtime Behavior**:

1. Cloud Run instance starts
2. Fetches secret from Secret Manager via IAM
3. Injects secret as environment variable `NEXTAUTH_SECRET`
4. Next.js reads `process.env.NEXTAUTH_SECRET` at runtime

**Benefits**:

- **No secrets in Docker image**: Image can be public, secrets injected at runtime
- **Versioning**: Update secret without rebuilding image
- **Auditing**: Secret access logged in GCP Cloud Audit Logs

---

### Secret Inventory

| Secret Name           | Purpose                                      | Source                                  | Rotation Frequency                  | Owner     |
| --------------------- | -------------------------------------------- | --------------------------------------- | ----------------------------------- | --------- |
| `NEXTAUTH_SECRET`     | NextAuth.js session encryption (JWT signing) | Generated via `openssl rand -base64 32` | Yearly (invalidates all sessions)   | Tech Lead |
| `MONGODB_URI`         | MongoDB Atlas connection string              | MongoDB Atlas UI → Connect              | When credentials rotate (manual)    | DevOps    |
| `OPENAI_API_KEY`      | OpenAI API authentication for agent          | OpenAI Platform → API Keys              | When key compromised (manual)       | Tech Lead |
| `GCP_SA_KEY`          | GitHub Actions GCP authentication            | GCP Console → Service Accounts          | Yearly (rotate service account key) | DevOps    |
| `PULUMI_ACCESS_TOKEN` | Pulumi Cloud authentication for CI/CD        | Pulumi Console → Access Tokens          | When token compromised (manual)     | DevOps    |

**Secret Rotation Procedure**:

1. Generate new secret value
2. Update Pulumi config: `pulumi config set --secret SECRET_NAME "new-value"`
3. Run `pulumi up` to update Secret Manager
4. Cloud Run automatically uses new secret on next instance start
5. For NEXTAUTH_SECRET: Invalidates all active sessions (users must re-login)

---

## Observability and Monitoring

### Logging

**Local Development**:

- **Transport**: Winston console transport
- **Format**: JSON with colors (readable in terminal)
- **Level**: `debug` (all logs)
- **Output**: stdout

**Production** (GCP Cloud Run):

- **Transport**: Winston console transport → GCP Cloud Logging (automatic collection)
- **Format**: JSON structured (parsed by Cloud Logging)
- **Level**: `info` (debug logs omitted)
- **Retention**: 30 days (default GCP Cloud Logging)

**Log Structure**:

```json
{
  "timestamp": "2025-01-11T10:30:45.123Z",
  "level": "info",
  "message": "Catalog search request",
  "service": "procureflow-web",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userId": "507f1f77bcf86cd799439011",
  "query": "pens",
  "itemCount": 5,
  "durationMs": 87
}
```

**Correlation IDs**:

- Generated for each HTTP request (UUID v4)
- Passed via `X-Correlation-ID` header
- Logged in all service calls for request tracing

**Viewing Logs**:

```powershell
# GCP Cloud Logging (web UI)
https://console.cloud.google.com/logs/query?project=PROJECT_ID

# gcloud CLI
gcloud run logs tail procureflow-web --region us-central1

# Filter by correlation ID
gcloud run logs read --filter="jsonPayload.correlationId=a1b2c3d4-..." --limit 100
```

---

### Metrics

**Endpoint**: `/api/metrics`  
**Format**: Prometheus text format  
**Scraping**: Manual (future: GCP Cloud Monitoring with Prometheus scraper)

**Available Metrics**:

| Metric Name                       | Type      | Labels                              | Description                                                   |
| --------------------------------- | --------- | ----------------------------------- | ------------------------------------------------------------- |
| `http_requests_total`             | Counter   | `method`, `path`, `status_code`     | Total HTTP requests by endpoint and status                    |
| `http_request_duration_seconds`   | Histogram | `method`, `path`, `status_code`     | HTTP request latency (buckets: 0.1, 0.5, 1, 2, 5, 10 seconds) |
| `mongodb_connections_active`      | Gauge     | None                                | Current active MongoDB connections                            |
| `mongodb_connections_idle`        | Gauge     | None                                | Current idle MongoDB connections                              |
| `agent_requests_total`            | Counter   | `tool_name`, `success`              | Total AI agent tool executions                                |
| `agent_request_duration_seconds`  | Histogram | `tool_name`                         | Agent request latency (including LLM inference)               |
| `purchase_requests_created_total` | Counter   | `status`                            | Total purchase requests submitted                             |
| `openai_api_calls_total`          | Counter   | `model`, `success`                  | Total OpenAI API calls                                        |
| `openai_api_tokens_total`         | Counter   | `model`, `type` (prompt/completion) | Total tokens consumed                                         |

**Example Prometheus Query**:

```promql
# p95 latency for catalog search
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{path="/api/catalog/search"}[5m])) by (le))

# Error rate for all endpoints
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

---

### Health Checks

**Endpoint**: `/api/health`  
**Method**: GET  
**Response**:

```json
{
  "status": "ok",
  "timestamp": "2025-01-11T10:30:45.123Z",
  "checks": {
    "mongodb": "connected",
    "openai": "not configured" // If OPENAI_API_KEY not set
  }
}
```

**Status Codes**:

- `200 OK`: All systems operational
- `503 Service Unavailable`: MongoDB connection failed

**Usage**:

- **Cloud Run**: Liveness probe (automatic, checks `/api/health` every 10s)
- **CI/CD**: Post-deployment smoke test
- **Monitoring**: Uptime check (future: GCP Cloud Monitoring Uptime Check every 1 min)

---

### Error Tracking

**Current**: Logs only (errors logged with stack traces in Cloud Logging)

**Future** (Sentry Integration):

1. Install Sentry SDK: `pnpm add @sentry/nextjs`
2. Configure `SENTRY_DSN` in environment variables
3. Sentry captures:
   - Unhandled exceptions
   - API route errors
   - Frontend errors (React error boundaries)
   - Performance transactions (slow queries)
4. Cost: Free tier (5,000 errors/month)

---

## Autoscaling Capabilities

### Cloud Run Autoscaling

**Configuration** (Pulumi `compute/cloudrun.ts`):

| Parameter                | Dev   | Staging (Future) | Production (Future) | Purpose                                                |
| ------------------------ | ----- | ---------------- | ------------------- | ------------------------------------------------------ |
| **minScale**             | 0     | 1                | 2                   | Minimum instances (0 = scale to zero for cost savings) |
| **maxScale**             | 2     | 10               | 100                 | Maximum instances (prevent runaway costs)              |
| **containerConcurrency** | 80    | 80               | 80                  | Concurrent requests per instance                       |
| **timeoutSeconds**       | 300   | 300              | 300                 | Request timeout (5 minutes max allowed)                |
| **cpu**                  | 1000m | 1000m            | 2000m               | vCPU per instance (1 = 1 vCPU)                         |
| **memory**               | 512Mi | 512Mi            | 1Gi                 | Memory per instance                                    |

**Scaling Triggers**:

- **Scale Up**: When `containerConcurrency` reaches ~70% (56 concurrent requests)
- **Scale Down**: When idle for 15 minutes (Cloud Run default)
- **Cold Start**: 2-3 seconds for first request (gen2 execution environment)

**Behavior**:

```
0 requests → 0 instances (scale to zero)
1-56 requests → 1 instance
57-112 requests → 2 instances (maxScale: 2 in dev)
113+ requests → 2 instances (throttled, 503 errors if sustained)
```

---

### Autoscaling Decision Tree

```mermaid
flowchart TD
    Start([HTTP Request]) --> CheckInstances{Current<br/>instances?}

    CheckInstances -->|0 instances| ColdStart[Cold Start<br/>2-3s delay]
    CheckInstances -->|1+ instances| CheckConcurrency{Concurrency<br/>> 70%?}

    ColdStart --> StartInstance[Start new instance]
    StartInstance --> RouteRequest[Route request to instance]

    CheckConcurrency -->|No| RouteRequest
    CheckConcurrency -->|Yes| CheckMaxScale{Reached<br/>maxScale?}

    CheckMaxScale -->|No| ScaleUp[Start new instance]
    CheckMaxScale -->|Yes| Throttle[Queue or 503 error]

    ScaleUp --> RouteRequest
    Throttle --> RouteRequest

    RouteRequest --> CheckIdle{Idle for<br/>15 min?}
    CheckIdle -->|No| KeepRunning[Keep instance running]
    CheckIdle -->|Yes| ScaleDown[Terminate instance]

    ScaleDown --> CheckMinScale{Below<br/>minScale?}
    CheckMinScale -->|Yes| KeepRunning
    CheckMinScale -->|No| End([Instance terminated])

    KeepRunning --> End

    style ColdStart fill:#FFA500,stroke:#CC8400,color:#fff
    style ScaleUp fill:#4CAF50,stroke:#388E3C,color:#fff
    style ScaleDown fill:#FF6B6B,stroke:#CC5555,color:#fff
    style Throttle fill:#FF6B6B,stroke:#CC5555,color:#fff
```

---

### MongoDB Connection Pooling

**Configuration** (`lib/db/mongoose.ts`):

```typescript
const options = {
  minPoolSize: 5, // Minimum connections per Cloud Run instance
  maxPoolSize: 50, // Maximum connections per instance
  maxIdleTimeMS: 10000, // Close idle connections after 10s
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
};
```

**Scaling Considerations**:

- MongoDB Atlas M0: 500 max connections total
- Cloud Run instances: 2 max (dev) × 50 max connections = 100 max connections
- Production (100 instances × 50 = 5000 connections) → Requires MongoDB Atlas M10+ with higher connection limits

---

## Cost Management

### Monthly Cost Breakdown

| Component                 | Tier          | Usage Estimate                                  | Unit Cost                    | Monthly Cost     |
| ------------------------- | ------------- | ----------------------------------------------- | ---------------------------- | ---------------- |
| **GCP Cloud Run**         | Always Free   | 10,000 requests, 50 GB-seconds, 25 vCPU-seconds | $0.00 (within free tier)     | **$0.00**        |
| **GCP Artifact Registry** | Standard      | 0.1 GB Docker images                            | $0.10/GB/month               | **$0.10**        |
| **GCP Secret Manager**    | Always Free   | 6 secrets, 10,000 accesses                      | $0.00 (within free tier)     | **$0.00**        |
| **MongoDB Atlas M0**      | Free Tier     | 512 MB storage, 500 connections                 | Free forever                 | **$0.00**        |
| **OpenAI API**            | Pay-as-you-go | 1M tokens (500K prompt + 500K completion)       | $0.0015/$0.002 per 1K tokens | **$2.00**        |
| **Total**                 |               |                                                 |                              | **~$2.10/month** |

**Cost Controls**:

- **Cloud Run maxScale: 2**: Prevents runaway scaling (100 instances = $50+/month)
- **MongoDB M0**: No overage charges, hard 512 MB limit
- **OpenAI Rate Limiting**: 60 RPM limit prevents excessive API calls
- **Artifact Registry Cleanup**: Delete old images (future: lifecycle policy)

---

### Billing Alerts

**GCP Budget Alerts** (Manual Setup Required):

1. GCP Console → Billing → Budgets & Alerts
2. Create budget:
   - **Amount**: $10/month
   - **Alerts**: 50%, 90%, 100%
   - **Email**: Tech Lead, DevOps
3. Link to Pub/Sub topic for automated alerting (future)

**OpenAI Cost Monitoring**:

- Track `openai_api_tokens_total` metric
- Calculate cost: `(prompt_tokens × $0.0015 + completion_tokens × $0.002) / 1000`
- Alert if monthly cost > $5 (future: Prometheus alertmanager rule)

---

### Cost Optimization Strategies

**Current**:

- ✅ Cloud Run minScale: 0 (scale to zero when idle)
- ✅ MongoDB Atlas M0 (free tier)
- ✅ GPT-3.5-turbo (cheap model: $0.0015/$0.002 per 1K tokens vs GPT-4: $0.03/$0.06)
- ✅ No CDN (static assets served from Cloud Run, 1 GB free egress)

**Future**:

- 🔄 Artifact Registry lifecycle policy (delete images > 30 days old)
- 🔄 Cloud Run CPU allocation: "CPU is only allocated during request processing" (default, already enabled)
- 🔄 OpenAI prompt caching (cache common queries, reduce token usage)
- 🔄 MongoDB Atlas M2 for staging ($9/month with backups, cheaper than M10)

---

## Assumptions and Limitations

### Assumptions

1. **GCP Free Tier eligibility**: Customer has GCP account with Always Free tier (2M requests/month Cloud Run, 1 GB egress)
2. **MongoDB Atlas M0 capacity**: < 512 MB data (estimated 5,000 items, 100 users, 1,000 purchase requests)
3. **Single region**: All traffic served from us-central1 (no multi-region, no CDN)
4. **Development workload**: < 10,000 requests/month in dev environment
5. **OpenAI API cost control**: Customer monitors token usage, < $5/month budget
6. **No 24/7 uptime SLA**: Dev environment, acceptable for minScale: 0 cold starts
7. **Manual secret rotation**: Secrets rotated manually via Pulumi, no automated rotation
8. **No dedicated database**: MongoDB Atlas M0 shared infrastructure, no guaranteed performance

### Limitations

1. **No staging/production environments**: Only dev configured in v1.0, requires setup for staging/production
2. **No automated backups**: MongoDB Atlas M0 has no backups, manual mongodump required
3. **No point-in-time recovery**: Cannot restore to specific timestamp, only full backups
4. **No multi-region deployment**: Single region us-central1, no geographic redundancy
5. **No CDN**: Static assets served from Cloud Run, no edge caching
6. **No custom domain**: Using auto-generated Cloud Run URL (`*.run.app`), no branded domain
7. **No automated rollback**: Requires manual Pulumi stack rollback or Cloud Run revision traffic splitting
8. **No distributed observability**: No trace correlation across services, no distributed tracing (OpenTelemetry future)
9. **Cold start latency**: minScale: 0 → 2-3s cold start for first request (acceptable for dev, not production)
10. **Connection pool limits**: MongoDB M0 500 connections → limits scaling to ~10 Cloud Run instances (50 max connections each)

---

## References

### Internal Documents

- [C4 Container Diagram](./c4.container.md) - Runtime containers and data flows
- [Technology Stack and Patterns](./stack-and-patterns.md) - Tech choices and Decision Log
- [PRD: Non-Functional Requirements](../product/prd.non-functional-requirements.md) - Performance, reliability, cost targets
- [Deployment Strategy](../operations/deployment-strategy.md) - Deployment flow, promotion model (coming soon)
- [Rollback Strategy](../operations/rollback-strategy.md) - Rollback procedures (coming soon)
- [Autoscaling Policy](../operations/autoscaling-policy.md) - Scaling metrics, thresholds (coming soon)

### External Resources

- [GCP Cloud Run Documentation](https://cloud.google.com/run/docs) - Serverless container platform
- [Pulumi GCP Provider](https://www.pulumi.com/registry/packages/gcp/) - Infrastructure as Code
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/) - Managed MongoDB service
- [GCP Secret Manager](https://cloud.google.com/secret-manager/docs) - Encrypted secrets storage
- [Prometheus Metrics](https://prometheus.io/docs/concepts/metric_types/) - Metric types and best practices
- [Winston Logging](https://github.com/winstonjs/winston) - Structured logging library

---

**Last Updated**: 2025-11-11  
**Owner**: DevOps Team  
**Reviewers**: Tech Lead, Architecture  
**Next Review**: Quarterly (2025-03-01) or when adding staging/production environments  
**Status**: ✅ Complete
