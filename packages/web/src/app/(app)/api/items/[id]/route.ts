/**
 * Single Item API Route
 *
 * GET /api/items/[id] - Get item by ID
 * PUT /api/items/[id] - Update item by ID
 */

import { NextRequest, NextResponse } from 'next/server';

import * as catalogService from '@/features/catalog';
import { badRequest, handleApiError, withAuth } from '@/lib/api';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/items/[id]
 *
 * Get single item by ID
 * Public endpoint (no authentication required)
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Validate ID format (basic check)
    if (!id || id.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid ID',
          message: 'Item ID is required',
        },
        { status: 400 }
      );
    }

    // Fetch item by ID
    const item = await catalogService.getItemById(id);

    if (!item) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: `Item with ID ${id} not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    // Handle invalid ObjectId error from MongoDB
    if (error instanceof Error && error.message.includes('ObjectId')) {
      return NextResponse.json(
        {
          error: 'Invalid ID',
          message: 'Invalid item ID format',
        },
        { status: 400 }
      );
    }

    return handleApiError(error, {
      route: 'GET /api/items/[id]',
    });
  }
}

/**
 * PUT /api/items/[id]
 *
 * Update an existing catalog item
 * Requires authentication
 */
export const PUT = withAuth(async (request, { userId, params }) => {
  try {
    const id = params?.id;

    // Validate ID format
    if (!id || id.trim().length === 0) {
      return badRequest('Item ID is required', {
        route: 'PUT /api/items/[id]',
        userId,
      });
    }

    // Parse request body
    const body = await request.json();

    // Update item
    const item = await catalogService.updateItem(id, body);

    return NextResponse.json(item);
  } catch (error) {
    // Handle invalid ObjectId error from MongoDB
    if (error instanceof Error && error.message.includes('ObjectId')) {
      return badRequest('Invalid item ID format', {
        route: 'PUT /api/items/[id]',
        userId,
      });
    }

    return handleApiError(error, {
      route: 'PUT /api/items/[id]',
      userId,
    });
  }
});
