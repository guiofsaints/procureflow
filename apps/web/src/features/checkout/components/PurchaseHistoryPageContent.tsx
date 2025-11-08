/**
 * Purchase History Page Content
 *
 * Displays a list of all purchase requests for the authenticated user
 */

'use client';

import { CheckCircle2, Clock, FileText, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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

export function PurchaseHistoryPageContent() {
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<PurchaseRequestStatus | 'all'>('all');

  const loadPurchaseRequests = async () => {
    setIsLoading(true);

    try {
      const url =
        filter === 'all'
          ? '/api/purchase-requests'
          : `/api/purchase-requests?status=${filter}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to load purchase requests');
      }

      const data = await response.json();
      setPurchaseRequests(data.data || []);
    } catch (error) {
      console.error('Error loading purchase requests:', error);
      toast.error('Failed to load purchase history', {
        description:
          error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPurchaseRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='container mx-auto py-8'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-2xl font-bold'>
                Purchase History
              </CardTitle>
              <CardDescription>
                View and manage your purchase requests
              </CardDescription>
            </div>
            <div className='flex gap-2'>
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={
                  filter === PurchaseRequestStatus.Submitted
                    ? 'default'
                    : 'outline'
                }
                size='sm'
                onClick={() => setFilter(PurchaseRequestStatus.Submitted)}
              >
                Submitted
              </Button>
              <Button
                variant={
                  filter === PurchaseRequestStatus.Approved
                    ? 'default'
                    : 'outline'
                }
                size='sm'
                onClick={() => setFilter(PurchaseRequestStatus.Approved)}
              >
                Approved
              </Button>
              <Button
                variant={
                  filter === PurchaseRequestStatus.Rejected
                    ? 'default'
                    : 'outline'
                }
                size='sm'
                onClick={() => setFilter(PurchaseRequestStatus.Rejected)}
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : purchaseRequests.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <FileText className='h-12 w-12 text-muted-foreground' />
              <p className='mt-4 text-center text-muted-foreground'>
                {filter === 'all'
                  ? 'No purchase requests found. Start shopping to create your first request!'
                  : `No ${filter} purchase requests found.`}
              </p>
              <Button asChild className='mt-4' variant='outline'>
                <Link href='/catalog'>Browse Catalog</Link>
              </Button>
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className='font-mono text-sm'>
                        {request.id.slice(-8)}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {formatDate(request.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span className='text-sm text-muted-foreground'>
                          {request.items.length} item
                          {request.items.length !== 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell className='font-semibold'>
                        ${request.totalCost.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className='text-right'>
                        <Button asChild variant='ghost' size='sm'>
                          <Link href={`/purchase-requests/${request.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
