import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

import { AI_PROVIDER, getModelConfig } from '@/lib/ai/langchainClient';
import { APP_CONFIG } from '@/lib/constants';
import { isDBHealthy } from '@/lib/db/mongoose';

/**
 * Health check endpoint with MongoDB and AI status (OpenAI/Gemini)
 * GET /api/health
 *
 * Returns comprehensive health status including:
 * - Overall service status (ok, degraded, unhealthy)
 * - MongoDB connection details and state
 * - AI API availability and rate limit information (OpenAI or Google Gemini)
 *
 * Example response (with OpenAI):
 * {
 *   "status": "ok",
 *   "timestamp": "2025-11-09T10:30:00.000Z",
 *   "service": "procureflow-api",
 *   "version": "0.1.0",
 *   "environment": "development",
 *   "uptime": 3600.123,
 *   "checks": {
 *     "api": "healthy",
 *     "mongodb": {
 *       "healthy": true,
 *       "readyState": 1,
 *       "readyStateLabel": "connected",
 *       "host": "localhost:27017",
 *       "name": "procureflow"
 *     },
 *     "ai": {
 *       "provider": "openai",
 *       "available": true,
 *       "configured": true,
 *       "status": "healthy",
 *       "rateLimits": {
 *         "requests": {
 *           "limit": 10000,
 *           "remaining": 9995,
 *           "reset": "5s"
 *         },
 *         "tokens": {
 *           "limit": 2000000,
 *           "remaining": 1999000,
 *           "reset": "1m30s"
 *         }
 *       }
 *     }
 *   }
 * }
 *
 * Example response (with Gemini):
 * {
 *   "status": "ok",
 *   "checks": {
 *     "ai": {
 *       "provider": "gemini",
 *       "available": true,
 *       "configured": true,
 *       "status": "healthy",
 *       "models": 15,
 *       "info": "Rate limits: 15 RPM (free tier), 1500 RPD"
 *     }
 *   }
 * }
 *
 * Status codes:
 * - 200: All systems healthy
 * - 503: Service unavailable (MongoDB or AI issues)
 */
export async function GET() {
  // Check database connectivity
  const dbHealthy = await isDBHealthy();

  // Get detailed MongoDB connection status
  const mongoStatus = {
    healthy: dbHealthy,
    readyState: mongoose.connection.readyState,
    readyStateLabel: getMongoReadyStateLabel(mongoose.connection.readyState),
    host: mongoose.connection.host || 'not connected',
    name: mongoose.connection.name || 'not connected',
  };

  // Check OpenAI API status and rate limits
  const aiStatus = await checkAIStatus();

  // Determine overall health status
  const isHealthy = dbHealthy && aiStatus.available;
  const status = isHealthy ? 'ok' : dbHealthy ? 'degraded' : 'unhealthy';

  const healthData = {
    status,
    timestamp: new Date().toISOString(),
    service: APP_CONFIG.name.toLowerCase().replace(' ', '-') + '-api',
    version: APP_CONFIG.version,
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {
      api: 'healthy',
      mongodb: mongoStatus,
      ai: aiStatus,
    },
  };

  return NextResponse.json(healthData, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

/**
 * Get human-readable MongoDB connection state label
 */
function getMongoReadyStateLabel(state: number): string {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  };
  return states[state] || 'unknown';
}

/**
 * Check AI API availability and fetch rate limit information
 * Supports both OpenAI and Google Gemini
 */
async function checkAIStatus() {
  const modelConfig = getModelConfig();
  const provider = AI_PROVIDER;

  if (!modelConfig.available) {
    return {
      provider,
      available: false,
      configured: false,
      message:
        'No AI API key configured (set OPENAI_API_KEY or GOOGLE_API_KEY)',
    };
  }

  try {
    if (provider === 'gemini') {
      return await checkGeminiStatus();
    } else {
      return await checkOpenAIStatus();
    }
  } catch (error) {
    console.error('AI health check error:', error);

    let message = 'Unknown error';
    let errorType = 'unknown';

    if (error instanceof Error) {
      message = error.message;

      if (message.includes('401') || message.includes('authentication')) {
        errorType = 'authentication_error';
        message = 'Invalid API key';
      } else if (message.includes('429') || message.includes('rate limit')) {
        errorType = 'rate_limit_exceeded';
        message = 'Rate limit exceeded';
      } else if (
        message.includes('quota') ||
        message.includes('insufficient_quota')
      ) {
        errorType = 'quota_exceeded';
        message = 'API quota exceeded';
      } else if (message.includes('timeout')) {
        errorType = 'timeout';
        message = 'Request timeout';
      }
    }

    return {
      provider,
      available: false,
      configured: true,
      status: 'unhealthy',
      error: errorType,
      message,
    };
  }
}

/**
 * Check OpenAI API availability and fetch rate limit information
 */
async function checkOpenAIStatus() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      provider: 'openai' as const,
      available: false,
      configured: false,
      message: 'OpenAI API key not configured',
    };
  }

  // Use fetch to make a raw API call and access response headers
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 5,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI API error: ${response.status} ${response.statusText}`
    );
  }

  // Extract rate limit headers
  const headers = response.headers;

  return {
    provider: 'openai' as const,
    available: true,
    configured: true,
    status: 'healthy',
    rateLimits: {
      requests: {
        limit: parseInt(headers.get('x-ratelimit-limit-requests') || '0'),
        remaining: parseInt(
          headers.get('x-ratelimit-remaining-requests') || '0'
        ),
        reset: headers.get('x-ratelimit-reset-requests') || null,
      },
      tokens: {
        limit: parseInt(headers.get('x-ratelimit-limit-tokens') || '0'),
        remaining: parseInt(headers.get('x-ratelimit-remaining-tokens') || '0'),
        reset: headers.get('x-ratelimit-reset-tokens') || null,
      },
    },
  };
}

/**
 * Check Google Gemini API availability
 */
async function checkGeminiStatus() {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return {
      provider: 'gemini' as const,
      available: false,
      configured: false,
      message: 'Google API key not configured',
    };
  }

  try {
    // Make a lightweight request to Gemini API to check availability
    // Using the models.list endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const modelCount = data.models?.length || 0;

    // Note: Gemini API doesn't expose rate limit headers in the same way as OpenAI
    // Rate limits are documented here: https://ai.google.dev/pricing
    return {
      provider: 'gemini' as const,
      available: true,
      configured: true,
      status: 'healthy',
      models: modelCount,
      info: 'Rate limits: 15 RPM (free tier), 1500 RPD',
    };
  } catch (error) {
    throw error;
  }
}
