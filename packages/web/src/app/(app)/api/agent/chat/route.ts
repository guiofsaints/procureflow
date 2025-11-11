/**
 * Agent Chat API Route
 *
 * POST /api/agent/chat - Send message to AI agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError } from 'zod';

import {
  handleAgentMessage,
  ValidationError,
} from '@/features/agent/lib/agent.service';
import { authConfig } from '@/lib/auth/config';
import { logger } from '@/lib/logger/winston.config';
import { validateWithModeration } from '@/lib/validation/moderation';
import { validateUserInput } from '@/lib/validation/promptInjection';
import { validateAgentMessageRequest } from '@/lib/validation/schemas';

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

    // Parse request body
    const body = await request.json();

    // Validate request structure with Zod
    const validatedRequest = validateAgentMessageRequest(body);

    // Check for prompt injection (strict mode for high-severity patterns)
    let safeMessage: string;
    try {
      safeMessage = validateUserInput(validatedRequest.message, {
        strict: true, // Throw on high-severity injection attempts
        sanitize: true,
      });
    } catch (error) {
      logger.warn('Prompt injection blocked', {
        userId: session?.user?.id,
        messageLength: validatedRequest.message.length,
        error: error instanceof Error ? error.message : String(error),
      });

      return NextResponse.json(
        {
          error: 'Validation failed',
          message:
            'Your message contains patterns that may violate safety policies. Please rephrase and try again.',
        },
        { status: 400 }
      );
    }

    // Optional: OpenAI moderation (if enabled)
    try {
      await validateWithModeration(safeMessage);
    } catch (error) {
      logger.warn('Content moderation blocked message', {
        userId: session?.user?.id,
        messageLength: safeMessage.length,
        error: error instanceof Error ? error.message : String(error),
      });

      return NextResponse.json(
        {
          error: 'Content policy violation',
          message:
            'Your message violates content safety policies. Please revise and try again.',
        },
        { status: 400 }
      );
    }

    // Handle agent message with timeout (60 seconds)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout after 60s')), 60000)
    );

    // Call agent service
    const responsePromise = handleAgentMessage({
      userId: session?.user?.id,
      message: safeMessage,
      conversationId: validatedRequest.conversationId,
    });

    const response = await Promise.race([
      responsePromise,
      timeoutPromise,
    ]).catch((error) => {
      logger.error('Error or timeout in handleAgentMessage', {
        error: error instanceof Error ? error.message : String(error),
        userId: session?.user?.id,
      });
      throw error;
    });

    // Type assertion for logging
    const typedResponse = response as {
      conversationId?: string;
      messages?: Array<{ metadata?: Record<string, unknown> }>;
    };

    logger.debug('[API] Agent response ready', {
      conversationId: typedResponse.conversationId,
      messageCount: typedResponse.messages?.length || 0,
      hasMessages: !!typedResponse.messages,
      lastMessageHasMetadata: typedResponse.messages?.[typedResponse.messages.length - 1]?.metadata ? true : false,
      lastMessageMetadataKeys: typedResponse.messages?.[typedResponse.messages.length - 1]?.metadata 
        ? Object.keys(typedResponse.messages[typedResponse.messages.length - 1].metadata!) 
        : [],
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error in POST /api/agent/chat', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const zodError = error as { issues: Array<{ message: string }> };
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: zodError.issues[0]?.message || 'Invalid request format',
          details: zodError.issues,
        },
        { status: 400 }
      );
    }

    // Handle specific errors
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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
