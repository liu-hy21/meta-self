import { prisma } from "@/lib/db";
import { loadAllChatMessages } from "@/lib/relation/chat-archive";
import { buildRelationMetrics } from "@/lib/relation/metrics";
import type { RelationMetrics } from "@/lib/relation/types";

export async function analyzeRelationPerson(userId: string, personId: string) {
  const person = await prisma.relationPerson.findFirst({
    where: { id: personId, userId },
    include: { archives: true },
  });
  if (!person) throw new Error("人物档案不存在。");
  const archive = person.archives[0];
  if (!archive) throw new Error("这个人物还没有连接聊天档案。");

  const messages = await loadAllChatMessages(archive.sourceKey);
  if (!messages.length) throw new Error("聊天档案为空，无法完成分析。");
  const metrics = buildRelationMetrics(messages);
  const analyzedAt = new Date();
  await prisma.relationChatArchive.update({
    where: { id: archive.id },
    data: { analysisStatus: "ANALYZED", metricsJson: metrics, analyzedAt },
  });
  return { analysisStatus: "ANALYZED" as const, analyzedAt, metrics: metrics as RelationMetrics };
}
