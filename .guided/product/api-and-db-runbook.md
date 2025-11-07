# API and Database Runbook

**Version**: 1.0.0  
**Last Updated**: November 7, 2025  
**Audience**: Developers working on the ProcureFlow tech case

---

## 1. Prerequisites

Before running the ProcureFlow API locally, ensure you have:

- **Node.js** ≥ 18.17.0 ([Download](https://nodejs.org/))
- **pnpm** ≥ 8.0.0 (Install: `npm install -g pnpm`)
- **Docker** and **Docker Compose** ([Download](https://www.docker.com/products/docker-desktop))
- **Git** for cloning the repository

### Optional Tools

- **MongoDB Compass**: GUI for browsing MongoDB ([Download](https://www.mongodb.com/products/tools/compass))
- **Postman** or **Insomnia**: API testing ([Download](https://www.postman.com/))

---

## 2. Initial Setup

### Clone Repository and Install Dependencies

```powershell
# Clone repository
git clone <repository-url>
cd procureflow

# Install dependencies
pnpm install
```

### Environment Variables

Create `.env.local` in `apps/web/`:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/procureflow

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# OpenAI (for AI agent)
OPENAI_API_KEY=sk-your-api-key-here

# Optional: Test Database
MONGODB_TEST_URI=mongodb://localhost:27017/procureflow_test
```

**Important**: Generate a secure `NEXTAUTH_SECRET`:

```powershell
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## 3. Starting MongoDB

### Option A: Docker Compose (Recommended)

Start MongoDB in a Docker container:

```powershell
# Start MongoDB only
pnpm docker:db

# Or start all services (MongoDB + web app)
pnpm docker:up
```

MongoDB will be available at:
- **Connection String**: `mongodb://localhost:27017/procureflow`
- **Admin UI** (optional): `http://localhost:8081` (with `--profile debug`)

To stop:

```powershell
pnpm docker:down
```

### Option B: Local MongoDB Installation

If you have MongoDB installed locally:

```powershell
# Windows (if MongoDB is in PATH)
mongod --dbpath C:\data\db

# Or use MongoDB Compass to start a local instance
```

### Verify MongoDB Connection

```powershell
# Using mongosh CLI
mongosh "mongodb://localhost:27017/procureflow"

# Test connection
db.adminCommand('ping')
```

---

## 4. Running the Next.js Development Server

### Start Development Server

```powershell
# From project root
pnpm dev
```

The API will be available at:
- **Base URL**: `http://localhost:3000/api`
- **Health Check**: `http://localhost:3000/api/health`
- **API Docs**: `http://localhost:3000/docs/api`
- **OpenAPI Spec**: `http://localhost:3000/api/openapi`

### Build for Production

```powershell
pnpm build
pnpm start
```

---

## 5. Database Migrations and Indexes

### Schema and Index Creation

Mongoose schemas automatically create indexes on first connection. The application handles this via schema definitions.

**No manual migration needed** for the tech case. Indexes are defined in:
- `apps/web/src/lib/db/schemas/*.schema.ts`

### Verify Indexes

```javascript
// In mongosh
use procureflow

// Check indexes for each collection
db.users.getIndexes()
db.items.getIndexes()
db.carts.getIndexes()
db.purchase_requests.getIndexes()
db.agent_conversations.getIndexes()
```

Expected indexes:
- **users**: `email` (unique)
- **items**: `name + category` (compound), text index on `name + description`
- **carts**: `userId` (unique)
- **purchase_requests**: `requestNumber` (unique), `userId`, `createdAt`
- **agent_conversations**: `userId`, `status`, `createdAt`

### Resetting the Database

**⚠️ CAUTION: This deletes all data**

```javascript
// In mongosh
use procureflow
db.dropDatabase()
```

Or via Docker:

```powershell
# Remove MongoDB container and volume
docker-compose down -v
docker-compose up mongo
```

---

## 6. Running Tests with Vitest

### Prerequisites

Tests require a running MongoDB instance (test database).

### Run All Tests

```powershell
# Run all tests once
pnpm test

# Run with verbose output
pnpm test:api

# Watch mode (re-run on file changes)
pnpm test:watch
```

### Test Database

Tests use a separate database: `procureflow_test`

**Database is automatically cleaned** between test runs in setup files.

### Test Coverage

Current test suites:
- `apps/web/tests/api/items.test.ts` - Catalog operations
- `apps/web/tests/api/cart-and-checkout.test.ts` - Cart and checkout flow
- `apps/web/tests/api/agent.test.ts` - AI agent smoke tests

### Debugging Tests

```powershell
# Run specific test file
pnpm vitest run apps/web/tests/api/items.test.ts

# Run tests matching pattern
pnpm vitest run -t "should create a new item"
```

---

## 7. API Endpoints Reference

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T10:30:00.000Z",
  "checks": {
    "api": "healthy",
    "db": "ok"
  },
  "uptime": 12345.67
}
```

### Catalog

#### Search Items

```http
GET /api/items?q=USB&limit=10
```

#### Create Item

```http
POST /api/items
Authorization: (requires auth)

{
  "name": "USB-C Cable",
  "category": "Electronics",
  "description": "High-speed USB-C cable, 2 meters long",
  "estimatedPrice": 15.99
}
```

### Cart

#### Get Cart

```http
GET /api/cart
Authorization: (requires auth)
```

#### Add to Cart

```http
POST /api/cart/items
Authorization: (requires auth)

{
  "itemId": "673c5e9f8a1b2c3d4e5f6789",
  "quantity": 2
}
```

#### Update Quantity

```http
PATCH /api/cart/items/{itemId}
Authorization: (requires auth)

{
  "quantity": 5
}
```

#### Remove from Cart

```http
DELETE /api/cart/items/{itemId}
Authorization: (requires auth)
```

### Checkout

```http
POST /api/checkout
Authorization: (requires auth)

{
  "notes": "Urgent order for Q4 project"
}
```

### Agent Chat

```http
POST /api/agent/chat

{
  "message": "I need 10 USB cables under $20 each",
  "conversationId": "optional-for-continuing"
}
```

---

## 8. API Documentation

### Interactive Swagger UI

Visit: `http://localhost:3000/docs/api`

Features:
- Browse all endpoints
- Try requests directly in browser
- View request/response schemas
- See validation rules

### OpenAPI Specification

Raw JSON spec: `http://localhost:3000/api/openapi`

Use with tools like:
- Postman (import OpenAPI spec)
- Insomnia
- Swagger Editor

---

## 9. Common Operations

### Create Demo User (For Authentication)

Currently using hardcoded demo credentials:
- **Email**: `demo@procureflow.com`
- **Password**: `demo123`

**TODO**: Implement proper user registration in production.

### Seed Sample Data

Create sample items via API:

```powershell
# Using curl (if available) or Postman

curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Office Chair",
    "category": "Furniture",
    "description": "Ergonomic office chair with lumbar support",
    "estimatedPrice": 299.99
  }'
```

### Monitor Database Changes

```javascript
// In mongosh - watch for changes
use procureflow

db.items.find().pretty()
db.carts.find().pretty()
db.purchase_requests.find().pretty()
```

Or use **MongoDB Compass** GUI:
1. Connect to `mongodb://localhost:27017`
2. Select `procureflow` database
3. Browse collections visually

---

## 10. Troubleshooting

### MongoDB Connection Failed

**Symptom**: `Failed to connect to MongoDB` error

**Solutions**:
1. Verify MongoDB is running:
   ```powershell
   docker ps  # Should show mongo container
   ```

2. Check connection string in `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/procureflow
   ```

3. Restart MongoDB:
   ```powershell
   pnpm docker:down
   pnpm docker:db
   ```

### Port Already in Use

**Symptom**: `Port 3000 is already in use`

**Solution**:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (use PID from above)
taskkill /PID <PID> /F

# Or change port in package.json dev script:
"dev": "next dev -p 3001"
```

### Tests Failing

**Symptom**: Vitest tests fail with connection errors

**Solutions**:
1. Ensure MongoDB is running
2. Check test database URI in `.env.local`:
   ```env
   MONGODB_TEST_URI=mongodb://localhost:27017/procureflow_test
   ```

3. Clear test database:
   ```javascript
   use procureflow_test
   db.dropDatabase()
   ```

### OpenAI API Errors

**Symptom**: Agent chat fails with API errors

**Solutions**:
1. Verify `OPENAI_API_KEY` in `.env.local`
2. Check API key has credits
3. Review rate limits

**Fallback**: Agent will return error message gracefully, tests will still pass.

---

## 11. Production Deployment Checklist

**⚠️ For production deployment** (beyond tech case scope):

- [ ] Generate secure `NEXTAUTH_SECRET`
- [ ] Use MongoDB Atlas or managed database
- [ ] Set up proper user registration and authentication
- [ ] Configure environment-specific variables
- [ ] Enable MongoDB replica set for transactions
- [ ] Set up monitoring and logging
- [ ] Review and implement rate limiting
- [ ] Secure API keys in secret management system
- [ ] Run database backups
- [ ] Configure CORS and security headers

---

## 12. Quick Reference Commands

```powershell
# Start MongoDB
pnpm docker:db

# Start dev server
pnpm dev

# Run tests
pnpm test

# Run specific test file
pnpm vitest run apps/web/tests/api/items.test.ts

# Build for production
pnpm build

# Type check
pnpm type-check

# Lint code
pnpm lint

# Format code
pnpm format

# Stop Docker services
pnpm docker:down
```

---

## 13. Additional Resources

- **MongoDB Documentation**: https://docs.mongodb.com/
- **Next.js Documentation**: https://nextjs.org/docs
- **Vitest Documentation**: https://vitest.dev/
- **OpenAPI Specification**: https://swagger.io/specification/

---

**Document Status**: ✅ **Ready for Use**

This runbook provides all necessary information to run the ProcureFlow API and database locally, execute tests, and troubleshoot common issues.
