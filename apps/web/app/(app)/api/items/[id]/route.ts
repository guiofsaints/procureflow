/**
 * Single Item API Route
 *
 * GET /api/items/[id] - Get item by ID
 */

import { NextRequest, NextResponse } from 'next/server';

import * as catalogService from '@/features/catalog';

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
