/**
 * Test Utilities
 *
 * Helper functions and utilities for writing tests.
 */

import { Types } from 'mongoose';
import { afterAll, beforeAll, vi } from 'vitest';

/**
 * Generate a valid MongoDB ObjectId string
 */
export const generateObjectId = (): string => {
  return new Types.ObjectId().toString();
};

/**
 * Create a mock ObjectId from a seed
 */
export const createObjectId = (seed = 1): string => {
  const hex = seed.toString(16).padStart(24, '0');
  return hex;
};

/**
 * Wait for a promise to resolve (useful for async testing)
 */
export const waitFor = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Suppress console output during tests
 */
export const suppressConsole = () => {
  const originalConsole = { ...console };

  beforeAll(() => {
    // eslint-disable-next-line no-console
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  afterAll(() => {
    // eslint-disable-next-line no-console
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });
};

/**
 * Create test data with default values
 */
export const createTestData = <T extends Record<string, unknown>>(
  defaults: T,
  overrides?: Partial<T>
): T => {
  return {
    ...defaults,
    ...overrides,
  };
};
