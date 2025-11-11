/**
 * API Route: GET /api/settings/conversations
 * Gets all conversations for the authenticated user
 *
 * API Route: DELETE /api/settings/conversations
 * Deletes all conversations for the authenticated user
 */

import { NextResponse } from 'next/server';

import {
  deleteAllConversations,
  listUserConversations,
} from '@/features/settings';
import { handleApiError, withAuth } from '@/lib/api';

export const GET = withAuth(async (_request, { userId }) => {
  try {
    const conversations = await listUserConversations(userId);

    return NextResponse.json({ conversations });
  } catch (error) {
    return handleApiError(error, {
      route: 'GET /api/settings/conversations',
      userId,
    });
  }
});

export const DELETE = withAuth(async (_request, { userId }) => {
  try {
    const count = await deleteAllConversations(userId);

    return NextResponse.json({ count });
  } catch (error) {
    return handleApiError(error, {
      route: 'DELETE /api/settings/conversations',
      userId,
    });
  }
});
