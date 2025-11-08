/**
 * Vitest Setup
 *
 * Global setup for API tests
 */

// IMPORTANT: Set MongoDB URI before any imports
process.env.MONGODB_URI =
  process.env.MONGODB_TEST_URI ||
  'mongodb://admin:password@localhost:27017/procureflow_test?authSource=admin';

import { beforeAll, afterAll } from 'vitest';

import { ItemModel } from '@/lib/db/models';
import connectDB, { disconnectDB } from '@/lib/db/mongoose';

// Connect to test database before all tests
beforeAll(async () => {
  try {
    await connectDB();

    // Ensure indexes are created (required for text search)
    // Drop existing indexes and recreate to pick up schema changes
    await ItemModel.collection.dropIndexes();
    await ItemModel.init();
    await ItemModel.createIndexes();
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
});

// Disconnect after all tests
afterAll(async () => {
  try {
    await disconnectDB();
    console.error('✅ Disconnected from test database');
  } catch (error) {
    console.error('❌ Failed to disconnect from test database:', error);
  }
});
