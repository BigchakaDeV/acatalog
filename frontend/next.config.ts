import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/media/**' },
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/media/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/media/**' },
      { protocol: 'http', hostname: 'localhost', pathname: '/media/**' },
      { protocol: 'https', hostname: 'localhost', pathname: '/media/**' },
    ],
  },
};

export default nextConfig;
