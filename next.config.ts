import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: '.next',
  output: 'export',  // 정적 export로 설정
  assetPrefix: './',  // Electron용 상대 경로 설정
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
