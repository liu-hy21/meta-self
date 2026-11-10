import { prisma } from "@/lib/db";
import { buildRelationMetricMethodology } from "@/lib/relation/methodology";
import type { RelationMetrics } from "@/lib/relation/types";

export type RelationMetricLedgerEntry = {
  id: string;
  name: string;
  calculation: string;
  createdAt: Date;
  updatedAt: Date;
};

const fallbackMetricLedger = [
  ["每日动画表情平均数量", "按发送者和自然日统计 [动画表情]，总数除以覆盖自然日，没有发送的日期按 0 计入。"],
  ["每日动画表情最大数量", "按发送者统计单日 [动画表情] 数量，取所有覆盖日期中的最大值。"],
  ["每日图片平均数量", "按发送者和自然日统计图片消息，总数除以覆盖自然日，没有发送的日期按 0 计入。"],
  ["每日图片最大数量", "按发送者统计单日图片消息数量，取所有覆盖日期中的最大值。"],
  ["每日聊天信息平均数量", "按发送者和自然日统计所有非系统消息，总数除以覆盖自然日。"],
  ["每日聊天信息最大数量", "按发送者统计单日所有非系统消息数量，取所有覆盖日期中的最大值。"],
  ["先开口占比", "首条消息或与上一条非系统消息间隔超过 120 分钟时，视为一次新的开口；该方开口次数除以开口总次数。"],
  ["最长沉默小时数", "相邻非系统消息间隔扣除每天 23:00–07:00 的重叠时间，并按沉默后重新发言的一方归属。"],
  ["回复速度平均值", "先确定一次新的开口，之后只有发送者发生变化的对向轮次才算回复，按分钟取平均。"],
];

function defaultEntries(metrics: RelationMetrics | null) {
  if (metrics) {
    return buildRelationMetricMethodology(metrics).flatMap((section) => section.items.map((metric) => ({ name: metric.label, calculation: metric.calculation })));
  }
  return fallbackMetricLedger.map(([name, calculation]) => ({ name, calculation }));
}

export async function listRelationMetricLedger(userId: string, personId: string, metrics: RelationMetrics | null) {
  const person = await prisma.relationPerson.findFirst({ where: { id: personId, userId }, select: { id: true } });
  if (!person) return [];

  let entries = await prisma.relationMetricLedger.findMany({ where: { userId, personId }, orderBy: { createdAt: "asc" } });
  if (!entries.length) {
    await prisma.relationMetricLedger.createMany({ data: defaultEntries(metrics).map((entry) => ({ userId, personId, ...entry })) });
    entries = await prisma.relationMetricLedger.findMany({ where: { userId, personId }, orderBy: { createdAt: "asc" } });
  } else if (metrics) {
    const existingNames = new Set(entries.map((entry) => entry.name));
    const missingEntries = defaultEntries(metrics).filter((entry) => !existingNames.has(entry.name));
    if (missingEntries.length) {
      await prisma.relationMetricLedger.createMany({ data: missingEntries.map((entry) => ({ userId, personId, ...entry })) });
      entries = await prisma.relationMetricLedger.findMany({ where: { userId, personId }, orderBy: { createdAt: "asc" } });
    }
  }
  return entries;
}
