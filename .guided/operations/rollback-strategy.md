# Rollback Strategy

**Executive Summary**: ProcureFlow rollback uses Cloud Run revision traffic splitting for instant zero-downtime rollback (shift 100% traffic to previous revision) or Pulumi IaC rollback for infrastructure changes. Decision tree: health check fails → automatic Cloud Run rollback (previous revision serves 100% traffic), bad deployment detected → manual traffic split via `gcloud` CLI or Cloud Console, database migration failed → restore MongoDB backup (manual `mongodump`/`mongorestore`), secrets corrupted → restore Secret Manager versions. No automated rollback in v1.0; requires manual execution. Post-rollback validation: health check 200, smoke tests pass, error rate < baseline. Rollback time: ~2-5 minutes for traffic split, ~10-30 minutes for full Pulumi rollback.

---

## Table of Contents

- [Rollback Decision Tree](#rollback-decision-tree)
- [Cloud Run Revision Rollback](#cloud-run-revision-rollback)
- [Pulumi Infrastructure Rollback](#pulumi-infrastructure-rollback)
- [Data Migration Handling](#data-migration-handling)
- [Config and Secrets Rollback](#config-and-secrets-rollback)
- [Post-Rollback Validation](#post-rollback-validation)
- [Assumptions and Limitations](#assumptions-and-limitations)
- [References](#references)

---

## Rollback Decision Tree

### When to Rollback

```mermaid
flowchart TD
    Start{Deployment<br/>Issue?} --> HealthFail{Health check<br/>failed?}
    Start --> BadDeploy{Bad deployment<br/>detected?}
    Start --> DBFail{Database migration<br/>failed?}
    Start --> SecretFail{Secrets<br/>corrupted?}

    HealthFail -->|Yes| AutoRollback[Automatic Cloud Run Rollback<br/>Previous revision serves traffic]
    HealthFail -->|No| Monitor[Continue monitoring]

    BadDeploy -->|Critical bug| ManualRollback[Manual Traffic Split<br/>gcloud or Cloud Console]
    BadDeploy -->|Minor issue| Hotfix{Hotfix<br/>feasible?}
    Hotfix -->|Yes| DeployFix[Deploy hotfix<br/>Push to main]
    Hotfix -->|No| ManualRollback

    DBFail -->|Yes| RestoreDB[Restore MongoDB Backup<br/>mongodump/mongorestore]
    DBFail -->|No| CheckInfra{Pulumi state<br/>corrupted?}
    CheckInfra -->|Yes| PulumiRollback[Pulumi Stack Rollback<br/>Import previous state]
    CheckInfra -->|No| Monitor

    SecretFail -->|Yes| RestoreSecret[Restore Secret Manager Version<br/>gcloud secrets versions access]
    SecretFail -->|No| Monitor

    AutoRollback --> Validate[Post-Rollback Validation]
    ManualRollback --> Validate
    RestoreDB --> Validate
    PulumiRollback --> Validate
    RestoreSecret --> Validate
    DeployFix --> Validate

    Validate --> HealthCheck{Health check<br/>200?}
    HealthCheck -->|Yes| SmokeTest{Smoke tests<br/>pass?}
    HealthCheck -->|No| Escalate[Escalate to Tech Lead<br/>Incident response]

    SmokeTest -->|Yes| Success([✅ Rollback successful])
    SmokeTest -->|No| Escalate

    Monitor --> End([Continue deployment])

    style AutoRollback fill:#FFA500,stroke:#CC8400,color:#fff
    style ManualRollback fill:#FFA500,stroke:#CC8400,color:#fff
    style RestoreDB fill:#FF6B6B,stroke:#CC5555,color:#fff
    style PulumiRollback fill:#9C27B0,stroke:#7B1FA2,color:#fff
    style RestoreSecret fill:#FFA500,stroke:#CC8400,color:#fff
    style Success fill:#4CAF50,stroke:#388E3C,color:#fff
    style Escalate fill:#FF6B6B,stroke:#CC5555,color:#fff
```

---

### Rollback Triggers

| Trigger                                            | Severity    | Rollback Type                    | Automated?                                       | Max Acceptable Downtime |
| -------------------------------------------------- | ----------- | -------------------------------- | ------------------------------------------------ | ----------------------- |
| **Health check fails** (HTTP non-200)              | 🔴 Critical | Cloud Run revision rollback      | ✅ Yes (Cloud Run auto-serves previous revision) | 0s (zero downtime)      |
| **Error rate > 1%** for 5 minutes                  | 🔴 Critical | Manual traffic split             | ❌ No                                            | 2-5 min                 |
| **P95 latency > 3s** for 5 minutes                 | 🟡 High     | Manual traffic split or hotfix   | ❌ No                                            | 5-10 min                |
| **Critical feature broken** (e.g., checkout fails) | 🔴 Critical | Manual traffic split             | ❌ No                                            | 2-5 min                 |
| **Database migration failed** (schema corruption)  | 🔴 Critical | Restore backup + Pulumi rollback | ❌ No                                            | 10-30 min               |
| **Secrets corrupted** (NextAuth login fails)       | 🔴 Critical | Restore Secret Manager version   | ❌ No                                            | 2-5 min                 |
| **Pulumi state corrupted** (infrastructure drift)  | 🟡 High     | Pulumi import previous state     | ❌ No                                            | 10-30 min               |

---

## Cloud Run Revision Rollback

### Overview

Cloud Run maintains **revision history** (up to 1,000 revisions). Each deployment creates a new revision with incremental ID (e.g., `procureflow-web-00042-xyz`). Traffic can be split between revisions (0-100%) for gradual rollout or instant rollback.

**Automatic Rollback**: Cloud Run serves previous revision if new revision crashes on startup (unhealthy container, port not listening).

**Manual Rollback**: Shift 100% traffic to previous revision using `gcloud` CLI or Cloud Console.

---

### Automatic Rollback (Health Check Failure)

**Trigger**: New revision fails health check (container crashes, port not listening, `/api/health` returns non-200)

**Cloud Run Behavior**:

1. New revision created with tag `sha-abc123f`
2. Cloud Run attempts to start container (expose port 3000)
3. **If container crashes**: Cloud Run immediately routes all traffic to previous healthy revision
4. **If health check fails**: GitHub Actions Job 3 detects failure, no traffic routed to new revision

**Zero Downtime**: Previous revision continues serving 100% traffic during health check failure.

**GitHub Actions Failure**:

```bash
# Job 3: Health Check
❌ Health check failed (HTTP 500)
exit 1  # Workflow fails, no traffic routed to new revision
```

**Cloud Run Console**:

```
procureflow-web-00042-xyz  ❌ Unhealthy  0% traffic
procureflow-web-00041-abc  ✅ Healthy   100% traffic  (previous revision)
```

**No Action Required**: Cloud Run automatically serves previous revision.

---

### Manual Rollback (Bad Deployment Detected)

**Trigger**: Deployment passed health check but issues detected post-deployment (critical bug, error rate spike, feature broken)

**Procedure**:

#### Option 1: gcloud CLI (Fastest)

```powershell
# 1. List recent revisions
gcloud run revisions list \
  --service=procureflow-web \
  --region=us-central1 \
  --limit=5

# Output:
# REVISION                          ACTIVE  SERVICE            DEPLOYED
# procureflow-web-00042-bad   ✅ Yes   procureflow-web    2025-11-12 10:30:00
# procureflow-web-00041-good  ❌ No    procureflow-web    2025-11-11 15:20:00
# procureflow-web-00040-old   ❌ No    procureflow-web    2025-11-10 09:15:00

# 2. Identify good revision (last known stable: 00041-good)

# 3. Shift 100% traffic to good revision
gcloud run services update-traffic procureflow-web \
  --region=us-central1 \
  --to-revisions=procureflow-web-00041-good=100

# Output:
# ✅ Traffic updated. Revision procureflow-web-00041-good now receives 100% of traffic.

# 4. Verify rollback
curl https://procureflow-web-xyz.run.app/api/health
# Expected: { "status": "ok", "timestamp": "..." }
```

**Rollback Time**: ~2-3 minutes (instant traffic shift + DNS propagation)

---

#### Option 2: Cloud Console (Visual)

1. Navigate to: [Cloud Run Console](https://console.cloud.google.com/run)
2. Select service: `procureflow-web`
3. Click **"Revisions"** tab
4. Identify good revision (e.g., `procureflow-web-00041-good`)
5. Click **"Manage Traffic"** button
6. Drag traffic slider:
   - `procureflow-web-00042-bad`: **0%**
   - `procureflow-web-00041-good`: **100%**
7. Click **"Save"**
8. Wait ~1-2 minutes for traffic shift
9. Verify rollback: Visit service URL and test critical flows

**Rollback Time**: ~3-5 minutes (manual UI interaction + traffic shift)

---

### Gradual Rollback (Canary Rollback)

**Use Case**: Not sure if issue is deployment-related, want to gradually reduce traffic to new revision

**Procedure** (gcloud):

```powershell
# Step 1: Reduce traffic to new revision (50% split)
gcloud run services update-traffic procureflow-web \
  --region=us-central1 \
  --to-revisions=procureflow-web-00042-bad=50,procureflow-web-00041-good=50

# Step 2: Monitor error rate and latency for 5 minutes

# Step 3a: If errors persist with 00042 → Full rollback to 00041
gcloud run services update-traffic procureflow-web \
  --region=us-central1 \
  --to-revisions=procureflow-web-00041-good=100

# Step 3b: If errors go away → Issue not deployment-related, restore 100% to 00042
gcloud run services update-traffic procureflow-web \
  --region=us-central1 \
  --to-revisions=procureflow-web-00042-bad=100
```

---

## Pulumi Infrastructure Rollback

### Overview

Pulumi stores infrastructure state in **Pulumi Cloud** (remote backend). Each `pulumi up` creates a new state checkpoint. Rollback = revert to previous state checkpoint.

**Use Cases**:

- Cloud Run service configuration changed (CPU, memory, env vars) and needs revert
- Secret Manager secrets corrupted and need restore
- IAM bindings changed incorrectly

**Not Applicable For**:

- Application code bugs (use Cloud Run revision rollback instead)
- Database data corruption (use MongoDB backup restore)

---

### Pulumi Stack Rollback Procedure

**Trigger**: Infrastructure change caused issues (e.g., incorrect env var, wrong service account binding)

**Procedure**:

```powershell
# 1. Navigate to Pulumi project directory
cd packages/infra/pulumi/gcp

# 2. Login to Pulumi
pulumi login
# Enter PULUMI_ACCESS_TOKEN when prompted

# 3. Select stack
pulumi stack select dev  # or staging, production

# 4. View stack history (recent updates)
pulumi stack history

# Output:
# VERSION  TIME                  RESOURCE CHANGES  DESCRIPTION
# 42       2025-11-12 10:30:00   +0 ~1 -0         Update env vars (BAD)
# 41       2025-11-11 15:20:00   +0 ~0 -0         No changes
# 40       2025-11-10 09:15:00   +1 ~0 -0         Initial deployment

# 5. Identify good version (last stable: version 41)

# 6. Export previous state
pulumi stack export --version 41 > stack-backup-v41.json

# 7. Import previous state (ROLLBACK)
pulumi stack import < stack-backup-v41.json

# Output:
# ✅ Successfully imported stack state from version 41

# 8. Apply infrastructure (revert to previous state)
pulumi up --yes

# Output:
# Updating (dev)
#   ~ gcp:cloudrun/service:Service procureflow-web updating (1)
#   ~ environment variables reverted to version 41
# Resources:
#   ~ 1 to update
#   1 unchanged
# Duration: 45s

# 9. Verify rollback
gcloud run services describe procureflow-web --region=us-central1 --format=yaml | grep -A 10 "env:"
```

**Rollback Time**: ~10-15 minutes (export state + import + pulumi up + verification)

---

### Alternative: Pulumi Refresh and Revert

**Use Case**: Pulumi state drifted from actual GCP infrastructure

**Procedure**:

```powershell
# 1. Refresh Pulumi state from GCP (sync actual infrastructure)
pulumi refresh --yes

# 2. Review changes detected
# Pulumi will show differences between state and actual infrastructure

# 3. Revert code changes
git log --oneline -5  # Find bad commit
git revert <bad-commit-sha>  # Revert commit

# 4. Apply reverted code
pulumi up --yes

# 5. Verify infrastructure matches expected state
pulumi stack output  # Check outputs (serviceUrl, etc.)
```

---

## Data Migration Handling

### MongoDB Backup and Restore

**v1.0 Status**: ❌ No automated backups configured (MongoDB Atlas M0 free tier has no automated backups)

**Manual Backup Procedure** (Before Risky Migrations):

```powershell
# 1. Dump current database
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/procureflow" \
  --out=./backup-$(date +%Y%m%d-%H%M%S)

# Output:
# backup-20251112-103000/
#   procureflow/
#     items.bson
#     items.metadata.json
#     carts.bson
#     carts.metadata.json
#     purchaseRequests.bson
#     purchaseRequests.metadata.json

# 2. Compress backup
tar -czf backup-20251112-103000.tar.gz backup-20251112-103000/

# 3. Upload to Google Cloud Storage (long-term retention)
gsutil cp backup-20251112-103000.tar.gz gs://procureflow-backups/
```

**Restore Procedure** (After Failed Migration):

```powershell
# 1. Download backup from Cloud Storage
gsutil cp gs://procureflow-backups/backup-20251112-103000.tar.gz .

# 2. Extract backup
tar -xzf backup-20251112-103000.tar.gz

# 3. Restore database
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/procureflow" \
  --drop \  # Drop existing collections before restore
  ./backup-20251112-103000/procureflow

# Output:
# restoring procureflow.items from backup-20251112-103000/procureflow/items.bson
# 200 document(s) restored successfully
# restoring procureflow.carts from backup-20251112-103000/procureflow/carts.bson
# 5 document(s) restored successfully

# 4. Verify restore
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/procureflow"
db.items.countDocuments()  # Should match backup count
db.carts.countDocuments()
```

**Restore Time**: ~5-10 minutes (download + restore + verification)

---

### Database Migration Rollback (Future)

**v2.0 Plan**: Use Prisma Migrate or migrate-mongo for versioned schema migrations

**Prisma Migrate Example**:

```powershell
# Rollback last migration
npx prisma migrate resolve --rolled-back 20251112103000_add_supplier_field

# Apply previous migration state
npx prisma migrate deploy

# Verify schema matches expected state
npx prisma db pull  # Pull schema from database
git diff prisma/schema.prisma  # Compare with expected schema
```

**migrate-mongo Example**:

```powershell
# Rollback last migration
npx migrate-mongo down

# Verify migration status
npx migrate-mongo status

# Output:
# APPLIED MIGRATIONS:
# 20251110_initial_schema.js
# 20251111_add_categories.js
# (20251112_add_supplier_field.js - ROLLED BACK)
```

---

## Config and Secrets Rollback

### Secret Manager Version Restore

**Trigger**: Secret corrupted or accidentally rotated (e.g., `NEXTAUTH_SECRET` changed incorrectly)

**Procedure**:

```powershell
# 1. List secret versions
gcloud secrets versions list nextauth-secret \
  --filter="state=enabled"

# Output:
# NAME  STATE    CREATED
# 3     ENABLED  2025-11-12 10:30:00  (BAD - Login fails)
# 2     ENABLED  2025-11-11 15:20:00  (GOOD - Last known working)
# 1     DISABLED 2025-11-10 09:15:00  (OLD - Initial secret)

# 2. Access previous version (version 2)
gcloud secrets versions access 2 --secret=nextauth-secret

# Output:
# <base64-secret-value>

# 3. Create new version with old value (restore)
gcloud secrets versions access 2 --secret=nextauth-secret | \
  gcloud secrets versions add nextauth-secret --data-file=-

# Output:
# Created version [4] of secret [nextauth-secret]

# 4. Disable bad version (version 3)
gcloud secrets versions disable 3 --secret=nextauth-secret

# 5. Update Cloud Run to use latest version (version 4 = restored)
gcloud run services update procureflow-web \
  --region=us-central1 \
  --update-secrets=NEXTAUTH_SECRET=nextauth-secret:latest

# 6. Verify login works
curl https://procureflow-web-xyz.run.app/api/auth/session
```

**Restore Time**: ~2-3 minutes (access version + create + update Cloud Run)

---

### Environment Variable Rollback

**Trigger**: Env var change caused issues (e.g., `NODE_ENV` set to `development` in production)

**Procedure**:

```powershell
# 1. List current env vars
gcloud run services describe procureflow-web \
  --region=us-central1 \
  --format=yaml | grep -A 20 "env:"

# 2. Identify bad env var (e.g., NODE_ENV=development)

# 3. Update to correct value
gcloud run services update procureflow-web \
  --region=us-central1 \
  --update-env-vars=NODE_ENV=production

# 4. Verify change
gcloud run services describe procureflow-web \
  --region=us-central1 \
  --format=yaml | grep -A 20 "env:"
```

**Rollback Time**: ~1-2 minutes (update + Cloud Run redeploy)

---

## Post-Rollback Validation

### Automated Validation

**Health Check** (Required):

```powershell
# Check health endpoint
SERVICE_URL=$(gcloud run services describe procureflow-web --region=us-central1 --format='value(status.url)')
curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/health"

# Expected: 200
```

**Smoke Tests** (Automated, Future):

```powershell
# Run E2E smoke tests
export SERVICE_URL=$(gcloud run services describe procureflow-web --region=us-central1 --format='value(status.url)')
pnpm --filter web test:e2e:smoke

# Output:
# ✅ Login flow: PASSED
# ✅ Catalog search: PASSED
# ✅ Add to cart: PASSED
# ✅ Checkout: PASSED
# ✅ Agent chat: PASSED
```

---

### Manual Validation

**Critical Flows** (Manual Testing, 5 minutes):

| Flow               | Test Case                                        | Expected Outcome                       | Priority    |
| ------------------ | ------------------------------------------------ | -------------------------------------- | ----------- |
| **Login**          | Navigate to service URL, login with test account | Redirect to `/catalog`, no errors      | 🔴 Critical |
| **Catalog Search** | Search for "pen"                                 | 5+ results displayed                   | 🔴 Critical |
| **Add to Cart**    | Add 1 item with quantity 5                       | Cart displays item, total cost correct | 🔴 Critical |
| **Checkout**       | Complete checkout from cart                      | PR number displayed, cart cleared      | 🔴 Critical |
| **Agent Chat**     | Send "search for notebooks"                      | Agent responds with results            | 🟡 High     |

**Failure Action**:

- 🔴 Critical test fails → **Escalate** to tech lead, investigate infrastructure issue (not just rollback)
- 🟡 High test fails → Create bug ticket, monitor for 30 minutes

---

### Metrics Validation (Future)

**Prometheus Metrics** (Grafana dashboard):

| Metric           | Baseline (Pre-Rollback) | Post-Rollback | Status  |
| ---------------- | ----------------------- | ------------- | ------- |
| **Error rate**   | < 0.1%                  | < 0.1%        | ✅ Pass |
| **P95 latency**  | < 1s                    | < 1s          | ✅ Pass |
| **Request rate** | ~100 req/min            | ~100 req/min  | ✅ Pass |
| **Active users** | ~10                     | ~10           | ✅ Pass |

**Query Examples** (Prometheus):

```promql
# Error rate (5-minute window)
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Request rate
rate(http_requests_total[5m])
```

**Validation Criteria**:

- ✅ Error rate < baseline + 0.05%
- ✅ P95 latency < baseline + 200ms
- ✅ Request rate > 50% of baseline (allows for gradual traffic recovery)

---

## Assumptions and Limitations

### Assumptions

1. **Cloud Run revision retention**: Cloud Run retains at least 5 previous revisions (sufficient for rollback)
2. **Pulumi state availability**: Pulumi Cloud backend is available and state is not corrupted
3. **MongoDB Atlas uptime**: Database is accessible during rollback (99.5% uptime SLA)
4. **Secret Manager versioning**: Secret Manager retains at least 10 versions per secret
5. **No data loss tolerance**: Rollback accepts data loss between deployment and rollback (no point-in-time recovery)
6. **Manual execution acceptable**: Rollback requires manual execution by on-call engineer (no automated rollback)
7. **DNS propagation time**: Cloud Run URL DNS propagates within 1-2 minutes (no stale DNS caching)

### Limitations

1. **No automated rollback**: All rollback procedures require manual execution (no GitHub Actions workflow for rollback)
2. **No point-in-time recovery**: MongoDB Atlas M0 free tier has no automated backups, no PITR (point-in-time recovery)
3. **No database migration automation**: No automated schema migration rollback (manual `mongorestore` required)
4. **No canary rollback automation**: Gradual traffic shift requires manual `gcloud` commands
5. **No rollback testing**: Rollback procedures not tested in CI/CD (manual testing only)
6. **No rollback metrics**: No MTTR (mean time to recovery) tracking for rollbacks
7. **No rollback notifications**: No Slack/email notifications on rollback execution
8. **No rollback approval**: No approval workflow for rollback (any engineer with `gcloud` access can execute)
9. **No multi-region rollback**: Single-region deployment (us-central1), no multi-region traffic failover
10. **No blue-green deployment**: Cloud Run uses revision-based deployment, not blue-green (no instant full swap)

---

## References

### Internal Documents

- [Deployment Strategy](./deployment-strategy.md) - Deployment flow and promotion model
- [Infrastructure Documentation](../architecture/infrastructure.md) - Cloud Run, Secret Manager, MongoDB Atlas setup
- [Autoscaling Policy](./autoscaling-policy.md) - Cloud Run autoscaling configuration
- [Runbook: Rollback](../operation/runbooks/rollback.md) - Step-by-step rollback procedure

### External Resources

- [GCP Cloud Run Revisions](https://cloud.google.com/run/docs/managing/revisions) - Revision management and traffic splitting
- [Pulumi Stack Rollback](https://www.pulumi.com/docs/cli/commands/pulumi_stack_export/) - Export/import stack state
- [MongoDB Backup and Restore](https://www.mongodb.com/docs/database-tools/mongodump/) - mongodump/mongorestore utilities
- [GCP Secret Manager Versions](https://cloud.google.com/secret-manager/docs/creating-and-accessing-secrets) - Secret versioning
- [Cloud Run Traffic Splitting](https://cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration) - Gradual rollout and rollback

---

**Last Updated**: 2025-11-12  
**Owner**: Platform Team + Tech Lead  
**Reviewers**: Engineering Team  
**Next Review**: Quarterly (2026-02-01) or after rollback execution  
**Status**: ✅ Complete
