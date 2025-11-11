/**
 * AgentPurchaseRequestCard Component
 *
 * Displays purchase request details after successful checkout.
 * Shows summary with link to full details page.
 */

'use client';

import { Check, ExternalLink, Package } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { AgentPurchaseRequest } from '../types';

interface AgentPurchaseRequestCardProps {
  purchaseRequest: AgentPurchaseRequest;
}

export function AgentPurchaseRequestCard({
  purchaseRequest,
}: AgentPurchaseRequestCardProps) {
  // Fallback for missing id
  const requestId = purchaseRequest.id || 'N/A';
  const displayId =
    requestId !== 'N/A' && requestId.length > 12
      ? `${requestId.slice(0, 12)}...`
      : requestId;

  // Validate items array to prevent undefined errors
  const items = Array.isArray(purchaseRequest.items) ? purchaseRequest.items : [];

  return (
    <Card className='border-green-200 dark:border-green-900 py-6 '>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-green-600 dark:text-green-500'>
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
            <Check className='h-5 w-5' />
          </div>
          Purchase Request Created
        </CardTitle>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Request Summary */}
        <div className='rounded-lg border bg-muted/50 p-3'>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Request ID:</span>
              <span className='font-mono font-medium text-xs'>{displayId}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Status:</span>
              <span className='inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200'>
                {purchaseRequest.status}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Total Items:</span>
              <span className='font-medium'>
                {items.length} type(s)
              </span>
            </div>
            <div className='flex justify-between border-t pt-2 mt-2'>
              <span className='font-semibold'>Total:</span>
              <span className='text-lg font-bold'>
                ${purchaseRequest.totalCost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Items Preview */}
        <div className='rounded-lg border'>
          <div className='border-b bg-muted/30 px-3 py-2'>
            <div className='flex items-center gap-2 text-sm font-semibold'>
              <Package className='h-4 w-4' />
              Order Items
            </div>
          </div>
          <div className='divide-y max-h-[200px] overflow-y-auto'>
            {items.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className='flex items-center justify-between px-3 py-2'
              >
                <div className='flex-1 min-w-0 space-y-0.5'>
                  <div className='font-medium text-sm truncate'>
                    {item.itemName}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {item.itemCategory} • Qty: {item.quantity}
                  </div>
                </div>
                <div className='ml-3 font-semibold text-sm whitespace-nowrap'>
                  ${item.subtotal.toFixed(2)}
                </div>
              </div>
            ))}
            {items.length > 3 && (
              <div className='px-3 py-2 text-center text-xs text-muted-foreground'>
                + {items.length - 3} more item(s)
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button
          asChild
          className='w-full'
          size='sm'
          disabled={!requestId || requestId === 'N/A'}
        >
          <Link href={`/purchase/${requestId}`}>
            <ExternalLink className='mr-2 h-4 w-4' />
            View Full Request Details
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
