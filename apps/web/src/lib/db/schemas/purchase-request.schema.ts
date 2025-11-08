/**
 * Purchase Request Schema for MongoDB/Mongoose
 *
 * Represents a simulated purchase request submitted to the ERP.
 * In the tech case, requests are logged to MongoDB instead of being
 * sent to a real ERP system.
 *
 * Scope: [MVP]
 * - Simulated ERP submission for Cart & Checkout journey
 * - Embedded PurchaseRequestItem sub-documents with immutable snapshots
 * - Tracks request source (UI or Agent)
 *
 * Future enhancements:
 * - Real ERP integration
 * - Approval workflows (PendingApproval, Approved, Rejected statuses)
 * - Delivery location and requested delivery date
 * - Budget validation
 */

import { Schema, Types } from 'mongoose';

// ============================================================================
// Constants
// ============================================================================

export const PURCHASE_REQUEST_COLLECTION_NAME = 'purchase_requests';

// Validation limits
export const MAX_REQUEST_ITEMS = 100; // Maximum items per request
export const MAX_NOTES_LENGTH = 2000; // Maximum length for notes field

// ============================================================================
// Enums
// ============================================================================

/**
 * Purchase request status
 * [MVP]: submitted - default status for tech case
 * [Future]: pending_approval, approved, rejected - for approval workflows
 */
export enum PurchaseRequestStatus {
  Submitted = 'submitted',
  PendingApproval = 'pending_approval', // [Future]
  Approved = 'approved', // [Future]
  Rejected = 'rejected', // [Future]
}

/**
 * Purchase request source
 * Indicates how the request was created
 */
export enum PurchaseRequestSource {
  UI = 'ui', // Created via web UI
  Agent = 'agent', // Created via AI agent conversation
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * PurchaseRequestItem document type for TypeScript
 */
interface IPurchaseRequestItem {
  itemId: Types.ObjectId | null;
  name: string;
  category: string;
  description: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

// ============================================================================
// Sub-document Schemas
// ============================================================================

/**
 * PurchaseRequestItem Sub-document Schema
 *
 * Represents an immutable snapshot of a catalog item at checkout time.
 * This preserves historical accuracy even if the original item changes or is deleted.
 *
 * Validations:
 * - quantity: must be >= 1
 * - unitPrice: must be > 0
 * - subtotal: must be >= 0 and should equal unitPrice * quantity
 */
const PurchaseRequestItemSchema = new Schema(
  {
    /**
     * Reference to original catalog item
     * - Can be null if item was deleted from catalog
     * - Provides traceability when item still exists
     */
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: false, // Can be null for deleted items
    },

    /**
     * Snapshot: item name at checkout
     * - Required
     * - Immutable record
     */
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [200, 'Item name must not exceed 200 characters'],
    },

    /**
     * Snapshot: item category at checkout
     * - Required
     * - Immutable record
     */
    category: {
      type: String,
      required: [true, 'Item category is required'],
      trim: true,
      maxlength: [100, 'Category must not exceed 100 characters'],
    },

    /**
     * Snapshot: item description at checkout
     * - Required
     * - Immutable record
     */
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
      maxlength: [2000, 'Description must not exceed 2000 characters'],
    },

    /**
     * Snapshot: unit price at checkout
     * - Required
     * - Must be positive
     * - Immutable record
     */
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0.01, 'Unit price must be greater than 0'],
    },

    /**
     * Quantity requested
     * - Required
     * - Must be >= 1
     * - Immutable record
     */
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },

    /**
     * Subtotal for this line item
     * - Required
     * - Should equal unitPrice * quantity
     * - Validated in pre-save hook
     */
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal must be greater than or equal to 0'],
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

// ============================================================================
// Main Purchase Request Schema
// ============================================================================

/**
 * Purchase Request Schema
 *
 * Validations:
 * - requestNumber: required, unique (e.g., "PR-2025-0001")
 * - items: array of PurchaseRequestItem, min 1 item
 * - total: required, must match sum of item subtotals
 * - source: required, enum validation
 *
 * Indexes:
 * - requestNumber (unique)
 * - userId (for user's request history)
 * - createdAt (for chronological queries)
 *
 * Business Rules:
 * - BR-4.1: Purchase request requires at least 1 item
 * - BR-4.2: Unique request ID generated
 * - BR-4.3: Request recorded with timestamp, user ID, items, total cost
 */
export const PurchaseRequestSchema = new Schema(
  {
    /**
     * Unique request number
     * - Required
     * - Unique index
     * - Format: "PR-YYYY-####" (e.g., "PR-2025-0001")
     * - Generated automatically if not provided
     */
    requestNumber: {
      type: String,
      required: [true, 'Request number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [50, 'Request number must not exceed 50 characters'],
    },

    /**
     * User who created this purchase request
     * - Optional but recommended
     * - Reference to User collection
     * - Can be null for anonymous/test requests
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional to support test scenarios
    },

    /**
     * List of requested items
     * - Array of PurchaseRequestItem sub-documents
     * - Immutable snapshots
     * - Business Rule BR-4.1: At least 1 item required
     */
    items: {
      type: [PurchaseRequestItemSchema],
      required: true,
      validate: {
        validator: function (items: IPurchaseRequestItem[]) {
          return items.length > 0 && items.length <= MAX_REQUEST_ITEMS;
        },
        message: `Purchase request must have 1-${MAX_REQUEST_ITEMS} items`,
      },
    },

    /**
     * Total estimated cost
     * - Required
     * - Should equal sum of all item subtotals
     * - Validated/recomputed in pre-save hook
     */
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total must be greater than or equal to 0'],
    },

    /**
     * Optional notes or justification
     * - Provides context for the request
     * - Max length to prevent abuse
     */
    notes: {
      type: String,
      trim: true,
      maxlength: [
        MAX_NOTES_LENGTH,
        `Notes must not exceed ${MAX_NOTES_LENGTH} characters`,
      ],
    },

    /**
     * Request source (UI or Agent)
     * - Required
     * - Tracks how the request was created
     */
    source: {
      type: String,
      enum: {
        values: Object.values(PurchaseRequestSource),
        message: 'Invalid request source: {VALUE}',
      },
      required: [true, 'Request source is required'],
    },

    /**
     * Purchase request status
     * [MVP]: Defaults to 'submitted'
     * [Future]: pending_approval, approved, rejected
     */
    status: {
      type: String,
      enum: {
        values: Object.values(PurchaseRequestStatus),
        message: 'Invalid status: {VALUE}',
      },
      default: PurchaseRequestStatus.Submitted,
      required: true,
    },

    /**
     * Delivery location
     * [Future]: For advanced logistics
     */
    deliveryLocation: {
      type: String,
      trim: true,
      maxlength: [500, 'Delivery location must not exceed 500 characters'],
      // Not required in MVP
    },

    /**
     * Requested delivery date
     * [Future]: For scheduling
     */
    requestedDeliveryDate: {
      type: Date,
      // Not required in MVP
    },
  },
  {
    // Automatic timestamps: createdAt, updatedAt
    timestamps: true,

    // Enable validation before save
    validateBeforeSave: true,

    // Collection name
    collection: PURCHASE_REQUEST_COLLECTION_NAME,

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

/**
 * NOTE: Explicit .index() calls are commented out to avoid Turbopack compatibility issues.
 * The unique index on requestNumber is already defined via schema field option { unique: true }.
 * Other indexes can be created manually via MongoDB or enabled when not using Turbopack.
 */

// Unique index on requestNumber
// PurchaseRequestSchema.index({ requestNumber: 1 }, { unique: true });

// Index on userId for user's request history
// PurchaseRequestSchema.index({ userId: 1 });

// Index on createdAt for chronological queries
// PurchaseRequestSchema.index({ createdAt: -1 }); // Descending for recent-first

// Compound index on userId + createdAt for user's recent requests
// PurchaseRequestSchema.index({ userId: 1, createdAt: -1 });

// Index on status for filtering by status
// PurchaseRequestSchema.index({ status: 1 });

// ============================================================================
// Static Methods
// ============================================================================

/**
 * Generate next request number
 * Format: PR-YYYY-#### (e.g., PR-2025-0001)
 */
PurchaseRequestSchema.statics.generateRequestNumber =
  async function (): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PR-${year}-`;

    // Find the last request number for this year
    const lastRequest = await this.findOne({
      requestNumber: new RegExp(`^${prefix}`),
    })
      .sort({ requestNumber: -1 })
      .limit(1);

    let nextNumber = 1;

    if (lastRequest) {
      // Extract the numeric part and increment
      const lastNumber = parseInt(
        lastRequest.requestNumber.replace(prefix, ''),
        10
      );
      nextNumber = lastNumber + 1;
    }

    // Pad with zeros to 4 digits
    const paddedNumber = nextNumber.toString().padStart(4, '0');

    return `${prefix}${paddedNumber}`;
  };

/**
 * Find purchase requests by user ID
 */
PurchaseRequestSchema.statics.findByUserId = function (userId: Types.ObjectId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// ============================================================================
// Pre-save Hooks
// ============================================================================

/**
 * Pre-save hook to generate request number if not provided
 */
PurchaseRequestSchema.pre('save', async function (next) {
  if (!this.requestNumber) {
    try {
      // @ts-expect-error - Model statics not fully typed
      this.requestNumber = await this.constructor.generateRequestNumber();
      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});

/**
 * Pre-save hook to validate and recompute total
 * Ensures total matches sum of item subtotals
 */
PurchaseRequestSchema.pre('save', function (next) {
  // Validate items array is not empty
  if (!this.items || this.items.length === 0) {
    next(new Error('Purchase request must have at least 1 item'));
    return;
  }

  // Recompute total from items
  const computedTotal = (
    this.items as unknown as IPurchaseRequestItem[]
  ).reduce((sum: number, item: IPurchaseRequestItem) => sum + item.subtotal, 0);

  // Update total if different (allow small floating point variance)
  const totalDiff = Math.abs((this.total as number) - computedTotal);
  if (totalDiff > 0.01) {
    (this.total as number) = computedTotal;
  }

  next();
});

/**
 * Pre-save hook to validate item subtotals
 * Ensures each item's subtotal matches unitPrice * quantity
 */
PurchaseRequestSchema.pre('save', function (next) {
  for (const item of this.items as unknown as IPurchaseRequestItem[]) {
    const expectedSubtotal = item.unitPrice * item.quantity;

    // Allow small floating point variance
    if (Math.abs(item.subtotal - expectedSubtotal) > 0.01) {
      // Auto-correct the subtotal
      item.subtotal = expectedSubtotal;
    }
  }

  next();
});

// ============================================================================
// Export
// ============================================================================

export default PurchaseRequestSchema;
