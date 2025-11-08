/**
 * Cart and Checkout Tests
 *
 * Tests for cart operations and checkout flow
 */

import { Types } from 'mongoose';
import { describe, it, expect, beforeEach } from 'vitest';

import * as cartService from '@/features/cart';
import * as catalogService from '@/features/catalog';
import * as checkoutService from '@/features/checkout';
import { ItemModel, CartModel, PurchaseRequestModel } from '@/lib/db/models';

describe('Cart and Checkout Flow', () => {
  const testUserId = new Types.ObjectId(); // Keep as ObjectId, not string
  let testItemId: string;

  // Clean up before each test
  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (ItemModel as any).deleteMany({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (CartModel as any).deleteMany({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (PurchaseRequestModel as any).deleteMany({});

    // Create a test item
    const item = await catalogService.createItem({
      name: 'Test Product',
      category: 'Test Category',
      description: 'A test product for cart and checkout testing',
      estimatedPrice: 49.99,
    });
    testItemId = item.id;
  });

  describe('Cart Operations', () => {
    it('should create empty cart for user', async () => {
      const cart = await cartService.getCartForUser(testUserId);

      expect(cart).toBeDefined();
      expect(cart.userId).toBe(testUserId);
      expect(cart.items).toHaveLength(0);
      expect(cart.totalCost).toBe(0);
    });

    it('should add item to cart', async () => {
      const cart = await cartService.addItemToCart(testUserId, {
        itemId: testItemId,
        quantity: 2,
      });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].itemId).toBe(testItemId);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.totalCost).toBe(99.98); // 49.99 * 2
    });

    it('should update item quantity in cart', async () => {
      // Add item first
      await cartService.addItemToCart(testUserId, {
        itemId: testItemId,
        quantity: 1,
      });

      // Update quantity
      const cart = await cartService.updateCartItemQuantity(
        testUserId,
        testItemId,
        5
      );

      expect(cart.items[0].quantity).toBe(5);
      expect(cart.totalCost).toBeCloseTo(249.95, 2); // 49.99 * 5
    });

    it('should remove item from cart', async () => {
      // Add item first
      await cartService.addItemToCart(testUserId, {
        itemId: testItemId,
        quantity: 1,
      });

      // Remove item
      const cart = await cartService.removeCartItem(testUserId, testItemId);

      expect(cart.items).toHaveLength(0);
      expect(cart.totalCost).toBe(0);
    });

    it('should enforce quantity limits (1-999)', async () => {
      await expect(
        cartService.addItemToCart(testUserId, {
          itemId: testItemId,
          quantity: 0,
        })
      ).rejects.toThrow();

      await expect(
        cartService.addItemToCart(testUserId, {
          itemId: testItemId,
          quantity: 1000,
        })
      ).rejects.toThrow();
    });
  });

  describe('Checkout Flow', () => {
    beforeEach(async () => {
      // Add items to cart before each checkout test
      await cartService.addItemToCart(testUserId, {
        itemId: testItemId,
        quantity: 3,
      });
    });

    it('should complete checkout and create purchase request', async () => {
      const purchaseRequest = await checkoutService.checkoutCart(
        testUserId,
        'Test order notes'
      );

      expect(purchaseRequest).toBeDefined();
      expect(purchaseRequest.id).toBeDefined();
      expect(purchaseRequest.userId).toBe(testUserId);
      expect(purchaseRequest.items).toHaveLength(1);
      expect(purchaseRequest.items[0].quantity).toBe(3);
      expect(purchaseRequest.totalCost).toBe(149.97); // 49.99 * 3
      expect(purchaseRequest.notes).toBe('Test order notes');
    });

    it('should clear cart after successful checkout', async () => {
      await checkoutService.checkoutCart(testUserId);

      const cart = await cartService.getCartForUser(testUserId);
      expect(cart.items).toHaveLength(0);
    });

    it('should fail checkout with empty cart', async () => {
      // Clear cart first
      await cartService.clearCart(testUserId);

      await expect(checkoutService.checkoutCart(testUserId)).rejects.toThrow(
        'empty'
      );
    });

    it('should generate unique purchase request numbers', async () => {
      const pr1 = await checkoutService.checkoutCart(testUserId);

      // Add items again and checkout
      await cartService.addItemToCart(testUserId, {
        itemId: testItemId,
        quantity: 1,
      });
      const pr2 = await checkoutService.checkoutCart(testUserId);

      expect(pr1.id).not.toBe(pr2.id);
    });
  });

  describe('Full Journey: Browse -> Cart -> Checkout', () => {
    it('should complete full procurement journey', async () => {
      // 1. Search for items
      const items = await catalogService.searchItems({ q: 'Test' });
      expect(items.length).toBeGreaterThan(0);

      // 2. Add to cart
      const cart = await cartService.addItemToCart(testUserId, {
        itemId: items[0].id,
        quantity: 2,
      });
      expect(cart.items).toHaveLength(1);

      // 3. Update quantity
      const updatedCart = await cartService.updateCartItemQuantity(
        testUserId,
        items[0].id,
        4
      );
      expect(updatedCart.items[0].quantity).toBe(4);

      // 4. Checkout
      const purchaseRequest = await checkoutService.checkoutCart(testUserId);
      expect(purchaseRequest.items[0].quantity).toBe(4);

      // 5. Verify cart is empty
      const finalCart = await cartService.getCartForUser(testUserId);
      expect(finalCart.items).toHaveLength(0);
    });
  });
});
