/**
 * Cleanup Carts Script
 *
 * This script removes duplicate carts and ensures each user has only one cart.
 * Run this after the cart refactoring to clean up old data.
 *
 * Usage:
 *   pnpm tsx scripts/cleanup-carts.ts
 */

import { CartModel } from '../src/lib/db/models';
import connectDB from '../src/lib/db/mongoose';

async function cleanupCarts() {
  console.log('🧹 Starting cart cleanup...');

  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find all carts
    const allCarts = await CartModel.find({}).lean().exec();
    console.log(`📊 Found ${allCarts.length} total carts`);

    // Group carts by userId
    const cartsByUser = new Map<string, any[]>();
    for (const cart of allCarts) {
      const userId = cart.userId;
      if (!cartsByUser.has(userId)) {
        cartsByUser.set(userId, []);
      }
      cartsByUser.get(userId)!.push(cart);
    }

    // Find users with multiple carts
    let duplicatesFound = 0;
    let cartsDeleted = 0;

    for (const [userId, carts] of cartsByUser.entries()) {
      if (carts.length > 1) {
        duplicatesFound++;
        console.log(
          `⚠️  User ${userId} has ${carts.length} carts - keeping most recent`
        );

        // Sort by updatedAt (most recent first)
        carts.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        // Keep the first one, delete the rest
        const toKeep = carts[0];
        const toDelete = carts.slice(1);

        console.log(`   ✅ Keeping cart ${toKeep._id} (updated: ${toKeep.updatedAt})`);

        for (const cart of toDelete) {
          await CartModel.deleteOne({ _id: cart._id });
          console.log(`   ❌ Deleted cart ${cart._id} (updated: ${cart.updatedAt})`);
          cartsDeleted++;
        }
      }
    }

    // Remove any carts with userId = "temp-cart" or similar invalid IDs
    const tempCarts = await CartModel.find({
      userId: { $regex: /^temp-/i },
    }).lean();

    if (tempCarts.length > 0) {
      console.log(`\n🗑️  Found ${tempCarts.length} temporary carts`);
      for (const cart of tempCarts) {
        await CartModel.deleteOne({ _id: cart._id });
        console.log(`   ❌ Deleted temporary cart ${cart._id} (userId: ${cart.userId})`);
        cartsDeleted++;
      }
    }

    console.log('\n📊 Cleanup Summary:');
    console.log(`   - Total carts: ${allCarts.length}`);
    console.log(`   - Users with duplicates: ${duplicatesFound}`);
    console.log(`   - Carts deleted: ${cartsDeleted}`);
    console.log(`   - Carts remaining: ${allCarts.length - cartsDeleted}`);

    console.log('\n✅ Cart cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run cleanup
cleanupCarts();
