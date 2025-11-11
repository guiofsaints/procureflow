/**
 * @fileoverview Circuit breaker for AI provider API calls using Opossum.
 *
 * Prevents cascading failures by opening circuit when error rate exceeds
 * threshold, allowing system to recover before retrying.
 *
 * @module lib/reliability/circuitBreaker
 */

import CircuitBreaker from 'opossum';

import type { AIProvider } from '@/lib/ai/providerAdapter';
import { logger } from '@/lib/logger/winston.config';
import { circuitBreakerState } from '@/lib/metrics/prometheus.config';

/**
 * Circuit breaker configuration per provider.
 *
 * - Timeout: 30s (LLM calls can be slow)
 * - Error threshold: 50% (half of requests fail = circuit opens)
 * - Reset timeout: 30s (try again after 30s in open state)
 * - Volume threshold: 5 (need at least 5 requests to calculate error rate)
 */
const PROVIDER_CB_CONFIG: Record<
  AIProvider | 'default',
  {
    timeout: number;
    errorThresholdPercentage: number;
    resetTimeout: number;
    volumeThreshold: number;
  }
> = {
  openai: {
    timeout: parseInt(process.env.OPENAI_TIMEOUT_MS || '30000', 10),
    errorThresholdPercentage: parseInt(
      process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD || '50',
      10
    ),
    resetTimeout: parseInt(
      process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '30000',
      10
    ),
    volumeThreshold: 5,
  },
  gemini: {
    timeout: parseInt(process.env.GEMINI_TIMEOUT_MS || '30000', 10),
    errorThresholdPercentage: parseInt(
      process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD || '50',
      10
    ),
    resetTimeout: parseInt(
      process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '30000',
      10
    ),
    volumeThreshold: 5,
  },
  default: {
    timeout: 30_000,
    errorThresholdPercentage: 50,
    resetTimeout: 30_000,
    volumeThreshold: 5,
  },
};

/**
 * Circuit breaker instances per provider.
 * Keyed by provider name (openai, gemini, etc.)
 */
const breakers = new Map<AIProvider, CircuitBreaker>();

/**
 * Create a new circuit breaker for the given provider.
 *
 * @template T - Return type of the wrapped function
 * @param provider - AI provider name
 * @returns Configured CircuitBreaker instance
 */
function createBreaker<T>(provider: AIProvider): CircuitBreaker<T[], T> {
  const config = PROVIDER_CB_CONFIG[provider] || PROVIDER_CB_CONFIG.default;

  const breaker = new CircuitBreaker<T[], T>(
    async (...args: T[]) => {
      // This is a placeholder - actual function passed to withCircuitBreaker
      return args[0];
    },
    {
      timeout: config.timeout,
      errorThresholdPercentage: config.errorThresholdPercentage,
      resetTimeout: config.resetTimeout,
      volumeThreshold: config.volumeThreshold,
      name: `${provider}-breaker`,
    }
  );

  // Monitor state changes
  breaker.on('open', () => {
    logger.error('Circuit breaker OPEN - failing fast', {
      provider,
      errorThreshold: config.errorThresholdPercentage,
    });
    circuitBreakerState.set({ provider }, 1); // 1 = open
  });

  breaker.on('halfOpen', () => {
    logger.warn('Circuit breaker HALF_OPEN - testing recovery', {
      provider,
    });
    circuitBreakerState.set({ provider }, 0.5); // 0.5 = half-open
  });

  breaker.on('close', () => {
    logger.info('Circuit breaker CLOSED - healthy', {
      provider,
    });
    circuitBreakerState.set({ provider }, 0); // 0 = closed
  });

  breaker.on('success', () => {
    logger.debug('Circuit breaker success', { provider });
  });

  breaker.on('failure', (error) => {
    logger.warn('Circuit breaker failure', {
      provider,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  breaker.on('timeout', () => {
    logger.error('Circuit breaker TIMEOUT', {
      provider,
      timeoutMs: config.timeout,
    });
  });

  breaker.on('fallback', () => {
    logger.warn('Circuit breaker fallback triggered', {
      provider,
    });
  });

  logger.info('Circuit breaker created', {
    provider,
    timeout: config.timeout,
    errorThreshold: config.errorThresholdPercentage,
    resetTimeout: config.resetTimeout,
  });

  // Initialize metrics (closed state = 0)
  circuitBreakerState.set({ provider }, 0);

  return breaker;
}

/**
 * Get or create a circuit breaker for the given provider.
 *
 * @template T - Return type
 * @param provider - AI provider name
 * @returns CircuitBreaker instance
 */
// 🔴 TEMPORARY: Disabled until proper Opossum integration
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getBreaker<T>(provider: AIProvider): CircuitBreaker<T[], T> {
  let breaker = breakers.get(provider) as CircuitBreaker<T[], T> | undefined;

  if (!breaker) {
    breaker = createBreaker<T>(provider);
    breakers.set(provider, breaker as CircuitBreaker);
  }

  return breaker;
}

/**
 * Wrap an async function with circuit breaker protection.
 *
 * @template T - Return type of the wrapped function
 * @param provider - AI provider to protect
 * @param fn - Async function to execute with circuit breaker
 * @returns Promise resolving to function result
 *
 * @throws {Error} When circuit is open (failing fast)
 * @throws {Error} When function times out
 *
 * @example
 * ```typescript
 * const response = await withCircuitBreaker('openai', async () => {
 *   return await chatModel.invoke(messages);
 * });
 * ```
 */
export async function withCircuitBreaker<T>(
  provider: AIProvider,
  fn: () => Promise<T>
): Promise<T> {
  // 🔴 TEMPORARY FIX: Bypass circuit breaker until proper fix
  // The Opossum integration is broken - it was not executing the function
  console.warn('🔴 [withCircuitBreaker] BYPASSED - executing function directly');
  return await fn();
  
  /* ORIGINAL BROKEN CODE:
  const breaker = getBreaker<() => Promise<T>>(provider);
  // 🔴 PROBLEM: This cast and fire() usage is incorrect
  return breaker.fire(fn);
  */
}

/**
 * Get current status of a provider's circuit breaker.
 * Useful for debugging and health checks.
 *
 * @param provider - AI provider name
 * @returns Current circuit breaker status or null if not initialized
 */
export function getCircuitBreakerStatus(provider: AIProvider) {
  const breaker = breakers.get(provider);

  if (!breaker) {
    return null;
  }

  const stats = breaker.stats;

  return {
    provider,
    state: breaker.opened ? 'open' : breaker.halfOpen ? 'half_open' : 'closed',
    stats: {
      fires: stats.fires,
      successes: stats.successes,
      failures: stats.failures,
      timeouts: stats.timeouts,
      rejects: stats.rejects,
      fallbacks: stats.fallbacks,
      latencyMean: stats.latencyMean,
    },
  };
}

/**
 * Get status for all initialized circuit breakers.
 *
 * @returns Array of circuit breaker statuses
 */
export function getAllCircuitBreakerStatuses() {
  return Array.from(breakers.keys()).map(getCircuitBreakerStatus);
}

/**
 * Manually open a circuit breaker (for testing/maintenance).
 *
 * @param provider - AI provider
 */
export function openCircuit(provider: AIProvider): void {
  const breaker = breakers.get(provider);
  if (breaker) {
    breaker.open();
    logger.warn('Circuit manually opened', { provider });
  }
}

/**
 * Manually close a circuit breaker (for testing/maintenance).
 *
 * @param provider - AI provider
 */
export function closeCircuit(provider: AIProvider): void {
  const breaker = breakers.get(provider);
  if (breaker) {
    breaker.close();
    logger.info('Circuit manually closed', { provider });
  }
}
