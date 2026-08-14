import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hostinger managed Node.js uses next start; Docker/VPS can request standalone output.
  output: process.env.DOCKER_BUILD ? 'standalone' : undefined,
  reactStrictMode: true,
  transpilePackages: ['three', '@psova/domain', '@psova/content', '@psova/ui'],
  // Keep Prisma native engine binaries out of Next.js server bundle tracing.
  serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default withNextIntl(nextConfig);
