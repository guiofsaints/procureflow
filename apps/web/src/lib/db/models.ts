/**
 * MongoDB Models Index
 *
 * Centralized model creation and export to avoid redefinition issues
 * in Next.js development (hot reload).
 *
 * This module:
 * - Imports all schemas from the schemas directory
 * - Creates Mongoose models using the `models.X || model()` pattern
 * - Exports all models for use throughout the application
 *
 * Usage:
 *   import { UserModel, ItemModel, CartModel } from '@/lib/db/models';
 *
 * IMPORTANT: This module should only depend on:
 * - mongoose
 * - local schema files
 * - NO React/Next.js/AI imports
 */

import mongoose from 'mongoose';

// Import schemas
import AgentConversationSchema, {
  AGENT_CONVERSATION_COLLECTION_NAME,
  ConversationStatus,
  MAX_MESSAGES_PER_CONVERSATION,
  MessageSender,
} from './schemas/agent-conversation.schema';
import CartSchema, {
  CART_COLLECTION_NAME,
  MAX_CART_ITEMS,
  MAX_ITEM_QUANTITY,
  MIN_ITEM_QUANTITY,
} from './schemas/cart.schema';
import ItemSchema, {
  ITEM_COLLECTION_NAME,
  ItemStatus,
} from './schemas/item.schema';
import PurchaseRequestSchema, {
  MAX_REQUEST_ITEMS,
  PURCHASE_REQUEST_COLLECTION_NAME,
  PurchaseRequestSource,
  PurchaseRequestStatus,
} from './schemas/purchase-request.schema';
import UserSchema, {
  USER_COLLECTION_NAME,
  UserRole,
} from './schemas/user.schema';

// ============================================================================
// Model Creation with Hot Reload Support
// ============================================================================

/**
 * User Model
 *
 * Represents authenticated users in the system.
 * Used for: authentication, cart ownership, purchase request tracking.
 */
export const UserModel =
  mongoose.models[USER_COLLECTION_NAME] ||
  mongoose.model(USER_COLLECTION_NAME, UserSchema);

/**
 * Item (CatalogItem) Model
 *
 * Represents materials and services in the procurement catalog.
 * Used for: catalog search, item registration, cart/request line items.
 */
export const ItemModel =
  mongoose.models[ITEM_COLLECTION_NAME] ||
  mongoose.model(ITEM_COLLECTION_NAME, ItemSchema);

/**
 * Cart Model
 *
 * Represents a user's shopping cart with line items.
 * Used for: cart management, checkout preparation.
 */
export const CartModel =
  mongoose.models[CART_COLLECTION_NAME] ||
  mongoose.model(CART_COLLECTION_NAME, CartSchema);

/**
 * PurchaseRequest Model
 *
 * Represents a simulated purchase request (ERP submission).
 * Used for: checkout, request history, agent-created requests.
 */
export const PurchaseRequestModel =
  mongoose.models[PURCHASE_REQUEST_COLLECTION_NAME] ||
  mongoose.model(PURCHASE_REQUEST_COLLECTION_NAME, PurchaseRequestSchema);

/**
 * AgentConversation Model
 *
 * Represents a conversation between user and AI agent.
 * Used for: agent-first experience, conversation history, debugging.
 */
export const AgentConversationModel =
  mongoose.models[AGENT_CONVERSATION_COLLECTION_NAME] ||
  mongoose.model(AGENT_CONVERSATION_COLLECTION_NAME, AgentConversationSchema);

// ============================================================================
// Re-export Constants and Enums for Convenience
// ============================================================================

// Collection names
export {
  USER_COLLECTION_NAME,
  ITEM_COLLECTION_NAME,
  CART_COLLECTION_NAME,
  PURCHASE_REQUEST_COLLECTION_NAME,
  AGENT_CONVERSATION_COLLECTION_NAME,
};

// User enums and constants
export { UserRole };

// Item enums and constants
export { ItemStatus };

// Cart constants
export { MAX_CART_ITEMS, MIN_ITEM_QUANTITY, MAX_ITEM_QUANTITY };

// PurchaseRequest enums and constants
export {
  PurchaseRequestStatus,
  PurchaseRequestSource,
  MAX_REQUEST_ITEMS,
};

// AgentConversation enums and constants
export {
  MessageSender,
  ConversationStatus,
  MAX_MESSAGES_PER_CONVERSATION,
};

// ============================================================================
// Type Guards (Optional Helpers)
// ============================================================================

/**
 * Check if a model instance is a User
 */
export function isUserModel(doc: { collection: { name: string } }): boolean {
  return doc.collection.name === USER_COLLECTION_NAME;
}

/**
 * Check if a model instance is an Item
 */
export function isItemModel(doc: { collection: { name: string } }): boolean {
  return doc.collection.name === ITEM_COLLECTION_NAME;
}

/**
 * Check if a model instance is a Cart
 */
export function isCartModel(doc: { collection: { name: string } }): boolean {
  return doc.collection.name === CART_COLLECTION_NAME;
}

/**
 * Check if a model instance is a PurchaseRequest
 */
export function isPurchaseRequestModel(doc: {
  collection: { name: string };
}): boolean {
  return doc.collection.name === PURCHASE_REQUEST_COLLECTION_NAME;
}

/**
 * Check if a model instance is an AgentConversation
 */
export function isAgentConversationModel(doc: {
  collection: { name: string };
}): boolean {
  return doc.collection.name === AGENT_CONVERSATION_COLLECTION_NAME;
}

// ============================================================================
// Default Export
// ============================================================================

/**
 * Default export: all models as an object
 */
const models = {
  User: UserModel,
  Item: ItemModel,
  Cart: CartModel,
  PurchaseRequest: PurchaseRequestModel,
  AgentConversation: AgentConversationModel,
};

export default models;
