/**
 * MongoDB Test Mocks
 *
 * Mock implementations of Mongoose models and database operations
 * for testing without a real database connection.
 */

import { vi } from 'vitest';

/**
 * Mock Mongoose Document
 */
export const createMockDocument = <T extends Record<string, unknown>>(
  data: T
) => {
  return {
    ...data,
    _id: data._id || '507f1f77bcf86cd799439011',
    toObject: vi.fn(() => data),
    toJSON: vi.fn(() => data),
    save: vi.fn().mockResolvedValue(data),
    remove: vi.fn().mockResolvedValue(data),
    deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
  };
};

/**
 * Mock Mongoose Model
 */
export const createMockModel = <T extends Record<string, unknown>>() => {
  const mockData: T[] = [];

  return {
    find: vi.fn().mockReturnThis(),
    findOne: vi.fn().mockReturnThis(),
    findById: vi.fn().mockReturnThis(),
    findByIdAndUpdate: vi.fn().mockReturnThis(),
    findByIdAndDelete: vi.fn().mockReturnThis(),
    findOneAndUpdate: vi.fn().mockReturnThis(),
    findOneAndDelete: vi.fn().mockReturnThis(),
    create: vi.fn((data: T) => {
      const doc = createMockDocument(data);
      mockData.push(data);
      return Promise.resolve(doc);
    }),
    deleteMany: vi.fn().mockResolvedValue({ deletedCount: mockData.length }),
    countDocuments: vi.fn().mockResolvedValue(mockData.length),
    aggregate: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    lean: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(mockData),
  };
};

/**
 * Mock MongoDB connection
 */
export const mockConnectDB = vi.fn().mockResolvedValue(undefined);

/**
 * Mock data clearing utility
 */
export const clearMockData = () => {
  vi.clearAllMocks();
};
