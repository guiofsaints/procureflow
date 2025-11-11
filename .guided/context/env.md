# Environment Variables Reference

> **Status**: Documentation  
> **Last Updated**: 2025-11-10

## Required Variables

### Database

**MONGODB_URI**
- **Purpose**: MongoDB connection string
- **Format**: `mongodb://localhost:27017/procureflow` (local) or MongoDB Atlas connection string
- **Example**: `mongodb://localhost:27017/procureflow`
- **Required**: Yes

### Authentication

**NEXTAUTH_SECRET**
- **Purpose**: Secret key for encrypting JWT tokens
- **Format**: Random string (32+ characters)
- **Generate**: `openssl rand -base64 32`
- **Required**: Yes

**NEXTAUTH_URL**
- **Purpose**: Application base URL
- **Format**: Full URL including protocol
- **Example Dev**: `http://localhost:3000`
- **Example Prod**: `https://procureflow.example.com`
- **Required**: Yes

## Optional Variables (AI Features)

### AI Provider

**OPENAI_API_KEY**
- **Purpose**: OpenAI API access
- **Format**: `sk-...`
- **Required**: Yes (if using OpenAI as AI provider)
- **Get Key**: https://platform.openai.com/api-keys

**GOOGLE_API_KEY**
- **Purpose**: Google Gemini API access
- **Format**: API key string
- **Required**: Yes (if using Gemini as AI provider)
- **Get Key**: https://aistudio.google.com/app/apikey

**AI_PROVIDER**
- **Purpose**: Force specific AI provider
- **Format**: `openai` or `gemini`
- **Default**: Auto-detected based on available keys (OpenAI preferred)
- **Required**: No

## Optional Variables (Observability)

### Logging

**LOG_LEVEL**
- **Purpose**: Winston log level
- **Format**: `error`, `warn`, `info`, `debug`
- **Default**: `info`
- **Required**: No

**LOKI_HOST**
- **Purpose**: Grafana Loki endpoint for log aggregation
- **Format**: Full URL
- **Example**: `http://loki:3100`
- **Required**: No (falls back to console)

### Metrics

**METRICS_ENABLED**
- **Purpose**: Enable Prometheus metrics
- **Format**: `true` or `false`
- **Default**: `true`
- **Required**: No

### LangSmith Tracing

**LANGCHAIN_TRACING_V2**
- **Purpose**: Enable LangSmith tracing for AI debugging
- **Format**: `true` or `false`
- **Default**: `false`
- **Required**: No

**LANGCHAIN_API_KEY**
- **Purpose**: LangSmith API key
- **Format**: API key string
- **Required**: Only if LANGCHAIN_TRACING_V2=true

**LANGCHAIN_PROJECT**
- **Purpose**: LangSmith project name
- **Format**: String
- **Default**: `default`
- **Required**: No

## Example .env.local

```env
# Database
MONGODB_URI=mongodb://localhost:27017/procureflow

# Authentication
NEXTAUTH_SECRET=your-secret-key-here-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000

# AI Provider (choose one)
OPENAI_API_KEY=sk-...
# GOOGLE_API_KEY=...

# Optional: Force provider
# AI_PROVIDER=openai

# Optional: Logging
# LOG_LEVEL=debug
# LOKI_HOST=http://loki:3100

# Optional: LangSmith Tracing
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_API_KEY=...
# LANGCHAIN_PROJECT=procureflow
```

## Production Considerations

### Secrets Management

**DO NOT**:
- Commit `.env.local` to git
- Include secrets in Docker images
- Expose secrets in client-side code

**DO**:
- Use environment-specific secrets management (GCP Secret Manager, AWS Secrets Manager)
- Rotate secrets regularly
- Use different values per environment (dev, staging, prod)

### Security

- Use strong NEXTAUTH_SECRET (generate with `openssl rand -base64 32`)
- Use HTTPS in production (update NEXTAUTH_URL)
- Restrict MongoDB access with authentication
- Store API keys in secure vault

## Validation

The application validates required environment variables on startup and will fail with clear errors if missing.

## Related Documentation

- Setup instructions: `.guided/base/setup.instructions.md`
- System context: `.guided/tmp/system.context.md`
