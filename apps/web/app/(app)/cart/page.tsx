import { CartPageContent } from '@/features/cart/components/CartPageContent';

/**
 * Cart page - Server Component
 * Displays the cart feature UI
 */
export default function CartPage() {
  return (
    <div className='container mx-auto p-6 max-w-7xl'>
      <CartPageContent />
    </div>
  );
}
