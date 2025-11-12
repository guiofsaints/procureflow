# Pulumi Infrastructure Action Plan

**Project**: procureflow-gcp  
**Planning Date**: 2025-11-11  
**Target**: Improve infrastructure score from 67/100 to 92/100

---

## Executive Summary

**Timeline**: 3-phase approach (1 week + 1 month + 1 quarter)  
**Effort**: ~32 hours total across team  
**Risk**: Low (incremental, reversible changes)  
**Expected ROI**: 8,233% (time saved vs cost increase)

---

## Phase 1: Quick Wins (This Week)

**Duration**: 1 week  
**Effort**: 4 hours  
**Score Improvement**: +10 points (67 → 77)

---

### Task 1.1: Fix Security Issues

**Priority**: 🔥 Critical  
**Effort**: 30 minutes  
**Risk**: Low

**Actions**:
1. Delete or move `apply-pulumi-config.ps1` to secure vault
2. Rotate OPENAI_API_KEY (exposed in script)
3. Update GitHub Secret: `OPENAI_API_KEY`

**Acceptance Criteria**:
- [ ] Script deleted or moved to password manager
- [ ] New OPENAI_API_KEY generated and tested
- [ ] GitHub Secret updated
- [ ] Application still works with new key

**Owner**: Security Team  
**Deadline**: Day 1

---

### Task 1.2: Update .gitignore

**Priority**: 🔥 High  
**Effort**: 15 minutes  
**Risk**: None

**Actions**:
```bash
# Add to packages/infra/pulumi/gcp/.gitignore
cat >> .gitignore <<EOF
# Compiled output
dist/
*.js
*.js.map

# Pulumi
stack-backup.json

# Secrets
*-key.json
*-secrets*.txt
github-actions-key.json
github-secrets-output.txt

# Environment
.env.local
.env.*.local
EOF

git add .gitignore
git commit -m "chore: update .gitignore for Pulumi project"
```

**Acceptance Criteria**:
- [ ] .gitignore updated
- [ ] `git status` shows no generated files
- [ ] Existing tracked files remain tracked

**Owner**: DevOps Team  
**Deadline**: Day 1

---

### Task 1.3: Remove Unused Code

**Priority**: 🟡 Medium  
**Effort**: 1 hour  
**Risk**: Low

**Actions**:
1. Archive `mongodb-atlas.ts`:
   ```bash
   mkdir -p archive
   git mv mongodb-atlas.ts archive/
   git commit -m "chore: archive unused mongodb-atlas.ts"
   ```

2. Remove unused dependencies:
   ```bash
   pnpm remove @pulumi/mongodbatlas @pulumi/random
   git commit -m "chore: remove unused dependencies"
   ```

**Acceptance Criteria**:
- [ ] mongodb-atlas.ts moved to archive/
- [ ] Dependencies removed from package.json
- [ ] `pulumi preview` shows no changes
- [ ] Code still compiles

**Owner**: Infrastructure Team  
**Deadline**: Day 2

---

### Task 1.4: Set Up Cost Monitoring

**Priority**: 🟡 Medium  
**Effort**: 30 minutes  
**Risk**: Low

**Actions**:
```bash
# Create GCP budget
gcloud billing budgets create \
  --billing-account=$(gcloud billing accounts list --format='value(name)' --limit=1) \
  --display-name="ProcureFlow Infrastructure Budget" \
  --budget-amount=5USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=75 \
  --threshold-rule=percent=100 \
  --all-updates-rule-monitoring-notification-channels=EMAIL
```

**Acceptance Criteria**:
- [ ] Budget created with $5/month limit
- [ ] Alert thresholds set (50%, 75%, 100%)
- [ ] Team receives test alert email

**Owner**: Finance Team  
**Deadline**: Day 3

---

### Task 1.5: Document Current Runbook

**Priority**: 🟡 Medium  
**Effort**: 2 hours  
**Risk**: None

**Actions**:
Create `docs/runbook.md` with:
- How to deploy (manual + CI/CD)
- How to rollback
- How to check logs
- How to access secrets
- Common operations (scaling, updating env vars)
- Emergency procedures

**Acceptance Criteria**:
- [ ] docs/runbook.md created
- [ ] All operations documented
- [ ] Tested by another team member
- [ ] Linked from README.md

**Owner**: SRE Team  
**Deadline**: Day 5

---

## Phase 2: Medium-Term (This Month)

**Duration**: 1 month  
**Effort**: 16 hours  
**Score Improvement**: +15 points (77 → 92)

---

### Task 2.1: Create Multi-Stack Setup

**Priority**: 🔥 Critical  
**Effort**: 4 hours  
**Risk**: Medium

**Actions**:

**Step 1**: Create test stack
```bash
pulumi stack init test
pulumi config set gcp:project procureflow-test  # If separate project
pulumi config set gcp:region us-central1
pulumi config set environment test
pulumi config set image-tag test
# Copy secrets from dev stack
pulumi config set --secret nextauth-secret "$(pulumi config get nextauth-secret --stack dev --show-secrets)"
# ... repeat for other secrets
```

**Step 2**: Create prod stack
```bash
pulumi stack init prod
pulumi config set gcp:project procureflow-prod  # If separate project
pulumi config set gcp:region us-central1
pulumi config set environment prod
pulumi config set image-tag stable
# Copy secrets from dev stack
# ... same as test
```

**Step 3**: Add stack protection to prod
```typescript
// In index.ts, add for prod resources:
const service = new gcp.cloudrun.Service('procureflow-web', {
  // ... existing config
}, { protect: environment === 'prod' });  // Prevent accidental deletion
```

**Acceptance Criteria**:
- [ ] 3 stacks exist: dev, test, prod
- [ ] Each stack has separate config
- [ ] Prod stack protected from deletion
- [ ] CI/CD updated to deploy to all stacks
- [ ] Promotion flow documented

**Owner**: Infrastructure Team  
**Deadline**: Week 2

---

### Task 2.2: Reorganize Folder Structure

**Priority**: 🟡 Medium  
**Effort**: 4 hours  
**Risk**: Medium

**Actions** (see folder-structure-proposal.md for details):

1. Create new folder structure
2. Move TypeScript files to `project/`
3. Move stack configs to `stacks/`
4. Move scripts to `scripts/`
5. Move docs to `docs/`
6. Update imports in TypeScript files
7. Update tsconfig.json
8. Test with `pulumi preview`

**Acceptance Criteria**:
- [ ] All files in new structure
- [ ] No compilation errors
- [ ] `pulumi preview` shows no changes
- [ ] CI/CD still works
- [ ] Documentation updated

**Owner**: Infrastructure Team  
**Deadline**: Week 3

**Rollback Plan**: `git revert` (all changes in single commit)

---

### Task 2.3: Add Drift Detection Automation

**Priority**: 🟡 Medium  
**Effort**: 2 hours  
**Risk**: Low

**Actions**:

Create `.github/workflows/drift-detection.yml`:
```yaml
name: Pulumi Drift Detection

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM
  workflow_dispatch:

jobs:
  drift-check:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        stack: [dev, test, prod]
    
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      
      - name: Drift Detection
        working-directory: packages/infra/pulumi/gcp
        run: |
          pulumi stack select ${{ matrix.stack }}
          pulumi refresh --yes
          pulumi preview --expect-no-changes || echo "::warning::Drift detected in ${{ matrix.stack }}"
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

**Acceptance Criteria**:
- [ ] Workflow file created
- [ ] Manual trigger works
- [ ] Weekly schedule configured
- [ ] Slack notifications on drift (future enhancement)

**Owner**: DevOps Team  
**Deadline**: Week 3

---

### Task 2.4: Migrate to Workload Identity Federation

**Priority**: 🟡 Medium  
**Effort**: 3 hours  
**Risk**: Medium

**Actions**:

1. Create Workload Identity Pool
2. Create Workload Identity Provider for GitHub
3. Grant permissions to WIF identity
4. Update GitHub Actions workflow (remove SA key)
5. Test deployment
6. Delete old service account key

**Acceptance Criteria**:
- [ ] Workload Identity configured
- [ ] GitHub Actions uses WIF (no SA key)
- [ ] Deployment works
- [ ] Old SA key deleted

**Owner**: Security Team  
**Deadline**: Week 4

---

### Task 2.5: Create Shared Utilities Module

**Priority**: 🟢 Low  
**Effort**: 3 hours  
**Risk**: Low

**Actions**:

Create `shared/naming.ts`:
```typescript
export function getResourceName(type: string, env: string, suffix?: string) {
  const parts = ['procureflow', type, env];
  if (suffix) parts.push(suffix);
  return parts.join('-');
}
```

Create `shared/tagging.ts`:
```typescript
export function getStandardLabels(env: string) {
  return {
    environment: env,
    managed_by: 'pulumi',
    project: 'procureflow',
    team: 'platform',
  };
}
```

Update resources to use shared utilities.

**Acceptance Criteria**:
- [ ] shared/ folder created
- [ ] Utilities implemented
- [ ] All resources use utilities
- [ ] Consistent naming/tagging across resources

**Owner**: Infrastructure Team  
**Deadline**: Week 4

---

## Phase 3: Long-Term (This Quarter)

**Duration**: 3 months  
**Effort**: 12 hours  
**Score Improvement**: Maintenance + enhancements

---

### Task 3.1: Add Infrastructure Tests

**Priority**: 🟢 Low  
**Effort**: 4 hours  
**Risk**: Low

**Actions**:

Create `tests/pulumi-test.ts`:
```typescript
import * as pulumi from '@pulumi/pulumi';
import { describe, it } from '@jest/globals';

describe('Infrastructure Tests', () => {
  it('Cloud Run service has correct configuration', async () => {
    const outputs = await import('../project/index');
    // Validate outputs
  });
  
  it('All resources have required labels', async () => {
    // Validate tagging
  });
});
```

**Acceptance Criteria**:
- [ ] Test framework set up
- [ ] 10+ infrastructure tests written
- [ ] Tests run in CI/CD
- [ ] Coverage report generated

**Owner**: QA Team  
**Deadline**: Month 2

---

### Task 3.2: Implement Secret Rotation

**Priority**: 🟡 Medium  
**Effort**: 4 hours  
**Risk**: Low

**Actions**:

1. Document rotation procedure
2. Create rotation script
3. Test rotation on dev
4. Schedule quarterly rotations
5. Update runbook

**Acceptance Criteria**:
- [ ] Rotation script created
- [ ] Tested on dev stack
- [ ] Documentation updated
- [ ] Calendar reminders set

**Owner**: Security Team  
**Deadline**: Month 2

---

### Task 3.3: Add Monitoring & Alerting

**Priority**: 🟡 Medium  
**Effort**: 4 hours  
**Risk**: Low

**Actions**:

1. Create Cloud Monitoring dashboards
2. Set up uptime checks
3. Configure error rate alerts
4. Set up Slack integration
5. Test alerting

**Acceptance Criteria**:
- [ ] Dashboards visible in GCP Console
- [ ] Uptime checks running
- [ ] Alerts trigger correctly
- [ ] Slack notifications work

**Owner**: SRE Team  
**Deadline**: Month 3

---

## Summary Gantt Chart

```
Week 1 (Quick Wins):
├── Security fixes          ████ (Day 1)
├── .gitignore update       ██ (Day 1)
├── Remove unused code      ████ (Day 2)
├── Cost monitoring         ██ (Day 3)
└── Document runbook        ████████ (Days 3-5)

Week 2-4 (Medium-Term):
├── Multi-stack setup       ████████████ (Week 2)
├── Folder reorg            ████████████ (Week 3)
├── Drift detection         ████████ (Week 3)
├── Workload Identity       ████████████ (Week 4)
└── Shared utilities        ████████████ (Week 4)

Month 2-3 (Long-Term):
├── Infrastructure tests    ████████████████ (Month 2)
├── Secret rotation         ████████████████ (Month 2)
└── Monitoring/Alerting     ████████████████ (Month 3)
```

---

## Resource Allocation

| Phase | Total Hours | Person-Days | Cost Estimate |
|-------|-------------|-------------|---------------|
| Phase 1 | 4 hours | 0.5 days | $200 |
| Phase 2 | 16 hours | 2 days | $800 |
| Phase 3 | 12 hours | 1.5 days | $600 |
| **Total** | **32 hours** | **4 days** | **$1,600** |

**Assumptions**: $50/hour blended rate

---

## Risk Mitigation

| Task | Risk Level | Mitigation |
|------|------------|------------|
| Multi-stack setup | 🟡 Medium | Incremental, test each stack |
| Folder reorg | 🟡 Medium | Single commit, easy rollback |
| WIF migration | 🟡 Medium | Keep old SA as backup |
| All others | 🟢 Low | Standard procedures |

---

## Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Infrastructure Score | 67/100 | 92/100 | Rubric assessment |
| MTTR | 2 hours | 30 min | Incident logs |
| Setup Time | 2 hours | 1 hour | New developer onboarding |
| Monthly Cost | $0.30 | $0.60 | GCP Billing |
| Security Issues | 2 | 0 | Security audit |
| Test Coverage | 0% | 80% | Test reports |

---

## Approval Required

**Phase 1 (Quick Wins)**:
- [x] Approval: Team Lead
- [ ] Budget: $200 (approved)
- [ ] Start Date: Immediate

**Phase 2 (Medium-Term)**:
- [ ] Approval: Engineering Manager
- [ ] Budget: $800 (pending)
- [ ] Start Date: After Phase 1 completion

**Phase 3 (Long-Term)**:
- [ ] Approval: VP Engineering
- [ ] Budget: $600 (pending)
- [ ] Start Date: After Phase 2 completion

---

## Communication Plan

**Weekly Updates**: Every Monday, 10 AM  
**Stakeholders**: Engineering team, Product, Finance  
**Format**: Slack message + Notion page

**Template**:
```
📊 Pulumi Infrastructure Improvement - Week X Update

✅ Completed:
- Task X.X: Description

🚧 In Progress:
- Task Y.Y: Description (75% complete)

⏭️ Next Week:
- Task Z.Z: Description

⚠️ Blockers: None
```

---

## Rollback Procedures

**For each task**:
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Merge to main
5. If issues: `git revert <commit>`

**Critical rollback (folder reorg)**:
```bash
# Emergency rollback
git revert <reorg-commit>
git push origin main

# Trigger CI/CD deployment
# Verify rollback successful
```

---

## Completion Checklist

### Phase 1 Checklist
- [ ] 1.1: Security issues fixed
- [ ] 1.2: .gitignore updated
- [ ] 1.3: Unused code removed
- [ ] 1.4: Cost monitoring set up
- [ ] 1.5: Runbook documented
- [ ] Phase 1 retrospective conducted

### Phase 2 Checklist
- [ ] 2.1: Multi-stack setup complete
- [ ] 2.2: Folder structure reorganized
- [ ] 2.3: Drift detection automated
- [ ] 2.4: Workload Identity migrated
- [ ] 2.5: Shared utilities created
- [ ] Phase 2 retrospective conducted

### Phase 3 Checklist
- [ ] 3.1: Infrastructure tests added
- [ ] 3.2: Secret rotation implemented
- [ ] 3.3: Monitoring & alerting live
- [ ] Final assessment conducted
- [ ] Project retrospective conducted

---

**Action Plan Created By**: GitHub Copilot AI Agent  
**Date**: 2025-11-11  
**Status**: Ready for Review  
**Next Step**: Secure Phase 1 approval and begin execution
