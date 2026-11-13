import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: false,
  experimental: {
    // Next 16.4 enables the agent security nudge by default and exits the
    // dev server after showing it. Keep local development interactive; the
    // dependency upgrade remains a separate maintenance task.
    agentUpgrade: false,
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
