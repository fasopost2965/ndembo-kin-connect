/** @type {import('next').NextConfig} */
const path = require('path');

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  output: 'standalone',
  // Trace from the workspace root so the standalone bundle includes the
  // pnpm-linked workspace packages (e.g. @nkc/types).
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

module.exports = withPWA(nextConfig);
