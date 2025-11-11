/**
 * Purchase Request Detail Page Content
 *
 * Displays detailed information about a specific purchase request
 */

'use client';

import { ArrowLeft, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PurchaseRequest } from '@/domain/entities';
import { PurchaseRequestStatus } from '@/domain/entities';

interface PurchaseRequestDetailPageContentProps {
  params: Promise<{ id: string }>;
}

export function PurchaseRequestDetailPageContent({
  params,
}: PurchaseRequestDetailPageContentProps) {
  const { id } = use(params);
  const [purchaseRequest, setPurchaseRequest] =
    useState<PurchaseRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadPurchaseRequest = useCallback(async () => {
    setIsLoading(true);
    setNotFound(false);

    try {
      const response = await fetch(`/api/purchase/${id}`);

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load purchase request');
      }

      const data = await response.json();
      setPurchaseRequest(data.data);
    } catch (error) {
      console.error('Error loading purchase request:', error);
      toast.error('Failed to load purchase request', {
        description:
          error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPurchaseRequest();
  }, [loadPurchaseRequest]);

  const getStatusBadge = (status: PurchaseRequestStatus) => {
    switch (status) {
      case PurchaseRequestStatus.Submitted:
        return (
          <Badge variant='default' className='flex items-center gap-1'>
            <Clock className='h-3 w-3' />
            Submitted
          </Badge>
        );
      case PurchaseRequestStatus.Approved:
        return (
          <Badge
            variant='default'
            className='flex items-center gap-1 bg-green-500'
          >
            <CheckCircle2 className='h-3 w-3' />
            Approved
          </Badge>
        );
      case PurchaseRequestStatus.Rejected:
        return (
          <Badge variant='destructive' className='flex items-center gap-1'>
            <XCircle className='h-3 w-3' />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant='secondary'>{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className='container mx-auto flex min-h-[400px] items-center justify-center py-8'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (notFound || !purchaseRequest) {
    return (
      <div className='container mx-auto py-8'>
        <Card className='py-8'>
          <CardHeader>
            <CardTitle>Purchase Request Not Found</CardTitle>
            <CardDescription>
              The requested purchase request could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant='outline'>
              <Link href='/purchase'>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to Purchase History
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8'>
      {/* Header with Back Button */}
      <div className='mb-6'>
        <Button asChild variant='ghost' size='sm'>
          <Link href='/purchase'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Purchase History
          </Link>
        </Button>
      </div>

      {/* Main Card */}
      <Card className='py-8'>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div>
              <CardTitle className='text-2xl font-bold'>
                Purchase Request
              </CardTitle>
              <CardDescription className='mt-1'>
                ID: <span className='font-mono'>{purchaseRequest.id}</span>
              </CardDescription>
            </div>
            {getStatusBadge(purchaseRequest.status)}
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Summary Information */}
          <div className='grid gap-4 md:grid-cols-2'>
            <div>
              <h3 className='text-sm font-medium text-muted-foreground'>
                Created On
              </h3>
              <p className='mt-1 text-sm'>
                {formatDate(purchaseRequest.createdAt)}
              </p>
            </div>
            <div>
              <h3 className='text-sm font-medium text-muted-foreground'>
                Last Updated
              </h3>
              <p className='mt-1 text-sm'>
                {formatDate(purchaseRequest.updatedAt)}
              </p>
            </div>
          </div>

          {/* Notes (if any) */}
          {purchaseRequest.notes && (
            <>
              <Separator />
              <div>
                <h3 className='text-sm font-medium text-muted-foreground'>
                  Notes / Justification
                </h3>
                <p className='mt-2 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm'>
                  {purchaseRequest.notes}
                </p>
              </div>
            </>
          )}

          {/* Items Table */}
          <Separator />
          <div>
            <h3 className='mb-4 text-lg font-semibold'>Items</h3>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className='text-right'>Unit Price</TableHead>
                    <TableHead className='text-right'>Quantity</TableHead>
                    <TableHead className='text-right'>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseRequest.items.map((item) => (
                    <TableRow key={item.itemId || item.itemName}>
                      <TableCell>
                        <div>
                          <p className='font-medium'>{item.itemName}</p>
                          {item.itemDescription && (
                            <p className='text-xs text-muted-foreground'>
                              {item.itemDescription}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>{item.itemCategory}</Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        ${item.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className='text-right'>
                        {item.quantity}
                      </TableCell>
                      <TableCell className='text-right font-semibold'>
                        ${item.subtotal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow>
                    <TableCell colSpan={4} className='text-right font-bold'>
                      Total
                    </TableCell>
                    <TableCell className='text-right text-lg font-bold'>
                      ${purchaseRequest.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
