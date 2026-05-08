import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export",
  // distDir: "dist",

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  allowedDevOrigins: ["192.168.0.107"],
};

export default nextConfig;
