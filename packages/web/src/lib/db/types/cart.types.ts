/**
 * TypeScript types for Cart Mongoose documents
 *
 * These interfaces provide full type safety for Mongoose documents,
 * eliminating the need for `any` types in service layer functions.
 */

import { Document, Types } from 'mongoose';

/**
 * CartItem subdocument interface
 * Represents a single line item in the cart
 */
export interface CartItemDocument {
  _id: Types.ObjectId;
  itemId: Types.ObjectId;
  name: string;
  unitPrice: number;
  quantity: number;
  addedAt: Date;
  subtotal?: number; // Virtual property
}

/**
 * Cart document interface
 * Extends Mongoose Document to include all schema fields with proper types
 */
export interface CartDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: CartItemDocument[];
  totalCost: number; // Virtual property
  createdAt: Date;
  updatedAt: Date;
}
