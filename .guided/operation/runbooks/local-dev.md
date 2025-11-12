# Runbook: Local Development Setup

**Executive Summary**: Set up ProcureFlow local development environment on developer workstation using Docker Compose for MongoDB, Next.js dev server with hot reload, and seeded test data. Steps: clone repository → install Node.js 20 + pnpm 10 + Docker Desktop → copy `.env.example` to `.env.local` → start Docker containers (`pnpm docker:up`) → create MongoDB text index → seed 200 office items → start Next.js dev server (`pnpm dev`) → verify http://localhost:3000 accessible. Total time: ~15-20 minutes for first-time setup, ~2-3 minutes for subsequent starts.

---

## Metadata

- **Owner**: Tech Lead
- **Last Verified**: 2025-11-12
- **Verification Frequency**: Per release (verify new developers can onboard)
- **Estimated Duration**: 15-20 minutes (first-time setup), 2-3 minutes (subsequent)
- **Complexity**: 🟢 Low
- **Prerequisites**: Windows/macOS/Linux workstation with admin access

---

## Prerequisites

### Required Tools

- [ ] **Node.js 20.x** or later (LTS version recommended)
  - Download: https://nodejs.org/
  - Verify: `node --version` (should show v20.x.x)
  
- [ ] **pnpm 10.21.0** or later (package manager)
  - Install: `npm install -g pnpm@10.21.0`
  - Verify: `pnpm --version` (should show 10.21.0)
  
- [ ] **Docker Desktop** (for MongoDB local container)
  - Download: https://www.docker.com/products/docker-desktop
  - Verify: `docker --version` && `docker compose version`
  
- [ ] **Git** (version control)
  - Download: https://git-scm.com/
  - Verify: `git --version`

### Required Access

- [ ] **GitHub Access**: Read access to `guiofsaints/procureflow` repository
- [ ] **OpenAI API Key** (optional, for testing agent features)
  - Obtain from: https://platform.openai.com/api-keys
  - Not required for catalog/cart/checkout features

---

## Procedure

### Step 1: Clone Repository

**Description**: Clone ProcureFlow repository to local workstation

**Commands** (PowerShell or Bash):

```powershell
# Navigate to workspace directory
cd C:\Workspace  # Windows
# cd ~/workspace  # macOS/Linux

# Clone repository
git clone https://github.com/guiofsaints/procureflow.git

# Navigate to project root
cd procureflow
```

**Expected Output**:
```
Cloning into 'procureflow'...
remote: Enumerating objects: 1234, done.
remote: Counting objects: 100% (1234/1234), done.
remote: Compressing objects: 100% (567/567), done.
Receiving objects: 100% (1234/1234), 5.67 MiB | 10.00 MiB/s, done.
Resolving deltas: 100% (789/789), done.
```

**Verification**:
- [ ] Directory `procureflow/` exists
- [ ] `ls` or `dir` shows `packages/`, `.github/`, `package.json`, etc.

---

### Step 2: Install Dependencies

**Description**: Install Node.js dependencies using pnpm (monorepo with workspaces)

**Commands**:

```powershell
# Install all dependencies (packages/web, packages/infra, root)
pnpm install

# This takes ~2-5 minutes on first install
```

**Expected Output**:
```
Lockfile is up to date, resolution step is skipped
Already up to date
Progress: resolved 567, reused 567, downloaded 0, added 0, done

dependencies:
+ next 15.0.1
+ react 19.2.0
+ typescript 5.9.3
...

Done in 3.2s
```

**Verification**:
- [ ] `node_modules/` directory created in root and `packages/web/`
- [ ] No errors in output (warnings acceptable)
- [ ] `pnpm --version` still shows 10.21.0

---

### Step 3: Configure Environment Variables

**Description**: Copy `.env.example` to `.env.local` and configure local environment variables

**Commands**:

```powershell
# Navigate to web package
cd packages/web

# Copy example env file (PowerShell)
Copy-Item .env.example .env.local

# OR (Bash)
# cp .env.example .env.local

# Edit .env.local with your preferred editor
notepad .env.local  # Windows
# nano .env.local  # Linux/macOS
# code .env.local  # VS Code
```

**Required Configuration** (`.env.local`):

```bash
# Database (uses Docker Compose MongoDB)
MONGODB_URI=mongodb://localhost:27017/procureflow

# NextAuth (generate secret with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-generated-secret-key-here-replace-this
NEXTAUTH_URL=http://localhost:3000

# OpenAI (optional, use "not-set" if not available)
OPENAI_API_KEY=sk-proj-your-key-here-or-not-set

# Environment
NODE_ENV=development
```

**Generate NEXTAUTH_SECRET** (if not already set):

```powershell
# PowerShell
# Install OpenSSL (if not available): choco install openssl
openssl rand -base64 32

# OR (without OpenSSL)
# Use any random 32-character string
```

**Verification**:
- [ ] `.env.local` file exists in `packages/web/`
- [ ] `MONGODB_URI` points to `mongodb://localhost:27017/procureflow`
- [ ] `NEXTAUTH_SECRET` is a random string (not the default)
- [ ] `NEXTAUTH_URL` is `http://localhost:3000`
- [ ] `OPENAI_API_KEY` is set (or "not-set" if testing without agent)

---

### Step 4: Start Docker Services

**Description**: Start MongoDB and mongo-express using Docker Compose

**Commands**:

```powershell
# Navigate back to project root
cd ../..  # From packages/web/ to root

# Start Docker Compose services
pnpm docker:up

# This runs: docker compose -f packages/infra/compose.yaml up -d
```

**Expected Output**:
```
[+] Running 3/3
 ✔ Network procureflow-network  Created
 ✔ Container procureflow-mongo  Started
 ✔ Container procureflow-mongo-express  Started
```

**Verification**:
- [ ] `docker ps` shows 2 running containers: `procureflow-mongo`, `procureflow-mongo-express`
- [ ] MongoDB accessible: http://localhost:27017 (connection refused is expected, use mongo client)
- [ ] Mongo Express UI accessible: http://localhost:8081 (login: admin/password)

**Troubleshooting**:
- If ports 27017 or 8081 already in use: Stop conflicting services or change ports in `packages/infra/compose.yaml`
- If Docker Desktop not running: Start Docker Desktop application

---

### Step 5: Create MongoDB Text Index

**Description**: Create text search index on `items` collection (required for catalog search)

**Commands**:

```powershell
# Run index creation script
pnpm --filter web db:create-text-index

# This runs: tsx packages/web/scripts/create-text-index.ts
```

**Expected Output**:
```
✅ Connected to MongoDB at mongodb://localhost:27017/procureflow
✅ Text index created on items collection
Fields indexed: name, description, category, supplier
Index name: name_text_description_text_category_text_supplier_text
```

**Verification**:
- [ ] Output shows "Text index created"
- [ ] No errors (ignore "collection not found" if running for first time)

**Note**: This script is idempotent (safe to run multiple times)

---

### Step 6: Seed Test Data (Optional)

**Description**: Populate database with 200 test items and demo user

**Commands**:

```powershell
# Seed 200 office supply items
pnpm --filter web db:seed-office-items

# Output:
# ✅ Seeded 200 items successfully

# Seed initial admin user (demo@procureflow.com / demo123)
pnpm --filter web db:seed-initial-user

# Output:
# ✅ User created: demo@procureflow.com
```

**Verification**:
- [ ] `pnpm --filter web db:seed-office-items` completed successfully
- [ ] `pnpm --filter web db:seed-initial-user` completed successfully
- [ ] Mongo Express shows `items` collection with ~200 documents
- [ ] Mongo Express shows `users` collection with 1 document

**Note**: Skip this step if you want an empty database

---

### Step 7: Start Development Server

**Description**: Start Next.js development server with hot reload

**Commands**:

```powershell
# From project root
pnpm dev

# This runs: pnpm --filter web dev
# Next.js starts on http://localhost:3000
```

**Expected Output**:
```
> procureflow-web@1.0.0 dev
> next dev

  ▲ Next.js 15.0.1
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 2.3s
```

**Verification**:
- [ ] Server running on http://localhost:3000
- [ ] Terminal shows "Ready in X.Xs"
- [ ] No errors in terminal

**Keep Terminal Open**: Leave this terminal running (Next.js dev server must stay active)

---

### Step 8: Verify Application

**Description**: Test application in browser to ensure everything works

**Manual Tests**:

1. **Navigate to**: http://localhost:3000
   - **Expected**: Login page displayed (or redirect to /catalog if already logged in)

2. **Login with demo user**:
   - Email: `demo@procureflow.com`
   - Password: `demo123`
   - **Expected**: Redirect to http://localhost:3000/catalog

3. **Test Catalog Search**:
   - Search for "pen"
   - **Expected**: 5+ results displayed (Red Ballpoint Pen, Blue Pen, etc.)

4. **Test Add to Cart**:
   - Click "Add to Cart" on any item
   - Enter quantity: 5
   - **Expected**: Item added to cart, cart badge shows "1"

5. **Test Health Endpoint**:
   - Navigate to: http://localhost:3000/api/health
   - **Expected**: `{ "status": "ok", "timestamp": "2025-11-12T..." }`

**Verification**:
- [ ] Login successful
- [ ] Catalog search returns results
- [ ] Add to cart works
- [ ] Health endpoint returns 200 OK
- [ ] No console errors in browser DevTools

---

## Verification

### Final Checks

**Services Running**:
- [ ] Docker containers running: `docker ps` shows `procureflow-mongo`, `procureflow-mongo-express`
- [ ] Next.js dev server running: Terminal shows "Ready in X.Xs"
- [ ] MongoDB accessible: Mongo Express UI at http://localhost:8081

**Application Working**:
- [ ] Login page loads: http://localhost:3000
- [ ] Health check passes: http://localhost:3000/api/health
- [ ] Catalog search works: Search returns items
- [ ] Cart functionality works: Items can be added to cart

**Hot Reload Working**:
- [ ] Edit `packages/web/src/app/(public)/page.tsx`
- [ ] Save file
- [ ] Browser auto-refreshes with changes (no manual reload needed)

---

## Rollback

### If Setup Fails

**Step 4 (Docker) Failed**:
```powershell
# Stop Docker containers
pnpm docker:down

# Check Docker Desktop is running
docker --version

# Restart Docker Desktop, then retry:
pnpm docker:up
```

**Step 5 (Text Index) Failed**:
```powershell
# Connect to MongoDB manually and create index
mongosh mongodb://localhost:27017/procureflow

# In mongosh shell:
db.items.createIndex(
  { name: "text", description: "text", category: "text", supplier: "text" }
)
exit
```

**Step 7 (Dev Server) Failed**:
```powershell
# Check port 3000 not in use
netstat -ano | findstr :3000  # Windows
# lsof -i :3000  # macOS/Linux

# Kill process using port 3000, then retry:
pnpm dev
```

**Nuclear Option (Full Reset)**:
```powershell
# Stop all services
pnpm docker:down

# Delete node_modules (force clean install)
Remove-Item -Recurse -Force node_modules, packages/*/node_modules  # PowerShell
# rm -rf node_modules packages/*/node_modules  # Bash

# Delete MongoDB data volume
docker volume rm procureflow-mongo-data

# Start from Step 2 (Install Dependencies)
```

---

## Troubleshooting

### Common Issues

**Issue 1: "Port 3000 already in use"**
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
# lsof -ti:3000  # macOS/Linux

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F  # Windows
# kill -9 <PID>  # macOS/Linux

# Retry:
pnpm dev
```

---

**Issue 2: "Cannot connect to MongoDB"**
```
MongooseServerSelectionError: connect ECONNREFUSED localhost:27017
```
**Solution**:
```powershell
# Check Docker containers running
docker ps

# If not running, start Docker services
pnpm docker:up

# Verify MongoDB container is running
docker logs procureflow-mongo
```

---

**Issue 3: "Text index not found" when searching**
```
Error: text index required for $text query
```
**Solution**:
```powershell
# Re-run text index creation
pnpm --filter web db:create-text-index

# Verify index exists in Mongo Express:
# http://localhost:8081 → procureflow → items → Indexes tab
```

---

**Issue 4: "NEXTAUTH_SECRET is not set"**
```
Error: NEXTAUTH_SECRET environment variable is not set
```
**Solution**:
```powershell
# Generate secret
openssl rand -base64 32

# Copy output and add to packages/web/.env.local:
NEXTAUTH_SECRET=<generated-secret>

# Restart dev server
pnpm dev
```

---

**Issue 5: "Agent features not working"**
```
Error: OPENAI_API_KEY is not set or invalid
```
**Solution**:
```powershell
# Option 1: Add valid OpenAI API key to .env.local
OPENAI_API_KEY=sk-proj-your-actual-key

# Option 2: Disable agent features (use "not-set")
OPENAI_API_KEY=not-set

# Restart dev server
pnpm dev
```

---

## Escalation Path

**If runbook doesn't work after troubleshooting**:

1. **First**: Check [CONTRIBUTING.md](/CONTRIBUTING.md) for additional setup notes
2. **Second**: Ask in team Slack channel #dev-support
3. **Third**: Open GitHub issue with label `setup` and include:
   - Operating system and version (Windows 11, macOS 14, Ubuntu 22.04, etc.)
   - Node.js version: `node --version`
   - pnpm version: `pnpm --version`
   - Docker version: `docker --version`
   - Full error message (copy from terminal)
   - Steps already attempted

---

## References

### Internal Documents

- [Infrastructure Documentation](../../architecture/infrastructure.md) - Local environment details
- [CONTRIBUTING.md](/CONTRIBUTING.md) - Development guidelines
- [Troubleshooting Runbook](./troubleshooting.md) - Common failure scenarios

### External Resources

- [Next.js Documentation](https://nextjs.org/docs) - Next.js development
- [Docker Compose](https://docs.docker.com/compose/) - Docker Compose reference
- [MongoDB Manual](https://www.mongodb.com/docs/manual/) - MongoDB documentation
- [pnpm Workspaces](https://pnpm.io/workspaces) - Monorepo management

---

**Last Updated**: 2025-11-12  
**Status**: ✅ Verified (Tech Lead onboarded new developer successfully)
