/**
 * MongoDB Document Type Definitions for ProcureFlow
 *
 * This file defines TypeScript interfaces that represent MongoDB documents
 * as stored and retrieved via Mongoose. These types closely mirror the domain
 * entities in entities.ts, but include MongoDB-specific concerns:
 *
 * - _id field (MongoDB ObjectId or string representation)
 * - Mongoose-specific metadata (e.g., __v version key)
 * - Timestamps (createdAt, updatedAt)
 * - References to other documents (stored as ObjectId)
 *
 * Usage:
 * - Import document types when working with Mongoose models
 * - Use in service layer when interacting with database
 * - Services should convert documents to domain entities before returning
 *
 * Location: domain/documents.ts (not in lib/db/ to keep domain layer cohesive)
 *
 * Scope Indicators:
 * - [MVP]: In scope for tech case implementation
 * - [Future]: Out of scope, for future iterations
 */

import type { Types } from 'mongoose';

import type {
  UserId,
  ItemId,
  AgentConversationId,
  ItemStatus,
  PurchaseRequestStatus,
  AgentActionType,
} from './entities';

// ============================================================================
// User Document
// ============================================================================

/**
 * UserDocument represents the MongoDB document for User entity
 * [MVP]
 *
 * Differences from domain User:
 * - _id: MongoDB ObjectId (converted to string in domain layer)
 * - All fields are persisted as-is
 */
export interface UserDocument {
  /** MongoDB ObjectId (primary key) */
  _id: Types.ObjectId | string;

  /** User's email address (unique, indexed) */
  email: string;

  /** User's display name */
  name?: string;

  /** Hashed password (only for Credentials provider) */
  passwordHash?: string;

  /** OAuth provider (e.g., 'google') if using OAuth */
  provider?: string; // [Future]

  /** OAuth provider user ID */
  providerId?: string; // [Future]

  /** User role */
  role?: 'requester' | 'buyer' | 'admin'; // [Future]

  /** Account creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** Mongoose version key (optional, can be disabled in schema) */
  __v?: number;
}

// ============================================================================
// Item (CatalogItem) Document
// ============================================================================

/**
 * ItemDocument represents the MongoDB document for Item (CatalogItem) entity
 * [MVP]
 *
 * Differences from domain Item:
 * - _id: MongoDB ObjectId (converted to string in domain layer)
 * - registeredBy: stored as ObjectId reference, not string
 * - Indexed fields: name, category (for search performance)
 */
export interface ItemDocument {
  /** MongoDB ObjectId (primary key) */
  _id: Types.ObjectId | string;

  /** Item name (required, indexed for search) */
  name: string;

  /** Item category (indexed for filtering) */
  category: string;

  /** Detailed description of the item */
  description: string;

  /**
   * Estimated unit price in the default currency
   * Must be a positive number.
   * [MVP]
   */
  estimatedPrice: number;

  /**
   * Unit of measure (e.g., "each", "box", "pack")
   * [Future]
   */
  unit?: string; // [Future]

  /**
   * Item status in the catalog
   * [MVP]: Defaults to 'Active'
   */
  status: ItemStatus;

  /**
   * Preferred supplier name
   * [Future]
   */
  preferredSupplier?: string; // [Future]

  /**
   * User ID of the person who registered this item
   * Stored as ObjectId reference to User collection
   * [MVP]
   */
  createdByUserId?: Types.ObjectId | UserId;

  /** Item creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** Mongoose version key */
  __v?: number;
}

// ============================================================================
// Cart Document
// ============================================================================

/**
 * CartDocument represents the MongoDB document for Cart entity
 * [MVP]
 *
 * Differences from domain Cart:
 * - _id: MongoDB ObjectId
 * - userId: stored as ObjectId reference
 * - items: embedded array of CartItemDocument (sub-documents)
 * - totalCost: can be calculated or persisted (schema decision)
 */
export interface CartDocument {
  /** MongoDB ObjectId (primary key) */
  _id: Types.ObjectId | string;

  /**
   * User who owns this cart
   * Stored as ObjectId reference to User collection
   */
  userId: Types.ObjectId | UserId;

  /**
   * Line items in the cart (embedded sub-documents)
   * Each item references a catalog item and stores quantity/price snapshot
   */
  items: CartItemDocument[];

  /**
   * Total estimated cost of all items in cart
   * Can be calculated on-the-fly or stored for performance
   * [MVP]
   */
  totalCost: number;

  /** Cart creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /**
   * Indicates if this is a saved cart draft
   * [Future]
   */
  isDraft?: boolean; // [Future]

  /** Mongoose version key */
  __v?: number;
}

/**
 * CartItemDocument represents an embedded CartItem sub-document
 * [MVP]
 *
 * Note: This is typically embedded within CartDocument, not a separate collection.
 * Field names match Mongoose schema: `name` and `unitPrice` (not `itemName`/`itemPrice`)
 */
export interface CartItemDocument {
  /** Reference to the catalog item (ObjectId) */
  itemId: Types.ObjectId | ItemId;

  /** Snapshot of item name at the time of adding to cart */
  name: string;

  /** Snapshot of unit price at the time of adding to cart */
  unitPrice: number;

  /**
   * Quantity of this item in the cart
   * Must be >= 1 and <= 999 per business rules
   */
  quantity: number;

  /**
   * Subtotal for this line item (unitPrice * quantity)
   * Calculated as virtual property in schema
   */
  subtotal?: number;

  /** Timestamp when this item was added to cart */
  addedAt: Date;

  /** Mongoose sub-document _id (auto-generated) */
  _id?: Types.ObjectId | string;
}

// ============================================================================
// PurchaseRequest Document
// ============================================================================

/**
 * PurchaseRequestDocument represents the MongoDB document for PurchaseRequest entity
 * [MVP]
 *
 * Differences from domain PurchaseRequest:
 * - _id: MongoDB ObjectId
 * - userId: stored as ObjectId reference
 * - items: embedded array of PurchaseRequestItemDocument (immutable snapshots)
 */
export interface PurchaseRequestDocument {
  /** MongoDB ObjectId (primary key) */
  _id: Types.ObjectId | string;

  /**
   * User who created this purchase request
   * Stored as ObjectId reference to User collection
   */
  userId: Types.ObjectId | UserId;

  /**
   * List of items in this purchase request (immutable snapshots)
   * Embedded sub-documents to preserve historical data even if catalog changes
   */
  items: PurchaseRequestItemDocument[];

  /**
   * Purchase request number (unique identifier, e.g., PR-2024-0001)
   * Generated in format: PR-YYYY-####
   */
  requestNumber: string;

  /**
   * Total estimated cost of the purchase request
   * Sum of all item subtotals
   * Field name matches Mongoose schema: `total` (not `totalCost`)
   */
  total: number;

  /**
   * Optional notes or justification for the purchase
   * [MVP]
   */
  notes?: string;

  /**
   * Source of the purchase request (UI or Agent)
   */
  source: 'ui' | 'agent';

  /**
   * Purchase request status
   * [MVP]: Defaults to 'Submitted'
   */
  status: PurchaseRequestStatus;

  /**
   * Delivery location
   * [Future]
   */
  deliveryLocation?: string; // [Future]

  /**
   * Requested delivery date
   * [Future]
   */
  requestedDeliveryDate?: Date; // [Future]

  /** Timestamp when the purchase request was created */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** Mongoose version key */
  __v?: number;
}

/**
 * PurchaseRequestItemDocument represents an embedded PurchaseRequestItem sub-document
 * This is an immutable snapshot of an item at checkout time.
 * [MVP]
 * Field names match Mongoose schema: `name`, `category`, `description` (not prefixed with `item`)
 */
export interface PurchaseRequestItemDocument {
  /** Reference to the original catalog item (may change or be deleted later) */
  itemId: Types.ObjectId | ItemId | null;

  /** Snapshot: item name at checkout */
  name: string;

  /** Snapshot: item category at checkout */
  category: string;

  /** Snapshot: item description at checkout */
  description: string;

  /** Snapshot: unit price at checkout */
  unitPrice: number;

  /** Quantity requested */
  quantity: number;

  /** Subtotal for this line (unitPrice * quantity) */
  subtotal: number;

  /** Mongoose sub-document _id (auto-generated) */
  _id?: Types.ObjectId | string;
}

// ============================================================================
// AgentConversation Document
// ============================================================================

/**
 * AgentConversationDocument represents the MongoDB document for AgentConversation entity
 * [MVP]
 *
 * Differences from domain AgentConversation:
 * - _id: MongoDB ObjectId
 * - userId: stored as ObjectId reference
 * - messages and actions: embedded arrays of sub-documents
 */
export interface AgentConversationDocument {
  /** MongoDB ObjectId (primary key) */
  _id: Types.ObjectId | string;

  /**
   * User who initiated this conversation
   * Stored as ObjectId reference to User collection
   */
  userId: Types.ObjectId | UserId;

  /**
   * Conversation title
   * Generated from first user message or explicitly set
   */
  title: string;

  /**
   * Preview of last message
   * Used for quick context in conversation list
   */
  lastMessagePreview: string;

  /**
   * Chronological list of messages in the conversation
   * Embedded sub-documents
   */
  messages: AgentMessageDocument[];

  /**
   * List of actions/tools invoked by the agent during this conversation
   * Embedded sub-documents for debugging and understanding agent behavior
   */
  actions: AgentActionDocument[];

  /**
   * Indicates if the conversation is still active or completed
   * [MVP]
   */
  isActive: boolean;

  /**
   * Summary of the conversation goal or outcome
   * [Future]
   */
  summary?: string; // [Future]

  /** Conversation creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** Mongoose version key */
  __v?: number;
}

/**
 * AgentMessageDocument represents an embedded AgentMessage sub-document
 * [MVP]
 */
export interface AgentMessageDocument {
  /** Message sender (user, agent, system) - matches Mongoose schema field name */
  sender: 'user' | 'agent' | 'system';

  /** Message content (text) */
  content: string;

  /** Timestamp when this message was created */
  createdAt: Date;

  /** Optional metadata (items, cart, checkoutConfirmation, purchaseRequest, etc.) */
  metadata?: Record<string, unknown>;

  /** Mongoose sub-document _id (auto-generated) */
  _id?: Types.ObjectId | string;
}

/**
 * AgentActionDocument represents an embedded AgentAction sub-document
 * Used for debugging and understanding agent behavior.
 * [MVP]
 */
export interface AgentActionDocument {
  /** Type of action (e.g., search_catalog, add_to_cart) */
  actionType: AgentActionType;

  /** Input parameters passed to the action (stored as BSON/JSON) */
  parameters: Record<string, unknown>;

  /** Result returned by the action (success/failure, data) */
  result?: Record<string, unknown>;

  /** Error message if the action failed */
  error?: string;

  /** Timestamp when this action was executed */
  timestamp: Date;

  /** Mongoose sub-document _id (auto-generated) */
  _id?: Types.ObjectId | string;
}

// ============================================================================
// Future Document Types (Out of Scope for MVP)
// ============================================================================

/**
 * CategoryDocument
 * [Future]: Separate category collection
 */
export interface CategoryDocument {
  _id: Types.ObjectId | string;
  name: string;
  description?: string;
  parentCategoryId?: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

/**
 * AgentActionLogDocument
 * [Future]: Separate collection for detailed agent action logging
 */
export interface AgentActionLogDocument {
  _id: Types.ObjectId | string;
  conversationId: Types.ObjectId | AgentConversationId;
  userId: Types.ObjectId | UserId;
  actionType: AgentActionType;
  parameters: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  executionTimeMs?: number;
  timestamp: Date;
  __v?: number;
}

// ============================================================================
// Utility Types for Schema Definitions
// ============================================================================

/**
 * Helper type to extract the shape needed for Mongoose schema definition
 * Excludes _id and __v which are auto-generated by Mongoose
 */
export type SchemaShape<T> = Omit<T, '_id' | '__v'>;

/**
 * Helper type for new document creation (before save)
 * Excludes auto-generated fields like _id, createdAt, updatedAt, __v
 */
export type NewDocument<T> = Omit<T, '_id' | 'createdAt' | 'updatedAt' | '__v'>;
