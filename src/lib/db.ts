import { PrismaClient } from '@prisma/client';

// Next.js dev rejimida hot-reload paytida ko'p Prisma instance yaratilib
// ketmasligi uchun global cache ishlatamiz.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
