export function SkipToMain() {
  return (
    <a
      href='#main-content'
      className='sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:p-4 focus:bg-background focus:text-foreground focus:border focus:border-border focus:rounded-lg focus:shadow-lg'
    >
      Skip to main content
    </a>
  );
}
