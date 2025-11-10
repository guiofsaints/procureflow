/**
 * API Route: GET /api/settings/conversations
 * Gets all conversations for the authenticated user
 *
 * API Route: DELETE /api/settings/conversations
 * Deletes all conversations for the authenticated user
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import {
  deleteAllConversations,
  listUserConversations,
} from '@/features/settings';
import { authConfig } from '@/lib/auth/config';

export async function GET() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await listUserConversations(session.user.id);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('GET /api/settings/conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await deleteAllConversations(session.user.id);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('DELETE /api/settings/conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversations' },
      { status: 500 }
    );
  }
}
