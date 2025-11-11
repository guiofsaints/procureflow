/**
 * Agent Conversations API Route
 * GET /api/agent/conversations - List user's conversation history
 */

import { NextResponse } from 'next/server';

import { listConversationsForUser } from '@/features/agent/lib/agent.service';
import { handleApiError, withAuth } from '@/lib/api';

// Force dynamic rendering to prevent build-time errors with database
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request, { userId }) => {
  try {
    // Check if MongoDB is configured
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        {
          success: true,
          data: [], // Return empty array when DB not configured
        },
        { status: 200 }
      );
    }

    // Get limit from query params (optional)
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // Fetch conversations for user
    const conversations = await listConversationsForUser(userId, limit);

    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    return handleApiError(error, {
      route: 'GET /api/agent/conversations',
      userId,
    });
  }
});
