/**
 * Purchase Request Detail API Route
 *
 * GET /api/purchase/[id] - Get a specific purchase request
 */

import { NextResponse } from 'next/server';

import * as checkoutService from '@/features/checkout';
import { badRequest, handleApiError, withAuth } from '@/lib/api';

/**
 * GET /api/purchase/[id]
 *
 * Get details of a specific purchase request
 * Only returns the request if it belongs to the authenticated user
 */
export const GET = withAuth(async (_request, { userId, params }) => {
  try {
    const id = params?.id;

    if (!id) {
      return badRequest('Purchase request ID is required', {
        route: 'GET /api/purchase/[id]',
        userId,
      });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return badRequest('Invalid purchase request ID', {
        route: 'GET /api/purchase/[id]',
        userId,
      });
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
    return handleApiError(error, {
      route: 'GET /api/purchase/[id]',
      userId,
    });
  }
});
