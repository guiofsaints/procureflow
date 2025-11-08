'use client';

/**
 * Auth Provider Component
 *
 * Wraps the app with NextAuth SessionProvider
 */

import { SessionProvider } from 'next-auth/react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
