import mongoose from 'mongoose';

import { logger } from '@/lib/logger/winston.config';

// Define the connection interface
interface MongoConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Cache the database connection to avoid issues during development hot reloads
// NOTE: Using globalThis instead of global for Turbopack compatibility
declare global {
  var mongoose: MongoConnection | undefined;
}

const cached: MongoConnection = globalThis.mongoose || {
  conn: null,
  promise: null,
};

if (!globalThis.mongoose) {
  globalThis.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Connection pool settings for production
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    try {
      cached.promise = mongoose.connect(MONGODB_URI, opts);
    } catch (error) {
      cached.promise = null;
      throw error;
    }
  }

  try {
    cached.conn = await cached.promise;
    logger.info('Connected to MongoDB');
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    logger.error('MongoDB connection error', { error });
    throw error;
  }
}

// Graceful disconnection
async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    logger.info('Disconnected from MongoDB');
  }
}

// Health check for the database connection
async function isDBHealthy(): Promise<boolean> {
  try {
    if (!cached.conn) {
      await connectDB();
    }

    // Check if we can perform a basic operation
    const adminDB = mongoose.connection.db?.admin();
    await adminDB?.ping();

    return mongoose.connection.readyState === 1; // 1 = connected
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
}

export { connectDB, disconnectDB, isDBHealthy };
export default connectDB;
