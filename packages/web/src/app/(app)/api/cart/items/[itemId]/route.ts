/**
 * Cart Item API Route
 *
 * PATCH /api/cart/items/[itemId] - Update item quantity
 * DELETE /api/cart/items/[itemId] - Remove item from cart
 */

import { NextResponse } from 'next/server';

import * as cartService from '@/features/cart';
import { badRequest, handleApiError, withAuth } from '@/lib/api';

/**
 * PATCH /api/cart/items/[itemId]
 *
 * Update item quantity in cart
 * Requires authentication
 *
 * Body:
 * - quantity: number (required, 1-999)
 */
export const PATCH = withAuth(async (request, { userId, params }) => {
  try {
    // Get itemId from path
    const itemId = params?.itemId;

    if (!itemId) {
      return badRequest('itemId is required', {
        route: 'PATCH /api/cart/items/[itemId]',
        userId,
      });
    }

    // Parse request body
    const body = await request.json();

    // Validate quantity
    if (
      !body.quantity ||
      typeof body.quantity !== 'number' ||
      body.quantity < 1 ||
      body.quantity > 999
    ) {
      return badRequest('quantity must be a number between 1 and 999', {
        route: 'PATCH /api/cart/items/[itemId]',
        userId,
      });
    }

    // Update cart item quantity
    const cart = await cartService.updateCartItemQuantity(
      userId,
      itemId,
      body.quantity
    );

    return NextResponse.json({ cart });
  } catch (error) {
    return handleApiError(error, {
      route: 'PATCH /api/cart/items/[itemId]',
      userId,
    });
  }
});

/**
 * DELETE /api/cart/items/[itemId]
 *
 * Remove item from cart
 * Requires authentication
 */
export const DELETE = withAuth(async (_request, { userId, params }) => {
  try {
    // Get itemId from path
    const itemId = params?.itemId;

    if (!itemId) {
      return badRequest('itemId is required', {
        route: 'DELETE /api/cart/items/[itemId]',
        userId,
      });
    }

    // Remove item from cart
    const cart = await cartService.removeCartItem(userId, itemId);

    return NextResponse.json({ cart });
  } catch (error) {
    return handleApiError(error, {
      route: 'DELETE /api/cart/items/[itemId]',
      userId,
    });
  }
});
