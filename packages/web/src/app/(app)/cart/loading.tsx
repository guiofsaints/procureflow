import { Skeleton } from '@/components/ui/skeleton';

export default function CartLoading() {
  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-32' />
        <Skeleton className='h-4 w-64' />
      </div>

      <div className='grid gap-6 md:grid-cols-3'>
        <div className='md:col-span-2 space-y-4'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='rounded-lg border p-4 space-y-3'>
              <div className='flex justify-between'>
                <Skeleton className='h-5 w-48' />
                <Skeleton className='h-5 w-16' />
              </div>
              <div className='flex gap-4'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-24' />
              </div>
            </div>
          ))}
        </div>

        <div className='rounded-lg border p-6 space-y-4'>
          <Skeleton className='h-6 w-32' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-6 w-full' />
          </div>
          <Skeleton className='h-10 w-full' />
        </div>
      </div>
    </div>
  );
}
