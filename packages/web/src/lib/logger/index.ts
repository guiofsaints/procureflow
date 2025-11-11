/**
 * Logger Index
 *
 * Provides a client-safe logger wrapper for error boundaries and client components.
 * Uses console API for client-side logging.
 * For server-side code, import directly from './winston.config'.
 */

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
export const logger: Logger = new ClientLogger();

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: Record<string, unknown>): Logger {
  return {
    info: (message: string, meta?: Record<string, unknown>) =>
      logger.info(message, { ...context, ...meta }),
    warn: (message: string, meta?: Record<string, unknown>) =>
      logger.warn(message, { ...context, ...meta }),
    error: (message: string, meta?: Record<string, unknown>) =>
      logger.error(message, { ...context, ...meta }),
    debug: (message: string, meta?: Record<string, unknown>) =>
      logger.debug(message, { ...context, ...meta }),
  };
}
