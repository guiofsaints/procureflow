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
          title: 'Agent',
          url: '/agent',
          icon: MessageSquare,
        },
        {
          title: 'Purchase History',
          url: '/purchase-requests',
          icon: FileText,
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
