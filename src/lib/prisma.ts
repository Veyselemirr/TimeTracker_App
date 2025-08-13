import { PrismaClient } from '@prisma/client'

// Global tanımlama (TypeScript için)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma Client'ı tek instance olarak oluştur
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'], // Development'ta SQL sorguları göster
  })

// Development'ta hot reload için global'e kaydet
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma