import { Skeleton } from '@/components/ui/skeleton';

export default function AgentLoading() {
  return (
    <div className='container mx-auto p-6 h-[calc(100vh-12rem)] flex flex-col'>
      <div className='flex-1 space-y-4 overflow-hidden'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-64' />
        </div>

        <div className='flex-1 space-y-4 p-4 border rounded-lg'>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <div className='max-w-[80%] space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-24 w-full' />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='mt-4 space-y-2'>
        <Skeleton className='h-20 w-full' />
        <div className='flex justify-between'>
          <Skeleton className='h-10 w-24' />
          <Skeleton className='h-10 w-24' />
        </div>
      </div>
    </div>
  );
}
