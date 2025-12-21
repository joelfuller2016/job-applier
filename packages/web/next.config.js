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
   * SECURITY: OWASP recommended security headers
   * These headers help protect against common web vulnerabilities
   */
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
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
          {
            // Force HTTPS connections (uncomment in production with valid SSL)
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
