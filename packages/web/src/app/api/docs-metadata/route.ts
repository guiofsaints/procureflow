/**
 * API Route to handle Nextra metadata files
 *
 * Nextra in development mode tries to fetch metadata files like:
 * - __next.$oc$mdxPath.__PAGE__.txt
 * - __next._tree.txt
 * - {page}.txt
 *
 * These files don't exist in static export, so we return 204 No Content
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Return 204 No Content for all Nextra metadata requests
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

// Disable edge runtime to ensure consistent behavior
export const runtime = 'nodejs';
