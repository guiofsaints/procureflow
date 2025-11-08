/**
 * Agent Mock Logic Tests (Standalone)
 *
 * Tests for mock agent parsing, search, and response generation.
 * These tests don't require MongoDB connection.
 */

import { describe, expect, it } from 'vitest';

import {
  findMockItems,
  generateMockAgentResponse,
  parseUserMessage,
} from '@/features/agent/mocks/mockAgent';

describe('Agent Mock Logic (Standalone)', () => {
  describe('parseUserMessage', () => {
    it('should extract quantity from message', () => {
      const result = parseUserMessage('I need 10 USB cables');

      expect(result.quantity).toBe(10);
      expect(result.query).toContain('USB cables');
    });

    it('should extract max price with "under" pattern', () => {
      const result = parseUserMessage('Show me keyboards under $50');

      expect(result.maxPrice).toBe(50);
      expect(result.query).toContain('keyboards');
    });

    it('should extract max price with "less than" pattern', () => {
      const result = parseUserMessage('Find mice less than $35');

      expect(result.maxPrice).toBe(35);
      expect(result.query).toContain('mice');
    });

    it('should extract max price with < symbol', () => {
      const result = parseUserMessage('Cables < $20');

      expect(result.maxPrice).toBe(20);
      expect(result.query).toContain('Cables');
    });

    it('should extract both quantity and max price', () => {
      const result = parseUserMessage('I need 5 cables under $15 each');

      expect(result.quantity).toBe(5);
      expect(result.maxPrice).toBe(15);
      expect(result.query).toContain('cables');
    });

    it('should handle decimal prices', () => {
      const result = parseUserMessage('Items under $49.99');

      expect(result.maxPrice).toBe(49.99);
    });

    it('should return original query when no patterns match', () => {
      const result = parseUserMessage('Show me some office furniture');

      expect(result.quantity).toBeUndefined();
      expect(result.maxPrice).toBeUndefined();
      expect(result.query).toBe('Show me some office furniture');
    });
  });

  describe('findMockItems', () => {
    it('should find items by name', () => {
      const results = findMockItems('USB-C Cable');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((item) => item.name.includes('USB-C'))).toBe(true);
    });

    it('should find items by category', () => {
      const results = findMockItems('Electronics');

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((item) => item.category === 'Electronics')).toBe(
        true
      );
    });

    it('should find items by description', () => {
      const results = findMockItems('keyboard');

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((item) =>
          item.description.toLowerCase().includes('keyboard')
        )
      ).toBe(true);
    });

    it('should filter by max price', () => {
      const results = findMockItems('', 30);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((item) => item.price <= 30)).toBe(true);
    });

    it('should combine query and price filters', () => {
      const results = findMockItems('cable', 20);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((item) => item.price <= 20)).toBe(true);
      expect(
        results.every(
          (item) =>
            item.name.toLowerCase().includes('cable') ||
            item.description.toLowerCase().includes('cable')
        )
      ).toBe(true);
    });

    it('should be case-insensitive', () => {
      const resultsLower = findMockItems('usb');
      const resultsUpper = findMockItems('USB');

      expect(resultsLower).toEqual(resultsUpper);
    });

    it('should return empty array when no matches', () => {
      const results = findMockItems('nonexistent item xyz', 0.01);

      expect(results).toEqual([]);
    });
  });

  describe('generateMockAgentResponse', () => {
    it('should return items when matches are found', async () => {
      const response = await generateMockAgentResponse('USB cable');

      expect(response.role).toBe('assistant');
      expect(response.content).toBeTruthy();
      expect(response.items).toBeDefined();
      expect(response.items!.length).toBeGreaterThan(0);
    });

    it('should include quantity in response when specified', async () => {
      const response = await generateMockAgentResponse('10 USB cables');

      expect(response.content.toLowerCase()).toContain('10');
    });

    it('should include price constraint in response', async () => {
      const response = await generateMockAgentResponse('keyboards under $50');

      expect(response.content).toContain('$50');
    });

    it('should return no items when nothing matches', async () => {
      const response = await generateMockAgentResponse(
        'nonexistent product xyz'
      );

      expect(response.role).toBe('assistant');
      expect(response.content).toBeTruthy();
      expect(response.items).toBeUndefined();
      expect(response.content.toLowerCase()).toContain("couldn't find");
    });

    it('should suggest registering new item when nothing found', async () => {
      const response = await generateMockAgentResponse('rare item abc');

      expect(response.content.toLowerCase()).toContain('register');
    });

    it('should handle complex queries', async () => {
      const response = await generateMockAgentResponse(
        'I need 5 ergonomic keyboards under $100 each'
      );

      expect(response.role).toBe('assistant');
      expect(response.id).toBeTruthy();
      expect(response.content).toBeTruthy();
    });

    it('should simulate delay before responding', async () => {
      const startTime = Date.now();
      await generateMockAgentResponse('test');
      const endTime = Date.now();

      // Should take at least 800ms (the simulated delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(700);
    });
  });
});
