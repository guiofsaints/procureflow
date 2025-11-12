import { CatalogPageContent } from '@/features/catalog/components/CatalogPageContent';

/**
 * Catalog page - Server Component
 * Displays the catalog feature UI
 */
export default function CatalogPage() {
  return (
    <div className='container mx-auto max-w-7xl'>
      <div className='p-3 sm:p-4 md:p-6 lg:p-8'>
        <CatalogPageContent />
      </div>
    </div>
  );
}
