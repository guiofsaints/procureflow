/**
 * Prometheus Metrics Configuration
 *
 * Defines and exports metrics for agent system observability:
 * - Request counts and latency
 * - LLM API calls and token usage
 * - Tool execution metrics
 * - System health gauges
 */

import { Counter, Histogram, Gauge, Registry } from 'prom-client';

// Create a custom registry (allows multiple registries if needed)
export const register = new Registry();

// Default labels for all metrics
register.setDefaultLabels({
  app: 'procureflow',
  service: 'agent',
  environment: process.env.NODE_ENV || 'development',
});

// ============================================================================
// Agent Request Metrics
// ============================================================================

/**
 * Total number of agent requests
 * Labels: status (success, error), provider (openai, gemini, ollama)
 */
export const agentRequestTotal = new Counter({
  name: 'agent_requests_total',
  help: 'Total number of agent requests processed',
  labelNames: ['status', 'provider'],
  registers: [register],
});

/**
 * Agent request duration in seconds
 * Labels: provider (openai, gemini, ollama), status (success, error)
 */
export const agentRequestDuration = new Histogram({
  name: 'agent_request_duration_seconds',
  help: 'Agent request latency distribution in seconds',
  labelNames: ['provider', 'status'],
  buckets: [0.1, 0.5, 1, 2, 3, 5, 10, 30], // 100ms to 30s
  registers: [register],
});

// ============================================================================
// LLM Provider Metrics
// ============================================================================

/**
 * Total number of LLM API calls
 * Labels: provider (openai, gemini, ollama), model, status (success, error, timeout, rate_limit)
 */
export const llmCallTotal = new Counter({
  name: 'llm_calls_total',
  help: 'Total number of LLM API calls made',
  labelNames: ['provider', 'model', 'status'],
  registers: [register],
});

/**
 * LLM API call duration in seconds
 * Labels: provider, model
 */
export const llmCallDuration = new Histogram({
  name: 'llm_call_duration_seconds',
  help: 'LLM API call latency distribution in seconds',
  labelNames: ['provider', 'model'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30], // 500ms to 30s
  registers: [register],
});

/**
 * Total tokens consumed (input + output)
 * Labels: provider, model, type (input, output)
 */
export const llmTokensTotal = new Counter({
  name: 'llm_tokens_total',
  help: 'Total tokens consumed from LLM APIs',
  labelNames: ['provider', 'model', 'type'],
  registers: [register],
});

/**
 * Estimated cost in USD
 * Labels: provider, model
 */
export const llmCostUSD = new Counter({
  name: 'llm_cost_usd_total',
  help: 'Estimated total LLM cost in USD',
  labelNames: ['provider', 'model'],
  registers: [register],
});

// ============================================================================
// Tool Execution Metrics
// ============================================================================

/**
 * Total tool executions
 * Labels: tool (search_catalog, add_to_cart, etc.), status (success, error, timeout)
 */
export const toolExecutionTotal = new Counter({
  name: 'tool_executions_total',
  help: 'Total number of tool executions',
  labelNames: ['tool', 'status'],
  registers: [register],
});

/**
 * Tool execution duration in seconds
 * Labels: tool
 */
export const toolExecutionDuration = new Histogram({
  name: 'tool_execution_duration_seconds',
  help: 'Tool execution latency distribution in seconds',
  labelNames: ['tool'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5], // 10ms to 5s
  registers: [register],
});

// ============================================================================
// System Health Metrics
// ============================================================================

/**
 * Number of active conversations
 */
export const activeConversations = new Gauge({
  name: 'agent_active_conversations',
  help: 'Current number of active agent conversations',
  registers: [register],
});

/**
 * MongoDB connection pool size
 */
export const mongoDBConnectionPool = new Gauge({
  name: 'mongodb_connection_pool_size',
  help: 'MongoDB connection pool size',
  registers: [register],
});

/**
 * Circuit breaker state
 * Labels: provider
 * Values: 0 (closed), 1 (open), 0.5 (half-open)
 */
export const circuitBreakerState = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=open, 0.5=half-open)',
  labelNames: ['provider'],
  registers: [register],
});

/**
 * Rate limiter queue size
 * Labels: provider
 */
export const rateLimiterQueueSize = new Gauge({
  name: 'rate_limiter_queue_size',
  help: 'Number of requests queued in rate limiter',
  labelNames: ['provider'],
  registers: [register],
});

// ============================================================================
// Error Metrics
// ============================================================================

/**
 * Validation errors
 * Labels: type (prompt_injection, invalid_input, schema_validation)
 */
export const validationErrors = new Counter({
  name: 'validation_errors_total',
  help: 'Total number of validation errors',
  labelNames: ['type'],
  registers: [register],
});

/**
 * Moderation rejections
 * Labels: category (hate, violence, sexual, etc.)
 */
export const moderationRejections = new Counter({
  name: 'moderation_rejections_total',
  help: 'Total number of content moderation rejections',
  labelNames: ['category'],
  registers: [register],
});

// ============================================================================
// Conversation Memory Metrics
// ============================================================================

/**
 * Conversation history truncation events
 * Labels: reason (token_budget, message_count, total_tokens)
 */
export const conversationTruncations = new Counter({
  name: 'conversation_truncations_total',
  help: 'Total number of conversation history truncations',
  labelNames: ['reason'],
  registers: [register],
});

/**
 * Conversation message count distribution
 * Tracks how many messages are in conversation histories
 */
export const conversationMessageCount = new Histogram({
  name: 'conversation_message_count',
  help: 'Distribution of message counts in conversations',
  buckets: [1, 5, 10, 20, 50, 100, 200],
  registers: [register],
});

/**
 * Conversation token count distribution
 * Tracks total tokens used in conversation contexts
 */
export const conversationTokenCount = new Histogram({
  name: 'conversation_token_count',
  help: 'Distribution of token counts in conversation contexts',
  buckets: [100, 500, 1000, 2000, 3000, 4000, 5000],
  registers: [register],
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

/**
 * Get content type for Prometheus scraping
 */
export function getContentType(): string {
  return register.contentType;
}

/**
 * Clear all metrics (useful for testing)
 */
export function clearMetrics(): void {
  register.clear();
}
