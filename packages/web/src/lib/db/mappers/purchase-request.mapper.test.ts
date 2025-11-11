import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import type {
  PurchaseRequestDocument,
  PurchaseRequestItemDocument,
} from '@/domain/documents';
import { PurchaseRequestStatus } from '@/domain/entities';

import {
  mapPurchaseRequestItemToEntity,
  mapPurchaseRequestToEntity,
} from './purchase-request.mapper';

describe('purchase-request.mapper', () => {
  describe('mapPurchaseRequestItemToEntity', () => {
    it('should map purchase request item document to entity correctly', () => {
      const mockItem: PurchaseRequestItemDocument = {
        itemId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Wireless Mouse',
        category: 'Electronics',
        description: 'Ergonomic wireless mouse',
        unitPrice: 29.99,
        quantity: 3,
        subtotal: 89.97,
      };

      const result = mapPurchaseRequestItemToEntity(mockItem);

      expect(result).toEqual({
        itemId: '507f1f77bcf86cd799439011',
        itemName: 'Wireless Mouse',
        itemCategory: 'Electronics',
        itemDescription: 'Ergonomic wireless mouse',
        unitPrice: 29.99,
        quantity: 3,
        subtotal: 89.97,
      });
    });

    it('should convert ObjectId itemId to string', () => {
      const mockItem: PurchaseRequestItemDocument = {
        itemId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Keyboard',
        category: 'Electronics',
        description: 'Mechanical keyboard',
        unitPrice: 79.99,
        quantity: 1,
        subtotal: 79.99,
      };

      const result = mapPurchaseRequestItemToEntity(mockItem);

      expect(typeof result.itemId).toBe('string');
      expect(result.itemId).toBe('507f1f77bcf86cd799439011');
    });

    it('should handle null itemId (deleted catalog item)', () => {
      const mockItem: PurchaseRequestItemDocument = {
        itemId: null,
        name: 'Discontinued Monitor',
        category: 'Electronics',
        description: 'Old model monitor',
        unitPrice: 199.99,
        quantity: 1,
        subtotal: 199.99,
      };

      const result = mapPurchaseRequestItemToEntity(mockItem);

      expect(result.itemId).toBe('');
    });

    it('should handle string itemId (legacy compatibility)', () => {
      const mockItem: PurchaseRequestItemDocument = {
        itemId: '507f1f77bcf86cd799439011',
        name: 'Office Chair',
        category: 'Furniture',
        description: 'Ergonomic office chair',
        unitPrice: 299.99,
        quantity: 2,
        subtotal: 599.98,
      };

      const result = mapPurchaseRequestItemToEntity(mockItem);

      expect(result.itemId).toBe('507f1f77bcf86cd799439011');
    });
  });

  describe('mapPurchaseRequestToEntity', () => {
    it('should map purchase request document to entity correctly', () => {
      const mockRequest: PurchaseRequestDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        requestNumber: 'PR-2024-0001',
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439013'),
            name: 'Wireless Mouse',
            category: 'Electronics',
            description: 'Ergonomic wireless mouse',
            unitPrice: 29.99,
            quantity: 2,
            subtotal: 59.98,
          },
        ],
        total: 59.98,
        notes: 'Urgent purchase request for new employee',
        source: 'ui',
        status: PurchaseRequestStatus.Submitted,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      };

      const result = mapPurchaseRequestToEntity(mockRequest);

      expect(result).toEqual({
        id: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        requestNumber: 'PR-2024-0001',
        items: [
          {
            itemId: '507f1f77bcf86cd799439013',
            itemName: 'Wireless Mouse',
            itemCategory: 'Electronics',
            itemDescription: 'Ergonomic wireless mouse',
            unitPrice: 29.99,
            quantity: 2,
            subtotal: 59.98,
          },
        ],
        total: 59.98,
        notes: 'Urgent purchase request for new employee',
        source: 'ui',
        status: PurchaseRequestStatus.Submitted,
        createdAt: mockRequest.createdAt,
        updatedAt: mockRequest.updatedAt,
      });
    });

    it('should convert all ObjectId fields to strings', () => {
      const mockRequest: PurchaseRequestDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        requestNumber: 'PR-2024-0002',
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439013'),
            name: 'Keyboard',
            category: 'Electronics',
            description: 'Mechanical keyboard',
            unitPrice: 79.99,
            quantity: 1,
            subtotal: 79.99,
          },
        ],
        total: 79.99,
        source: 'ui',
        status: PurchaseRequestStatus.Submitted,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapPurchaseRequestToEntity(mockRequest);

      expect(typeof result.id).toBe('string');
      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect(typeof result.userId).toBe('string');
      expect(result.userId).toBe('507f1f77bcf86cd799439012');
      expect(typeof result.items[0].itemId).toBe('string');
      expect(result.items[0].itemId).toBe('507f1f77bcf86cd799439013');
    });

    it('should handle multiple items in purchase request', () => {
      const mockRequest: PurchaseRequestDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        requestNumber: 'PR-2024-0003',
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439013'),
            name: 'Notebook',
            category: 'Office Supplies',
            description: 'Spiral notebook',
            unitPrice: 4.99,
            quantity: 10,
            subtotal: 49.9,
          },
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439014'),
            name: 'Pen Pack',
            category: 'Office Supplies',
            description: 'Blue pens (10 pack)',
            unitPrice: 5.99,
            quantity: 5,
            subtotal: 29.95,
          },
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439015'),
            name: 'Stapler',
            category: 'Office Supplies',
            description: 'Desktop stapler',
            unitPrice: 9.99,
            quantity: 2,
            subtotal: 19.98,
          },
        ],
        total: 99.83,
        source: 'ui',
        status: PurchaseRequestStatus.Submitted,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapPurchaseRequestToEntity(mockRequest);

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(99.83);
      expect(result.items[0].itemName).toBe('Notebook');
      expect(result.items[1].itemName).toBe('Pen Pack');
      expect(result.items[2].itemName).toBe('Stapler');
    });

    it('should handle empty notes as empty string', () => {
      const mockRequest: PurchaseRequestDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        requestNumber: 'PR-2024-0004',
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439013'),
            name: 'Marker',
            category: 'Office Supplies',
            description: 'Permanent marker',
            unitPrice: 2.99,
            quantity: 3,
            subtotal: 8.97,
          },
        ],
        total: 8.97,
        notes: undefined,
        source: 'agent',
        status: PurchaseRequestStatus.Approved,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapPurchaseRequestToEntity(mockRequest);

      expect(result.notes).toBe('');
    });

    it('should handle agent source', () => {
      const mockRequest: PurchaseRequestDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        requestNumber: 'PR-2024-0005',
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439013'),
            name: 'Monitor',
            category: 'Electronics',
            description: '24-inch LED monitor',
            unitPrice: 199.99,
            quantity: 1,
            subtotal: 199.99,
          },
        ],
        total: 199.99,
        source: 'agent',
        status: PurchaseRequestStatus.Submitted,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapPurchaseRequestToEntity(mockRequest);

      expect(result.source).toBe('agent');
    });

    it('should handle different purchase request statuses', () => {
      const mockRequest: PurchaseRequestDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        requestNumber: 'PR-2024-0006',
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439013'),
            name: 'Laptop',
            category: 'Electronics',
            description: 'Business laptop',
            unitPrice: 1299.99,
            quantity: 1,
            subtotal: 1299.99,
          },
        ],
        total: 1299.99,
        source: 'ui',
        status: PurchaseRequestStatus.Approved,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-16'),
      };

      const result = mapPurchaseRequestToEntity(mockRequest);

      expect(result.status).toBe(PurchaseRequestStatus.Approved);
    });

    it('should map field names correctly (total -> totalCost)', () => {
      const mockRequest: PurchaseRequestDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        requestNumber: 'PR-2024-0007',
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439013'),
            name: 'Item',
            category: 'Category',
            description: 'Description',
            unitPrice: 100.0,
            quantity: 1,
            subtotal: 100.0,
          },
        ],
        total: 100.0,
        source: 'ui',
        status: PurchaseRequestStatus.Submitted,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapPurchaseRequestToEntity(mockRequest);

      expect(result.total).toBe(100.0);
      expect(result).not.toHaveProperty('totalCost');
    });

    it('should handle items with null itemId (deleted catalog items)', () => {
      const mockRequest: PurchaseRequestDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        requestNumber: 'PR-2024-0008',
        items: [
          {
            itemId: null,
            name: 'Deleted Item',
            category: 'Unknown',
            description: 'This item no longer exists in catalog',
            unitPrice: 50.0,
            quantity: 2,
            subtotal: 100.0,
          },
        ],
        total: 100.0,
        source: 'ui',
        status: PurchaseRequestStatus.Submitted,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapPurchaseRequestToEntity(mockRequest);

      expect(result.items[0].itemId).toBe('');
    });
  });
});
