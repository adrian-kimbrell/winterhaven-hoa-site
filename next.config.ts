import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF is typically 30-50% smaller than WebP for photos.
    formats: ["image/avif", "image/webp"],
    // 60 for the full-bleed hero (text sits on a dark scrim, so the
    // extra compression is invisible); 75 is the default elsewhere.
    qualities: [60, 75],
  },
  experimental: {
    // Matches Vercel's 4.5 MB request cap, so local runs (and the E2E
    // tests) fail the same way production would. Photos are shrunk in
    // the browser before upload — see components/upload-input.tsx.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
};

export default nextConfig;
