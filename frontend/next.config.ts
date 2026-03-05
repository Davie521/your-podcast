import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000";

const nextConfig: NextConfig = {
  // Allow LAN access for mobile testing — update IP to match your network
  allowedDevOrigins: ["192.168.68.54"],
  experimental: {
    viewTransition: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
