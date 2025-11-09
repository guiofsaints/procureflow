import { Metadata } from 'next';

import { PurchaseHistoryPageContent } from '@/features/checkout/components/PurchaseHistoryPageContent';

export const metadata: Metadata = {
  title: 'Purchase History | ProcureFlow',
  description: 'View your purchase request history',
};

export default function PurchaseHistoryPage() {
  return (
    <div className='container mx-auto p-6 max-w-7xl'>
      <PurchaseHistoryPageContent />
    </div>
  );
}
