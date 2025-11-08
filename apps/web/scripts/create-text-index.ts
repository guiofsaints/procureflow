/**
 * Migration Script: Create Text Index on Items Collection
 *
 * This script creates a text index on the items collection to enable
 * full-text search using MongoDB's $text query operator.
 *
 * Usage:
 *   pnpm tsx apps/web/scripts/create-text-index.ts
 *
 * The script is idempotent - it can be run multiple times safely.
 */

import mongoose from 'mongoose';

// MongoDB connection URI from environment
const MONGODB_URI = process.env.MONGODB_URI;

async function createTextIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    const collection = db.collection('items');

    // Check if text index already exists
    const indexes = await collection.indexes();
    const hasTextIndex = indexes.some((index) =>
      Object.values(index.key || {}).includes('text')
    );

    if (hasTextIndex) {
      console.log('ℹ️  Text index already exists on items collection');
    } else {
      console.log('📝 Creating text index on items collection...');

      // Create text index on name, description, and category fields
      await collection.createIndex(
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

      console.log('✅ Text index created successfully');
    }

    // List all indexes for verification
    console.log('\n📊 Current indexes on items collection:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the migration
createTextIndex();
