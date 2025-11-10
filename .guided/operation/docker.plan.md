# Docker Infrastructure Implementation Plan

**Project**: ProcureFlow Monorepo  
**Date**: 2025-11-09  
**Engineer**: DevOps  
**Version**: 1.0.0

## Executive Summary

This plan outlines the hardening and standardization of Docker infrastructure for the ProcureFlow pnpm monorepo. The implementation follows best practices for Node.js containerization, secret management, and multi-environment support.

## Target Architecture

### Docker Image (Dockerfile.web)

**Base Image**: `node:20-alpine`

- Rationale: LTS support until April 2026, minimal attack surface

**Package Manager**: pnpm via corepack

- Rationale: Native Node.js tool, no additional installation overhead
- Implementation: `corepack enable && corepack prepare pnpm@latest --activate`

**Build Stages**:

1. **base**: Enable corepack, set up pnpm
2. **builder**: Install dependencies with cache mount, build Next.js
3. **runner**: Copy standalone output, run as non-root

**Cache Strategy**:

```dockerfile
--mount=type=cache,target=/root/.local/share/pnpm/store
```

- Rationale: Persistent layer cache across builds, 70%+ faster rebuilds

**Security**:

- User: nextjs (uid 1001, gid 1001)
- No root processes
- Minimal dependencies in runner stage

### Docker Compose (compose.yaml)

**Location**: `packages/infra/compose.yaml`

- Rationale: Modular structure, aligns with monorepo organization

**Profiles**:

- **prod**: web + mongo (production-like)
- **dev**: web (dev mode) + mongo (future: bind mount for hot reload)
- **debug**: prod + mongo-express

**Environment Management**:

- `env_file`: Load from `packages/infra/env/.env.web` and `.env.mongo`
- No hardcoded secrets in compose file
- `.env.example` provides safe defaults

**Build Context**:

```yaml
web:
  build:
    context: ../.. # repo root
    dockerfile: packages/infra/docker/Dockerfile.web
```

- Rationale: Access entire monorepo for pnpm workspace resolution

**Healthchecks**:

- **web**: `curl -f http://localhost:3000/api/health` (interval: 30s)
- **mongo**: `mongosh --eval "db.adminCommand('ping')"` (interval: 10s)
- Rationale: Ensures service readiness before dependent services start

**MongoDB Connection**:

- URI includes `?authSource=admin` for root user authentication
- Mongo Express URL: `mongodb://admin:password@mongo:27017/?authSource=admin`

### pnpm Scripts (packages/infra/package.json)

```json
{
  "scripts": {
    "docker:build": "docker compose -f compose.yaml build",
    "docker:up": "docker compose -f compose.yaml --profile prod up -d",
    "docker:up:dev": "docker compose -f compose.yaml --profile dev up -d",
    "docker:down": "docker compose -f compose.yaml down -v",
    "docker:db": "docker compose -f compose.yaml exec mongo mongosh --eval \"db.adminCommand('ping')\""
  }
}
```

## Implementation Steps

### Step 1: Create Dockerfile.web

**File**: `packages/infra/docker/Dockerfile.web`

**Key Changes**:

- ❌ Remove: Node 18, global pnpm install, inline healthcheck script
- ✅ Add: Node 20, corepack, PNPM cache mount, correct build paths

**Build Path Corrections**:

```dockerfile
# OLD (incorrect)
COPY apps/web/package.json ./apps/web/

# NEW (correct)
COPY packages/web/package.json ./packages/web/
```

**PNPM Cache Mount**:

```dockerfile
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
```

**Standalone Output**:

```dockerfile
COPY --from=builder /app/packages/web/.next/standalone ./
COPY --from=builder /app/packages/web/.next/static ./.next/static
COPY --from=builder /app/packages/web/public ./public
```

### Step 2: Create compose.yaml

**File**: `packages/infra/compose.yaml`

**Key Changes**:

- Move from root to `packages/infra/`
- Replace hardcoded env vars with `env_file` references
- Add profiles: prod, dev, debug
- Explicit authSource in MongoDB URIs

**Service Definitions**:

```yaml
web:
  build:
    context: ../..
    dockerfile: packages/infra/docker/Dockerfile.web
  env_file:
    - env/.env.web
  depends_on:
    mongo:
      condition: service_healthy
  profiles:
    - prod
    - dev
```

### Step 3: Create Environment Templates

**Files**:

- `packages/infra/env/.env.example`
- `packages/infra/env/.env.web` (placeholder)
- `packages/infra/env/.env.mongo` (placeholder)

**Template Structure**:

```env
# .env.example
# Next.js Application
NODE_ENV=production
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# MongoDB Connection
MONGODB_URI=mongodb://admin:password@mongo:27017/procureflow?authSource=admin

# Optional: OpenAI
# OPENAI_API_KEY=sk-...
```

**Security Notes**:

- Add `packages/infra/env/.env.*` to `.gitignore` (except `.env.example`)
- Document secret generation in README

### Step 4: Update pnpm Scripts

**File**: `packages/infra/package.json`

**Create if missing**, otherwise merge scripts:

```json
{
  "name": "@procureflow/infra",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "docker:build": "docker compose -f compose.yaml build",
    "docker:up": "docker compose -f compose.yaml --profile prod up -d",
    "docker:up:dev": "docker compose -f compose.yaml --profile dev up -d",
    "docker:down": "docker compose -f compose.yaml down -v",
    "docker:db": "docker compose -f compose.yaml exec mongo mongosh --eval \"db.adminCommand('ping')\""
  }
}
```

**Update Root Scripts** (delegate to infra):

```json
{
  "scripts": {
    "docker:build": "pnpm --filter @procureflow/infra docker:build",
    "docker:up": "pnpm --filter @procureflow/infra docker:up",
    "docker:up:dev": "pnpm --filter @procureflow/infra docker:up:dev",
    "docker:down": "pnpm --filter @procureflow/infra docker:down",
    "docker:db": "pnpm --filter @procureflow/infra docker:db"
  }
}
```

### Step 5: Preflight Validation

**Validation Steps**:

1. **Syntax Check**: `docker compose -f packages/infra/compose.yaml config`
2. **Dockerfile Lint**: `docker run --rm -i hadolint/hadolint < packages/infra/docker/Dockerfile.web`
3. **Env Verification**: Check required vars exist in .env.web and .env.mongo

**Acceptance Criteria**:

- [ ] Compose config outputs valid merged YAML
- [ ] Hadolint reports zero errors (warnings acceptable)
- [ ] All required env vars present with placeholder values

### Step 6: Build & Test Cycle

**Build**:

```bash
pnpm --filter @procureflow/infra docker:build
```

**Start Stack**:

```bash
pnpm --filter @procureflow/infra docker:up
```

**Health Verification**:

```bash
# Wait for healthy state
docker ps --filter "name=procureflow" --format "table {{.Names}}\t{{.Status}}"

# Test web health
curl -f http://localhost:3000/api/health

# Test mongo ping
pnpm --filter @procureflow/infra docker:db
```

**Debug Profile Test**:

```bash
docker compose -f packages/infra/compose.yaml --profile debug up -d
# Verify mongo-express at http://localhost:8081
```

**Cleanup**:

```bash
pnpm --filter @procureflow/infra docker:down
```

## Migration Checklist

### Pre-Migration

- [x] Backup existing docker-compose.yml
- [ ] Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Create env files from .env.example
- [ ] Verify Docker 24+ and Compose V2 installed
- [ ] Verify ports 3000, 27017, 8081 available

### Migration Steps

- [ ] Create packages/infra/env/.env.example
- [ ] Copy to .env.web and .env.mongo with real values
- [ ] Update packages/infra/docker/Dockerfile.web
- [ ] Create packages/infra/compose.yaml
- [ ] Create/update packages/infra/package.json
- [ ] Update root package.json scripts
- [ ] Add env/_.env._ to .gitignore

### Validation

- [ ] Run preflight checks (compose config, hadolint)
- [ ] Build images successfully
- [ ] Start stack, verify healthchecks
- [ ] Test /api/health endpoint
- [ ] Test mongosh ping
- [ ] Test mongo-express under debug profile
- [ ] Stop and clean up

### Post-Migration

- [ ] Archive old docker-compose.yml (move to .archive/)
- [ ] Update README.md with new commands
- [ ] Document env var requirements
- [ ] Commit changes with conventional commit message

## Rollback Plan

### Immediate Rollback (Build Failure)

```bash
# Restore previous files
git checkout HEAD -- docker-compose.yml packages/infra/docker/Dockerfile.web

# Use old commands
docker-compose build
docker-compose up -d
```

### Partial Rollback (Runtime Issues)

1. Stop new stack: `pnpm --filter @procureflow/infra docker:down`
2. Identify issue from logs: `docker compose -f packages/infra/compose.yaml logs`
3. Fix specific issue (env var, healthcheck timeout, etc.)
4. Rebuild only affected service: `docker compose build web`
5. Retry startup

### Complete Rollback (Validation Failure)

1. Document failure mode in runlog
2. Restore all files: `git checkout HEAD -- packages/infra/ package.json`
3. Use old workflow for immediate needs
4. Address root cause before retry

## Risk Mitigation

### Build Context Mismatch

- **Risk**: Paths hardcoded for apps/web instead of packages/web
- **Mitigation**: Validate build with `docker build --progress=plain` to see exact failures
- **Fallback**: Symlink apps/web → packages/web (temporary)

### Port Conflicts

- **Risk**: 3000, 27017, 8081 already in use
- **Mitigation**: Document alternate ports in .env.example
- **Override**: Use `ports: - "3001:3000"` in compose override file

### Secret Exposure

- **Risk**: Real secrets committed to git
- **Mitigation**: Add pre-commit hook to reject .env.web/.env.mongo
- **Detection**: Run `git log --all --full-history -- "**/env/.env.*"` to check history

### Healthcheck Timeouts

- **Risk**: App takes >40s to start, healthcheck fails
- **Mitigation**: Increase `start_period` to 60s if needed
- **Monitoring**: `docker compose logs -f web` during startup

## Acceptance Criteria Summary

### Dockerfile Compliance

- [x] Base: node:20-alpine
- [x] PNPM: via corepack
- [x] Cache: --mount during install
- [x] User: nextjs (1001)
- [x] CMD: node server.js
- [x] No inline healthcheck

### Compose Compliance

- [x] Location: packages/infra/compose.yaml
- [x] Build context: ../.. from infra
- [x] env_file: for web and mongo
- [x] Healthchecks: curl and mongosh
- [x] Profiles: prod, dev, debug
- [x] mongo-express: debug only
- [x] authSource: explicit in URIs

### Environment Compliance

- [x] .env.example with documentation
- [x] No hardcoded secrets in compose
- [x] Placeholder .env.web and .env.mongo

### Scripts Compliance

- [x] docker:build, docker:up, docker:up:dev, docker:down, docker:db
- [x] Located in packages/infra/package.json
- [x] Root package.json delegates to infra

### Validation Compliance

- [ ] Compose config validates
- [ ] Hadolint passes (or warnings only)
- [ ] Build completes successfully
- [ ] Healthchecks pass
- [ ] /api/health returns 200
- [ ] mongosh ping returns ok
- [ ] mongo-express accessible under debug

## Success Metrics

- **Build Time**: <5 minutes initial, <2 minutes with cache
- **Startup Time**: <60s to healthy state
- **Image Size**: <500MB (alpine base)
- **Security**: Zero critical vulnerabilities (docker scout)
- **Reliability**: 100% healthcheck pass rate

## Next Steps

After implementation:

1. Document results in `.guided/operation/docker.runlog.md`
2. Capture diffs in `.guided/operation/docker.changes.md`
3. Prepare conventional commit message
4. Create PR with all documentation
5. Plan CI integration (build on PR, healthcheck test)
6. Future: Dev override with bind mount for hot reload
