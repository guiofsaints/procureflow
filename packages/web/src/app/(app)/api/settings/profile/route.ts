/**
 * API Route: PATCH /api/settings/profile
 * Updates user profile information (name)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { updateUserName } from '@/features/settings';
import { authConfig } from '@/lib/auth/config';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserName({
      userId: session.user.id,
      name,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('PATCH /api/settings/profile error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 500 }
    );
  }
}
