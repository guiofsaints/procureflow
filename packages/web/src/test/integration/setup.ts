/**
 * MongoDB Memory Server Setup for Integration Tests
 *
 * Provides an in-memory MongoDB instance for testing database operations
 * without requiring an external MongoDB server.
 *
 * Usage in tests:
 * ```typescript
 * import { setupTestDB, teardownTestDB, clearTestDB } from '@/test/integration/setup';
 *
 * // Mock connectDB in your test file before importing services:
 * vi.mock('@/lib/db/mongoose', () => ({
 *   connectDB: vi.fn().mockResolvedValue({}),
 *   disconnectDB: vi.fn().mockResolvedValue(undefined),
 * }));
 *
 * beforeAll(async () => {
 *   await setupTestDB();
 * });
 *
 * afterEach(async () => {
 *   await clearTestDB();
 * });
 *
 * afterAll(async () => {
 *   await teardownTestDB();
 * });
 * ```
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer | null = null;

// Clear mongoose cached connection before tests
function clearMongooseCache() {
  if (globalThis.mongoose) {
    globalThis.mongoose = {
      conn: null,
      promise: null,
    };
  }
}

/**
 * Set up test database
 * Creates an in-memory MongoDB instance and connects Mongoose
 */
export async function setupTestDB(): Promise<void> {
  // Clear mongoose cache and disconnect if already connected
  clearMongooseCache();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '7.0.0', // Match production MongoDB version
    },
  });

  const mongoUri = mongoServer.getUri();

  // Connect Mongoose to memory server
  await mongoose.connect(mongoUri);
}

/**
 * Disconnect Mongoose and stop MongoDB Memory Server
 */
export async function teardownTestDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

/**
 * Clear all collections in the test database
 * Use between tests to ensure clean state
 */
export async function clearTestDB(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    throw new Error('Database not connected. Call setupTestDB() first.');
  }

  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}

/**
 * Get the MongoDB URI for the test database
 * Useful for debugging or manual connections
 */
export function getTestDBUri(): string | null {
  return mongoServer?.getUri() || null;
}
