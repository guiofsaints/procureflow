'use client';

import { Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid credentials', {
          description: 'Please check your email and password and try again.',
        });
        setIsLoading(false);
      } else {
        toast.success('Login successful!', {
          description: 'Redirecting to catalog...',
        });
        setTimeout(() => {
          router.push('/catalog');
        }, 800);
      }
    } catch {
      toast.error('An error occurred', {
        description: 'Please try again later.',
      });
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('demo@procureflow.com');
    setPassword('demo123');
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4'>
      <div className='w-full max-w-md'>
        {/* Logo and Title */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4'>
            <span className='text-white font-bold text-2xl'>PF</span>
          </div>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
            ProcureFlow
          </h1>
          <p className='mt-2 text-gray-600 dark:text-gray-400'>
            AI-Native Procurement Platform
          </p>
        </div>

        {/* Login Card */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-6'>
            Sign in to your account
          </h2>

          <form onSubmit={handleLogin} className='space-y-5'>
            {/* Email Field */}
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
              >
                Email
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors'
                placeholder='your@email.com'
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
              >
                Password
              </label>
              <input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors'
                placeholder='••••••••'
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <Button
              type='submit'
              variant='primary'
              className='w-full flex items-center justify-center gap-2'
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className='h-5 w-5 animate-spin' />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className='h-5 w-5' />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
            <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
              Demo credentials:
            </p>
            <button
              type='button'
              onClick={fillDemoCredentials}
              className='w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
              disabled={isLoading}
            >
              Fill demo credentials
            </button>
            <p className='text-xs text-gray-500 dark:text-gray-500 mt-2 text-center'>
              demo@procureflow.com / demo123
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className='mt-8 text-center text-sm text-gray-500 dark:text-gray-400'>
          Secure authentication powered by NextAuth.js
        </p>
      </div>
    </div>
  );
}
