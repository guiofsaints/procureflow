# Composite Actions Proposals

**Purpose**: Reduce duplication in GitHub Actions workflows by creating reusable composite actions for common patterns.

**Acceptance Criteria**:
- [ ] Actions follow GitHub composite action best practices
- [ ] Each action has clear inputs/outputs documented
- [ ] Actions are version-tagged (e.g., v1, v1.0.0)
- [ ] README.md per action with usage examples
- [ ] Actions tested in at least 2 workflows

---

## Overview

Composite actions encapsulate common workflow steps into reusable units. For ProcureFlow, key patterns include:

1. **pnpm setup with cache** (used in every workflow)
2. **Docker build with BuildKit cache** (used in deploy workflows)
3. **Docker push to Artifact Registry** (used in deploy workflows)
4. **Pulumi deployment boilerplate** (used in deploy workflows)

Benefits:
- ✅ Single source of truth for common patterns
- ✅ Easier to update caching strategies (change once, apply everywhere)
- ✅ Less YAML boilerplate in workflows
- ✅ Consistent behavior across workflows

---

## Proposal 1: Setup pnpm with Cache

**File**: `.github/actions/setup-pnpm/action.yml`

### Description

Sets up Node.js, pnpm, and configures caching for the pnpm store. Used in CI, deploy, and test workflows.

### Implementation

```yaml
name: 'Setup pnpm with Cache'
description: 'Install Node.js, pnpm, and configure pnpm store caching'

inputs:
  node-version:
    description: 'Node.js version to install'
    required: false
    default: '20'
  
  pnpm-version:
    description: 'pnpm version to install'
    required: false
    default: '10.21.0'
  
  cache-prefix:
    description: 'Cache key prefix (e.g., "ci", "deploy")'
    required: false
    default: ''

outputs:
  cache-hit:
    description: 'Whether the pnpm cache was hit'
    value: ${{ steps.cache.outputs.cache-hit }}
  
  pnpm-store-path:
    description: 'Path to the pnpm store directory'
    value: ${{ steps.pnpm-cache.outputs.STORE_PATH }}

runs:
  using: 'composite'
  steps:
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
    
    - name: Setup pnpm
      uses: pnpm/action-setup@v4
      with:
        version: ${{ inputs.pnpm-version }}
    
    - name: Get pnpm store directory
      id: pnpm-cache
      shell: bash
      run: echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT
    
    - name: Cache pnpm store
      id: cache
      uses: actions/cache@v4
      with:
        path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
        key: ${{ runner.os }}-pnpm${{ inputs.cache-prefix != '' && format('-{0}', inputs.cache-prefix) || '' }}-${{ hashFiles('**/pnpm-lock.yaml') }}
        restore-keys: |
          ${{ runner.os }}-pnpm${{ inputs.cache-prefix != '' && format('-{0}', inputs.cache-prefix) || '' }}-
```

### Usage

**Before** (7 steps):
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'

- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 10.21.0

- name: Get pnpm store directory
  id: pnpm-cache
  run: echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

- name: Cache pnpm store
  uses: actions/cache@v4
  with:
    path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-
```

**After** (1 step):
```yaml
- name: Setup pnpm with cache
  uses: ./.github/actions/setup-pnpm
  with:
    node-version: '20'
    pnpm-version: '10.21.0'
    cache-prefix: 'ci'  # Optional, for cache isolation
```

### Benefits

- **-6 lines** per workflow
- Centralized version management (update Node/pnpm versions in one place)
- Consistent cache key generation
- Cache hit/miss metrics available via output

---

## Proposal 2: Docker Build with Cache

**File**: `.github/actions/docker-build-cached/action.yml`

### Description

Builds Docker image with BuildKit cache layers, supports multi-stage builds, and pushes to Artifact Registry.

### Implementation

```yaml
name: 'Docker Build with Cache'
description: 'Build Docker image with BuildKit cache layers and push to registry'

inputs:
  dockerfile:
    description: 'Path to Dockerfile'
    required: false
    default: 'packages/infra/docker/Dockerfile.web'
  
  context:
    description: 'Build context directory'
    required: false
    default: '.'
  
  image-name:
    description: 'Full image name (e.g., us-central1-docker.pkg.dev/PROJECT/REPO/IMAGE)'
    required: true
  
  image-tag:
    description: 'Image tag (e.g., "latest", "v1.2.3", commit SHA)'
    required: true
  
  cache-from:
    description: 'Cache sources (newline-separated, e.g., "type=registry,ref=IMAGE:cache")'
    required: false
    default: ''
  
  cache-to:
    description: 'Cache destination (e.g., "type=registry,ref=IMAGE:cache,mode=max")'
    required: false
    default: ''
  
  build-args:
    description: 'Build arguments (newline-separated, e.g., "NODE_VERSION=20\nBUILD_DATE=$(date)")'
    required: false
    default: ''
  
  push:
    description: 'Push image to registry after build'
    required: false
    default: 'true'

outputs:
  image-url:
    description: 'Full image URL with tag (IMAGE:TAG)'
    value: ${{ steps.build.outputs.image-url }}
  
  image-digest:
    description: 'SHA256 digest of the built image'
    value: ${{ steps.build.outputs.digest }}

runs:
  using: 'composite'
  steps:
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Build and push Docker image
      id: build
      uses: docker/build-push-action@v6
      with:
        context: ${{ inputs.context }}
        file: ${{ inputs.dockerfile }}
        push: ${{ inputs.push }}
        tags: ${{ inputs.image-name }}:${{ inputs.image-tag }}
        cache-from: ${{ inputs.cache-from }}
        cache-to: ${{ inputs.cache-to }}
        build-args: ${{ inputs.build-args }}
        provenance: mode=max  # Generate SLSA provenance
        sbom: true            # Generate SBOM
    
    - name: Output image details
      shell: bash
      run: |
        echo "image-url=${{ inputs.image-name }}:${{ inputs.image-tag }}" >> $GITHUB_OUTPUT
        echo "✅ Image built: ${{ inputs.image-name }}:${{ inputs.image-tag }}"
        echo "📦 Digest: ${{ steps.build.outputs.digest }}"
```

### Usage

**Before** (multiple steps for setup, build, push):
```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Authenticate to Artifact Registry
  run: |
    gcloud auth configure-docker us-central1-docker.pkg.dev

- name: Build Docker image
  run: |
    docker buildx build \
      --file packages/infra/docker/Dockerfile.web \
      --tag $IMAGE_URL:${{ github.sha }} \
      --cache-from type=registry,ref=$IMAGE_URL:cache \
      --cache-to type=registry,ref=$IMAGE_URL:cache,mode=max \
      --push \
      .
```

**After** (1 step):
```yaml
- name: Build and cache Docker image
  id: docker-build
  uses: ./.github/actions/docker-build-cached
  with:
    image-name: us-central1-docker.pkg.dev/procureflow-dev/procureflow/web
    image-tag: ${{ github.sha }}
    cache-from: |
      type=registry,ref=us-central1-docker.pkg.dev/procureflow-dev/procureflow/web:cache
    cache-to: |
      type=registry,ref=us-central1-docker.pkg.dev/procureflow-dev/procureflow/web:cache,mode=max
    build-args: |
      BUILD_DATE=${{ github.event.head_commit.timestamp }}
      VCS_REF=${{ github.sha }}

- name: Use image digest in deployment
  run: |
    echo "Deploying ${{ steps.docker-build.outputs.image-url }}"
    echo "Digest: ${{ steps.docker-build.outputs.digest }}"
```

### Benefits

- **Automatic BuildKit setup**
- **Built-in cache configuration** (registry-based)
- **Provenance and SBOM generation** (supply chain security)
- **Digest output** for immutable references
- **-8 lines** per workflow

---

## Proposal 3: Pulumi Deploy

**File**: `.github/actions/pulumi-deploy/action.yml`

### Description

Handles Pulumi stack selection, configuration, and deployment with consistent error handling and output capture.

### Implementation

```yaml
name: 'Pulumi Deploy'
description: 'Deploy infrastructure with Pulumi (select stack, configure, deploy)'

inputs:
  work-dir:
    description: 'Working directory for Pulumi operations'
    required: false
    default: 'packages/infra/pulumi/gcp'
  
  stack-name:
    description: 'Pulumi stack to deploy (e.g., "dev", "staging", "production")'
    required: true
  
  pulumi-command:
    description: 'Pulumi command to run (e.g., "up", "preview", "destroy")'
    required: false
    default: 'up'
  
  pulumi-access-token:
    description: 'Pulumi access token (use secrets.PULUMI_ACCESS_TOKEN)'
    required: true
  
  config:
    description: 'Pulumi config values (newline-separated, e.g., "image-url=IMAGE\nregion=us-central1")'
    required: false
    default: ''
  
  skip-preview:
    description: 'Skip preview and auto-approve changes'
    required: false
    default: 'false'
  
  comment-on-pr:
    description: 'Post deployment summary as PR comment'
    required: false
    default: 'false'

outputs:
  stack-outputs:
    description: 'JSON string of all stack outputs'
    value: ${{ steps.outputs.outputs.result }}
  
  service-url:
    description: 'Service URL from Pulumi outputs (if available)'
    value: ${{ steps.get-url.outputs.url }}

runs:
  using: 'composite'
  steps:
    - name: Select Pulumi stack
      shell: bash
      working-directory: ${{ inputs.work-dir }}
      run: |
        pulumi stack select ${{ inputs.stack-name }} --non-interactive
        echo "✅ Selected stack: ${{ inputs.stack-name }}"
      env:
        PULUMI_ACCESS_TOKEN: ${{ inputs.pulumi-access-token }}
    
    - name: Configure Pulumi stack
      if: inputs.config != ''
      shell: bash
      working-directory: ${{ inputs.work-dir }}
      run: |
        echo "${{ inputs.config }}" | while IFS= read -r line; do
          if [ -n "$line" ]; then
            KEY=$(echo "$line" | cut -d'=' -f1)
            VALUE=$(echo "$line" | cut -d'=' -f2-)
            pulumi config set "$KEY" "$VALUE" --non-interactive
            echo "✅ Set config: $KEY"
          fi
        done
      env:
        PULUMI_ACCESS_TOKEN: ${{ inputs.pulumi-access-token }}
    
    - name: Run Pulumi command
      uses: pulumi/actions@v5
      with:
        command: ${{ inputs.pulumi-command }}
        stack-name: ${{ inputs.stack-name }}
        work-dir: ${{ inputs.work-dir }}
        upsert: false
        comment-on-pr: ${{ inputs.comment-on-pr }}
        comment-on-summary: true
      env:
        PULUMI_ACCESS_TOKEN: ${{ inputs.pulumi-access-token }}
        PULUMI_SKIP_CONFIRMATIONS: ${{ inputs.skip-preview }}
    
    - name: Capture stack outputs
      id: outputs
      shell: bash
      working-directory: ${{ inputs.work-dir }}
      run: |
        OUTPUTS=$(pulumi stack output --json --non-interactive)
        echo "result<<EOF" >> $GITHUB_OUTPUT
        echo "$OUTPUTS" >> $GITHUB_OUTPUT
        echo "EOF" >> $GITHUB_OUTPUT
      env:
        PULUMI_ACCESS_TOKEN: ${{ inputs.pulumi-access-token }}
    
    - name: Extract service URL
      id: get-url
      shell: bash
      run: |
        URL=$(echo '${{ steps.outputs.outputs.result }}' | jq -r '.serviceUrl // empty')
        echo "url=$URL" >> $GITHUB_OUTPUT
        if [ -n "$URL" ]; then
          echo "✅ Service URL: $URL"
        fi
```

### Usage

**Before**:
```yaml
- name: Setup Pulumi
  uses: pulumi/actions@v5
  with:
    pulumi-version: ^3.140.0

- name: Select stack
  working-directory: packages/infra/pulumi/gcp
  run: pulumi stack select dev --non-interactive
  env:
    PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}

- name: Configure image
  working-directory: packages/infra/pulumi/gcp
  run: pulumi config set image-url $IMAGE_URL --non-interactive
  env:
    PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}

- name: Deploy
  uses: pulumi/actions@v5
  with:
    command: up
    stack-name: dev
    work-dir: packages/infra/pulumi/gcp
  env:
    PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}

- name: Get outputs
  working-directory: packages/infra/pulumi/gcp
  run: |
    SERVICE_URL=$(pulumi stack output serviceUrl --non-interactive)
    echo "SERVICE_URL=$SERVICE_URL" >> $GITHUB_ENV
  env:
    PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

**After**:
```yaml
- name: Deploy with Pulumi
  id: pulumi
  uses: ./.github/actions/pulumi-deploy
  with:
    stack-name: dev
    pulumi-access-token: ${{ secrets.PULUMI_ACCESS_TOKEN }}
    config: |
      image-url=${{ steps.docker-build.outputs.image-url }}
      region=us-central1
    skip-preview: 'true'

- name: Access service URL
  run: echo "Deployed to ${{ steps.pulumi.outputs.service-url }}"
```

### Benefits

- **Automatic stack selection and configuration**
- **JSON outputs parsed and available**
- **Consistent error handling**
- **-12 lines** per workflow

---

## Proposal 4: Health Check

**File**: `.github/actions/health-check/action.yml`

### Description

Performs HTTP health checks with retry logic, timeout handling, and detailed failure reporting.

### Implementation

```yaml
name: 'Health Check'
description: 'Perform HTTP health check with retry logic'

inputs:
  url:
    description: 'URL to check (e.g., https://example.com/api/health)'
    required: true
  
  expected-status:
    description: 'Expected HTTP status code'
    required: false
    default: '200'
  
  timeout:
    description: 'Total timeout in seconds'
    required: false
    default: '300'
  
  interval:
    description: 'Interval between retries in seconds'
    required: false
    default: '10'
  
  validate-json:
    description: 'Validate response as JSON (check for .status == "ok")'
    required: false
    default: 'false'

outputs:
  success:
    description: 'Whether the health check succeeded (true/false)'
    value: ${{ steps.check.outputs.success }}
  
  response-time:
    description: 'Response time in milliseconds'
    value: ${{ steps.check.outputs.response-time }}

runs:
  using: 'composite'
  steps:
    - name: Perform health check
      id: check
      shell: bash
      run: |
        URL="${{ inputs.url }}"
        EXPECTED_STATUS="${{ inputs.expected-status }}"
        TIMEOUT=${{ inputs.timeout }}
        INTERVAL=${{ inputs.interval }}
        VALIDATE_JSON="${{ inputs.validate-json }}"
        
        echo "🏥 Health check: $URL"
        echo "Expected status: $EXPECTED_STATUS"
        echo "Timeout: ${TIMEOUT}s, Interval: ${INTERVAL}s"
        
        ELAPSED=0
        SUCCESS=false
        
        while [ $ELAPSED -lt $TIMEOUT ]; do
          START=$(date +%s%3N)
          HTTP_CODE=$(curl -s -o /tmp/response.txt -w "%{http_code}" "$URL" || echo "000")
          END=$(date +%s%3N)
          RESPONSE_TIME=$((END - START))
          
          echo "response-time=$RESPONSE_TIME" >> $GITHUB_OUTPUT
          
          if [ "$HTTP_CODE" = "$EXPECTED_STATUS" ]; then
            echo "✅ Health check passed (HTTP $HTTP_CODE, ${RESPONSE_TIME}ms)"
            
            # Validate JSON if requested
            if [ "$VALIDATE_JSON" = "true" ]; then
              if jq -e '.status == "ok"' /tmp/response.txt > /dev/null 2>&1; then
                echo "✅ JSON validation passed"
              else
                echo "::warning::JSON validation failed (expected .status == 'ok')"
                echo "Response: $(cat /tmp/response.txt)"
              fi
            fi
            
            SUCCESS=true
            break
          fi
          
          echo "⏳ Health check pending (HTTP $HTTP_CODE) - retrying in ${INTERVAL}s..."
          sleep $INTERVAL
          ELAPSED=$((ELAPSED + INTERVAL))
        done
        
        if [ "$SUCCESS" = "false" ]; then
          echo "::error::Health check failed after ${TIMEOUT}s"
          echo "Last response: $(cat /tmp/response.txt 2>/dev/null || echo 'No response')"
          exit 1
        fi
        
        echo "success=true" >> $GITHUB_OUTPUT
```

### Usage

**Before**:
```yaml
- name: Health check
  run: |
    TIMEOUT=300
    ELAPSED=0
    while [ $ELAPSED -lt $TIMEOUT ]; do
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/health" || echo "000")
      if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Health check passed"
        exit 0
      fi
      sleep 10
      ELAPSED=$((ELAPSED + 10))
    done
    echo "::error::Health check failed"
    exit 1
```

**After**:
```yaml
- name: Health check
  uses: ./.github/actions/health-check
  with:
    url: ${{ steps.pulumi.outputs.service-url }}/api/health
    expected-status: '200'
    timeout: '300'
    validate-json: 'true'
```

### Benefits

- **Reusable health check logic**
- **Response time metrics**
- **JSON validation support**
- **-15 lines** per workflow

---

## Implementation Roadmap

### Phase 1: Setup Actions (1-2h)

1. **Create action directories**:
   ```bash
   mkdir -p .github/actions/{setup-pnpm,docker-build-cached,pulumi-deploy,health-check}
   ```

2. **Implement actions** (30 min each):
   - `setup-pnpm/action.yml`
   - `docker-build-cached/action.yml`
   - `pulumi-deploy/action.yml`
   - `health-check/action.yml`

3. **Add README.md** for each action (10 min each):
   - Usage examples
   - Input/output documentation
   - Troubleshooting tips

### Phase 2: Migrate Workflows (2-3h)

4. **Update `ci.yml`** (30 min):
   - Replace pnpm setup with `setup-pnpm` action
   - Test in feature branch

5. **Update `deploy-gcp.yml`** (1h):
   - Replace Docker build with `docker-build-cached`
   - Replace Pulumi steps with `pulumi-deploy`
   - Replace health check with `health-check`
   - Test in dev environment

6. **Create new workflows** using actions (1h):
   - `staging-deploy.yml` (reuse actions)
   - `production-deploy.yml` (reuse actions)

### Phase 3: Testing and Validation (1h)

7. **Test composite actions**:
   - [ ] CI workflow passes with `setup-pnpm`
   - [ ] Deploy workflow uses `docker-build-cached` successfully
   - [ ] Pulumi deployment works with `pulumi-deploy`
   - [ ] Health check validates service correctly

8. **Measure improvements**:
   - [ ] Line count reduction per workflow
   - [ ] Cache hit rate improvements
   - [ ] Build time reduction

---

## Expected Impact

### Before vs. After

| Workflow | Before (lines) | After (lines) | Reduction |
|----------|---------------|--------------|-----------|
| `ci.yml` | 45 | 30 | -33% |
| `deploy-gcp.yml` | 120 | 65 | -46% |
| New workflows | N/A | 50 | N/A |

### Maintenance Benefits

- **Update pnpm version**: Change 1 line in `setup-pnpm/action.yml` (instead of 3 workflows)
- **Change cache strategy**: Update 1 action (affects all workflows)
- **Add new health check**: Update 1 action (all deployments benefit)

### Developer Experience

- **Easier to read workflows** (less boilerplate)
- **Faster to create new workflows** (copy-paste less, reuse more)
- **Consistent behavior** (same caching, same health checks, same Pulumi config)

---

## Best Practices

### 1. Version Tagging

Tag composite actions with semantic versions:
```bash
git tag -a actions/setup-pnpm/v1.0.0 -m "Release setup-pnpm v1.0.0"
git push origin actions/setup-pnpm/v1.0.0
```

Use tags in workflows:
```yaml
uses: ./.github/actions/setup-pnpm@v1  # Major version (auto-updates)
uses: ./.github/actions/setup-pnpm@v1.0.0  # Exact version (pinned)
```

### 2. Documentation

Each action should have:
- **README.md** with usage examples
- **Inline comments** explaining complex logic
- **Input/output descriptions** in `action.yml`

### 3. Testing

Test actions in:
- **Feature branches** before merging
- **Multiple workflows** to ensure reusability
- **Different environments** (dev, staging, production)

### 4. Error Handling

- Use `set -e` in shell scripts (fail fast)
- Provide clear error messages with `echo "::error::Message"`
- Log warnings with `echo "::warning::Message"`

### 5. Security

- Never hardcode secrets in actions
- Use `inputs` for sensitive data (passed from workflow secrets)
- Validate input parameters

---

## Acceptance Criteria

### For Each Action

- [ ] `action.yml` with metadata, inputs, outputs, and steps
- [ ] `README.md` with usage examples
- [ ] Tested in at least 2 workflows
- [ ] Version tagged (v1.0.0)
- [ ] Documented in team wiki/docs

### For Migration

- [ ] All existing workflows use composite actions
- [ ] No duplicate pnpm setup, Docker build, or Pulumi steps
- [ ] Line count reduced by 30-50%
- [ ] No regression in CI/CD times

### For Validation

- [ ] CI workflow passes with new actions
- [ ] Deploy workflow succeeds with new actions
- [ ] Cache hit rates maintained or improved
- [ ] Team trained on using/maintaining actions

---

**Next Steps**:
1. Review proposals with team
2. Create action skeleton files
3. Implement Phase 1 (setup actions)
4. Test in feature branch
5. Migrate existing workflows (Phase 2)
6. Document and share with team

**Estimated Total Effort**: 4-6 hours (1 action = 30 min implementation + 15 min testing)

**Expected ROI**: -40% workflow YAML, easier maintenance, faster new workflow creation
