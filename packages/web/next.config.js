/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Allow production builds to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even with TypeScript errors
    ignoreBuildErrors: false,
  },
  transpilePackages: [
    '@job-applier/core',
    '@job-applier/config',
    '@job-applier/database',
    '@job-applier/ai-job-hunter',
    '@job-applier/orchestrator',
    '@job-applier/resume-parser',
  ],
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
    instrumentationHook: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-only packages on client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  /**
   * Security Headers
   * OWASP recommended headers to protect against common attacks
   */
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        // Prevent clickjacking attacks
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        // Prevent MIME type sniffing
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        // Enable XSS filter in browsers
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        // Control referrer information sent with requests
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        // Restrict browser features and APIs
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ];

    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains',
      });
    }

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
