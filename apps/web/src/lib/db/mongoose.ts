import mongoose from 'mongoose';

// Define the connection interface
interface MongoConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Cache the database connection to avoid issues during development hot reloads
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongoConnection | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

let cached: MongoConnection = global.mongoose || {
  conn: null,
  promise: null,
};

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
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
      cached.promise = mongoose.connect(MONGODB_URI!, opts);
    } catch (error) {
      cached.promise = null;
      throw error;
    }
  }

  try {
    cached.conn = await cached.promise;
    console.log('📦 Connected to MongoDB');
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Graceful disconnection
async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('📦 Disconnected from MongoDB');
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
    console.error('❌ Database health check failed:', error);
    return false;
  }
}

export { connectDB, disconnectDB, isDBHealthy };
export default connectDB;
