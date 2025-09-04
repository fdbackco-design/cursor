/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {
  //   appDir: true,
  // },
  transpilePackages: ['@repo/ui', '@repo/contracts'],
  experimental: {
    externalDir: true,
  },
  images: {
    domains: ['example.com', 'localhost'],
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
