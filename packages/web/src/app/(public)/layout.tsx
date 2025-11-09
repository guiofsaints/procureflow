import type { ReactNode } from 'react';

/**
 * Layout for public routes (landing, docs, etc.)
 * Inherits from root layout.tsx for global styles and metadata
 * Features ProcureFlow logo in the header
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className='relative min-h-screen bg-background'>
      {/* Gradient Background */}
      <div className='gradient-background' aria-hidden='true' />

      {/* Main Content */}
      <main className='relative'>{children}</main>
    </div>
  );
}
