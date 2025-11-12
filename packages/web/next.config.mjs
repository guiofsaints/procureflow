/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable App Router (default in Next.js 13+)
  experimental: {
    // Add any experimental features here if needed
  },

  // Standalone output for Docker deployments
  output: 'standalone',

  // Production optimizations
  compress: true,
  poweredByHeader: false,

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '0.1.0',
    NEXT_PUBLIC_GIT_COMMIT_SHA:
      process.env.GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
  },

  // Skip TypeScript checks during build (run separately with tsc)
  // This prevents memory issues and speeds up builds
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image domains for future use
  images: {
    domains: [],
  },

  // Externalize native Node.js modules for server-side only usage
  // winston-loki and snappy have native bindings that can't be bundled by Turbopack
  // tiktoken has WASM files that need to be externalized
  serverExternalPackages: ['winston-loki', 'snappy', 'tiktoken'],

  // Redirects and rewrites can be added here
  async redirects() {
    return [];
  },

  async rewrites() {
    return [];
  },
};
export default nextConfig;
