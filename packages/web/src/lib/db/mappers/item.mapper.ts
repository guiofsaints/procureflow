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
 * Maps an ItemDocument from Mongoose to an Item domain entity
 */
export function mapItemToEntity(doc: ItemDocument): Item {
  return {
    id: doc._id.toString(),
    name: doc.name,
    category: doc.category,
    description: doc.description,
    estimatedPrice: doc.estimatedPrice,
    unit: doc.unit,
    status: doc.status || ItemStatus.Active,
    preferredSupplier: doc.preferredSupplier,
    createdByUserId: doc.createdByUserId?.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
