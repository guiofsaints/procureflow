'use client';

import { ChevronDown, LogOut, Settings, User } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  collapsed?: boolean;
}

/**
 * UserMenu component with dropdown functionality
 * Shows user avatar, name, and dropdown menu with options
 * Placed at the bottom of the Sidebar
 * Migrated to shadcn Avatar and DropdownMenu components
 */
export function UserMenu({ collapsed }: UserMenuProps) {
  // Mock user data - replace with actual user data later
  const user = {
    name: 'Gui Santos',
    email: 'gui@procureflow.com',
    initials: 'GS',
  };

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-3 p-2 w-full rounded-lg transition-colors',
            'hover:bg-accent',
            'text-foreground',
            'data-[state=open]:bg-accent'
          )}
          title={collapsed ? user.name : undefined}
        >
          {/* Avatar usando componente shadcn */}
          <Avatar className='h-8 w-8'>
            <AvatarFallback className='bg-primary text-primary-foreground text-sm'>
              {user.initials}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <>
              {/* User info */}
              <div className='flex-1 text-left min-w-0 hidden sm:block'>
                <p className='text-sm font-medium truncate'>{user.name}</p>
                <p className='text-xs text-muted-foreground truncate'>
                  {user.email}
                </p>
              </div>

              {/* Dropdown icon */}
              <ChevronDown className='h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180' />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={collapsed ? 'right' : 'top'}
        align='start'
        className='w-56'
      >
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{user.name}</p>
            <p className='text-xs leading-none text-muted-foreground'>
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuItems.map((item, index) => (
          <div key={item.label}>
            {index === menuItems.length - 1 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={item.onClick}
              className={cn(item.danger && 'text-destructive')}
            >
              <item.icon className='mr-2 h-4 w-4' />
              <span>{item.label}</span>
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
