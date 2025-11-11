/**
 * API Route: PATCH /api/settings/profile
 * Updates user profile information (name)
 */

import { NextResponse } from 'next/server';

import { updateUserName } from '@/features/settings';
import { badRequest, handleApiError, withAuth } from '@/lib/api';

export const PATCH = withAuth(async (request, { userId }) => {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return badRequest('Name is required', {
        route: 'PATCH /api/settings/profile',
        userId,
      });
    }

    const updatedUser = await updateUserName({
      userId,
      name,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    return handleApiError(error, {
      route: 'PATCH /api/settings/profile',
      userId,
    });
  }
});
