"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";
import { loadAllChatMessages } from "@/lib/relation/chat-archive";
import { requestModel } from "@/lib/relation/ai-analysis";
import { formatPersonaMemory, PERSONA_DATA_RANGE, preparePack, retrievePersonaSessions, personaPrompt, type PersonaPack } from "@/lib/relation/persona-core";
import { normalizePersonaReply } from "@/lib/relation/persona-message-shape";

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

async function owned(id: string) {
  const user = await getAppUser();
  const report = await prisma.relationAiReport.findFirst({ where: { id, userId: user.id, status: "PERSONA" } });
  if (!report) throw new Error("角色资料不存在。");
  return { report, pack: structuredClone(report.evidenceJson) as unknown as PersonaPack };
}

export async function savePersonaNotes(id: string, notes: string) {
  if (typeof notes !== "string" || notes.length > 12000) throw new Error("修订内容最多12000字。");
  const { report, pack } = await owned(id); pack.notes = notes;
  const updated = await prisma.relationAiReport.updateMany({ where: { id, evidenceJson: { equals: json(report.evidenceJson) } }, data: { evidenceJson: json(pack) } });
  if (!updated.count) throw new Error("资料已更新，请刷新后重试。");
}

export async function chatPersona(id: string, history: { role: "user" | "assistant"; content: string }[]) {
  const { report, pack } = await owned(id);
  if (!Array.isArray(history) || history.length > 40 || !history.length || history.some(m => !["user", "assistant"].includes(m.role) || typeof m.content !== "string" || m.content.length > 4000)) throw new Error("对话内容过长或格式无效。");
  const archive = await loadAllChatMessages(pack.sourceKey);
  const prepared = preparePack(archive, pack.role, pack.name, pack.sourceKey, PERSONA_DATA_RANGE.end);
  const training = prepared.batches.flat();
  const uniqueTraining = [...new Map(training.map((message) => [message.id, message])).values()];
  const query = history.filter((turn) => turn.role === "user").map((turn) => turn.content).join("\n");
  const retrieved = retrievePersonaSessions(uniqueTraining, PERSONA_DATA_RANGE.end, query);
  const memory = formatPersonaMemory(retrieved, pack.role, pack.name, pack.counterpart);
  const runtimePack: PersonaPack = {
    ...pack,
    cutoff: PERSONA_DATA_RANGE.end,
    sourceCount: prepared.pack.sourceCount,
    trainingCount: prepared.pack.trainingCount,
    heldoutCount: prepared.pack.heldoutCount,
    stats: prepared.pack.stats,
    examples: prepared.pack.examples,
  };
  const result = await requestModel(report.userId, personaPrompt(runtimePack, history.at(-1)!.content, memory), `以下是本次模拟对话（不是历史事实），请回复最后一条用户消息：\n${JSON.stringify(history)}`);
  return normalizePersonaReply(result.content);
}

export async function evaluatePersona(id: string, index: number) {
  const { report, pack } = await owned(id);
  const test = pack.tests[index];
  if (!test || !Number.isInteger(index)) throw new Error("没有对应测试样本。");
  const before = test.reply[0].timestamp;
  const evidence = new Map(pack.evidence.map(m => [m.id, m]));
  const historical: PersonaPack = { ...pack, notes: "", cutoff: test.context.at(-1)!.day,
    claims: pack.claims.filter(c => (c.availableThrough ?? Infinity) < before && c.evidence.every(id => (evidence.get(id)?.timestamp ?? Infinity) < before)),
    examples: pack.examples.filter(e => e.reply.every(m => m.timestamp < before)),
    stats: { messages: 0, averageLength: 0, questionRate: 0 },
    profile: undefined,
  };
  const input = `继续这段对话，只写目标人物下一轮回复：${JSON.stringify(test.context)}`;
  const [baseline, simulated] = await Promise.all([
    requestModel(report.userId, `请模拟${pack.name}与${pack.counterpart}聊天，不编造已知范围外的经历。`, input),
    requestModel(report.userId, personaPrompt(historical, test.context.at(-1)!.text), input),
  ]);
  return { baseline: baseline.content, simulated: simulated.content, actual: test.reply.map(m => m.text).join("\n") };
}
