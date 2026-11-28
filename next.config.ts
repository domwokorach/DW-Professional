import type { NextConfig } from 'next';
import { cspReportOnlyHeaders } from './src/lib/security-headers';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
  // Keeps window.opener isolated from other sites while still allowing OAuth-style popups.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  // Report-only for now: reports go to /api/csp-report; enforce once real traffic shows no legitimate violations (SECURITY.md).
  ...cspReportOnlyHeaders(),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework in an X-Powered-By header.
  poweredByHeader: false,
  // Opt-in: lets CI and local test runs build into a separate folder without touching a running `next dev`.
  // Unset (Vercel, normal development) it is the default `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
        // The résumé is only released after email verification (the Resume button), so this old direct
        // address now leads to the portfolio instead of a public file. Temporary: browsers cache permanent redirects.
        destination: '/en-gb',
        permanent: false,
      },
    ];
  },
  // Unfingerprinted static files in /public: cached for a day, then served stale while revalidating, so a redeploy
  // reaches visitors within a day without the browser re-downloading unchanged files on every visit.
  async headers() {
    const cache = [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }];
    return [
      // Baseline hardening for every response. The camera is used by the portfolio-access attachment capture, so it
      // stays available to this origin only. The Content-Security-Policy is report-only (see
      // src/lib/security-headers.ts and SECURITY.md).
      { source: '/((?!admin|api/admin).*)', headers: securityHeaders }, // admin routes get their own (stricter) headers in src/proxy.ts
      ...['/images/:path*', '/hero-poses/:path*', '/draco/:path*', '/certifications/:path*'].map((source) => ({ source, headers: cache })),
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
