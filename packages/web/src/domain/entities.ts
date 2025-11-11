/**
 * Core Domain Entities for ProcureFlow
 *
 * This file contains the domain model types representing the core business entities.
 * Types are designed to be framework-agnostic and database-agnostic at the domain level.
 *
 * Entity Categories:
 * - User: Authentication and ownership
 * - Item (CatalogItem): Materials and services in the catalog
 * - Cart: Shopping cart and line items
 * - PurchaseRequest: Simulated ERP submissions
 * - AgentConversation: AI agent interactions and logs
 *
 * Scope Indicators:
 * - [MVP]: In scope for tech case implementation
 * - [Future]: Out of scope, for future iterations
 */

// ============================================================================
// Type Aliases for IDs
// ============================================================================

/**
 * User identifier (string representation of MongoDB ObjectId)
 * [MVP]
 */
export type UserId = string;

/**
 * Item identifier (string representation of MongoDB ObjectId)
 * [MVP]
 */
export type ItemId = string;

/**
 * Cart identifier (string representation of MongoDB ObjectId)
 * [MVP]
 */
export type CartId = string;

/**
 * Purchase Request identifier (string representation of MongoDB ObjectId)
 * [MVP]
 */
export type PurchaseRequestId = string;

/**
 * Agent Conversation identifier (string representation of MongoDB ObjectId)
 * [MVP]
 */
export type AgentConversationId = string;

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Item status in the catalog
 * [MVP]: Active - item is available for selection
 * [Future]: PendingReview - awaiting buyer approval
 * [Future]: Inactive - item removed from active catalog
 */
export enum ItemStatus {
  Active = 'Active',
  PendingReview = 'PendingReview', // [Future]
  Inactive = 'Inactive', // [Future]
}

/**
 * Purchase request status
 * [MVP]: Submitted - simulated submission to ERP
 * [Future]: PendingApproval, Approved, Rejected - for approval workflows
 */
export enum PurchaseRequestStatus {
  Submitted = 'Submitted', // [MVP]
  PendingApproval = 'PendingApproval', // [Future]
  Approved = 'Approved', // [Future]
  Rejected = 'Rejected', // [Future]
}

/**
 * Agent message role
 * [MVP]
 */
export enum AgentMessageRole {
  User = 'user',
  Agent = 'agent',
  System = 'system',
}

/**
 * Agent action types (tools/functions the agent can invoke)
 * [MVP]
 */
export enum AgentActionType {
  SearchCatalog = 'search_catalog',
  RegisterItem = 'register_item',
  AddToCart = 'add_to_cart',
  UpdateCartItem = 'update_cart_item',
  RemoveFromCart = 'remove_from_cart',
  ViewCart = 'view_cart',
  AnalyzeCart = 'analyze_cart',
  Checkout = 'checkout',
}

// ============================================================================
// User Entity
// ============================================================================

/**
 * User entity
 * Represents an authenticated user in the system.
 * Kept minimal to support Auth.js integration and ownership of carts/requests.
 * [MVP]
 */
export interface User {
  /** Unique user identifier */
  id: UserId;

  /** User's email address (used for login) */
  email: string;

  /** User's display name */
  name?: string;

  /** Hashed password (only for Credentials provider) */
  passwordHash?: string;

  /** OAuth provider (e.g., 'google') if using OAuth */
  provider?: string; // [Future]

  /** OAuth provider user ID */
  providerId?: string; // [Future]

  /** User role - [Future]: for role-based access control */
  role?: 'requester' | 'buyer' | 'admin'; // [Future]

  /** Account creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

// ============================================================================
// Item (CatalogItem) Entity
// ============================================================================

/**
 * Item (CatalogItem) entity
 * Represents a material or service in the procurement catalog.
 * Can be seeded or registered by users.
 * [MVP]
 */
export interface Item {
  /** Unique item identifier */
  id: ItemId;

  /** Item name (required, should be descriptive) */
  name: string;

  /** Item category (e.g., "Office Supplies", "Electronics") */
  category: string;

  /** Detailed description of the item */
  description: string;

  /**
   * Estimated unit price in the default currency (e.g., USD)
   * Must be a positive number.
   * [MVP]
   */
  price: number;

  /**
   * Unit of measure (e.g., "each", "box", "pack")
   * [Future]: for more precise quantity management
   */
  unit?: string; // [Future]

  /**
   * Item status in the catalog
   * [MVP]: Defaults to Active
   * [Future]: PendingReview for items awaiting buyer approval
   */
  status: ItemStatus;

  /**
   * Preferred supplier name
   * [Future]: for supplier relationship management
   */
  preferredSupplier?: string; // [Future]

  /**
   * User ID of the person who registered this item (if user-registered)
   * [MVP]
   */
  registeredBy?: UserId;

  /** Item creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

// ============================================================================
// Cart Entity
// ============================================================================

/**
 * CartItem represents a single line item in a cart
 * [MVP]
 */
export interface CartItem {
  /** Reference to the catalog item */
  itemId: ItemId;

  /** Snapshot of item name at the time of adding to cart */
  itemName: string;

  /** Snapshot of item price at the time of adding to cart */
  itemPrice: number;

  /**
   * Quantity of this item in the cart
   * Must be >= 1 and <= 999 per BR-2.2
   * [MVP]
   */
  quantity: number;

  /**
   * Subtotal for this line item (itemPrice * quantity)
   * Calculated field, not persisted separately in some implementations
   */
  subtotal: number;

  /** Timestamp when this item was added to cart */
  addedAt: Date;
}

/**
 * Cart entity
 * Represents a user's shopping cart.
 * [MVP]: Associated with authenticated user
 * [Future]: Persist across sessions
 */
export interface Cart {
  /** Unique cart identifier */
  id: CartId;

  /** User who owns this cart */
  userId: UserId;

  /** Line items in the cart */
  items: CartItem[];

  /**
   * Total estimated cost of all items in cart
   * Sum of all item subtotals
   * [MVP]
   */
  totalCost: number;

  /** Cart creation timestamp */
  createdAt: Date;

  /** Last update timestamp (e.g., when items are added/removed) */
  updatedAt: Date;

  /**
   * Indicates if this is a saved cart draft
   * [Future]: for saving carts without checking out
   */
  isDraft?: boolean; // [Future]
}

// ============================================================================
// PurchaseRequest Entity
// ============================================================================

/**
 * PurchaseRequestItem represents a snapshot of an item at checkout time
 * This is an immutable record of what was requested, even if catalog item changes later.
 * [MVP]
 */
export interface PurchaseRequestItem {
  /** Reference to the original catalog item (may change or be deleted later) */
  itemId: ItemId;

  /** Snapshot: item name at checkout */
  itemName: string;

  /** Snapshot: item category at checkout */
  itemCategory: string;

  /** Snapshot: item description at checkout */
  itemDescription: string;

  /** Snapshot: unit price at checkout */
  unitPrice: number;

  /** Quantity requested */
  quantity: number;

  /** Subtotal for this line (unitPrice * quantity) */
  subtotal: number;
}

/**
 * PurchaseRequest entity
 * Represents a simulated purchase request submitted to the ERP.
 * In the tech case, this is logged to MongoDB rather than sent to a real ERP.
 * [MVP]
 */
export interface PurchaseRequest {
  /** Unique purchase request identifier */
  id: PurchaseRequestId;

  /** User who created this purchase request */
  userId: UserId;

  /** Purchase request number (e.g., PR-2024-0001) */
  requestNumber: string;

  /** List of items in this purchase request (immutable snapshots) */
  items: PurchaseRequestItem[];

  /**
   * Total estimated cost of the purchase request
   * Sum of all item subtotals
   * [MVP]
   */
  totalCost: number;

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
   * [MVP]: Defaults to Submitted
   * [Future]: PendingApproval, Approved, Rejected
   */
  status: PurchaseRequestStatus;

  /**
   * Delivery location
   * [Future]: for more advanced logistics
   */
  deliveryLocation?: string; // [Future]

  /**
   * Requested delivery date
   * [Future]: for scheduling
   */
  requestedDeliveryDate?: Date; // [Future]

  /** Timestamp when the purchase request was created */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

// ============================================================================
// AgentConversation Entity
// ============================================================================

/**
 * AgentMessage represents a single message in an agent conversation
 * [MVP]
 */
export interface AgentMessage {
  /** Message role (user, assistant, system) */
  role: AgentMessageRole;

  /** Message content (text) */
  content: string;

  /** Timestamp when this message was created */
  timestamp: Date;

  /**
   * Optional items attached to the message (e.g., search results)
   * Used for rendering product cards in the chat UI
   */
  items?: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    price: number;
    availability: 'in_stock' | 'out_of_stock' | 'limited';
  }>;

  /**
   * Optional cart data attached to the message
   * Used for rendering cart view in the chat UI
   */
  cart?: {
    items: Array<{
      itemId: string;
      itemName: string;
      itemPrice: number;
      quantity: number;
    }>;
    totalCost: number;
    itemCount: number;
  };

  /**
   * Optional checkout confirmation data
   * Used to show confirmation UI before executing checkout
   */
  checkoutConfirmation?: {
    items: Array<{
      itemId: string;
      itemName: string;
      itemPrice: number;
      quantity: number;
      subtotal: number;
    }>;
    totalCost: number;
    itemCount: number;
  };

  /**
   * Optional purchase request data attached to the message
   * Used for rendering purchase request card after checkout
   */
  purchaseRequest?: {
    id: string;
    items: Array<{
      itemName: string;
      itemCategory: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
    totalCost: number;
    status: string;
  };
}

/**
 * AgentAction represents a tool/function call made by the agent
 * Used for debugging and understanding agent behavior.
 * [MVP]
 */
export interface AgentAction {
  /** Type of action (e.g., search_catalog, add_to_cart) */
  actionType: AgentActionType;

  /** Input parameters passed to the action */
  parameters: Record<string, unknown>;

  /** Result returned by the action (success/failure, data) */
  result?: Record<string, unknown>;

  /** Error message if the action failed */
  error?: string;

  /** Timestamp when this action was executed */
  timestamp: Date;
}

/**
 * AgentConversation entity
 * Represents a conversation between a user and the AI agent.
 * Includes message history and action logs for debugging and traceability.
 * [MVP]
 */
export interface AgentConversation {
  /** Unique conversation identifier */
  id: AgentConversationId;

  /** User who initiated this conversation */
  userId: UserId;

  /** Chronological list of messages in the conversation */
  messages: AgentMessage[];

  /**
   * List of actions/tools invoked by the agent during this conversation
   * [MVP]: for debugging and understanding agent behavior
   */
  actions: AgentAction[];

  /**
   * Indicates if the conversation is still active or completed
   * [MVP]
   */
  isActive: boolean;

  /**
   * Summary of the conversation goal or outcome
   * [Future]: generated by the agent at conversation end
   */
  summary?: string; // [Future]

  /** Conversation creation timestamp */
  createdAt: Date;

  /** Last update timestamp (e.g., when a new message is added) */
  updatedAt: Date;
}

// ============================================================================
// Future Entities (Out of Scope for MVP)
// ============================================================================

/**
 * Category entity
 * [Future]: Separate category collection instead of raw string in Item
 * Could include hierarchy, metadata, etc.
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string; // For hierarchical categories
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AgentActionLog entity
 * [Future]: More detailed, separate logging for agent actions
 * Could be used for analytics, training data, etc.
 */
export interface AgentActionLog {
  id: string;
  conversationId: AgentConversationId;
  userId: UserId;
  actionType: AgentActionType;
  parameters: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  executionTimeMs?: number;
  timestamp: Date;
}
