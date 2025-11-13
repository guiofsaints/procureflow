# CI/CD Validation Checklist

**Version**: 1.0  
**Purpose**: Validate improved CI/CD pipeline meets design goals  
**Reference**: [Target Design](../architecture/cicd-iac.target-design.md) | [Improvement Plan](../operation/cicd-iac.improvement-plan.md)

---

## Pre-Implementation Baseline

Document current state before making changes:

- [ ] **Current CI time**: ****\_\_**** min (target: <5 min)
- [ ] **Current deploy time**: ****\_\_**** min (target: <8 min)
- [ ] **Current MTTR (manual rollback)**: ****\_\_**** min (target: <1 min)
- [ ] **Current cache hit rate (pnpm)**: ****\_\_**** % (target: >90%)
- [ ] **Current build success rate**: ****\_\_**** % (target: >98%)
- [ ] **Long-lived keys count**: ****\_\_**** (target: 0)
- [ ] **SBOM/provenance present**: ⬜ Yes / ⬜ No (target: Yes)

---

## Phase 0: Quick Wins Validation

### QW-1: OIDC Authentication

#### Setup Verification

- [ ] Workload Identity Pool created in GCP
  ```bash
  gcloud iam workload-identity-pools describe github --location=global
  ```
- [ ] OIDC provider configured
  ```bash
  gcloud iam workload-identity-pools providers describe github-oidc \
    --workload-identity-pool=github --location=global
  ```
- [ ] Service account bound to GitHub repo
  ```bash
  gcloud iam service-accounts get-iam-policy github-actions@procureflow-dev.iam.gserviceaccount.com
  # Should show principalSet binding
  ```

#### Workflow Testing

- [ ] CI workflow authenticates with OIDC (no `GCP_SA_KEY`)
  - Workflow run: ****************\_\_\_****************
  - Auth step shows: "Authenticating via Workload Identity Federation"
- [ ] Deploy workflow authenticates with OIDC
  - Workflow run: ****************\_\_\_****************
  - Artifact push succeeds
- [ ] Pulumi operations succeed with OIDC auth
  - Deploy run: ****************\_\_\_****************
  - Cloud Run update succeeds

#### Security Audit

- [ ] `GCP_SA_KEY` secret deleted from GitHub
  - Deleted by: ******\_\_\_\_****** Date: ****\_\_****
- [ ] No long-lived keys in GitHub Secrets
  ```bash
  gh secret list
  # Should not contain GCP_SA_KEY or similar JSON keys
  ```
- [ ] IAM audit shows OIDC usage in logs
  ```bash
  gcloud logging read 'protoPayload.authenticationInfo.principalEmail="github-actions@procureflow-dev.iam.gserviceaccount.com"' --limit=5
  # Should show recent OIDC token exchanges
  ```

---

### QW-2: Concurrency Controls

#### Configuration

- [ ] `ci.yml` has concurrency group
  ```yaml
  concurrency:
    group: ci-${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
  ```
- [ ] `deploy-gcp.yml` has concurrency group
  ```yaml
  concurrency:
    group: deploy-${{ github.ref }}
    cancel-in-progress: false
  ```

#### Behavior Testing

- [ ] **Test 1: Rapid-fire commits to PR**
  - Make 3 commits within 30 seconds
  - Expected: CI runs 1 and 2 cancelled, only run 3 completes
  - Result: ⬜ Pass / ⬜ Fail
  - Run IDs: ********\_\_********, ********\_\_********, ********\_\_********
- [ ] **Test 2: Concurrent deploy attempts**
  - Trigger deploy manually twice in quick succession
  - Expected: First deploy runs, second queued (not parallel)
  - Result: ⬜ Pass / ⬜ Fail
  - Run IDs: ********\_\_********, ********\_\_********

---

### QW-3: Skip Redundant Tests

#### Configuration

- [ ] Branch protection rule on `main` requires "CI - Lint and Test"
  - Settings → Branches → `main` → Status checks
  - Required check: ✅ "CI - Lint and Test / build"
- [ ] `test` job removed from `deploy-gcp.yml`
  - Verify: `grep -n "test:" .github/workflows/deploy-gcp.yml` returns nothing
- [ ] `build` job in deploy has no test dependency
  ```yaml
  build:
    needs: [] # or other jobs, but not 'test'
  ```

#### Timing Validation

- [ ] **Baseline deploy time** (before): ****\_\_**** min
- [ ] **New deploy time** (after): ****\_\_**** min
- [ ] **Time saved**: ****\_\_**** min (expected: ~4 min)

#### Flow Testing

- [ ] **Test 1: PR with failing tests**
  - Create PR with failing test
  - Expected: CI fails, PR cannot merge
  - Result: ⬜ Pass / ⬜ Fail
- [ ] **Test 2: Merge PR, trigger deploy**
  - Merge PR to main
  - Expected: Deploy runs immediately, skips tests
  - Result: ⬜ Pass / ⬜ Fail
  - Deploy run: ****************\_\_\_****************

---

## Phase 1: Build & Cache Validation

### IT1-1: Docker Layer Cache

#### Cache Configuration

- [ ] BuildKit cache backend configured
  ```yaml
  cache-from: type=gha
  cache-to: type=gha,mode=max
  ```
- [ ] `docker/setup-buildx-action@v3` present in workflow

#### Performance Testing

- [ ] **Cold build** (clear cache first)
  - Run: ****************\_\_\_****************
  - Duration: ****\_\_**** min
  - Cache writes: ****\_\_**** MB
- [ ] **Warm build** (cache present)
  - Run: ****************\_\_\_****************
  - Duration: ****\_\_**** min (expected: <2 min)
  - Cache hits: ****\_\_**** MB
  - **Time saved**: ****\_\_**** min

#### Cache Verification

- [ ] GitHub Actions cache shows Docker layers
  ```bash
  gh cache list
  # Should show entries like buildkit-*, size ~500MB-1GB
  ```
- [ ] Cache hit rate: ****\_\_**** % (target: >70%)

---

### IT1-2: Next.js Build Cache

#### Cache Configuration

- [ ] `.next/cache` directory cached in `ci.yml`
  ```yaml
  path: packages/web/.next/cache
  key: ${{ runner.os }}-nextjs-${{ hashFiles('packages/web/pnpm-lock.yaml') }}-...
  ```

#### Performance Testing

- [ ] **Build without cache**
  - Run: ****************\_\_\_****************
  - Duration: ****\_\_**** s
- [ ] **Build with cache**
  - Run: ****************\_\_\_****************
  - Duration: ****\_\_**** s (expected: <60s)
  - Cache restored: ⬜ Yes / ⬜ No
  - **Time saved**: ****\_\_**** s

---

### IT1-3: Parallel CI Jobs

#### Configuration

- [ ] `lint` job has no `needs` dependency
- [ ] `test` job has no `needs` dependency
- [ ] `build` job has `needs: [lint, test]`

#### Timing Validation

- [ ] **CI run with parallel jobs**
  - Run: ****************\_\_\_****************
  - Lint duration: ****\_\_**** s
  - Test duration: ****\_\_**** s
  - Build duration: ****\_\_**** s
  - **Total CI time**: ****\_\_**** min (expected: <5 min)
- [ ] **Verify parallelization**
  - Lint and test start times within 5 seconds of each other: ⬜ Yes / ⬜ No

---

### IT1-4: Build-Once-Promote-Many

#### Architecture Verification

- [ ] CI workflow builds and pushes image exactly once
- [ ] CI workflow exports image digest
  ```yaml
  outputs:
    image-digest: ${{ steps.build.outputs.digest }}
  ```
- [ ] Deploy workflow receives digest (not rebuilding)
- [ ] Pulumi deploys by digest, not tag
  ```typescript
  image: `${registryUrl}@${imageDigest}`;
  ```

#### Flow Testing

- [ ] **Test 1: CI build**
  - CI run: ****************\_\_\_****************
  - Image pushed: ⬜ Yes
  - Digest exported: ******************\_\_******************
  - Tags: git-$SHA, $BRANCH-latest
- [ ] **Test 2: Deploy uses CI artifact**
  - Deploy run: ****************\_\_\_****************
  - Image pulled (not built): ⬜ Yes
  - Digest matches CI: ⬜ Yes
  - Cloud Run revision image: ******************\_\_******************
- [ ] **Test 3: Verify deployed artifact**
  ```bash
  gcloud run services describe procureflow-web --region=us-central1 --format='value(spec.template.spec.containers[0].image)'
  # Should show @sha256:... digest, not :tag
  ```

#### Performance

- [ ] **Deploy time without rebuild**: ****\_\_**** min (expected: <8 min)
- [ ] **Time saved**: ****\_\_**** min (expected: 5-7 min)

---

### IT1-5: Immutable Image Digests

#### Verification

- [ ] Images tagged with full 40-char git SHA
  ```bash
  gcloud artifacts docker tags list us-central1-docker.pkg.dev/procureflow-dev/procureflow/web
  # Should show tags like git-abc123def456... (40 chars)
  ```
- [ ] Digest used in Pulumi config
  ```bash
  pulumi config get image-digest --stack dev
  # Should show sha256:...
  ```
- [ ] No `latest` tag in production
  - Production images: ⬜ No latest tag / ⬜ Has latest tag

---

## Phase 2: Reliability & Security Validation

### IT2-1: Blue/Green Deployment

#### Configuration

- [ ] Cloud Run traffic splitting configured
  ```bash
  gcloud run services describe procureflow-web --region=us-central1 --format='value(spec.traffic)'
  # Should show 2+ revisions with traffic percentages
  ```

#### Deployment Testing

- [ ] **Test 1: Gradual rollout**
  - Deploy run: ****************\_\_\_****************
  - Initial traffic to new revision: 0%
  - After health checks: 10% → 50% → 100%
  - Total deployment time: ****\_\_**** min
- [ ] **Test 2: Zero-downtime verification**
  - Run load test during deploy:
    ```bash
    while true; do curl -s https://YOUR_SERVICE_URL/api/health; sleep 1; done
    ```
  - Downtime: ****\_\_**** seconds (expected: 0s)
  - 5xx errors: ****\_\_**** (expected: 0)

#### Rollback Testing

- [ ] **Test 3: Manual rollback**
  - List revisions:
    ```bash
    gcloud run revisions list --service=procureflow-web --region=us-central1
    ```
  - Shift traffic to previous:
    ```bash
    gcloud run services update-traffic procureflow-web --to-revisions=PREVIOUS_REVISION=100
    ```
  - Rollback time: ****\_\_**** s (target: <60s)
  - Service available: ⬜ Yes / ⬜ No

---

### IT2-2: Pre-Traffic Health Checks

#### Configuration

- [ ] Health check composite action exists: `.github/actions/health-check/action.yml`
- [ ] Deploy workflow calls health check before traffic shift
  ```yaml
  - uses: ./.github/actions/health-check
    with:
      endpoints: |
        /api/health
        /api/items?limit=1
  ```

#### Testing

- [ ] **Test 1: Health checks pass**
  - Deploy run: ****************\_\_\_****************
  - Health check step: ⬜ Pass
  - Endpoints tested: /api/health, /api/items
  - Database connectivity verified: ⬜ Yes
- [ ] **Test 2: Health checks fail (simulated)**
  - Intentionally break `/api/health` endpoint
  - Deploy attempt: ****************\_\_\_****************
  - Expected: Deploy fails before traffic shift
  - Result: ⬜ Pass (deploy blocked) / ⬜ Fail

---

### IT2-3: Automated Rollback

#### Configuration

- [ ] Rollback step in deploy workflow
  ```yaml
  - name: Rollback on failure
    if: failure()
    run: |
      # Shift traffic to previous revision
  ```

#### Testing

- [ ] **Test 1: Rollback on health check failure**
  - Intentionally fail health checks
  - Deploy run: ****************\_\_\_****************
  - Expected: Automatic rollback to previous revision
  - Result: ⬜ Pass / ⬜ Fail
  - Rollback time: ****\_\_**** s (target: <60s)
- [ ] **Test 2: Service availability during rollback**
  - Run load test during failed deploy
  - Downtime: ****\_\_**** s (expected: <5s)
  - Service remains available: ⬜ Yes / ⬜ No

---

### IT2-4: SBOM and Provenance

#### Configuration

- [ ] Docker build enables attestations
  ```yaml
  provenance: true
  sbom: true
  attestations: |
    type=sbom
    type=provenance
  ```

#### Verification

- [ ] **SBOM present**
  ```bash
  gcloud artifacts docker images describe us-central1-docker.pkg.dev/procureflow-dev/procureflow/web:git-$SHA \
    --show-provenance
  # Should show SBOM with package list
  ```
- [ ] **Provenance present**
  ```bash
  gcloud artifacts docker images describe us-central1-docker.pkg.dev/procureflow-dev/procureflow/web:git-$SHA \
    --show-build-details
  # Should show git SHA, workflow ID, builder
  ```
- [ ] **SLSA Level 2 compliance**
  - Build script version controlled: ⬜ Yes
  - Build service documented: ⬜ Yes (GitHub Actions)
  - Provenance available: ⬜ Yes
  - Provenance authenticated: ⬜ Yes (via OIDC)

---

### IT2-5: Vulnerability Scanning

#### Configuration

- [ ] Trivy scan step in CI workflow
  ```yaml
  - uses: aquasecurity/trivy-action@master
    with:
      severity: 'CRITICAL,HIGH'
      exit-code: '1'
  ```

#### Testing

- [ ] **Scan runs on every build**
  - CI run: ****************\_\_\_****************
  - Trivy step: ⬜ Pass
  - Vulnerabilities found: ****\_\_****
  - Severity breakdown: CRITICAL: **, HIGH: **, MEDIUM: **, LOW: **
- [ ] **SARIF upload to GitHub Security**
  - Navigate to: Security → Code scanning
  - Trivy results visible: ⬜ Yes / ⬜ No
  - Sample alert: ****************\_\_\_****************
- [ ] **Build fails on critical vulnerabilities**
  - Intentionally add vulnerable package (e.g., old lodash)
  - CI run: ****************\_\_\_****************
  - Build fails: ⬜ Yes / ⬜ No

---

### IT2-6: Environment Protection

#### Configuration

- [ ] **dev environment**: No restrictions
  - Settings → Environments → dev → Protection rules: None
- [ ] **staging environment**: 1 required reviewer
  - Settings → Environments → staging → Protection rules
  - Required reviewers: 1
  - Reviewers: ****************\_\_\_****************
- [ ] **production environment**: 2 required reviewers + branch restriction
  - Settings → Environments → production → Protection rules
  - Required reviewers: 2
  - Deployment branches: `main` only
  - Reviewers: ****************\_\_\_****************, ****************\_\_\_****************

#### Testing

- [ ] **Test 1: Dev auto-deploys**
  - Merge PR to main
  - Expected: Deploy runs immediately
  - Result: ⬜ Pass / ⬜ Fail
- [ ] **Test 2: Staging requires approval**
  - Trigger staging deploy
  - Expected: Pending approval
  - Result: ⬜ Pass / ⬜ Fail
  - Approver notified: ⬜ Yes / ⬜ No
- [ ] **Test 3: Production requires 2 approvals**
  - Trigger production deploy
  - Expected: Pending 2 approvals
  - Result: ⬜ Pass / ⬜ Fail
  - Both approvers notified: ⬜ Yes / ⬜ No

---

## Performance Benchmarks

### Cold Start Timing (No Cache)

| Stage                | Baseline          | Target          | Actual       | Pass/Fail |
| -------------------- | ----------------- | --------------- | ------------ | --------- |
| Checkout             | 15s               | 15s             | **\_** s     | ⬜        |
| Setup pnpm           | 30s               | 30s             | **\_** s     | ⬜        |
| Install deps (cold)  | 90s               | 60s             | **\_** s     | ⬜        |
| Lint                 | 45s               | 45s             | **\_** s     | ⬜        |
| Test                 | 30s               | 30s             | **\_** s     | ⬜        |
| Build Next.js (cold) | 120s              | 90s             | **\_** s     | ⬜        |
| Docker build (cold)  | 420s              | 240s            | **\_** s     | ⬜        |
| Docker push          | 45s               | 45s             | **\_** s     | ⬜        |
| Pulumi up            | 180s              | 120s            | **\_** s     | ⬜        |
| Health checks        | 45s               | 45s             | **\_** s     | ⬜        |
| **Total CI**         | **420s (7min)**   | **300s (5min)** | ****\_** s** | ⬜        |
| **Total Deploy**     | **1020s (17min)** | **480s (8min)** | ****\_** s** | ⬜        |

### Warm Start Timing (With Cache)

| Stage                   | Baseline  | Target          | Actual       | Pass/Fail |
| ----------------------- | --------- | --------------- | ------------ | --------- |
| Install deps (warm)     | 90s       | 25s             | **\_** s     | ⬜        |
| Build Next.js (warm)    | 120s      | 45s             | **\_** s     | ⬜        |
| Docker build (warm)     | 420s      | 90s             | **\_** s     | ⬜        |
| **Total CI (warm)**     | **420s**  | **240s (4min)** | ****\_** s** | ⬜        |
| **Total Deploy (warm)** | **1020s** | **360s (6min)** | ****\_** s** | ⬜        |

### Reliability Metrics

| Metric                      | Baseline     | Target      | Actual   | Pass/Fail |
| --------------------------- | ------------ | ----------- | -------- | --------- |
| Deploy success rate         | 90%          | 98%         | **\_** % | ⬜        |
| MTTR (rollback)             | 900s (15min) | 60s (<1min) | **\_** s | ⬜        |
| Downtime per deploy         | 0s           | 0s          | **\_** s | ⬜        |
| Cache hit rate (pnpm)       | 85%          | 90%         | **\_** % | ⬜        |
| Cache hit rate (Docker)     | 0%           | 75%         | **\_** % | ⬜        |
| Failed health checks caught | 0%           | 100%        | **\_** % | ⬜        |

---

## Security Posture

### Authentication

- [ ] No long-lived service account keys in GitHub: ⬜ Pass / ⬜ Fail
- [ ] OIDC tokens expire within 1 hour: ⬜ Pass / ⬜ Fail
- [ ] IAM audit logs show OIDC usage: ⬜ Pass / ⬜ Fail

### Supply Chain

- [ ] SBOM generated for every image: ⬜ Pass / ⬜ Fail
- [ ] Provenance includes git SHA and workflow: ⬜ Pass / ⬜ Fail
- [ ] SLSA Level 2 achieved: ⬜ Pass / ⬜ Fail
- [ ] Vulnerability scanning blocks critical CVEs: ⬜ Pass / ⬜ Fail

### Least Privilege

- [ ] CI service account: Only `artifactregistry.writer`: ⬜ Pass / ⬜ Fail
- [ ] Deploy service account: Only `run.developer` + scoped SA impersonation: ⬜ Pass / ⬜ Fail
- [ ] Runtime service account: Only `secretAccessor` on specific secrets: ⬜ Pass / ⬜ Fail

---

## Acceptance Sign-Off

| Phase       | Completed | Validated By   | Date         | Notes |
| ----------- | --------- | -------------- | ------------ | ----- |
| Quick Wins  | ⬜        | ******\_****** | **\_\_\_\_** |       |
| Iteration 1 | ⬜        | ******\_****** | **\_\_\_\_** |       |
| Iteration 2 | ⬜        | ******\_****** | **\_\_\_\_** |       |
| Later       | ⬜        | ******\_****** | **\_\_\_\_** |       |

**Final Approval**: ************\_************ Date: ****\_\_****  
**Production Rollout**: ⬜ Approved / ⬜ Rejected

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-13  
**Maintained By**: DevOps Team
