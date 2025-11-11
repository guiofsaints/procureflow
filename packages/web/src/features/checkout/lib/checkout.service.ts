/**
 * Checkout Service
 *
 * Business logic for purchase request creation (simulated ERP submission):
 * - Validate cart contents
 * - Create purchase request with item snapshots
 * - Clear cart after successful checkout
 *
 * Enforces business rules from PRD (BR-4.x).
 */

import { Types } from 'mongoose';

import type { CartItemDocument } from '@/domain/documents';
import type { PurchaseRequest } from '@/domain/entities';
import { PurchaseRequestStatus } from '@/domain/entities';
import { mapPurchaseRequestToEntity } from '@/lib/db/mappers';
import { CartModel, ItemModel, PurchaseRequestModel } from '@/lib/db/models';
import connectDB from '@/lib/db/mongoose';
import { logger } from '@/lib/logger/winston.config';

// ============================================================================
// Error Classes
// ============================================================================

export class EmptyCartError extends Error {
  constructor() {
    super('Cart is empty. Add items before checking out.');
    this.name = 'EmptyCartError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Checkout cart and create purchase request
 *
 * Business Rules:
 * - BR-4.1: Cart must contain at least 1 item
 * - BR-4.2: Generate unique purchase request ID
 * - BR-4.3: Record with timestamp, user ID, items, total
 * - BR-2.7: Clear cart after successful checkout
 *
 * @param userId - User ID (ObjectId or string)
 * @param notes - Optional notes/justification
 * @returns Created purchase request
 */
export async function checkoutCart(
  userId: string | Types.ObjectId,
  notes?: string
): Promise<PurchaseRequest> {
  await connectDB();

  try {
    const cart = await CartModel.findOne({ userId }).exec();

    if (!cart) {
      throw new EmptyCartError();
    }

    // BR-4.1: Validate cart has at least 1 item
    if (!cart.items || cart.items.length === 0) {
      throw new EmptyCartError();
    }

    // Generate request number (format: PR-YYYY-####)
    const requestNumber = await generateRequestNumber();

    // Fetch item details to get category and description
    const itemIds = cart.items.map((cartItem) => cartItem.itemId);
    const items = await ItemModel.find({ _id: { $in: itemIds } })
      .lean()
      .exec();

    // Create a map of itemId -> item details
    const itemMap = new Map(items.map((item) => [item._id.toString(), item]));

    // Create purchase request items (immutable snapshots)
    const requestItems = cart.items.map((cartItem: CartItemDocument) => {
      const itemDetails = itemMap.get(cartItem.itemId.toString());
      return {
        itemId: cartItem.itemId,
        name: cartItem.name,
        category: itemDetails?.category || 'General',
        description: itemDetails?.description || '',
        unitPrice: cartItem.unitPrice,
        quantity: cartItem.quantity,
        subtotal: cartItem.unitPrice * cartItem.quantity,
      };
    });

    // Calculate total
    const total = requestItems.reduce(
      (sum: number, item) => sum + item.subtotal,
      0
    );

    // Create purchase request
    const purchaseRequest = new PurchaseRequestModel({
      requestNumber,
      userId,
      items: requestItems,
      total,
      notes: notes || '',
      source: 'ui',
      status: 'submitted',
    });

    const savedRequest = await purchaseRequest.save();

    // Clear cart (BR-2.7)
    cart.items = [];
    await cart.save();

    // Map to domain entity
    return mapPurchaseRequestToEntity(savedRequest);
  } catch (error) {
    if (error instanceof EmptyCartError || error instanceof ValidationError) {
      throw error;
    }
    logger.error('Error during checkout', { userId, error });
    throw new Error('Failed to complete checkout');
  }
}

/**
 * Get all purchase requests for a user
 *
 * @param userId - User ID (ObjectId or string)
 * @param filters - Optional filters (status)
 * @returns List of purchase requests
 */
export async function getPurchaseRequestsForUser(
  userId: string | Types.ObjectId,
  filters?: { status?: PurchaseRequestStatus }
): Promise<PurchaseRequest[]> {
  await connectDB();

  try {
    // Convert userId to ObjectId if it's a string to ensure proper comparison
    const userIdObj =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    // Build query
    const query: { userId: Types.ObjectId; status?: string } = {
      userId: userIdObj,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    // Fetch purchase requests
    const requests = await PurchaseRequestModel.find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .lean()
      .exec();

    // Map to domain entities
    return requests.map(mapPurchaseRequestToEntity);
  } catch (error) {
    logger.error('Error fetching purchase requests', { userId, error });
    throw new Error('Failed to fetch purchase requests');
  }
}

/**
 * Get a single purchase request by ID
 *
 * @param userId - User ID (for authorization) (ObjectId or string)
 * @param requestId - Purchase request ID
 * @returns Purchase request or null if not found
 */
export async function getPurchaseRequestById(
  userId: string | Types.ObjectId,
  requestId: string
): Promise<PurchaseRequest | null> {
  await connectDB();

  try {
    // Convert userId to ObjectId if it's a string to ensure proper comparison
    const userIdObj =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const request = await PurchaseRequestModel.findOne({
      _id: requestId,
      userId: userIdObj,
    })
      .lean()
      .exec();

    if (!request) {
      return null;
    }

    // Map to domain entity
    return mapPurchaseRequestToEntity(request);
  } catch (error) {
    logger.error('Error fetching purchase request', {
      userId,
      requestId,
      error,
    });
    throw new Error('Failed to fetch purchase request');
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate unique purchase request number
 * Format: PR-YYYY-####
 */
async function generateRequestNumber(): Promise<string> {
  const year = new Date().getFullYear();

  // Find the last request number for this year
  const lastRequest = await PurchaseRequestModel.findOne({
    requestNumber: new RegExp(`^PR-${year}-`),
  })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  let sequence = 1;
  if (lastRequest && lastRequest.requestNumber) {
    const match = lastRequest.requestNumber.match(/PR-\d{4}-(\d{4})$/);
    if (match) {
      sequence = parseInt(match[1], 10) + 1;
    }
  }

  const paddedSequence = sequence.toString().padStart(4, '0');
  return `PR-${year}-${paddedSequence}`;
}
