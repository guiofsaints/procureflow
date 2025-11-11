import { Skeleton } from '@/components/ui/skeleton';

export default function CatalogLoading() {
  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-4 w-96' />
      </div>

      <div className='flex gap-4'>
        <Skeleton className='h-10 w-32' />
        <Skeleton className='h-10 w-32' />
        <Skeleton className='h-10 flex-1' />
      </div>

      <div className='rounded-md border'>
        <div className='p-4 space-y-3'>
          {[...Array(8)].map((_, i) => (
            <div key={i} className='flex items-center gap-4'>
              <Skeleton className='h-12 w-12 rounded' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/2' />
              </div>
              <Skeleton className='h-8 w-24' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
