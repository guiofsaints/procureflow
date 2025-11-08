/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript errors during builds (for now)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable App Router (default in Next.js 13+)
  experimental: {
    // Add any experimental features here if needed
  },

  // Standalone output for Docker deployments
  output: 'standalone',

  // Environment variables configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Production optimizations
  compress: true,
  poweredByHeader: false,

  // Image domains for future use
  images: {
    domains: [],
  },

  // Redirects and rewrites can be added here
  async redirects() {
    return [];
  },

  async rewrites() {
    return [];
  },
};
export default nextConfig;
