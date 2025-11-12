/**
 * Proxy (formerly Middleware) with NextAuth Integration
 *
 * Next.js 16 renamed middleware to proxy to better reflect its purpose.
 *
 * Implements:
 * 1. Intercept Nextra metadata files for static docs
 * 2. Authentication via NextAuth withAuth
 * 3. Security headers (helmet-style)
 *
 * Headers configured:
 * - X-Frame-Options: Prevent clickjacking
 * - X-Content-Type-Options: Prevent MIME sniffing
 * - X-XSS-Protection: Enable XSS protection (legacy)
 * - Referrer-Policy: Control referrer information
 * - Permissions-Policy: Control browser features
 * - Content-Security-Policy: Comprehensive CSP
 * - Strict-Transport-Security: Force HTTPS (production only)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';

function applySecurityHeaders(response: NextResponse) {
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
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.openai.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ];

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // Strict-Transport-Security: Force HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }
}

// Wrapper to handle both public docs and protected routes
const authMiddleware = withAuth(
  function authProxy(_req) {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!token;
      },
    },
    pages: {
      signIn: '/',
    },
  }
);

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // For documentation routes, allow public access with security headers
  if (pathname.startsWith('/docs')) {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // For protected routes, use NextAuth authentication
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- withAuth typing is incompatible with direct call, but functionally correct
  return (authMiddleware as any)(req, {} as any);
}

// Configure which routes this proxy handles
export const config = {
  matcher: [
    '/docs/:path*',
    '/catalog/:path*',
    '/cart/:path*',
    '/agent/:path*',
    '/purchase/:path*',
    '/settings/:path*',
  ],
};
