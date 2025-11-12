import { CartPageContent } from '@/features/cart/components/CartPageContent';

/**
 * Cart page - Server Component
 * Displays the cart feature UI
 */
export default function CartPage() {
  return (
    <div className='container mx-auto max-w-7xl'>
      <div className='p-3 sm:p-4 md:p-6 lg:p-8'>
        <CartPageContent />
      </div>
    </div>
  );
}
