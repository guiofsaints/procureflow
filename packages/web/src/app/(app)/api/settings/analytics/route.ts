/**
 * Settings Analytics API Route
 *
 * GET /api/settings/analytics - Get token usage analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { getTokenUsageAnalytics } from '@/features/settings';
import { authConfig } from '@/lib/auth/config';
import { logger } from '@/lib/logger/winston.config';

/**
 * GET /api/settings/analytics
 *
 * Query params:
 * - startDate?: string (ISO date, inclusive)
 * - endDate?: string (ISO date, inclusive)
 * - period?: 'day' | 'week' | 'month' (default: day)
 *
 * Returns token usage analytics including:
 * - Summary metrics (total cost, tokens, requests)
 * - Time series data
 * - Breakdowns by provider and model
 * - Top conversations by cost
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'User must be authenticated' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const period = (searchParams.get('period') || 'day') as
      | 'day'
      | 'week'
      | 'month';

    // Default to last 30 days if no dates provided
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Get analytics
    const analytics = await getTokenUsageAnalytics({
      userId: session.user.id,
      startDate,
      endDate,
      period,
    });

    logger.info('Token usage analytics retrieved', {
      userId: session.user.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      requestCount: analytics.summary.requestCount,
    });

    return NextResponse.json({
      analytics,
      filters: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period,
      },
    });
  } catch (error) {
    logger.error('Error in GET /api/settings/analytics', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Analytics query failed',
        message: 'An error occurred while fetching token usage analytics.',
      },
      { status: 500 }
    );
  }
}
