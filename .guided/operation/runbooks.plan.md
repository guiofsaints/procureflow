# Runbooks Plan

**Executive Summary**: ProcureFlow operational runbooks provide step-by-step procedures for common development and operations tasks. Five core runbooks cover local development setup (clone → install → Docker → seed → dev server), build and deploy (GitHub Actions workflow or manual Pulumi), rollback execution (Cloud Run traffic split or Pulumi state revert), autoscaling monitoring (Cloud Run metrics, instance count, concurrency, cost alerts), and troubleshooting (diagnostic procedures for 10 common failures). Each runbook includes prerequisites, execution steps with shell commands, verification steps, and escalation paths. Runbooks owned by Platform Team, reviewed quarterly, and updated per release.

---

## Table of Contents

- [Runbook Inventory](#runbook-inventory)
- [Runbook Format](#runbook-format)
- [Ownership and Maintenance](#ownership-and-maintenance)
- [Assumptions and Limitations](#assumptions-and-limitations)
- [References](#references)

---

## Runbook Inventory

### Available Runbooks

| Runbook | Purpose | Frequency | Audience | Complexity | Status |
|---------|---------|-----------|----------|------------|--------|
| **[Local Development](./runbooks/local-dev.md)** | Set up local development environment with Docker Compose | Daily (new developers) | Developers | 🟢 Low | ✅ Available |
| **[Build and Deploy](./runbooks/build-and-deploy.md)** | Execute deployment to GCP Cloud Run (dev/staging/prod) | Weekly (releases) | Platform Engineers | 🟡 Medium | ✅ Available |
| **[Rollback](./runbooks/rollback.md)** | Rollback failed deployment using Cloud Run or Pulumi | As-needed (incidents) | Platform Engineers, On-Call | 🔴 High | ✅ Available |
| **[Autoscaling Check](./runbooks/autoscaling-check.md)** | Monitor and verify Cloud Run autoscaling behavior | Weekly (ops review) | Platform Engineers | 🟢 Low | ✅ Available |
| **[Troubleshooting](./runbooks/troubleshooting.md)** | Diagnose and resolve common failures (10 scenarios) | As-needed (incidents) | All Engineers, On-Call | 🟡 Medium | ✅ Available |

---

### Planned Runbooks (Future)

| Runbook | Purpose | Priority | Target Version | Status |
|---------|---------|----------|----------------|--------|
| **Database Migration** | Execute schema migration with rollback plan | 🔴 High | v1.2 (Q1 2026) | ⏸️ Planned |
| **Secrets Rotation** | Rotate NEXTAUTH_SECRET, OPENAI_API_KEY, MongoDB credentials | 🟡 Medium | v1.2 (Q1 2026) | ⏸️ Planned |
| **Incident Response** | Incident management workflow (detect → mitigate → resolve → postmortem) | 🔴 High | v1.3 (Q2 2026) | ⏸️ Planned |
| **Backup and Restore** | MongoDB backup to GCS, restore from backup | 🟡 Medium | v1.2 (Q1 2026) | ⏸️ Planned |
| **Load Testing** | Execute k6 load tests, analyze results | 🟢 Low | v1.3 (Q2 2026) | ⏸️ Planned |
| **Cost Analysis** | Review GCP billing, identify cost optimization opportunities | 🟢 Low | v1.4 (Q3 2026) | ⏸️ Planned |

---

## Runbook Format

### Standard Runbook Structure

All runbooks follow a consistent format for readability and usability:

```markdown
# Runbook: [Title]

**Executive Summary**: [1-2 sentences describing purpose and key steps]

---

## Metadata

- **Owner**: [Team/Individual responsible]
- **Last Verified**: [Date runbook was last tested]
- **Verification Frequency**: [How often to re-verify: Weekly/Monthly/Quarterly]
- **Estimated Duration**: [Time to complete: 5 min / 30 min / 2 hours]
- **Complexity**: [🟢 Low / 🟡 Medium / 🔴 High]
- **Prerequisites**: [Required access, tools, knowledge]

---

## Prerequisites

- [ ] Prerequisite 1 (e.g., GCP access with Cloud Run Admin role)
- [ ] Prerequisite 2 (e.g., gcloud CLI installed and authenticated)
- [ ] Prerequisite 3 (e.g., Pulumi access token configured)

---

## Procedure

### Step 1: [Action Title]

**Description**: [What this step does and why]

**Commands**:
```powershell
# Command with comments explaining each flag
command --flag=value --other-flag
```

**Expected Output**:
```
Expected output from command
```

**Verification**:
- [ ] Verification check 1
- [ ] Verification check 2

---

### Step 2: [Next Action]

[Repeat structure...]

---

## Verification

**Final Checks**:
- [ ] Check 1: [Expected outcome]
- [ ] Check 2: [Expected outcome]

**Success Criteria**:
- ✅ Criterion 1 met
- ✅ Criterion 2 met

---

## Rollback

**If Procedure Fails**:

1. [Rollback step 1]
2. [Rollback step 2]

**Escalation Path**:
- First: [Action or person to contact]
- Second: [Next escalation level]

---

## References

- [Link to related documentation]
- [Link to related runbook]

---

**Last Updated**: [Date]
**Status**: ✅ Verified / ⚠️ Needs Verification / ❌ Deprecated
```

---

### Runbook Quality Criteria

**All runbooks must meet these criteria**:

1. **Executable Commands**: All shell commands are copy-pasteable and tested
2. **Clear Prerequisites**: No assumed knowledge, all prerequisites listed
3. **Verification Steps**: Each step includes verification checks
4. **Expected Outputs**: Include expected command outputs for comparison
5. **Rollback Instructions**: Clear rollback steps if procedure fails
6. **Escalation Path**: Who to contact if runbook doesn't work
7. **Last Verified Date**: Date runbook was last executed successfully
8. **Estimated Duration**: Realistic time estimate for completion

---

## Ownership and Maintenance

### Runbook Ownership

| Runbook | Owner | Reviewers | Verification SLA |
|---------|-------|-----------|------------------|
| **Local Development** | Tech Lead | All Developers | Per release (verify new devs can onboard) |
| **Build and Deploy** | Platform Team | DevOps Engineers | Weekly (every production deploy) |
| **Rollback** | Platform Team | On-Call Engineers | Quarterly (test rollback procedure in staging) |
| **Autoscaling Check** | Platform Team | SRE/DevOps | Monthly (review autoscaling metrics) |
| **Troubleshooting** | Platform Team | All Engineers | As-needed (update when new issues discovered) |

---

### Maintenance Process

**Quarterly Review** (Every 3 months):

1. **Verification Test**: Execute each runbook end-to-end in staging environment
2. **Accuracy Check**: Verify all commands, outputs, and screenshots are current
3. **Update Dependencies**: Update tool versions, URLs, credentials rotation
4. **Gap Analysis**: Identify missing runbooks or procedures
5. **Feedback Collection**: Gather feedback from engineers who used runbooks

**Per-Release Update** (Every production release):

1. **Infrastructure Changes**: Update runbooks if infrastructure changes (e.g., new environment, new tool)
2. **Process Changes**: Update runbooks if deployment/rollback process changes
3. **New Features**: Add troubleshooting steps for new features
4. **Deprecation**: Mark deprecated runbooks as ❌ Deprecated

**Continuous Improvement**:

- **Incident Retrospectives**: Update troubleshooting runbook after incidents
- **Onboarding Feedback**: Update local dev runbook based on new developer feedback
- **Tooling Changes**: Update runbooks when adopting new tools (e.g., k6 for load testing)

---

### Runbook Verification Log

**Record of Last Verification**:

| Runbook | Last Verified | Verified By | Environment | Result | Notes |
|---------|---------------|-------------|-------------|--------|-------|
| Local Development | 2025-11-12 | Tech Lead | Developer Workstation | ✅ Success | New developer onboarded successfully |
| Build and Deploy | 2025-11-12 | Platform Team | Dev → Staging | ✅ Success | Deployment completed in 7 minutes |
| Rollback | 2025-10-15 | On-Call Engineer | Staging | ✅ Success | Traffic split rollback completed in 3 min |
| Autoscaling Check | 2025-11-05 | Platform Team | Dev | ✅ Success | Autoscaling to 2 instances under load |
| Troubleshooting | 2025-11-01 | All Engineers | Dev | ⚠️ Partial | Section 5 (Agent Errors) updated with new error codes |

---

## Assumptions and Limitations

### Assumptions

1. **Runbook users have basic knowledge**: Users understand shell commands, git, Docker basics
2. **Tools are installed**: Users have Node.js, pnpm, Docker Desktop, gcloud CLI, git
3. **Access granted**: Users have necessary GCP roles, GitHub access, Pulumi access
4. **Runbooks are up-to-date**: Runbooks verified quarterly and updated per release
5. **Staging environment available**: Runbook verification performed in staging (not production)
6. **Single region**: All runbooks assume us-central1 region (no multi-region procedures)

### Limitations

1. **No automated runbook testing**: Runbooks not tested in CI/CD (manual execution only)
2. **No runbook versioning**: No version control for runbooks (only "Last Updated" date)
3. **No runbook analytics**: No tracking of runbook usage frequency or success rate
4. **No interactive runbooks**: No scripts that execute runbooks automatically (manual copy-paste)
5. **No screenshot updates**: Screenshots not included (may become outdated, text commands preferred)
6. **No video walkthroughs**: No video recordings of runbook execution (future: Loom videos)
7. **No multi-platform support**: Runbooks assume PowerShell (Windows) or Bash (Linux/Mac), no unified script
8. **No rollback runbook testing**: Rollback runbook not tested regularly (only verified after incidents)

---

## References

### Internal Documents

- [Deployment Strategy](../operations/deployment-strategy.md) - Deployment process overview
- [Rollback Strategy](../operations/rollback-strategy.md) - Rollback decision tree and procedures
- [Autoscaling Policy](../operations/autoscaling-policy.md) - Autoscaling configuration and baselines
- [Infrastructure Documentation](../architecture/infrastructure.md) - Environment setup and architecture
- [Testing Strategy](../testing/testing-strategy.md) - Testing procedures

### External Resources

- [Runbook Best Practices](https://www.pagerduty.com/resources/learn/what-is-a-runbook/) - PagerDuty runbook guide
- [Google SRE Book: Eliminating Toil](https://sre.google/sre-book/eliminating-toil/) - Automation and runbooks
- [Atlassian Runbook Template](https://www.atlassian.com/incident-management/devops/runbooks) - Runbook format examples

---

**Last Updated**: 2025-11-12  
**Owner**: Platform Team  
**Reviewers**: Engineering Team  
**Next Review**: Quarterly (2026-02-01)  
**Status**: ✅ Complete
