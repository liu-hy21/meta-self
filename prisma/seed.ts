import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;
  if (!email || !password) {
    console.log("跳过 seed：未设置 SEED_EMAIL / SEED_PASSWORD");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      displayName: "我",
      reportSchedule: { create: {} },
    },
    update: {},
  });

  await prisma.bodyProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  console.log(`Seed 完成：${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
