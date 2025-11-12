import { cn } from '@/lib/utils';

import { Skeleton } from './skeleton';

/**
 * Skeleton Composition Library
 * Reusable skeleton loading patterns for consistent UX
 */

// 1. SkeletonText - For text content
interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

export function SkeletonText({
  lines = 3,
  className,
  lastLineWidth = '75%',
}: SkeletonTextProps) {
  return (
    <div
      className={cn('space-y-2', className)}
      aria-busy='true'
      aria-label='Loading content'
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? `w-[${lastLineWidth}]` : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

// 2. SkeletonAvatar - For user avatars
interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const avatarSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

export function SkeletonAvatar({
  size = 'md',
  className,
}: SkeletonAvatarProps) {
  return (
    <Skeleton
      className={cn('rounded-full', avatarSizes[size], className)}
      aria-label='Loading avatar'
    />
  );
}

// 3. SkeletonCard - For card content
interface SkeletonCardProps {
  hasImage?: boolean;
  imageHeight?: string;
  className?: string;
}

export function SkeletonCard({
  hasImage = false,
  imageHeight = 'h-48',
  className,
}: SkeletonCardProps) {
  return (
    <div
      className={cn('space-y-3', className)}
      aria-busy='true'
      aria-label='Loading card'
    >
      {hasImage && (
        <Skeleton className={cn('w-full rounded-lg', imageHeight)} />
      )}
      <div className='space-y-2'>
        <Skeleton className='h-6 w-3/4' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-5/6' />
      </div>
      <div className='flex gap-2'>
        <Skeleton className='h-9 w-20' />
        <Skeleton className='h-9 w-24' />
      </div>
    </div>
  );
}

// 4. SkeletonTable - For data tables
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: SkeletonTableProps) {
  return (
    <div
      className={cn('space-y-3', className)}
      aria-busy='true'
      aria-label='Loading table'
    >
      {/* Header */}
      <div className='flex gap-4 pb-3 border-b'>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className='h-5 flex-1' />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={`row-${rowIdx}`} className='flex gap-4 py-2'>
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={`cell-${rowIdx}-${colIdx}`} className='h-6 flex-1' />
          ))}
        </div>
      ))}
    </div>
  );
}

// 5. SkeletonList - For list items
interface SkeletonListProps {
  items?: number;
  hasAvatar?: boolean;
  hasAction?: boolean;
  className?: string;
}

export function SkeletonList({
  items = 5,
  hasAvatar = false,
  hasAction = false,
  className,
}: SkeletonListProps) {
  return (
    <div
      className={cn('space-y-4', className)}
      aria-busy='true'
      aria-label='Loading list'
    >
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className='flex items-center gap-3'>
          {hasAvatar && <SkeletonAvatar size='md' />}
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-5 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
          </div>
          {hasAction && <Skeleton className='h-9 w-20' />}
        </div>
      ))}
    </div>
  );
}

// 6. SkeletonButton - For button placeholders
interface SkeletonButtonProps {
  variant?: 'default' | 'icon';
  className?: string;
}

export function SkeletonButton({
  variant = 'default',
  className,
}: SkeletonButtonProps) {
  return (
    <Skeleton
      className={cn(
        variant === 'icon' ? 'h-10 w-10 rounded-md' : 'h-10 w-24 rounded-md',
        className
      )}
      aria-label='Loading button'
    />
  );
}

// 7. SkeletonForm - For form fields
interface SkeletonFormProps {
  fields?: number;
  className?: string;
}

export function SkeletonForm({ fields = 3, className }: SkeletonFormProps) {
  return (
    <div
      className={cn('space-y-6', className)}
      aria-busy='true'
      aria-label='Loading form'
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className='space-y-2'>
          <Skeleton className='h-5 w-32' /> {/* Label */}
          <Skeleton className='h-10 w-full rounded-md' /> {/* Input */}
        </div>
      ))}
      <Skeleton className='h-10 w-32 rounded-md' /> {/* Submit button */}
    </div>
  );
}

// 8. SkeletonProductDetail - Specific for product pages
export function SkeletonProductDetail({ className }: { className?: string }) {
  return (
    <div
      className={cn('space-y-6', className)}
      aria-busy='true'
      aria-label='Loading product'
    >
      <div className='flex flex-col md:flex-row gap-6'>
        {/* Image */}
        <Skeleton className='w-full md:w-1/3 h-64 rounded-lg' />

        {/* Info */}
        <div className='flex-1 space-y-4'>
          <Skeleton className='h-8 w-3/4' /> {/* Title */}
          <Skeleton className='h-6 w-24' /> {/* Price */}
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-2/3' />
          </div>
          <div className='flex gap-3'>
            <Skeleton className='h-11 w-32' />
            <Skeleton className='h-11 w-32' />
          </div>
        </div>
      </div>

      {/* Details section */}
      <div className='space-y-3'>
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-3/4' />
      </div>
    </div>
  );
}

// 9. SkeletonPurchaseRequest - Specific for purchase request pages
export function SkeletonPurchaseRequest({ className }: { className?: string }) {
  return (
    <div
      className={cn('space-y-6', className)}
      aria-busy='true'
      aria-label='Loading purchase request'
    >
      {/* Header */}
      <div className='flex items-center justify-between'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-10 w-32 rounded-full' /> {/* Status badge */}
      </div>

      {/* Metadata */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='space-y-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-6 w-40' />
          </div>
        ))}
      </div>

      {/* Items table */}
      <SkeletonTable rows={3} columns={4} />

      {/* Total */}
      <div className='flex justify-end'>
        <Skeleton className='h-8 w-48' />
      </div>
    </div>
  );
}
