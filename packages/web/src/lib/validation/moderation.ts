/**
 * @fileoverview OpenAI Moderation API integration for content safety.
 *
 * Uses OpenAI's moderation endpoint to detect:
 * - Hate speech
 * - Harassment
 * - Violence
 * - Sexual content
 * - Self-harm
 *
 * @module lib/validation/moderation
 */

import { logger } from '@/lib/logger/winston.config';
import { moderationRejections } from '@/lib/metrics/prometheus.config';

/**
 * Moderation result from OpenAI API
 */
interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    'hate/threatening': boolean;
    harassment: boolean;
    'harassment/threatening': boolean;
    'self-harm': boolean;
    'self-harm/intent': boolean;
    'self-harm/instructions': boolean;
    sexual: boolean;
    'sexual/minors': boolean;
    violence: boolean;
    'violence/graphic': boolean;
  };
  category_scores: Record<string, number>;
}

/**
 * Check if OpenAI moderation is enabled.
 */
function isModerationEnabled(): boolean {
  return process.env.OPENAI_MODERATION_ENABLED === 'true';
}

/**
 * Get OpenAI API key for moderation.
 */
function getApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

/**
 * Call OpenAI Moderation API to check content safety.
 *
 * @param input - Text to moderate
 * @returns Moderation result
 * @throws {Error} If API call fails
 *
 * @example
 * ```typescript
 * const result = await moderateContent("Hello, how are you?");
 * if (result.flagged) {
 *   console.error('Unsafe content detected');
 * }
 * ```
 */
export async function moderateContent(
  input: string
): Promise<ModerationResult> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured for moderation');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input,
        model: 'text-moderation-latest',
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Moderation API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const result = data.results[0] as ModerationResult;

    // Log if flagged
    if (result.flagged) {
      const flaggedCategories = Object.entries(result.categories)
        .filter(([, flagged]) => flagged)
        .map(([category]) => category);

      logger.warn('Content moderation flagged', {
        categories: flaggedCategories,
        inputLength: input.length,
      });

      // Use 'category' label instead of 'reason'
      moderationRejections.inc({
        category: flaggedCategories[0] || 'unknown',
      });
    }

    return result;
  } catch (error) {
    logger.error('Moderation API call failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Don't block on moderation failures - allow content through
    // Log error but return safe result
    return {
      flagged: false,
      categories: {
        hate: false,
        'hate/threatening': false,
        harassment: false,
        'harassment/threatening': false,
        'self-harm': false,
        'self-harm/intent': false,
        'self-harm/instructions': false,
        sexual: false,
        'sexual/minors': false,
        violence: false,
        'violence/graphic': false,
      },
      category_scores: {},
    };
  }
}

/**
 * Validate user input with OpenAI moderation.
 * Throws error if content is flagged.
 *
 * @param input - User input to moderate
 * @returns Input if safe
 * @throws {Error} If content is flagged as unsafe
 *
 * @example
 * ```typescript
 * try {
 *   await validateWithModeration(userMessage);
 *   // Content is safe
 * } catch (error) {
 *   // Content flagged - reject request
 * }
 * ```
 */
export async function validateWithModeration(input: string): Promise<string> {
  if (!isModerationEnabled()) {
    // Moderation disabled - pass through
    return input;
  }

  const result = await moderateContent(input);

  if (result.flagged) {
    const flaggedCategories = Object.entries(result.categories)
      .filter(([, flagged]) => flagged)
      .map(([category]) => category)
      .join(', ');

    throw new Error(
      `Content violates safety policies. Flagged categories: ${flaggedCategories}`
    );
  }

  return input;
}

/**
 * Check if content is safe (non-throwing).
 *
 * @param input - Content to check
 * @returns True if safe, false if flagged
 */
export async function isContentSafe(input: string): Promise<boolean> {
  if (!isModerationEnabled()) {
    return true; // Moderation disabled - assume safe
  }

  try {
    const result = await moderateContent(input);
    return !result.flagged;
  } catch {
    // On error, assume safe (don't block on moderation failures)
    return true;
  }
}

/**
 * Get detailed moderation analysis.
 *
 * @param input - Content to analyze
 * @returns Moderation result with scores
 */
export async function analyzeModerationScores(input: string) {
  if (!isModerationEnabled()) {
    return {
      enabled: false,
      flagged: false,
      categories: {},
      scores: {},
    };
  }

  const result = await moderateContent(input);

  return {
    enabled: true,
    flagged: result.flagged,
    categories: result.categories,
    scores: result.category_scores,
  };
}
