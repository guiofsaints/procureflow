'use client';

/**
 * Sign In Form Component
 *
 * Client-side form for user authentication
 * Uses NextAuth.js signIn() method
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function SignInFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/catalog';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='mt-8 space-y-6'>
      {error && (
        <Alert variant='destructive'>
          <p>{error}</p>
        </Alert>
      )}

      <div className='space-y-4 rounded-md shadow-sm'>
        <div>
          <Label htmlFor='email'>Email address</Label>
          <Input
            id='email'
            name='email'
            type='email'
            autoComplete='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='you@example.com'
            className='mt-1'
          />
        </div>

        <div>
          <Label htmlFor='password'>Password</Label>
          <Input
            id='password'
            name='password'
            type='password'
            autoComplete='current-password'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='••••••••'
            className='mt-1'
          />
        </div>
      </div>

      <div>
        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>

      <div className='text-center text-sm text-gray-600'>
        <p>Demo credentials:</p>
        <p className='mt-1 font-mono text-xs'>
          guilherme@procureflow.com / guigui123
        </p>
      </div>
    </form>
  );
}

export function SignInForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInFormContent />
    </Suspense>
  );
}
