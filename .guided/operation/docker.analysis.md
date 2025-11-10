# Docker Infrastructure Analysis

**Project**: ProcureFlow Monorepo  
**Date**: 2025-11-09  
**Analyzer**: DevOps Engineer

## Current State Summary

### Existing Infrastructure

**Location**: `docker-compose.yml` at repo root, `packages/infra/docker/Dockerfile.web`

**Docker Compose Configuration**:

- Version: 3.8
- Services: web, mongo, mongo-express
- Network: procureflow-network (bridge)
- Volumes: mongo_data (local)
- Profiles: debug (for mongo-express only)

**Dockerfile.web**:

- Base: node:18-alpine
- Build context: repo root (expects `apps/web` structure)
- pnpm installation: global via npm
- Standalone output: Yes (.next/standalone)
- User: nextjs (uid 1001)
- Healthcheck: Custom Node.js script

**pnpm Scripts** (root package.json):

- `docker:up`, `docker:down`, `docker:build`, `docker:db`
- All reference `docker-compose.yml` at root

### Issues Identified

#### Critical Issues

1. **Node Version Mismatch**
   - Current: Node 18-alpine
   - Required: Node 20 LTS
   - Risk: Incompatibility with modern dependencies, missing security patches

2. **Build Context Mismatch**
   - Dockerfile expects `apps/web` directory
   - Actual structure: `packages/web`
   - Impact: Build will fail immediately

3. **PNPM Installation Method**
   - Current: Global install via npm
   - Best practice: Use corepack (built-in package manager)
   - Missing: PNPM cache mount for faster builds

4. **Hardcoded Secrets in Compose**
   - NEXTAUTH_SECRET, mongo credentials exposed in compose file
   - Risk: Accidental secret commits, security vulnerabilities
   - Missing: env_file structure

5. **Healthcheck Implementation**
   - Dockerfile includes inline healthcheck script
   - Better: Rely on compose healthcheck only (cleaner separation)
   - Current mongo healthcheck uses `mongosh` correctly

#### Moderate Issues

6. **Missing Profiles**
   - No dev profile for development mode
   - mongo-express under debug profile ✓ (correct)

7. **MongoDB Authentication**
   - Missing `?authSource=admin` in connection strings
   - May cause auth failures for root user connections

8. **Infrastructure Organization**
   - compose.yaml should be in `packages/infra`
   - Current: Root level (less modular)

9. **Missing Environment Templates**
   - No .env.example for guidance
   - No env/ directory structure

#### Minor Issues

10. **Compose File Location**
    - Scripts reference root-level compose
    - Should reference `packages/infra/compose.yaml`

11. **Missing Validation**
    - No preflight checks (hadolint, compose config)
    - No documented acceptance criteria

## Before/After Comparison

| Aspect               | Before                      | After                       |
| -------------------- | --------------------------- | --------------------------- |
| **Node Version**     | 18-alpine                   | 20-alpine                   |
| **PNPM Setup**       | Global via npm              | corepack enable             |
| **Cache Mount**      | None                        | --mount=type=cache for pnpm |
| **Build Context**    | apps/web (wrong)            | packages/web (correct)      |
| **Secrets**          | Hardcoded in compose        | env_file structure          |
| **Healthcheck**      | Inline script in Dockerfile | Compose-only (cleaner)      |
| **Compose Location** | Root                        | packages/infra/compose.yaml |
| **Profiles**         | debug only                  | prod, dev, debug            |
| **Auth String**      | Missing authSource          | ?authSource=admin           |
| **Env Templates**    | None                        | .env.example + placeholders |
| **Scripts Location** | Root package.json           | packages/infra/package.json |
| **Validation**       | None                        | Preflight checks documented |

## Security & Best Practices Assessment

### Security Improvements Needed

- ✅ Non-root user (already implemented)
- ❌ Secrets in env_file (needs implementation)
- ✅ Minimal base image (alpine)
- ❌ PNPM cache mount (missing)
- ✅ Healthchecks present
- ❌ MongoDB authSource explicit (missing)

### Docker Best Practices

- ✅ Multi-stage build
- ❌ Layer optimization with cache mounts
- ✅ Standalone Next.js output
- ❌ Build context aligned with monorepo structure
- ✅ Minimal dependencies in runner stage
- ❌ Package manager via corepack (missing)

## Risk Assessment

### High Risk

- **Build Failure**: Wrong directory structure will cause immediate failure
- **Secret Exposure**: Hardcoded secrets may leak to version control

### Medium Risk

- **Auth Failures**: Missing authSource may break MongoDB connections
- **Performance**: No PNPM cache mount = slower builds
- **Version Lag**: Node 18 approaching EOL vs Node 20 LTS

### Low Risk

- **Maintainability**: Compose at root vs packages/infra (organizational)
- **Documentation**: Missing runbooks and validation steps

## Acceptance Criteria Checklist

- [ ] Dockerfile.web uses node:20-alpine
- [ ] corepack enabled, pnpm via corepack
- [ ] PNPM cache mount during install
- [ ] Non-root user (uid 1001) ✓ (already compliant)
- [ ] CMD ['node', 'server.js'] ✓ (already compliant)
- [ ] No custom healthcheck in Dockerfile
- [ ] compose.yaml in packages/infra
- [ ] Build context: ../.. (from infra)
- [ ] Dockerfile path: packages/infra/docker/Dockerfile.web
- [ ] env_file for web and mongo
- [ ] Healthcheck for web (curl /api/health) ✓ (already present)
- [ ] Healthcheck for mongo (mongosh ping) ✓ (already present)
- [ ] mongo-express only under debug profile ✓ (already compliant)
- [ ] Profiles: prod, dev, debug
- [ ] MONGODB_URI includes ?authSource=admin
- [ ] .env.example with safe defaults
- [ ] pnpm scripts: docker:build, docker:up, docker:up:dev, docker:down, docker:db
- [ ] Preflight validation (compose config, hadolint)
- [ ] Functional checks logged (curl /api/health, mongosh ping)
- [ ] No real secrets committed

## Recommended Changes Priority

### Phase 1: Critical (Blocking)

1. Update Dockerfile to Node 20, fix build context paths
2. Implement env_file structure, remove hardcoded secrets
3. Move compose.yaml to packages/infra
4. Update pnpm scripts to reference new location

### Phase 2: Important

5. Enable corepack, add PNPM cache mounts
6. Add MongoDB authSource to connection strings
7. Remove inline healthcheck script from Dockerfile
8. Implement prod/dev profiles

### Phase 3: Documentation & Validation

9. Create .env.example templates
10. Add preflight validation steps
11. Document build/run procedures in runlog
12. Capture acceptance criteria verification

## Next Steps

Proceed to `.guided/operation/docker.plan.md` for detailed implementation plan.
