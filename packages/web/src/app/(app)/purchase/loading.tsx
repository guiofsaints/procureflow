import { Skeleton } from '@/components/ui/skeleton';

export default function PurchaseLoading() {
  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-10 w-32' />
      </div>

      <div className='flex gap-4'>
        {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
          <Skeleton key={status} className='h-10 w-24' />
        ))}
      </div>

      <div className='rounded-lg border'>
        <div className='p-4 border-b'>
          <Skeleton className='h-5 w-full' />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className='p-4 border-b last:border-b-0 space-y-2'>
            <div className='flex justify-between items-start'>
              <div className='space-y-2'>
                <Skeleton className='h-5 w-32' />
                <Skeleton className='h-4 w-48' />
              </div>
              <Skeleton className='h-6 w-20' />
            </div>
            <Skeleton className='h-4 w-24' />
          </div>
        ))}
      </div>
    </div>
  );
}
