/**
 * Purchase Requests API Route
 *
 * GET /api/purchase - List purchase requests for authenticated user
 */

import { NextResponse } from 'next/server';

import { PurchaseRequestStatus } from '@/domain/entities';
import * as checkoutService from '@/features/checkout';
import { badRequest, handleApiError, withAuth } from '@/lib/api';

/**
 * GET /api/purchase
 *
 * List all purchase requests for the authenticated user
 * Supports filtering by status
 *
 * Query Parameters:
 * - status: PurchaseRequestStatus (optional)
 */
export const GET = withAuth(async (request, { userId }) => {
  try {
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
      userId,
    });
  }
});
