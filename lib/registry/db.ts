// PrismaClient singleton. Cached on globalThis so Next.js dev HMR does not open
// a new connection pool on every reload (Hostinger shared MySQL caps connections;
// DATABASE_URL keeps connection_limit=5). See ARCHITECTURE §1.

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
