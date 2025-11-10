'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from '@/components';
import type { Item } from '@/domain/entities';

type ItemMutateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow?: Item;
  onSuccess?: () => void;
};

// Schema matching backend validations from item.schema.ts
const formSchema = z.object({
  name: z
    .string()
    .min(2, 'Item name must be at least 2 characters')
    .max(200, 'Item name must not exceed 200 characters')
    .trim(),
  category: z
    .string()
    .min(2, 'Category must be at least 2 characters')
    .max(100, 'Category must not exceed 100 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters')
    .trim(),
  estimatedPrice: z
    .string()
    .min(1, 'Price is required')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0.01;
      },
      { message: 'Price must be greater than 0' }
    )
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num <= 1000000;
      },
      { message: 'Price must not exceed 1,000,000' }
    )
    .refine(
      (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) {
          return false;
        }
        // Check if has at most 2 decimal places
        return /^\d+(\.\d{1,2})?$/.test(num.toFixed(2));
      },
      { message: 'Price must have at most 2 decimal places' }
    ),
  unit: z.string().max(50, 'Unit must not exceed 50 characters').optional(),
});

type ItemForm = z.infer<typeof formSchema>;

export function ItemMutateDialog({
  open,
  onOpenChange,
  currentRow,
  onSuccess,
}: ItemMutateDialogProps) {
  const isUpdate = !!currentRow;

  const form = useForm<ItemForm>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow
      ? {
          name: currentRow.name,
          category: currentRow.category,
          description: currentRow.description,
          estimatedPrice: currentRow.price.toString(),
          unit: 'each',
        }
      : {
          name: '',
          category: '',
          description: '',
          estimatedPrice: '',
          unit: 'each',
        },
  });

  // Update form when currentRow changes
  useEffect(() => {
    if (currentRow) {
      form.reset({
        name: currentRow.name,
        category: currentRow.category,
        description: currentRow.description,
        estimatedPrice: currentRow.price.toString(),
        unit: 'each',
      });
    }
  }, [currentRow, form]);

  const onSubmit = async (data: ItemForm) => {
    try {
      if (isUpdate) {
        // TODO: Implement PUT /api/items/{id} when endpoint is ready
        toast.error('Update not implemented', {
          description: 'Item update endpoint is not yet available.',
        });
        return;
      }

      // Create new item
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          description: data.description,
          estimatedPrice: parseFloat(data.estimatedPrice),
          unit: data.unit || 'each',
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          // Duplicate item detected
          const errorData = await response.json();
          toast.error('Duplicate item detected', {
            description:
              errorData.duplicates && errorData.duplicates.length > 0
                ? `Similar item found: "${errorData.duplicates[0].name}"`
                : 'A similar item already exists in the catalog.',
          });
          return;
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      onOpenChange(false);
      form.reset();

      toast.success('Item created!', {
        description: `${data.name} has been added to the catalog.`,
      });

      // Trigger catalog refresh
      onSuccess?.();
    } catch (_error) {
      toast.error('Error', {
        description: 'Failed to create item. Please try again.',
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          form.reset();
        }
      }}
    >
      <DialogContent className='max-w-2xl max-h-[90vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>{isUpdate ? 'Update' : 'Create'} Item</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? 'Update the item by providing necessary info.'
              : 'Add a new item by providing necessary info.'}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id='item-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-4 overflow-y-auto px-1'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Enter item name' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='category'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Enter category' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder='Enter description'
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='estimatedPrice'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (USD)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      step='0.01'
                      min='0.01'
                      max='1000000'
                      placeholder='0.00'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='unit'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='each' maxLength={50} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter className='gap-2 sm:gap-0'>
          <DialogClose asChild>
            <Button variant='outline'>Close</Button>
          </DialogClose>
          <Button
            form='item-form'
            type='submit'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
