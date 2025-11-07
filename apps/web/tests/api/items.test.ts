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
      await (ItemModel as any).deleteMany({});
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
      await (ItemModel as any).deleteMany({});

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
});
