/**
 * Sign In Page
 *
 * Custom authentication page for ProcureFlow
 * Uses NextAuth.js credentials provider
 */

import { Metadata } from 'next';

import { SignInForm } from '@/features/auth/components/SignInForm';

export const metadata: Metadata = {
  title: 'Sign In - ProcureFlow',
  description: 'Sign in to your ProcureFlow account',
};

export default function SignInPage() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-bold tracking-tight text-gray-900'>
            Sign in to ProcureFlow
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Access your procurement dashboard
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
