import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone for Netlify deployment with API routes
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: []
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
