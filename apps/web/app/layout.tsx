import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { ThemeProvider, Toaster } from '@/components';
import { AuthProvider } from '@/features/auth';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ProcureFlow - AI-Native Procurement Platform',
  description: 'Bootstrap codebase for AI-native procurement case study',
  keywords: ['procurement', 'ai', 'automation', 'nextjs'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
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
      </body>
    </html>
  );
}
