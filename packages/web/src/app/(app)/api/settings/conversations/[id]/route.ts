/**
 * API Route: DELETE /api/settings/conversations/[id]
 * Deletes a single conversation by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { deleteConversation } from '@/features/settings';
import { authConfig } from '@/lib/auth/config';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await deleteConversation(session.user.id, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/settings/conversations/[id] error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete conversation',
      },
      { status: 500 }
    );
  }
}
