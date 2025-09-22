/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui', '@repo/contracts'],
  experimental: {
    externalDir: true,
  },
  images: {
    domains: ['feedbackmall.com', 'localhost', 'dbf9mgv9dy7hl.cloudfront.net'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dbf9mgv9dy7hl.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'feedbackmall.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
