# Runbook: Rollback

**Executive Summary**: Rollback failed ProcureFlow deployment using Cloud Run revision traffic splitting (instant zero-downtime rollback in ~2-3 minutes) or Pulumi infrastructure rollback (revert to previous state in ~10-15 minutes). Decision: health check failed → Cloud Run auto-serves previous revision (no action needed), bad deployment detected → manual traffic split via `gcloud` CLI, infrastructure issue → Pulumi state rollback. Post-rollback verification includes health check (HTTP 200), smoke tests (login, search, cart, checkout), and monitoring error rate/latency return to baseline.

---

## Metadata

- **Owner**: Platform Team + On-Call Engineers
- **Last Verified**: 2025-10-15 (staging rollback test)
- **Verification Frequency**: Quarterly (test rollback in staging)
- **Estimated Duration**: 2-5 minutes (traffic split), 10-30 minutes (Pulumi rollback)
- **Complexity**: 🔴 High
- **Prerequisites**: GCP access with Cloud Run Admin role, Pulumi access (for infrastructure rollback)

---

## Prerequisites

### Required Access

- [ ] **GCP Access**: Cloud Run Admin role (to update traffic allocation)
  ```powershell
  gcloud auth list  # Verify authenticated
  gcloud config get-value project  # Should show procureflow-dev
  ```

- [ ] **gcloud CLI Installed and Authenticated**:
  ```powershell
  gcloud --version  # Should show Google Cloud SDK 450.0.0+
  gcloud auth login  # If not authenticated
  ```

### For Pulumi Infrastructure Rollback

- [ ] **Pulumi CLI Installed**:
  ```powershell
  pulumi version  # Should show v3.x.x
  ```

- [ ] **Pulumi Access Token Configured**:
  ```powershell
  pulumi login
  # Enter token from https://app.pulumi.com/account/tokens
  ```

---

## Decision Tree: Which Rollback Procedure?

### Scenario 1: Health Check Failed (Automated Rollback)

**Trigger**: GitHub Actions Job 3 shows "❌ Health check failed (HTTP 500)"

**Action**: **No manual action needed** - Cloud Run automatically serves previous revision

**Verification**: Check Cloud Run console shows previous revision serving 100% traffic

**Procedure**: Skip to [Verification](#verification) section

---

### Scenario 2: Bad Deployment Detected (Manual Traffic Split)

**Trigger**: Deployment passed health check, but critical bug discovered post-deployment

**Examples**:
- Checkout flow broken
- Error rate spiked to > 1%
- P95 latency increased to > 3s

**Action**: **Execute Procedure A** - Cloud Run Traffic Split Rollback

**Estimated Time**: 2-5 minutes

---

### Scenario 3: Infrastructure Issue (Pulumi Rollback)

**Trigger**: Infrastructure configuration changed incorrectly (env vars, secrets, service account)

**Examples**:
- `NODE_ENV` set to `development` in production
- `NEXTAUTH_SECRET` rotated incorrectly (login fails)
- Cloud Run CPU/memory limits changed incorrectly

**Action**: **Execute Procedure B** - Pulumi Infrastructure Rollback

**Estimated Time**: 10-30 minutes

---

## Procedure A: Cloud Run Traffic Split Rollback

### Step 1: Identify Good Revision

**Description**: Find last known stable Cloud Run revision to rollback to

**Commands**:

```powershell
# List recent revisions (last 5)
gcloud run revisions list `
  --service=procureflow-web `
  --region=us-central1 `
  --limit=5

# Output shows:
# REVISION                                ACTIVE  SERVICE            DEPLOYED
# procureflow-web-00042-sha-bad123   ✅ Yes   procureflow-web    2025-11-12 10:30:00
# procureflow-web-00041-sha-good456  ❌ No    procureflow-web    2025-11-11 15:20:00
# procureflow-web-00040-sha-old789   ❌ No    procureflow-web    2025-11-10 09:15:00
```

**Identify Good Revision**:
- **Bad revision**: `procureflow-web-00042-sha-bad123` (currently active, has bug)
- **Good revision**: `procureflow-web-00041-sha-good456` (last known stable)

**Verification**:
- [ ] Good revision identified (e.g., `00041-sha-good456`)
- [ ] Good revision deployed date matches last stable deployment

---

### Step 2: Shift Traffic to Good Revision

**Description**: Update Cloud Run traffic allocation to route 100% traffic to good revision

**Commands**:

```powershell
# Shift 100% traffic to good revision
gcloud run services update-traffic procureflow-web `
  --region=us-central1 `
  --to-revisions=procureflow-web-00041-sha-good456=100

# Output:
# ✅ Traffic updated. Revision procureflow-web-00041-sha-good456 now receives 100% of traffic.
```

**Expected Output**:
```
Deploying container to Cloud Run service [procureflow-web] in project [procureflow-dev] region [us-central1]
✓ Updating traffic... Done.
  100% procureflow-web-00041-sha-good456
Done.
Service [procureflow-web] revision [procureflow-web-00041-sha-good456] has been deployed and is serving 100 percent of traffic.
```

**Rollback Time**: ~1-2 minutes (instant traffic shift + DNS propagation)

**Verification**:
- [ ] Command completed successfully
- [ ] Output shows 100% traffic to good revision

---

### Step 3: Verify Rollback

**Description**: Confirm rollback successful and application working

**Commands**:

```powershell
# Get service URL
$SERVICE_URL = gcloud run services describe procureflow-web `
  --region=us-central1 `
  --format='value(status.url)'

# Wait 30 seconds for DNS propagation
Start-Sleep -Seconds 30

# Check health endpoint
curl -s $SERVICE_URL/api/health

# Expected: {"status":"ok","timestamp":"2025-11-12T..."}
```

**Manual Smoke Tests**:

1. **Login**: Navigate to `$SERVICE_URL`, login with `demo@procureflow.com` / `demo123`
   - **Expected**: Redirect to `/catalog`, no errors

2. **Catalog Search**: Search for "pen"
   - **Expected**: 5+ results displayed

3. **Add to Cart**: Add item with quantity 5
   - **Expected**: Cart badge shows "1"

4. **Checkout**: Complete checkout from cart
   - **Expected**: PR number displayed, cart cleared

**Verification**:
- [ ] Health check returns 200
- [ ] Login successful
- [ ] Catalog search works
- [ ] Add to cart works
- [ ] Checkout completes
- [ ] No errors in browser console

---

### Step 4: Monitor Error Rate and Latency

**Description**: Verify error rate and latency returned to baseline after rollback

**Commands** (Cloud Run Console):

```
Navigate to: https://console.cloud.google.com/run/detail/us-central1/procureflow-web/metrics
```

**Metrics to Check**:

| Metric | Baseline (Before Bad Deploy) | After Rollback | Status |
|--------|------------------------------|----------------|--------|
| **Error rate** | < 0.1% | < 0.1% | ✅ Pass |
| **P95 latency** | < 1s | < 1s | ✅ Pass |
| **Request rate** | ~100 req/min | ~100 req/min | ✅ Pass |
| **Active instances** | 1-2 | 1-2 | ✅ Pass |

**Verification**:
- [ ] Error rate < 0.1% (baseline)
- [ ] P95 latency < 1s (baseline)
- [ ] Request rate matches baseline
- [ ] No unusual spikes in metrics

---

## Procedure B: Pulumi Infrastructure Rollback

### Step 1: Identify Good Pulumi Version

**Description**: Find last known stable Pulumi state version to rollback to

**Commands**:

```powershell
# Navigate to Pulumi project
cd C:\Workspace\procureflow\packages\infra\pulumi\gcp

# Login to Pulumi
pulumi login

# Select stack
pulumi stack select dev  # or staging, production

# View stack history (recent updates)
pulumi stack history

# Output:
# VERSION  TIME                  RESOURCE CHANGES  DESCRIPTION
# 42       2025-11-12 10:30:00   +0 ~1 -0         Update env vars (BAD)
# 41       2025-11-11 15:20:00   +0 ~0 -0         No changes
# 40       2025-11-10 09:15:00   +1 ~0 -0         Initial deployment
```

**Identify Good Version**:
- **Bad version**: 42 (incorrect env var change)
- **Good version**: 41 (last known stable)

**Verification**:
- [ ] Good version identified (e.g., version 41)
- [ ] Good version timestamp matches last stable deployment

---

### Step 2: Export Previous State

**Description**: Export Pulumi state from good version to local file

**Commands**:

```powershell
# Export state from version 41
pulumi stack export --version 41 > stack-backup-v41.json

# Verify export
cat stack-backup-v41.json | Select-String "version"

# Output should show state structure
```

**Verification**:
- [ ] `stack-backup-v41.json` file created
- [ ] File size > 0 bytes (state exported successfully)

---

### Step 3: Import Previous State (Rollback)

**Description**: Import previous state to rollback Pulumi stack

**Commands**:

```powershell
# Import previous state (ROLLBACK)
pulumi stack import < stack-backup-v41.json

# Output:
# ✅ Successfully imported stack state from version 41
```

**Verification**:
- [ ] Import completed successfully
- [ ] No errors in output

---

### Step 4: Apply Infrastructure (Revert to Previous State)

**Description**: Execute `pulumi up` to revert infrastructure to previous state

**Commands**:

```powershell
# Preview changes (should show reverting bad change)
pulumi preview

# Output:
# Previewing update (dev)
#   ~ gcp:cloudrun/service:Service procureflow-web updating (1)
#   ~ environment variables reverted to version 41
# Resources:
#   ~ 1 to update
#   1 unchanged

# Apply changes
pulumi up --yes

# Output:
# Updating (dev)
#   ~ gcp:cloudrun/service:Service procureflow-web updated (1)
# Resources:
#   ~ 1 updated
#   1 unchanged
# Duration: 45s
```

**Rollback Time**: ~10-15 minutes (export + import + apply + Cloud Run redeploy)

**Verification**:
- [ ] `pulumi up` completed successfully
- [ ] Resources updated to previous state
- [ ] No errors in output

---

### Step 5: Verify Infrastructure Rollback

**Description**: Confirm infrastructure reverted to expected state

**Commands**:

```powershell
# Check Cloud Run env vars (example: verify NODE_ENV reverted to "production")
gcloud run services describe procureflow-web `
  --region=us-central1 `
  --format=yaml | Select-String -Pattern "env:" -Context 0,10

# Verify service URL unchanged
pulumi stack output serviceUrl
```

**Verification**:
- [ ] Env vars match expected state (e.g., `NODE_ENV=production`)
- [ ] Service URL unchanged
- [ ] Cloud Run service status shows ✅ Healthy

---

### Step 6: Verify Application (Same as Procedure A, Step 3)

**Description**: Run health check and smoke tests

**Commands**:

```powershell
# Wait 30 seconds for service restart
Start-Sleep -Seconds 30

# Health check
$SERVICE_URL = pulumi stack output serviceUrl
curl -s $SERVICE_URL/api/health
```

**Manual Smoke Tests**: Follow Step 3 from Procedure A

**Verification**:
- [ ] Health check returns 200
- [ ] Smoke tests pass (login, search, cart, checkout)

---

## Verification

### Final Checks

**Rollback Status**:
- [ ] Traffic shifted to good revision (Procedure A) OR Pulumi state reverted (Procedure B)
- [ ] Cloud Run console shows good revision serving 100% traffic
- [ ] Service status shows ✅ Healthy

**Application Health**:
- [ ] Health endpoint returns 200: `GET /api/health`
- [ ] Smoke tests passed: Login, search, cart, checkout all working
- [ ] No errors in browser console or Cloud Run logs

**Metrics Baseline**:
- [ ] Error rate < baseline + 0.05% (allow small variance)
- [ ] P95 latency < baseline + 200ms
- [ ] Request rate > 50% of baseline (traffic recovering)

---

## Post-Rollback Actions

### Immediate Actions (Within 1 Hour)

1. **Notify Team**: Post in Slack #platform-incidents:
   ```
   🚨 Rollback executed: <service> <environment> <time>
   Reason: <brief description of issue>
   Rollback method: <Cloud Run traffic split / Pulumi state rollback>
   Status: ✅ Rollback successful, application healthy
   Next steps: <investigation, bug fix, re-deployment plan>
   ```

2. **Document Issue**: Create GitHub issue with label `incident`:
   ```
   Title: [Incident] Rollback executed on <date> due to <issue>
   Description:
   - Deployment: <commit SHA, deployment time>
   - Issue: <detailed description of problem>
   - Impact: <user-facing impact, error rate, latency>
   - Rollback: <method used, time taken>
   - Root cause: <TBD, under investigation>
   ```

3. **Investigate Root Cause**: 
   - Review Cloud Run logs for errors
   - Review code changes in bad deployment
   - Identify root cause (code bug, config error, infrastructure issue)

---

### Follow-Up Actions (Within 24 Hours)

1. **Fix Issue**: 
   - Create bug fix PR
   - Test fix locally and in staging
   - Deploy fix to dev/staging for validation

2. **Conduct Postmortem** (if production rollback):
   - **When**: Within 24-48 hours of incident
   - **Attendees**: Platform team, on-call engineer, tech lead
   - **Agenda**:
     1. Timeline of events (deployment → issue detected → rollback → resolution)
     2. Root cause analysis (5 whys)
     3. Impact assessment (users affected, downtime, error rate spike)
     4. Action items (prevent recurrence)

3. **Update Runbooks** (if rollback process revealed gaps):
   - Add troubleshooting steps for new failure mode
   - Update decision tree with new scenario
   - Add pre-deployment checks to prevent recurrence

---

## Troubleshooting

### Common Issues

**Issue 1: "gcloud command not found"**
```
gcloud: The term 'gcloud' is not recognized
```
**Solution**:
```powershell
# Install gcloud CLI
# Download from: https://cloud.google.com/sdk/docs/install

# Or install with Chocolatey (Windows)
choco install gcloudsdk

# Verify installation
gcloud --version
```

---

**Issue 2: "Revision not found"**
```
ERROR: (gcloud.run.services.update-traffic) Revision [procureflow-web-00041-sha-good456] not found
```
**Solution**:
```powershell
# List all revisions (increase limit)
gcloud run revisions list `
  --service=procureflow-web `
  --region=us-central1 `
  --limit=20

# Find correct revision name (copy exact name from output)
# Retry with correct revision name
```

---

**Issue 3: "Pulumi state corrupted"**
```
error: the current deployment has 1 resource(s) with pending operations
```
**Solution**:
```powershell
# Cancel pending operations
pulumi cancel

# Refresh Pulumi state from GCP
pulumi refresh --yes

# Retry rollback from Step 1
```

---

**Issue 4: "Rollback succeeded but application still broken"**
```
✅ Traffic shifted to good revision, but application still showing errors
```
**Solution**:
```powershell
# Check if good revision is actually healthy
gcloud run revisions describe procureflow-web-00041-sha-good456 `
  --region=us-central1 `
  --format=yaml | Select-String "status"

# If good revision also unhealthy, rollback to older revision (00040)
gcloud run services update-traffic procureflow-web `
  --region=us-central1 `
  --to-revisions=procureflow-web-00040-sha-old789=100

# If all revisions unhealthy, infrastructure issue (escalate to tech lead)
```

---

## Escalation Path

**If rollback fails after troubleshooting**:

1. **First**: Review [Rollback Strategy](../../operations/rollback-strategy.md) documentation for additional guidance

2. **Second**: Check Cloud Run service logs for detailed errors:
   ```powershell
   gcloud run services logs read procureflow-web --region=us-central1 --limit=100
   ```

3. **Third**: Post in team Slack channel #platform-incidents:
   ```
   🚨 URGENT: Rollback failed for <service> <environment>
   Attempted: <rollback method>
   Error: <error message>
   Current state: <application status>
   Need assistance: @platform-team @tech-lead
   ```

4. **Fourth**: If production impacted and rollback failed:
   - Escalate to on-call engineer (PagerDuty)
   - Escalate to tech lead
   - Consider emergency measures: Scale Cloud Run to 0 instances (stop serving traffic) until issue resolved

---

## References

### Internal Documents

- [Rollback Strategy](../../operations/rollback-strategy.md) - Rollback decision tree and procedures
- [Deployment Strategy](../../operations/deployment-strategy.md) - Deployment process overview
- [Infrastructure Documentation](../../architecture/infrastructure.md) - Cloud Run and Pulumi setup

### External Resources

- [GCP Cloud Run Revisions](https://cloud.google.com/run/docs/managing/revisions) - Revision management
- [Cloud Run Traffic Splitting](https://cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration) - Traffic migration
- [Pulumi Stack Export/Import](https://www.pulumi.com/docs/cli/commands/pulumi_stack_export/) - State management

---

**Last Updated**: 2025-11-12  
**Status**: ✅ Verified (Platform Team tested rollback in staging on 2025-10-15)
