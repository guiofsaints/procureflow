/**
 * Vitest Test Setup
 *
 * Global test configuration and setup for all test files.
 * Runs before each test suite.
 */

import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';

// ============================================================================
// Global Test Setup
// ============================================================================

/**
 * Mock Next.js specific modules
 */
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

/**
 * Mock NextAuth session
 */
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

/**
 * Mock environment variables
 */
beforeEach(() => {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  process.env.NEXTAUTH_SECRET = 'test-secret';
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
});

/**
 * Clean up after each test
 */
afterEach(() => {
  vi.clearAllMocks();
});

/**
 * Suppress console errors in tests (optional)
 * Uncomment if tests produce too much noise
 */
// beforeEach(() => {
//   vi.spyOn(console, 'error').mockImplementation(() => {});
// });
