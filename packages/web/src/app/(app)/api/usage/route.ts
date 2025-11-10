/**
 * Token Usage API Route
 *
 * GET /api/usage - Get token usage statistics
 */

import type { Model } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authConfig } from '@/lib/auth/config';
import { TokenUsageModel } from '@/lib/db/models';
import { connectDB } from '@/lib/db/mongoose';
import type { ITokenUsage } from '@/lib/db/schemas/tokenUsage.schema';
import { logger } from '@/lib/logger/winston.config';

/**
 * GET /api/usage
 *
 * Query token usage with filters
 *
 * Query params:
 * - userId?: string (filter by user)
 * - conversationId?: string (filter by conversation)
 * - provider?: string (filter by provider: openai, gemini)
 * - startDate?: string (ISO date, inclusive)
 * - endDate?: string (ISO date, inclusive)
 * - limit?: number (max results, default: 100)
 * - skip?: number (pagination offset, default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication (optional - return user-specific data if authenticated)
    const session = await getServerSession(authConfig);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const conversationId = searchParams.get('conversationId');
    const provider = searchParams.get('provider');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '100', 10),
      1000
    );
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    // Build filter
    const filter: Record<string, unknown> = {};

    // If authenticated and no userId param, default to current user
    if (session?.user?.id && !userId) {
      filter.userId = session.user.id;
    } else if (userId) {
      // Only allow querying other users' data if admin (future feature)
      filter.userId = userId;
    }

    if (conversationId) {
      filter.conversationId = conversationId;
    }

    if (provider) {
      filter.provider = provider;
    }

    if (startDate || endDate) {
      const dateFilter: { $gte?: Date; $lte?: Date } = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.$lte = new Date(endDate);
      }
      filter.createdAt = dateFilter;
    }

    // Connect to database
    await connectDB();

    // Query token usage with type assertion for Mongoose compatibility
    const model = TokenUsageModel as unknown as Model<ITokenUsage>;
    const usageQuery = model
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const [usage, total] = await Promise.all([
      usageQuery.exec(),
      model.countDocuments(filter).exec(),
    ]);

    // Calculate aggregates
    const aggregates = await model
      .aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalCost: { $sum: '$costUSD' },
            totalTokens: { $sum: '$totalTokens' },
            totalPromptTokens: { $sum: '$promptTokens' },
            totalCompletionTokens: { $sum: '$completionTokens' },
            requestCount: { $sum: 1 },
          },
        },
      ])
      .exec();

    const summary = aggregates[0] || {
      totalCost: 0,
      totalTokens: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      requestCount: 0,
    };

    // Group by provider
    const byProvider = await model
      .aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$provider',
            cost: { $sum: '$costUSD' },
            tokens: { $sum: '$totalTokens' },
            requests: { $sum: 1 },
          },
        },
      ])
      .exec();

    // Group by model
    const byModel = await model
      .aggregate([
        { $match: filter },
        {
          $group: {
            _id: { provider: '$provider', model: '$modelName' },
            cost: { $sum: '$costUSD' },
            tokens: { $sum: '$totalTokens' },
            requests: { $sum: 1 },
          },
        },
      ])
      .exec();

    logger.info('Token usage query', {
      userId: filter.userId as string | undefined,
      resultCount: usage.length,
      total,
    });

    return NextResponse.json({
      usage,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + usage.length < total,
      },
      summary: {
        totalCost: summary.totalCost,
        totalTokens: summary.totalTokens,
        totalPromptTokens: summary.totalPromptTokens,
        totalCompletionTokens: summary.totalCompletionTokens,
        requestCount: summary.requestCount,
      },
      breakdowns: {
        byProvider: byProvider.map((p) => ({
          provider: p._id,
          cost: p.cost,
          tokens: p.tokens,
          requests: p.requests,
        })),
        byModel: byModel.map((m) => ({
          provider: m._id.provider,
          model: m._id.model,
          cost: m.cost,
          tokens: m.tokens,
          requests: m.requests,
        })),
      },
    });
  } catch (error) {
    logger.error('Error in GET /api/usage', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Usage query failed',
        message: 'An error occurred while fetching token usage data.',
      },
      { status: 500 }
    );
  }
}
