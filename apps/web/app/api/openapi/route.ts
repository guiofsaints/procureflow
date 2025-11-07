/**
 * OpenAPI Spec Endpoint
 *
 * GET /api/openapi - Returns OpenAPI 3.0 specification
 */

import { NextResponse } from 'next/server';

import { getOpenApiDocument } from '@/server/openapi';

export async function GET() {
  const spec = getOpenApiDocument();

  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
