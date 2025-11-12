# Pulumi Infrastructure Risk Register

**Project**: procureflow-gcp  
**Date**: 2025-11-11

---

## Risk Summary

| Risk Level | Count | Critical Actions Required |
|------------|-------|---------------------------|
| 🔴 High | 3 | Immediate mitigation needed |
| 🟡 Medium | 5 | Plan mitigation this month |
| 🟢 Low | 4 | Monitor and document |

---

## High-Priority Risks 🔴

### R1: Exposed API Keys in Bootstrap Script

**Risk**: OPENAI_API_KEY hardcoded in `apply-pulumi-config.ps1`  
**Impact**: Credential compromise if file leaked  
**Probability**: Medium (file in git, not gitignored)  
**Severity**: High

**Mitigation**:
- ✅ IMMEDIATE: Delete or move file to secure vault
- ✅ Rotate exposed OPENAI_API_KEY
- ✅ Add `*.ps1` with secrets to .gitignore

**Status**: 🔴 Open  
**Owner**: DevOps Team

---

### R2: Single Stack (No Test/Prod Separation)

**Risk**: All changes deployed directly to dev, no testing  
**Impact**: Breaking changes affect live environment  
**Probability**: High (frequent deployments)  
**Severity**: Medium-High

**Mitigation**:
- Create test stack: `pulumi stack init test`
- Create prod stack with protection: `protect: true`
- Implement promotion pipeline: dev → test → prod

**Status**: 🔴 Open  
**Owner**: Infrastructure Team

---

### R3: No Drift Detection

**Risk**: Manual changes in GCP Console not tracked  
**Impact**: Pulumi state out of sync with reality  
**Probability**: Medium (NEXTAUTH_URL set manually)  
**Severity**: Medium

**Mitigation**:
- Weekly drift check: `pulumi refresh`
- Automate in CI/CD: `pulumi preview` on schedule
- Alert on detected drift

**Status**: 🔴 Open  
**Owner**: SRE Team

---

## Medium-Priority Risks 🟡

### R4: MongoDB Atlas Not in Pulumi State

**Risk**: External MongoDB cluster, manual management  
**Impact**: Configuration drift, no IaC for database  
**Probability**: Low (stable cluster)  
**Severity**: Medium

**Mitigation**:
- Document existing cluster config
- Consider importing to Pulumi (if needed)
- Alternative: Keep external, document in runbook

**Status**: 🟡 Accepted  
**Owner**: Database Team

---

### R5: No Secret Rotation Process

**Risk**: Secrets never rotated, long-lived credentials  
**Impact**: Increased exposure window if compromised  
**Probability**: Low (secrets in Secret Manager)  
**Severity**: Medium

**Mitigation**:
- Document rotation procedure
- Schedule quarterly secret rotation
- Automate with Secret Manager rotation

**Status**: 🟡 Open  
**Owner**: Security Team

---

### R6: GCP Project Single Point of Failure

**Risk**: All resources in single GCP project  
**Impact**: Project deletion = total outage  
**Probability**: Very Low (requires Owner permission)  
**Severity**: High

**Mitigation**:
- Enable deletion protection on project
- Regular backups (Pulumi state, MongoDB)
- Document recovery procedures

**Status**: 🟡 Open  
**Owner**: Platform Team

---

### R7: Vendor Lock-in (GCP)

**Risk**: 100% GCP, no multi-cloud strategy  
**Impact**: Migration difficulty if needed  
**Probability**: Low (strategic choice)  
**Severity**: Medium

**Mitigation**:
- Keep code provider-agnostic where possible
- Use standard APIs (MongoDB, HTTPS)
- Document GCP-specific dependencies

**Status**: 🟡 Accepted  
**Owner**: Architecture Team

---

### R8: Cloud Run Public Access

**Risk**: Service accessible to internet (allUsers)  
**Impact**: Potential abuse, DDoS  
**Probability**: Low (application handles auth)  
**Severity**: Medium

**Mitigation**:
- Implement rate limiting in app
- Consider Cloud Armor (WAF)
- Monitor for abuse patterns

**Status**: 🟡 Monitoring  
**Owner**: Security Team

---

## Low-Priority Risks 🟢

### R9: Free Tier Dependency

**Risk**: Architecture assumes free tier availability  
**Impact**: Cost increase if free tier removed  
**Probability**: Very Low (GCP free tier stable)  
**Severity**: Low

**Mitigation**:
- Monitor GCP pricing changes
- Budget alerts at $5/month
- Cost optimization already in place

**Status**: 🟢 Monitoring  
**Owner**: Finance Team

---

### R10: No Infrastructure Tests

**Risk**: No automated validation of infrastructure  
**Impact**: Errors only caught in deployment  
**Probability**: Medium  
**Severity**: Low

**Mitigation**:
- Add Pulumi policy packs
- Add infrastructure tests (Pulumi testing framework)
- Validate in CI/CD

**Status**: 🟢 Planned  
**Owner**: QA Team

---

### R11: Documentation Drift

**Risk**: Docs outdated vs actual implementation  
**Impact**: Confusion, incorrect procedures  
**Probability**: Medium (rapid iteration)  
**Severity**: Low

**Mitigation**:
- Include docs in PR reviews
- Automated checks (e.g., code snippets validity)
- Quarterly docs audit

**Status**: 🟢 Monitoring  
**Owner**: Tech Writing

---

### R12: GitHub Actions Service Account Over-Permissioned

**Risk**: CI/CD SA has 5 admin roles  
**Impact**: Compromised SA could damage infrastructure  
**Probability**: Low (GitHub Secrets protected)  
**Severity**: Medium

**Mitigation**:
- Review and reduce permissions
- Use Workload Identity Federation (no keys)
- Audit SA activity

**Status**: 🟢 Planned  
**Owner**: Security Team

---

## Security-Specific Risks

### S1: Secrets in Pulumi State

**Risk**: Pulumi state contains secret values  
**Impact**: State file exposure = credential leak  
**Probability**: Low (Pulumi Cloud encrypted)  
**Severity**: High

**Mitigation**:
- ✅ Pulumi Cloud backend (encrypted at rest)
- ✅ Use `pulumi.secret()` for outputs
- Restrict Pulumi Cloud access (MFA)

**Status**: ✅ Mitigated  
**Owner**: Platform Team

---

### S2: Service Account Key in GitHub Secrets

**Risk**: Long-lived SA key JSON in GitHub  
**Impact**: Key compromise if GitHub breached  
**Probability**: Very Low (GitHub SOC 2)  
**Severity**: High

**Mitigation**:
- Migrate to Workload Identity Federation (no keys)
- Rotate SA keys quarterly
- Monitor SA activity in Cloud Logging

**Status**: 🟡 Planned  
**Owner**: Security Team

---

## Operational Risks

### O1: Manual NEXTAUTH_URL Update

**Risk**: Deployment workflow requires manual gcloud command  
**Impact**: Forgot step = broken auth  
**Probability**: Medium (human error)  
**Severity**: Medium

**Mitigation**:
- ✅ Automated in GitHub Actions post-deploy step
- Document in runbook
- Consider Cloud Run custom domains (stable URL)

**Status**: ✅ Mitigated  
**Owner**: DevOps Team

---

### O2: No Monitoring/Alerting

**Risk**: No proactive alerts for service issues  
**Impact**: Delayed incident response  
**Probability**: Medium  
**Severity**: Medium

**Mitigation**:
- Set up Cloud Monitoring dashboards
- Configure uptime checks
- Slack/email alerts for errors

**Status**: 🟡 Planned  
**Owner**: SRE Team

---

### O3: No Backup Strategy

**Risk**: No automated backups for MongoDB or Pulumi state  
**Impact**: Data loss if cluster fails  
**Probability**: Low (Atlas has replication)  
**Severity**: High

**Mitigation**:
- MongoDB Atlas: Enable automated backups (requires M10+)
- Pulumi State: Backed up by Pulumi Cloud
- Export stack: `pulumi stack export > backup.json`

**Status**: 🟢 Monitoring  
**Owner**: Data Team

---

## Compliance Risks

### C1: No Audit Trail

**Risk**: No centralized audit log for infra changes  
**Impact**: Compliance issues, hard to investigate incidents  
**Probability**: Low (small team)  
**Severity**: Low

**Mitigation**:
- Enable Cloud Audit Logs (admin activity already enabled)
- Pulumi Cloud: Activity logs available
- GitHub: All changes tracked in commits

**Status**: 🟢 Partially Mitigated  
**Owner**: Compliance Team

---

## Risk Mitigation Roadmap

### Week 1 (Immediate)
- [ ] Delete or secure `apply-pulumi-config.ps1`
- [ ] Rotate OPENAI_API_KEY
- [ ] Add missing .gitignore entries

### Month 1
- [ ] Create test and prod stacks
- [ ] Implement drift detection automation
- [ ] Set up GCP budget alerts

### Quarter 1
- [ ] Migrate to Workload Identity Federation
- [ ] Implement secret rotation process
- [ ] Add infrastructure tests
- [ ] Set up monitoring and alerting

---

**Risk Register Maintained By**: GitHub Copilot AI Agent  
**Last Updated**: 2025-11-11  
**Next Review**: Monthly
