import { prisma } from "@/lib/db";
import {
  calendarDateInTimezone,
  daysAgo,
  endOfDayUtcForTimezone,
  startOfDayUtcForTimezone,
} from "@/lib/dates";

export type DomainKey = "body" | "mind" | "work" | "relations" | "finance";

export type DomainStatus = {
  key: DomainKey;
  label: string;
  href: string;
  status: "ok" | "attention" | "empty";
  summary: string;
};

export async function getTodayStatuses(userId: string): Promise<DomainStatus[]> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { timezone: true },
  });
  const tz = user.timezone;
  const today = calendarDateInTimezone(new Date(), tz);
  const dayStart = startOfDayUtcForTimezone(new Date(), tz);
  const dayEnd = endOfDayUtcForTimezone(new Date(), tz);

  const [
    sleepToday,
    moodToday,
    expressionRecent,
    interactionRecent,
    assetRecent,
  ] = await Promise.all([
    prisma.sleepLog.findFirst({
      where: {
        userId,
        occurredAt: { gte: dayStart, lte: dayEnd },
      },
    }),
    prisma.moodLog.findFirst({
      where: { userId, calendarDate: today },
    }),
    prisma.expressionReview.findFirst({
      where: { userId, occurredAt: { gte: daysAgo(7) } },
      orderBy: { occurredAt: "desc" },
    }),
    prisma.relationInteraction.findFirst({
      where: { userId, occurredAt: { gte: daysAgo(30) } },
      orderBy: { occurredAt: "desc" },
    }),
    prisma.financeAssetSnapshot.findFirst({
      where: { userId, asOfDate: { gte: daysAgo(30) } },
      orderBy: { asOfDate: "desc" },
    }),
  ]);

  const bodySummary = sleepToday
    ? `睡眠 ${sleepToday.durationHours} 小时`
    : "今日未记睡眠";
  const mindSummary = moodToday
    ? `情绪 ${moodToday.score}/5`
    : "今日未记情绪";

  return [
    {
      key: "body",
      label: "身体",
      href: "/body",
      status: sleepToday ? "ok" : "attention",
      summary: bodySummary,
    },
    {
      key: "mind",
      label: "精神",
      href: "/mind",
      status: moodToday ? "ok" : "attention",
      summary: mindSummary,
    },
    {
      key: "work",
      label: "工作",
      href: "/work",
      status: expressionRecent ? "ok" : "empty",
      summary: expressionRecent
        ? `近 7 日有表达复盘`
        : "近 7 日无表达复盘",
    },
    {
      key: "relations",
      label: "社会关系",
      href: "/relations",
      status: interactionRecent ? "ok" : "attention",
      summary: interactionRecent
        ? `近 30 日有互动`
        : "近 30 日无互动记录",
    },
    {
      key: "finance",
      label: "财务",
      href: "/finance",
      status: assetRecent ? "ok" : "attention",
      summary: assetRecent
        ? `近 30 日有资产快照`
        : "近 30 日无资产快照",
    },
  ];
}

export async function getReportScheduleCard(userId: string) {
  const schedule = await prisma.reportSchedule.findUnique({
    where: { userId },
  });
  if (!schedule?.nextBiweeklyDue) return null;
  const due = schedule.nextBiweeklyDue <= new Date();
  if (!due) return null;
  return { due: true as const, nextMonthlyDue: schedule.nextMonthlyDue };
}
