# ProcureFlow Setup Instructions

> **Status**: TODO - To be completed  
> **Last Updated**: 2025-11-10

## Prerequisites

- Node.js 18.17.0 or higher
- pnpm 9.15.1 (strict)
- Docker & docker-compose (optional, for MongoDB)
- MongoDB 6.0+ (local or cloud)

## Environment Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd procureflow
pnpm install
```

### 2. Environment Variables

Copy the environment template and configure:

```bash
cp .env.example .env.local
```

Required variables documented in `.guided/context/env.md`.

### 3. Database Setup

Start MongoDB (choose one):

**Option A: Docker** (recommended)

```bash
pnpm docker:db
```

**Option B: Local MongoDB**

- Install MongoDB 6.0+
- Ensure running on `localhost:27017`

### 4. Initialize Database

```bash
# Create required text index
pnpm --filter web db:create-text-index

# Seed test data
pnpm --filter web db:seed-office-items
pnpm --filter web db:seed-initial-user
```

### 5. Start Development Server

```bash
pnpm dev
```

Access at http://localhost:3000

## Development Workflow

Refer to `.github/copilot-instructions.md` for detailed patterns and conventions.

## Troubleshooting

See `.guided/operation/troubleshooting.md`
