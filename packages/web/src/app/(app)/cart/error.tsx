'use client';

import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { logger } from '@/lib/logger';

export default function CartError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Cart page error', {
      error: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className='container mx-auto p-6'>
      <Card className='mx-auto max-w-2xl'>
        <CardHeader>
          <CardTitle>Failed to load cart</CardTitle>
          <CardDescription>
            We encountered an error while loading your shopping cart.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>

          <div className='flex gap-2'>
            <Button onClick={reset} className='flex-1'>
              Try again
            </Button>
            <Button variant='outline' asChild className='flex-1'>
              <Link href='/catalog'>Browse catalog</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
