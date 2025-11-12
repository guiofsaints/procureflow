# Proposed Folder Structure for Pulumi Infrastructure

**Target State**: Multi-stack, scalable, maintainable infrastructure organization

---

## 1. Proposed Structure

```
packages/infra/
├── compose.yaml
├── package.json
├── docker/
│   ├── Dockerfile.web
│   └── mongo-init/
├── env/
│   ├── .env.web
│   └── .env.mongo
└── pulumi/
    ├── README.md                    # Overview of all Pulumi projects
    ├── shared/                      # Shared utilities across providers
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── naming.ts                # Naming conventions
    │   ├── tagging.ts               # Standard resource tags
    │   └── types.ts                 # Shared TypeScript types
    └── gcp/                         # GCP infrastructure
        ├── package.json
        ├── tsconfig.json
        ├── .gitignore               # Project-specific gitignore
        ├── README.md                # GCP project overview
        ├── Pulumi.yaml              # Project metadata
        ├── project/                 # Source code
        │   ├── index.ts             # Main entry point
        │   ├── providers.ts         # GCP provider config
        │   ├── compute/
        │   │   ├── cloudrun.ts
        │   │   └── artifact-registry.ts
        │   ├── security/
        │   │   └── secrets.ts
        │   └── data/
        │       └── mongodb-atlas.ts  # Archived/optional
        ├── stacks/                  # Stack-specific configs
        │   ├── dev/
        │   │   ├── Pulumi.dev.yaml
        │   │   └── README.md
        │   ├── test/
        │   │   ├── Pulumi.test.yaml
        │   │   └── README.md
        │   └── prod/
        │       ├── Pulumi.prod.yaml
        │       └── README.md
        ├── scripts/                 # Automation scripts
        │   ├── README.md
        │   ├── setup/
        │   │   ├── bootstrap-config.sh
        │   │   └── bootstrap-config.ps1
        │   └── ci-cd/
        │       ├── setup-github-secrets.sh
        │       └── setup-github-secrets.ps1
        ├── docs/                    # Documentation
        │   ├── architecture.md
        │   ├── setup.md
        │   ├── runbook.md
        │   ├── troubleshooting.md
        │   └── cost-estimates.md
        └── tests/                   # Infrastructure tests
            └── pulumi-test.ts
```

---

## 2. Key Changes Explained

### 2.1 New `project/` Folder

**Why**: Separates source code from config, stacks, scripts  
**Organization**:
- `compute/` - Cloud Run, Artifact Registry
- `security/` - Secrets, IAM, service accounts
- `data/` - Databases, storage (MongoDB Atlas archived here)

**Benefits**:
- Clear module boundaries
- Easy to find specific resource types
- Scales as infrastructure grows

---

### 2.2 New `stacks/` Folder

**Why**: Environment-specific configurations  
**Structure**:
```
stacks/
├── dev/
│   ├── Pulumi.dev.yaml      # Stack config
│   └── README.md            # Dev-specific notes
├── test/
└── prod/
```

**Migration**:
```bash
# Current: Pulumi.dev.yaml in root
# Target: stacks/dev/Pulumi.dev.yaml
mv Pulumi.dev.yaml stacks/dev/
```

**Pulumi CLI Support**:
Pulumi automatically searches parent directories for stack files.

---

### 2.3 New `shared/` Folder

**Purpose**: Reusable utilities across GCP/AWS/Azure

**Files**:
- `naming.ts`: Standardized naming functions
  ```typescript
  export function getResourceName(type: string, env: string, region: string) {
    return `procureflow-${type}-${env}-${region}`;
  }
  ```
- `tagging.ts`: Standard labels/tags
  ```typescript
  export function getStandardLabels(env: string) {
    return {
      environment: env,
      managed_by: 'pulumi',
      project: 'procureflow',
    };
  }
  ```

---

### 2.4 `scripts/` Reorganization

**Current Issues**:
- Scripts in root mixed with code
- No cross-platform equivalents
- One-time vs reusable not separated

**Proposed**:
- `scripts/setup/` - One-time bootstrap scripts
- `scripts/ci-cd/` - CI/CD automation

**Cross-Platform**:
Each script has `.sh` and `.ps1` versions

---

### 2.5 `docs/` Folder

**Why**: Separate docs from code  
**Files**:
- `architecture.md` - Diagrams, ADRs
- `setup.md` - From current SETUP.md
- `runbook.md` - Operational procedures
- `troubleshooting.md` - Common issues

---

## 3. Migration Plan

### Phase 1: Immediate (No Breaking Changes)

```bash
# 1. Create new folders
mkdir -p project/{compute,security,data}
mkdir -p stacks/{dev,test,prod}
mkdir -p scripts/{setup,ci-cd}
mkdir -p docs
mkdir -p shared

# 2. Move files
mv index.ts project/
mv cloudrun.ts project/compute/
mv secrets.ts project/security/
mv mongodb-atlas.ts project/data/

# 3. Move configs
mv Pulumi.dev.yaml stacks/dev/

# 4. Move scripts
mv setup-github-secrets.ps1 scripts/ci-cd/
mv apply-pulumi-config.ps1 scripts/setup/ # Or delete

# 5. Move docs
mv SETUP.md docs/setup.md
mv README.md docs/README.md
cp docs/README.md README.md  # Keep root README
mv INFRAESTRUTURA_GCP_RELATORIO.md docs/architecture-pt.md

# 6. Update tsconfig.json
# Change include: ["index.ts"] to include: ["project/index.ts"]
```

### Phase 2: Update Imports

**project/index.ts**:
```typescript
// Old:
import { createSecrets } from './secrets';
import { createCloudRunService } from './cloudrun';

// New:
import { createSecrets } from './security/secrets';
import { createCloudRunService } from './compute/cloudrun';
```

### Phase 3: Test

```bash
# Validate Pulumi can find stack
pulumi stack select dev

# Preview (should show no changes)
pulumi preview

# If no changes, migration successful ✅
```

---

## 4. Pulumi.yaml Updates

### Current
```yaml
name: procureflow-gcp
runtime: nodejs
description: ProcureFlow infrastructure on Google Cloud Platform (FREE TIER)
```

### Proposed
```yaml
name: procureflow-gcp
runtime: nodejs
description: ProcureFlow GCP Infrastructure (Multi-stack: dev/test/prod)
main: project/index.ts

config:
  procureflow-gcp:environment:
    description: Deployment environment (dev, test, prod)
    type: string
    default: dev
  procureflow-gcp:region:
    description: GCP region
    type: string
    default: us-central1
```

**Benefits**:
- Explicit `main` entrypoint
- Config schema with validation
- Self-documenting

---

## 5. .gitignore Additions

**New `.gitignore` in `pulumi/gcp/`**:
```gitignore
# Compiled output
dist/
*.js
*.js.map

# Pulumi
stack-backup.json
.pulumi/

# Secrets
*-key.json
*-secrets*.txt
github-actions-key.json
github-secrets-output.txt

# Environment
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# Logs
*.log
npm-debug.log*
```

---

## 6. Benefits of New Structure

| Benefit | Current | Proposed | Impact |
|---------|---------|----------|--------|
| **Code Organization** | Flat, all in root | Hierarchical by type | High |
| **Scalability** | Hard to add envs | Easy multi-stack | High |
| **Discoverability** | Mixed files | Clear separation | Medium |
| **Maintainability** | Moderate | High | Medium |
| **Onboarding** | Confusing | Clear structure | High |
| **CI/CD** | Single env | Multi-env support | High |

---

## 7. Comparison: Current vs Proposed

### Current (18 files in root)
```
gcp/
├── index.ts
├── cloudrun.ts
├── secrets.ts
├── mongodb-atlas.ts
├── Pulumi.yaml
├── Pulumi.dev.yaml
├── package.json
├── tsconfig.json
├── setup-github-secrets.ps1
├── apply-pulumi-config.ps1
├── README.md
├── SETUP.md
├── INFRAESTRUTURA_GCP_RELATORIO.md
├── dist/                       # Generated, should be ignored
├── node_modules/
└── stack-backup.json           # Generated, should be ignored
```

**Issues**: Hard to find things, no clear separation

---

### Proposed (Organized hierarchy)
```
gcp/
├── project/        # 4 files (organized by type)
├── stacks/         # 3 folders (by environment)
├── scripts/        # 2 folders (by purpose)
├── docs/           # 5 files (all documentation)
├── shared/         # 3 files (utilities)
├── tests/          # 1 file (infrastructure tests)
├── Pulumi.yaml     # Metadata only
├── package.json    # Dependencies only
├── tsconfig.json   # TS config only
├── .gitignore      # Ignore rules
└── README.md       # Overview
```

**Benefits**: Clear, scalable, maintainable

---

## 8. Adoption Strategy

### Option A: Big Bang (1 day)
- Migrate all at once
- Update all imports
- Test thoroughly
- **Risk**: High (could break deployment)
- **Benefit**: Clean cut, no hybrid state

### Option B: Incremental (1 week)
- Day 1: Create new folders, keep old files
- Day 2: Move docs, scripts
- Day 3: Move TS files, update imports
- Day 4: Move stack configs
- Day 5: Test, validate, delete old files
- **Risk**: Low (gradual, can rollback)
- **Benefit**: Safe, validated each step

**Recommendation**: **Option B** (Incremental)

---

## 9. Future Enhancements

### Multi-Provider Support
```
pulumi/
├── shared/
├── gcp/
├── aws/           # Future: AWS resources
└── azure/         # Future: Azure resources
```

### Multi-Region Support
```
gcp/
└── project/
    ├── global/           # Global resources (DNS, IAM)
    ├── us-central1/      # Regional resources
    └── southamerica-east1/  # Future: Brazil region
```

---

## 10. Success Criteria

Migration is successful when:
- ✅ `pulumi preview` shows no changes
- ✅ All TS files compile without errors
- ✅ All imports resolve correctly
- ✅ CI/CD pipeline passes
- ✅ Documentation updated
- ✅ Team onboarded to new structure

---

**Proposal Created By**: GitHub Copilot AI Agent  
**Date**: 2025-11-11  
**Status**: Draft for Review
