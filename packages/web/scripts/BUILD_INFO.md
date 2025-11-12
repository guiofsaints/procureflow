# Build Information System

Automated system for injecting version and build metadata into the application.

## 📋 What It Does

Automatically generates and injects build-time information:
- **Version**: From `package.json`
- **Git Commit SHA**: Full and short hash
- **Git Branch**: Current branch name
- **Build Date**: ISO timestamp
- **Build Timestamp**: Unix timestamp

## 🎯 Where It's Used

### 1. **Login Page Footer**
```tsx
version 0.1.0 | a82db4c
```

Displays version and short commit hash below the login card.

**File**: `packages/web/src/app/(public)/page.tsx`

### 2. **Environment Variables**
Available at runtime via `process.env`:
- `NEXT_PUBLIC_APP_VERSION`
- `NEXT_PUBLIC_GIT_COMMIT_SHA`
- `NEXT_PUBLIC_GIT_COMMIT_SHA_SHORT`
- `NEXT_PUBLIC_GIT_BRANCH`
- `NEXT_PUBLIC_BUILD_DATE`
- `NEXT_PUBLIC_BUILD_TIMESTAMP`

### 3. **Build Info JSON**
Static file for server-side imports:

**File**: `packages/web/build-info.json`
```json
{
  "version": "0.1.0",
  "gitCommitSHA": "a82db4c...",
  "gitCommitSHAShort": "a82db4c",
  "gitBranch": "main",
  "buildDate": "2025-11-11T...",
  "buildTimestamp": 1731369600000
}
```

## 🚀 How It Works

### Automatic Generation

The `generate-build-info.js` script runs automatically during builds:

```bash
# Development build
pnpm build

# Production build (Docker)
docker build ...
```

### Manual Generation

```bash
# Generate build info only
cd packages/web
pnpm generate-build-info

# With shell export (for scripts)
pnpm generate-build-info --export
```

## 📦 Integration Points

### 1. **Local Development**

**File**: `packages/web/package.json`
```json
{
  "scripts": {
    "build": "npm run generate-build-info && next build"
  }
}
```

### 2. **Docker Build**

**File**: `packages/infra/docker/Dockerfile.web`
```dockerfile
ARG GIT_COMMIT_SHA=unknown
ARG BUILD_DATE
ARG VERSION

ENV NEXT_PUBLIC_GIT_COMMIT_SHA=${GIT_COMMIT_SHA}
ENV NEXT_PUBLIC_BUILD_DATE=${BUILD_DATE}
ENV NEXT_PUBLIC_APP_VERSION=${VERSION}
```

### 3. **Docker Compose**

**File**: `packages/infra/compose.yaml`
```yaml
web:
  build:
    args:
      GIT_COMMIT_SHA: ${GIT_COMMIT_SHA:-dev}
      BUILD_DATE: ${BUILD_DATE}
      VERSION: ${VERSION:-0.1.0}
```

Run with:
```bash
GIT_COMMIT_SHA=$(git rev-parse HEAD) \
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
VERSION=0.1.0 \
docker compose --profile prod up --build
```

### 4. **GitHub Actions**

**File**: `.github/workflows/deploy-gcp.yml`
```yaml
- name: Build Docker image
  run: |
    GIT_COMMIT_SHA=$(git rev-parse HEAD)
    docker build \
      --build-arg GIT_COMMIT_SHA=$GIT_COMMIT_SHA \
      --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
      --build-arg VERSION=${{ steps.image-tag.outputs.tag }} \
      ...
```

### 5. **Next.js Config**

**File**: `packages/web/next.config.mjs`
```javascript
env: {
  NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '0.1.0',
  NEXT_PUBLIC_GIT_COMMIT_SHA: process.env.GIT_COMMIT_SHA || 'dev',
}
```

## 🔧 Configuration

### Fallback Values

If Git is not available or commands fail:
- `gitCommitSHA`: `"dev"`
- `gitCommitSHAShort`: `"dev"`
- `gitBranch`: `"unknown"`
- `version`: `"0.0.0"` (or from package.json)

### Environment Priority

1. **Build args** (Docker)
2. **Script generation** (local builds)
3. **Fallback values** (when all else fails)

## 📁 Generated Files

### `.env.buildinfo`
```bash
# Auto-generated build info - DO NOT EDIT MANUALLY
NEXT_PUBLIC_APP_VERSION=0.1.0
NEXT_PUBLIC_GIT_COMMIT_SHA=a82db4c...
NEXT_PUBLIC_GIT_COMMIT_SHA_SHORT=a82db4c
NEXT_PUBLIC_GIT_BRANCH=main
NEXT_PUBLIC_BUILD_DATE=2025-11-11T...
NEXT_PUBLIC_BUILD_TIMESTAMP=1731369600000
```

### `build-info.json`
```json
{
  "version": "0.1.0",
  "gitCommitSHA": "a82db4c...",
  "gitCommitSHAShort": "a82db4c",
  "gitBranch": "main",
  "buildDate": "2025-11-11T...",
  "buildTimestamp": 1731369600000
}
```

**Note**: Both files are auto-generated and git-ignored.

## 🎨 UI Examples

### Login Page Footer

```tsx
<div className='mt-4 text-center'>
  <p className='text-xs text-white/60 dark:text-muted-foreground/60'>
    version {process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'} |{' '}
    {process.env.NEXT_PUBLIC_GIT_COMMIT_SHA?.substring(0, 7) || 'dev'}
  </p>
</div>
```

**Output**: `version 0.1.0 | a82db4c`

### Future Use Cases

Add to other pages (settings, about):

```tsx
import buildInfo from '@/build-info.json';

export default function AboutPage() {
  return (
    <div>
      <p>Version: {buildInfo.version}</p>
      <p>Commit: {buildInfo.gitCommitSHAShort}</p>
      <p>Branch: {buildInfo.gitBranch}</p>
      <p>Built: {new Date(buildInfo.buildDate).toLocaleString()}</p>
    </div>
  );
}
```

## 🔍 Debugging

### Check Generated Values

```bash
# View environment file
cat packages/web/.env.buildinfo

# View JSON file
cat packages/web/build-info.json

# Check runtime values (in browser console)
console.log(process.env.NEXT_PUBLIC_APP_VERSION);
console.log(process.env.NEXT_PUBLIC_GIT_COMMIT_SHA);
```

### Verify Docker Build

```bash
# Build with explicit values
docker build \
  --build-arg GIT_COMMIT_SHA=$(git rev-parse HEAD) \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --build-arg VERSION=0.1.0 \
  -f packages/infra/docker/Dockerfile.web \
  -t test:latest \
  .

# Check environment in container
docker run --rm test:latest env | grep NEXT_PUBLIC
```

## 📝 Maintenance

### Update Version

Edit `packages/web/package.json`:
```json
{
  "version": "0.2.0"
}
```

Script automatically picks up new version on next build.

### Add New Build Info Fields

1. Update `scripts/generate-build-info.js`
2. Add to `generateBuildInfo()` function
3. Update `.env.buildinfo` generation
4. Use in components via `process.env.NEXT_PUBLIC_*`

## 🚫 What NOT to Include

❌ Secrets (API keys, passwords)  
❌ Private repository URLs  
❌ Internal infrastructure details  
❌ User-specific information

✅ Public metadata only (version, commit, build date)
