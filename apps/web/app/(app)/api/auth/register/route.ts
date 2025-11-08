/**
 * User Registration API
 * POST /api/auth/register
 *
 * Creates a new user account with hashed password
 */

import { NextRequest, NextResponse } from 'next/server';

import { registerUser } from '@/features/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, password, name, role } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email, password, and name are required',
        },
        { status: 400 }
      );
    }

    // Register user
    const user = await registerUser({
      email,
      password,
      name,
      role,
    });

    return NextResponse.json(
      {
        success: true,
        data: user,
        message: 'User registered successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/auth/register error:', error);

    if (error instanceof Error) {
      // Handle specific error messages
      if (
        error.message.includes('already exists') ||
        error.message.includes('duplicate')
      ) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        );
      }

      if (
        error.message.includes('required') ||
        error.message.includes('validation') ||
        error.message.includes('Password must')
      ) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
