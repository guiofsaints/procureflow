'use client';

import { ChevronUp, LogOut, Settings, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

interface UserMenuProps {
  collapsed?: boolean;
}

/**
 * UserMenu component with dropdown functionality
 * Shows user avatar, name, and dropdown menu with options
 * Placed at the bottom of the Sidebar
 */
export function UserMenu({ collapsed }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Mock user data - replace with actual user data later
  const user = {
    name: 'Gui Santos',
    email: 'gui@procureflow.com',
    initials: 'GS',
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const menuItems = [
    {
      label: 'Profile',
      icon: User,
      onClick: () => alert('Profile - Not implemented yet'),
    },
    {
      label: 'Settings',
      icon: Settings,
      onClick: () => alert('Settings - Not implemented yet'),
    },
    {
      label: 'Logout',
      icon: LogOut,
      onClick: () => alert('Logout - Not implemented yet'),
      danger: true,
    },
  ];

  return (
    <div ref={menuRef} className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 p-2 w-full rounded-lg transition-colors',
          'hover:bg-accent',
          'text-foreground',
          isOpen && 'bg-accent'
        )}
        aria-expanded={isOpen}
        aria-haspopup='true'
        title={collapsed ? user.name : undefined}
      >
        {/* Avatar */}
        <div className='flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium'>
          {user.initials}
        </div>

        {!collapsed && (
          <>
            {/* User info */}
            <div className='flex-1 text-left min-w-0'>
              <p className='text-sm font-medium truncate'>{user.name}</p>
              <p className='text-xs text-muted-foreground truncate'>
                {user.email}
              </p>
            </div>

            {/* Dropdown icon */}
            <ChevronUp
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute bottom-full mb-2 w-full min-w-[200px]',
            'bg-card rounded-lg shadow-lg border border-border',
            'py-1 z-50',
            collapsed && 'left-full ml-2 bottom-0'
          )}
        >
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                'flex items-center gap-3 px-4 py-2 w-full text-left text-sm',
                'hover:bg-accent transition-colors',
                item.danger
                  ? 'text-destructive'
                  : 'text-foreground'
              )}
            >
              <item.icon className='h-4 w-4' />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
