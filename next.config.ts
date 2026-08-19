import type { NextConfig } from "next";

const isCapacitorBuild = process.env.SEDABOX_CAPACITOR_BUILD === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,

  // Keep the normal web build exactly as a regular Next.js server build.
  // Static export is enabled only by `npm run build:capacitor`.
  ...(isCapacitorBuild
    ? {
        output: "export" as const,
        // Native WebView rendering benefits from automatic memoization across
        // the large client-side screen trees. Keep the normal web build
        // untouched; this compiler pass is enabled only for build:capacitor.
        reactCompiler: true,
      }
    : {}),

  // Enable gzip compression for all responses
  compress: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*" },
      { protocol: "http", hostname: "*" },
    ],
    unoptimized: true,
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
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
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
