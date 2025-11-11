/**
 * Cart Service Integration Tests
 *
 * Tests cart service with real MongoDB operations using mongodb-memory-server.
 * These tests verify the full integration including database operations.
 */

import { Types } from 'mongoose';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { ItemModel } from '@/lib/db/models';
import {
  clearTestDB,
  setupTestDB,
  teardownTestDB,
} from '@/test/integration/setup';
import { generateObjectId } from '@/test/utils/testHelpers';

import {
  addItemToCart,
  clearCart,
  getCartForUser,
  ItemNotFoundError,
  removeCartItem,
  updateCartItemQuantity,
  ValidationError,
} from './cart.service';

// Mock connectDB to prevent connecting to real MongoDB
vi.mock('@/lib/db/mongoose', () => {
  const mockConnectDB = vi.fn().mockResolvedValue({});
  return {
    connectDB: mockConnectDB,
    default: mockConnectDB,
    disconnectDB: vi.fn().mockResolvedValue(undefined),
  };
});

describe('cart.service - Integration Tests', () => {
  const testUserId = generateObjectId();

  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('getCartForUser', () => {
    it('should create new cart if not exists', async () => {
      const cart = await getCartForUser(testUserId);

      expect(cart).toBeDefined();
      expect(cart.userId).toBe(testUserId);
      expect(cart.items).toHaveLength(0);
      expect(cart.totalCost).toBe(0);
    });

    it('should return existing cart', async () => {
      // Create initial cart
      const cart1 = await getCartForUser(testUserId);

      // Get cart again
      const cart2 = await getCartForUser(testUserId);

      expect(cart1.id).toBe(cart2.id);
      expect(cart2.userId).toBe(testUserId);
    });

    it('should handle ObjectId userId', async () => {
      const objectIdUserId = new Types.ObjectId(testUserId);
      const cart = await getCartForUser(objectIdUserId);

      expect(cart.userId).toBe(testUserId);
    });
  });

  describe('addItemToCart', () => {
    it('should add item to empty cart', async () => {
      // Create test item
      const item = await ItemModel.create({
        name: 'Wireless Mouse',
        category: 'Electronics',
        description: 'Ergonomic wireless mouse with USB receiver',
        price: 29.99,
        estimatedPrice: 29.99,
        status: 'active',
      });

      const cart = await addItemToCart(testUserId, {
        itemId: item._id.toString(),
        quantity: 2,
      });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].itemName).toBe('Wireless Mouse');
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].itemPrice).toBe(29.99);
      expect(cart.items[0].subtotal).toBe(59.98);
    });

    it('should update quantity if item already in cart', async () => {
      const item = await ItemModel.create({
        name: 'Keyboard',
        category: 'Electronics',
        description: 'Mechanical keyboard',
        price: 79.99,
        estimatedPrice: 79.99,
        status: 'active',
      });

      // Add item first time
      await addItemToCart(testUserId, {
        itemId: item._id.toString(),
        quantity: 1,
      });

      // Add same item again
      const cart = await addItemToCart(testUserId, {
        itemId: item._id.toString(),
        quantity: 2,
      });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(3); // 1 + 2
      expect(cart.items[0].subtotal).toBeCloseTo(239.97, 2); // 79.99 * 3
    });

    it('should throw ItemNotFoundError for invalid item', async () => {
      const invalidItemId = generateObjectId();

      await expect(
        addItemToCart(testUserId, {
          itemId: invalidItemId,
          quantity: 1,
        })
      ).rejects.toThrow(ItemNotFoundError);
    });

    it('should throw ValidationError for invalid quantity', async () => {
      const item = await ItemModel.create({
        name: 'Item',
        category: 'Test',
        description: 'Test item for integration testing',
        price: 10.0,
        estimatedPrice: 10.0,
        status: 'active',
      });

      await expect(
        addItemToCart(testUserId, {
          itemId: item._id.toString(),
          quantity: 0, // Invalid: too low
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        addItemToCart(testUserId, {
          itemId: item._id.toString(),
          quantity: 1000, // Invalid: too high
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if total quantity exceeds max', async () => {
      const item = await ItemModel.create({
        name: 'Item',
        category: 'Test',
        description: 'Test item for integration testing',
        price: 10.0,
        estimatedPrice: 10.0,
        status: 'active',
      });

      // Add item with quantity 990
      await addItemToCart(testUserId, {
        itemId: item._id.toString(),
        quantity: 990,
      });

      // Try to add 10 more (total would be 1000, exceeding max 999)
      await expect(
        addItemToCart(testUserId, {
          itemId: item._id.toString(),
          quantity: 10,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should add multiple different items', async () => {
      const item1 = await ItemModel.create({
        name: 'Mouse',
        category: 'Electronics',
        description: 'Wireless mouse',
        price: 29.99,
        estimatedPrice: 29.99,
        status: 'active',
      });

      const item2 = await ItemModel.create({
        name: 'Keyboard',
        category: 'Electronics',
        description: 'Mechanical keyboard',
        price: 79.99,
        estimatedPrice: 79.99,
        status: 'active',
      });

      await addItemToCart(testUserId, {
        itemId: item1._id.toString(),
        quantity: 2,
      });

      const cart = await addItemToCart(testUserId, {
        itemId: item2._id.toString(),
        quantity: 1,
      });

      expect(cart.items).toHaveLength(2);
      expect(cart.totalCost).toBeCloseTo(139.97, 2); // 59.98 + 79.99
    });
  });

  describe('updateCartItemQuantity', () => {
    it('should update item quantity', async () => {
      const item = await ItemModel.create({
        name: 'Monitor',
        category: 'Electronics',
        description: '24-inch monitor',
        price: 199.99,
        estimatedPrice: 199.99,
        status: 'active',
      });

      await addItemToCart(testUserId, {
        itemId: item._id.toString(),
        quantity: 1,
      });

      const cart = await updateCartItemQuantity(
        testUserId,
        item._id.toString(),
        5
      );

      expect(cart.items[0].quantity).toBe(5);
      expect(cart.items[0].subtotal).toBeCloseTo(999.95, 2);
    });

    it('should throw ValidationError for invalid quantity', async () => {
      const item = await ItemModel.create({
        name: 'Item',
        category: 'Test',
        description: 'Test description for item',
        price: 10.0,
        estimatedPrice: 10.0,
        status: 'active',
      });

      await addItemToCart(testUserId, {
        itemId: item._id.toString(),
        quantity: 5,
      });

      await expect(
        updateCartItemQuantity(testUserId, item._id.toString(), 0)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if item not in cart', async () => {
      const itemId = generateObjectId();

      await expect(
        updateCartItemQuantity(testUserId, itemId, 5)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('removeCartItem', () => {
    it('should remove item from cart', async () => {
      const item = await ItemModel.create({
        name: 'Headphones',
        category: 'Electronics',
        description: 'Wireless headphones',
        price: 149.99,
        estimatedPrice: 149.99,
        status: 'active',
      });

      await addItemToCart(testUserId, {
        itemId: item._id.toString(),
        quantity: 1,
      });

      const cart = await removeCartItem(testUserId, item._id.toString());

      expect(cart.items).toHaveLength(0);
      expect(cart.totalCost).toBe(0);
    });

    it('should remove only specified item from multi-item cart', async () => {
      const item1 = await ItemModel.create({
        name: 'Item 1',
        category: 'Test',
        description: 'Test description 1',
        price: 10.0,
        estimatedPrice: 10.0,
        status: 'active',
      });

      const item2 = await ItemModel.create({
        name: 'Item 2',
        category: 'Test',
        description: 'Test description 2',
        price: 20.0,
        estimatedPrice: 20.0,
        status: 'active',
      });

      await addItemToCart(testUserId, {
        itemId: item1._id.toString(),
        quantity: 1,
      });

      await addItemToCart(testUserId, {
        itemId: item2._id.toString(),
        quantity: 1,
      });

      const cart = await removeCartItem(testUserId, item1._id.toString());

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].itemName).toBe('Item 2');
    });

    it('should throw ValidationError if item not in cart', async () => {
      const itemId = generateObjectId();

      await expect(removeCartItem(testUserId, itemId)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      const item = await ItemModel.create({
        name: 'Item',
        category: 'Test',
        description: 'Test description for item',
        price: 10.0,
        estimatedPrice: 10.0,
        status: 'active',
      });

      await addItemToCart(testUserId, {
        itemId: item._id.toString(),
        quantity: 5,
      });

      const cart = await clearCart(testUserId);

      expect(cart.items).toHaveLength(0);
      expect(cart.totalCost).toBe(0);
    });

    it('should work on empty cart', async () => {
      const cart = await clearCart(testUserId);

      expect(cart.items).toHaveLength(0);
      expect(cart.totalCost).toBe(0);
    });
  });

  describe('Cart Persistence', () => {
    it('should persist cart across multiple operations', async () => {
      const item1 = await ItemModel.create({
        name: 'Persistent Item 1',
        category: 'Test',
        description: 'Test description for item',
        price: 50.0,
        estimatedPrice: 50.0,
        status: 'active',
      });

      const item2 = await ItemModel.create({
        name: 'Persistent Item 2',
        category: 'Test',
        description: 'Test description for item',
        price: 75.0,
        estimatedPrice: 75.0,
        status: 'active',
      });

      // Add first item
      await addItemToCart(testUserId, {
        itemId: item1._id.toString(),
        quantity: 2,
      });

      // Add second item
      await addItemToCart(testUserId, {
        itemId: item2._id.toString(),
        quantity: 1,
      });

      // Update first item quantity
      await updateCartItemQuantity(testUserId, item1._id.toString(), 3);

      // Get cart to verify state
      const cart = await getCartForUser(testUserId);

      expect(cart.items).toHaveLength(2);
      expect(
        cart.items.find((i) => i.itemName === 'Persistent Item 1')?.quantity
      ).toBe(3);
      expect(
        cart.items.find((i) => i.itemName === 'Persistent Item 2')?.quantity
      ).toBe(1);
      expect(cart.totalCost).toBeCloseTo(225.0, 2); // (50 * 3) + (75 * 1)
    });
  });
});
