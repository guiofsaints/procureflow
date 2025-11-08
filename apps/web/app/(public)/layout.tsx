import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Layout for public routes (landing, docs, etc.)
 * Inherits from root layout.tsx for global styles and metadata
 * Features ProcureFlow logo in the header
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Public Header with Logo */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <Image
              src="/procureflow.png"
              alt="ProcureFlow"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              priority
            />
            <div className="flex flex-col">
              <span className="text-lg font-semibold leading-tight text-foreground">
                ProcureFlow
              </span>
              <span className="text-xs text-muted-foreground">
                AI-Native Procurement Platform
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}

