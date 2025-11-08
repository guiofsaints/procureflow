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
  return <PurchaseRequestDetailPageContent params={params} />;
}
