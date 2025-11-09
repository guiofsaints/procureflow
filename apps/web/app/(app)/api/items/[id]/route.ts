/**
 * Single Item API Route
 *
 * GET /api/items/[id] - Get item by ID
 * PUT /api/items/[id] - Update item by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import * as catalogService from '@/features/catalog';
import { authOptions } from '@/lib/auth/config';

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
    console.error('Error in GET /api/items/[id]:', error);

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

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to fetch item',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/items/[id]
 *
 * Update an existing catalog item
 * Requires authentication
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to update items',
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Validate ID format
    if (!id || id.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid ID',
          message: 'Item ID is required',
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Update item
    const item = await catalogService.updateItem(id, body);

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error in PUT /api/items/[id]:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: error.message,
        },
        { status: 400 }
      );
    }

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

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to update item',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
