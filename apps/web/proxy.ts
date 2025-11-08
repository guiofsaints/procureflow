/**
 * Proxy (formerly Middleware) with NextAuth Integration
 *
 * Next.js 16 renamed middleware to proxy to better reflect its purpose.
 *
 * Implements:
 * 1. Authentication via NextAuth withAuth
 * 2. Security headers (helmet-style)
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
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  // This function runs AFTER authentication check
  function proxy(_req) {
    const response = NextResponse.next();

    // Security Headers
    // ================

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
  },
  {
    callbacks: {
      // Authorization callback - determines if user can access the route
      authorized({ token }) {
        // If there is a token, the user is authenticated
        return !!token;
      },
    },
    pages: {
      // Custom sign-in page (instead of default /api/auth/signin)
      signIn: '/auth/signin',
    },
  }
);

// Configure which routes require authentication
export const config = {
  matcher: [
    // Protected routes (require authentication)
    '/catalog/:path*',
    '/cart/:path*',
    '/agent/:path*',
    '/purchase-requests/:path*',
  ],
};
