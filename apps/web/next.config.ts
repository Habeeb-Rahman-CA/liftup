import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";

const nextConfig: NextConfig = {
  transpilePackages: ["@liftup/types"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
