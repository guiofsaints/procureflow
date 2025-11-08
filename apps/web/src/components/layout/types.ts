import type { LucideIcon } from 'lucide-react';

export type NavLink = {
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: number | string;
};

export type NavCollapsible = {
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: number | string;
  items: NavLink[];
};

export type NavItem = NavLink | NavCollapsible;

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export type SidebarData = {
  navGroups: NavGroup[];
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
};
