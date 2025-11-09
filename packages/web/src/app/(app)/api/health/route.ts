import { NextResponse } from 'next/server';

import { APP_CONFIG } from '@/lib/constants';
import { isDBHealthy } from '@/lib/db/mongoose';

export async function GET() {
  // Check database connectivity
  const dbHealthy = await isDBHealthy();

  const healthData = {
    status: dbHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    service: APP_CONFIG.name.toLowerCase().replace(' ', '-') + '-api',
    version: APP_CONFIG.version,
    environment: process.env.NODE_ENV || 'development',
    checks: {
      api: 'healthy',
      db: dbHealthy ? 'ok' : 'unhealthy',
    },
    uptime: process.uptime(),
  };

  return NextResponse.json(healthData, {
    status: dbHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
