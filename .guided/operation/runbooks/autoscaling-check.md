# Runbook: Autoscaling Check

**Executive Summary**: Monitor and verify ProcureFlow Cloud Run autoscaling behavior by checking instance count, concurrency metrics, cost alerts, and scaling triggers. Weekly procedure: review Cloud Run metrics dashboard (instance count, request latency, error rate), verify autoscaling within configured limits (dev: 0-2 instances, prod: 1-100), check GCP billing alerts, validate no cost anomalies. If autoscaling issues detected (too many instances, high cost, slow scale-up), adjust Cloud Run annotations (`minScale`, `maxScale`, `containerConcurrency`) via Pulumi. Total time: ~10-15 minutes for weekly check, ~30-60 minutes for troubleshooting and adjustments.

---

## Metadata

- **Owner**: Platform Team
- **Last Verified**: 2025-11-05
- **Verification Frequency**: Weekly (ops review)
- **Estimated Duration**: 10-15 minutes (weekly check), 30-60 minutes (troubleshooting)
- **Complexity**: 🟢 Low
- **Prerequisites**: GCP access with Cloud Run Viewer role, basic understanding of autoscaling metrics

---

## Prerequisites

### Required Access

- [ ] **GCP Access**: Cloud Run Viewer role (read-only metrics access)
  ```powershell
  gcloud auth list  # Verify authenticated
  gcloud config get-value project  # Should show procureflow-dev
  ```

### Required Tools

- [ ] **gcloud CLI Installed**:

  ```powershell
  gcloud --version  # Should show Google Cloud SDK 450.0.0+
  ```

- [ ] **Web Browser**: Access to GCP Console for metrics dashboard

---

## Procedure

### Step 1: Review Cloud Run Metrics Dashboard

**Description**: Check Cloud Run autoscaling metrics in GCP Console

**Navigate To**:

```
https://console.cloud.google.com/run/detail/us-central1/procureflow-web/metrics
```

**Metrics to Review** (last 7 days):

1. **Instance Count**
   - **Chart**: "Container instance count"
   - **Check**: Instance count stays within configured limits (dev: 0-2, prod: 1-100)
   - **Expected**: Dev environment scales 0 → 1-2 during traffic, prod stays at 1 minimum

2. **Request Latency**
   - **Chart**: "Request latency"
   - **Check**: P50, P95, P99 latency trends
   - **Expected**: P95 < 1s (baseline), P99 < 2s

3. **Request Count**
   - **Chart**: "Request count"
   - **Check**: Request rate over time
   - **Expected**: Dev environment ~10-50 req/min, prod ~100-500 req/min (varies)

4. **Error Rate**
   - **Chart**: "Container error rate"
   - **Check**: Error percentage over time
   - **Expected**: < 0.1% (baseline)

**Verification**:

- [ ] Instance count within limits
- [ ] P95 latency < 1s
- [ ] Request rate stable (no unusual spikes)
- [ ] Error rate < 0.1%

---

### Step 2: Check Instance Count Details

**Description**: Get current instance count and compare with configured limits

**Commands**:

```powershell
# Get current instance count
gcloud run services describe procureflow-web `
  --region=us-central1 `
  --format=yaml | Select-String -Pattern "instances" -Context 0,5

# Output shows:
#   status:
#     conditions:
#     - lastTransitionTime: '2025-11-12T10:30:00Z'
#       status: 'True'
#       type: Ready
#     traffic:
#     - latestRevision: true
#       percent: 100
#     observedGeneration: 42
#     url: https://procureflow-web-xyz.run.app
```

**Alternative**: Check instance count in Cloud Run console

**Navigate To**:

```
https://console.cloud.google.com/run/detail/us-central1/procureflow-web/metrics
```

- **Chart**: "Container instance count"
- **Current Value**: Shows current number of running instances

**Expected Values**:

| Environment    | Min Instances | Max Instances | Current (Idle) | Current (Load) | Status    |
| -------------- | ------------- | ------------- | -------------- | -------------- | --------- |
| **Dev**        | 0             | 2             | 0              | 1-2            | ✅ Normal |
| **Staging**    | 0             | 10            | 0              | 1-5            | ✅ Normal |
| **Production** | 1             | 100           | 1              | 5-20           | ✅ Normal |

**Verification**:

- [ ] Current instance count within configured min/max limits
- [ ] No instances stuck (e.g., 10 instances running with 0 traffic)

---

### Step 3: Verify Autoscaling Configuration

**Description**: Check Cloud Run autoscaling annotations (minScale, maxScale, containerConcurrency)

**Commands**:

```powershell
# Get autoscaling configuration
gcloud run services describe procureflow-web `
  --region=us-central1 `
  --format=yaml | Select-String -Pattern "autoscaling" -Context 0,3

# Expected output:
#     metadata:
#       annotations:
#         autoscaling.knative.dev/minScale: '0'  # Dev: 0, Prod: 1
#         autoscaling.knative.dev/maxScale: '2'  # Dev: 2, Prod: 100
#     spec:
#       containerConcurrency: 80  # Target concurrency per instance
```

**Expected Configuration**:

| Environment    | minScale | maxScale | containerConcurrency | Status        |
| -------------- | -------- | -------- | -------------------- | ------------- |
| **Dev**        | 0        | 2        | 80                   | ✅ Configured |
| **Staging**    | 0        | 10       | 80                   | ⏸️ Planned    |
| **Production** | 1        | 100      | 80                   | ⏸️ Planned    |

**Verification**:

- [ ] `minScale` matches expected value
- [ ] `maxScale` matches expected value
- [ ] `containerConcurrency` set to 80

---

### Step 4: Check Concurrency Metrics

**Description**: Verify actual concurrent requests per instance matches target (80)

**Navigate To**:

```
https://console.cloud.google.com/run/detail/us-central1/procureflow-web/metrics
```

**Metrics to Check**:

1. **Container Concurrency**
   - **Chart**: "Container instance concurrency" (if available)
   - **Expected**: Average concurrency per instance < 80

2. **Request Count vs Instance Count**
   - **Calculation**: `Avg Concurrency = Request Rate / Instance Count`
   - **Example**: 160 req/s ÷ 2 instances = 80 concurrent requests/instance
   - **Expected**: Avg concurrency ≤ 80 (target)

**Manual Calculation** (if chart not available):

```powershell
# Get request count (last 5 minutes)
# Use Cloud Console metrics or calculate from logs

# Example:
# Request rate: 160 req/min = 2.67 req/s
# Instance count: 2 instances
# Avg concurrency: 2.67 req/s × (assume 1s request duration) × 2 instances / 2 instances ≈ 2.67 concurrent requests
# (Note: This is simplified; actual concurrency depends on request duration)
```

**Verification**:

- [ ] Avg concurrency per instance ≤ 80
- [ ] If concurrency > 80 consistently: Autoscaler should add instances

---

### Step 5: Check Cost and Billing Alerts

**Description**: Verify GCP billing for autoscaling cost anomalies

**Navigate To**:

```
https://console.cloud.google.com/billing
```

**Select Project**: `procureflow-dev` (or staging/production)

**Check Monthly Spend**:

| Resource              | Expected Cost (Dev)   | Expected Cost (Prod)                     | Anomaly Threshold      |
| --------------------- | --------------------- | ---------------------------------------- | ---------------------- |
| **Cloud Run**         | $0 (within free tier) | ~$5-10/month (1 instance always running) | > $20/month            |
| **Artifact Registry** | ~$0.10/month          | ~$0.50/month                             | > $5/month             |
| **Secret Manager**    | $0 (6 secrets free)   | $0                                       | > $0                   |
| **MongoDB Atlas**     | $0 (M0 free tier)     | ~$57/month (M10)                         | > $100/month           |
| **OpenAI API**        | ~$2/month             | ~$50/month                               | > $100/month           |
| **Total**             | ~$2.10/month          | ~$112/month                              | Dev > $10, Prod > $200 |

**Check Billing Alerts**:

```
Navigate to: https://console.cloud.google.com/billing/budgets
```

**Verify Alerts Configured**:

- [ ] Monthly spend alert at $10/month (dev environment)
- [ ] Monthly spend alert at $50/month (staging/production, future)

**Verification**:

- [ ] Current month spend within expected range
- [ ] No cost spikes in last 7 days
- [ ] Billing alerts configured and active

---

### Step 6: Validate Scaling Behavior (Optional Load Test)

**Description**: Trigger autoscaling by generating load and verify instances scale up/down

**Prerequisites**:

- [ ] k6 load testing tool installed (future v1.2)
- [ ] Load test approved (don't run in production without approval)

**Commands** (PowerShell):

```powershell
# Install k6 (if not installed)
choco install k6  # Windows
# brew install k6  # macOS

# Run baseline load test (50 concurrent users, 5 minutes)
cd C:\Workspace\procureflow
k6 run scripts/load-test/baseline.js

# Monitor instance count during load test
# Open in browser: https://console.cloud.google.com/run/detail/us-central1/procureflow-web/metrics
# Watch "Container instance count" chart in real-time
```

**Expected Behavior**:

| Phase              | Duration | Expected Instance Count   | Status                 |
| ------------------ | -------- | ------------------------- | ---------------------- |
| **Ramp-up**        | 0-2 min  | 0 → 1-2 (dev)             | ✅ Scaling up          |
| **Sustained load** | 2-7 min  | 1-2 (dev)                 | ✅ Stable              |
| **Ramp-down**      | 7-9 min  | 1-2 → 1                   | ✅ Scaling down slowly |
| **Idle**           | 9-24 min | 1 → 0 (after 15 min idle) | ✅ Scaled to zero      |

**Verification**:

- [ ] Instances scale up when load increases
- [ ] Instances scale down after load decreases
- [ ] Scale-down respects 15-minute idle timeout

---

## Verification

### Weekly Check Results

**Autoscaling Health**:

- [ ] Instance count within configured limits (min/max)
- [ ] Avg concurrency per instance ≤ 80
- [ ] P95 latency < 1s (no performance degradation)
- [ ] Error rate < 0.1%

**Cost Health**:

- [ ] Monthly spend within expected range (dev < $10, prod < $200)
- [ ] No unusual cost spikes in last 7 days
- [ ] Billing alerts configured

**Scaling Behavior** (if load test run):

- [ ] Instances scale up under load
- [ ] Instances scale down after load decreases
- [ ] Scale-to-zero works (dev environment only)

---

## Troubleshooting

### Issue 1: Too Many Instances Running

**Symptom**: Instance count higher than expected (e.g., dev environment running 5 instances with minimal traffic)

**Diagnosis**:

```powershell
# Check current traffic
gcloud run services describe procureflow-web `
  --region=us-central1 `
  --format=yaml | Select-String -Pattern "traffic" -Context 0,5

# Check Cloud Run metrics for request rate
# Navigate to: https://console.cloud.google.com/run/detail/us-central1/procureflow-web/metrics
```

**Possible Causes**:

1. **Traffic spike**: Legitimate traffic increase causing autoscaling
2. **Slow requests**: Requests taking > 5s cause more instances to queue up
3. **maxScale too high**: Configured maxScale allows too many instances
4. **Concurrency too low**: containerConcurrency < 80 causes more instances

**Solution**:

```powershell
# Option 1: Lower maxScale (if too high)
# Edit packages/infra/pulumi/gcp/compute/cloudrun.ts
# Change: "autoscaling.knative.dev/maxScale": "2" → "1"
# Deploy: pulumi up

# Option 2: Increase containerConcurrency (if too low)
# Edit packages/infra/pulumi/gcp/compute/cloudrun.ts
# Change: containerConcurrency: 80 → 100
# Deploy: pulumi up

# Option 3: Manual scale-down (temporary fix)
# Cloud Run automatically scales down after 15 minutes idle
# No manual action needed, wait for scale-down
```

---

### Issue 2: Slow Scale-Up (Cold Starts)

**Symptom**: High latency spikes during traffic increases (P95 > 3s), indicating slow instance startup

**Diagnosis**:

```powershell
# Check cold start metrics in Cloud Run console
# Navigate to: https://console.cloud.google.com/run/detail/us-central1/procureflow-web/metrics
# Look for latency spikes coinciding with instance count increases
```

**Possible Causes**:

1. **minScale = 0**: Scale-to-zero causes cold starts (~2-4s startup time)
2. **Large container image**: Slow container startup due to large Next.js build
3. **Slow Next.js initialization**: Next.js taking > 2s to initialize

**Solution**:

```powershell
# Option 1: Set minScale = 1 (keep 1 instance always warm)
# Edit packages/infra/pulumi/gcp/compute/cloudrun.ts
# Change: "autoscaling.knative.dev/minScale": "0" → "1"
# Deploy: pulumi up
# Cost impact: +$5-10/month (1 instance always running)

# Option 2: Optimize Docker image (reduce startup time)
# Use multi-stage builds, smaller base image
# See: packages/infra/docker/Dockerfile.web

# Option 3: Enable Cloud Run minimum instances (future)
# Keep 1-2 instances pre-warmed (reduces cold start to < 1s)
```

---

### Issue 3: Cost Spike (Unexpected Autoscaling)

**Symptom**: GCP billing shows Cloud Run cost > $50/month (dev environment expected < $5)

**Diagnosis**:

```powershell
# Check instance count history (last 30 days)
# Navigate to: https://console.cloud.google.com/run/detail/us-central1/procureflow-web/metrics
# Chart: "Container instance count" → Time range: Last 30 days

# Check request count history
# Chart: "Request count" → Time range: Last 30 days
```

**Possible Causes**:

1. **DDoS attack**: Abnormal traffic spike causing autoscaling
2. **maxScale too high**: Autoscaler allowed 100 instances (should be 2 for dev)
3. **Runaway process**: Long-running requests preventing instance termination

**Solution**:

```powershell
# Option 1: Lower maxScale immediately (prevent further cost)
# Manual fix via gcloud (faster than Pulumi)
gcloud run services update procureflow-web `
  --region=us-central1 `
  --max-instances=2  # Dev environment limit

# Option 2: Investigate request source (check for DDoS)
# Review Cloud Run logs for unusual request patterns
gcloud run services logs read procureflow-web `
  --region=us-central1 `
  --limit=100

# Option 3: Set up cost alerts (if not configured)
# Navigate to: https://console.cloud.google.com/billing/budgets
# Create budget alert at $10/month threshold
```

---

### Issue 4: Autoscaling Not Working (Stuck at 1 Instance)

**Symptom**: Cloud Run stuck at 1 instance despite high traffic (request queue building up)

**Diagnosis**:

```powershell
# Check autoscaling configuration
gcloud run services describe procureflow-web `
  --region=us-central1 `
  --format=yaml | Select-String -Pattern "autoscaling" -Context 0,5

# Expected:
# autoscaling.knative.dev/maxScale: '2' (or higher)
# containerConcurrency: 80
```

**Possible Causes**:

1. **maxScale = 1**: Autoscaling disabled (only 1 instance allowed)
2. **Quota exceeded**: GCP quota for Cloud Run instances exhausted
3. **Service account issue**: Cloud Run service account lacks permissions

**Solution**:

```powershell
# Option 1: Increase maxScale
gcloud run services update procureflow-web `
  --region=us-central1 `
  --max-instances=5

# Option 2: Check GCP quotas
gcloud compute project-info describe --project=procureflow-dev | Select-String "CLOUD_RUN"

# Option 3: Verify service account permissions
# Navigate to: https://console.cloud.google.com/iam-admin/iam
# Check service account has "Cloud Run Invoker" role
```

---

## Escalation Path

**If autoscaling issues persist after troubleshooting**:

1. **First**: Review [Autoscaling Policy](../../operations/autoscaling-policy.md) for detailed configuration

2. **Second**: Check Cloud Run service logs for errors:

   ```powershell
   gcloud run services logs read procureflow-web --region=us-central1 --limit=100
   ```

3. **Third**: Post in team Slack channel #platform-support:

   ```
   Autoscaling issue detected:
   - Environment: dev/staging/production
   - Issue: <description>
   - Current instance count: <X instances>
   - Expected instance count: <Y instances>
   - Metrics screenshot: <attach Cloud Run metrics screenshot>
   ```

4. **Fourth**: If production impacted (high latency, errors), escalate to on-call engineer

---

## References

### Internal Documents

- [Autoscaling Policy](../../operations/autoscaling-policy.md) - Autoscaling configuration and baselines
- [Infrastructure Documentation](../../architecture/infrastructure.md) - Cloud Run setup
- [PRD: Non-Functional Requirements](../../product/prd.non-functional-requirements.md) - Performance targets

### External Resources

- [GCP Cloud Run Autoscaling](https://cloud.google.com/run/docs/about-instance-autoscaling) - Autoscaling documentation
- [Cloud Run Concurrency](https://cloud.google.com/run/docs/about-concurrency) - Concurrency configuration
- [Cloud Run Metrics](https://cloud.google.com/run/docs/monitoring) - Metrics reference

---

**Last Updated**: 2025-11-12  
**Status**: ✅ Verified (Platform Team checked autoscaling on 2025-11-05)
