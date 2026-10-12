import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { daysAgo } from "@/lib/dates";

export type ReportContext = {
  periodStart: string;
  periodEnd: string;
  gaps: string[];
  body: {
    sleep: { id: string; occurredAt: string; durationHours: number }[];
    meals: { id: string; description: string }[];
    vitals: { id: string; name: string; value: string }[];
  };
  mind: { id: string; calendarDate: string; score: number; note: string | null }[];
  work: {
    company: string | null;
    techCount: number;
    expressions: { id: string; context: string }[];
  };
  relations: {
    interactions: { id: string; note: string; feelingScore: number }[];
  };
  finance: {
    latestNetWorthCents: number | null;
    literacy: { id: string; content: string }[];
  };
};

export async function buildReportContext(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<ReportContext> {
  const [
    sleep,
    meals,
    vitals,
    moods,
    company,
    techCount,
    expressions,
    interactions,
    snapshots,
    literacy,
  ] = await Promise.all([
    prisma.sleepLog.findMany({
      where: { userId, occurredAt: { gte: periodStart, lte: periodEnd } },
      orderBy: { occurredAt: "desc" },
      take: 30,
    }),
    prisma.mealLog.findMany({
      where: { userId, occurredAt: { gte: periodStart, lte: periodEnd } },
      take: 20,
    }),
    prisma.vitalMetric.findMany({
      where: { userId, measuredAt: { gte: periodStart, lte: periodEnd } },
      take: 20,
    }),
    prisma.moodLog.findMany({
      where: { userId, calendarDate: { gte: periodStart, lte: periodEnd } },
      orderBy: { calendarDate: "desc" },
    }),
    prisma.workCompanySnapshot.findFirst({
      where: { userId, isCurrent: true },
    }),
    prisma.techStackItem.count({ where: { userId } }),
    prisma.expressionReview.findMany({
      where: { userId, occurredAt: { gte: periodStart, lte: periodEnd } },
      take: 10,
    }),
    prisma.relationInteraction.findMany({
      where: { userId, occurredAt: { gte: periodStart, lte: periodEnd } },
      take: 15,
    }),
    prisma.financeAssetSnapshot.findMany({
      where: { userId, asOfDate: { gte: periodStart, lte: periodEnd } },
      orderBy: { asOfDate: "desc" },
      take: 5,
    }),
    prisma.financeLiteracyLog.findMany({
      where: { userId, occurredAt: { gte: periodStart, lte: periodEnd } },
      take: 10,
    }),
  ]);

  const gaps: string[] = [];
  if (sleep.length === 0) gaps.push("本周期无睡眠记录");
  if (moods.length === 0) gaps.push("本周期无情绪记录");
  if (interactions.length === 0) gaps.push("本周期无社会关系互动");
  if (snapshots.length === 0) gaps.push("本周期无资产快照");

  const latest = snapshots[0];
  const latestNetWorthCents = latest
    ? latest.cashCents + latest.investmentCents - latest.liabilityCents
    : null;

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    gaps,
    body: {
      sleep: sleep.map((s) => ({
        id: s.id,
        occurredAt: s.occurredAt.toISOString(),
        durationHours: s.durationHours,
      })),
      meals: meals.map((m) => ({ id: m.id, description: m.description })),
      vitals: vitals.map((v) => ({
        id: v.id,
        name: v.name,
        value: v.value,
      })),
    },
    mind: moods.map((m) => ({
      id: m.id,
      calendarDate: m.calendarDate.toISOString(),
      score: m.score,
      note: m.note,
    })),
    work: {
      company: company?.companyName ?? null,
      techCount,
      expressions: expressions.map((e) => ({
        id: e.id,
        context: e.context,
      })),
    },
    relations: {
      interactions: interactions.map((i) => ({
        id: i.id,
        note: i.note,
        feelingScore: i.feelingScore,
      })),
    },
    finance: {
      latestNetWorthCents,
      literacy: literacy.map((l) => ({ id: l.id, content: l.content })),
    },
  };
}

export function contextToCitations(
  ctx: ReportContext,
): Prisma.InputJsonValue {
  const ids: { type: string; id: string }[] = [];
  ctx.body.sleep.forEach((s) => ids.push({ type: "sleep", id: s.id }));
  ctx.mind.forEach((m) => ids.push({ type: "mood", id: m.id }));
  ctx.work.expressions.forEach((e) =>
    ids.push({ type: "expression", id: e.id }),
  );
  ctx.relations.interactions.forEach((i) =>
    ids.push({ type: "interaction", id: i.id }),
  );
  ctx.finance.literacy.forEach((l) =>
    ids.push({ type: "literacy", id: l.id }),
  );
  return { records: ids, gaps: ctx.gaps };
}
