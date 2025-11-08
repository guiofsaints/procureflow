/**
 * Purchase Request Detail API Route
 *
 * GET /api/purchase-requests/[id] - Get a specific purchase request
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import * as checkoutService from '@/features/checkout';
import { authConfig } from '@/lib/auth/config';

/**
 * GET /api/purchase-requests/[id]
 *
 * Get details of a specific purchase request
 * Only returns the request if it belongs to the authenticated user
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;

    // Validate ID format (MongoDB ObjectId)
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Invalid purchase request ID',
        },
        { status: 400 }
      );
    }

    // Fetch purchase request
    const purchaseRequest = await checkoutService.getPurchaseRequestById(
      userId,
      id
    );

    if (!purchaseRequest) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Purchase request not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: purchaseRequest,
    });
  } catch (error) {
    console.error('Error in GET /api/purchase-requests/[id]:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch purchase request',
      },
      { status: 500 }
    );
  }
}
