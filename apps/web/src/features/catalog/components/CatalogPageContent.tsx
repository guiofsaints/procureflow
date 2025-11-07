'use client';

import { Eye, Loader2, Plus, Search, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components';
import { useCart } from '@/contexts/CartContext';
import type { Item } from '@/domain/entities';
import { cn } from '@/lib/utils';

import { mockItems } from '../mock';

/**
 * CatalogPageContent - Client component for catalog UI
 * Features:
 * - Search items by name/description
 * - Display items in a table
 * - Add items to cart (with visual feedback)
 * - Register new item (inline form)
 */
export function CatalogPageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
  });
  const { addItem } = useCart();

  // Filter items based on search query
  const filteredItems = mockItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  const handleAddToCart = async (
    item: Omit<Item, 'createdAt' | 'updatedAt'>
  ) => {
    // Mock: Simulate adding to cart with loading state
    setAddingToCart(item.id);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    setAddingToCart(null);

    // Increment cart counter
    addItem();

    // Show success toast
    toast.success('Added to cart!', {
      description: `${item.name} has been added to your cart.`,
    });
  };

  const handleRegisterItem = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mock: Simulate registration process
    setIsRegistering(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsRegistering(false);
    setNewItem({ name: '', category: '', description: '', price: '' });
    setShowRegisterForm(false);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
          Catalog
        </h1>
        <p className='mt-2 text-gray-600 dark:text-gray-400'>
          Browse and search items from the procurement catalog
        </p>
      </div>

      {/* Search and Actions Bar */}
      <div className='flex flex-col sm:flex-row gap-4'>
        {/* Search */}
        <div className='flex-1 relative'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <Search className='h-5 w-5 text-gray-400' />
          </div>
          <input
            type='text'
            placeholder='Search items by name, description, or category...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700',
              'rounded-lg bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-white placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            )}
          />
        </div>

        {/* Register Button */}
        <Button
          variant='primary'
          onClick={() => setShowRegisterForm(!showRegisterForm)}
          className='flex items-center gap-2'
        >
          <Plus className='h-4 w-4' />
          Register New Item
        </Button>
      </div>

      {/* Register Form */}
      {showRegisterForm && (
        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Register New Item
          </h3>
          <form onSubmit={handleRegisterItem} className='space-y-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Item Name *
                </label>
                <input
                  type='text'
                  required
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                  className={cn(
                    'block w-full px-3 py-2 border border-gray-300 dark:border-gray-700',
                    'rounded-lg bg-white dark:bg-gray-800',
                    'text-gray-900 dark:text-white',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Category *
                </label>
                <input
                  type='text'
                  required
                  value={newItem.category}
                  onChange={(e) =>
                    setNewItem({ ...newItem, category: e.target.value })
                  }
                  className={cn(
                    'block w-full px-3 py-2 border border-gray-300 dark:border-gray-700',
                    'rounded-lg bg-white dark:bg-gray-800',
                    'text-gray-900 dark:text-white',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                />
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={newItem.description}
                onChange={(e) =>
                  setNewItem({ ...newItem, description: e.target.value })
                }
                className={cn(
                  'block w-full px-3 py-2 border border-gray-300 dark:border-gray-700',
                  'rounded-lg bg-white dark:bg-gray-800',
                  'text-gray-900 dark:text-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Price (USD) *
              </label>
              <input
                type='number'
                required
                min='0'
                step='0.01'
                value={newItem.price}
                onChange={(e) =>
                  setNewItem({ ...newItem, price: e.target.value })
                }
                className={cn(
                  'block w-full px-3 py-2 border border-gray-300 dark:border-gray-700',
                  'rounded-lg bg-white dark:bg-gray-800',
                  'text-gray-900 dark:text-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
            </div>
            <div className='flex gap-2'>
              <Button type='submit' variant='primary' disabled={isRegistering}>
                {isRegistering ? (
                  <span className='flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Registering...
                  </span>
                ) : (
                  'Register Item'
                )}
              </Button>
              <Button
                type='button'
                variant='secondary'
                onClick={() => setShowRegisterForm(false)}
                disabled={isRegistering}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Items Table */}
      <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
            <thead className='bg-gray-50 dark:bg-gray-900'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  Name
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  Category
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  Description
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  Price
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className='px-6 py-8 text-center text-gray-500 dark:text-gray-400'
                  >
                    No items found matching your search.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className='hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  >
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900 dark:text-white'>
                        {item.name}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className='px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'>
                        {item.category}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate'>
                        {item.description}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900 dark:text-white'>
                        ${item.price.toFixed(2)}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      <div className='flex items-center gap-2'>
                        <Link href={`/catalog/${item.id}`}>
                          <button
                            className='inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                            title='View Details'
                          >
                            <Eye className='h-4 w-4' />
                            Details
                          </button>
                        </Link>
                        <button
                          onClick={() => handleAddToCart(item)}
                          disabled={addingToCart === item.id}
                          className={cn(
                            'inline-flex items-center gap-1 px-3 py-1.5',
                            'rounded-lg transition-colors',
                            'focus:outline-none focus:ring-2 focus:ring-offset-2',
                            'disabled:cursor-not-allowed',
                            addingToCart === item.id
                              ? 'bg-blue-500 text-white cursor-wait'
                              : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                          )}
                        >
                          {addingToCart === item.id ? (
                            <>
                              <Loader2 className='h-4 w-4 animate-spin' />
                              Adding...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className='h-4 w-4' />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      <div className='text-sm text-gray-500 dark:text-gray-400'>
        Showing {filteredItems.length} of {mockItems.length} items
      </div>
    </div>
  );
}
