/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 16 defaults to Turbopack, which resolves node_modules differently
  // than webpack did. Prisma's generated client ships native bits that
  // Turbopack's bundler shouldn't try to trace through — this keeps it as
  // a plain runtime `require`/`import` instead.
  serverExternalPackages: ["@prisma/client", "@octokit/app"],

  // No `eslint` key here on purpose: Next.js 16 removed `next build`'s
  // built-in lint step entirely (not just this config option — linting
  // during build is gone, full stop). Run `npm run lint` separately
  // (CI, pre-commit, or manually) if you want it enforced.
};

module.exports = nextConfig;
