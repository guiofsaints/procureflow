/**
 * NextAuth Session Test Mocks
 *
 * Mock session data for testing authenticated routes and components.
 */

import type { Session } from 'next-auth';

/**
 * Mock authenticated session
 */
export const mockAuthenticatedSession: Session = {
  user: {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h from now
};

/**
 * Mock unauthenticated session
 */
export const mockUnauthenticatedSession: Session | null = null;

/**
 * Create custom session with overrides
 */
export const createMockSession = (overrides?: Partial<Session>): Session => ({
  ...mockAuthenticatedSession,
  ...overrides,
});

/**
 * Mock admin session
 */
export const mockAdminSession: Session = {
  user: {
    id: '507f1f77bcf86cd799439012',
    email: 'admin@example.com',
    name: 'Admin User',
    // role: 'admin', // If you have role-based auth
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};
