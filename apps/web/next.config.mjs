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
