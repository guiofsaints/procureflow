/**
 * Purchase Requests API Route
 *
 * GET /api/purchase-requests - List purchase requests for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { PurchaseRequestStatus } from '@/domain/entities';
import * as checkoutService from '@/features/checkout';
import { authConfig } from '@/lib/auth/config';

/**
 * GET /api/purchase-requests
 *
 * List all purchase requests for the authenticated user
 * Supports filtering by status
 *
 * Query Parameters:
 * - status: PurchaseRequestStatus (optional)
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get('status');

    // Build filters
    const filters: { status?: PurchaseRequestStatus } = {};

    if (statusParam) {
      // Validate status parameter
      const validStatuses = Object.values(PurchaseRequestStatus);
      if (
        validStatuses.includes(statusParam as PurchaseRequestStatus)
      ) {
        filters.status = statusParam as PurchaseRequestStatus;
      } else {
        return NextResponse.json(
          {
            error: 'Validation failed',
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // Fetch purchase requests
    const purchaseRequests =
      await checkoutService.getPurchaseRequestsForUser(userId, filters);

    return NextResponse.json({
      success: true,
      data: purchaseRequests,
      count: purchaseRequests.length,
    });
  } catch (error) {
    console.error('Error in GET /api/purchase-requests:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch purchase requests',
      },
      { status: 500 }
    );
  }
}
