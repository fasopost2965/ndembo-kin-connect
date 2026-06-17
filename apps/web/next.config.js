/** @type {import('next').NextConfig} */
const path = require('path');

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // Offline resilience for the unstable Kinshasa network: serve the last-known
  // Athlètes/Clients lists from cache when the network is slow/down.
  runtimeCaching: [
    {
      urlPattern: /\/(athletes|clients)(\?.*)?$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'nkc-lists',
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
});

const nextConfig = {
  output: 'standalone',
  // Trace from the workspace root so the standalone bundle includes the
  // pnpm-linked workspace packages (e.g. @nkc/types).
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

module.exports = withPWA(nextConfig);
