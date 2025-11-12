/**
 * Winston Logger Configuration
 *
 * Provides ECS-compliant structured logging with PII redaction for production use.
 * Supports console output (development) and Loki transport (production).
 * Environment Variables:
 * - LOG_ENABLED: Enable/disable logging (default: true)
 * - LOG_FORMAT: 'ecs' | 'human' (default: 'ecs' in production, 'human' in development)
 * - LOG_LEVEL: Winston log level (default: 'info')
 * - LOG_SAMPLING: Sampling rate 0-1 for request logs (default: 1.0)
 * - LOG_REDACT_KEYS: Comma-separated list of additional keys to redact
 */

import os from 'os';

import winston from 'winston';

// Package version from package.json
let packageVersion = '0.1.0';
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  packageVersion = require('../../../package.json').version;
} catch {
  // Fallback version if package.json is not accessible
}

// Environment configuration
const LOG_ENABLED = process.env.LOG_ENABLED !== 'false';
const LOG_FORMAT =
  process.env.LOG_FORMAT ||
  (process.env.NODE_ENV === 'production' ? 'ecs' : 'human');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const _LOG_SAMPLING = parseFloat(process.env.LOG_SAMPLING || '1.0'); // Reserved for future sampling implementation
const CUSTOM_REDACT_KEYS = process.env.LOG_REDACT_KEYS
  ? process.env.LOG_REDACT_KEYS.split(',')
  : [];

// Default PII patterns to redact from logs
const DEFAULT_PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
};

// Default redaction keys (can be extended via LOG_REDACT_KEYS)
const DEFAULT_REDACT_KEYS = [
  'password',
  'token',
  'authorization',
  'secret',
  'cookie',
  'apiKey',
  'api_key',
  'access_token',
  'refresh_token',
  'sessionId',
  'session_id',
  'jwt',
  'bearer',
];

// Combine default and custom redaction keys
const ALL_REDACT_KEYS = [...DEFAULT_REDACT_KEYS, ...CUSTOM_REDACT_KEYS];

/**
 * Deep redaction of sensitive keys in objects
 */
function redactSensitiveKeys(obj: unknown, maxDepth = 10): unknown {
  if (maxDepth <= 0 || obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveKeys(item, maxDepth - 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const shouldRedact = ALL_REDACT_KEYS.some((redactKey) =>
      lowerKey.includes(redactKey.toLowerCase())
    );

    if (shouldRedact) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitiveKeys(value, maxDepth - 1);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Winston format to redact PII from log messages and implement ECS format
 */
const redactPII = winston.format((info) => {
  // Redact PII patterns in message string
  if (typeof info.message === 'string') {
    let message = info.message;
    Object.entries(DEFAULT_PII_PATTERNS).forEach(([type, pattern]) => {
      message = message.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
    });
    info.message = message;
  }

  // Redact sensitive keys in metadata
  if (info.metadata && typeof info.metadata === 'object') {
    info.metadata = redactSensitiveKeys(info.metadata);
  }

  // Redact any other sensitive properties
  const infoObject = redactSensitiveKeys(info);
  Object.assign(info, infoObject);

  return info;
});

/**
 * ECS formatter for structured logging
 */
const ecsFormat = winston.format((info) => {
  const ecsLog = {
    '@timestamp': info.timestamp,
    'log.level': info.level,
    message: info.message,

    // Service context
    service: {
      name: 'procureflow-web',
      version: packageVersion,
    },

    // Process context
    process: {
      pid: process.pid,
    },

    // Host context
    host: {
      hostname: os.hostname(),
    },

    // Environment context
    labels: {
      env: process.env.NODE_ENV || 'development',
    },
  };

  // Add error context if present
  if (info.stack) {
    Object.assign(ecsLog, {
      error: {
        type: info.name || 'Error',
        message: info.message,
        stack_trace:
          process.env.NODE_ENV === 'development' ? info.stack : undefined,
      },
    });
  }

  // Merge any additional metadata
  const {
    level: _level,
    message: _message,
    timestamp: _timestamp,
    stack: _stack,
    splat: _splat,
    name: _name,
    ...metadata
  } = info;
  if (Object.keys(metadata).length > 0) {
    Object.assign(ecsLog, metadata);
  }

  // Update the info object with ECS structure
  Object.assign(info, ecsLog);
  return info;
});

/**
 * Human-readable format for development
 */
const humanFormat = winston.format.combine(
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
);

/**
 * Create Winston logger instance with environment-based configuration
 */
const createLogger = () => {
  // Return no-op logger if logging is disabled
  if (!LOG_ENABLED) {
    return {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
      child: () => createLogger(),
    };
  }

  const transports: winston.transport[] = [];

  // Console transport (always enabled when logging is on)
  const consoleFormat =
    LOG_FORMAT === 'ecs'
      ? winston.format.combine(
          winston.format.timestamp(),
          redactPII(),
          winston.format.errors({ stack: true }),
          ecsFormat(),
          winston.format.printf((info) => JSON.stringify(info))
        )
      : humanFormat;

  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
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
            host: process.env.LOKI_HOST!,
            labels: {
              app: 'procureflow',
              component: 'web',
              environment: process.env.NODE_ENV || 'development',
            },
            json: true,
            format: winston.format.combine(
              winston.format.timestamp(),
              redactPII(),
              winston.format.errors({ stack: true }),
              ecsFormat()
            ),
            replaceTimestamp: true,
            onConnectionError: (err) =>
              console.error('Loki connection error:', err),
          })
        );
        logger.info('Loki transport enabled for structured logging');
      })
      .catch((err) => {
        console.error('Failed to load winston-loki:', err);
      });
  }

  return winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
      winston.format.timestamp(),
      redactPII(),
      winston.format.errors({ stack: true }),
      LOG_FORMAT === 'ecs' ? ecsFormat() : winston.format.json()
    ),
    defaultMeta: {
      service: {
        name: 'procureflow-web',
        version: packageVersion,
      },
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
