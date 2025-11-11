import { describe, expect, it } from 'vitest';

import {
  CartLimitError,
  ItemNotFoundError,
  ValidationError,
} from './cart.service';

/**
 * Cart Service Tests
 *
 * These tests cover the error classes and business logic validation.
 * Full integration tests with MongoDB would require a test database setup.
 *
 * Testing Strategy:
 * 1. Error classes (unit tests)
 * 2. Business logic validation (would require MongoDB mocking or test DB)
 *
 * Note: Service methods that interact with MongoDB (getCartForUser, addItemToCart, etc.)
 * are better tested through integration tests with a real or containerized database.
 */
describe('cart.service', () => {
  describe('Error Classes', () => {
    it('should create ValidationError with correct name and message', () => {
      const error = new ValidationError('Invalid quantity');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid quantity');
    });

    it('should create ItemNotFoundError with correct name and formatted message', () => {
      const itemId = '507f1f77bcf86cd799439011';
      const error = new ItemNotFoundError(itemId);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ItemNotFoundError');
      expect(error.message).toBe(`Item not found: ${itemId}`);
      expect(error.message).toContain(itemId);
    });

    it('should create CartLimitError with correct name and message', () => {
      const error = new CartLimitError('Cart is full');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('CartLimitError');
      expect(error.message).toBe('Cart is full');
    });

    it('should inherit from Error class', () => {
      const validationError = new ValidationError('test');
      const itemNotFoundError = new ItemNotFoundError('test-id');
      const cartLimitError = new CartLimitError('test');

      expect(validationError instanceof Error).toBe(true);
      expect(itemNotFoundError instanceof Error).toBe(true);
      expect(cartLimitError instanceof Error).toBe(true);
    });

    it('should set error name property correctly', () => {
      const validationError = new ValidationError('test');
      const itemNotFoundError = new ItemNotFoundError('id');
      const cartLimitError = new CartLimitError('test');

      expect(validationError.name).toBe('ValidationError');
      expect(itemNotFoundError.name).toBe('ItemNotFoundError');
      expect(cartLimitError.name).toBe('CartLimitError');
    });
  });

  // Integration tests for service methods would go here
  // These require MongoDB connection or advanced mocking
  // Consider using:
  // - mongodb-memory-server for in-memory MongoDB
  // - Docker container for MongoDB in CI
  // - Test fixtures with actual database
});
