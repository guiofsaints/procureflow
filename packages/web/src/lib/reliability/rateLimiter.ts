/**
 * @fileoverview Rate limiter for AI provider API calls using Bottleneck.
 *
 * Prevents overwhelming provider APIs with too many requests, handling both
 * per-provider limits and adaptive backoff on 429 responses.
 *
 * @module lib/reliability/rateLimiter
 */

import Bottleneck from 'bottleneck';

import type { AIProvider } from '@/lib/ai/providerAdapter';
import { logger } from '@/lib/logger/winston.config';
import { rateLimiterQueueSize } from '@/lib/metrics/prometheus.config';

/**
 * Rate limiter configuration for each provider.
 *
 * - OpenAI: 60 RPM (free tier conservative default)
 * - Gemini: 15 RPM (free tier API quota)
 * - Fallback: 10 RPM (safe default for unknown providers)
 */
const PROVIDER_LIMITS: Record<AIProvider | 'default', { rpm: number }> = {
  openai: { rpm: parseInt(process.env.OPENAI_RPM_LIMIT || '60', 10) },
  gemini: { rpm: parseInt(process.env.GEMINI_RPM_LIMIT || '15', 10) },
  default: { rpm: 10 },
};

/**
 * Bottleneck limiter instances per provider.
 * Keyed by provider name (openai, gemini, etc.)
 */
const limiters = new Map<AIProvider, Bottleneck>();

/**
 * Create a new Bottleneck limiter for the given provider.
 *
 * @param provider - AI provider name (openai, gemini, etc.)
 * @returns Configured Bottleneck instance
 */
function createLimiter(provider: AIProvider): Bottleneck {
  const config = PROVIDER_LIMITS[provider] || PROVIDER_LIMITS.default;

  // Convert RPM to minTime (milliseconds between requests)
  // Formula: 60,000ms / RPM
  const minTime = Math.ceil(60_000 / config.rpm);

  const limiter = new Bottleneck({
    minTime, // Minimum ms between job starts
    maxConcurrent: 1, // One request at a time per provider
    reservoir: config.rpm, // Total tokens available
    reservoirRefreshAmount: config.rpm, // Refill amount
    reservoirRefreshInterval: 60_000, // Refill every 60 seconds

    // Handle 429 Too Many Requests with exponential backoff
    // Bottleneck will automatically retry with delays
    ...(provider === 'openai' && {
      // OpenAI-specific: retry on 429 with exponential backoff
      retryAfter: (attempt: number) => {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30_000); // Max 30s
        logger.warn('Rate limit hit (OpenAI), backing off', {
          provider,
          attempt,
          delayMs: delay,
        });
        return delay;
      },
    }),
  });

  // Monitor queue size for observability
  limiter.on('queued', () => {
    const queued = limiter.counts().QUEUED;
    rateLimiterQueueSize.set({ provider }, queued);

    if (queued > 10) {
      logger.warn('Rate limiter queue growing', {
        provider,
        queued,
        rpm: config.rpm,
      });
    }
  });

  limiter.on('depleted', () => {
    logger.warn('Rate limiter depleted (reservoir empty)', {
      provider,
      rpm: config.rpm,
    });
  });

  limiter.on('error', (error) => {
    logger.error('Rate limiter error', {
      provider,
      error: error.message,
      stack: error.stack,
    });
  });

  logger.info('Rate limiter created', {
    provider,
    rpm: config.rpm,
    minTimeMs: minTime,
  });

  return limiter;
}

/**
 * Get or create a rate limiter for the given provider.
 *
 * @param provider - AI provider name
 * @returns Bottleneck limiter instance
 */
function getLimiter(provider: AIProvider): Bottleneck {
  let limiter = limiters.get(provider);

  if (!limiter) {
    limiter = createLimiter(provider);
    limiters.set(provider, limiter);
  }

  return limiter;
}

/**
 * Wrap an async function with rate limiting for the specified provider.
 *
 * @template T - Return type of the wrapped function
 * @param provider - AI provider to rate limit
 * @param fn - Async function to execute with rate limiting
 * @returns Promise resolving to function result
 *
 * @example
 * ```typescript
 * const response = await withRateLimit('openai', async () => {
 *   return await chatModel.invoke(messages);
 * });
 * ```
 */
export async function withRateLimit<T>(
  provider: AIProvider,
  fn: () => Promise<T>
): Promise<T> {
  const limiter = getLimiter(provider);

  const startTime = Date.now();
  const result = await limiter.schedule(fn);
  const waitTime = Date.now() - startTime;

  // Log if we had to wait significantly
  if (waitTime > 1000) {
    logger.info('Rate limit caused delay', {
      provider,
      waitTimeMs: waitTime,
    });
  }

  return result;
}

/**
 * Get current status of a provider's rate limiter.
 * Useful for debugging and monitoring.
 *
 * @param provider - AI provider name
 * @returns Current limiter status or null if not initialized
 */
export function getRateLimiterStatus(provider: AIProvider) {
  const limiter = limiters.get(provider);

  if (!limiter) {
    return null;
  }

  const counts = limiter.counts();
  const config = PROVIDER_LIMITS[provider] || PROVIDER_LIMITS.default;

  return {
    provider,
    rpm: config.rpm,
    queued: counts.QUEUED,
    running: counts.RUNNING,
    executing: counts.EXECUTING,
    done: counts.DONE,
  };
}

/**
 * Get status for all initialized rate limiters.
 *
 * @returns Array of limiter statuses
 */
export function getAllRateLimiterStatuses() {
  return Array.from(limiters.keys()).map(getRateLimiterStatus);
}
