/**
 * Cart Item API Route
 *
 * PATCH /api/cart/items/[itemId] - Update item quantity
 * DELETE /api/cart/items/[itemId] - Remove item from cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import * as cartService from '@/features/cart';
import { authConfig } from '@/lib/auth/config';

interface RouteContext {
  params: Promise<{
    itemId: string;
  }>;
}

/**
 * PATCH /api/cart/items/[itemId]
 *
 * Update item quantity in cart
 * Requires authentication
 *
 * Body:
 * - quantity: number (required, 1-999)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!session.user.id) {
      console.error(
        '[PATCH /api/cart/items/[itemId]] User ID is undefined in session'
      );
      return NextResponse.json(
        { error: 'Invalid session', message: 'User ID not found in session' },
        { status: 500 }
      );
    }

    // Get itemId from path
    const { itemId } = await context.params;

    // Parse request body
    const body = await request.json();

    // Validate quantity
    if (
      !body.quantity ||
      typeof body.quantity !== 'number' ||
      body.quantity < 1 ||
      body.quantity > 999
    ) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'quantity must be a number between 1 and 999',
        },
        { status: 400 }
      );
    }

    // Update cart item quantity
    const cart = await cartService.updateCartItemQuantity(
      session.user.id,
      itemId,
      body.quantity
    );

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Error in PATCH /api/cart/items/[itemId]:', error);

    // Handle validation errors
    if (error instanceof cartService.ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to update cart item',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/items/[itemId]
 *
 * Remove item from cart
 * Requires authentication
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!session.user.id) {
      console.error(
        '[DELETE /api/cart/items/[itemId]] User ID is undefined in session'
      );
      return NextResponse.json(
        { error: 'Invalid session', message: 'User ID not found in session' },
        { status: 500 }
      );
    }

    // Get itemId from path
    const { itemId } = await context.params;

    // Remove item from cart
    const cart = await cartService.removeCartItem(session.user.id, itemId);

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Error in DELETE /api/cart/items/[itemId]:', error);

    // Handle validation errors
    if (error instanceof cartService.ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to remove cart item',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
