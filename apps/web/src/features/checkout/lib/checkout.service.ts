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

import type { Types } from 'mongoose';

import type { PurchaseRequest } from '@/domain/entities';
import { PurchaseRequestStatus } from '@/domain/entities';
import { CartModel, ItemModel, PurchaseRequestModel } from '@/lib/db/models';
import connectDB from '@/lib/db/mongoose';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cart: any = await (CartModel as any).findOne({ userId }).exec();

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
    const itemIds = cart.items.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cartItem: any) => cartItem.itemId
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = await (ItemModel as any)
      .find({ _id: { $in: itemIds } })
      .lean()
      .exec();

    // Create a map of itemId -> item details
    const itemMap = new Map(items.map((item) => [item._id.toString(), item]));

    // Create purchase request items (immutable snapshots)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestItems = cart.items.map((cartItem: any) => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, item: any) => sum + item.subtotal,
      0
    );

    // Create purchase request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const purchaseRequest = new (PurchaseRequestModel as any)({
      requestNumber,
      userId,
      items: requestItems,
      total,
      notes: notes || '',
      source: 'ui',
      status: 'submitted',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const savedRequest: any = await purchaseRequest.save();

    // Clear cart (BR-2.7)
    cart.items = [];
    await cart.save();

    // Map to DTO
    return {
      id: savedRequest._id.toString(),
      userId: savedRequest.userId.toString(),
      items: savedRequest.items.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => ({
          itemId: item.itemId?.toString() || '',
          itemName: item.name,
          itemCategory: item.category,
          itemDescription: item.description,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })
      ),
      totalCost: savedRequest.total,
      notes: savedRequest.notes,
      status: PurchaseRequestStatus.Submitted,
      createdAt: savedRequest.createdAt,
      updatedAt: savedRequest.updatedAt,
    };
  } catch (error) {
    if (error instanceof EmptyCartError || error instanceof ValidationError) {
      throw error;
    }
    console.error('Error during checkout:', error);
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
    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { userId };

    if (filters?.status) {
      query.status = filters.status;
    }

    // Fetch purchase requests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requests: any[] = await (PurchaseRequestModel as any)
      .find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .lean()
      .exec();

    // Map to DTOs
    return requests.map((request) => ({
      id: request._id.toString(),
      userId: request.userId.toString(),
      items: request.items.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => ({
          itemId: item.itemId?.toString() || '',
          itemName: item.name,
          itemCategory: item.category,
          itemDescription: item.description,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })
      ),
      totalCost: request.total,
      notes: request.notes || '',
      status: request.status as PurchaseRequestStatus,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request: any = await (PurchaseRequestModel as any)
      .findOne({ _id: requestId, userId })
      .lean()
      .exec();

    if (!request) {
      return null;
    }

    // Map to DTO
    return {
      id: request._id.toString(),
      userId: request.userId.toString(),
      items: request.items.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => ({
          itemId: item.itemId?.toString() || '',
          itemName: item.name,
          itemCategory: item.category,
          itemDescription: item.description,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })
      ),
      totalCost: request.total,
      notes: request.notes || '',
      status: request.status as PurchaseRequestStatus,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching purchase request:', error);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastRequest: any = await (PurchaseRequestModel as any)
    .findOne({ requestNumber: new RegExp(`^PR-${year}-`) })
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
