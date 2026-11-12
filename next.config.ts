import type { NextConfig } from "next";

// Cache Components is left off on purpose. Every page here is fully static,
// and the tool route uses `dynamicParams = false` so unknown slugs are a 404
// at the edge. That option is not available with Cache Components.
const nextConfig: NextConfig = {
  experimental: {
    // Scope hoisting merges modules into one scope in production builds.
    // With it on, the video worker fails at start with "Cannot access
    // before initialization", because Mediabunny's MP4 writer has modules
    // that import each other. Dev builds never hoist, so only production
    // broke. Keep this off unless that is retested on a production build.
    turbopackScopeHoisting: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
