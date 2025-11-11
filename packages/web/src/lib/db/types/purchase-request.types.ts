/**
 * TypeScript types for PurchaseRequest Mongoose documents
 *
 * These interfaces provide full type safety for Mongoose documents,
 * eliminating the need for `any` types in service layer functions.
 */

import { Document, Types } from 'mongoose';

import {
  PurchaseRequestSource,
  PurchaseRequestStatus,
} from '../schemas/purchase-request.schema';

/**
 * PurchaseRequestItem subdocument interface
 * Represents an immutable snapshot of a catalog item at checkout time
 */
export interface PurchaseRequestItemDocument {
  _id: Types.ObjectId;
  itemId: Types.ObjectId | null; // Can be null if original item was deleted
  name: string;
  category: string;
  description: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

/**
 * PurchaseRequest document interface
 * Extends Mongoose Document to include all schema fields with proper types
 */
export interface PurchaseRequestDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  requestNumber: string;
  items: PurchaseRequestItemDocument[];
  totalAmount: number;
  status: PurchaseRequestStatus;
  source: PurchaseRequestSource;
  notes?: string;
  submittedAt: Date;
  conversationId?: Types.ObjectId; // Optional: link to agent conversation if created via agent
  createdAt: Date;
  updatedAt: Date;
}
