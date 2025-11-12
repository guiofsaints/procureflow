import { Metadata } from 'next';

import { PurchaseHistoryPageContent } from '@/features/checkout/components/PurchaseHistoryPageContent';

export const metadata: Metadata = {
  title: 'Purchase History | ProcureFlow',
  description: 'View your purchase request history',
};

export default function PurchaseHistoryPage() {
  return (
    <div className='container mx-auto max-w-7xl'>
      <div className='p-3 sm:p-4 md:p-6 lg:p-8'>
        <PurchaseHistoryPageContent />
      </div>
    </div>
  );
}
