/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable experimental features for audio handling
  experimental: {
    esmExternals: true,
  },
  
  // Configure webpack for audio file handling
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add support for audio files
    config.module.rules.push({
      test: /\.(mp3|wav|ogg|m4a|aac|flac)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]',
      },
    });

    // Add support for Web Audio API in client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Optimize for audio processing
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          audio: {
            test: /[\\/]node_modules[\\/](web-audio-api|audio-context|audio-buffer)[\\/]/,
            name: 'audio',
            chunks: 'all',
          },
        },
      },
    };

    return config;
  },

  // Configure headers for audio file serving
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      {
        source: '/:path*.(mp3|wav|ogg|m4a|aac|flac)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },

  // Configure rewrites for audio file handling
  async rewrites() {
    return [
      {
        source: '/audio/:path*',
        destination: '/api/audio/:path*',
      },
    ];
  },

  // Image optimization settings
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Compress responses
  compress: true,

  // Power pack features
  poweredByHeader: false,

  // Trailing slash handling
  trailingSlash: false,

  // Generate ETags for pages
  generateEtags: true,

  // Page extensions
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
};

module.exports = nextConfig;