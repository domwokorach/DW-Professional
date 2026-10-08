import type { NextConfig } from 'next';
import { RESUME_URL } from './src/config/portfolio-access';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The portfolio lives at /en-gb. Temporary (307) for now; switch to permanent once the domain
  // setup is final, since browsers cache permanent redirects indefinitely.
  async redirects() {
    return [
      { source: '/', destination: '/en-gb', permanent: false },
      // The QR code encodes the localised route; the bare one stays valid as a fallback.
      { source: '/portfolio-access', destination: '/en-gb/portfolio-access', permanent: false },
      // The Portfolio Access form links to the localised privacy route; the notice itself lives at /privacy.
      { source: '/en-gb/privacy', destination: '/privacy', permanent: false },
      // Keep previously shared résumé links working after moving the document to Google Drive.
      {
        source: '/Dominic_Wokorach_Olanya_CV.pdf',
        destination: RESUME_URL,
        permanent: true,
      },
    ];
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
