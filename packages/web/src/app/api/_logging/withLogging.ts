/**
 * API Route Logging Wrapper for Node.js Runtime
 *
 * Provides a higher-order function to wrap Next.js API route handlers with:
 * - Automatic request/response timing and logging
 * - Error capture with structured context
 * - Request correlation and context propagation
 * - Sampling support via LOG_SAMPLING environment variable
 *
 * Usage:
 * ```typescript
 * import { withLogging } from '@/lib/logger/withLogging';
 *
 * export const GET = withLogging(async (req: NextRequest) => {
 *   // Your handler logic here
 *   return NextResponse.json({ data: 'example' });
 * });
 * ```
 *
 * Features:
 * - ECS-compliant HTTP request/response logs
 * - Performance monitoring with duration tracking
 * - Automatic error handling and logging
 * - Request context enrichment
 * - Configurable sampling to reduce log volume
 */

import { NextRequest, NextResponse } from 'next/server';

import { withRequestContext, getContext } from '@/lib/logger/context';
import { createChildLogger } from '@/lib/logger/index';

// Environment configuration
const LOG_SAMPLING = parseFloat(process.env.LOG_SAMPLING || '1.0');

/**
 * Check if request should be logged based on sampling rate
 */
function shouldLogRequest(req: NextRequest): boolean {
  // Always log errors regardless of sampling
  if (req.method === 'OPTIONS') {
    return false; // Skip preflight requests
  }

  // Skip health check endpoints from sampling
  const url = new URL(req.url);
  if (url.pathname.includes('/health') || url.pathname.includes('/metrics')) {
    return LOG_SAMPLING > 0; // Only log if sampling is enabled
  }

  // Apply sampling rate
  if (LOG_SAMPLING >= 1.0) {
    return true;
  }

  if (LOG_SAMPLING <= 0) {
    return false;
  }

  // Use deterministic sampling based on request ID for consistency
  const context = getContext();
  if (context?.requestId) {
    // Simple hash of requestId to get consistent sampling decision
    const hash = context.requestId
      .split('')
      .reduce(
        (acc: number, char: string) => (acc + char.charCodeAt(0)) % 100,
        0
      );
    return hash / 100 < LOG_SAMPLING;
  }

  // Fallback to random sampling
  return Math.random() < LOG_SAMPLING;
}

/**
 * Extract relevant request metadata for logging
 */
function extractRequestMetadata(req: NextRequest) {
  const url = new URL(req.url);
  const contentLength = req.headers.get('content-length');

  return {
    http: {
      method: req.method,
      url: {
        path: url.pathname,
        search: url.search,
        domain: url.hostname,
      },
      request: {
        body_bytes: contentLength ? parseInt(contentLength, 10) : undefined,
        headers: {
          'user-agent': req.headers.get('user-agent'),
          'content-type': req.headers.get('content-type'),
          accept: req.headers.get('accept'),
        },
      },
    },
  };
}

/**
 * Extract response metadata for logging
 */
function extractResponseMetadata(response: NextResponse, durationMs: number) {
  const contentLength = response.headers.get('content-length');

  return {
    http: {
      status_code: response.status,
      response: {
        body_bytes: contentLength ? parseInt(contentLength, 10) : undefined,
        headers: {
          'content-type': response.headers.get('content-type'),
        },
      },
    },
    event: {
      dataset: 'http' as const,
      action: 'request.completed',
      duration_ms: durationMs,
    },
  };
}

/**
 * Create enhanced error context for logging
 */
function createErrorContext(
  error: unknown,
  req: NextRequest,
  durationMs: number
) {
  const baseError = error instanceof Error ? error : new Error(String(error));

  return {
    error: {
      type: baseError.name,
      message: baseError.message,
      stack_trace:
        process.env.NODE_ENV === 'development' ? baseError.stack : undefined,
    },
    event: {
      dataset: 'http' as const,
      action: 'request.error',
      duration_ms: durationMs,
    },
    ...extractRequestMetadata(req),
  };
}

/**
 * Higher-order function to wrap API route handlers with logging
 */
export function withLogging<T extends unknown[]>(
  handler: (
    req: NextRequest,
    ...args: T
  ) => Promise<NextResponse> | NextResponse
) {
  return withRequestContext(
    async (req: NextRequest, ...args: T): Promise<NextResponse> => {
      const startTime = Date.now();
      const context = getContext();
      const logger = createChildLogger({
        feature: 'api',
        procureflow: {
          requestId: context?.requestId,
          feature: 'api',
        },
      });

      // Check sampling early
      const shouldLog = shouldLogRequest(req);

      if (shouldLog) {
        // Log request start
        logger.info('HTTP request started', {
          ...extractRequestMetadata(req),
          event: {
            dataset: 'http' as const,
            action: 'request.started',
          },
        });
      }

      try {
        // Execute the handler
        const response = await handler(req, ...args);
        const durationMs = Date.now() - startTime;

        if (shouldLog) {
          // Log successful response
          const logLevel = response.status >= 400 ? 'warn' : 'info';
          const message = `HTTP request completed with status ${response.status}`;

          logger[logLevel](message, {
            ...extractResponseMetadata(response, durationMs),
          });
        }

        return response;
      } catch (error) {
        const durationMs = Date.now() - startTime;

        // Always log errors regardless of sampling
        logger.error(
          'HTTP request failed',
          createErrorContext(error, req, durationMs)
        );

        // Re-throw the error for Next.js error handling
        throw error;
      }
    }
  );
}

/**
 * Specialized wrapper for API routes that handle sensitive operations
 * Always logs regardless of sampling rate
 */
export function withRequiredLogging<T extends unknown[]>(
  handler: (
    req: NextRequest,
    ...args: T
  ) => Promise<NextResponse> | NextResponse
) {
  return withRequestContext(
    async (req: NextRequest, ...args: T): Promise<NextResponse> => {
      const startTime = Date.now();
      const context = getContext();
      const logger = createChildLogger({
        feature: 'api-critical',
        procureflow: {
          requestId: context?.requestId,
          feature: 'api-critical',
        },
      });

      // Always log critical operations
      logger.info('Critical HTTP request started', {
        ...extractRequestMetadata(req),
        event: {
          dataset: 'http' as const,
          action: 'critical.request.started',
        },
      });

      try {
        const response = await handler(req, ...args);
        const durationMs = Date.now() - startTime;

        const logLevel = response.status >= 400 ? 'warn' : 'info';
        logger[logLevel]('Critical HTTP request completed', {
          ...extractResponseMetadata(response, durationMs),
          event: {
            dataset: 'http' as const,
            action: 'critical.request.completed',
            duration_ms: durationMs,
          },
        });

        return response;
      } catch (error) {
        const durationMs = Date.now() - startTime;

        logger.error('Critical HTTP request failed', {
          ...createErrorContext(error, req, durationMs),
          event: {
            dataset: 'http' as const,
            action: 'critical.request.error',
            duration_ms: durationMs,
          },
        });

        throw error;
      }
    }
  );
}

/**
 * Utility function to log domain events within API handlers
 *
 * Usage:
 * ```typescript
 * await logDomainEvent('cart.item_added', {
 *   itemId: 'item-123',
 *   userId: 'user-456',
 *   quantity: 2
 * });
 * ```
 */
export async function logDomainEvent(
  action: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const logger = createChildLogger({
    feature: 'domain-events',
  });

  logger.info(`Domain event: ${action}`, {
    event: {
      dataset: 'domain' as const,
      action,
    },
    ...metadata,
  });
}

/**
 * Utility function to log external API calls
 */
export async function logExternalApiCall(
  service: string,
  operation: string,
  durationMs: number,
  status?: number,
  error?: Error
): Promise<void> {
  const logger = createChildLogger({
    feature: 'external-api',
  });

  const logData = {
    event: {
      dataset: 'external' as const,
      action: `${service}.${operation}`,
      duration_ms: durationMs,
    },
    external: {
      service,
      operation,
      status_code: status,
    },
  };

  if (error) {
    logger.error(`External API call failed: ${service}.${operation}`, {
      ...logData,
      error: {
        type: error.name,
        message: error.message,
        stack_trace:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    });
  } else {
    const logLevel = status && status >= 400 ? 'warn' : 'info';
    logger[logLevel](
      `External API call completed: ${service}.${operation}`,
      logData
    );
  }
}
