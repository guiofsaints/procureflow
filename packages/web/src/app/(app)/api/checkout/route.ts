/**
 * Checkout API Route
 *
 * POST /api/checkout - Complete checkout and create purchase request
 */

import { NextResponse } from 'next/server';

import * as checkoutService from '@/features/checkout';
import { handleApiError, withAuth } from '@/lib/api';

/**
 * POST /api/checkout
 *
 * Complete checkout and create purchase request
 * Requires authentication
 *
 * Body:
 * - notes?: string (optional justification/notes)
 */
export const POST = withAuth(async (request, { userId }) => {
  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));

    // Complete checkout
    const purchaseRequest = await checkoutService.checkoutCart(
      userId,
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
    return handleApiError(error, {
      route: 'POST /api/checkout',
      userId,
    });
  }
});
