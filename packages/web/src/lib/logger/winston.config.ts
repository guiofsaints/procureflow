/**
 * Winston Logger Configuration
 *
 * Provides structured logging with PII redaction for production use.
 * Supports console output (development) and Loki transport (production).
 */

import winston from 'winston';

// PII Patterns to redact from logs
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
};

/**
 * Winston format to redact PII from log messages
 */
const redactPII = winston.format((info) => {
  if (typeof info.message === 'string') {
    let message = info.message;
    Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
      message = message.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
    });
    info.message = message;
  }

  // Also redact PII in metadata fields
  if (info.metadata && typeof info.metadata === 'object') {
    const metadata = JSON.stringify(info.metadata);
    let redactedMetadata = metadata;
    Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
      redactedMetadata = redactedMetadata.replace(
        pattern,
        `[REDACTED_${type.toUpperCase()}]`
      );
    });
    try {
      info.metadata = JSON.parse(redactedMetadata);
    } catch {
      // If parsing fails, keep original
    }
  }

  return info;
});

/**
 * Create Winston logger instance
 */
const createLogger = () => {
  const transports: winston.transport[] = [];

  // Console transport (always enabled)
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          const metaKeys = Object.keys(metadata).filter(
            (key) =>
              key !== 'timestamp' &&
              key !== 'level' &&
              key !== 'service' &&
              key !== 'environment'
          );
          if (metaKeys.length > 0) {
            msg += ` ${JSON.stringify(
              Object.fromEntries(metaKeys.map((key) => [key, metadata[key]]))
            )}`;
          }
          return msg;
        })
      ),
    })
  );

  // Loki transport (production only - dynamic import to avoid bundling native deps)
  if (process.env.LOKI_HOST && process.env.NODE_ENV === 'production') {
    // Dynamic import to prevent Turbopack from bundling native dependencies (snappy)
    // winston-loki is only used in production runtime, not at build time
    import('winston-loki')
      .then((LokiModule) => {
        const LokiTransport = LokiModule.default;
        transports.push(
          new LokiTransport({
            host: process.env.LOKI_HOST,
            labels: {
              app: 'procureflow',
              component: 'agent',
              environment: process.env.NODE_ENV || 'development',
            },
            json: true,
            format: winston.format.json(),
            replaceTimestamp: true,
            onConnectionError: (err) =>
              console.error('Loki connection error:', err),
          })
        );
        logger.info('Loki transport enabled');
      })
      .catch((err) => {
        console.error('Failed to load winston-loki:', err);
      });
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      redactPII(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service: 'procureflow-agent',
      environment: process.env.NODE_ENV || 'development',
    },
    transports,
  });
};

// Export singleton logger instance
export const logger = createLogger();

// Export utility function for child loggers with additional context
export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
