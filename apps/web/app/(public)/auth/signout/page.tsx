'use client';

import { Loader2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * Custom Sign Out Page
 *
 * Provides a better UX when logging out by showing a loading state
 * before redirecting to the home page.
 *
 * This page is referenced in authConfig.pages.signOut
 */
export default function SignOutPage() {
  useEffect(() => {
    // Automatically sign out when component mounts
    signOut({ callbackUrl: '/' });
  }, []);

  return (
    <div className='flex min-h-screen items-center justify-center bg-background'>
      <div className='text-center'>
        <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-primary' />
        <h1 className='text-2xl font-bold mb-2'>Logging out...</h1>
        <p className='text-muted-foreground'>
          Please wait while we securely sign you out
        </p>
      </div>
    </div>
  );
}
