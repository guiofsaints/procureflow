import type { Item } from '@/domain/entities';
import { ItemStatus } from '@/domain/entities';

/**
 * Mock catalog items for UI development
 * Replace with actual API calls later
 */
export const mockItems: Omit<Item, 'createdAt' | 'updatedAt'>[] = [
  {
    id: '1',
    name: 'Laptop Dell XPS 15',
    category: 'Electronics',
    description:
      'High-performance laptop with 15.6" display, Intel i7, 16GB RAM, 512GB SSD',
    price: 1299.99,
    status: ItemStatus.Active,
  },
  {
    id: '2',
    name: 'Office Chair Ergonomic',
    category: 'Furniture',
    description:
      'Adjustable ergonomic office chair with lumbar support and mesh back',
    price: 349.99,
    status: ItemStatus.Active,
  },
  {
    id: '3',
    name: 'Wireless Mouse Logitech MX Master 3',
    category: 'Electronics',
    description:
      'Advanced wireless mouse with precision scrolling and programmable buttons',
    price: 99.99,
    status: ItemStatus.Active,
  },
  {
    id: '4',
    name: 'Standing Desk Adjustable',
    category: 'Furniture',
    description: 'Electric height-adjustable standing desk, 60" x 30" surface',
    price: 599.99,
    status: ItemStatus.Active,
  },
  {
    id: '5',
    name: 'Monitor LG 27" 4K',
    category: 'Electronics',
    description: '27-inch 4K UHD monitor with IPS panel and USB-C connectivity',
    price: 449.99,
    status: ItemStatus.Active,
  },
  {
    id: '6',
    name: 'Mechanical Keyboard',
    category: 'Electronics',
    description: 'RGB mechanical keyboard with Cherry MX switches',
    price: 149.99,
    status: ItemStatus.Active,
  },
  {
    id: '7',
    name: 'Notebook A4 Set',
    category: 'Office Supplies',
    description: 'Pack of 5 A4 notebooks, 200 pages each, ruled',
    price: 24.99,
    status: ItemStatus.Active,
  },
  {
    id: '8',
    name: 'Printer HP LaserJet',
    category: 'Electronics',
    description: 'Monochrome laser printer with wireless connectivity',
    price: 249.99,
    status: ItemStatus.Active,
  },
  {
    id: '9',
    name: 'Desk Lamp LED',
    category: 'Furniture',
    description: 'Adjustable LED desk lamp with USB charging port',
    price: 39.99,
    status: ItemStatus.Active,
  },
  {
    id: '10',
    name: 'Webcam Logitech C920',
    category: 'Electronics',
    description: 'Full HD 1080p webcam with auto-focus and stereo audio',
    price: 79.99,
    status: ItemStatus.Active,
  },
];
