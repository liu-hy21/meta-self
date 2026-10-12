import { prisma } from "@/lib/db";
import { endOfDayUtcForTimezone, startOfDayUtcForTimezone } from "@/lib/dates";

export type BodyItemKey = "today" | "profile" | "sleep" | "meals" | "vitals";

export type BodyNavItem = {
  key: BodyItemKey;
  label: string;
  href: string;
  status: "ok" | "attention";
  summary: string;
};

export type BodyEvidence = {
  sleep: number;
  meals: number;
  vitals: number;
  recent: { label: string; detail: string }[];
};

export type BodyBoard = {
  items: BodyNavItem[];
  evidence: BodyEvidence;
};

function formatWhen(date: Date) {
  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function getBodyBoard(userId: string): Promise<BodyBoard> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { timezone: true },
  });
  const dayStart = startOfDayUtcForTimezone(new Date(), user.timezone);
  const dayEnd = endOfDayUtcForTimezone(new Date(), user.timezone);

  const [profile, sleepCount, mealCount, vitalCount, sleepToday, mealToday, latestVital, latestSleep, latestMeal] =
    await Promise.all([
      prisma.bodyProfile.findUnique({ where: { userId } }),
      prisma.sleepLog.count({ where: { userId } }),
      prisma.mealLog.count({ where: { userId } }),
      prisma.vitalMetric.count({ where: { userId } }),
      prisma.sleepLog.findFirst({
        where: { userId, occurredAt: { gte: dayStart, lte: dayEnd } },
        orderBy: { occurredAt: "desc" },
      }),
      prisma.mealLog.findFirst({
        where: { userId, occurredAt: { gte: dayStart, lte: dayEnd } },
        orderBy: { occurredAt: "desc" },
      }),
      prisma.vitalMetric.findFirst({
        where: { userId },
        orderBy: { measuredAt: "desc" },
      }),
      prisma.sleepLog.findFirst({
        where: { userId },
        orderBy: { occurredAt: "desc" },
      }),
      prisma.mealLog.findFirst({
        where: { userId },
        orderBy: { occurredAt: "desc" },
      }),
    ]);

  const filled = [
    profile?.heightCm,
    profile?.weightKg,
    profile?.birthDate,
    profile?.gender,
    profile?.bloodType,
    profile?.chestCm,
    profile?.waistCm,
    profile?.thighCm,
  ].filter((value) => value !== null && value !== undefined && value !== "").length;

  const recent: BodyEvidence["recent"] = [];
  if (latestSleep) {
    recent.push({
      label: "睡眠",
      detail: `${formatWhen(latestSleep.occurredAt)} · ${latestSleep.durationHours} 小时`,
    });
  }
  if (latestMeal) {
    recent.push({
      label: "饮食",
      detail: `${formatWhen(latestMeal.occurredAt)} · ${latestMeal.description}`,
    });
  }
  if (latestVital) {
    recent.push({
      label: latestVital.name,
      detail: `${formatWhen(latestVital.measuredAt)} · ${latestVital.value}${latestVital.unit ?? ""}`,
    });
  }

  return {
    items: [
      {
        key: "today",
        label: "今日身体",
        href: "/",
        status: sleepToday ? "ok" : "attention",
        summary: sleepToday ? `睡眠 ${sleepToday.durationHours} 小时` : "今日未记睡眠",
      },
      {
        key: "profile",
        label: "档案",
        href: "/body/profile",
        status: filled >= 2 ? "ok" : "attention",
        summary: "身体、饮食与睡眠",
      },
      {
        key: "sleep",
        label: "睡眠",
        href: "/body/sleep",
        status: sleepToday ? "ok" : "attention",
        summary: sleepToday
          ? `今日 ${sleepToday.durationHours} 小时`
          : sleepCount === 0
            ? "还没有睡眠记录"
            : `共 ${sleepCount} 条，今日未记`,
      },
      {
        key: "meals",
        label: "饮食",
        href: "/body/meals",
        status: mealToday ? "ok" : "attention",
        summary: mealToday
          ? mealToday.description
          : mealCount === 0
            ? "还没有饮食记录"
            : "今日还没记一餐",
      },
      {
        key: "vitals",
        label: "体征",
        href: "/body/vitals",
        status: latestVital ? "ok" : "attention",
        summary: latestVital
          ? `${latestVital.name} ${latestVital.value}${latestVital.unit ?? ""}`
          : "还没有手填指标",
      },
    ],
    evidence: {
      sleep: sleepCount,
      meals: mealCount,
      vitals: vitalCount,
      recent,
    },
  };
}

export function bmi(heightCm?: number | null, weightKg?: number | null) {
  if (!heightCm || !weightKg || heightCm <= 0) return null;
  const meters = heightCm / 100;
  return Math.round((weightKg / (meters * meters)) * 10) / 10;
}
