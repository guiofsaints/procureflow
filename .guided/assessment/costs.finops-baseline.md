# FinOps Baseline: Cost Analysis and Optimization

**Assessment Date**: 2025-11-13  
**Project**: ProcureFlow  
**Scope**: GitHub Actions, GCP, Pulumi Cloud

---

## Executive Summary

ProcureFlow operates at **near-zero cost** ($0.25-0.50/month) thanks to aggressive free-tier optimization. Current spend is **99% within free quotas** (GitHub Actions, Cloud Run, Secret Manager) with only Artifact Registry incurring cost.

**Current Monthly Cost**: **$0.25-0.50 USD**

- GitHub Actions: $0 (within 2,000 min free tier)
- GCP Cloud Run: $0 (scales to zero, within free tier)
- GCP Secret Manager: $0 (3 secrets, within 6 free)
- GCP Artifact Registry: ~$0.25 (only paid service)
- Pulumi Cloud: $0 (free tier, <5,000 resources)

**Projected with Improvements**: **$0.15-0.30 USD/month** (-40% reduction)

- GitHub Actions: $0 (improved caching reduces minutes by 50%)
- GCP: $0.15-0.25 (image cleanup, optimized Docker layers)

---

## Cost Breakdown by Service

### 1. GitHub Actions

#### Current Usage

| Resource                | Usage/Month | Free Tier | Overage Cost  | Current Cost |
| ----------------------- | ----------- | --------- | ------------- | ------------ |
| **Workflow minutes**    | ~500 min    | 2,000 min | $0.008/min    | **$0.00** ✅ |
| **Storage (artifacts)** | <1 GB       | 500 MB    | $0.008/GB/day | **$0.00** ✅ |
| **Storage (cache)**     | ~2 GB       | 10 GB     | $0.008/GB/day | **$0.00** ✅ |

**Breakdown**:

- CI workflow (`ci.yml`): 7 min × 20 runs/month = 140 min
- Deploy workflow (`deploy-gcp.yml`): 15 min × 10 deploys/month = 150 min
- PR workflows: 7 min × 30 PRs/month = 210 min
- **Total**: ~500 min/month (25% of free tier)

#### Projected Usage (After Improvements)

| Improvement          | Time Saved     | New Usage          | Cost Impact     |
| -------------------- | -------------- | ------------------ | --------------- |
| Docker layer cache   | -3-5 min/build | -50 min/month      | $0 (still free) |
| Skip redundant tests | -4 min/deploy  | -40 min/month      | $0 (still free) |
| Parallel CI jobs     | -1-2 min/run   | -40 min/month      | $0 (still free) |
| **Total Savings**    | **-50%**       | **~250 min/month** | **$0**          |

**Recommendation**: Set spending limit to prevent accidental overage

```yaml
# GitHub Organization Settings → Billing
Spending limit: $20/month
Email alerts: 50%, 75%, 90%
```

---

### 2. Google Cloud Platform

#### Cloud Run

**Service**: `procureflow-web`  
**Region**: `us-central1`  
**Pricing**: Pay-per-use with generous free tier

**Free Tier** (Always Free):

- 2,000,000 requests/month
- 360,000 GB-seconds memory/month
- 180,000 vCPU-seconds/month
- 1 GB network egress/month (North America)

**Current Usage** (Estimated):

- Requests: ~5,000/month (0.25% of free tier)
- Memory: 512 MiB × 5 min/day × 30 days = ~38,400 GB-seconds (10% of free tier)
- vCPU: 1 vCPU × 5 min/day × 30 days = ~2,500 vCPU-seconds (1.4% of free tier)
- Egress: <100 MB/month (10% of free tier)

**Cost**: **$0.00** ✅ (within free tier)

**Projected Usage** (Production traffic):

- 100,000 requests/month → Still $0 (5% of free tier)
- 10× traffic → Still $0 (within free tier)
- Only exceeds free tier at ~500,000 requests/month

**Cost at Scale** (if exceeded):

- Additional requests: $0.40/million ($0.00 for 500k)
- Additional memory: $0.0000025/GB-second ($0.00 for 100k GB-sec)
- Additional vCPU: $0.00002400/vCPU-second ($0.00 for 10k vCPU-sec)

**Optimization Opportunities**:

- ✅ Already scales to zero (minScale: 0)
- ✅ CPU throttling enabled when idle
- ✅ Memory limit appropriate (512 MiB)
- No further optimization needed

---

#### Secret Manager

**Secrets**: 3 (nextauth-secret, openai-api-key, mongodb-uri)  
**Versions**: 3 active (1 per secret)

**Free Tier**:

- First 6 secret versions: Free
- First 10,000 access operations/month: Free

**Current Usage**:

- Secret versions: 3 (50% of free tier)
- Access operations: ~5,000/month (50% of free tier)
  - Cloud Run startup: 3 secrets × 10 instances/month = 30 accesses
  - Health checks: Not counted (cached in instance)

**Cost**: **$0.00** ✅ (within free tier)

**Paid Pricing** (if exceeded):

- Additional secrets: $0.06/secret/month
- Additional access: $0.03/10,000 operations

**Recommendation**: Stay within 6 secrets (3 slots remaining for future use)

---

#### Artifact Registry

**Repository**: `procureflow`  
**Region**: `us-central1`  
**Format**: Docker

**Pricing**:

- Storage: $0.10/GB/month
- Egress: $0.12/GB (same region: free)
- No per-image or per-pull charges

**Current Usage**:

- Images: ~15 (1 per commit over 2 months)
- Avg image size: 225 MB
- Total storage: 15 × 0.225 GB = **3.375 GB**

**Current Cost**: **$0.34/month** (3.375 GB × $0.10)

**Projected with Retention Policy**:

- Keep last 10 images (30-day retention)
- Storage: 10 × 0.225 GB = 2.25 GB
- **Projected Cost**: **$0.23/month** (-$0.11, -32%)

**Optimization**:

1. **Add cleanup policy**:

   ```typescript
   cleanupPolicies: [
     {
       id: 'keep-30-days',
       action: 'DELETE',
       condition: { olderThan: '30d', tagState: 'UNTAGGED' },
     },
   ];
   ```

2. **Optimize image size** (target: 150-180 MB):
   - Remove dev dependencies in production stage
   - Use `.dockerignore` to exclude unnecessary files
   - Multi-stage copy only required artifacts
   - **Potential savings**: 45 MB/image → 10 × 0.180 GB = 1.8 GB → $0.18/month (-$0.05)

**Total GAR Savings**: **-$0.16/month** (-47%)

---

#### Compute Engine (Minimal)

**Usage**: None (no VMs)

**Cost**: **$0.00** ✅

**Note**: Compute Engine API enabled for Cloud Run (no charges)

---

### 3. Pulumi Cloud

**Tier**: Free (Individual)  
**Limits**:

- 5,000 resources
- Unlimited stacks
- 100 state operations/day
- 1 organization member

**Current Usage**:

- Stacks: 1 (dev)
- Resources: 9 (0.18% of limit)
- State operations: ~20/day (20% of limit)

**Cost**: **$0.00** ✅ (within free tier)

**Paid Tiers** (future):

- Team: $50/month (5 members, 100k resources, policy packs)
- Enterprise: Custom pricing (SAML SSO, RBAC, audit logs)

**Recommendation**: Stay on free tier (plenty of headroom)

---

### 4. MongoDB Atlas

**Cluster**: M0 Free Tier (existing, not managed by Pulumi)  
**Region**: aws/us-east-1  
**Storage**: 512 MB

**Cost**: **$0.00** ✅ (Free Forever)

**Note**: Not part of CI/CD infrastructure, but used by application

---

## Total Cost Summary

### Current Monthly Costs

| Service               | Current Cost    | Free Tier Remaining         | Overage Risk |
| --------------------- | --------------- | --------------------------- | ------------ |
| GitHub Actions        | $0.00           | 1,500 min (75%)             | 🟢 Low       |
| GCP Cloud Run         | $0.00           | 1,995,000 requests (99.75%) | 🟢 Low       |
| GCP Secret Manager    | $0.00           | 3 secrets, 5,000 ops (50%)  | 🟢 Low       |
| GCP Artifact Registry | **$0.34**       | N/A (no free tier)          | 🟢 Low       |
| Pulumi Cloud          | $0.00           | 4,991 resources (99.82%)    | 🟢 Low       |
| **TOTAL**             | **$0.34/month** |                             |              |

### Projected Costs (After Optimizations)

| Optimization              | Current   | Projected      | Savings              |
| ------------------------- | --------- | -------------- | -------------------- |
| Artifact Registry cleanup | $0.34     | $0.23          | -$0.11 (-32%)        |
| Docker image optimization | $0.34     | $0.18          | -$0.16 (-47%)        |
| GitHub Actions caching    | $0.00     | $0.00          | $0.00 (time savings) |
| **TOTAL**                 | **$0.34** | **$0.18-0.23** | **-$0.11-0.16**      |

---

## Cost Monitoring and Alerts

### 1. GitHub Actions Spending Limits

**Setup**:

1. Navigate to: Organization Settings → Billing → Spending limits
2. Set monthly cap: $20
3. Enable alerts:
   - 50% threshold ($10): Warning email
   - 75% threshold ($15): Alert email
   - 90% threshold ($18): Urgent email

**Acceptance Criteria**:

- [ ] Spending limit configured
- [ ] Alert recipients added
- [ ] Test alert triggered (set low limit temporarily)

---

### 2. GCP Budget Alerts

**Implementation via Pulumi**:

```typescript
const budget = new gcp.billing.Budget('procureflow-monthly-budget', {
  billingAccount: billingAccountId, // From GCP Console
  displayName: 'ProcureFlow Monthly Budget',

  amount: {
    specifiedAmount: { units: '10' }, // $10/month cap
  },

  thresholdRules: [
    { thresholdPercent: 0.5, spendBasis: 'CURRENT_SPEND' }, // $5: 50%
    { thresholdPercent: 0.75, spendBasis: 'CURRENT_SPEND' }, // $7.50: 75%
    { thresholdPercent: 0.9, spendBasis: 'CURRENT_SPEND' }, // $9: 90%
    { thresholdPercent: 1.0, spendBasis: 'CURRENT_SPEND' }, // $10: 100%
  ],

  allUpdatesRule: {
    pubsubTopic: notificationTopic.id, // For Slack/email integration
    schemaVersion: '1.0',
  },
});
```

**Notification Setup**:

```typescript
// Create Pub/Sub topic for budget alerts
const notificationTopic = new gcp.pubsub.Topic('budget-alerts', {
  name: 'budget-alerts',
});

// Subscribe via email (or Cloud Function → Slack)
const subscription = new gcp.pubsub.Subscription('budget-alerts-email', {
  topic: notificationTopic.id,
  pushConfig: {
    pushEndpoint: 'https://YOUR_CLOUD_FUNCTION_URL', // Send to Slack
  },
});
```

**Acceptance Criteria**:

- [ ] Budget created in GCP Billing
- [ ] Pub/Sub topic configured
- [ ] Alert notifications sent to team (email/Slack)
- [ ] Test alert triggered (set $1 budget temporarily)

---

### 3. Artifact Registry Storage Monitoring

**Setup via Cloud Console**:

1. Navigate to: Cloud Monitoring → Metrics Explorer
2. Create alert:
   - **Metric**: `artifactregistry.googleapis.com/repository/storage/size`
   - **Condition**: `> 5 GB` (alert threshold)
   - **Notification**: Email or Pub/Sub

**Acceptance Criteria**:

- [ ] Monitoring dashboard created
- [ ] Alert triggers at 5 GB threshold
- [ ] Team receives alert notification

---

## Cost Optimization Roadmap

### Quick Wins (0-1h)

1. **Add Artifact Registry cleanup policy** (30 min)
   - Effort: Add to Pulumi stack
   - Savings: -$0.11/month
   - Risk: Low (only deletes untagged images >30 days)

2. **Set GitHub Actions spending limit** (10 min)
   - Effort: Configure in GitHub UI
   - Savings: $0 (prevents accidental overage)
   - Risk: None

3. **Set up GCP budget alerts** (1h)
   - Effort: Add to Pulumi stack
   - Savings: $0 (monitoring only)
   - Risk: None

### Medium Term (2-3h)

4. **Optimize Docker image size** (2h)
   - Effort: Update Dockerfile, test
   - Savings: -$0.05/month
   - Risk: Medium (requires testing)

5. **Implement Docker layer caching** (30 min)
   - Effort: Update workflow
   - Savings: -50% GitHub Actions minutes (time, not cost)
   - Risk: Low

### Long Term (Later)

6. **Multi-region failover** (cost increase)
   - Adds: +$5-10/month (Cloud Run in 2nd region)
   - Benefit: High availability
   - Decision: Not needed for MVP

7. **Upgrade Pulumi to Team tier** (cost increase)
   - Adds: +$50/month
   - Benefit: Multiple team members, policy packs
   - Decision: Wait until team grows

---

## Free Tier Monitoring

### GitHub Actions

**Limits**:

- 2,000 minutes/month (ubuntu runners)
- 500 MB artifact storage
- 10 GB cache storage

**Current**: 500 min (25%), <1 GB storage

**Headroom**: 1,500 min (75%), sufficient for 3x traffic

**Alert Threshold**: 1,500 min (75% used)

---

### GCP Cloud Run

**Limits** (Always Free):

- 2,000,000 requests/month
- 360,000 GB-seconds/month
- 180,000 vCPU-seconds/month

**Current**: 5,000 requests (0.25%), 38,400 GB-sec (10%), 2,500 vCPU-sec (1.4%)

**Headroom**: 400× current traffic

**Alert Threshold**: 1,000,000 requests (50% of free tier)

---

### GCP Secret Manager

**Limits** (Free):

- 6 secret versions
- 10,000 access operations/month

**Current**: 3 secrets (50%), 5,000 ops (50%)

**Headroom**: 3 secrets, 5,000 ops

**Alert Threshold**: 5 secrets (83% used)

---

## Cost Attribution

### By Feature

| Feature                  | Service           | Cost  | Notes             |
| ------------------------ | ----------------- | ----- | ----------------- |
| **CI Pipeline**          | GitHub Actions    | $0.00 | Lint, test, build |
| **Artifact Storage**     | Artifact Registry | $0.34 | Docker images     |
| **Application Runtime**  | Cloud Run         | $0.00 | Web server        |
| **Secrets**              | Secret Manager    | $0.00 | App secrets       |
| **Infrastructure State** | Pulumi Cloud      | $0.00 | IaC state         |

### By Environment

| Environment     | Cost  | Notes             |
| --------------- | ----- | ----------------- |
| **Development** | $0.34 | All current usage |
| **Staging**     | $0.00 | Not created yet   |
| **Production**  | $0.00 | Not created yet   |

**Projection with 3 environments**:

- Dev: $0.18 (optimized)
- Staging: $0.18 (same usage)
- Prod: $0.25 (higher traffic, more images)
- **Total**: $0.61/month (+79%)

---

## Recommendations

### Immediate Actions

1. ✅ **Add Artifact Registry cleanup policy** (saves $0.11/month)
2. ✅ **Set GitHub Actions spending limit** (prevents overage)
3. ✅ **Configure GCP budget alerts** (visibility)

### Within 1 Month

4. ✅ **Optimize Docker image size** (saves $0.05/month)
5. ✅ **Implement build caching** (reduces time, not cost)
6. ✅ **Monitor free tier usage** (stay within limits)

### Long Term

7. ⬜ **Separate staging/prod projects** (cost attribution)
8. ⬜ **Upgrade Pulumi if team grows** (Team tier: $50/month)
9. ⬜ **Consider CDN for docs** (if traffic scales significantly)

---

## Cost Comparison

### Baseline vs. Target

| Metric                     | Baseline      | Target        | Achievement |
| -------------------------- | ------------- | ------------- | ----------- |
| **Monthly Cost**           | $0.34         | $0.18-0.23    | -40%        |
| **GitHub Actions Minutes** | 500 min       | 250 min       | -50%        |
| **Artifact Storage**       | 3.4 GB        | 1.8-2.3 GB    | -30-47%     |
| **Deploy Time**            | 15 min        | 6-8 min       | -50% (time) |
| **Free Tier Usage**        | 25% (Actions) | 12% (Actions) | -50%        |

### Industry Benchmarks

| Project Size | Typical CI/CD Cost | ProcureFlow |
| ------------ | ------------------ | ----------- |
| **Hobby**    | $0-5/month         | $0.34 ✅    |
| **Startup**  | $50-200/month      | $0.34 ✅    |
| **SMB**      | $500-2000/month    | $0.34 ✅    |

**Status**: ProcureFlow operates at **99% below** typical startup costs

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-13  
**Next Review**: Monthly (track actual vs. projected)  
**Owner**: Finance/DevOps Team
