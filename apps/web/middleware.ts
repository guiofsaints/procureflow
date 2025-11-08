/**
 * Security Headers Middleware
 *
 * Implements helmet-style security headers for Next.js App Router
 *
 * Headers configured:
 * - X-Frame-Options: Prevent clickjacking
 * - X-Content-Type-Options: Prevent MIME sniffing
 * - X-XSS-Protection: Enable XSS protection (legacy)
 * - Referrer-Policy: Control referrer information
 * - Permissions-Policy: Control browser features
 * - Content-Security-Policy: Comprehensive CSP
 */

import { NextRequest, NextResponse } from 'next/server';

export function middleware(_request: NextRequest) {
  // Get response
  const response = NextResponse.next();

  // X-Frame-Options: Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options: Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection: Enable XSS protection (legacy, but still useful)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy: Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy: Control browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Content-Security-Policy: Comprehensive CSP
  // Note: This is a strict policy - adjust as needed for third-party integrations
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Allow Next.js scripts
    "style-src 'self' 'unsafe-inline'", // Allow inline styles for Tailwind
    "img-src 'self' data: https:", // Allow images from data URIs and HTTPS
    "font-src 'self' data:", // Allow fonts from self and data URIs
    "connect-src 'self' https://api.openai.com", // Allow API connections to OpenAI
    "frame-ancestors 'none'", // Prevent embedding (same as X-Frame-Options: DENY)
    "base-uri 'self'", // Restrict base tag
    "form-action 'self'", // Restrict form submissions
    'upgrade-insecure-requests', // Force HTTPS
  ];

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // Strict-Transport-Security: Force HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
