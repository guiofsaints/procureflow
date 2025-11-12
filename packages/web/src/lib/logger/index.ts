/**
 * Logger Index
 *
 * Provides a unified logger interface for client and server environments.
 *
 * For server-side code (Node.js runtime):
 * - Use serverLogger for Winston-based structured logging with ECS format
 * - Use createChildLogger() to include request context
 *
 * For client-side code ('use client' components):
 * - Use clientLogger for safe console-based logging
 *
 * Environment Variables:
 * - LOG_ENABLED: Enable/disable logging (default: true)
 * - LOG_FORMAT: 'ecs' | 'human' (default: 'ecs' in production)
 * - LOG_LEVEL: Winston log level (default: 'info')
 */

// Server-side imports (conditional to avoid client bundling)
let winstonLogger: Logger | undefined;
let getContextForLogging: (() => Record<string, unknown>) | undefined;

if (typeof window === 'undefined') {
  // Server-side only
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const winstonConfig = require('./winston.config');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const context = require('./context');
    winstonLogger = winstonConfig.logger;
    getContextForLogging = context.getContextForLogging;
  } catch (_error) {
    // Fallback if winston modules fail to load
    console.warn('Failed to load Winston logger, using console fallback');
  }
}

/**
 * Logger interface for consistent logging across client/server
 */
export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Client-safe logger using console API
 * Safe to use in client components ('use client')
 */
class ClientLogger implements Logger {
  private formatMeta(meta?: Record<string, unknown>): string {
    if (!meta || Object.keys(meta).length === 0) {
      return '';
    }
    return ` ${JSON.stringify(meta)}`;
  }

  info(message: string, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log(`[${timestamp}] [INFO] ${message}${this.formatMeta(meta)}`);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}${this.formatMeta(meta)}`);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}${this.formatMeta(meta)}`);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      // eslint-disable-next-line no-console
      console.log(`[${timestamp}] [DEBUG] ${message}${this.formatMeta(meta)}`);
    }
  }
}

/**
 * Client-safe logger instance
 * Use this in client components and error boundaries
 */
export const clientLogger: Logger = new ClientLogger();

/**
 * Server-side logger with Winston and request context
 * Automatically includes request context when available
 */
export const serverLogger: Logger =
  typeof window === 'undefined' && winstonLogger
    ? {
        info: (message: string, meta?: Record<string, unknown>) =>
          winstonLogger!.info(message, {
            ...getContextForLogging?.(),
            ...meta,
          }),
        warn: (message: string, meta?: Record<string, unknown>) =>
          winstonLogger!.warn(message, {
            ...getContextForLogging?.(),
            ...meta,
          }),
        error: (message: string, meta?: Record<string, unknown>) =>
          winstonLogger!.error(message, {
            ...getContextForLogging?.(),
            ...meta,
          }),
        debug: (message: string, meta?: Record<string, unknown>) =>
          winstonLogger!.debug(message, {
            ...getContextForLogging?.(),
            ...meta,
          }),
      }
    : new ClientLogger(); // Fallback to client logger

/**
 * Universal logger that picks the appropriate implementation
 * - Server-side: Winston with request context
 * - Client-side: Console with timestamps
 */
export const logger: Logger =
  typeof window === 'undefined' ? serverLogger : clientLogger;

/**
 * Create a child logger with additional context
 * Automatically includes request context on server-side
 */
export function createChildLogger(context: Record<string, unknown>): Logger {
  if (typeof window === 'undefined' && winstonLogger) {
    // Server-side: Create child logger with enhanced context
    const requestContext = getContextForLogging?.() || {};
    const combinedContext = { ...requestContext, ...context };

    return {
      info: (message: string, meta?: Record<string, unknown>) =>
        winstonLogger!.info(message, { ...combinedContext, ...meta }),
      warn: (message: string, meta?: Record<string, unknown>) =>
        winstonLogger!.warn(message, { ...combinedContext, ...meta }),
      error: (message: string, meta?: Record<string, unknown>) =>
        winstonLogger!.error(message, { ...combinedContext, ...meta }),
      debug: (message: string, meta?: Record<string, unknown>) =>
        winstonLogger!.debug(message, { ...combinedContext, ...meta }),
    };
  }

  // Client-side: Use enhanced client logger
  return {
    info: (message: string, meta?: Record<string, unknown>) =>
      clientLogger.info(message, { ...context, ...meta }),
    warn: (message: string, meta?: Record<string, unknown>) =>
      clientLogger.warn(message, { ...context, ...meta }),
    error: (message: string, meta?: Record<string, unknown>) =>
      clientLogger.error(message, { ...context, ...meta }),
    debug: (message: string, meta?: Record<string, unknown>) =>
      clientLogger.debug(message, { ...context, ...meta }),
  };
}
