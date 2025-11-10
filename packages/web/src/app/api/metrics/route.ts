/**
 * Metrics API Endpoint
 *
 * Exposes Prometheus metrics for scraping.
 * Accessible at GET /api/metrics
 */

import { NextResponse } from 'next/server';

import { getMetrics, getContentType } from '@/lib/metrics/prometheus.config';

export async function GET() {
  try {
    const metrics = await getMetrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': getContentType(),
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}
