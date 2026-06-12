import type { NextConfig } from 'next';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(fileURLToPath(import.meta.url));
const backendOrigin = process.env.BACKEND_ORIGIN || 'http://127.0.0.1:8000';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.14', 'acatalog.cezarvault.uk', 'acatalog1.cezarvault.uk'],
  devIndicators: false,
  skipTrailingSlashRedirect: true,
  turbopack: {
    root,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/admin/',
          destination: `${backendOrigin}/dashboard/`,
        },
        {
          source: '/admin',
          destination: `${backendOrigin}/dashboard/`,
        },
        {
          source: '/dashboard/',
          destination: `${backendOrigin}/dashboard/`,
        },
        {
          source: '/dashboard',
          destination: `${backendOrigin}/dashboard/`,
        },
        {
          source: '/python-dashboard/',
          destination: `${backendOrigin}/python-dashboard/`,
        },
        {
          source: '/python-dashboard',
          destination: `${backendOrigin}/python-dashboard/`,
        },
        {
          source: '/api/:path*',
          destination: `${backendOrigin}/api/:path*/`,
        },
        {
          source: '/media/:path*',
          destination: `${backendOrigin}/media/:path*`,
        },
      ],
    };
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'acatalog.cezarvault.uk', pathname: '/media/**' },
      { protocol: 'https', hostname: 'acatalog1.cezarvault.uk', pathname: '/media/**' },
      { protocol: 'http', hostname: '192.168.0.14', port: '8000', pathname: '/media/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/media/**' },
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/media/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/media/**' },
      { protocol: 'http', hostname: 'localhost', pathname: '/media/**' },
      { protocol: 'https', hostname: 'localhost', pathname: '/media/**' },
    ],
  },
};

export default nextConfig;
