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
    try {
      await ItemModel.collection.dropIndexes();
    } catch (_error) {
      // Ignore error if no indexes exist
      console.error('Note: No existing indexes to drop');
    }

    await ItemModel.init();
    await ItemModel.createIndexes();

    // Create text index explicitly for test database
    // (Schema has it commented out due to Turbopack compatibility)
    await ItemModel.collection.createIndex(
      {
        name: 'text',
        description: 'text',
        category: 'text',
      },
      {
        name: 'items_text_search_idx',
        weights: {
          name: 10, // Higher weight for name matches
          category: 5, // Medium weight for category matches
          description: 1, // Lower weight for description matches
        },
        default_language: 'english',
      }
    );
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
