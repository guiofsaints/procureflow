import { FileText, MessageSquare, Package, ShoppingCart } from 'lucide-react';

import type { SidebarData } from '../types';

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Catalog',
          url: '/catalog',
          icon: Package,
        },
        {
          title: 'Cart',
          url: '/cart',
          icon: ShoppingCart,
          badge: 0, // Will be updated dynamically from CartContext
        },
        {
          title: 'Purchase',
          url: '/purchase',
          icon: FileText,
        },
        {
          title: 'Agent',
          url: '/agent',
          icon: MessageSquare,
        },
      ],
    },
  ],
  // User data will be populated from NextAuth session
  // This placeholder is overridden in AppShell.tsx
  user: {
    name: 'User',
    email: '',
    avatar: '',
  },
};
