/**
 * Agent Conversation by ID API Route
 * GET /api/agent/conversations/[id] - Get specific conversation with full messages
 */

import { NextResponse } from 'next/server';

import { getConversationById } from '@/features/agent/lib/agent.service';
import { badRequest, handleApiError, withAuth } from '@/lib/api';

// Force dynamic rendering to prevent build-time errors with database
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_request, { userId, params }) => {
  try {
    const id = params?.id;

    if (!id) {
      return badRequest('Conversation ID is required', {
        route: 'GET /api/agent/conversations/[id]',
        userId,
      });
    }

    // Fetch complete conversation with messages
    const conversation = await getConversationById(userId, id);

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error) {
    return handleApiError(error, {
      route: 'GET /api/agent/conversations/[id]',
      userId,
    });
  }
});
