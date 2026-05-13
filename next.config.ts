import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  allowedDevOrigins: ["192.168.0.107", "192.168.0.102", "192.168.0.105"],
};

export default nextConfig;
