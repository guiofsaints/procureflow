# GCP Cost Alert Setup Instructions

**Project**: procureflow-dev  
**Current Spend**: $0.30/month  
**Recommended Alert**: $5/month (10x current spend)

---

## Quick Setup (5 minutes via GCP Console)

### Step 1: Navigate to Billing

1. Open https://console.cloud.google.com/billing
2. Select billing account for `procureflow-dev`
3. Click **Budgets & alerts** in left sidebar

---

### Step 2: Create Budget

Click **CREATE BUDGET** and fill:

**Budget name**: `procureflow-dev-monthly-budget`

**Projects**: Select `procureflow-dev`

**Budget type**: `Specified amount`

**Target amount**: `$5.00` USD per month

---

### Step 3: Set Alert Thresholds

Configure 3 alert rules:

| Threshold | Amount | Action             |
| --------- | ------ | ------------------ |
| 50%       | $2.50  | Email notification |
| 90%       | $4.50  | Email notification |
| 100%      | $5.00  | Email notification |

**Alert recipients**: Add your email address

**Optional**: Connect to Pub/Sub topic for automation (not needed for now)

---

### Step 4: Review & Create

Click **FINISH** to create budget.

**Expected result**:

- You'll receive email confirmation
- Alerts will trigger if monthly costs exceed thresholds
- Dashboard will show budget status

---

## Alternative: CLI Setup (Advanced)

```bash
# Create budget via gcloud CLI
gcloud billing budgets create \
  --billing-account=$(gcloud billing accounts list --format='value(name)' --limit=1) \
  --display-name="procureflow-dev-monthly-budget" \
  --budget-amount=5.00 \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.9 \
  --threshold-rule=percent=1.0
```

**Note**: Requires `billing.budgets.create` permission.

---

## Why $5/month?

**Current costs**: $0.30/month (Artifact Registry only)

**Free tier coverage**: 99%

- Cloud Run: $0 (within free tier)
- Secret Manager: $0 (within free tier)
- MongoDB Atlas: $0 (M0 free cluster, external)

**$5 threshold reasoning**:

- 10x current spend = early warning
- Still extremely low cost
- Catches accidental resource creation
- Won't trigger false alarms

**When to increase**: If legitimate costs grow beyond $3-4/month consistently.

---

## Monitoring Your Budget

**Check status**: https://console.cloud.google.com/billing/budgets

**View current spend**:

```bash
gcloud billing accounts list
```

Then navigate to Reports in Console for detailed breakdown.

---

## What Triggers Alerts?

**Potential causes of cost increase**:

1. Cloud Run exceeding free tier (2M requests/month)
2. Artifact Registry storage growth (>0.5GB)
3. Secret Manager exceeding free tier (10k accesses/month)
4. Accidentally created resources (Compute Engine, Load Balancers, etc.)
5. Egress bandwidth charges (data transfer out of GCP)

**Most likely**: Accidentally leaving a Compute Engine VM running would cost ~$5-10/day.

---

## Cost Alert Actions

**If you receive 50% alert ($2.50)**:

1. Check GCP Console → Billing → Reports
2. Identify which service increased
3. Verify it's expected (e.g., increased traffic)
4. Investigate if unexpected

**If you receive 100% alert ($5.00)**:

1. Immediately check Console for unexpected resources
2. Stop/delete any accidental VMs or resources
3. Review Cloud Run logs for traffic spikes
4. Consider increasing budget if growth is legitimate

---

## Setup Verification

After creating budget, verify:

```bash
# List all budgets
gcloud billing budgets list \
  --billing-account=$(gcloud billing accounts list --format='value(name)' --limit=1)
```

Expected output:

```
BUDGET_NAME                      AMOUNT
procureflow-dev-monthly-budget   5.00
```

---

**Setup Guide Maintained By**: GitHub Copilot AI Agent  
**Last Updated**: 2025-11-11  
**Estimated Setup Time**: 5 minutes
