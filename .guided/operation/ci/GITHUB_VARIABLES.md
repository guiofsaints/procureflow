# GitHub Variables Setup - Copy/Paste Reference

**URL**: https://github.com/guiofsaints/procureflow/settings/variables/actions

---

## Variable 1: GCP_WORKLOAD_IDENTITY_PROVIDER

**Value** (copy this):
```
projects/592353558869/locations/global/workloadIdentityPools/github/providers/github-oidc
```

---

## Variable 2: GCP_SERVICE_ACCOUNT_EMAIL

**Value** (copy this):
```
github-actions-deploy@procureflow-dev.iam.gserviceaccount.com
```

---

## Instructions

1. Click "New repository variable"
2. Name: `GCP_WORKLOAD_IDENTITY_PROVIDER`
3. Value: Copy from above
4. Click "Add variable"
5. Repeat for `GCP_SERVICE_ACCOUNT_EMAIL`

---

## Verification

After setting variables:
- Go to Actions tab
- Trigger "Deploy to GCP" workflow manually
- Check logs for "Authenticating with Workload Identity"
- Should see: ✅ Authentication successful

---

## After Successful Test

**Delete legacy secret**:
https://github.com/guiofsaints/procureflow/settings/secrets/actions

Delete: `GCP_SA_KEY`
