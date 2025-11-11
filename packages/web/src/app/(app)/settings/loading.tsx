import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className='container mx-auto p-6 max-w-4xl'>
      <div className='space-y-6'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-32' />
          <Skeleton className='h-4 w-64' />
        </div>

        <div className='space-y-6'>
          <div className='space-y-4 rounded-lg border p-6'>
            <Skeleton className='h-6 w-40' />
            <div className='space-y-4'>
              {[...Array(3)].map((_, i) => (
                <div key={i} className='space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-10 w-full' />
                </div>
              ))}
            </div>
          </div>

          <div className='space-y-4 rounded-lg border p-6'>
            <Skeleton className='h-6 w-40' />
            <div className='space-y-4'>
              {[...Array(2)].map((_, i) => (
                <div key={i} className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <Skeleton className='h-4 w-48' />
                    <Skeleton className='h-3 w-64' />
                  </div>
                  <Skeleton className='h-6 w-12' />
                </div>
              ))}
            </div>
          </div>

          <div className='flex justify-end gap-4'>
            <Skeleton className='h-10 w-24' />
            <Skeleton className='h-10 w-24' />
          </div>
        </div>
      </div>
    </div>
  );
}
