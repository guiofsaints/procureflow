'use client';

import { Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/components';

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
    <div className='min-h-screen from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4'>
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
        <Card>
          <CardHeader>
            <CardTitle className='text-xl'>Sign in to your account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className='space-y-5'>
              {/* Email Field */}
              <div>
                <Label htmlFor='email' className='mb-2'>
                  Email
                </Label>
                <Input
                  id='email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder='your@email.com'
                  disabled={isLoading}
                />
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor='password' className='mb-2'>
                  Password
                </Label>
                <Input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder='••••••••'
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type='submit'
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
          </CardContent>
          <CardFooter className='flex-col gap-3 border-t pt-6'>
            <p className='text-sm text-muted-foreground self-start'>
              Demo credentials:
            </p>
            <Button
              type='button'
              onClick={fillDemoCredentials}
              variant='outline'
              className='w-full'
              disabled={isLoading}
            >
              Fill demo credentials
            </Button>
            <p className='text-xs text-muted-foreground text-center'>
              demo@procureflow.com / demo123
            </p>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className='mt-8 text-center text-sm text-gray-500 dark:text-gray-400'>
          Secure authentication powered by NextAuth.js
        </p>
      </div>
    </div>
  );
}
