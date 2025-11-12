'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useMemo, useState } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { cn } from '@/lib/utils';

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
};

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0);
  const pathname = usePathname();
  const { dynamicLabels } = useBreadcrumb();

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop);
    };

    // Add scroll listener to the document
    document.addEventListener('scroll', onScroll, { passive: true });

    // Clean up the event listener on unmount
    return () => document.removeEventListener('scroll', onScroll);
  }, []);

  // Generate breadcrumb items from pathname using useMemo (React 19 best practice)
  const breadcrumbs = useMemo(() => {
    const paths = pathname.split('/').filter(Boolean);

    if (paths.length === 0) {
      return [{ label: 'Home', href: '/' }];
    }

    // Custom label mappings for specific routes
    const labelMap: Record<string, string> = {
      purchase: 'Purchase Requests',
    };

    const breadcrumbs = paths.map((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');

      // Check if there's a dynamic label for this path
      const dynamicLabel = dynamicLabels[href];
      // Check if there's a custom label mapping
      const customLabel = labelMap[path];
      const label =
        dynamicLabel ||
        customLabel ||
        path.charAt(0).toUpperCase() + path.slice(1);

      return { label, href };
    });

    return breadcrumbs;
  }, [pathname, dynamicLabels]);

  // Handle breadcrumb click - reset agent state when clicking on /agent breadcrumb
  const handleBreadcrumbClick = (href: string) => {
    if (href === '/agent') {
      // Dispatch custom event to reset agent conversation state
      window.dispatchEvent(new CustomEvent('resetAgentConversation'));
    }
  };

  return (
    <header
      className={cn(
        'z-50 h-12 sm:h-14 md:h-16',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit] safe-top',
        offset > 10 && fixed ? 'shadow' : 'shadow-none',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'relative flex h-full items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 md:px-4',
          offset > 10 &&
            fixed &&
            'after:bg-background/20 after:absolute after:inset-0 after:-z-10 after:backdrop-blur-lg'
        )}
      >
        <SidebarTrigger variant='outline' className='h-9 w-9 sm:h-10 sm:w-10' />
        <Separator orientation='vertical' className='h-6' />
        <Breadcrumb className='hidden min-[480px]:flex'>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const isLoading = crumb.label === '...';

              return (
                <Fragment key={crumb.href}>
                  <BreadcrumbItem>
                    {!isLast ? (
                      <BreadcrumbLink asChild>
                        <Link
                          href={crumb.href}
                          onClick={() => handleBreadcrumbClick(crumb.href)}
                        >
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                    ) : isLoading ? (
                      <Skeleton className='h-5 w-32' />
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        {children}
      </div>
    </header>
  );
}
