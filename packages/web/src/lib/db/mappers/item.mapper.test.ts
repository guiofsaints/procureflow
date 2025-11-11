import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import type { ItemDocument } from '@/domain/documents';
import { ItemStatus } from '@/domain/entities';

import { mapItemToEntity } from './item.mapper';

describe('item.mapper', () => {
  describe('mapItemToEntity', () => {
    it('should map item document to entity correctly', () => {
      const mockItem: ItemDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Wireless Mouse',
        category: 'Electronics',
        description: 'Ergonomic wireless mouse with USB receiver',
        price: 29.99,
        unit: 'each',
        status: ItemStatus.Active,
        preferredSupplier: 'TechSupply Inc.',
        registeredBy: new Types.ObjectId('507f1f77bcf86cd799439012'),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      };

      const result = mapItemToEntity(mockItem);

      expect(result).toEqual({
        id: '507f1f77bcf86cd799439011',
        name: 'Wireless Mouse',
        category: 'Electronics',
        description: 'Ergonomic wireless mouse with USB receiver',
        price: 29.99,
        unit: 'each',
        status: ItemStatus.Active,
        preferredSupplier: 'TechSupply Inc.',
        registeredBy: '507f1f77bcf86cd799439012',
        createdAt: mockItem.createdAt,
        updatedAt: mockItem.updatedAt,
      });
    });

    it('should convert ObjectId fields to strings', () => {
      const mockItem: ItemDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Office Chair',
        category: 'Furniture',
        description: 'Comfortable office chair',
        price: 199.99,
        status: ItemStatus.Active,
        registeredBy: new Types.ObjectId('507f1f77bcf86cd799439012'),
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapItemToEntity(mockItem);

      expect(typeof result.id).toBe('string');
      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect(typeof result.registeredBy).toBe('string');
      expect(result.registeredBy).toBe('507f1f77bcf86cd799439012');
    });

    it('should handle optional fields (unit, preferredSupplier, registeredBy)', () => {
      const mockItem: ItemDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Stapler',
        category: 'Office Supplies',
        description: 'Standard desk stapler',
        price: 9.99,
        status: ItemStatus.Active,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapItemToEntity(mockItem);

      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect(result.name).toBe('Stapler');
      expect(result.unit).toBeUndefined();
      expect(result.preferredSupplier).toBeUndefined();
      expect(result.registeredBy).toBeUndefined();
    });

    it('should handle Inactive status', () => {
      const mockItem: ItemDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Discontinued Item',
        category: 'Electronics',
        description: 'Old model laptop',
        price: 299.99,
        status: ItemStatus.Inactive,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
      };

      const result = mapItemToEntity(mockItem);

      expect(result.status).toBe(ItemStatus.Inactive);
    });

    it('should default to Active status if status is missing', () => {
      const mockItem: ItemDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Notebook',
        category: 'Office Supplies',
        description: 'Spiral notebook',
        price: 4.99,
        status: undefined as unknown as ItemStatus, // Simulate missing status
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapItemToEntity(mockItem);

      expect(result.status).toBe(ItemStatus.Active);
    });

    it('should handle string _id (legacy compatibility)', () => {
      const mockItem: ItemDocument = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Pen',
        category: 'Office Supplies',
        description: 'Blue ballpoint pen',
        price: 1.99,
        status: ItemStatus.Active,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapItemToEntity(mockItem);

      expect(result.id).toBe('507f1f77bcf86cd799439011');
    });

    it('should preserve price as number', () => {
      const mockItem: ItemDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Expensive Item',
        category: 'Electronics',
        description: 'High-end laptop',
        price: 1499.99,
        status: ItemStatus.Active,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapItemToEntity(mockItem);

      expect(typeof result.price).toBe('number');
      expect(result.price).toBe(1499.99);
    });

    it('should handle string registeredBy (legacy compatibility)', () => {
      const mockItem: ItemDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Monitor',
        category: 'Electronics',
        description: '24-inch LED monitor',
        price: 199.99,
        status: ItemStatus.Active,
        registeredBy: '507f1f77bcf86cd799439012',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapItemToEntity(mockItem);

      expect(result.registeredBy).toBe('507f1f77bcf86cd799439012');
    });
  });
});
