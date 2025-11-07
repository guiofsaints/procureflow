/**
 * Catalog API Routes
 *
 * GET /api/items - Search items
 * POST /api/items - Create new item
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authConfig } from '@/lib/auth/config';
import * as catalogService from '@/server/catalog.service';

/**
 * GET /api/items
 *
 * Search catalog items by keyword
 * Query params:
 * - q: Search keyword (optional)
 * - limit: Max results (optional, default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || undefined;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 50;

    const items = await catalogService.searchItems({ q, limit });

    return NextResponse.json({
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('Error in GET /api/items:', error);
    return NextResponse.json(
      {
        error: 'Failed to search items',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/items
 *
 * Create a new catalog item
 * Requires authentication
 *
 * Body:
 * - name: string (required)
 * - category: string (required)
 * - description: string (required)
 * - estimatedPrice: number (required)
 * - unit?: string (optional)
 * - preferredSupplier?: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.category || !body.description) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Missing required fields: name, category, description',
        },
        { status: 400 }
      );
    }

    if (
      typeof body.estimatedPrice !== 'number' ||
      body.estimatedPrice <= 0
    ) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'estimatedPrice must be a positive number',
        },
        { status: 400 }
      );
    }

    // Create item via service
    const item = await catalogService.createItem({
      name: body.name,
      category: body.category,
      description: body.description,
      estimatedPrice: body.estimatedPrice,
      unit: body.unit,
      preferredSupplier: body.preferredSupplier,
      createdByUserId: session.user.id,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/items:', error);

    // Handle validation errors
    if (error instanceof catalogService.ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      );
    }

    // Handle duplicate item warnings
    if (error instanceof catalogService.DuplicateItemError) {
      return NextResponse.json(
        {
          error: 'Potential duplicate detected',
          message: error.message,
          duplicates: error.duplicates,
        },
        { status: 409 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to create item',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
