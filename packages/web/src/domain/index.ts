/**
 * Domain Layer Index
 *
 * Central export point for all domain types and interfaces.
 * Import from this file throughout the codebase for consistency.
 *
 * Example usage:
 *   import { User, Item, Cart, ItemStatus } from '@/domain';
 */

// Export all domain entities and types
export * from './entities';

// Export all Mongoose document types
export * from './documents';
