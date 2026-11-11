import type { NextConfig } from "next";

// Cache Components is left off on purpose. Every page here is fully static,
// and the tool route uses `dynamicParams = false` so unknown slugs are a 404
// at the edge. That option is not available with Cache Components.
const nextConfig: NextConfig = {
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
