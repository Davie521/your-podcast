import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN access for mobile testing — update IP to match your network
  allowedDevOrigins: ["192.168.68.54"],
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
