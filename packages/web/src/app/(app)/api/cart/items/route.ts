/**
 * Cart Items API Route
 *
 * POST /api/cart/items - Add item to cart
 */

import { NextResponse } from 'next/server';

import * as cartService from '@/features/cart';
import { badRequest, handleApiError, withAuth } from '@/lib/api';

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
export const POST = withAuth(async (request, { userId }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.itemId) {
      return badRequest('itemId is required', {
        route: 'POST /api/cart/items',
        userId,
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
          userId,
        });
      }
    }

    // Add item to cart
    const cart = await cartService.addItemToCart(userId, {
      itemId: body.itemId,
      quantity: body.quantity,
    });

    return NextResponse.json({ cart });
  } catch (error) {
    return handleApiError(error, {
      route: 'POST /api/cart/items',
      userId,
    });
  }
});
