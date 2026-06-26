import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Required for Cloudflare Pages compatibility
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Turbopack config for Next.js 16+ (Turbopack is the default bundler)
  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Legacy webpack config (used when building with --webpack flag)
  webpack: (config, { dev, isServer }) => {
    // Add path alias for @ -> src
    config.resolve.alias = config.resolve.alias || {};
    if (typeof config.resolve.alias === 'object') {
      (config.resolve.alias as Record<string, string>)['@'] = path.resolve(__dirname, 'src');
    }

    if (!dev && !isServer) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { codecovWebpackPlugin } = require('@codecov/webpack-plugin');
        config.plugins.push(
          codecovWebpackPlugin({
            enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
            bundleName: 'mycodexvantaos-nextjs',
            uploadToken: process.env.CODECOV_TOKEN,
          })
        );
      } catch {
        // codecov plugin not available, skip
      }
    }
    return config;
  },
};

export default nextConfig;
