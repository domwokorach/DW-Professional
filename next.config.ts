import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // AVIF where supported (usually smaller than WebP), WebP otherwise.
    formats: ['image/avif', 'image/webp'],
    // Cloudinary URLs are versioned (…/v123/…), so an optimised copy never goes stale.
    minimumCacheTTL: 2678400,
    qualities: [75, 85],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/dkkuwmr42/**' },
    ],
  },
};

export default nextConfig;
