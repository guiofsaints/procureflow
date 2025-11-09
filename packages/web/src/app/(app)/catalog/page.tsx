import { CatalogPageContent } from '@/features/catalog/components/CatalogPageContent';

/**
 * Catalog page - Server Component
 * Displays the catalog feature UI
 */
export default function CatalogPage() {
  return (
    <div className='container mx-auto p-6 max-w-7xl'>
      <CatalogPageContent />
    </div>
  );
}
