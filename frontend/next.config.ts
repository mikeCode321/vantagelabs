import type { NextConfig } from "next";
import { NextResponse } from 'next/server'

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
};


export function middleware() {
  return new NextResponse('Temporarily offline', { status: 503 })
}

export default nextConfig;