'use client';

import { Loader2, LogIn } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/components';
import Aurora from '@/components/Aurora';

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

  return (
    <div className='min-h-screen flex items-center justify-center px-4 relative overflow-hidden'>
      {/* Aurora Background */}
      <div className='fixed inset-0 '>
        <Aurora
          colorStops={['#8b5cf6', '#3b82f6', '#8b5cf6']}
          blend={0.4}
          amplitude={0.5}
          speed={0.2}
        />
      </div>

      <div className='w-full max-w-md relative z-10'>
        {/* Logo and Title */}
        <div className='text-left mb-2'>
          <div className='container mx-auto w-max flex h-16 items-center px-4'>
            <Link
              href='/'
              className='flex gap-3 transition-opacity hover:opacity-80'
            >
              <Image
                src='/procureflow.png'
                alt='ProcureFlow'
                width={48}
                height={48}
                className='h-12 w-12 object-contain'
                priority
              />
              <div className='flex flex-col'>
                <span className='text-lg font-semibold leading-tight text-foreground text-left'>
                  ProcureFlow
                </span>
                <span className='text-xs text-muted-foreground'>
                  AI-Native Procurement Platform
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Login Card */}
        <Card className='py-8 backdrop-blur-sm bg-background/80'>
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
        </Card>
      </div>
    </div>
  );
}
