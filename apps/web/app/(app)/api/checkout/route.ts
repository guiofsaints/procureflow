/**
 * Checkout API Route
 *
 * POST /api/checkout - Complete checkout and create purchase request
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import * as checkoutService from '@/features/checkout';
import { authConfig } from '@/lib/auth/config';

/**
 * POST /api/checkout
 *
 * Complete checkout and create purchase request
 * Requires authentication
 *
 * Body:
 * - notes?: string (optional justification/notes)
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
    const body = await request.json().catch(() => ({}));

    // Complete checkout
    const purchaseRequest = await checkoutService.checkoutCart(
      session.user.id,
      body.notes
    );

    return NextResponse.json(
      {
        message: 'Checkout completed successfully',
        purchaseRequest,
        note: 'This is a simulated ERP submission for the tech case',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/checkout:', error);

    // Handle empty cart
    if (error instanceof checkoutService.EmptyCartError) {
      return NextResponse.json(
        { error: 'Empty cart', message: error.message },
        { status: 400 }
      );
    }

    // Handle validation errors
    if (error instanceof checkoutService.ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to complete checkout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
