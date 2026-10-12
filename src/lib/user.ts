import { prisma } from "@/lib/db";

const LOCAL_EMAIL = "owner@metaself.local";

/** 单人本地使用，不走登录。 */
export async function getAppUser() {
  const existing = await prisma.user.findUnique({
    where: { email: LOCAL_EMAIL },
  });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      email: LOCAL_EMAIL,
      passwordHash: "local",
      displayName: "我",
      bodyProfile: { create: {} },
      reportSchedule: { create: {} },
    },
  });
}

export async function getAppUserId() {
  const user = await getAppUser();
  return user.id;
}
