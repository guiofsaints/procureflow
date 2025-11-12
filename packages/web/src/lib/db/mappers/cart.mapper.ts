/**
 * Cart Mapper
 *
 * Converts Mongoose documents to domain entities for cart operations.
 * Eliminates code duplication across services.
 */

import type { CartDocument, CartItemDocument } from '@/domain/documents';
import type { Cart, CartItem } from '@/domain/entities';

/**
 * Maps a CartItemDocument from Mongoose to a CartItem domain entity
 */
export function mapCartItemToEntity(item: CartItemDocument): CartItem {
  // Debug log to see what data we're receiving
  if (!item.name || item.unitPrice === undefined) {
    console.warn('[mapCartItemToEntity] Missing cart item data:', {
      itemId: item.itemId?.toString(),
      name: item.name,
      unitPrice: item.unitPrice,
      hasName: !!item.name,
      hasPrice: item.unitPrice !== undefined,
      rawItem: item,
    });
  }

  return {
    itemId: item.itemId?.toString() || '',
    name: item.name || 'Unknown Item',
    unitPrice: item.unitPrice || 0,
    quantity: item.quantity || 1,
    subtotal: item.subtotal || (item.unitPrice || 0) * (item.quantity || 1),
    addedAt: item.addedAt || new Date(),
  };
}

/**
 * Maps a CartDocument from Mongoose to a Cart domain entity
 */
export function mapCartToEntity(cart: CartDocument): Cart {
  const items = cart.items.map(mapCartItemToEntity);
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    id: cart._id.toString(),
    userId: cart.userId.toString(),
    items,
    totalCost: total,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}
