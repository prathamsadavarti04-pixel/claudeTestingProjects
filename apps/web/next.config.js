/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 16 defaults to Turbopack, which resolves node_modules differently
  // than webpack did. Prisma's generated client ships native bits that
  // Turbopack's bundler shouldn't try to trace through — this keeps it as
  // a plain runtime `require`/`import` instead.
  serverExternalPackages: ["@prisma/client", "@octokit/app"],

  eslint: {
    // Type-checking runs separately via `npm run type-check`; don't block
    // `next build` on lint so CI stages stay independent.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
