/**
 * Mock Item Catalog
 *
 * In-memory mock catalog for agent demonstrations.
 */

import type { AgentItem } from '../types';

export const mockItems: AgentItem[] = [
  {
    id: 'mock-item-1',
    name: 'USB-C Cable (2m)',
    category: 'Electronics',
    description:
      'High-speed USB-C to USB-C cable for charging and data transfer. Durable braided design.',
    price: 15.99,
    availability: 'in_stock',
  },
  {
    id: 'mock-item-2',
    name: 'USB-C Cable (1m)',
    category: 'Electronics',
    description:
      'Compact USB-C cable, perfect for desk setups. Supports fast charging up to 100W.',
    price: 12.49,
    availability: 'in_stock',
  },
  {
    id: 'mock-item-3',
    name: 'Standing Desk Converter',
    category: 'Office Furniture',
    description:
      'Adjustable height desk riser with dual-tier design. Supports monitors and keyboards.',
    price: 189.99,
    availability: 'in_stock',
  },
  {
    id: 'mock-item-4',
    name: 'Ergonomic Keyboard',
    category: 'Computer Accessories',
    description:
      'Split ergonomic mechanical keyboard with wrist rest. Reduces strain during long typing sessions.',
    price: 129.99,
    availability: 'limited',
  },
  {
    id: 'mock-item-5',
    name: 'Wireless Mouse',
    category: 'Computer Accessories',
    description:
      'Precision wireless mouse with 6 programmable buttons. Long battery life up to 18 months.',
    price: 34.99,
    availability: 'in_stock',
  },
  {
    id: 'mock-item-6',
    name: 'Monitor Arm Mount',
    category: 'Office Furniture',
    description:
      'Single monitor desk mount with full articulation. Supports screens up to 32 inches.',
    price: 79.99,
    availability: 'in_stock',
  },
  {
    id: 'mock-item-7',
    name: 'Laptop Stand',
    category: 'Computer Accessories',
    description:
      'Aluminum laptop stand with adjustable height and angle. Improves ergonomics and airflow.',
    price: 45.99,
    availability: 'in_stock',
  },
  {
    id: 'mock-item-8',
    name: 'USB Hub 7-Port',
    category: 'Electronics',
    description:
      'Powered USB 3.0 hub with 7 ports. Individual LED switches for each port.',
    price: 29.99,
    availability: 'in_stock',
  },
  {
    id: 'mock-item-9',
    name: 'Desk Lamp LED',
    category: 'Office Furniture',
    description:
      'Adjustable LED desk lamp with touch controls. Multiple brightness levels and color temperatures.',
    price: 54.99,
    availability: 'limited',
  },
  {
    id: 'mock-item-10',
    name: 'HDMI Cable (3m)',
    category: 'Electronics',
    description:
      'High-speed HDMI 2.1 cable supporting 4K@120Hz and 8K@60Hz. Gold-plated connectors.',
    price: 19.99,
    availability: 'out_of_stock',
  },
];
