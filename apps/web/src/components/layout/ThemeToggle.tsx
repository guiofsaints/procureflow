'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  collapsed?: boolean;
}

/**
 * ThemeToggle component with next-themes integration
 * Toggles between light and dark themes
 * Shows appropriate icon for current theme
 */
export function ThemeToggle({ className, collapsed }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg text-gray-600 dark:text-gray-400',
          className
        )}
        disabled
        aria-label='Toggle theme'
      >
        <Sun className='h-5 w-5' />
        {!collapsed && <span className='text-sm'>Theme</span>}
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'text-gray-600 dark:text-gray-400',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <Moon className='h-5 w-5' /> : <Sun className='h-5 w-5' />}
      {!collapsed && (
        <span className='text-sm'>{isDark ? 'Dark' : 'Light'}</span>
      )}
    </button>
  );
}
