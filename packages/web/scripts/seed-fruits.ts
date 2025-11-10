/**
 * Seed Fruits Script
 *
 * Adds fruit items to the catalog for testing search functionality.
 *
 * Usage:
 *   pnpm db:seed-fruits
 */

/* eslint-disable no-console */

import path from 'path';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// MongoDB connection URI from environment
const MONGODB_URI = process.env.MONGODB_URI;

// Fruit items data
const fruitItems = [
  {
    name: 'Orange',
    description: 'Fresh and juicy orange, rich in vitamin C',
    category: 'Fruits',
    estimatedPrice: 3.5,
    unit: 'kg',
    preferredSupplier: 'Local Produce',
    status: 'active',
  },
  {
    name: 'Banana',
    description: 'Ripe banana, source of potassium',
    category: 'Fruits',
    estimatedPrice: 4.2,
    unit: 'kg',
    preferredSupplier: 'Local Produce',
    status: 'active',
  },
  {
    name: 'Apple',
    description: 'Crispy and sweet Fuji apple',
    category: 'Fruits',
    estimatedPrice: 6.8,
    unit: 'kg',
    preferredSupplier: 'Local Produce',
    status: 'active',
  },
  {
    name: 'Strawberry',
    description: 'Fresh and aromatic strawberry',
    category: 'Fruits',
    estimatedPrice: 12.0,
    unit: 'kg',
    preferredSupplier: 'Local Produce',
    status: 'active',
  },
  {
    name: 'Pineapple',
    description: 'Ripe and sweet pineapple',
    category: 'Fruits',
    estimatedPrice: 8.5,
    unit: 'unit',
    preferredSupplier: 'Local Produce',
    status: 'active',
  },
  {
    name: 'Grape',
    description: 'Seedless grape, sweet and refreshing',
    category: 'Fruits',
    estimatedPrice: 9.9,
    unit: 'kg',
    preferredSupplier: 'Local Produce',
    status: 'active',
  },
  {
    name: 'Watermelon',
    description: 'Sweet and juicy watermelon, perfect for hot days',
    category: 'Fruits',
    estimatedPrice: 15.0,
    unit: 'unit',
    preferredSupplier: 'Local Produce',
    status: 'active',
  },
  {
    name: 'Mango',
    description: 'Ripe and aromatic Tommy mango',
    category: 'Fruits',
    estimatedPrice: 7.5,
    unit: 'kg',
    preferredSupplier: 'Local Produce',
    status: 'active',
  },
];

async function seedFruits() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    const collection = db.collection('items');

    // Check if fruits already exist (both Portuguese and English categories)
    const existingFruits = await collection.countDocuments({
      $or: [{ category: 'Frutas' }, { category: 'Fruits' }],
    });

    if (existingFruits > 0) {
      console.log(
        `ℹ️  Found ${existingFruits} existing fruit items. Clearing old fruits...`
      );
      await collection.deleteMany({
        $or: [{ category: 'Frutas' }, { category: 'Fruits' }],
      });
    }

    console.log('🌱 Inserting fruit items...');
    const result = await collection.insertMany(fruitItems);
    console.log(`✅ Inserted ${result.insertedCount} fruit items\n`);

    // Display inserted items
    console.log('📦 Inserted fruits:');
    fruitItems.forEach((item, index) => {
      console.log(
        `  ${index + 1}. ${item.name} - R$ ${item.estimatedPrice.toFixed(2)}/${item.unit}`
      );
    });

    console.log('\n✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the seed
seedFruits();
