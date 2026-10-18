import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  return new PrismaClient();
}

/** Dev 热更新会缓存旧 PrismaClient；schema 增表后需丢弃无新 delegate 的实例。 */
function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  if (cached && "medicalVisitLog" in cached) {
    return cached;
  }
  if (cached) {
    void cached.$disconnect();
  }
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();
