# ProcureFlow Docker Infrastructure - Improvement Plan

**Date**: November 11, 2025  
**Status**: Draft v1.0  
**Stakeholders**: DevOps, Security, Backend, SRE, Platform, DX  
**Priority Framework**: P0 (Critical) → P1 (High) → P2 (Medium) → P3 (Low)

---

## Plan Overview

This document provides an **actionable roadmap** to address the 18 findings from the Docker infrastructure assessment. Improvements are grouped by **theme** and prioritized by **impact, risk, and effort**.

**Timeline Summary**:

- **Week 1**: P0 (Critical) - Restore build functionality, fix blocking issues
- **Weeks 2-3**: P1 (High) - Security hardening, reliability improvements
- **Weeks 4-6**: P2 (Medium) - Developer experience, observability
- **Month 2+**: P3 (Low/Nice-to-have) - Advanced features, optimization

---

## Theme 1: Build System Recovery

**Objective**: Restore Docker build functionality to enable all downstream workflows.

### P0-BUILD-001: Fix Module Resolution in Dockerfile ⚠️ CRITICAL

**Finding ID**: BUILD-001  
**Effort**: 4-8 hours  
**Owner**: DevOps/Platform Team  
**Dependencies**: None  
**Risk if not fixed**: Complete inability to build or deploy web application

**Problem**:

```dockerfile
# Current (broken) - Dockerfile.web:38
RUN ln -s /app/node_modules /app/packages/web/node_modules
```

Symlink causes `MODULE_NOT_FOUND` for Next.js during `pnpm build`.

**Solution Options**:

**Option A: Install dependencies in workspace root AND package** (Recommended)

```dockerfile
# After installing root deps
WORKDIR /app/packages/web

# Install package-specific deps (respects PNPM hoisting)
RUN pnpm install --frozen-lockfile --prefer-offline

# Build from package directory
RUN pnpm build
```

**Option B: Use --shamefully-hoist for Next.js compatibility**

```dockerfile
# In builder stage
WORKDIR /app
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile --shamefully-hoist

# No symlink needed - all deps in /app/node_modules
WORKDIR /app/packages/web
RUN pnpm build
```

**Option C: Use standalone Next.js output correctly**

```dockerfile
# After build
COPY --from=builder /app/packages/web/.next/standalone/packages/web ./
COPY --from=builder /app/packages/web/.next/static ./packages/web/.next/static
COPY --from=builder /app/packages/web/public ./packages/web/public

# Update CMD
CMD ["node", "packages/web/server.js"]
```

**Acceptance Criteria**:

- [ ] `pnpm --filter @procureflow/infra docker:build` completes successfully
- [ ] Build time < 3 minutes with warm cache
- [ ] No MODULE_NOT_FOUND errors
- [ ] Next.js standalone output verified
- [ ] Image size < 500MB

**Validation Commands**:

```bash
# Build
pnpm --filter @procureflow/infra docker:build

# Inspect image
docker images procureflow-web:latest --format "{{.Size}}"

# Test run (after fixing env issues)
docker run --rm -p 3000:3000 -e MONGODB_URI="..." procureflow-web:latest
curl http://localhost:3000/api/health
```

---

### P0-BUILD-002: Add .dockerignore File ⚠️ CRITICAL

**Finding ID**: BUILD-002  
**Effort**: < 1 hour  
**Owner**: DevOps Team  
**Dependencies**: None  
**Impact**: 83% reduction in build context size, 80% faster context transfer

**Current State**:

- Build context: 294.69MB
- Context transfer: 24.2 seconds
- Includes: host node_modules, .git, build artifacts, logs

**Action**:

Create `c:\Workspace\procureflow\.dockerignore`:

```gitignore
# Dependencies
node_modules/
.pnpm-store/
.pnpm/

# Build outputs
.next/
dist/
build/
out/
.turbo/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Environment files (keep example)
.env*
!.env.example

# Version control
.git/
.gitignore
.gitattributes

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Documentation (keep only README)
*.md
!README.md

# Test and coverage
coverage/
.nyc_output/
test-results/

# Assessment outputs (don't include in image)
.guided/

# Misc
.cache/
.temp/
tmp/
```

**Acceptance Criteria**:

- [ ] File created at repository root
- [ ] Build context size < 50MB
- [ ] Context transfer time < 5 seconds
- [ ] README.md still included in image
- [ ] All required source files present in build

**Validation**:

```bash
# Check build context size
docker build -f packages/infra/docker/Dockerfile.web --no-cache --progress=plain . 2>&1 | grep "transferring context"

# Should show < 50MB
```

---

### P1-BUILD-003: Optimize Build Cache Layering

**Finding ID**: BUILD-003  
**Effort**: 2-3 hours  
**Owner**: DevOps Team  
**Dependencies**: BUILD-001, BUILD-002  
**Impact**: Faster iteration during development

**Current Layer Order**:

1. Base setup (CACHED)
2. Copy manifests (CACHED when unchanged)
3. Install deps (CACHED when lockfile unchanged)
4. **Copy source (INVALIDATES on every code change)**
5. Build (always runs if source changes)

**Improved Layer Order**:

```dockerfile
# 1. System dependencies (rarely change)
FROM node:20-alpine AS base
RUN apk add --no-cache curl
RUN corepack enable && corepack prepare pnpm@latest --activate

# 2. Package manifests (change on dependency updates only)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/web/package.json ./packages/web/
COPY tsconfig.json ./

# 3. Install dependencies (leverage cache mount)
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile

# 4. Copy source AFTER deps installed
COPY packages/web ./packages/web

# 5. Build (only runs when source changes)
WORKDIR /app/packages/web
RUN pnpm build
```

**Additional Optimization - Multi-mount Cache**:

```dockerfile
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    --mount=type=cache,target=/app/.next/cache \
    pnpm build
```

**Acceptance Criteria**:

- [ ] Dependency layer cached across builds when lockfile unchanged
- [ ] Source code changes don't invalidate dependency cache
- [ ] Next.js build cache persisted between builds
- [ ] Rebuild time < 30 seconds for code-only changes

---

## Theme 2: Security Hardening

**Objective**: Eliminate critical security vulnerabilities before production deployment.

### P0-SEC-005: Secure MongoDB Access ⚠️ CRITICAL

**Finding ID**: SEC-005  
**Effort**: 4-6 hours  
**Owner**: Security/DevOps  
**Dependencies**: None  
**Risk**: Database compromise, data breach, ransomware

**Current State**:

```yaml
mongo:
  ports:
    - '27017:27017' # Exposed to 0.0.0.0
  environment:
    MONGO_INITDB_ROOT_PASSWORD: password # Weak default
```

**Multi-Layer Fix**:

**Layer 1: Remove Port Exposure in Production**

```yaml
mongo:
  ports:
    - '27017:27017'
  profiles:
    - dev
    - debug
  # NOT in prod profile - internal network only
```

**Layer 2: Enforce Strong Passwords**

```bash
# Script: packages/infra/scripts/validate-secrets.sh
#!/bin/bash

if [ "$NODE_ENV" = "production" ]; then
  if grep -q "password" env/.env.mongo; then
    echo "ERROR: Default MongoDB password detected in production!"
    exit 1
  fi

  # Check password strength
  PASSWORD=$(grep MONGO_INITDB_ROOT_PASSWORD env/.env.mongo | cut -d'=' -f2)
  if [ ${#PASSWORD} -lt 16 ]; then
    echo "ERROR: MongoDB password must be at least 16 characters!"
    exit 1
  fi
fi
```

**Layer 3: Network Isolation**

```yaml
# Add to compose.yaml
networks:
  procureflow-network:
    driver: bridge
    internal: true # Blocks external access

  procureflow-public:
    driver: bridge

services:
  web:
    networks:
      - procureflow-public # Internet-facing
      - procureflow-network # Internal

  mongo:
    networks:
      - procureflow-network # Internal only
    # No ports mapping in prod
```

**Layer 4: IP Allowlisting (dev/debug only)**

```yaml
mongo:
  ports:
    - '127.0.0.1:27017:27017' # Only localhost
  # OR with firewall rules
```

**Acceptance Criteria**:

- [ ] Prod profile: No MongoDB port exposed
- [ ] Dev profile: Port exposed only to 127.0.0.1
- [ ] Validation script rejects weak passwords
- [ ] Internal network isolation tested
- [ ] Documentation updated with security model

---

### P1-SEC-001: Pin Base Images by Digest

**Finding ID**: SEC-001  
**Effort**: 3-4 hours (including CI automation)  
**Owner**: Security/DevOps  
**Dependencies**: None  
**Impact**: Prevent supply chain attacks, reproducible builds

**Action Plan**:

**Step 1: Get Current Digests**

```bash
# Dockerfile.web
docker pull node:20-alpine
docker inspect node:20-alpine --format '{{index .RepoDigests 0}}'
# Output: node:20-alpine@sha256:6178e78b972f79c335df281f4b7674a2d85071aae2af020ffa39f0a770265435

# compose.yaml
docker pull mongo:7.0
docker inspect mongo:7.0 --format '{{index .RepoDigests 0}}'

docker pull mongo-express:1.0.0
docker inspect mongo-express:1.0.0 --format '{{index .RepoDigests 0}}'
```

**Step 2: Update Files**

`Dockerfile.web`:

```dockerfile
FROM node:20-alpine@sha256:6178e78b972f79c335df281f4b7674a2d85071aae2af020ffa39f0a770265435 AS base
# Keep tag comment for readability
# node:20-alpine as of 2025-11-11
```

`compose.yaml`:

```yaml
mongo:
  image: mongo:7.0@sha256:<ACTUAL_DIGEST>
  # mongo:7.0 as of 2025-11-11

mongo-express:
  image: mongo-express:1.0.0@sha256:<ACTUAL_DIGEST>
  # mongo-express:1.0.0 as of 2025-11-11
```

**Step 3: Automate Digest Updates**

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: 'docker'
    directory: '/packages/infra/docker'
    schedule:
      interval: 'weekly'
    open-pull-requests-limit: 5

  - package-ecosystem: 'docker'
    directory: '/'
    schedule:
      interval: 'weekly'
```

**OR** use Renovate:

```json
{
  "extends": ["config:base"],
  "docker": {
    "enabled": true,
    "pinDigests": true
  },
  "packageRules": [
    {
      "matchDatasources": ["docker"],
      "matchUpdateTypes": ["major"],
      "labels": ["docker", "major-update"]
    }
  ]
}
```

**Acceptance Criteria**:

- [ ] All base images pinned by SHA256 digest
- [ ] Comments indicate tag and update date
- [ ] Dependabot or Renovate configured
- [ ] Weekly digest update PRs automated
- [ ] Build still succeeds with pinned digests

---

### P1-SEC-003: Implement Secrets Management

**Finding ID**: SEC-003  
**Effort**: 1-2 weeks  
**Owner**: Security Team  
**Dependencies**: None  
**Impact**: Prevent credential leaks, enable secret rotation

**Phased Approach**:

**Phase 1: Development (Week 1)**

Option A - Docker Secrets (Swarm/Compose v2.23+):

```yaml
# compose.yaml
secrets:
  mongodb_password:
    file: ./env/.secrets/mongodb_password.txt
  nextauth_secret:
    file: ./env/.secrets/nextauth_secret.txt

services:
  web:
    secrets:
      - nextauth_secret
      - mongodb_password
    environment:
      NEXTAUTH_SECRET_FILE: /run/secrets/nextauth_secret
```

Option B - SOPS (Recommended for Git):

```bash
# Install SOPS
brew install sops  # macOS
# OR
curl -LO https://github.com/mozilla/sops/releases/download/v3.8.1/sops-v3.8.1.linux.amd64

# Encrypt env files
sops encrypt env/.env.web > env/.env.web.enc
sops encrypt env/.env.mongo > env/.env.mongo.enc

# Add to .gitignore
echo ".env.web" >> .gitignore
echo ".env.mongo" >> .gitignore

# Decrypt on use
sops decrypt env/.env.web.enc > env/.env.web
```

**Phase 2: Production (Week 2)**

Integrate with cloud provider:

AWS Secrets Manager:

```yaml
# compose.yaml (ECS task definition)
secrets:
  - name: MONGODB_URI
    valueFrom: arn:aws:secretsmanager:us-east-1:123456:secret:procureflow/mongo-uri
  - name: NEXTAUTH_SECRET
    valueFrom: arn:aws:secretsmanager:us-east-1:123456:secret:procureflow/nextauth
```

Azure Key Vault:

```bash
# Azure CLI
az keyvault secret set --vault-name procureflow-vault --name mongodb-password --value "..."
az keyvault secret set --vault-name procureflow-vault --name nextauth-secret --value "..."

# In Docker (use Azure SDK)
```

HashiCorp Vault:

```bash
# Store secrets
vault kv put secret/procureflow/mongodb password=...
vault kv put secret/procureflow/nextauth secret=...

# Fetch in entrypoint
# Use vault agent or direct API calls
```

**Phase 3: Secret Rotation (Ongoing)**

Create rotation schedule:

```yaml
# .github/workflows/rotate-secrets.yml
name: Rotate Secrets
on:
  schedule:
    - cron: '0 0 1 */3 *' # Quarterly
  workflow_dispatch:

jobs:
  rotate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate new secrets
        run: |
          NEW_SECRET=$(openssl rand -base64 32)
          # Update in vault/secrets manager

      - name: Update services
        run: |
          # Rolling restart with new secrets
```

**Acceptance Criteria**:

- [ ] No plaintext secrets in Git
- [ ] SOPS or equivalent encryption for dev
- [ ] Production uses cloud secrets manager
- [ ] Secret rotation documented
- [ ] Emergency rotation procedure tested
- [ ] CI/CD uses injected secrets

---

### P1-SEC-004: Implement Container Vulnerability Scanning

**Finding ID**: SEC-004  
**Effort**: 4-6 hours  
**Owner**: Security/DevOps  
**Dependencies**: BUILD-001 (need working build)  
**Impact**: Detect CVEs before deployment

**Implementation**:

**Step 1: Add Trivy to Package Scripts**

```json
// packages/infra/package.json
{
  "scripts": {
    "docker:scan": "trivy image --severity HIGH,CRITICAL procureflow-web:latest",
    "docker:scan:full": "trivy image --severity LOW,MEDIUM,HIGH,CRITICAL --format json -o scan-results.json procureflow-web:latest",
    "docker:scan:mongo": "trivy image --severity HIGH,CRITICAL mongo:7.0"
  }
}
```

**Step 2: Install Trivy**

```bash
# macOS
brew install aquasecurity/trivy/trivy

# Linux
wget https://github.com/aquasecurity/trivy/releases/download/v0.48.0/trivy_0.48.0_Linux-64bit.tar.gz
tar zxvf trivy_*.tar.gz
sudo mv trivy /usr/local/bin/

# Windows
choco install trivy

# OR use Docker (no install)
alias trivy='docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy'
```

**Step 3: Create CI/CD Scan Job**

```yaml
# .github/workflows/docker-security.yml
name: Docker Security Scan

on:
  pull_request:
    paths:
      - 'packages/infra/**'
      - 'packages/web/**'
  push:
    branches: [main]

jobs:
  trivy-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: |
          cd packages/infra
          docker compose -f compose.yaml --profile prod build

      - name: Run Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'procureflow-web:latest'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '1' # Fail on vulnerabilities

      - name: Upload results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Scan base images
        run: |
          trivy image --severity HIGH,CRITICAL node:20-alpine
          trivy image --severity HIGH,CRITICAL mongo:7.0
```

**Step 4: Configure Suppression for False Positives**

```yaml
# .trivyignore
# False positive - vulnerability in dev-only package
CVE-2023-12345

# Accepted risk - fix not available, mitigated by network policy
CVE-2024-67890
```

**Acceptance Criteria**:

- [ ] Trivy installed in CI/CD environment
- [ ] `docker:scan` script functional
- [ ] CI pipeline fails on HIGH/CRITICAL CVEs
- [ ] Results uploaded to GitHub Security tab
- [ ] Base images scanned regularly
- [ ] Suppression process documented

---

### P2-SEC-002: Fix Environment Variable Warnings

**Finding ID**: SEC-002  
**Effort**: 2 hours  
**Owner**: DevOps  
**Dependencies**: None  
**Impact**: Clean logs, prevent configuration errors

**Solution A: Use Default Values** (Recommended)

```yaml
# compose.yaml
services:
  mongo-express:
    environment:
      - ME_CONFIG_MONGODB_ADMINUSERNAME=${MONGO_INITDB_ROOT_USERNAME:-admin}
      - ME_CONFIG_MONGODB_ADMINPASSWORD=${MONGO_INITDB_ROOT_PASSWORD:-password}
      - ME_CONFIG_MONGODB_URL=mongodb://${MONGO_INITDB_ROOT_USERNAME:-admin}:${MONGO_INITDB_ROOT_PASSWORD:-password}@mongo:27017/?authSource=admin
```

**Solution B: Load Env Before Compose**

Create wrapper script `packages/infra/scripts/compose-wrapper.sh`:

```bash
#!/bin/bash
set -a  # Auto-export variables
source env/.env.mongo
source env/.env.web
set +a

docker compose -f compose.yaml "$@"
```

Update package.json:

```json
{
  "scripts": {
    "docker:up": "./scripts/compose-wrapper.sh --profile prod up -d",
    "docker:down": "./scripts/compose-wrapper.sh down -v"
  }
}
```

**Acceptance Criteria**:

- [ ] No warnings in docker compose output
- [ ] Services start successfully
- [ ] MongoDB credentials correctly passed
- [ ] Works on Windows (PowerShell) and Unix (bash)

---

## Theme 3: Reliability & Operations

**Objective**: Ensure services are resilient, observable, and production-ready.

### P1-OBS-003: Verify Health Check Endpoint

**Finding ID**: OBS-003  
**Effort**: 2-4 hours  
**Owner**: Backend Team  
**Dependencies**: BUILD-001 (need to run container)  
**Impact**: Accurate service health reporting

**Action Items**:

**1. Verify Endpoint Exists**

```bash
# Check if file exists
ls packages/web/src/app/api/health/route.ts

# If missing, create it
```

**2. Implement Comprehensive Health Check**

```typescript
// packages/web/src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, { status: string; latency?: number }> = {};
  let overallHealth = true;

  // Check 1: Database connectivity
  try {
    const dbStart = Date.now();
    await connectDB();
    checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = { status: 'unhealthy' };
    overallHealth = false;
  }

  // Check 2: OpenAI API (if configured)
  if (process.env.OPENAI_API_KEY) {
    checks.openai = { status: 'configured' };
  } else {
    checks.openai = { status: 'not_configured' };
  }

  // Check 3: Environment variables
  const requiredEnvVars = ['MONGODB_URI', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

  checks.environment = {
    status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
  };

  if (missingEnvVars.length > 0) {
    overallHealth = false;
  }

  // Response
  const response = {
    status: overallHealth ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  };

  return NextResponse.json(response, {
    status: overallHealth ? 200 : 503,
  });
}
```

**3. Add Integration Test**

```typescript
// packages/web/src/test/integration/health.test.ts
import { describe, it, expect } from 'vitest';

describe('/api/health', () => {
  it('returns 200 when healthy', async () => {
    const response = await fetch('http://localhost:3000/api/health');
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.checks.database.status).toBe('healthy');
  });

  it('includes all required checks', async () => {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();

    expect(data.checks).toHaveProperty('database');
    expect(data.checks).toHaveProperty('environment');
  });
});
```

**4. Update Healthcheck in Compose**

```yaml
web:
  healthcheck:
    test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health']
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s # Give Next.js time to start
```

**Acceptance Criteria**:

- [ ] Endpoint returns 200 when healthy, 503 when unhealthy
- [ ] Checks database connectivity
- [ ] Checks required environment variables
- [ ] Returns JSON with structured response
- [ ] Integration test passes
- [ ] Docker healthcheck uses endpoint

---

### P2-OPS-002: Add Resource Limits

**Finding ID**: OPS-002  
**Effort**: 2-3 hours  
**Owner**: DevOps/SRE  
**Dependencies**: None  
**Impact**: Prevent resource exhaustion

**Implementation**:

**Step 1: Baseline Resource Usage**

```bash
# Run services and monitor
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" --no-stream

# Load test
ab -n 1000 -c 10 http://localhost:3000/
docker stats --no-stream
```

**Step 2: Define Limits Based on Baseline**

```yaml
# compose.yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '2.0' # 2 cores max
          memory: 2G # 2GB max
        reservations:
          cpus: '0.5' # Guarantee 0.5 cores
          memory: 512M # Guarantee 512MB

  mongo:
    deploy:
      resources:
        limits:
          cpus: '1.0' # 1 core max
          memory: 1G # 1GB max
        reservations:
          cpus: '0.25'
          memory: 256M

  mongo-express:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

**Step 3: Enable cgroup v2 (if needed)**

```bash
# Check current cgroup version
docker info | grep -i cgroup

# If v1, enable v2 in Docker Desktop settings
# OR update daemon.json for Linux
```

**Step 4: Monitor OOM Kills**

```bash
# Check for OOM events
docker events --filter 'event=oom'

# Adjust limits if frequent OOMs
```

**Acceptance Criteria**:

- [ ] Resource limits defined for all services
- [ ] Limits based on load testing results
- [ ] No OOM kills under expected load
- [ ] Memory usage stays within limits
- [ ] Documentation includes tuning guide

---

### P2-OPS-003: Configure Graceful Shutdown

**Finding ID**: OPS-003  
**Effort**: 2-3 hours  
**Owner**: Backend/DevOps  
**Dependencies**: None  
**Impact**: Prevent data loss, no dropped requests

**Implementation**:

**Step 1: Update Compose Configuration**

```yaml
services:
  web:
    stop_grace_period: 30s
    stop_signal: SIGTERM

  mongo:
    stop_grace_period: 60s
    stop_signal: SIGTERM
```

**Step 2: Handle SIGTERM in Next.js**

Create `packages/web/src/lib/shutdown.ts`:

```typescript
export function setupGracefulShutdown() {
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`Received ${signal}, starting graceful shutdown...`);

      // 1. Stop accepting new connections
      server?.close(() => {
        console.log('HTTP server closed');
      });

      // 2. Close database connections
      try {
        await mongoose.connection.close();
        console.log('Database connection closed');
      } catch (error) {
        console.error('Error closing database:', error);
      }

      // 3. Exit
      process.exit(0);
    });
  });

  // Timeout fallback (force exit after grace period - 5s)
  process.on('SIGTERM', () => {
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 25000); // 25s (less than compose's 30s)
  });
}
```

**Step 3: Update server.js (if using custom server)**

If using standalone build's server.js, it already handles SIGTERM. Verify:

```javascript
// .next/standalone/server.js (generated)
process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});
```

**Step 4: Test Graceful Shutdown**

```bash
# Start services
docker compose up -d

# Send SIGTERM
docker compose stop web

# Check logs
docker compose logs web --tail=20

# Should see:
# "Received SIGTERM, starting graceful shutdown..."
# "Database connection closed"
# "HTTP server closed"
```

**Acceptance Criteria**:

- [ ] `stop_grace_period` configured for all services
- [ ] SIGTERM handler implemented in Next.js
- [ ] Database connections close cleanly
- [ ] HTTP server drains existing connections
- [ ] No error logs during shutdown
- [ ] Shutdown completes within grace period

---

## Theme 4: Observability & Monitoring

**Objective**: Gain visibility into service health, performance, and issues.

### P2-OBS-001: Configure MongoDB Log Verbosity

**Finding ID**: OBS-001  
**Effort**: 2-4 hours  
**Owner**: SRE/Platform  
**Dependencies**: None  
**Impact**: Reduce log noise by ~80%

**Implementation**:

**Option 1: Environment Variable**

```yaml
# compose.yaml
services:
  mongo:
    environment:
      MONGO_LOG_LEVEL: warn # Only warnings and errors
```

**Option 2: Custom mongod.conf** (Recommended)

```yaml
# packages/infra/docker/mongod.conf
systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true
  verbosity: 0 # Only critical messages
  component:
    accessControl:
      verbosity: 0
    command:
      verbosity: 0
    network:
      verbosity: -1 # Suppress connection logs

storage:
  journal:
    enabled: true

net:
  bindIp: 0.0.0.0
  port: 27017
```

Mount config in compose:

```yaml
mongo:
  volumes:
    - ./docker/mongod.conf:/etc/mongod.conf:ro
  command: ['mongod', '--config', '/etc/mongod.conf']
```

**Option 3: Log Filtering in Compose**

```yaml
mongo:
  logging:
    driver: 'json-file'
    options:
      max-size: '10m'
      max-file: '3'
      labels: 'service=mongo'
```

Create log filter script:

```bash
# packages/infra/scripts/filter-mongo-logs.sh
#!/bin/bash
docker compose logs mongo -f | \
  jq -r 'select(.s != "I" or .c != "NETWORK")'
```

**Acceptance Criteria**:

- [ ] Connection lifecycle events suppressed
- [ ] Logs still include errors and warnings
- [ ] Slow queries still logged
- [ ] Log volume reduced by ~80%
- [ ] Critical events remain visible

---

### P2-OBS-002: Implement Structured Logging in Next.js

**Finding ID**: OBS-002  
**Effort**: 1 week  
**Owner**: Backend Team  
**Dependencies**: None  
**Impact**: Improved debugging, alerting, and dashboards

**Implementation**:

**Step 1: Install Pino**

```bash
cd packages/web
pnpm add pino pino-pretty
```

**Step 2: Create Logger Module**

```typescript
// packages/web/src/lib/logger/index.ts
import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Development: Pretty print
  // Production: JSON (ECS-compatible)
  ...(isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        formatters: {
          level(label) {
            return { level: label };
          },
        },
        base: {
          service: 'procureflow-web',
          environment: process.env.NODE_ENV,
        },
      }),
});

// Create child loggers with context
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
```

**Step 3: Add Request Logging Middleware**

```typescript
// packages/web/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

export function middleware(request: NextRequest) {
  const requestId = uuidv4();
  const start = Date.now();

  // Log request
  logger.info({
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
  });

  const response = NextResponse.next();
  response.headers.set('X-Request-ID', requestId);

  // Log response (in production, use response interceptor)
  const duration = Date.now() - start;
  logger.info({
    requestId,
    method: request.method,
    url: request.url,
    status: response.status,
    duration,
  });

  return response;
}
```

**Step 4: Replace console.log**

```typescript
// Before
console.log('User created:', user);

// After
logger.info({ userId: user.id, email: user.email }, 'User created');
```

**Step 5: Add Context to Logs**

```typescript
// Example in service
import { createLogger } from '@/lib/logger';

export async function createItem(data, userId) {
  const log = createLogger({ userId, action: 'createItem' });

  try {
    log.info({ data }, 'Creating item');
    const item = await ItemModel.create(data);
    log.info({ itemId: item.id }, 'Item created successfully');
    return item;
  } catch (error) {
    log.error({ error: error.message }, 'Failed to create item');
    throw error;
  }
}
```

**Acceptance Criteria**:

- [ ] Pino installed and configured
- [ ] All console.log replaced with logger
- [ ] Logs include requestId, userId, action
- [ ] JSON format in production
- [ ] Pretty format in development
- [ ] Log levels configurable via env var

---

## Theme 5: Developer Experience

**Objective**: Improve onboarding, discoverability, and daily workflows.

### P2-DX-003: Create Bootstrap Script

**Finding ID**: DX-003  
**Effort**: 6-8 hours  
**Owner**: DevOps/DX Team  
**Dependencies**: BUILD-001, BUILD-002  
**Impact**: 10x faster onboarding

**Implementation**:

Create `packages/infra/scripts/bootstrap.js`:

```javascript
#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');

const ENV_DIR = path.join(__dirname, '..', 'env');
const ENV_WEB = path.join(ENV_DIR, '.env.web');
const ENV_MONGO = path.join(ENV_DIR, '.env.mongo');
const ENV_EXAMPLE = path.join(ENV_DIR, '.env.example');

console.log('🚀 ProcureFlow Docker Bootstrap\n');

// Step 1: Check Docker daemon
console.log('1️⃣ Checking Docker daemon...');
try {
  execSync('docker info', { stdio: 'ignore' });
  console.log('   ✅ Docker is running\n');
} catch (error) {
  console.error('   ❌ Docker is not running. Please start Docker Desktop.');
  process.exit(1);
}

// Step 2: Check .env files
console.log('2️⃣ Setting up environment files...');

if (!fs.existsSync(ENV_WEB)) {
  console.log('   Creating .env.web...');
  const exampleContent = fs.readFileSync(ENV_EXAMPLE, 'utf8');

  // Generate NEXTAUTH_SECRET
  const nextAuthSecret = crypto.randomBytes(32).toString('base64');
  const webContent = exampleContent.replace(
    /NEXTAUTH_SECRET=.*/,
    `NEXTAUTH_SECRET=${nextAuthSecret}`
  );

  fs.writeFileSync(ENV_WEB, webContent);
  console.log('   ✅ Created .env.web with generated NEXTAUTH_SECRET');
} else {
  console.log('   ℹ️ .env.web already exists');
}

if (!fs.existsSync(ENV_MONGO)) {
  console.log('   Creating .env.mongo...');
  const mongoContent = `MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=${crypto.randomBytes(16).toString('hex')}
MONGO_INITDB_DATABASE=procureflow
`;
  fs.writeFileSync(ENV_MONGO, mongoContent);
  console.log('   ✅ Created .env.mongo with generated password');
} else {
  console.log('   ℹ️ .env.mongo already exists');
}

// Step 3: Validate required variables
console.log('\n3️⃣ Validating environment variables...');
const requiredVars = [
  'NEXTAUTH_SECRET',
  'MONGODB_URI',
  'NEXTAUTH_URL',
  'MONGO_INITDB_ROOT_USERNAME',
  'MONGO_INITDB_ROOT_PASSWORD',
];

let allValid = true;
requiredVars.forEach((varName) => {
  // Check in .env.web and .env.mongo
  const webContent = fs.readFileSync(ENV_WEB, 'utf8');
  const mongoContent = fs.readFileSync(ENV_MONGO, 'utf8');

  const found =
    webContent.includes(`${varName}=`) || mongoContent.includes(`${varName}=`);

  if (found) {
    console.log(`   ✅ ${varName}`);
  } else {
    console.log(`   ❌ ${varName} not found`);
    allValid = false;
  }
});

if (!allValid) {
  console.error(
    '\n❌ Some required variables are missing. Please check .env files.'
  );
  process.exit(1);
}

// Step 4: Build images
console.log('\n4️⃣ Building Docker images...');
try {
  execSync('pnpm --filter @procureflow/infra docker:build', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..', '..', '..'),
  });
  console.log('   ✅ Build successful\n');
} catch (error) {
  console.error('   ❌ Build failed');
  process.exit(1);
}

// Step 5: Start services
console.log('5️⃣ Starting services...');
try {
  execSync('pnpm --filter @procureflow/infra docker:up', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..', '..', '..'),
  });
  console.log('   ✅ Services started\n');
} catch (error) {
  console.error('   ❌ Failed to start services');
  process.exit(1);
}

// Step 6: Wait for health checks
console.log('6️⃣ Waiting for services to be healthy...');
let retries = 30;
while (retries > 0) {
  try {
    execSync(
      'docker compose -f packages/infra/compose.yaml ps --filter "status=running" --filter "health=healthy"',
      {
        stdio: 'ignore',
      }
    );
    console.log('   ✅ All services healthy\n');
    break;
  } catch {
    process.stdout.write('   ⏳ Waiting...\r');
    execSync('sleep 2');
    retries--;
  }
}

if (retries === 0) {
  console.warn(
    '   ⚠️ Timeout waiting for health checks. Check logs with: pnpm --filter @procureflow/infra docker:logs\n'
  );
}

// Step 7: Success message
console.log('✅ Bootstrap complete!\n');
console.log('📌 Next steps:');
console.log('   1. Open http://localhost:3000');
console.log('   2. MongoDB: mongodb://localhost:27017');
console.log('   3. Logs: pnpm --filter @procureflow/infra docker:logs\n');
console.log('🎉 Happy hacking!');
```

Make executable:

```bash
chmod +x packages/infra/scripts/bootstrap.js
```

Add to package.json:

```json
{
  "scripts": {
    "docker:bootstrap": "node scripts/bootstrap.js"
  }
}
```

**Acceptance Criteria**:

- [ ] Script checks Docker daemon running
- [ ] Auto-generates .env files with secrets
- [ ] Validates all required variables present
- [ ] Builds and starts services
- [ ] Waits for health checks
- [ ] Prints success message with URLs
- [ ] Runs on Windows and Unix

---

### P2-DX-001: Create Infrastructure Documentation

**Finding ID**: DX-001  
**Effort**: 4-6 hours  
**Owner**: DevOps/Documentation Team  
**Dependencies**: None  
**Impact**: Improved discoverability and reduced support burden

Create `packages/infra/README.md`:

```markdown
# ProcureFlow Infrastructure

Docker-based local development and production deployment configuration.

## Quick Start

### Prerequisites

- Docker Desktop 24+ (with Docker Compose v2)
- Node.js 20+
- PNPM 9+

### One-Command Setup

\`\`\`bash
pnpm --filter @procureflow/infra docker:bootstrap
\`\`\`

This will:

1. Generate environment files with secrets
2. Build Docker images
3. Start all services
4. Wait for health checks

### Manual Setup

1. Copy environment templates:
   \`\`\`bash
   cp env/.env.example env/.env.web
   cp env/.env.example env/.env.mongo
   \`\`\`

2. Generate secrets:
   \`\`\`bash
   openssl rand -base64 32 # Use for NEXTAUTH_SECRET
   \`\`\`

3. Build and start:
   \`\`\`bash
   pnpm --filter @procureflow/infra docker:build
   pnpm --filter @procureflow/infra docker:up
   \`\`\`

## Available Commands

| Command               | Description                | Profile |
| --------------------- | -------------------------- | ------- |
| \`docker:build\`      | Build production images    | prod    |
| \`docker:up\`         | Start production stack     | prod    |
| \`docker:up:dev\`     | Start development stack    | dev     |
| \`docker:down\`       | Stop and remove containers | all     |
| \`docker:db\`         | Test MongoDB connectivity  | -       |
| \`docker:logs\`       | Follow all logs            | -       |
| \`docker:logs:web\`   | Follow web service logs    | -       |
| \`docker:logs:mongo\` | Follow MongoDB logs        | -       |
| \`docker:ps\`         | List running containers    | -       |

## Services

### web (Next.js Application)

- **Port**: 3000
- **Health**: http://localhost:3000/api/health
- **Profiles**: prod, dev

### mongo (MongoDB 7.0)

- **Port**: 27017 (dev/debug only)
- **Profiles**: prod, dev, debug
- **Connection**: mongodb://admin:password@localhost:27017/procureflow?authSource=admin

### mongo-express (Database Admin UI)

- **Port**: 8081
- **URL**: http://localhost:8081
- **Profile**: debug only

## Profiles

Use profiles to control which services start:

\`\`\`bash

# Production: web + mongo (no exposed ports)

pnpm docker:up

# Development: web + mongo (ports exposed)

pnpm docker:up:dev

# Debug: web + mongo + mongo-express

docker compose -f compose.yaml --profile debug up -d
\`\`\`

## Troubleshooting

### Build fails with MODULE_NOT_FOUND

**Cause**: Dependency installation issue  
**Fix**: Clear cache and rebuild
\`\`\`bash
docker builder prune
pnpm docker:build --no-cache
\`\`\`

### Environment variable warnings

**Cause**: Variables not loaded before compose  
**Fix**: Ensure .env.web and .env.mongo exist and are populated

### MongoDB connection refused

**Cause**: Service not healthy yet  
**Fix**: Check health status
\`\`\`bash
docker compose -f compose.yaml ps
docker compose -f compose.yaml logs mongo
\`\`\`

### Port already in use

**Cause**: Another service using 3000 or 27017  
**Fix**: Stop conflicting service or change port in compose.yaml

## Security Notes

⚠️ **Important**:

- Never commit .env.web or .env.mongo to Git
- Rotate NEXTAUTH_SECRET quarterly
- Use strong MongoDB passwords (16+ characters)
- Don't expose MongoDB port in production

## Architecture

\`\`\`
┌─────────────────────────────────────┐
│ Docker Compose │
│ ┌──────────┐ ┌─────────────┐ │
│ │ web │─────▶│ mongo │ │
│ │ (Next.js)│ │ (MongoDB 7) │ │
│ └──────────┘ └─────────────┘ │
│ │ │
│ │ (debug profile only) │
│ ▼ │
│ ┌──────────────┐ │
│ │mongo-express │ │
│ │ (Admin UI) │ │
│ └──────────────┘ │
└─────────────────────────────────────┘
\`\`\`

## Contributing

When modifying infrastructure:

1. Test locally with all profiles
2. Update this README
3. Run security scan: \`pnpm docker:scan\`
4. Document breaking changes in CHANGELOG

## Support

- **Issues**: https://github.com/procureflow/procureflow/issues
- **Docs**: https://docs.procureflow.com
- **Slack**: #infrastructure
```

**Acceptance Criteria**:

- [ ] README created with all sections
- [ ] Quick start guide tested
- [ ] All commands documented
- [ ] Troubleshooting section comprehensive
- [ ] Security notes prominent
- [ ] Architecture diagram included

---

### P3-DX-002: Enhanced Log Filtering Commands

**Finding ID**: DX-002  
**Effort**: 1-2 hours  
**Owner**: DevOps Team  
**Dependencies**: None  
**Impact**: Faster debugging

Add to `packages/infra/package.json`:

```json
{
  "scripts": {
    "docker:logs": "docker compose -f compose.yaml logs",
    "docker:logs:tail": "docker compose -f compose.yaml logs --tail=100",
    "docker:logs:follow": "docker compose -f compose.yaml logs -f",
    "docker:logs:since": "docker compose -f compose.yaml logs --since=1h",
    "docker:logs:errors": "docker compose -f compose.yaml logs | grep -i error",
    "docker:logs:web": "docker compose -f compose.yaml logs web --tail=100",
    "docker:logs:mongo": "docker compose -f compose.yaml logs mongo --tail=100",
    "docker:logs:json": "docker compose -f compose.yaml logs mongo | jq -r '.msg'"
  }
}
```

**Acceptance Criteria**:

- [ ] All scripts functional
- [ ] Documented in README
- [ ] Non-blocking by default (no -f except logs:follow)

---

## Theme 6: Performance Optimization

**Objective**: Reduce build times and image sizes.

### P3-PERF-001: Measure Build Performance

**Finding ID**: PERF-001  
**Effort**: Quick (included in BUILD-002)  
**Owner**: DevOps  
**Dependencies**: BUILD-002  
**Impact**: Baseline for future optimizations

**Metrics to Track**:

1. Build context size (before/after .dockerignore)
2. Context transfer time
3. Total build time (cold cache)
4. Build time (warm cache, code change only)
5. Final image size

**Create benchmark script**:

```bash
# packages/infra/scripts/benchmark-build.sh
#!/bin/bash

echo "🔍 Docker Build Benchmark"
echo "========================="

# Clear cache for cold build
docker builder prune -af > /dev/null 2>&1

echo -e "\n1️⃣ Cold Build (no cache):"
time docker compose -f compose.yaml --profile prod build --no-cache

echo -e "\n2️⃣ Warm Build (full cache):"
time docker compose -f compose.yaml --profile prod build

echo -e "\n3️⃣ Code Change Build:"
touch ../web/src/app/page.tsx
time docker compose -f compose.yaml --profile prod build

echo -e "\n4️⃣ Image Sizes:"
docker images procureflow-web --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo -e "\n5️⃣ Build Context Size:"
docker build -f docker/Dockerfile.web ../.. 2>&1 | grep "transferring context"
```

**Target Metrics**:

- Build context: < 50MB
- Context transfer: < 5s
- Cold build: < 5 minutes
- Warm build (code change): < 30 seconds
- Image size: < 500MB

**Acceptance Criteria**:

- [ ] Benchmark script created
- [ ] Baseline metrics documented
- [ ] Targets defined
- [ ] Monitoring in place

---

## Summary Timeline

| Week | Priority | Theme              | Effort    | Owner           |
| ---- | -------- | ------------------ | --------- | --------------- |
| 1    | P0       | Build Recovery     | 8-12h     | DevOps/Platform |
| 2-3  | P1       | Security           | 2-3 weeks | Security/DevOps |
| 2-3  | P1       | Reliability        | 1 week    | Backend/SRE     |
| 4-6  | P2       | DX + Observability | 2 weeks   | DevOps/Backend  |
| 2+   | P3       | Advanced Features  | Ongoing   | Platform        |

---

## Success Criteria

### Week 1 (Critical Recovery)

- [ ] Docker build completes successfully
- [ ] .dockerignore reduces build context by 80%+
- [ ] Base images pinned by digest
- [ ] Environment warnings suppressed

### Week 3 (Production Ready)

- [ ] No plaintext secrets in Git
- [ ] Container vulnerability scanning in CI
- [ ] MongoDB not exposed in prod profile
- [ ] Resource limits configured
- [ ] Graceful shutdown tested

### Week 6 (Operational Excellence)

- [ ] Structured logging implemented
- [ ] Health checks verified and comprehensive
- [ ] Bootstrap script functional
- [ ] Documentation complete
- [ ] MongoDB logs filtered

### Month 2+ (Advanced)

- [ ] Log aggregation stack deployed
- [ ] Automated backups configured
- [ ] Monitoring dashboards created
- [ ] Secret rotation automated

---

## Ownership Matrix

| Team         | Responsibilities                          | Findings                  |
| ------------ | ----------------------------------------- | ------------------------- |
| **DevOps**   | Build, CI/CD, Scripts, Documentation      | BUILD-_, DX-_, PERF-\*    |
| **Security** | Secrets, Scanning, Hardening              | SEC-\*                    |
| **Backend**  | Health checks, Logging, Graceful shutdown | OBS-002, OBS-003, OPS-003 |
| **SRE**      | Resources, Monitoring, Reliability        | OPS-002, OBS-001          |
| **Platform** | Database init, Advanced features          | OPS-001                   |

---

**Plan Version**: 1.0  
**Last Updated**: November 11, 2025  
**Next Review**: November 18, 2025
