/**
 * Purchase Requests API Route
 *
 * GET /api/purchase - List purchase requests for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { PurchaseRequestStatus } from '@/domain/entities';
import * as checkoutService from '@/features/checkout';
import { badRequest, handleApiError, unauthorized } from '@/lib/api';
import { authConfig } from '@/lib/auth/config';

/**
 * GET /api/purchase
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
      return unauthorized('You must be logged in');
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
      if (validStatuses.includes(statusParam as PurchaseRequestStatus)) {
        filters.status = statusParam as PurchaseRequestStatus;
      } else {
        return badRequest(
          `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          { route: 'GET /api/purchase', userId }
        );
      }
    }

    // Fetch purchase requests
    const purchaseRequests = await checkoutService.getPurchaseRequestsForUser(
      userId,
      filters
    );

    return NextResponse.json({
      success: true,
      data: purchaseRequests,
      count: purchaseRequests.length,
    });
  } catch (error) {
    return handleApiError(error, {
      route: 'GET /api/purchase',
      userId: undefined, // session not available in catch block
    });
  }
}
