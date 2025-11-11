/**
 * Purchase Request Mapper
 *
 * Converts Mongoose documents to domain entities for purchase requests.
 * Eliminates code duplication across services.
 */

import type {
  PurchaseRequestDocument,
  PurchaseRequestItemDocument,
} from '@/domain/documents';
import { PurchaseRequestStatus } from '@/domain/entities';
import type { PurchaseRequest, PurchaseRequestItem } from '@/domain/entities';

/**
 * Maps a PurchaseRequestItemDocument from Mongoose to a PurchaseRequestItem domain entity
 */
export function mapPurchaseRequestItemToEntity(
  item: PurchaseRequestItemDocument
): PurchaseRequestItem {
  return {
    itemId: item.itemId?.toString() || '',
    itemName: item.name,
    itemCategory: item.category,
    itemDescription: item.description,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.subtotal,
  };
}

/**
 * Maps a PurchaseRequestDocument from Mongoose to a PurchaseRequest domain entity
 */
export function mapPurchaseRequestToEntity(
  request: PurchaseRequestDocument
): PurchaseRequest {
  return {
    id: request._id.toString(),
    userId: request.userId.toString(),
    requestNumber: request.requestNumber,
    items: request.items.map(mapPurchaseRequestItemToEntity),
    totalCost: request.total,
    notes: request.notes || '',
    source: request.source,
    status: request.status as PurchaseRequestStatus,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}
