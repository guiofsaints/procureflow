import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../src/styles/globals.css';

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
    <html lang='en'>
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        {/* Future: Navigation component will go here */}
        <header className='bg-white shadow-sm border-b'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between items-center py-4'>
              <h1 className='text-xl font-semibold text-gray-900'>
                ProcureFlow
              </h1>
              {/* Future: Auth status and navigation links */}
              <nav className='text-sm text-gray-600'>Bootstrap Ready</nav>
            </div>
          </div>
        </header>

        <main className='flex-1'>{children}</main>

        {/* Future: Footer component will go here */}
        <footer className='bg-white border-t mt-auto'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
            <p className='text-center text-sm text-gray-500'>
              ProcureFlow - AI-Native Procurement Platform
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
