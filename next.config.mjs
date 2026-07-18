import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hostinger's managed Node.js pipeline uses `next start`, so `standalone`
  // output is enabled only for the Docker/VPS build path (DOCKER_BUILD=1).
  output: process.env.DOCKER_BUILD ? 'standalone' : undefined,
  reactStrictMode: true,
  transpilePackages: ['three'],
  // Keep Prisma out of the server bundle tracing (native engine binaries).
  serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default withNextIntl(nextConfig);
