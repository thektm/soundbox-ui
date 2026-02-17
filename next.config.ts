import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*' },
      { protocol: 'http', hostname: '*' }
    ],
  },
  compress: true,
  reactCompiler: true,
  
};

export default nextConfig;
