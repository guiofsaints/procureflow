import type { ColumnDef, Row } from '@tanstack/react-table';
import { Eye, MoreHorizontal, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components';
import type { Item } from '@/domain/entities';

import { useCatalog } from './catalog-provider';

export const catalogColumns: ColumnDef<Item>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div className='font-medium'>{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => (
      <Badge variant='secondary'>{row.getValue('category')}</Badge>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <div className='max-w-xs truncate text-muted-foreground'>
        {row.getValue('description')}
      </div>
    ),
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(price);

      return <div className='font-medium'>{formatted}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CatalogRowActions row={row} />,
  },
];

function CatalogRowActions({ row }: { row: Row<Item> }) {
  const item = row.original;
  const { setOpen, setCurrentRow, handleAddToCart, addingToCart } =
    useCatalog();

  return (
    <div className='flex items-center gap-2'>
      <Link href={`/catalog/${item.id}`}>
        <Button size='sm' variant='secondary'>
          <Eye className='h-4 w-4' />
        </Button>
      </Link>

      <Button
        size='sm'
        onClick={() => handleAddToCart(item)}
        disabled={addingToCart === item.id}
        className='w-20'
      >
        {addingToCart === item.id ? (
          <ShoppingCart className='h-4 w-4 animate-pulse' />
        ) : (
          <>
            <ShoppingCart className='h-4 w-4' />
            <span className='ml-1'>Add</span>
          </>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(item);
              setOpen('update');
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(item);
              setOpen('delete');
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
