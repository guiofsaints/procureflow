/**
 * Authentication Service
 *
 * Handles user registration, password hashing, and user verification
 */

import bcrypt from 'bcryptjs';

import type { User } from '@/domain/entities';
import type { UserDocument } from '@/domain/mongo-schemas';
import { UserModel } from '@/lib/db/models';
import connectDB from '@/lib/db/mongoose';
import { UserRole } from '@/lib/db/schemas/user.schema';

// ============================================================================
// Types
// ============================================================================

export interface RegisterUserInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface VerifyCredentialsInput {
  email: string;
  password: string;
}

// ============================================================================
// Constants
// ============================================================================

const SALT_ROUNDS = 12; // Recommended bcrypt salt rounds for security

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Map Mongoose user document to domain entity
 */
function mapUserToEntity(doc: Partial<UserDocument>): User {
  return {
    id: typeof doc._id === 'string' ? doc._id : doc._id?.toString() || '',
    email: doc.email || '',
    name: doc.name || '',
    role: doc.role || 'requester',
    createdAt: doc.createdAt || new Date(),
    updatedAt: doc.updatedAt || new Date(),
  };
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Register a new user
 *
 * @throws Error if user already exists or validation fails
 */
export async function registerUser(
  input: RegisterUserInput
): Promise<Omit<User, 'passwordHash'>> {
  await connectDB();

  // Validate input
  if (!input.email || !input.password || !input.name) {
    throw new Error('Email, password, and name are required');
  }

  if (input.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Check if user already exists
  const existingUser = await UserModel.findOne({
    email: input.email.toLowerCase(),
  }).exec();

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(input.password);

  // Create user (MongoDB will auto-generate ObjectId for _id)
  const user = await UserModel.create({
    email: input.email.toLowerCase(),
    name: input.name,
    passwordHash,
    role: input.role || UserRole.Requester,
  });

  // Return user without passwordHash (handled by schema toJSON transform)
  return user.toJSON() as User;
}

/**
 * Verify user credentials and return user if valid
 *
 * @returns User object without passwordHash, or null if invalid
 */
export async function verifyCredentials(
  input: VerifyCredentialsInput
): Promise<Omit<User, 'passwordHash'> | null> {
  await connectDB();

  if (!input.email || !input.password) {
    return null;
  }

  // Find user and explicitly select passwordHash
  const user = await UserModel.findOne({
    email: input.email.toLowerCase(),
  })
    .select('+passwordHash')
    .exec();

  if (!user) {
    return null;
  }

  // Verify password
  const isValid = await verifyPassword(input.password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  // Return user without passwordHash
  const userObject = user.toObject();
  delete userObject.passwordHash;

  return userObject as User;
}

/**
 * Find user by email
 *
 * @returns User object without passwordHash, or null if not found
 */
export async function findUserByEmail(
  email: string
): Promise<Omit<User, 'passwordHash'> | null> {
  await connectDB();

  const user = await UserModel.findOne({
    email: email.toLowerCase(),
  })
    .lean()
    .exec();

  if (!user) {
    return null;
  }

  return mapUserToEntity(user as Partial<UserDocument>);
}

/**
 * Find user by ID
 *
 * @returns User object without passwordHash, or null if not found
 */
export async function findUserById(
  id: string
): Promise<Omit<User, 'passwordHash'> | null> {
  await connectDB();

  const user = await UserModel.findById(id).lean().exec();

  if (!user) {
    return null;
  }

  return mapUserToEntity(user as Partial<UserDocument>);
}
