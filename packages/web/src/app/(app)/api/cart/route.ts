/**
 * Cart API Route
 *
 * GET /api/cart - Get user's cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import * as cartService from '@/features/cart';
import { handleApiError, unauthorized } from '@/lib/api';
import { authConfig } from '@/lib/auth/config';

/**
 * GET /api/cart
 *
 * Get current user's cart
 * Requires authentication
 */
export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);

    if (!session || !session.user) {
      return unauthorized();
    }

    if (!session.user.id) {
      return unauthorized('User ID not found in session');
    }

    // Get cart for user
    const cart = await cartService.getCartForUser(session.user.id);

    return NextResponse.json({ cart });
  } catch (error) {
    return handleApiError(error, {
      route: 'GET /api/cart',
      userId: undefined, // session not available in catch block
    });
  }
}
