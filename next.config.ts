import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,

  // Enable gzip compression for all responses
  compress: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*" },
      { protocol: "http", hostname: "*" },
    ],
    // Smaller set of device sizes => fewer generated images, faster builds
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Use modern formats
    formats: ["image/avif", "image/webp"],
    // Keep optimised images cached longer on disk (30 days)
    minimumCacheTTL: 2592000,
  },

  // SWC compiler optimisations
  compiler: {
    // Remove console.log in production builds
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // Experimental performance flags
  experimental: {
    // Enable SWC-based CSS minification
    optimizeCss: false, // requires critters – keep off unless installed
    // Scroll restoration handled by our NavigationContext
    scrollRestoration: true,
  },
};

export default nextConfig;
