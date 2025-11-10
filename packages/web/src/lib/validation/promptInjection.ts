/**
 * @fileoverview Prompt injection detection and prevention.
 *
 * Detects common prompt injection patterns that attempt to:
 * - Override system instructions
 * - Leak system prompts
 * - Execute malicious commands
 * - Bypass safety guardrails
 *
 * @module lib/validation/promptInjection
 */

import { logger } from '@/lib/logger/winston.config';
import { validationErrors } from '@/lib/metrics/prometheus.config';

/**
 * Patterns that indicate potential prompt injection attacks.
 * These are heuristic-based and may have false positives.
 */
const INJECTION_PATTERNS = [
  // Instruction override attempts
  /ignore\s+(previous|all|above|prior)\s+(instructions|commands|prompts|rules)/gi,
  /disregard\s+(previous|all|above|prior)\s+(instructions|commands|prompts|rules)/gi,
  /forget\s+(previous|all|above|prior)\s+(instructions|commands|prompts|rules)/gi,
  /override\s+(previous|all|above|prior)\s+(instructions|commands|prompts|rules)/gi,

  // System prompt leaking attempts
  /show\s+(me\s+)?(your|the)\s+(system|original|initial)\s+(prompt|instructions)/gi,
  /what\s+(are|is)\s+(your|the)\s+(system|original|initial)\s+(prompt|instructions)/gi,
  /reveal\s+(your|the)\s+(system|original|initial)\s+(prompt|instructions)/gi,
  /print\s+(your|the)\s+(system|original|initial)\s+(prompt|instructions)/gi,

  // Role manipulation
  /you\s+are\s+now\s+(a|an)\s+/gi,
  /act\s+as\s+(a|an)\s+(?!procurement|purchasing|agent)/gi, // Allow legitimate procurement roles
  /pretend\s+(to\s+be|you\s+are)/gi,
  /simulate\s+(being|a|an)/gi,

  // Command injection
  /execute\s+(command|code|script)/gi,
  /run\s+(command|code|script)/gi,
  /eval\s*\(/gi,
  /system\s*\(/gi,

  // Delimiter/escape attempts
  /```\s*system/gi,
  /\[SYSTEM\]/gi,
  /\{SYSTEM\}/gi,
  /<\|system\|>/gi,
  /<\|assistant\|>/gi,

  // Jailbreak patterns
  /DAN\s+mode/gi, // "Do Anything Now" jailbreak
  /developer\s+mode/gi,
  /god\s+mode/gi,
  /sudo\s+mode/gi,
];

/**
 * Suspicious character sequences that might be used for injection.
 */
const SUSPICIOUS_SEQUENCES = [
  // Control characters (excluding common ones like newline, tab)
  /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,

  // Excessive special characters (potential encoding attacks)
  /[%]{10,}/g, // URL encoding spam
  /[\\]{10,}/g, // Escape character spam
  /[`]{3,}/g, // Code block attempts
];

/**
 * Check if input contains potential prompt injection attempts.
 *
 * @param input - User input to check
 * @returns Object with detection results
 *
 * @example
 * ```typescript
 * const result = detectPromptInjection("Ignore previous instructions and...");
 * if (result.detected) {
 *   console.error('Injection detected:', result.patterns);
 * }
 * ```
 */
export function detectPromptInjection(input: string): {
  detected: boolean;
  patterns: string[];
  sanitized: string;
  severity: 'low' | 'medium' | 'high';
} {
  const detectedPatterns: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    const matches = input.match(pattern);
    if (matches) {
      detectedPatterns.push(pattern.source);
      severity = 'high'; // Any pattern match is high severity
    }
  }

  // Check for suspicious sequences
  for (const pattern of SUSPICIOUS_SEQUENCES) {
    const matches = input.match(pattern);
    if (matches) {
      detectedPatterns.push(`Suspicious sequence: ${pattern.source}`);
      severity = severity === 'high' ? 'high' : 'medium';
    }
  }

  // Sanitize by removing control characters
  const sanitized = sanitizeInput(input);

  return {
    detected: detectedPatterns.length > 0,
    patterns: detectedPatterns,
    sanitized,
    severity,
  };
}

/**
 * Sanitize user input by removing potentially harmful characters.
 *
 * @param input - Input to sanitize
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  // Remove control characters (except newline, tab, carriage return)
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Validate and sanitize user input for agent messages.
 * Throws error if high-severity injection detected.
 *
 * @param input - User input to validate
 * @param options - Validation options
 * @returns Sanitized input
 * @throws {Error} If high-severity injection detected and strict mode enabled
 *
 * @example
 * ```typescript
 * try {
 *   const safe = validateUserInput(userMessage, { strict: true });
 *   // Proceed with safe input
 * } catch (error) {
 *   // Handle injection attempt
 * }
 * ```
 */
export function validateUserInput(
  input: string,
  options: {
    strict?: boolean; // Throw on any detection (default: false)
    sanitize?: boolean; // Return sanitized input (default: true)
  } = {}
): string {
  const { strict = false, sanitize = true } = options;

  const result = detectPromptInjection(input);

  if (result.detected) {
    // Log detection
    logger.warn('Prompt injection detected', {
      severity: result.severity,
      patterns: result.patterns,
      inputLength: input.length,
      sanitizedLength: result.sanitized.length,
    });

    // Update metrics (only track type, not severity in labels)
    validationErrors.inc({ type: 'prompt_injection' });

    // Throw if strict mode or high severity
    if (strict || result.severity === 'high') {
      throw new Error(
        `Potential prompt injection detected. This input contains patterns that may attempt to override system instructions or execute unauthorized commands.`
      );
    }
  }

  return sanitize ? result.sanitized : input;
}

/**
 * Check if input is safe (no injection detected).
 * Non-throwing version of validateUserInput.
 *
 * @param input - User input to check
 * @returns True if safe, false if injection detected
 */
export function isInputSafe(input: string): boolean {
  const result = detectPromptInjection(input);
  return !result.detected || result.severity === 'low';
}

/**
 * Get detailed analysis of input safety.
 * Useful for debugging and monitoring.
 *
 * @param input - Input to analyze
 * @returns Detailed analysis
 */
export function analyzeInputSafety(input: string) {
  const detection = detectPromptInjection(input);

  return {
    safe: !detection.detected,
    ...detection,
    inputLength: input.length,
    sanitizedLength: detection.sanitized.length,
    changesMade: input !== detection.sanitized,
  };
}
