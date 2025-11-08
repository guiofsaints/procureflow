# Database Migration Scripts

This directory contains database migration and maintenance scripts for ProcureFlow.

## Available Scripts

### `seed-initial-user.ts`

Creates the initial admin user account for ProcureFlow with secure password hashing.

**Usage:**

```bash
# From project root
pnpm --filter web db:seed-initial-user

# Or directly with tsx
cd apps/web
npx tsx scripts/seed-initial-user.ts
```

**What it does:**

- Creates an admin user with email `guilherme@procureflow.com`
- Uses bcrypt to hash the password securely
- Skips creation if user already exists
- Idempotent - safe to run multiple times

**Credentials:**

- Email: `guilherme@procureflow.com`
- Password: `guigui123`
- Role: `admin`

**When to run:**

- After initial database setup
- When setting up a new environment
- To create the first admin user

---

### `create-text-index.ts`

Creates a text index on the `items` collection to enable full-text search using MongoDB's `$text` query operator.

**Usage:**

```bash
# From project root
pnpm --filter web db:create-text-index

# Or directly with tsx
cd apps/web
npx tsx scripts/create-text-index.ts
```

**What it does:**

- Connects to MongoDB using `MONGODB_URI` from environment
- Creates a compound text index on `name`, `description`, and `category` fields
- Configures field weights (name: 10, category: 5, description: 1)
- Idempotent - safe to run multiple times
- Lists all indexes after completion

**When to run:**

- After initial database setup
- When deploying to a new environment
- If you encounter `IndexNotFound` errors during catalog search

**Index Details:**

```javascript
{
  name: 'items_text_search_idx',
  key: { name: 'text', description: 'text', category: 'text' },
  weights: { name: 10, category: 5, description: 1 },
  default_language: 'english'
}
```

---

### `seed-office-items.ts`

Populates the database with 200 office supply items across 10 categories for testing and development.

**Usage:**

```bash
# From project root
pnpm --filter web db:seed-office-items

# Or directly with tsx
cd apps/web
npx tsx scripts/seed-office-items.ts
```

**What it does:**

- Connects to MongoDB using `MONGODB_URI` from environment
- Inserts 200 office items with realistic names, descriptions, and prices
- Skips items that already exist (checks by name + category)
- Provides detailed breakdown by category
- Idempotent - safe to run multiple times

**Categories (200 items total):**

- Office Supplies: 30 items
- Paper Products: 30 items
- Writing Instruments: 25 items
- Electronics: 25 items
- Filing & Storage: 25 items
- Furniture: 20 items
- Technology Accessories: 15 items
- Breakroom Supplies: 10 items
- Cleaning Supplies: 10 items
- Safety Equipment: 10 items

**When to run:**

- After initial database setup
- When setting up a development environment
- To populate a demo/test environment
- After clearing the database

**Example items:**

- "Wireless Mouse" - Electronics - $24.99
- "Office Chair Ergonomic" - Furniture - $249.99
- "Copy Paper Ream" - Paper Products - $24.99
- "Ballpoint Pen Black" - Writing Instruments - $1.99

## Environment Variables

All scripts use the following environment variables:

- `MONGODB_URI`: MongoDB connection string (defaults to local Docker setup)

## Notes

- Scripts use `tsx` for TypeScript execution without build step
- All scripts are designed to be idempotent (safe to run multiple times)
- Scripts connect directly to MongoDB, bypassing the Next.js app
- ESLint warnings for `console.log` are expected in migration scripts
