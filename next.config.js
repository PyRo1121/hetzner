if (typeof globalThis.self === 'undefined') {
  globalThis.self = globalThis;
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false, // Keep TypeScript checking enabled
  },
  reactStrictMode: true,
  
  // Allow dev origins for HMR
  allowedDevOrigins: ['10.133.134.10'],
  
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-tabs',
      'framer-motion',
      'date-fns',
      '@visx/heatmap',
      '@visx/scale',
      '@visx/legend',
      'd3',
      'zod',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
    reactCompiler: true,
    // Optimize CSS
    optimizeCss: true,
  },
  
  serverExternalPackages: [
    '@sentry/nextjs',
    '@sentry/node',
    '@prisma/instrumentation',
  ],
  
  // Turbopack config (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'render.albiononline.com',
        pathname: '/v1/item/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.albiononline.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Optimize package imports
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Partytown configuration for third-party scripts
  async headers() {
    // Avoid strict cross-origin isolation headers in development to reduce
    // chances of interfering with HMR or chunk loading.
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Webpack configuration for WASM and other optimizations
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), {
        sharp: 'commonjs sharp',
        canvas: 'commonjs canvas',
        '@napi-rs/canvas': 'commonjs @napi-rs/canvas',
        fs: 'commonjs fs',
        net: 'commonjs net',
        tls: 'commonjs tls',
        '@sentry/nextjs': 'commonjs @sentry/nextjs',
        '@sentry/node': 'commonjs @sentry/node',
      }];
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
