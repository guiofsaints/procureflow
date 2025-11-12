# Pulumi Infrastructure Action Plan (Simplified)

**Project**: procureflow-gcp  
**Planning Date**: 2025-11-11  
**Philosophy**: Keep it simple, focus on high-value improvements only

---

## Executive Summary

**Current Score**: 67/100 (Grade C)  
**Target Score**: 82/100 (Grade B) - Realistic without over-engineering  
**Timeline**: 2 weeks  
**Total Effort**: 8 hours  
**Risk**: Very low (minimal changes)

**Key Principle**: Bootstrap project - business logic is priority, not infrastructure perfection.

---

## Phase 1: Essential Improvements Only (Week 1)

**Goal**: Fix critical issues without adding complexity  
**Effort**: 2 hours  
**Score Improvement**: +8 points (67 → 75)

---

### Task 1: Clean Up Secrets (30 minutes)

**Priority**: 🔴 High  
**Problem**: `apply-pulumi-config.ps1` has hardcoded OPENAI_API_KEY in git history

**Solution (Simple)**:
1. Move `apply-pulumi-config.ps1` out of repo (to your local machine only)
2. Create `.gitignore` entry to prevent future accidents
3. Done - no need to rotate keys unless you suspect compromise

**Steps**:
```bash
# 1. Add to .gitignore
echo "apply-pulumi-config.ps1" >> .gitignore
echo "github-secrets-output.txt" >> .gitignore
echo "github-actions-key.json" >> .gitignore

# 2. Commit
git add .gitignore
git commit -m "chore: prevent secrets in version control"

# 3. Keep script locally, just don't commit it again
```

**Why not rotate keys?**
- Script is in private repo (low risk)
- Key is already in Pulumi config (encrypted)
- Rotating adds work without much security benefit for bootstrap project
- If repo goes public, THEN rotate

**Impact**: +3 points (Security awareness improved)

---

### Task 2: Remove Dead Code (45 minutes)

**Priority**: 🟡 Medium  
**Problem**: 118 lines of unused code (`mongodb-atlas.ts`) and 2 unused dependencies

**Solution**:
```bash
# 1. Delete unused file
rm mongodb-atlas.ts

# 2. Remove unused dependencies
pnpm remove @pulumi/mongodbatlas @pulumi/random

# 3. Commit
git add .
git commit -m "chore: remove unused MongoDB Atlas code and dependencies"
```

**Impact**: +2 points (Code cleanliness)

---

### Task 3: Add Cost Alert (15 minutes)

**Priority**: 🟢 Low  
**Problem**: No monitoring if costs spike

**Solution (GCP Console - easier than code)**:
1. Go to: https://console.cloud.google.com/billing
2. Navigate to Budgets & Alerts
3. Create budget: $5/month (10x current spend)
4. Set alert at 50% ($2.50) and 100% ($5)
5. Add your email

**Why not in Pulumi?**
- Billing API requires special permissions
- Console is 5 clicks vs 50 lines of code
- Same result, less complexity

**Impact**: +1 point (Cost monitoring)

---

### Task 4: Basic Runbook (30 minutes)

**Priority**: 🟡 Medium  
**Problem**: Tribal knowledge, no emergency guide

**Solution**: Create `docs/runbooks/pulumi-troubleshooting.md`

```markdown
# Pulumi Troubleshooting Runbook

## Quick Diagnostics

**Stack Health**:
```bash
pulumi stack
pulumi refresh --preview-only
```

**Deployment Failed**:
```bash
# 1. Check GCP quotas
gcloud compute project-info describe --project=procureflow-dev

# 2. Check Cloud Run logs
gcloud run logs tail procureflow-web --region=us-central1

# 3. Rollback if needed
pulumi stack export --version <previous> | pulumi stack import
```

**Secrets Not Working**:
```bash
# Verify secrets exist
gcloud secrets list

# Test secret access
gcloud secrets versions access latest --secret=nextauth-secret
```

**Cost Spike**:
```bash
# Check current bill
gcloud billing accounts list
# Then check console for breakdown
```

## Emergency Contacts

- **Primary**: [Your email]
- **GCP Console**: https://console.cloud.google.com
- **Pulumi Console**: https://app.pulumi.com

## Common Issues

**Issue**: `MongoServerSelectionError`  
**Fix**: Check MongoDB Atlas is running and network access list includes current IP

**Issue**: `NEXTAUTH_URL not set`  
**Fix**: Run: `gcloud run services update procureflow-web --update-env-vars="NEXTAUTH_URL=https://..."`

**Issue**: Build failing  
**Fix**: Check Artifact Registry for image, may need to rebuild: `pnpm docker:build && docker push ...`
```

**Impact**: +2 points (Reliability, DX)

---

## Phase 2: Optional Enhancements (Week 2)

**Goal**: Nice-to-haves, only if time permits  
**Effort**: 6 hours  
**Score Improvement**: +7 points (75 → 82)

---

### Task 5: Add Test Stack (3 hours)

**Priority**: 🟡 Medium  
**When**: Only when you're ready to test before production

**Solution**:
```bash
# 1. Create stack
pulumi stack init test

# 2. Configure (copy from dev, change project)
pulumi config set gcp:project procureflow-test
pulumi config set gcp:region us-central1
pulumi config set environment test

# 3. Copy secrets (manual)
pulumi config set --secret nextauth-secret "$(pulumi stack select dev && pulumi config get nextauth-secret --show-secrets)"
# ... repeat for other secrets

# 4. Deploy
pulumi up
```

**Why test stack?**
- Test changes before they hit dev
- Separate environment for staging
- Easy to destroy and recreate

**Impact**: +5 points (Environment separation)

---

### Task 6: Organize Folder Structure (2 hours)

**Priority**: 🟢 Low  
**When**: If team grows beyond 2 developers

**Current**:
```
gcp/
  ├── index.ts              # 18 files flat
  ├── cloudrun.ts
  ├── secrets.ts
  ├── mongodb-atlas.ts
  ├── ...
```

**Proposed**:
```
gcp/
  ├── project/
  │   ├── cloudrun.ts       # Resource definitions
  │   ├── secrets.ts
  │   └── outputs.ts
  ├── stacks/
  │   ├── dev.ts           # Stack-specific config
  │   └── test.ts
  ├── scripts/
  │   └── setup/           # Setup scripts
  └── docs/
      └── runbooks/
```

**Migration**:
```bash
# 1. Create structure
mkdir -p project stacks scripts/setup docs/runbooks

# 2. Move files
git mv cloudrun.ts secrets.ts project/
git mv apply-pulumi-config.ps1.template scripts/setup/

# 3. Update imports in index.ts
# Change: import { createCloudRunService } from "./cloudrun";
# To:     import { createCloudRunService } from "./project/cloudrun";

# 4. Test
pulumi preview  # Should show no changes

# 5. Commit
git commit -m "refactor: organize Pulumi project structure"
```

**Impact**: +2 points (Structure, DX)

---

## What We're NOT Doing (Intentionally)

❌ **Production Stack** - Not needed yet, dev is sufficient  
❌ **Drift Detection Automation** - Manual refresh is fine for bootstrap  
❌ **Policy-as-Code** - Over-engineering for current scale  
❌ **Multi-Region** - Single region is adequate  
❌ **PR Preview Environments** - Too complex for small team  
❌ **MongoDB Atlas in Pulumi** - Already working, don't fix what isn't broken  
❌ **Infracost Integration** - Costs are $0.30/month, not worth the setup  
❌ **Key Rotation Schedule** - Unnecessary for private bootstrap project  
❌ **Monitoring Dashboards** - Cloud Run default metrics sufficient  
❌ **Backup Automation** - State is in Pulumi Cloud (already backed up)

---

## Timeline

**Week 1** (2 hours):
- Day 1: Task 1 (secrets) + Task 2 (dead code) - 1.25 hours
- Day 2: Task 3 (cost alert) + Task 4 (runbook) - 0.75 hours
- **Checkpoint**: Score = 75/100 ✅

**Week 2** (6 hours) - OPTIONAL:
- Day 1-2: Task 5 (test stack) - 3 hours
- Day 3: Task 6 (folder structure) - 2 hours
- Day 4: Buffer for issues - 1 hour
- **Checkpoint**: Score = 82/100 ✅

---

## Cost Impact

**Current**: $0.30/month  
**After Phase 1**: $0.30/month (no change)  
**After Phase 2**: $0.60/month (if test stack created)  

**Annual Cost**: $3.60-$7.20/year (coffee money)

---

## Success Metrics

**Phase 1 Success Criteria**:
- ✅ No secrets in git
- ✅ No unused code/dependencies
- ✅ Cost alert configured
- ✅ Runbook exists

**Phase 2 Success Criteria** (optional):
- ✅ Test stack deployed and working
- ✅ Folder structure organized
- ✅ Team velocity unchanged or improved

---

## Rollback Plan

**If something breaks**:

```bash
# Rollback code
git revert <commit-hash>
git push origin main

# Rollback infrastructure
pulumi stack export --version <previous> | pulumi stack import
pulumi refresh
```

**Risk**: Very low - all changes are incremental and reversible

---

## Decision Matrix

**Do This If**:
- ✅ You have 2 hours this week
- ✅ You want cleaner code
- ✅ You want basic safeguards

**Skip This If**:
- ⏭️ Infrastructure is working fine
- ⏭️ Business logic is higher priority
- ⏭️ Team is < 2 developers

---

## Bottom Line

**Recommended Approach**: 
1. Do Phase 1 (2 hours) - low effort, high value
2. Skip Phase 2 until you actually need test stack or have 5+ developers

**Why?**
- Current setup works (67/100 is passing grade)
- Bootstrap project = business features matter more
- Perfect infrastructure score ≠ successful product
- Time is better spent on actual application

**Philosophy**: "Good enough" infrastructure that doesn't get in the way > "Perfect" infrastructure that took 2 weeks to build.

---

**Action Plan Maintained By**: GitHub Copilot AI Agent  
**Philosophy**: Simplicity, pragmatism, business value first  
**Last Updated**: 2025-11-11
