import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const requiredDelegates = [
  "medicalVisitLog",
  "choreLog",
  "kitchenSeasoning",
  "kitchenVegetable",
  "kitchenMeat",
  "kitchenDish",
  "kitchenCleaning",
  "workCredential",
  "financeHolding",
  "financeHoldingLog",
] as const;

function choreLogHasCompletedAtField() {
  return (
    Prisma.dmmf.datamodel.models
      .find((m) => m.name === "ChoreLog")
      ?.fields.some((f) => f.name === "completedAt") ?? false
  );
}

function clientIsFresh(client: PrismaClient) {
  if (!choreLogHasCompletedAtField()) {
    return false;
  }
  return requiredDelegates.every((key) => {
    const delegate = (client as Record<string, unknown>)[key];
    return delegate != null && typeof delegate === "object" && "findMany" in delegate;
  });
}

function createPrismaClient() {
  return new PrismaClient();
}

/** Dev 热更新会缓存旧 PrismaClient；schema 增表后需丢弃无新 delegate 的实例。 */
function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  if (cached && clientIsFresh(cached)) {
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

/** 每次属性访问时校验 delegate，避免 HMR 后仍持有旧单例。 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
