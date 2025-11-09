/**
 * Catalog API Tests
 *
 * Tests for item search and creation
 */

import { describe, it, expect, beforeEach } from 'vitest';

import * as catalogService from '@/features/catalog';
import { ItemModel } from '@/lib/db/models';

describe('Catalog Service', () => {
  describe('createItem', () => {
    // Clean up items before each test in this describe block
    beforeEach(async () => {
      await ItemModel.deleteMany({});
    });

    it('should create a new item successfully', async () => {
      const itemData = {
        name: 'Test USB Cable',
        category: 'Electronics',
        description: 'USB-C cable for testing purposes, 1 meter long',
        estimatedPrice: 15.99,
      };

      const item = await catalogService.createItem(itemData);

      expect(item).toBeDefined();
      expect(item.id).toBeDefined();
      expect(item.name).toBe(itemData.name);
      expect(item.category).toBe(itemData.category);
      expect(item.price).toBe(itemData.estimatedPrice);
    });

    it('should fail with invalid price', async () => {
      const itemData = {
        name: 'Test Item',
        category: 'Test',
        description: 'Test description for validation',
        estimatedPrice: -10, // Invalid price
      };

      await expect(catalogService.createItem(itemData)).rejects.toThrow();
    });

    it('should detect potential duplicates', async () => {
      // Create first item
      await catalogService.createItem({
        name: 'Office Chair',
        category: 'Furniture',
        description: 'Ergonomic office chair with adjustable height',
        estimatedPrice: 299.99,
      });

      // Try to create similar item
      await expect(
        catalogService.createItem({
          name: 'Office Chair',
          category: 'Furniture',
          description: 'Another ergonomic office chair',
          estimatedPrice: 319.99,
        })
      ).rejects.toThrow('duplicate');
    });
  });

  describe('searchItems', () => {
    beforeEach(async () => {
      // Clean up first
      await ItemModel.deleteMany({});

      // Then seed test items
      await catalogService.createItem({
        name: 'USB-C Cable',
        category: 'Electronics',
        description: 'High-speed USB-C cable, 2 meters',
        estimatedPrice: 12.99,
      });

      await catalogService.createItem({
        name: 'Wireless Mouse',
        category: 'Electronics',
        description: 'Bluetooth wireless mouse with ergonomic design',
        estimatedPrice: 29.99,
      });

      await catalogService.createItem({
        name: 'Office Desk',
        category: 'Furniture',
        description: 'Adjustable standing desk for office use',
        estimatedPrice: 499.99,
      });
    });

    it('should return all items when no search query provided', async () => {
      const items = await catalogService.searchItems({});

      expect(items).toHaveLength(3);
    });

    it('should search items by keyword', async () => {
      const items = await catalogService.searchItems({ q: 'USB' });

      expect(items.length).toBeGreaterThan(0);
      expect(items[0].name).toContain('USB');
    });

    it('should respect limit parameter', async () => {
      const items = await catalogService.searchItems({ limit: 2 });

      expect(items).toHaveLength(2);
    });

    it('should search across name, description, and category', async () => {
      const items = await catalogService.searchItems({ q: 'Electronics' });

      expect(items.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('updateItem', () => {
    let testItemId: string;

    beforeEach(async () => {
      // Clean up first
      await ItemModel.deleteMany({});

      // Create a test item
      const item = await catalogService.createItem({
        name: 'Test Laptop',
        category: 'Electronics',
        description: 'High-performance laptop for testing',
        estimatedPrice: 1299.99,
        unit: 'each',
        preferredSupplier: 'Tech Supplier Inc',
      });

      testItemId = item.id;
    });

    it('should update item name successfully', async () => {
      const updated = await catalogService.updateItem(testItemId, {
        name: 'Updated Laptop',
      });

      expect(updated.id).toBe(testItemId);
      expect(updated.name).toBe('Updated Laptop');
      expect(updated.category).toBe('Electronics'); // Unchanged
    });

    it('should update multiple fields', async () => {
      const updated = await catalogService.updateItem(testItemId, {
        name: 'Premium Laptop',
        estimatedPrice: 1499.99,
        description: 'Premium high-performance laptop',
      });

      expect(updated.name).toBe('Premium Laptop');
      expect(updated.price).toBe(1499.99);
      expect(updated.description).toBe('Premium high-performance laptop');
    });

    it('should fail with invalid price', async () => {
      await expect(
        catalogService.updateItem(testItemId, {
          estimatedPrice: -100,
        })
      ).rejects.toThrow('positive');
    });

    it('should fail with invalid name', async () => {
      await expect(
        catalogService.updateItem(testItemId, {
          name: 'A', // Too short
        })
      ).rejects.toThrow();
    });

    it('should fail with non-existent item ID', async () => {
      await expect(
        catalogService.updateItem('507f1f77bcf86cd799439011', {
          name: 'Updated Name',
        })
      ).rejects.toThrow('not found');
    });

    it('should trim whitespace in updated fields', async () => {
      const updated = await catalogService.updateItem(testItemId, {
        name: '  Trimmed Laptop  ',
        category: '  Electronics  ',
      });

      expect(updated.name).toBe('Trimmed Laptop');
      expect(updated.category).toBe('Electronics');
    });
  });
});
