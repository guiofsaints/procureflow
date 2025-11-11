/**
 * Authentication Wrapper for API Routes
 *
 * Provides a Higher-Order Function (HOF) to wrap authenticated API routes,
 * eliminating repetitive authentication boilerplate.
 *
 * Usage:
 * ```typescript
 * import { withAuth } from '@/lib/api';
 *
 * export const POST = withAuth(async (request, { userId, params }) => {
 *   // userId is guaranteed to be available here
 *   const body = await request.json();
 *   // ... route logic
 *   return NextResponse.json({ data });
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authConfig } from '@/lib/auth/config';

import { unauthorized } from './errorHandler';

// ============================================================================
// Types
// ============================================================================

/**
 * Context passed to authenticated route handler
 */
export interface AuthContext {
  /** Authenticated user ID */
  userId: string;

  /** Route params (for dynamic routes like /api/items/[id]) */
  params?: Record<string, string>;
}

/**
 * Authenticated route handler function signature
 */
export type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse> | NextResponse;

// ============================================================================
// Higher-Order Function
// ============================================================================

/**
 * Wraps an API route handler with authentication check
 *
 * Automatically:
 * - Checks for valid session
 * - Extracts userId from session
 * - Returns 401 if not authenticated
 * - Passes userId to handler if authenticated
 *
 * @param handler - The route handler function that requires authentication
 * @returns Wrapped handler with authentication check
 *
 * @example
 * ```typescript
 * // Before (with boilerplate):
 * export async function POST(request: NextRequest) {
 *   const session = await getServerSession(authConfig);
 *   if (!session || !session.user?.id) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   const userId = session.user.id;
 *   // ... route logic
 * }
 *
 * // After (clean):
 * export const POST = withAuth(async (request, { userId }) => {
 *   // userId is available, no boilerplate needed
 *   // ... route logic
 * });
 * ```
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    context?: {
      params: Promise<Record<string, string>> | Record<string, string>;
    }
  ) => {
    // Check authentication
    const session = await getServerSession(authConfig);

    if (!session || !session.user?.id) {
      return unauthorized();
    }

    // Await params if it's a promise (Next.js 15+ dynamic routes)
    const params = context?.params
      ? context.params instanceof Promise
        ? await context.params
        : context.params
      : undefined;

    // Call handler with authenticated context
    return handler(request, {
      userId: session.user.id,
      params,
    });
  };
}
