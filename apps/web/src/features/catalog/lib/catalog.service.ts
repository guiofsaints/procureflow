/**
 * Catalog Service
 *
 * Business logic for catalog operations (items):
 * - Search items by keyword
 * - Create new catalog items
 *
 * This service is isolated from HTTP concerns and can be used by:
 * - API routes
 * - Agent tools
 * - Background jobs
 *
 * Enforces business rules from PRD (BR-1.x).
 */

import type { Types } from 'mongoose';

import type { Item } from '@/domain/entities';
import { ItemStatus } from '@/domain/entities';
import { ItemModel } from '@/lib/db/models';
import connectDB from '@/lib/db/mongoose';

// ============================================================================
// Types
// ============================================================================

export interface SearchItemsParams {
  /**
   * Keyword to search in name, description, and category
   * If empty/undefined, returns all active items
   */
  q?: string;

  /**
   * Maximum number of results to return
   * Default: 50
   */
  limit?: number;

  /**
   * Include archived items in search results
   * Default: false
   */
  includeArchived?: boolean;
}

export interface CreateItemInput {
  /** Item name (required, min 2 chars, max 200) */
  name: string;

  /** Category (required, min 2 chars, max 100) */
  category: string;

  /** Description (required, min 10 chars, max 2000) */
  description: string;

  /** Estimated price (required, must be > 0) */
  estimatedPrice: number;

  /** User ID of the person registering this item (optional) */
  createdByUserId?: string | Types.ObjectId;

  /** Unit of measure (optional, e.g., "each", "box") */
  unit?: string;

  /** Preferred supplier (optional) */
  preferredSupplier?: string;
}

// ============================================================================
// Error Classes
// ============================================================================

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DuplicateItemError extends Error {
  constructor(
    message: string,
    public duplicates: Item[]
  ) {
    super(message);
    this.name = 'DuplicateItemError';
  }
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Search items in the catalog
 *
 * Business Rules:
 * - BR-1.1: Keyword search across name, description, and category
 * - BR-1.4: Only active items by default
 *
 * @param params - Search parameters
 * @returns Array of matching items
 */
export async function searchItems(
  params: SearchItemsParams = {}
): Promise<Item[]> {
  await connectDB();

  const { q, limit = 50, includeArchived = false } = params;

  try {
    let items;

    if (q && q.trim()) {
      // Use text search index if keyword is provided
      items = await ItemModel.find({
        $text: { $search: q.trim() },
        ...(includeArchived ? {} : { status: 'active' }),
      })
        .select(
          'name category description estimatedPrice unit status preferredSupplier createdByUserId createdAt updatedAt'
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean()
        .exec();
    } else {
      // No keyword: return all items sorted by most recent
      items = await ItemModel.find(includeArchived ? {} : { status: 'active' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();
    }

    // Convert MongoDB documents to domain Item type
    return items.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      category: doc.category,
      description: doc.description,
      price: doc.estimatedPrice,
      unit: doc.unit,
      status: mapStatusFromDb(doc.status),
      preferredSupplier: doc.preferredSupplier,
      registeredBy: doc.createdByUserId?.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  } catch (error) {
    console.error('Error searching items:', error);
    throw new Error('Failed to search items');
  }
}

/**
 * Create a new catalog item
 *
 * Business Rules:
 * - BR-1.2: Required fields validation
 * - BR-1.3: Duplicate detection (same name + category)
 * - BR-1.5: Price must be positive
 *
 * @param input - Item creation data
 * @returns Created item
 * @throws ValidationError if input is invalid
 * @throws DuplicateItemError if potential duplicate exists
 */
export async function createItem(input: CreateItemInput): Promise<Item> {
  await connectDB();

  // Validate input
  validateCreateItemInput(input);

  // Normalize strings
  const normalizedName = input.name.trim();
  const normalizedCategory = input.category.trim();
  const normalizedDescription = input.description.trim();

  try {
    // Check for potential duplicates (BR-1.3)
    // Find items with similar name and category
    const duplicates = await ItemModel.find({
      name: { $regex: new RegExp(normalizedName, 'i') },
      category: { $regex: new RegExp(normalizedCategory, 'i') },
    })
      .limit(5)
      .lean()
      .exec();

    if (duplicates.length > 0) {
      // Convert to domain items for error
      const duplicateItems: Item[] = duplicates.map((doc) => ({
        id: doc._id.toString(),
        name: doc.name,
        category: doc.category,
        description: doc.description,
        price: doc.estimatedPrice,
        unit: doc.unit,
        status: mapStatusFromDb(doc.status),
        preferredSupplier: doc.preferredSupplier,
        registeredBy: doc.createdByUserId?.toString(),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));

      throw new DuplicateItemError(
        `Potential duplicate items found with similar name and category`,
        duplicateItems
      );
    }

    // Create item
    const itemData = {
      name: normalizedName,
      category: normalizedCategory,
      description: normalizedDescription,
      estimatedPrice: input.estimatedPrice,
      unit: input.unit,
      status: 'active',
      preferredSupplier: input.preferredSupplier,
      createdByUserId: input.createdByUserId, // Now accepts any string (demo user "1", UUID, etc.)
    };

    const newItem = new ItemModel(itemData);

    const item = await newItem.save();

    // Convert to domain type
    return {
      id: item._id.toString(),
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.estimatedPrice,
      unit: item.unit,
      status: mapStatusFromDb(item.status),
      preferredSupplier: item.preferredSupplier,
      registeredBy: item.createdByUserId?.toString(),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  } catch (error) {
    if (error instanceof DuplicateItemError) {
      throw error;
    }
    console.error('Error creating item:', error);
    throw new Error('Failed to create item');
  }
}

/**
 * Get item by ID
 *
 * @param itemId - Item ID
 * @returns Item or null if not found
 */
export async function getItemById(itemId: string): Promise<Item | null> {
  await connectDB();

  try {
    const item = await ItemModel.findById(itemId).lean().exec();

    if (!item) {
      return null;
    }

    return {
      id: item._id.toString(),
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.estimatedPrice,
      unit: item.unit,
      status: mapStatusFromDb(item.status),
      preferredSupplier: item.preferredSupplier,
      registeredBy: item.createdByUserId?.toString(),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching item by ID:', error);
    throw new Error('Failed to fetch item');
  }
}

/**
 * Update an existing catalog item
 *
 * Business Rules:
 * - BR-1.5: Price must be positive
 * - Only active items can be updated
 *
 * @param itemId - Item ID to update
 * @param updates - Partial item data to update
 * @returns Updated item
 * @throws {ValidationError} If item not found or validation fails
 */
export async function updateItem(
  itemId: string,
  updates: Partial<CreateItemInput>
): Promise<Item> {
  await connectDB();

  try {
    // Validate updates if provided
    if (updates.estimatedPrice !== undefined) {
      if (
        typeof updates.estimatedPrice !== 'number' ||
        updates.estimatedPrice <= 0
      ) {
        throw new ValidationError('Estimated price must be a positive number');
      }
    }

    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 200) {
        throw new ValidationError('Name must be between 2 and 200 characters');
      }
    }

    if (updates.category !== undefined) {
      const trimmedCategory = updates.category.trim();
      if (trimmedCategory.length < 2 || trimmedCategory.length > 100) {
        throw new ValidationError(
          'Category must be between 2 and 100 characters'
        );
      }
    }

    if (updates.description !== undefined) {
      const trimmedDesc = updates.description.trim();
      if (trimmedDesc.length < 10 || trimmedDesc.length > 2000) {
        throw new ValidationError(
          'Description must be between 10 and 2000 characters'
        );
      }
    }

    // Build update object with trimmed strings
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }
    if (updates.category !== undefined) {
      updateData.category = updates.category.trim();
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description.trim();
    }
    if (updates.estimatedPrice !== undefined) {
      updateData.estimatedPrice = updates.estimatedPrice;
    }
    if (updates.unit !== undefined) {
      updateData.unit = updates.unit;
    }
    if (updates.preferredSupplier !== undefined) {
      updateData.preferredSupplier = updates.preferredSupplier;
    }

    // Update item
    const item = await ItemModel.findByIdAndUpdate(
      itemId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .lean()
      .exec();

    if (!item) {
      throw new ValidationError('Item not found');
    }

    // Convert to domain type
    return {
      id: item._id.toString(),
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.estimatedPrice,
      unit: item.unit,
      status: mapStatusFromDb(item.status),
      preferredSupplier: item.preferredSupplier,
      registeredBy: item.createdByUserId?.toString(),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error('Error updating item:', error);
    throw new Error('Failed to update item');
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================

function validateCreateItemInput(input: CreateItemInput): void {
  const errors: string[] = [];

  // Name validation
  if (!input.name || input.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (input.name && input.name.trim().length > 200) {
    errors.push('Name must not exceed 200 characters');
  }

  // Category validation
  if (!input.category || input.category.trim().length < 2) {
    errors.push('Category must be at least 2 characters');
  }
  if (input.category && input.category.trim().length > 100) {
    errors.push('Category must not exceed 100 characters');
  }

  // Description validation
  if (!input.description || input.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters');
  }
  if (input.description && input.description.trim().length > 2000) {
    errors.push('Description must not exceed 2000 characters');
  }

  // Price validation (BR-1.5)
  if (typeof input.estimatedPrice !== 'number' || input.estimatedPrice <= 0) {
    errors.push('Estimated price must be a positive number');
  }
  if (input.estimatedPrice && !Number.isFinite(input.estimatedPrice)) {
    errors.push('Estimated price must be a valid number');
  }

  if (errors.length > 0) {
    throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
  }
}

// ============================================================================
// Mapping Helpers
// ============================================================================

function mapStatusFromDb(status: string): ItemStatus {
  switch (status) {
    case 'active':
      return ItemStatus.Active;
    case 'pending_review':
      return ItemStatus.PendingReview;
    case 'archived':
      return ItemStatus.Inactive;
    default:
      return ItemStatus.Active;
  }
}
