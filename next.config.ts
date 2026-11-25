import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { proxyClientMaxBodySize: "32mb" },
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
