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
  return {
    itemId: item.itemId?.toString() || '',
    itemName: item.name,
    itemPrice: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.subtotal || item.unitPrice * item.quantity,
    addedAt: item.addedAt,
  };
}

/**
 * Maps a CartDocument from Mongoose to a Cart domain entity
 */
export function mapCartToEntity(cart: CartDocument): Cart {
  const items = cart.items.map(mapCartItemToEntity);
  const totalCost = items.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    id: cart._id.toString(),
    userId: cart.userId.toString(),
    items,
    totalCost,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}
