import { PrismaClient } from 'https://esm.sh/@prisma/client@5.7.1/edge'

let prisma: PrismaClient;

export function getPrismaClient() {
  if (!prisma) {
    const databaseUrl = Deno.env.get('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }
  return prisma;
}
