/**
 * Centralized API Error Handler
 *
 * Provides consistent error handling across all API routes with:
 * - Correlation IDs for request tracing
 * - Winston logging instead of console.error
 * - Type-safe error mapping to HTTP status codes
 * - Consistent error response format
 *
 * Usage in API routes:
 * ```typescript
 * import { handleApiError } from '@/lib/api/errorHandler';
 *
 * export async function POST(request: NextRequest) {
 *   try {
 *     // ... route logic
 *   } catch (error) {
 *     return handleApiError(error, {
 *       route: 'POST /api/cart/items',
 *       userId: session?.user?.id,
 *     });
 *   }
 * }
 * ```
 */

import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import * as cartService from '@/features/cart';
import * as catalogService from '@/features/catalog';
import * as checkoutService from '@/features/checkout';
import { logger } from '@/lib/logger/winston.config';

// ============================================================================
// Types
// ============================================================================

/**
 * Context information for error logging
 */
export interface ErrorContext {
  /** API route that triggered the error (e.g., 'POST /api/cart/items') */
  route: string;

  /** User ID if available (for debugging) */
  userId?: string;

  /** Additional context data */
  [key: string]: unknown;
}

/**
 * Standardized API error response
 */
export interface ApiErrorResponse {
  /** Error type/code */
  error: string;

  /** Human-readable error message */
  message: string;

  /** Correlation ID for request tracing */
  correlationId: string;

  /** ISO timestamp */
  timestamp: string;
}

// ============================================================================
// Error Code Mapping
// ============================================================================

/**
 * Maps known error types to HTTP status codes
 */
function getStatusCode(error: unknown): number {
  // 400 - Bad Request
  if (
    error instanceof cartService.ValidationError ||
    error instanceof cartService.CartLimitError ||
    error instanceof catalogService.ValidationError ||
    error instanceof checkoutService.ValidationError ||
    error instanceof checkoutService.EmptyCartError
  ) {
    return 400;
  }

  // 404 - Not Found
  if (error instanceof cartService.ItemNotFoundError) {
    return 404;
  }

  // 409 - Conflict
  if (error instanceof catalogService.DuplicateItemError) {
    return 409;
  }

  // 500 - Internal Server Error (default)
  return 500;
}

/**
 * Maps known error types to error codes
 */
function getErrorCode(error: unknown): string {
  if (error instanceof cartService.ValidationError) {
    return 'VALIDATION_ERROR';
  }
  if (error instanceof cartService.ItemNotFoundError) {
    return 'ITEM_NOT_FOUND';
  }
  if (error instanceof cartService.CartLimitError) {
    return 'CART_LIMIT_EXCEEDED';
  }
  if (error instanceof catalogService.ValidationError) {
    return 'VALIDATION_ERROR';
  }
  if (error instanceof catalogService.DuplicateItemError) {
    return 'DUPLICATE_ITEM';
  }
  if (error instanceof checkoutService.ValidationError) {
    return 'VALIDATION_ERROR';
  }
  if (error instanceof checkoutService.EmptyCartError) {
    return 'EMPTY_CART';
  }

  // Generic error
  return 'INTERNAL_ERROR';
}

/**
 * Extracts user-facing error message from error object
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

// ============================================================================
// Main Error Handler
// ============================================================================

/**
 * Central API error handler with correlation IDs and structured logging
 *
 * @param error - The error that occurred
 * @param context - Context information for logging (route, userId, etc.)
 * @returns NextResponse with standardized error format
 *
 * @example
 * ```typescript
 * try {
 *   const cart = await cartService.addItemToCart(userId, input);
 *   return NextResponse.json({ cart });
 * } catch (error) {
 *   return handleApiError(error, {
 *     route: 'POST /api/cart/items',
 *     userId: session.user.id,
 *     itemId: input.itemId,
 *   });
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  context: ErrorContext
): NextResponse<ApiErrorResponse> {
  // Generate correlation ID for request tracing
  const correlationId = randomUUID();

  // Determine status code and error code
  const statusCode = getStatusCode(error);
  const errorCode = getErrorCode(error);
  const message = getErrorMessage(error);

  // Log error with structured context
  logger.error('API error', {
    correlationId,
    statusCode,
    errorCode,
    message,
    route: context.route,
    userId: context.userId,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    context: Object.fromEntries(
      Object.entries(context).filter(([key]) => key !== 'route' && key !== 'userId')
    ),
  });

  // Return standardized error response
  return NextResponse.json(
    {
      error: errorCode,
      message,
      correlationId,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Create an unauthorized (401) response
 * Use this for authentication failures
 */
export function unauthorized(message = 'Authentication required'): NextResponse<ApiErrorResponse> {
  const correlationId = randomUUID();

  logger.warn('Unauthorized API access', {
    correlationId,
    message,
  });

  return NextResponse.json(
    {
      error: 'UNAUTHORIZED',
      message,
      correlationId,
      timestamp: new Date().toISOString(),
    },
    { status: 401 }
  );
}

/**
 * Create a bad request (400) response for validation errors
 * Use this for input validation failures
 */
export function badRequest(message: string, context?: ErrorContext): NextResponse<ApiErrorResponse> {
  const correlationId = randomUUID();

  logger.warn('Bad request', {
    correlationId,
    message,
    ...(context && { route: context.route, userId: context.userId }),
  });

  return NextResponse.json(
    {
      error: 'BAD_REQUEST',
      message,
      correlationId,
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}
