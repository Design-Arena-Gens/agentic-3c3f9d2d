/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["fabric", "file-saver"],
  },
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
