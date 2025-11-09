/**
 * Cart Items API Route
 *
 * POST /api/cart/items - Add item to cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import * as cartService from '@/features/cart';
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

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.itemId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'itemId is required' },
        { status: 400 }
      );
    }

    // Validate quantity if provided
    if (body.quantity !== undefined) {
      if (
        typeof body.quantity !== 'number' ||
        body.quantity < 1 ||
        body.quantity > 999
      ) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            message: 'quantity must be between 1 and 999',
          },
          { status: 400 }
        );
      }
    }

    // Add item to cart
    const cart = await cartService.addItemToCart(session.user.id, {
      itemId: body.itemId,
      quantity: body.quantity,
    });

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Error in POST /api/cart/items:', error);

    // Handle item not found
    if (error instanceof cartService.ItemNotFoundError) {
      return NextResponse.json(
        { error: 'Item not found', message: error.message },
        { status: 404 }
      );
    }

    // Handle validation errors
    if (
      error instanceof cartService.ValidationError ||
      error instanceof cartService.CartLimitError
    ) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to add item to cart',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
