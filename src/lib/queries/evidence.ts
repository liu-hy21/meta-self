import { prisma } from "@/lib/db";

export type EvidenceSnapshot = {
  sleep: number;
  meals: number;
  vitals: number;
  moods: number;
  expressions: number;
  people: number;
  interactions: number;
  snapshots: number;
  literacy: number;
  reports: number;
  recent: { label: string; detail: string }[];
};

export async function getEvidenceSnapshot(userId: string): Promise<EvidenceSnapshot> {
  const [
    sleep,
    meals,
    vitals,
    moods,
    expressions,
    people,
    interactions,
    snapshots,
    literacy,
    reports,
    latestSleep,
    latestMood,
  ] = await Promise.all([
    prisma.sleepLog.count({ where: { userId } }),
    prisma.mealLog.count({ where: { userId } }),
    prisma.vitalMetric.count({ where: { userId } }),
    prisma.moodLog.count({ where: { userId } }),
    prisma.expressionReview.count({ where: { userId } }),
    prisma.relationPerson.count({ where: { userId } }),
    prisma.relationInteraction.count({ where: { userId } }),
    prisma.financeAssetSnapshot.count({ where: { userId } }),
    prisma.financeLiteracyLog.count({ where: { userId } }),
    prisma.report.count({ where: { userId } }),
    prisma.sleepLog.findFirst({
      where: { userId },
      orderBy: { occurredAt: "desc" },
    }),
    prisma.moodLog.findFirst({
      where: { userId },
      orderBy: { calendarDate: "desc" },
    }),
  ]);

  const recent: { label: string; detail: string }[] = [];
  if (latestSleep) {
    recent.push({
      label: "睡眠",
      detail: `${latestSleep.durationHours} 小时`,
    });
  }
  if (latestMood) {
    recent.push({
      label: "情绪",
      detail: `${latestMood.score}/5${latestMood.note ? ` · ${latestMood.note}` : ""}`,
    });
  }

  return {
    sleep,
    meals,
    vitals,
    moods,
    expressions,
    people,
    interactions,
    snapshots,
    literacy,
    reports,
    recent,
  };
}
