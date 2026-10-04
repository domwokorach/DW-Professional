import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The portfolio lives at /en-gb. Temporary (307) for now; switch to permanent once the domain
  // setup is final, since browsers cache permanent redirects indefinitely.
  async redirects() {
    return [{ source: '/', destination: '/en-gb', permanent: false }];
  },
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
