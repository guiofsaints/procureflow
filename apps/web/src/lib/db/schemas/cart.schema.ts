/**
 * Cart Schema for MongoDB/Mongoose
 *
 * Represents a user's shopping cart containing line items with quantities
 * and price snapshots.
 *
 * Scope: [MVP]
 * - Shopping cart for Cart & Checkout journey
 * - Embedded CartItem sub-documents with snapshot pattern
 * - Associated with authenticated user
 *
 * Future enhancements:
 * - Persist cart across sessions
 * - Multiple saved cart drafts per user
 * - Session-based carts for unauthenticated users
 */

import { Schema, Types } from 'mongoose';

// ============================================================================
// Constants
// ============================================================================

export const CART_COLLECTION_NAME = 'carts';

// Cart validation limits
export const MAX_CART_ITEMS = 50; // Reasonable limit to prevent abuse
export const MIN_ITEM_QUANTITY = 1;
export const MAX_ITEM_QUANTITY = 999; // Business Rule BR-2.2

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * CartItem document type for TypeScript
 */
interface ICartItem {
  itemId: Types.ObjectId;
  name: string;
  unitPrice: number;
  quantity: number;
  addedAt: Date;
  subtotal?: number; // Virtual property
}

// ============================================================================
// Sub-document Schemas
// ============================================================================

/**
 * CartItem Sub-document Schema
 *
 * Represents a single line item in the cart with snapshot pattern:
 * - Captures item name and price at add-to-cart time
 * - Preserves cart consistency even if catalog item changes
 *
 * Validations:
 * - quantity: min 1, max 999 (BR-2.2)
 * - unitPrice: must be > 0
 */
const CartItemSchema = new Schema(
  {
    /**
     * Reference to catalog item
     * - Required
     * - Link to Item collection
     */
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item ID is required'],
    },

    /**
     * Snapshot: item name at add-to-cart time
     * - Required
     * - Preserves cart state if item is updated/deleted
     */
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [200, 'Item name must not exceed 200 characters'],
    },

    /**
     * Snapshot: unit price at add-to-cart time
     * - Required
     * - Must be positive
     * - Preserves cart state if item price changes
     */
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0.01, 'Unit price must be greater than 0'],
    },

    /**
     * Quantity of this item in cart
     * - Required
     * - Min: 1, Max: 999 (BR-2.2)
     */
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [MIN_ITEM_QUANTITY, `Quantity must be at least ${MIN_ITEM_QUANTITY}`],
      max: [
        MAX_ITEM_QUANTITY,
        `Quantity must not exceed ${MAX_ITEM_QUANTITY}`,
      ],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },

    /**
     * Timestamp when item was added to cart
     * - Auto-generated
     * - For tracking purposes
     */
    addedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    // Don't add timestamps to sub-documents
    timestamps: false,

    // Optimize JSON output
    toJSON: {
      transform: function (_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Virtual property: subtotal for this line item
 * Calculated as unitPrice * quantity
 */
CartItemSchema.virtual('subtotal').get(function () {
  return this.unitPrice * this.quantity;
});

// Ensure virtuals are included in JSON output
CartItemSchema.set('toJSON', { virtuals: true });
CartItemSchema.set('toObject', { virtuals: true });

// ============================================================================
// Main Cart Schema
// ============================================================================

/**
 * Cart Schema
 *
 * Validations:
 * - userId: required (each cart belongs to a user)
 * - items: array of CartItem sub-documents, max 50 items
 * - At least 1 item required for checkout (enforced at application level)
 *
 * Indexes:
 * - userId (for user cart lookups)
 *
 * Business Rules:
 * - BR-2.1: Cart must contain at least 1 item to allow checkout
 * - BR-2.2: Quantity per item: min 1, max 999
 * - BR-2.3: Cart associated with authenticated user
 * - BR-2.7: Cart cleared after successful checkout
 */
export const CartSchema = new Schema(
  {
    /**
     * User who owns this cart
     * - Required
     * - Reference to User collection
     * - Business Rule BR-2.3: Cart associated with authenticated user
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    /**
     * Line items in the cart
     * - Array of CartItem sub-documents
     * - Max 50 items to prevent abuse
     * - Can be empty (e.g., after clearing cart)
     */
    items: {
      type: [CartItemSchema],
      default: [],
      validate: {
        validator: function (items: unknown[]) {
          return items.length <= MAX_CART_ITEMS;
        },
        message: `Cart cannot have more than ${MAX_CART_ITEMS} items`,
      },
    },

    /**
     * Indicates if this is a saved cart draft
     * [Future]: For saving carts without checking out
     */
    isDraft: {
      type: Boolean,
      default: false,
      // Not used in MVP - prepared for future feature
    },
  },
  {
    // Automatic timestamps: createdAt, updatedAt
    timestamps: true,

    // Enable validation before save
    validateBeforeSave: true,

    // Collection name
    collection: CART_COLLECTION_NAME,

    // Optimize JSON output
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },

    toObject: {
      virtuals: true,
    },
  }
);

// ============================================================================
// Virtual Properties
// ============================================================================

/**
 * Virtual property: total estimated cost of cart
 * Sum of all item subtotals
 */
CartSchema.virtual('totalCost').get(function () {
  return this.items.reduce((total: number, item: ICartItem) => {
    return total + item.unitPrice * item.quantity;
  }, 0);
});

/**
 * Virtual property: number of items in cart
 */
CartSchema.virtual('itemCount').get(function () {
  return this.items.length;
});

/**
 * Virtual property: total quantity of all items
 */
CartSchema.virtual('totalQuantity').get(function () {
  return this.items.reduce((total: number, item: ICartItem) => {
    return total + item.quantity;
  }, 0);
});

// ============================================================================
// Indexes
// ============================================================================

// Index on userId for fast cart lookups by user
CartSchema.index({ userId: 1 }, { unique: true }); // Each user has one active cart

// Index on updatedAt for cleanup of stale carts
CartSchema.index({ updatedAt: 1 });

// ============================================================================
// Instance Methods
// ============================================================================

/**
 * Check if cart is empty
 */
CartSchema.methods.isEmpty = function (): boolean {
  return this.items.length === 0;
};

/**
 * Check if cart can be checked out
 * Business Rule BR-2.1: Cart must contain at least 1 item
 */
CartSchema.methods.canCheckout = function (): boolean {
  return this.items.length > 0;
};

/**
 * Add item to cart or update quantity if already exists
 */
CartSchema.methods.addItem = function (
  itemId: Types.ObjectId,
  name: string,
  unitPrice: number,
  quantity: number
) {
  // Check if item already in cart
  const existingItem = this.items.find(
    (item: ICartItem) => item.itemId.toString() === itemId.toString()
  );

  if (existingItem) {
    // Update quantity (ensure it doesn't exceed max)
    existingItem.quantity = Math.min(
      existingItem.quantity + quantity,
      MAX_ITEM_QUANTITY
    );
  } else {
    // Add new item
    this.items.push({
      itemId,
      name,
      unitPrice,
      quantity: Math.min(quantity, MAX_ITEM_QUANTITY),
      addedAt: new Date(),
    });
  }

  return this.save();
};

/**
 * Update quantity of an item in cart
 */
CartSchema.methods.updateItemQuantity = function (
  itemId: Types.ObjectId,
  quantity: number
) {
  const item = this.items.find(
    (item: ICartItem) => item.itemId.toString() === itemId.toString()
  );

  if (!item) {
    throw new Error('Item not found in cart');
  }

  // Validate quantity bounds
  if (quantity < MIN_ITEM_QUANTITY || quantity > MAX_ITEM_QUANTITY) {
    throw new Error(
      `Quantity must be between ${MIN_ITEM_QUANTITY} and ${MAX_ITEM_QUANTITY}`
    );
  }

  item.quantity = quantity;
  return this.save();
};

/**
 * Remove item from cart
 */
CartSchema.methods.removeItem = function (itemId: Types.ObjectId) {
  this.items = this.items.filter(
    (item: ICartItem) => item.itemId.toString() !== itemId.toString()
  );
  return this.save();
};

/**
 * Clear all items from cart
 * Business Rule BR-2.7: Cart cleared after successful checkout
 */
CartSchema.methods.clear = function () {
  this.items = [];
  return this.save();
};

// ============================================================================
// Static Methods
// ============================================================================

/**
 * Find cart by user ID
 */
CartSchema.statics.findByUserId = function (userId: Types.ObjectId) {
  return this.findOne({ userId });
};

/**
 * Find or create cart for user
 */
CartSchema.statics.findOrCreateForUser = async function (
  userId: Types.ObjectId
) {
  let cart = await this.findOne({ userId });

  if (!cart) {
    cart = await this.create({ userId, items: [] });
  }

  return cart;
};

// ============================================================================
// Pre-save Hooks
// ============================================================================

/**
 * Pre-save hook to validate cart state
 */
CartSchema.pre('save', function (next) {
  // Ensure items array doesn't exceed max
  if (this.items.length > MAX_CART_ITEMS) {
    next(new Error(`Cart cannot have more than ${MAX_CART_ITEMS} items`));
  } else {
    next();
  }
});

// ============================================================================
// Export
// ============================================================================

export default CartSchema;
