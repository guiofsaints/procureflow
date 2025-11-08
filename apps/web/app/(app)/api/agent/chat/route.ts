/**
 * Agent Chat API Route
 *
 * POST /api/agent/chat - Send message to AI agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import * as agentService from '@/features/agent';
import { authConfig } from '@/lib/auth/config';

/**
 * POST /api/agent/chat
 *
 * Send message to AI agent and get response
 * Authentication recommended but optional for demo
 *
 * Body:
 * - message: string (required)
 * - conversationId?: string (optional, for continuing conversation)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional for demo)
    const session = await getServerSession(authConfig);

    // Debug: Log session info
    if (session?.user) {
      console.warn(
        '[POST /api/agent/chat] User authenticated:',
        session.user.email,
        'userId:',
        session.user.id
      );
    } else {
      console.warn(
        '[POST /api/agent/chat] No authenticated user - conversation will be anonymous'
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate message
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'message is required and must be a string',
        },
        { status: 400 }
      );
    }

    if (body.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'message cannot be empty' },
        { status: 400 }
      );
    }

    // Handle agent message
    const response = await agentService.handleAgentMessage({
      userId: session?.user?.id,
      message: body.message,
      conversationId: body.conversationId,
    });

    console.warn(
      '[POST /api/agent/chat] Response conversationId:',
      response.conversationId
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in POST /api/agent/chat:', error);

    // Handle validation errors
    if (error instanceof agentService.ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      );
    }

    // Generic error (don't leak internal details)
    return NextResponse.json(
      {
        error: 'Agent error',
        message:
          'An error occurred while processing your request. Please try again.',
      },
      { status: 500 }
    );
  }
}
