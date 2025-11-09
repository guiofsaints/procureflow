/**
 * Script to fix conversation userIds
 *
 * This script finds conversations with invalid userIds (like "1")
 * and either deletes them or updates them to a valid ObjectId.
 *
 * Run with: pnpm tsx apps/web/scripts/fix-conversation-userids.ts
 *
 * Note: Make sure MONGODB_URI is set in your environment before running
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { AgentConversationModel } from '../src/lib/db/models';
import connectDB from '../src/lib/db/mongoose';

async function fixConversationUserIds() {
  try {
    await connectDB();

    console.log('🔍 Checking for conversations with invalid userIds...\n');

    // Find all conversations
    const allConversations = await AgentConversationModel.find().lean().exec();
    console.log(
      `Total conversations in database: ${allConversations.length}\n`
    );

    if (allConversations.length === 0) {
      console.log('✅ No conversations found.');
      process.exit(0);
    }

    // Show all conversations with their userIds
    console.log('Current conversations:');
    allConversations.forEach((conv: any, index: number) => {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(conv.userId);
      const status = isValidObjectId ? '✅' : '❌';
      console.log(
        `${status} [${index + 1}] userId: "${conv.userId}" | title: "${conv.title}" | messages: ${conv.messages?.length || 0}`
      );
    });

    // Find conversations with invalid userIds
    const invalidConversations = allConversations.filter((conv: any) => {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(conv.userId);
      return !isValidObjectId;
    });

    if (invalidConversations.length === 0) {
      console.log('\n✅ All conversations have valid userIds!');
      process.exit(0);
    }

    console.log(
      `\n⚠️  Found ${invalidConversations.length} conversation(s) with invalid userId\n`
    );

    // Ask what to do
    console.log('Options:');
    console.log(
      '1. Delete these conversations (recommended for demo/test data)'
    );
    console.log('2. Update userId to demo user (507f1f77bcf86cd799439011)');
    console.log('3. Do nothing (just view)\n');

    const action = process.argv[2] || 'view';

    if (action === 'delete') {
      console.log('🗑️  Deleting conversations with invalid userIds...');
      const invalidIds = invalidConversations.map((c: any) => c._id);
      const result = await AgentConversationModel.deleteMany({
        _id: { $in: invalidIds },
      });
      console.log(`✅ Deleted ${result.deletedCount} conversation(s)`);
    } else if (action === 'update') {
      console.log('🔧 Updating conversations to use demo user ID...');
      const invalidIds = invalidConversations.map((c: any) => c._id);
      const result = await AgentConversationModel.updateMany(
        { _id: { $in: invalidIds } },
        { $set: { userId: '507f1f77bcf86cd799439011' } }
      );
      console.log(`✅ Updated ${result.modifiedCount} conversation(s)`);
    } else {
      console.log('ℹ️  View mode - no changes made.');
      console.log('\nTo fix, run:');
      console.log(
        '  pnpm tsx apps/web/scripts/fix-conversation-userids.ts delete'
      );
      console.log(
        '  pnpm tsx apps/web/scripts/fix-conversation-userids.ts update'
      );
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixConversationUserIds();
