/**
 * Cart API Route
 *
 * GET /api/cart - Get user's cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import * as cartService from '@/features/cart';
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
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get cart for user
    const cart = await cartService.getCartForUser(session.user.id);

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Error in GET /api/cart:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch cart',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
