import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Profile forms can carry two 5 MB photos.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
