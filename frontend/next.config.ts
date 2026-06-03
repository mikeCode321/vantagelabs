import type { NextConfig } from "next";

// next.config.ts
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/vantagelabs" : "",
  assetPrefix: isProd ? "/vantagelabs/" : "",
  trailingSlash: true,
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;