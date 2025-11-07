'use client';

import { Eye, Loader2, Plus, Search, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components';
import { useCart } from '@/contexts/CartContext';
import type { Item } from '@/domain/entities';

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
    <TooltipProvider>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold text-foreground'>Catalog</h1>
          <p className='mt-2 text-muted-foreground'>
            Browse and search items from the procurement catalog
          </p>
        </div>

        {/* Search and Actions Bar */}
        <div className='flex flex-col sm:flex-row gap-4'>
          {/* Search */}
          <div className='flex-1 relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Search className='h-5 w-5 text-muted-foreground' />
            </div>
            <Input
              type='text'
              placeholder='Search items by name, description, or category...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>

          {/* Register Button */}
          <Button
            onClick={() => setShowRegisterForm(!showRegisterForm)}
            className='flex items-center gap-2'
          >
            <Plus className='h-4 w-4' />
            Register New Item
          </Button>
        </div>

        {/* Register Form */}
        {showRegisterForm && (
          <Card>
            <CardHeader>
              <CardTitle>Register New Item</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                id='register-item-form'
                onSubmit={handleRegisterItem}
                className='space-y-4'
              >
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='item-name' className='mb-1'>
                      Item Name *
                    </Label>
                    <Input
                      id='item-name'
                      type='text'
                      required
                      value={newItem.name}
                      onChange={(e) =>
                        setNewItem({ ...newItem, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='item-category' className='mb-1'>
                      Category *
                    </Label>
                    <Input
                      id='item-category'
                      type='text'
                      required
                      value={newItem.category}
                      onChange={(e) =>
                        setNewItem({ ...newItem, category: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor='item-description' className='mb-1'>
                    Description *
                  </Label>
                  <Textarea
                    id='item-description'
                    required
                    rows={3}
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='item-price' className='mb-1'>
                    Price (USD) *
                  </Label>
                  <Input
                    id='item-price'
                    type='number'
                    required
                    min='0'
                    step='0.01'
                    value={newItem.price}
                    onChange={(e) =>
                      setNewItem({ ...newItem, price: e.target.value })
                    }
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className='gap-2'>
              <Button
                type='submit'
                form='register-item-form'
                disabled={isRegistering}
              >
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
            </CardFooter>
          </Card>
        )}

        {/* Items Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className='text-center text-muted-foreground h-24'
                  >
                    No items found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className='font-medium'>{item.name}</TableCell>
                    <TableCell>
                      <Badge variant='secondary'>{item.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className='max-w-xs truncate text-muted-foreground'>
                        {item.description}
                      </div>
                    </TableCell>
                    <TableCell className='font-medium'>
                      ${item.price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/catalog/${item.id}`}>
                              <Button size='sm' variant='secondary'>
                                <Eye className='h-4 w-4' />
                                Details
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View item details and specifications</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size='sm'
                              onClick={() => handleAddToCart(item)}
                              disabled={addingToCart === item.id}
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
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Add item to your shopping cart</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Results Summary */}
        <div className='text-sm text-muted-foreground'>
          Showing {filteredItems.length} of {mockItems.length} items
        </div>
      </div>
    </TooltipProvider>
  );
}
