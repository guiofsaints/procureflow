/**
 * Agent Conversation by ID API Route
 * GET /api/agent/conversations/[id] - Get specific conversation summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { getConversationSummaryById } from '@/features/agent';
import { authConfig } from '@/lib/auth/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get conversation ID from params
    const { id } = await params;

    // Fetch conversation summary
    const conversation = await getConversationSummaryById(session.user.id, id);

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('GET /api/agent/conversations/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}
