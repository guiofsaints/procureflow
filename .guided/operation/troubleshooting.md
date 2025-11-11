# Troubleshooting Guide

> **Status**: Living Document  
> **Last Updated**: 2025-11-10

## Common Issues and Solutions

### 1. MongoDB Connection Errors

**Symptom**: `Error: ECONNREFUSED` or `MongooseServerSelectionError`

**Causes**:

- MongoDB not running
- Incorrect MONGODB_URI
- Network issues

**Solutions**:

```zsh
# Check if MongoDB is running (Docker)
docker ps | grep mongo

# Start MongoDB with Docker
pnpm docker:db

# Verify connection string in .env.local
echo $MONGODB_URI  # Should be mongodb://localhost:27017/procureflow

# Test connection
mongosh mongodb://localhost:27017/procureflow
```

---

### 2. Text Search Not Working

**Symptom**: Catalog search returns empty results or `IndexNotFound` error

**Cause**: Missing text index on items collection

**Solution**:

```zsh
# Create required text index
pnpm --filter web db:create-text-index
```

**Verification**:

```zsh
# Connect to MongoDB
mongosh mongodb://localhost:27017/procureflow

# Check indexes
db.items.getIndexes()
# Should see index on: { name: "text", category: "text", description: "text" }
```

---

### 3. Agent Returns No Results

**Symptom**: Agent says "No items found" for valid queries

**Causes**:

- No items in database
- Missing text index
- Missing OpenAI API key

**Solutions**:

```zsh
# 1. Verify items exist
mongosh mongodb://localhost:27017/procureflow
db.items.countDocuments()  # Should be > 0

# 2. Seed items if empty
pnpm --filter web db:seed-office-items

# 3. Create text index
pnpm --filter web db:create-text-index

# 4. Verify OpenAI API key
grep OPENAI_API_KEY .env.local
```

---

### 4. Authentication Errors

**Symptom**: `User must be authenticated` errors or login fails

**Causes**:

- Missing NEXTAUTH_SECRET
- Incorrect NEXTAUTH_URL
- Session expired

**Solutions**:

```zsh
# 1. Verify environment variables
grep NEXTAUTH .env.local

# 2. Generate new secret if missing
openssl rand -base64 32

# 3. Ensure NEXTAUTH_URL matches your app URL
# Dev: http://localhost:3000
# Prod: https://your-domain.com

# 4. Clear cookies and re-login
# In browser: DevTools → Application → Cookies → Clear
```

**Demo Credentials**:

- Email: `demo@procureflow.com`
- Password: `demo123`

---

### 5. TypeScript Path Resolution Errors

**Symptom**: `Cannot find module '@/features/...'`

**Cause**: Import from internal file instead of barrel export

**Solution**:

```typescript
// ❌ Wrong
import { searchItems } from '@/features/catalog/lib/catalog.service';

// ✅ Correct
import { searchItems } from '@/features/catalog';
```

**Verify**: Check `tsconfig.json` has correct path aliases.

---

### 6. Next.js Build Errors

**Symptom**: `next build` fails with type errors

**Causes**:

- TypeScript errors in code
- Missing dependencies
- Environment variables not set

**Solutions**:

```zsh
# 1. Run type check
pnpm --filter web type-check

# 2. Verify all dependencies installed
pnpm install

# 3. Check for missing env vars (build reads .env.local)
cat .env.local

# 4. Clear Next.js cache
rm -rf packages/web/.next
pnpm build
```

---

### 7. pnpm Install Failures

**Symptom**: `pnpm install` fails or shows version mismatch

**Causes**:

- Wrong pnpm version
- Lock file corruption

**Solutions**:

```zsh
# 1. Check pnpm version
pnpm --version  # Should be 9.15.1

# 2. Install correct version
npm install -g pnpm@9.15.1

# 3. Clean install
rm -rf node_modules packages/*/node_modules
rm pnpm-lock.yaml
pnpm install
```

---

### 8. Docker Compose Issues

**Symptom**: `pnpm docker:up` fails

**Causes**:

- Docker daemon not running
- Port conflicts (27017, 8081)

**Solutions**:

```zsh
# 1. Verify Docker is running
docker ps

# 2. Check for port conflicts
lsof -i :27017  # Should be empty or show docker
lsof -i :8081

# 3. Stop conflicting processes
# Or change ports in docker-compose.yml

# 4. Restart Docker
# macOS: Restart Docker Desktop

# 5. Clean start
pnpm docker:down
docker system prune -f
pnpm docker:up
```

---

### 9. AI Provider Errors

**Symptom**: Agent fails with API errors

**Causes**:

- Invalid API key
- Rate limit exceeded
- Network issues

**Solutions**:

```zsh
# 1. Verify API key
grep OPENAI_API_KEY .env.local

# 2. Test API key directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# 3. Check rate limits
# OpenAI: 60 requests/minute (tier 1)

# 4. Switch to Gemini if OpenAI unavailable
# Set AI_PROVIDER=gemini in .env.local
# Add GOOGLE_API_KEY
```

---

### 10. Hot Reload Issues (Development)

**Symptom**: Changes not reflecting in browser

**Solutions**:

```zsh
# 1. Hard refresh browser
# macOS: Cmd+Shift+R

# 2. Restart dev server
# Kill process (Ctrl+C) and run:
pnpm dev

# 3. Clear Next.js cache
rm -rf packages/web/.next
pnpm dev
```

---

## Diagnostic Commands

### Check System Health

```zsh
# Node version
node --version

# pnpm version
pnpm --version

# MongoDB connection
mongosh mongodb://localhost:27017/procureflow --eval "db.stats()"

# Check running processes
pnpm docker:ps

# View logs
pnpm docker:logs
```

### Verify Database State

```zsh
mongosh mongodb://localhost:27017/procureflow

# Count items
db.items.countDocuments()

# Count users
db.users.countDocuments()

# Check indexes
db.items.getIndexes()

# Sample items
db.items.findOne()
```

### Check Application Health

```zsh
# Health check endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","version":"..."}
```

---

## Performance Issues

### Slow Database Queries

**Symptom**: API responses > 1 second

**Diagnostic**:

```javascript
// Enable Mongoose query logging
mongoose.set('debug', true);
```

**Solutions**:

- Ensure indexes exist (especially text index)
- Use `.lean()` for read-only queries
- Review query patterns in service layer

### High AI Token Usage

**Symptom**: High OpenAI costs

**Diagnostic**: Check metrics at `/api/metrics`

**Solutions**:

- Reduce conversation history length
- Use shorter system prompts
- Switch to cheaper model (gpt-3.5-turbo)
- Implement caching for common queries

---

## Getting Help

### Logs

```zsh
# View application logs (development)
# Logs output to console when running `pnpm dev`

# View Docker logs
pnpm docker:logs
```

### Debug Mode

Set `LOG_LEVEL=debug` in `.env.local` for verbose logging.

### Common Error Codes

| Code | Meaning      | Common Cause           |
| ---- | ------------ | ---------------------- |
| 400  | Bad Request  | Invalid input          |
| 401  | Unauthorized | Not logged in          |
| 404  | Not Found    | Invalid endpoint or ID |
| 409  | Conflict     | Duplicate item         |
| 500  | Server Error | Unhandled exception    |

---

## Related Documentation

- Setup instructions: `.guided/base/setup.instructions.md`
- Environment variables: `.guided/context/env.md`
- Architecture: `.guided/architecture/context.md`
