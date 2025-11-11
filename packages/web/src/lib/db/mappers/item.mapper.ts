/**
 * Item Mapper
 *
 * Converts Mongoose documents to domain entities for catalog items.
 * Eliminates code duplication across services.
 */

import type { ItemDocument } from '@/domain/documents';
import { ItemStatus } from '@/domain/entities';
import type { Item } from '@/domain/entities';

/**
 * Map database status to domain ItemStatus enum
 * ItemDocument.status is already an ItemStatus enum, but we handle it safely
 */
function mapStatusFromDb(status: ItemStatus): ItemStatus {
  // Status is already correctly typed, just return it
  return status || ItemStatus.Active;
}

/**
 * Maps an ItemDocument from Mongoose to an Item domain entity
 */
export function mapItemToEntity(doc: ItemDocument): Item {
  return {
    id: doc._id.toString(),
    name: doc.name,
    category: doc.category,
    description: doc.description,
    price: doc.price,
    unit: doc.unit,
    status: mapStatusFromDb(doc.status),
    preferredSupplier: doc.preferredSupplier,
    registeredBy: doc.registeredBy?.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
