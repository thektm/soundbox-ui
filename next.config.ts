import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  devIndicators: false,
  images: {
    domains: ['picsum.photos', 'i.scdn.co'],
  },
};

export default nextConfig;
