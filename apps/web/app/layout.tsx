import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth';

import { ThemeProvider, Toaster } from '@/components';
import { AuthProvider } from '@/features/auth';
import { authConfig } from '@/lib/auth/config';

import { Providers } from './providers';

import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ProcureFlow - AI-Native Procurement Platform',
  description: 'Bootstrap codebase for AI-native procurement case study',
  keywords: ['procurement', 'ai', 'automation', 'nextjs'],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session on server for SSR hydration optimization
  const session = await getServerSession(authConfig);

  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AuthProvider session={session}>
            <ThemeProvider
              attribute='class'
              defaultTheme='system'
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
