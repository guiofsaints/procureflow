/**
 * Request Context Module
 * 
 * Provides AsyncLocalStorage-based context for request correlation in Node.js runtime.
 * Tracks requestId, spanId, and userId (hashed) throughout the request lifecycle.
 * 
 * Usage:
 * - Wrap route handlers with withRequestContext()
 * - Call getContext() within services to retrieve current request context
 * - Use logger.child(getContext()) to enrich logs with request information
 * 
 * Note: Only works in Node.js runtime, not Edge runtime.
 */

import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

import type { NextRequest, NextResponse } from 'next/server';

/**
 * Request context interface
 */
export interface RequestContext {
  requestId: string;           // UUID for this request
  spanId?: string;             // Optional span ID for tracing
  userId?: string;             // Hashed user ID for privacy
  sessionId?: string;          // Session correlation ID  
  userAgent?: string;          // Client user agent
  method?: string;             // HTTP method
  path?: string;               // Request path
  startTime?: number;          // Request start timestamp
}

// AsyncLocalStorage instance for request context
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Generate a hashed user ID for privacy
 */
function hashUserId(userId: string): string {
  // Simple hash for demo - in production, use proper crypto.createHash
  return `sha256:${Buffer.from(userId).toString('base64').slice(0, 16)}`;
}

/**
 * Extract request ID from headers or generate a new one
 */
function getOrGenerateRequestId(req: NextRequest): string {
  const headerRequestId = req.headers.get('x-request-id') || req.headers.get('x-correlation-id');
  return headerRequestId || randomUUID();
}

/**
 * Create initial request context from Next.js request
 */
function createRequestContext(req: NextRequest, userId?: string): RequestContext {
  const requestId = getOrGenerateRequestId(req);
  const url = new URL(req.url);
  
  const context: RequestContext = {
    requestId,
    spanId: randomUUID(), // Generate span ID for this operation
    method: req.method,
    path: url.pathname,
    startTime: Date.now(),
    userAgent: req.headers.get('user-agent') || undefined,
  };

  // Add hashed user ID if available
  if (userId) {
    context.userId = hashUserId(userId);
  }

  // Add session ID from cookies if available
  const sessionId = req.cookies.get('next-auth.session-token')?.value;
  if (sessionId) {
    context.sessionId = hashUserId(sessionId);
  }

  return context;
}

/**
 * Get current request context (returns undefined if not in request scope)
 */
export function getContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Get request context with fallback to empty object for logging
 */
export function getContextForLogging(): Partial<RequestContext> {
  const context = getContext();
  if (!context) {
    return {};
  }

  // Return only the fields we want in logs
  return {
    requestId: context.requestId,
    spanId: context.spanId,
    userId: context.userId,
    sessionId: context.sessionId,
  };
}

/**
 * Run a function within a request context
 */
export function runInContext<T>(context: RequestContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Higher-order function to wrap API route handlers with request context
 * 
 * Usage:
 * export const GET = withRequestContext(async (req: NextRequest) => {
 *   const logger = createChildLogger(getContextForLogging());
 *   logger.info('Processing GET request');
 *   // ... handler logic
 * });
 */
export function withRequestContext<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    // Get user ID from session if available (implement based on auth system)
    let userId: string | undefined;
    
    // For ProcureFlow, you might extract userId from JWT or session
    // This is a placeholder - adapt to your auth system
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        // Extract user ID from JWT token (simplified)
        // In real implementation, verify and decode JWT
        userId = 'user-from-auth-header';
      }
    } catch {
      // Ignore auth extraction errors
    }

    const context = createRequestContext(req, userId);
    
    return asyncLocalStorage.run(context, () => {
      return handler(req, ...args);
    });
  };
}

/**
 * Create a child span context for nested operations
 */
export function withChildSpan<T>(spanName: string, fn: () => T): T {
  const parentContext = getContext();
  if (!parentContext) {
    // No parent context, run without context
    return fn();
  }

  const childContext: RequestContext = {
    ...parentContext,
    spanId: randomUUID(),
    // You could add span metadata here
    path: `${parentContext.path}/${spanName}`,
  };

  return asyncLocalStorage.run(childContext, fn);
}

/**
 * Add additional metadata to current request context
 */
export function enrichContext(metadata: Partial<RequestContext>): void {
  const currentContext = getContext();
  if (currentContext) {
    Object.assign(currentContext, metadata);
  }
}

/**
 * Type-safe context enrichment for specific use cases
 */
export function enrichContextWithUser(userId: string): void {
  enrichContext({ userId: hashUserId(userId) });
}

export function enrichContextWithFeature(feature: string): void {
  enrichContext({ path: `${getContext()?.path || ''}/feature:${feature}` });
}