import type { CartItem } from '@/domain/entities';

/**
 * Mock cart items for UI development
 * Replace with actual cart state from API later
 */
export const mockCartItems: CartItem[] = [
  {
    itemId: '1',
    itemName: 'Laptop Dell XPS 15',
    itemPrice: 1299.99,
    quantity: 1,
    subtotal: 1299.99,
    addedAt: new Date('2024-01-15T10:30:00'),
  },
  {
    itemId: '6',
    itemName: 'Mechanical Keyboard',
    itemPrice: 149.99,
    quantity: 2,
    subtotal: 299.98,
    addedAt: new Date('2024-01-15T11:00:00'),
  },
  {
    itemId: '3',
    itemName: 'Wireless Mouse Logitech MX Master 3',
    itemPrice: 99.99,
    quantity: 1,
    subtotal: 99.99,
    addedAt: new Date('2024-01-15T11:15:00'),
  },
];
