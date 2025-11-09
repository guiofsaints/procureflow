'use client';

import { ProgressProvider } from '@bprogress/next/app';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider
      height='4px'
      color='#8b5cf6' // violet-500
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
}
