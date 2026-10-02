import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  // Version-skew protection: tabs opened before a deploy detect the new
  // deployment on their next navigation and do a full reload instead of
  // requesting assets that no longer exist. Vercel sets this per deployment;
  // undefined elsewhere (e.g. Cloudflare builds), which leaves it off.
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
  images: {
    qualities: [75, 80],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dkkuwmr42/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
