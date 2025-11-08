import { cn } from '@/lib/utils';

type MainProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
};

export function Main({ className, fixed, children, ...props }: MainProps) {
  return (
    <main
      id='main-content'
      data-layout={fixed ? 'fixed' : 'scroll'}
      className={cn(
        'flex flex-1 flex-col overflow-auto',
        fixed && '@lg/content:overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}
