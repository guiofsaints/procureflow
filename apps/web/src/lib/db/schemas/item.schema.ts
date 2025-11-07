/**
 * Item (CatalogItem) Schema for MongoDB/Mongoose
 *
 * Represents materials and services in the procurement catalog.
 * Items can be seeded from existing data or registered by users.
 *
 * Scope: [MVP]
 * - Core catalog for Search & Register journey
 * - User-registered items with ownership tracking
 *
 * Future enhancements:
 * - Category hierarchy (separate Category collection)
 * - Unit of measure standardization
 * - Supplier relationship management
 * - Rich approval workflows for user-registered items
 */

import { Schema, Types } from 'mongoose';

// ============================================================================
// Constants
// ============================================================================

export const ITEM_COLLECTION_NAME = 'items';

// ============================================================================
// Enums
// ============================================================================

/**
 * Item status in the catalog
 * [MVP]: active - item is available for selection
 * [MVP]: archived - item removed from active catalog (soft delete)
 * [Future]: pending_review - awaiting buyer approval for user-registered items
 */
export enum ItemStatus {
  Active = 'active',
  Archived = 'archived',
  PendingReview = 'pending_review', // [Future]
}

// ============================================================================
// Schema Definition
// ============================================================================

/**
 * Item Schema
 *
 * Validations:
 * - name: required, trimmed, max length 200
 * - category: required, trimmed, max length 100
 * - description: required, max length 2000
 * - estimatedPrice: required, must be > 0
 * - status: enum validation, defaults to 'active'
 *
 * Indexes:
 * - name + category (compound, for search and duplicate detection)
 * - status (for active item queries)
 * - createdByUserId (for user's registered items)
 */
export const ItemSchema = new Schema(
  {
    /**
     * Item name
     * - Required
     * - Descriptive, trimmed
     * - Indexed for search
     */
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      minlength: [2, 'Item name must be at least 2 characters'],
      maxlength: [200, 'Item name must not exceed 200 characters'],
    },

    /**
     * Item category
     * - Required
     * - Trimmed
     * - Examples: "Office Supplies", "Electronics", "Software Licenses"
     * [Future]: Replace with ObjectId reference to Category collection
     */
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      minlength: [2, 'Category must be at least 2 characters'],
      maxlength: [100, 'Category must not exceed 100 characters'],
    },

    /**
     * Detailed description
     * - Required
     * - Supports search and user understanding
     */
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description must not exceed 2000 characters'],
    },

    /**
     * Estimated unit price
     * - Required
     * - Must be positive (> 0)
     * - Default currency: USD (not stored, assumed at application level)
     * - Business Rule BR-1.5: Price must be positive
     */
    estimatedPrice: {
      type: Number,
      required: [true, 'Estimated price is required'],
      min: [0.01, 'Price must be greater than 0'],
      max: [1000000, 'Price must not exceed 1,000,000'], // Reasonable upper bound
      validate: {
        validator: function (value: number): boolean {
          // Ensure price has at most 2 decimal places
          return /^\d+(\.\d{1,2})?$/.test(value.toFixed(2));
        },
        message: 'Price must have at most 2 decimal places',
      },
    },

    /**
     * Unit of measure (e.g., "each", "box", "pack")
     * [Future]: For more precise quantity management
     */
    unit: {
      type: String,
      trim: true,
      maxlength: [50, 'Unit must not exceed 50 characters'],
      default: 'each',
      // Not required in MVP
    },

    /**
     * Item status in the catalog
     * [MVP]: Defaults to 'active'
     * [Future]: 'pending_review' for items awaiting buyer approval
     */
    status: {
      type: String,
      enum: {
        values: Object.values(ItemStatus),
        message: 'Invalid item status: {VALUE}',
      },
      default: ItemStatus.Active,
      required: true,
    },

    /**
     * Preferred supplier name
     * [Future]: For supplier relationship management
     */
    preferredSupplier: {
      type: String,
      trim: true,
      maxlength: [200, 'Supplier name must not exceed 200 characters'],
      // Not required in MVP
    },

    /**
     * User ID of the person who registered this item
     * - Optional: null for seeded/pre-loaded items
     * - Reference to User collection
     * - Enables tracking of user-contributed catalog entries
     */
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      // Not required - seeded items won't have this
    },
  },
  {
    // Automatic timestamps: createdAt, updatedAt
    timestamps: true,

    // Enable validation before save
    validateBeforeSave: true,

    // Collection name
    collection: ITEM_COLLECTION_NAME,

    // Optimize JSON output
    toJSON: {
      transform: function (_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ============================================================================
// Indexes
// ============================================================================

// Compound index on name + category for search and duplicate detection
// Business Rule BR-1.3: Item name should be unique within same category
ItemSchema.index({ name: 1, category: 1 });

// Text index on name, description, and category for full-text search
ItemSchema.index({ name: 'text', description: 'text', category: 'text' });

// Index on category for filtering
ItemSchema.index({ category: 1 });

// Index on status for active item queries
ItemSchema.index({ status: 1 });

// Index on createdByUserId for user's registered items
ItemSchema.index({ createdByUserId: 1 });

// ============================================================================
// Virtual Properties
// ============================================================================

/**
 * Virtual property to check if item was user-registered
 */
ItemSchema.virtual('isUserRegistered').get(function () {
  return !!this.createdByUserId;
});

// ============================================================================
// Instance Methods
// ============================================================================

/**
 * Check if item is active and available for purchase
 */
ItemSchema.methods.isAvailable = function (): boolean {
  return this.status === ItemStatus.Active;
};

/**
 * Archive this item (soft delete)
 */
ItemSchema.methods.archive = function () {
  this.status = ItemStatus.Archived;
  return this.save();
};

// ============================================================================
// Static Methods
// ============================================================================

/**
 * Find active items only
 */
ItemSchema.statics.findActive = function () {
  return this.find({ status: ItemStatus.Active });
};

/**
 * Search items by keyword (name or description)
 */
ItemSchema.statics.searchByKeyword = function (keyword: string) {
  return this.find({
    $text: { $search: keyword },
    status: ItemStatus.Active,
  }).sort({ score: { $meta: 'textScore' } });
};

/**
 * Check for potential duplicates in same category
 * Business Rule BR-1.3
 */
ItemSchema.statics.findPotentialDuplicates = function (
  name: string,
  category: string,
  excludeId?: Types.ObjectId
) {
  const query: {
    name: RegExp;
    category: string;
    _id?: { $ne: Types.ObjectId };
  } = {
    name: new RegExp(`^${name.trim()}$`, 'i'), // Case-insensitive exact match
    category: category.trim(),
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.find(query);
};

// ============================================================================
// Pre-save Hooks
// ============================================================================

/**
 * Pre-save hook to trim and normalize strings
 */
ItemSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }

  if (this.isModified('category')) {
    this.category = this.category.trim();
  }

  if (this.isModified('description')) {
    this.description = this.description.trim();
  }

  next();
});

/**
 * Pre-save hook to validate price is positive
 * Business Rule BR-1.5: Price must be positive
 */
ItemSchema.pre('save', function (next) {
  if (this.isModified('estimatedPrice') && this.estimatedPrice <= 0) {
    next(new Error('Price must be greater than 0'));
  } else {
    next();
  }
});

// ============================================================================
// Export
// ============================================================================

export default ItemSchema;
