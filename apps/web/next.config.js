/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@greenquote/shared'],
  // Produces .next/standalone — a self-contained Node server used by the Docker runner stage.
  output: 'standalone',
  webpack: (config) => {
    // @react-pdf/renderer (via pdfkit) optionally requires canvas; stub it out
    // so webpack doesn't fail trying to bundle the native module.
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
