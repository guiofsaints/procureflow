# Plugins and Extensibility

> **Status**: Current Analysis  
> **Last Updated**: 2025-11-10

## Overview

ProcureFlow currently has minimal plugin infrastructure but several extensibility points for future enhancement.

## Current Extensibility Points

### 1. AI Provider Abstraction

**Mechanism**: Environment variable-driven provider selection

**Implementation**: `lib/ai/langchainClient.ts`

**Extension Method**:

1. Add new provider import (e.g., Anthropic, Cohere)
2. Update `AIProvider` type
3. Add provider configuration
4. Update `createChatModel()` function

**Example**:

```typescript
type AIProvider = 'openai' | 'gemini' | 'anthropic';
```

### 2. Agent Tools

**Mechanism**: JSON schema-based function calling

**Implementation**: `features/agent/lib/agent.service.ts` → `tools` array

**Extension Method**:

1. Define tool JSON schema
2. Add case in `executeTool()` switch
3. Call appropriate service function

**Example**:

```typescript
{
  name: 'my_new_tool',
  description: 'Description for LLM',
  parameters: { /* JSON schema */ }
}
```

### 3. Service Layer

**Mechanism**: Framework-agnostic service functions

**Extension Method**:

1. Create new feature folder: `features/<name>/`
2. Add service: `features/<name>/lib/<name>.service.ts`
3. Export via barrel: `features/<name>/index.ts`
4. Call from route handlers or agent tools

### 4. Mongoose Schemas

**Mechanism**: Schema definition + model export

**Extension Method**:

1. Define schema: `lib/db/schemas/<entity>.schema.ts`
2. Export model: `lib/db/models.ts`
3. Add domain interface: `domain/entities.ts`

### 5. Logging Transports

**Mechanism**: Winston transports

**Implementation**: `lib/logger/winston.config.ts`

**Extension Method**:
Add new transport (e.g., Datadog, Sentry):

```typescript
transports: [
  new transports.Console(),
  new DatadogTransport({
    /* config */
  }),
];
```

### 6. Metrics

**Mechanism**: Prometheus custom metrics

**Implementation**: `lib/metrics/`

**Extension Method**:
Define new metric:

```typescript
const myMetric = new Counter({
  name: 'my_metric_total',
  help: 'Description',
});
```

## Future Plugin Opportunities

### 1. Authentication Providers

**Current**: Credentials-only  
**Future**: OAuth providers (Google, Microsoft, GitHub)

**Mechanism**: NextAuth providers configuration

### 2. Catalog Data Sources

**Current**: MongoDB only  
**Future**: External APIs, ERP integrations

**Mechanism**: Adapter pattern in catalog service

### 3. Notification Channels

**Current**: None  
**Future**: Email, Slack, SMS

**Mechanism**: Notification service with channel adapters

### 4. Approval Workflow Engines

**Current**: None  
**Future**: Configurable approval rules

**Mechanism**: Rule engine + workflow definitions

### 5. Analytics Integrations

**Current**: Prometheus only  
**Future**: Google Analytics, Mixpanel, Segment

**Mechanism**: Analytics middleware/hooks

## Non-Plugin Extensibility

### Configuration

Environment variables in `.env.local` allow:

- AI provider selection
- Database connection
- Log level
- Feature flags (future)

### Database Seeding

Scripts in `packages/web/scripts/` for:

- Custom catalog data
- Test users
- Demo scenarios

## Constraints

**No Hot-Plugging**: Changes require code modification and rebuild  
**No Runtime Plugin Loading**: Plugins are compile-time integrations  
**No Plugin Marketplace**: Custom extensions only

## Related Documentation

- AI integration: `.guided/architecture/stack.md`
- Service patterns: `.guided/architecture/context.md`
