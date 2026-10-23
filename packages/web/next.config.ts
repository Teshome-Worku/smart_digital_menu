import path from 'path';
import type { NextConfig } from 'next';

const monorepoRoot =
  typeof __dirname !== 'undefined'
    ? path.resolve(__dirname, '../../')
    : path.resolve(process.cwd(), process.cwd().endsWith('web') ? '../..' : '.');

const nextConfig: NextConfig = {
  transpilePackages: ['@sdm/shared'],
  outputFileTracingRoot: monorepoRoot,
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://127.0.0.1:4000/api/v1/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
