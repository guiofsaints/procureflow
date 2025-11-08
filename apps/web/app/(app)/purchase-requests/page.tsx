import { Metadata } from 'next';

import { PurchaseHistoryPageContent } from '@/features/checkout/components/PurchaseHistoryPageContent';

export const metadata: Metadata = {
  title: 'Purchase History | ProcureFlow',
  description: 'View your purchase request history',
};

export default function PurchaseHistoryPage() {
  return <PurchaseHistoryPageContent />;
}
