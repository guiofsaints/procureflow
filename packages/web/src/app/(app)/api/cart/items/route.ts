/**
 * Cart Items API Route
 *
 * POST /api/cart/items - Add item to cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import * as cartService from '@/features/cart';
import { badRequest, handleApiError, unauthorized } from '@/lib/api';
import { authConfig } from '@/lib/auth/config';

/**
 * POST /api/cart/items
 *
 * Add item to cart
 * Requires authentication
 *
 * Body:
 * - itemId: string (required)
 * - quantity: number (optional, default 1)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);

    if (!session || !session.user?.id) {
      return unauthorized();
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.itemId) {
      return badRequest('itemId is required', {
        route: 'POST /api/cart/items',
        userId: session.user.id,
      });
    }

    // Validate quantity if provided
    if (body.quantity !== undefined) {
      if (
        typeof body.quantity !== 'number' ||
        body.quantity < 1 ||
        body.quantity > 999
      ) {
        return badRequest('quantity must be between 1 and 999', {
          route: 'POST /api/cart/items',
          userId: session.user.id,
        });
      }
    }

    // Add item to cart
    const cart = await cartService.addItemToCart(session.user.id, {
      itemId: body.itemId,
      quantity: body.quantity,
    });

    return NextResponse.json({ cart });
  } catch (error) {
    return handleApiError(error, {
      route: 'POST /api/cart/items',
      userId: undefined, // session not available in catch block
    });
  }
}
