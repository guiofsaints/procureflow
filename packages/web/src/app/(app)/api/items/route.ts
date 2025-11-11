/**
 * Catalog API Routes
 *
 * GET /api/items - Search items
 * POST /api/items - Create new item
 */

import { NextRequest, NextResponse } from 'next/server';

import * as catalogService from '@/features/catalog';
import { badRequest, handleApiError, withAuth } from '@/lib/api';

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
    return handleApiError(error, {
      route: 'GET /api/items',
    });
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
export const POST = withAuth(async (request, { userId }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.category || !body.description) {
      return badRequest(
        'Missing required fields: name, category, description',
        {
          route: 'POST /api/items',
          userId,
        }
      );
    }

    if (typeof body.estimatedPrice !== 'number' || body.estimatedPrice <= 0) {
      return badRequest('estimatedPrice must be a positive number', {
        route: 'POST /api/items',
        userId,
      });
    }

    // Create item via service
    const item = await catalogService.createItem({
      name: body.name,
      category: body.category,
      description: body.description,
      estimatedPrice: body.estimatedPrice,
      unit: body.unit,
      preferredSupplier: body.preferredSupplier,
      createdByUserId: userId,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      route: 'POST /api/items',
      userId,
    });
  }
});
