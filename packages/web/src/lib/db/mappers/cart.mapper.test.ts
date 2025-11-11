/**
 * Cart Mapper Unit Tests
 *
 * Tests for lib/db/mappers/cart.mapper.ts
 * Target: 100% coverage
 */

import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import type { CartDocument, CartItemDocument } from '@/domain/documents';

import { mapCartToEntity, mapCartItemToEntity } from './cart.mapper';

describe('cart.mapper', () => {
  describe('mapCartItemToEntity', () => {
    it('should map cart item document to entity correctly', () => {
      // Arrange
      const itemId = new Types.ObjectId();
      const mockItem: CartItemDocument = {
        itemId,
        name: 'Office Chair',
        unitPrice: 299.99,
        quantity: 2,
        subtotal: 599.98,
        addedAt: new Date('2024-01-01'),
      };

      // Act
      const result = mapCartItemToEntity(mockItem);

      // Assert
      expect(result).toEqual({
        itemId: itemId.toString(),
        itemName: 'Office Chair',
        itemPrice: 299.99,
        quantity: 2,
        subtotal: 599.98,
        addedAt: mockItem.addedAt,
      });
    });

    it('should calculate subtotal if not provided', () => {
      // Arrange
      const mockItem: CartItemDocument = {
        itemId: new Types.ObjectId(),
        name: 'Test Item',
        unitPrice: 10.5,
        quantity: 3,
        addedAt: new Date(),
      };

      // Act
      const result = mapCartItemToEntity(mockItem);

      // Assert
      expect(result.subtotal).toBe(31.5); // 10.5 * 3
    });

    it('should convert ObjectId to string', () => {
      // Arrange
      const itemId = new Types.ObjectId();
      const mockItem: CartItemDocument = {
        itemId,
        name: 'Test',
        unitPrice: 10,
        quantity: 1,
        addedAt: new Date(),
      };

      // Act
      const result = mapCartItemToEntity(mockItem);

      // Assert
      expect(typeof result.itemId).toBe('string');
      expect(result.itemId).toBe(itemId.toString());
    });
  });

  describe('mapCartToEntity', () => {
    it('should map cart document to entity correctly', () => {
      // Arrange
      const userId = new Types.ObjectId();
      const cartId = new Types.ObjectId();
      const itemId = new Types.ObjectId();

      const mockCartDoc: CartDocument = {
        _id: cartId,
        userId,
        items: [
          {
            itemId,
            name: 'Office Chair',
            unitPrice: 299.99,
            quantity: 2,
            subtotal: 599.98,
            addedAt: new Date('2024-01-01'),
          },
        ],
        totalCost: 599.98,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      // Act
      const result = mapCartToEntity(mockCartDoc);

      // Assert
      expect(result.id).toBe(cartId.toString());
      expect(result.userId).toBe(userId.toString());
      expect(result.items).toHaveLength(1);
      expect(result.items[0].itemId).toBe(itemId.toString());
      expect(result.items[0].itemName).toBe('Office Chair');
      expect(result.totalCost).toBe(599.98);
      expect(result.createdAt).toEqual(mockCartDoc.createdAt);
    });

    it('should handle empty cart', () => {
      // Arrange
      const mockCartDoc: CartDocument = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        items: [],
        totalCost: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const result = mapCartToEntity(mockCartDoc);

      // Assert
      expect(result.items).toEqual([]);
      expect(result.totalCost).toBe(0);
    });

    it('should calculate total cost from items if not provided', () => {
      // Arrange
      const mockCartDoc: CartDocument = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        items: [
          {
            itemId: new Types.ObjectId(),
            name: 'Item 1',
            unitPrice: 10,
            quantity: 2,
            subtotal: 20,
            addedAt: new Date(),
          },
          {
            itemId: new Types.ObjectId(),
            name: 'Item 2',
            unitPrice: 15,
            quantity: 1,
            subtotal: 15,
            addedAt: new Date(),
          },
        ],
        totalCost: 0, // Will be recalculated
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const result = mapCartToEntity(mockCartDoc);

      // Assert
      expect(result.totalCost).toBe(35); // 20 + 15
    });

    it('should handle multiple items in cart', () => {
      // Arrange
      const mockCartDoc: CartDocument = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        items: [
          {
            itemId: new Types.ObjectId(),
            name: 'Item 1',
            unitPrice: 10,
            quantity: 1,
            addedAt: new Date(),
          },
          {
            itemId: new Types.ObjectId(),
            name: 'Item 2',
            unitPrice: 20,
            quantity: 2,
            addedAt: new Date(),
          },
          {
            itemId: new Types.ObjectId(),
            name: 'Item 3',
            unitPrice: 30,
            quantity: 3,
            addedAt: new Date(),
          },
        ],
        totalCost: 140,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const result = mapCartToEntity(mockCartDoc);

      // Assert
      expect(result.items).toHaveLength(3);
      expect(result.items[0].itemName).toBe('Item 1');
      expect(result.items[1].itemName).toBe('Item 2');
      expect(result.items[2].itemName).toBe('Item 3');
    });

    it('should convert all ObjectIds to strings', () => {
      // Arrange
      const cartId = new Types.ObjectId();
      const userId = new Types.ObjectId();
      const itemId1 = new Types.ObjectId();
      const itemId2 = new Types.ObjectId();

      const mockCartDoc: CartDocument = {
        _id: cartId,
        userId,
        items: [
          {
            itemId: itemId1,
            name: 'Item 1',
            unitPrice: 10,
            quantity: 1,
            addedAt: new Date(),
          },
          {
            itemId: itemId2,
            name: 'Item 2',
            unitPrice: 20,
            quantity: 1,
            addedAt: new Date(),
          },
        ],
        totalCost: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const result = mapCartToEntity(mockCartDoc);

      // Assert
      expect(typeof result.id).toBe('string');
      expect(typeof result.userId).toBe('string');
      expect(typeof result.items[0].itemId).toBe('string');
      expect(typeof result.items[1].itemId).toBe('string');
      expect(result.id).toBe(cartId.toString());
      expect(result.userId).toBe(userId.toString());
      expect(result.items[0].itemId).toBe(itemId1.toString());
      expect(result.items[1].itemId).toBe(itemId2.toString());
    });
  });
});

