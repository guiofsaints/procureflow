/**
 * Agent Conversations API Route
 * GET /api/agent/conversations - List user's conversation history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { listConversationsForUser } from '@/features/agent';
import { authConfig } from '@/lib/auth/config';

export async function GET(request: NextRequest) {
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

    // Check authentication
    const session = await getServerSession(authConfig);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Debug: Log user ID being used for query
    console.warn(
      '[GET /api/agent/conversations] Fetching conversations for userId:',
      session.user.id
    );

    // Get limit from query params (optional)
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // Fetch conversations for user
    const conversations = await listConversationsForUser(
      session.user.id,
      limit
    );

    console.warn(
      '[GET /api/agent/conversations] Found',
      conversations.length,
      'conversations'
    );

    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('GET /api/agent/conversations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
