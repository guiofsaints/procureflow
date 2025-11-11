'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to winston
    logger.error('Global error boundary triggered', {
      error: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {process.env.NODE_ENV === 'development' && (
            <div className='rounded-md bg-destructive/10 p-4'>
              <p className='text-sm font-mono text-destructive'>
                {error.message}
              </p>
            </div>
          )}
          <div className='flex gap-2'>
            <Button onClick={reset} className='flex-1'>
              Try again
            </Button>
            <Button
              variant='outline'
              onClick={() => (window.location.href = '/')}
              className='flex-1'
            >
              Go home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
