import type { NextConfig } from "next";
import { NextResponse } from 'next/server'

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
};


export default nextConfig;