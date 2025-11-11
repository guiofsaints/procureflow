/**
 * Cart API Route
 *
 * GET /api/cart - Get user's cart
 */

import { NextResponse } from 'next/server';

import * as cartService from '@/features/cart';
import { handleApiError, withAuth } from '@/lib/api';

/**
 * GET /api/cart
 *
 * Get current user's cart
 * Requires authentication
 */
export const GET = withAuth(async (_request, { userId }) => {
  try {
    // Get cart for user
    const cart = await cartService.getCartForUser(userId);

    return NextResponse.json({ cart });
  } catch (error) {
    return handleApiError(error, {
      route: 'GET /api/cart',
      userId,
    });
  }
});
