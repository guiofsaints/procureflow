'use client';

/**
 * Auth Provider Component
 *
 * Wraps the app with NextAuth SessionProvider
 * - refetchInterval: 5 minutes (keeps session fresh)
 * - refetchOnWindowFocus: true (updates when user returns to tab)
 * - session: optional initial session from SSR (improves hydration)
 */

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

interface AuthProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refetch when user focuses window
    >
      {children}
    </SessionProvider>
  );
}
