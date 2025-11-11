/**
 * API Route: DELETE /api/settings/conversations/[id]
 * Deletes a single conversation by ID
 */

import { NextResponse } from 'next/server';

import { deleteConversation } from '@/features/settings';
import { badRequest, handleApiError, withAuth } from '@/lib/api';

export const DELETE = withAuth(async (_request, { userId, params }) => {
  try {
    const id = params?.id;

    if (!id) {
      return badRequest('Conversation ID is required', {
        route: 'DELETE /api/settings/conversations/[id]',
        userId,
      });
    }

    await deleteConversation(userId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, {
      route: 'DELETE /api/settings/conversations/[id]',
      userId,
    });
  }
});
