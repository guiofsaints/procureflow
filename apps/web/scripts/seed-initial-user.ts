/**
 * Seed Initial User Script
 *
 * Creates the initial user account for ProcureFlow:
 * - Email: guilherme@procureflow.com
 * - Password: guigui123
 * - Role: Admin
 *
 * Usage:
 *   pnpm tsx scripts/seed-initial-user.ts
 *
 * Environment Variables Required:
 *   MONGODB_URI - MongoDB connection string (loaded from .env.local)
 */

import { resolve } from 'path';

import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { registerUser } from '../src/features/auth';

async function seedInitialUser() {
  console.log('🌱 Seeding initial user...\n');

  try {
    // Create initial admin user
    const user = await registerUser({
      email: 'guilherme@procureflow.com',
      password: 'guigui123',
      name: 'Guilherme Santos',
      role: 'admin' as any, // Using 'admin' role
    });

    console.log('✅ Initial user created successfully!');
    console.log('\nUser Details:');
    console.log('  Email:', user.email);
    console.log('  Name:', user.name);
    console.log('  Role:', user.role);
    console.log('  ID:', user.id);
    console.log('\nYou can now login with:');
    console.log('  Email: guilherme@procureflow.com');
    console.log('  Password: guigui123');
    console.log('');

    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  User already exists - skipping creation');
        console.log('\nYou can login with:');
        console.log('  Email: guilherme@procureflow.com');
        console.log('  Password: guigui123');
        console.log('');
        process.exit(0);
      }

      console.error('❌ Error creating initial user:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }

    process.exit(1);
  }
}

// Run the seed script
seedInitialUser();
