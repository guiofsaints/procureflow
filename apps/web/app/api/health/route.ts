import { NextResponse } from 'next/server';

import { APP_CONFIG } from '@/lib/constants';

export async function GET() {
  // Basic health check endpoint
  // Future: Add database connectivity check, external service checks, etc.

  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: APP_CONFIG.name.toLowerCase().replace(' ', '-') + '-api',
    version: APP_CONFIG.version,
    environment: process.env.NODE_ENV || 'development',
    checks: {
      api: 'healthy',
      // Future: database: 'healthy' | 'unhealthy',
      // Future: ai_service: 'healthy' | 'unhealthy',
    },
  };

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

// Optional: Add POST method for more detailed health checks
export async function POST() {
  // Future: Implement detailed health checks with database connections
  return NextResponse.json(
    {
      message: 'Detailed health checks not yet implemented',
      status: 'partial',
    },
    { status: 501 }
  );
}
