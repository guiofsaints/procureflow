/**
 * @fileoverview Zod validation schemas for agent inputs and tool arguments.
 *
 * Provides type-safe validation for all agent-related data structures,
 * including messages, tool calls, and tool-specific arguments.
 *
 * @module lib/validation/schemas
 */

import { z } from 'zod';

/**
 * Message role enum
 */
export const MessageRoleSchema = z.enum([
  'user',
  'assistant',
  'system',
  'tool',
]);

/**
 * Single message schema
 */
export const MessageSchema = z.object({
  role: MessageRoleSchema,
  content: z
    .string()
    .min(1, 'Message content cannot be empty')
    .max(10_000, 'Message content too long'),
  name: z.string().optional(),
  tool_call_id: z.string().optional(),
});

/**
 * Agent message request schema (API route input)
 */
export const AgentMessageRequestSchema = z.object({
  conversationId: z
    .string()
    .regex(/^[a-f0-9]{24}$/i, 'Invalid conversation ID format')
    .optional(),
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(5_000, 'Message too long (max 5000 characters)')
    .refine(
      (msg) => msg.trim().length > 0,
      'Message cannot be only whitespace'
    ),
  context: z
    .object({
      cartId: z.string().optional(),
      userId: z.string().optional(),
    })
    .optional(),
});

/**
 * Tool call schema (LLM output)
 */
export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  arguments: z.string(), // JSON string, parsed later
});

// ============================================================================
// Tool-specific argument schemas
// ============================================================================

/**
 * search_catalog tool arguments
 */
export const SearchCatalogArgsSchema = z
  .object({
    query: z
      .string()
      .min(1, 'Search query cannot be empty')
      .max(500, 'Search query too long')
      .refine(
        (q) => q.trim().length > 0,
        'Search query cannot be only whitespace'
      ),
    category: z.string().optional(),
    minPrice: z
      .number()
      .nonnegative('Minimum price cannot be negative')
      .optional(),
    maxPrice: z
      .number()
      .nonnegative('Maximum price cannot be negative')
      .optional(),
    limit: z
      .number()
      .int()
      .positive()
      .max(100, 'Limit cannot exceed 100')
      .optional(),
  })
  .refine(
    (data) => {
      // If both prices specified, min must be <= max
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    {
      message: 'Minimum price must be less than or equal to maximum price',
      path: ['minPrice'],
    }
  );

/**
 * get_item_details tool arguments
 */
export const GetItemDetailsArgsSchema = z.object({
  itemId: z
    .string()
    .min(1, 'Item ID cannot be empty')
    .max(100, 'Item ID too long'),
});

/**
 * add_to_cart tool arguments
 */
export const AddToCartArgsSchema = z.object({
  itemId: z
    .string()
    .min(1, 'Item ID cannot be empty')
    .max(100, 'Item ID too long'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive')
    .max(1000, 'Quantity cannot exceed 1000'),
  cartId: z.string().optional(),
});

/**
 * remove_from_cart tool arguments
 */
export const RemoveFromCartArgsSchema = z.object({
  itemId: z
    .string()
    .min(1, 'Item ID cannot be empty')
    .max(100, 'Item ID too long'),
  cartId: z.string().optional(),
});

/**
 * update_cart_quantity tool arguments
 */
export const UpdateCartQuantityArgsSchema = z.object({
  itemId: z
    .string()
    .min(1, 'Item ID cannot be empty')
    .max(100, 'Item ID too long'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .nonnegative('Quantity cannot be negative')
    .max(1000, 'Quantity cannot exceed 1000'),
  cartId: z.string().optional(),
});

/**
 * view_cart tool arguments
 */
export const ViewCartArgsSchema = z.object({
  cartId: z.string().optional(),
});

/**
 * checkout tool arguments
 */
export const CheckoutArgsSchema = z.object({
  cartId: z.string().optional(),
  shippingAddress: z
    .object({
      street: z.string().min(1).max(200),
      city: z.string().min(1).max(100),
      state: z.string().min(2).max(50),
      zipCode: z.string().min(5).max(10),
      country: z.string().min(2).max(50),
    })
    .optional(),
  paymentMethod: z
    .enum(['credit_card', 'purchase_order', 'invoice'])
    .optional(),
});

/**
 * Map of tool names to their argument schemas
 */
export const ToolArgsSchemas = {
  search_catalog: SearchCatalogArgsSchema,
  get_item_details: GetItemDetailsArgsSchema,
  add_to_cart: AddToCartArgsSchema,
  remove_from_cart: RemoveFromCartArgsSchema,
  update_cart_quantity: UpdateCartQuantityArgsSchema,
  view_cart: ViewCartArgsSchema,
  checkout: CheckoutArgsSchema,
} as const;

/**
 * Type for tool names
 */
export type ToolName = keyof typeof ToolArgsSchemas;

/**
 * Validate tool arguments against the appropriate schema.
 *
 * @param toolName - Name of the tool
 * @param args - Arguments object to validate
 * @returns Validated and typed arguments
 * @throws {z.ZodError} If validation fails
 *
 * @example
 * ```typescript
 * const validatedArgs = validateToolArgs('search_catalog', {
 *   query: 'office chairs',
 *   limit: 10,
 * });
 * ```
 */
export function validateToolArgs<T extends ToolName>(
  toolName: T,
  args: unknown
): unknown {
  const schema = ToolArgsSchemas[toolName];

  if (!schema) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  return schema.parse(args);
}

/**
 * Validate tool arguments with error details.
 * Returns validation result with success flag and typed data or error.
 *
 * @param toolName - Name of the tool
 * @param args - Arguments object to validate
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = safeValidateToolArgs('search_catalog', input);
 * if (result.success) {
 *   // result.data is typed
 *   console.log(result.data.query);
 * } else {
 *   // result.error contains validation errors
 *   console.error(result.error.errors);
 * }
 * ```
 */
export function safeValidateToolArgs<T extends ToolName>(
  toolName: T,
  args: unknown
) {
  const schema = ToolArgsSchemas[toolName];

  if (!schema) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: 'custom',
          message: `Unknown tool: ${toolName}`,
          path: ['toolName'],
        },
      ]),
    };
  }

  return schema.safeParse(args);
}

/**
 * Validate agent message request (from API route).
 *
 * @param data - Request data to validate
 * @returns Validated request data
 * @throws {z.ZodError} If validation fails
 */
export function validateAgentMessageRequest(data: unknown) {
  return AgentMessageRequestSchema.parse(data);
}

/**
 * Safe validate agent message request with error details.
 *
 * @param data - Request data to validate
 * @returns Validation result
 */
export function safeValidateAgentMessageRequest(data: unknown) {
  return AgentMessageRequestSchema.safeParse(data);
}
