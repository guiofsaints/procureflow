# Pulumi Infrastructure Organization Review

**Assessment Date**: 2025-11-11  
**Project**: procureflow-gcp

---

## 1. Current Folder Structure

```
packages/infra/
├── compose.yaml              # Docker Compose (local dev only)
├── package.json              # Infra package metadata
├── docker/                   # Dockerfiles
│   ├── Dockerfile.web
│   └── mongo-init/
├── env/                      # Environment files (local dev)
│   ├── .env.web
│   └── .env.mongo
└── pulumi/
    └── gcp/                  # ⭐ Pulumi GCP infrastructure
        ├── index.ts          # Main orchestration (171 lines)
        ├── cloudrun.ts       # Cloud Run + Artifact Registry (175 lines)
        ├── secrets.ts        # Secret Manager (109 lines)
        ├── mongodb-atlas.ts  # ❌ UNUSED (118 lines)
        ├── Pulumi.yaml       # Project metadata
        ├── Pulumi.dev.yaml   # Stack config (encrypted)
        ├── package.json      # Dependencies
        ├── tsconfig.json     # TypeScript config
        ├── apply-pulumi-config.ps1    # ⚠️ Bootstrap script (contains secrets)
        ├── setup-github-secrets.ps1   # ✅ GitHub Actions setup
        ├── README.md         # Quick start
        ├── SETUP.md          # Comprehensive guide (~700 lines)
        ├── INFRAESTRUTURA_GCP_RELATORIO.md  # Report (PT)
        ├── dist/             # ⚠️ Generated JS (should be gitignored)
        ├── node_modules/     # Dependencies
        └── stack-backup.json # ⚠️ Stack export (should be gitignored)
```

---

## 2. Organization Assessment

### 2.1 Folder Structure - Score: 6/10

**Strengths** ✅:
- Clear separation: `docker/`, `env/`, `pulumi/`
- Logical grouping by provider (`pulumi/gcp/`)
- Self-contained Pulumi project (own package.json)

**Weaknesses** ⚠️:
- No separation of stacks within `gcp/` folder
- Modules (*.ts) mixed with config files in root
- Scripts mixed with source code
- No `shared/` or `lib/` folder for utilities
- Generated files (`dist/`, `stack-backup.json`) not gitignored

**Issues** ❌:
- Single flat structure doesn't scale to multiple environments
- No place for shared modules between future providers (AWS, Azure)

---

### 2.2 Naming Conventions - Score: 7/10

**Strengths** ✅:
- Consistent TypeScript naming: `kebab-case.ts`
- Descriptive resource names: `procureflow-web`, `nextauth-secret`
- Clear function names: `createSecrets`, `grantSecretAccess`

**Weaknesses** ⚠️:
- Inconsistent label naming: `managed_by` vs `managed-by`
- Mixed naming in outputs: `serviceUrl` vs `service-url`
- No naming convention documented

**Recommendations**:
- Document naming standards
- Create naming utility function
- Enforce via linting

---

### 2.3 Environment Separation - Score: 4/10

**Current State**: ❌ **SINGLE STACK ONLY** (`dev`)

**Strengths** ✅:
- Environment passed as config: `environment: dev`
- Labels include environment tag

**Critical Issues** ❌:
1. **No test/prod stacks** - all changes go directly to dev
2. **No stack-specific folder structure**
3. **No environment-specific configuration files**
4. **No promotion strategy** (dev → test → prod)

**Impact**:
- High risk of breaking dev environment
- No testing before production
- Cannot run parallel environments

**Recommendation**: Implement stack strategy (see folder-structure-proposal.md)

---

### 2.4 Secrets Handling - Score: 7/10

**Strengths** ✅:
1. **Pulumi Encrypted Secrets**: All sensitive config encrypted in `Pulumi.dev.yaml`
2. **GCP Secret Manager**: Secrets stored in Secret Manager (not env vars)
3. **IAM-Based Access**: Service account-based secret access
4. **No Plaintext in Code**: No hardcoded secrets in TypeScript files

**Weaknesses** ⚠️:
1. **apply-pulumi-config.ps1**: Contains exposed OPENAI_API_KEY
2. **setup-github-secrets.ps1**: Generates plaintext files (`github-secrets-output.txt`)
3. **No Secret Rotation**: No documented rotation process
4. **No Audit Trail**: No centralized secret access logging

**Critical Gaps** ❌:
- Bootstrap script with secrets should be deleted after use
- No .gitignore for generated secret files

**Recommendation**:
```gitignore
# Secrets
*-key.json
*-secrets*.txt
*-secrets*.json
apply-pulumi-config.ps1  # Or move to secure vault
```

---

### 2.5 Configuration Management - Score: 6/10

**Strengths** ✅:
- Pulumi Config used consistently
- Secrets vs non-secrets clearly separated
- Provider configs namespaced (`gcp:`, `mongodbatlas:`)

**Weaknesses** ⚠️:
- No config validation schema
- Hardcoded defaults in code (MongoDB project ID)
- No documented config reference
- Mixed responsibility: some configs in index.ts, some in modules

**Unused Configs** ⚠️:
- `mongodbatlas:*` keys set but not used (mongodb-atlas.ts inactive)

---

### 2.6 Script Organization - Score: 5/10

**Current State**:
- Scripts in same folder as source code
- No `scripts/` subfolder
- Platform-specific (PowerShell only)

**Issues** ❌:
1. No cross-platform equivalents (bash)
2. No script documentation beyond inline comments
3. One-time scripts not separated from reusable ones

**Recommendation**: Move to `scripts/` folder:
```
pulumi/gcp/
└── scripts/
    ├── README.md
    ├── setup/
    │   ├── bootstrap-config.ps1   # One-time use
    │   └── bootstrap-config.sh    # Cross-platform
    └── ci-cd/
        ├── setup-github-secrets.ps1
        └── setup-github-secrets.sh
```

---

### 2.7 Documentation Organization - Score: 7/10

**Current State**:
- 3 documentation files in root
- Mixed languages (English + Portuguese)
- No docs/ subfolder

**Strengths** ✅:
- Comprehensive SETUP.md (~700 lines)
- Inline code comments extensive
- README.md for quick start

**Weaknesses** ⚠️:
- No architecture diagrams (as separate files)
- No runbook (separate from setup)
- No troubleshooting guide
- INFRAESTRUTURA_GCP_RELATORIO.md in Portuguese (inconsistent)

**Recommendation**: Create `docs/` folder:
```
pulumi/gcp/
└── docs/
    ├── README.md          # Overview
    ├── architecture.md    # Diagrams, decisions
    ├── setup.md           # Setup guide
    ├── runbook.md         # Operations guide
    ├── troubleshooting.md
    └── cost-estimates.md
```

---

## 3. Git and Version Control

### 3.1 .gitignore Analysis - Score: 5/10

**Missing Entries**:
```gitignore
# Compiled output
dist/
*.js
*.js.map

# Pulumi
stack-backup.json
Pulumi.*.yaml  # Consider: encrypted but sensitive

# Secrets and keys
*-key.json
*-secrets*.txt
github-actions-key.json
github-secrets-output.txt

# Local env overrides
.env.local
.env.*.local
```

---

### 3.2 Monorepo Integration - Score: 8/10

**Strengths** ✅:
- Proper pnpm workspace member
- Isolated dependencies (own package.json)
- Follows monorepo conventions

**Opportunities**:
- Could share types with `packages/web` (domain entities)
- Could share naming utils across packages

---

## 4. Development Experience (DX)

### 4.1 Local Development - Score: 6/10

**Strengths** ✅:
- Docker Compose for local MongoDB
- Clear package.json scripts
- TypeScript for type safety

**Weaknesses** ⚠️:
- No pre-commit hooks for validation
- No local Pulumi preview automation
- No cost estimation integration (Infracost)

---

### 4.2 CI/CD Integration - Score: 7/10

**Strengths** ✅:
- GitHub Actions workflow exists
- Automated deployment on push to main
- Service account properly configured

**Weaknesses** ⚠️:
- No PR preview (Pulumi preview in PR comments)
- No drift detection automation
- No cost estimation in CI

---

## 5. Scalability Assessment

### 5.1 Multi-Environment - Score: 3/10

**Current**: Single `dev` stack only  
**Capability**: Code supports parameterization, but no stack separation implemented

**Blockers**:
- No test/staging/prod stacks created
- No environment-specific configs
- No promotion process

---

### 5.2 Multi-Region - Score: 5/10

**Current**: us-central1 only  
**Capability**: Region passed as config, but hardcoded in some places

**Gaps**:
- No multi-region deployment pattern
- No region-specific resource naming

---

### 5.3 Multi-Provider - Score: 7/10

**Current**: GCP only  
**Capability**: Folder structure supports (`pulumi/gcp/`, could add `pulumi/aws/`)

**Strengths** ✅:
- Provider isolated in subfolder
- Clean separation possible

---

## 6. Compliance and Standards

### 6.1 Pulumi Best Practices - Score: 8/10

**Followed** ✅:
- ✅ Using `pulumi.secret()` for sensitive outputs
- ✅ Using `pulumi.interpolate` for composed strings
- ✅ Explicit resource dependencies
- ✅ Meaningful resource names
- ✅ Labels/tags on resources
- ✅ Output exports for important values

**Missing** ⚠️:
- ⚠️ No resource `protect: true` on production resources
- ⚠️ No explicit `dependsOn` where order matters
- ⚠️ No stack references (no multi-stack yet)

---

### 6.2 GCP Best Practices - Score: 7/10

**Followed** ✅:
- ✅ Service accounts for workload identity
- ✅ Least privilege IAM (specific roles)
- ✅ Secret Manager for secrets
- ✅ Free tier optimization
- ✅ Resource labels for organization

**Missing** ⚠️:
- ⚠️ No VPC (using default network)
- ⚠️ No logging/monitoring configured
- ⚠️ No alerting setup

---

## 7. Key Findings Summary

| Dimension | Score | Status | Priority |
|-----------|-------|--------|----------|
| Folder Structure | 6/10 | ⚠️ Needs improvement | High |
| Naming Conventions | 7/10 | ✅ Good | Low |
| Environment Separation | 4/10 | ❌ Critical gap | High |
| Secrets Handling | 7/10 | ⚠️ Minor issues | Medium |
| Configuration Management | 6/10 | ⚠️ Needs improvement | Medium |
| Script Organization | 5/10 | ⚠️ Needs improvement | Low |
| Documentation | 7/10 | ✅ Good | Low |
| Git/Version Control | 5/10 | ⚠️ Needs improvement | Medium |
| DX (Development Experience) | 6/10 | ⚠️ Needs improvement | Medium |
| Scalability | 5/10 | ⚠️ Limited | High |
| Compliance | 7.5/10 | ✅ Good | Low |

**Overall Organization Score**: **6.2/10** (Needs Improvement)

---

## 8. Critical Recommendations

### 🔥 Immediate (This Week)

1. **Fix .gitignore** - Add missing entries for generated files
2. **Delete/Secure Bootstrap Script** - `apply-pulumi-config.ps1` contains exposed secrets
3. **Archive Dead Code** - Move or delete `mongodb-atlas.ts`

### ⚡ Short-Term (This Month)

4. **Create Stack Strategy** - Add test/prod stacks
5. **Reorganize Folder Structure** - See folder-structure-proposal.md
6. **Document Standards** - Create naming and organization guide

### 📋 Medium-Term (This Quarter)

7. **Add Automation** - Pre-commit hooks, drift detection
8. **Enhance CI/CD** - PR previews, cost estimation
9. **Improve Monitoring** - Logging, alerting setup

---

**Review Conducted By**: GitHub Copilot AI Agent  
**Date**: 2025-11-11
