/**
 * @fileoverview Retry logic with exponential backoff for LLM API calls.
 *
 * Handles transient failures (429, 500, 503, timeouts) with smart retry
 * strategies, exponential backoff, and jitter to avoid thundering herd.
 *
 * @module lib/reliability/retry
 */

import pRetry, { type Options, AbortError } from 'p-retry';

import type { AIProvider } from '@/lib/ai/providerAdapter';
import { logger } from '@/lib/logger/winston.config';

/**
 * HTTP status codes that should trigger retries.
 */
const RETRYABLE_STATUS_CODES = new Set([
  429, // Too Many Requests (rate limit)
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);

/**
 * Error names that should trigger retries.
 */
const RETRYABLE_ERROR_NAMES = new Set([
  'TimeoutError',
  'AbortError', // Fetch timeout
  'NetworkError',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
]);

/**
 * Retry configuration per provider.
 *
 * - OpenAI: 3 retries (generally reliable)
 * - Gemini: 4 retries (free tier can be flaky)
 */
const PROVIDER_RETRY_CONFIG: Record<
  AIProvider | 'default',
  { maxRetries: number }
> = {
  openai: { maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3', 10) },
  gemini: { maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES || '4', 10) },
  default: { maxRetries: 3 },
};

/**
 * Check if an error is retryable based on status code or error type.
 *
 * @param error - Error to check
 * @returns True if error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  // Check HTTP status codes
  if (typeof error === 'object' && error !== null) {
    const statusCode =
      (error as { status?: number; statusCode?: number }).status ||
      (error as { status?: number; statusCode?: number }).statusCode;

    if (statusCode && RETRYABLE_STATUS_CODES.has(statusCode)) {
      return true;
    }

    // Check error names
    const errorName = (error as { name?: string }).name;
    if (errorName && RETRYABLE_ERROR_NAMES.has(errorName)) {
      return true;
    }

    // Check error message for common transient patterns
    const message =
      (error as { message?: string }).message?.toLowerCase() || '';
    if (
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('temporarily unavailable') ||
      message.includes('try again')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate retry delay with exponential backoff and jitter.
 *
 * Formula: min(baseDelay * 2^attempt + jitter, maxDelay)
 * Jitter prevents thundering herd problem.
 *
 * NOTE: Currently unused - p-retry handles backoff internally.
 * Kept for future custom retry logic if needed.
 *
 * @param attemptNumber - Current attempt number (1-indexed)
 * @returns Delay in milliseconds
 */
function _calculateRetryDelay(attemptNumber: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30_000; // 30 seconds

  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
  const exponentialDelay = baseDelay * Math.pow(2, attemptNumber - 1);

  // Add jitter (±20% randomness)
  const jitter = exponentialDelay * (Math.random() * 0.4 - 0.2);

  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Wrap an async function with retry logic.
 *
 * Automatically retries on transient failures with exponential backoff.
 * Non-retryable errors fail immediately.
 *
 * @template T - Return type of the wrapped function
 * @param provider - AI provider (for configuration and logging)
 * @param fn - Async function to execute with retries
 * @returns Promise resolving to function result
 *
 * @example
 * ```typescript
 * const response = await withRetry('openai', async () => {
 *   return await chatModel.invoke(messages);
 * });
 * ```
 */
export async function withRetry<T>(
  provider: AIProvider,
  fn: () => Promise<T>
): Promise<T> {
  const config =
    PROVIDER_RETRY_CONFIG[provider] || PROVIDER_RETRY_CONFIG.default;

  const options: Options = {
    retries: config.maxRetries,
    factor: 2, // Exponential backoff factor
    minTimeout: 1000, // 1 second minimum
    maxTimeout: 30_000, // 30 seconds maximum
    randomize: true, // Add jitter

    onFailedAttempt: (retryContext) => {
      const { attemptNumber, retriesLeft } = retryContext;
      const actualError = (retryContext as unknown as { error?: Error }).error;

      logger.warn('Retry attempt failed', {
        provider,
        attemptNumber,
        retriesLeft,
        error: actualError?.message,
        retryable: isRetryableError(actualError),
      });

      // Don't retry if error is not retryable
      if (!isRetryableError(actualError)) {
        logger.error('Non-retryable error, aborting retries', {
          provider,
          error: actualError?.message,
          stack: actualError?.stack,
        });
        throw new AbortError(actualError?.message || 'Unknown error');
      }
    },
  };

  try {
    const result = await pRetry(fn, options);
    return result;
  } catch (error) {
    // Final failure after all retries
    logger.error('All retry attempts exhausted', {
      provider,
      maxRetries: config.maxRetries,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Create a retryable version of an async function.
 * Useful for creating reusable retry-wrapped functions.
 *
 * @template T - Return type
 * @param provider - AI provider
 * @param fn - Function to wrap
 * @returns Retry-wrapped function
 *
 * @example
 * ```typescript
 * const retryableInvoke = createRetryable('openai', async (messages) => {
 *   return await chatModel.invoke(messages);
 * });
 *
 * const response = await retryableInvoke(messages);
 * ```
 */
export function createRetryable<T extends unknown[], R>(
  provider: AIProvider,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T) => {
    return withRetry(provider, () => fn(...args));
  };
}
