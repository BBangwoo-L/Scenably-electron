import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: '.next',
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: true,  // Electron에서 필요
};

export default nextConfig;
