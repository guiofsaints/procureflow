import { Metadata } from 'next';

import { PurchaseRequestDetailPageContent } from '@/features/checkout/components/PurchaseRequestDetailPageContent';

export const metadata: Metadata = {
  title: 'Purchase Request Details | ProcureFlow',
  description: 'View purchase request details',
};

export default function PurchaseRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className='container mx-auto p-6 max-w-7xl'>
      <PurchaseRequestDetailPageContent params={params} />
    </div>
  );
}
