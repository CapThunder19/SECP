/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable in dev so hooks don't double-fire
  experimental: {
    // Tree-shake heavy Web3 packages so only used exports are bundled
    optimizePackageImports: [
      'viem',
      'wagmi',
      '@rainbow-me/rainbowkit',
      'lucide-react',
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      path: false,
      os: false,
    };

    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
      'react-native': false,
    };

    return config;
  },
};

module.exports = nextConfig;
