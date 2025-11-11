/**
 * Checkout API Route
 *
 * POST /api/checkout - Complete checkout and create purchase request
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import * as checkoutService from '@/features/checkout';
import { handleApiError, unauthorized } from '@/lib/api';
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

    if (!session || !session.user?.id) {
      return unauthorized();
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
    return handleApiError(error, {
      route: 'POST /api/checkout',
      userId: undefined, // session not available in catch block
    });
  }
}
