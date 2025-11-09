'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

/**
 * ThemeProvider component compatible with shadcn/ui and next-themes
 * Wraps children in ThemeProvider and supports light/dark/system themes
 *
 * Usage:
 * - Wrap your app layout with this provider
 * - Use `useTheme` hook from next-themes to access theme state
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
