# AI Provider Best Practices Assessment

**Assessment Date**: 2025-11-10  
**Providers**: OpenAI (GPT-4o-mini), Google Gemini (gemini-2.0-flash)  
**Scope**: Rate limiting, retries, timeouts, fallbacks, token accounting, safety, observability

---

## Executive Summary

The current AI provider integration is **functional but not production-ready**. Critical missing components:

❌ **No rate limiting enforcement**  
❌ **No retry logic** (single-shot requests)  
❌ **No circuit breaker** pattern  
❌ **No token accounting** (cost tracking)  
❌ **No prompt/response caching**  
❌ **No PII redaction**  
❌ **No content moderation**  
❌ **No structured observability**

**Risk Level**: **HIGH** - vulnerable to API outages, quota exhaustion, cost overruns, and abuse.

---

## 1. Rate Limiting

### Current State

**OpenAI**:

- ❌ No rate limiting in code
- ⚠️ Headers returned but not checked
  ```typescript
  // lib/ai/langchainClient.ts - OpenAI timeout exists but no rate limiting
  new ChatOpenAI({
    timeout: 30000, // 30s
  });
  ```
- **Default Limits** (varies by tier):
  - Free tier: 3 RPM, 40K TPM
  - Pay-as-you-go tier 1: 3.5K RPM, 200K TPM
  - Tier 5: 10K RPM, 2M TPM

**Gemini**:

- ❌ No rate limiting in code
- ❌ No timeout configured
- **Free Tier Limits** (documented but not enforced):
  - **15 RPM** (requests per minute)
  - **1,500 RPD** (requests per day)
  - **1M TPM** (tokens per minute)

**File**: `docs/GEMINI_INTEGRATION.md:45-49`

### Risks

1. **429 Too Many Requests** → User sees error "AI API rate limit exceeded"
2. **Quota exhaustion** → All users blocked until reset
3. **Cost overruns** → No budget caps on OpenAI usage
4. **Abuse** → No per-user limits (single user can exhaust quota)

### Best Practice Implementation

#### Option 1: Client-Side Rate Limiting (Recommended for MVP)

```typescript
// lib/ai/ratelimiter.ts (NEW FILE)
import Bottleneck from 'bottleneck';

const openaiLimiter = new Bottleneck({
  reservoir: 3000, // 3K requests
  reservoirRefreshAmount: 3000,
  reservoirRefreshInterval: 60 * 1000, // Per minute
  minTime: 20, // Min 20ms between requests (3K RPM = ~17ms)
});

const geminiLimiter = new Bottleneck({
  reservoir: 15, // 15 requests (free tier)
  reservoirRefreshAmount: 15,
  reservoirRefreshInterval: 60 * 1000, // Per minute
  minTime: 4000, // Min 4s between requests (15 RPM)
});

export async function rateLimitedInvoke(
  provider: 'openai' | 'gemini',
  fn: () => Promise<any>
) {
  const limiter = provider === 'openai' ? openaiLimiter : geminiLimiter;
  return limiter.schedule(fn);
}
```

**Usage**:

```typescript
// lib/ai/langchainClient.ts
const response = await rateLimitedInvoke(AI_PROVIDER, () =>
  model.invoke(messages, invokeOptions)
);
```

**Dependencies**: `pnpm add bottleneck`

---

#### Option 2: Server-Side Queue (Recommended for Production)

```typescript
// lib/queue/agent-queue.ts (NEW FILE)
import Bull from 'bull';

const agentQueue = new Bull('agent-messages', {
  redis: process.env.REDIS_URL,
  limiter: {
    max: AI_PROVIDER === 'gemini' ? 15 : 3000, // Per minute
    duration: 60000,
  },
});

agentQueue.process(async (job) => {
  const { userId, message, conversationId } = job.data;
  return await handleAgentMessage({ userId, message, conversationId });
});

export async function enqueueAgentMessage(params) {
  return agentQueue.add(params, {
    priority: 1, // Normal priority
    attempts: 3, // Retry 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s
    },
  });
}
```

**Dependencies**: `pnpm add bull redis`

---

### Rate Limit Headers Parsing

**OpenAI** returns headers (already fetched in health check):

```typescript
x-ratelimit-limit-requests: 10000
x-ratelimit-remaining-requests: 9995
x-ratelimit-reset-requests: 5s
x-ratelimit-limit-tokens: 2000000
x-ratelimit-remaining-tokens: 1999000
x-ratelimit-reset-tokens: 1m30s
```

**Action**: Parse and respect these headers before making requests.

**Gemini** does NOT return rate limit headers → Must enforce client-side limits.

---

## 2. Retry Logic & Backoff

### Current State

**File**: `lib/ai/langchainClient.ts:452-475`

```typescript
catch (error) {
  if (error.message.includes('rate limit') || error.message.includes('429')) {
    throw new Error('AI API rate limit exceeded. Please wait a moment and try again.');
  }
  if (error.message.includes('quota') || error.message.includes('insufficient_quota')) {
    throw new Error('AI API quota exceeded. ...');
  }
  if (error.message.includes('timeout')) {
    throw new Error('AI API request timed out. Please try again.');
  }
  // NO RETRY - just throw
}
```

**Problems**:

- ❌ Single-shot requests (no retries)
- ❌ User must manually retry
- ❌ No exponential backoff

### Best Practice Implementation

#### Retry with Exponential Backoff

```typescript
// lib/ai/retry.ts (NEW FILE)
import pRetry from 'p-retry';

const RETRYABLE_ERROR_CODES = [
  429, // Rate limit
  503, // Service unavailable
  500, // Internal server error (transient)
];

export async function retryLLMCall<T>(
  fn: () => Promise<T>,
  options?: {
    retries?: number;
    minTimeout?: number;
    maxTimeout?: number;
  }
): Promise<T> {
  return pRetry(
    async () => {
      try {
        return await fn();
      } catch (error) {
        // Extract status code from error
        const status = error?.status || error?.response?.status;

        if (RETRYABLE_ERROR_CODES.includes(status)) {
          throw error; // Will retry
        }

        // Non-retryable error - throw with AbortError
        throw new pRetry.AbortError(error.message);
      }
    },
    {
      retries: options?.retries ?? 3,
      minTimeout: options?.minTimeout ?? 1000, // 1s
      maxTimeout: options?.maxTimeout ?? 10000, // 10s
      factor: 2, // Exponential backoff: 1s, 2s, 4s, 8s
      randomize: true, // Add jitter to prevent thundering herd
      onFailedAttempt: (error) => {
        console.warn(
          `LLM call attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
        );
      },
    }
  );
}
```

**Usage**:

```typescript
const response = await retryLLMCall(() =>
  model.invoke(messages, invokeOptions)
);
```

**Dependencies**: `pnpm add p-retry`

---

## 3. Timeouts

### Current State

**OpenAI**: ✅ Timeout configured (30s)

```typescript
new ChatOpenAI({
  timeout: 30000, // 30 seconds
});
```

**Gemini**: ❌ No timeout configured

```typescript
new ChatGoogleGenerativeAI({
  // No timeout property
});
```

### Risks

- Gemini requests can hang indefinitely
- No circuit breaker for slow/stuck requests

### Best Practice Implementation

#### Unified Timeout Wrapper

```typescript
// lib/ai/timeout.ts (NEW FILE)
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(errorMessage || `Operation timed out after ${timeoutMs}ms`)
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}
```

**Usage**:

```typescript
const response = await withTimeout(
  model.invoke(messages, invokeOptions),
  AI_PROVIDER === 'gemini' ? 30000 : 30000, // 30s for both
  'LLM request timed out'
);
```

---

## 4. Circuit Breaker Pattern

### Current State

❌ **Not implemented** - no protection against cascading failures.

### Best Practice Implementation

```typescript
// lib/ai/circuit-breaker.ts (NEW FILE)
import CircuitBreaker from 'opossum';

const openaiBreaker = new CircuitBreaker(
  async (fn: () => Promise<any>) => fn(),
  {
    timeout: 30000, // 30s
    errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
    resetTimeout: 30000, // Try again after 30s
    rollingCountTimeout: 60000, // 1 minute window
    rollingCountBuckets: 6, // 10s buckets
    name: 'openai-breaker',
  }
);

const geminiBreaker = new CircuitBreaker(
  async (fn: () => Promise<any>) => fn(),
  {
    timeout: 30000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    rollingCountTimeout: 60000,
    rollingCountBuckets: 6,
    name: 'gemini-breaker',
  }
);

// Fallback to cached response or error message
openaiBreaker.fallback(() => ({
  content:
    'AI service is temporarily unavailable. Please try again in a moment.',
  toolCalls: undefined,
}));

export async function withCircuitBreaker(
  provider: 'openai' | 'gemini',
  fn: () => Promise<any>
) {
  const breaker = provider === 'openai' ? openaiBreaker : geminiBreaker;
  return breaker.fire(fn);
}
```

**Dependencies**: `pnpm add opossum`

---

## 5. Fallback Strategy

### Current State

❌ **No fallback** - if OpenAI fails, user gets error (even if Gemini is configured).

### Best Practice Implementation

#### Model Tiering

```typescript
// lib/ai/fallback.ts (NEW FILE)
const MODEL_TIERS = [
  { provider: 'openai', model: 'gpt-4o-mini', cost: 0.15 }, // per 1M tokens (input)
  { provider: 'gemini', model: 'gemini-2.0-flash', cost: 0.0 }, // Free tier
];

export async function callWithFallback(
  messages: any[],
  tools: any[],
  options: any
) {
  const errors = [];

  for (const tier of MODEL_TIERS) {
    try {
      const model = createChatModel({
        provider: tier.provider,
        model: tier.model,
        ...options,
      });

      const response = await model.invoke(messages, { tools });

      console.log(`✅ LLM call succeeded with ${tier.provider}:${tier.model}`);
      return response;
    } catch (error) {
      console.warn(
        `❌ LLM call failed with ${tier.provider}:${tier.model}`,
        error
      );
      errors.push({ tier, error });
    }
  }

  // All tiers failed
  throw new Error(
    `All LLM providers failed: ${errors.map((e) => e.tier.provider).join(', ')}`
  );
}
```

---

## 6. Token Accounting & Budget Caps

### Current State

❌ **No token tracking** - usage is invisible.

**File**: `lib/ai/langchainClient.ts:180-183`

```typescript
return {
  content: response.content as string,
  model: options.model || getDefaultModel(),
  // Note: Usage information might not be available in all LangChain versions
};
```

### Best Practice Implementation

#### Token Tracking

```typescript
// lib/ai/usage.ts (NEW FILE)
import { Tiktoken } from 'tiktoken';

export class TokenUsageTracker {
  private encoder: Tiktoken;

  constructor(model: string) {
    this.encoder = Tiktoken.encodingForModel(model);
  }

  countTokens(text: string): number {
    return this.encoder.encode(text).length;
  }

  async trackUsage(
    userId: string,
    promptTokens: number,
    completionTokens: number,
    model: string
  ) {
    const cost = this.calculateCost(promptTokens, completionTokens, model);

    // Store in DB or metrics system
    await UsageModel.create({
      userId,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost,
      model,
      timestamp: new Date(),
    });

    return { promptTokens, completionTokens, cost };
  }

  calculateCost(
    promptTokens: number,
    completionTokens: number,
    model: string
  ): number {
    const PRICING = {
      'gpt-4o-mini': { input: 0.15, output: 0.6 }, // $ per 1M tokens
      'gemini-2.0-flash': { input: 0.0, output: 0.0 }, // Free tier
    };

    const pricing = PRICING[model] || PRICING['gpt-4o-mini'];
    const inputCost = (promptTokens / 1_000_000) * pricing.input;
    const outputCost = (completionTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
  }
}
```

**Dependencies**: `pnpm add tiktoken`

---

#### Budget Caps

```typescript
// lib/ai/budget.ts (NEW FILE)
export async function checkBudget(userId: string): Promise<boolean> {
  const usage = await UsageModel.aggregate([
    { $match: { userId, timestamp: { $gte: startOfMonth() } } },
    { $group: { _id: null, totalCost: { $sum: '$cost' } } },
  ]);

  const monthlyLimit = getUserBudgetLimit(userId); // e.g., $10/month
  const spent = usage[0]?.totalCost || 0;

  if (spent >= monthlyLimit) {
    throw new Error(
      `Monthly AI budget limit reached ($${spent.toFixed(2)} / $${monthlyLimit})`
    );
  }

  return true;
}
```

---

## 7. Caching

### Current State

❌ **No caching** - every request hits LLM API.

### Best Practice Implementation

#### Prompt Cache (System Prompt + Tools)

**OpenAI**: Supports prompt caching (experimental)  
**Gemini**: Supports context caching (beta)

```typescript
// lib/ai/cache.ts (NEW FILE)
import NodeCache from 'node-cache';

const promptCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 120, // Check for expired keys every 2 min
});

export function getCachedPrompt(key: string) {
  return promptCache.get(key);
}

export function setCachedPrompt(key: string, value: any) {
  promptCache.set(key, value);
}

// Generate cache key from system prompt + tools
export function generatePromptCacheKey(
  systemPrompt: string,
  tools: any[]
): string {
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ systemPrompt, tools }))
    .digest('hex');
  return `prompt:${hash}`;
}
```

**Savings**: ~40-50% reduction in prompt tokens (system prompt + tools are ~1300 tokens).

---

#### Response Cache

```typescript
// lib/ai/response-cache.ts (NEW FILE)
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedResponse(
  userMessage: string,
  conversationId?: string
): Promise<any> {
  const key = `agent:response:${conversationId || 'global'}:${userMessage}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedResponse(
  userMessage: string,
  response: any,
  conversationId?: string,
  ttl: number = 300 // 5 minutes
) {
  const key = `agent:response:${conversationId || 'global'}:${userMessage}`;
  await redis.setex(key, ttl, JSON.stringify(response));
}
```

**Use Case**: Cache common queries like "show me laptops", "view cart", etc.

---

## 8. Safety & Content Moderation

### Current State

❌ **No PII redaction**  
❌ **No input sanitization** for prompt injection  
❌ **No output moderation** for harmful content

### Best Practice Implementation

#### PII Redaction

```typescript
// lib/ai/pii.ts (NEW FILE)
import { presidio } from '@presidio/sdk';

export async function redactPII(text: string): Promise<string> {
  const results = await presidio.analyze(text, {
    language: 'en',
    entities: ['EMAIL_ADDRESS', 'PHONE_NUMBER', 'CREDIT_CARD', 'SSN', 'IBAN'],
  });

  return presidio.anonymize(text, results, {
    maskingChar: '*',
  });
}
```

**Usage**: Redact before storing in DB.

---

#### Prompt Injection Detection

```typescript
// lib/ai/prompt-injection.ts (NEW FILE)
export function detectPromptInjection(userMessage: string): boolean {
  const INJECTION_PATTERNS = [
    /ignore previous instructions/i,
    /you are now/i,
    /forget everything/i,
    /system:\s/i,
    /\[SYSTEM\]/i,
    /<\|im_start\|>/i,
  ];

  return INJECTION_PATTERNS.some((pattern) => pattern.test(userMessage));
}

export function sanitizeUserInput(userMessage: string): string {
  if (detectPromptInjection(userMessage)) {
    throw new Error('Potential prompt injection detected');
  }

  // Remove control characters
  return userMessage.replace(/[\x00-\x1F\x7F]/g, '');
}
```

---

#### Output Moderation (OpenAI)

```typescript
// lib/ai/moderation.ts (NEW FILE)
export async function moderateContent(text: string): Promise<boolean> {
  const response = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: text }),
  });

  const data = await response.json();
  const result = data.results[0];

  if (result.flagged) {
    console.warn('Content flagged by moderation:', result.categories);
    return false; // Unsafe
  }

  return true; // Safe
}
```

---

## 9. Observability

### Current State

❌ **No structured logging**  
❌ **No distributed tracing**  
❌ **No metrics collection**  
❌ **No LangSmith integration**

### Best Practice Implementation

#### Structured Logging

```typescript
// lib/logger.ts (NEW FILE)
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/agent.log' }),
  ],
});

// Usage
logger.info('LLM call started', {
  provider: AI_PROVIDER,
  userId,
  conversationId,
  messageLength: userMessage.length,
});
```

---

#### Metrics (Prometheus)

```typescript
// lib/metrics.ts (NEW FILE)
import client from 'prom-client';

const llmCallDuration = new client.Histogram({
  name: 'llm_call_duration_seconds',
  help: 'Duration of LLM API calls',
  labelNames: ['provider', 'model', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const llmTokensUsed = new client.Counter({
  name: 'llm_tokens_used_total',
  help: 'Total tokens consumed',
  labelNames: ['provider', 'model', 'type'], // type: prompt | completion
});

export function recordLLMCall(
  provider: string,
  model: string,
  durationSeconds: number,
  status: 'success' | 'error'
) {
  llmCallDuration.labels(provider, model, status).observe(durationSeconds);
}

export function recordTokenUsage(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number
) {
  llmTokensUsed.labels(provider, model, 'prompt').inc(promptTokens);
  llmTokensUsed.labels(provider, model, 'completion').inc(completionTokens);
}
```

---

#### LangSmith Integration

```typescript
// .env
LANGCHAIN_TRACING_V2 = true;
LANGCHAIN_API_KEY = your - langsmith - key;
LANGCHAIN_PROJECT = procureflow - agent;
```

**Automatic**: LangChain will send traces to LangSmith if enabled.

---

## 10. Deployment & Region Affinity

### Current State

❌ **No region preference** for API calls.

### Best Practice

**OpenAI**: Choose endpoint based on deployment region:

- US: `https://api.openai.com` (default)
- EU: Consider using Azure OpenAI for GDPR compliance

**Gemini**: Select region in model name:

- `gemini-2.0-flash` (default: us-central1)
- Regional models available (check Google AI docs)

**Data Residency**: Store conversation data in same region as API calls.

---

## Summary Table

| Best Practice      | Current        | Recommended          | Priority | Effort |
| ------------------ | -------------- | -------------------- | -------- | ------ |
| Rate limiting      | ❌ None        | ✅ Bottleneck        | P0       | 4h     |
| Retry logic        | ❌ None        | ✅ p-retry           | P0       | 2h     |
| Timeouts           | ⚠️ OpenAI only | ✅ Both providers    | P0       | 1h     |
| Circuit breaker    | ❌ None        | ✅ opossum           | P1       | 3h     |
| Fallback strategy  | ❌ None        | ✅ Model tiering     | P1       | 4h     |
| Token accounting   | ❌ None        | ✅ tiktoken + DB     | P0       | 6h     |
| Budget caps        | ❌ None        | ✅ Per-user limits   | P1       | 4h     |
| Prompt caching     | ❌ None        | ✅ NodeCache         | P1       | 3h     |
| Response caching   | ❌ None        | ✅ Redis             | P2       | 4h     |
| PII redaction      | ❌ None        | ✅ Presidio          | P1       | 6h     |
| Prompt injection   | ❌ None        | ✅ Pattern detection | P1       | 2h     |
| Output moderation  | ❌ None        | ✅ OpenAI moderation | P2       | 2h     |
| Structured logging | ❌ console.log | ✅ Winston           | P0       | 2h     |
| Metrics            | ❌ None        | ✅ Prometheus        | P1       | 4h     |
| LangSmith tracing  | ❌ None        | ✅ Enable env var    | P0       | 1h     |
| Region affinity    | ❌ None        | ✅ Config-based      | P2       | 2h     |

**Total Estimated Effort**: 50-60 hours (1.5-2 weeks for one engineer)

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-10  
**Next Review**: After implementation of P0/P1 items
