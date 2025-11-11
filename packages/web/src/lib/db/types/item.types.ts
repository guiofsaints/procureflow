/**
 * TypeScript types for Item (CatalogItem) Mongoose documents
 *
 * These interfaces provide full type safety for Mongoose documents,
 * eliminating the need for `any` types in service layer functions.
 */

import { Document, Types } from 'mongoose';

import { ItemStatus } from '../schemas/item.schema';

/**
 * Item document interface
 * Extends Mongoose Document to include all schema fields with proper types
 */
export interface ItemDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  category: string;
  description: string;
  unitPrice: number;
  unitOfMeasure: string;
  minOrderQuantity: number;
  status: ItemStatus;
  registeredBy?: Types.ObjectId | null; // Optional: user who registered this item
  createdAt: Date;
  updatedAt: Date;
}
