import { prisma } from "@/lib/db";
import { loadAllChatMessages } from "@/lib/relation/chat-archive";
import { buildRelationAiPrompt, type RelationAiSample } from "@/lib/relation/ai-prompt";
import type { RelationMetrics } from "@/lib/relation/types";

function sampleMessages(messages: Awaited<ReturnType<typeof loadAllChatMessages>>): RelationAiSample[] {
  const eligible = messages.filter((message) => message.kind === "text" && message.text.trim());
  if (!eligible.length) return [];
  const selected: RelationAiSample[] = [];
  const stride = Math.max(1, Math.floor(eligible.length / 96));
  for (let index = 0; index < eligible.length && selected.length < 96; index += stride) {
    const message = eligible[index];
    selected.push({ id: message.id, time: message.time, sender: message.isSelf ? "我" : message.sender, text: message.text.slice(0, 240) });
  }
  for (const message of eligible.slice(-24)) {
    if (selected.some((item) => item.id === message.id)) continue;
    selected.push({ id: message.id, time: message.time, sender: message.isSelf ? "我" : message.sender, text: message.text.slice(0, 240) });
  }
  return selected.slice(0, 120);
}

async function requestModel(system: string, user: string) {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) throw new Error("尚未配置 LLM_API_KEY，暂时无法生成 AI 分析。");
  const baseUrl = (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature: 0.35 }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`模型请求失败（HTTP ${response.status}）。`);
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("模型没有返回可用内容。");
    return { model, content };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getLatestRelationAiReport(userId: string, personId: string) {
  return prisma.relationAiReport.findFirst({ where: { userId, personId }, orderBy: { createdAt: "desc" } });
}

export async function generateRelationAiReport(userId: string, personId: string) {
  const person = await prisma.relationPerson.findFirst({ where: { id: personId, userId }, include: { archives: true } });
  if (!person) throw new Error("人物档案不存在。");
  const archive = person.archives[0];
  if (!archive) throw new Error("这个人物还没有连接聊天档案。");
  if (!archive.metricsJson || typeof archive.metricsJson !== "object" || (archive.metricsJson as { version?: unknown }).version !== "2026-11-v2") throw new Error("请先在人物管理中完成数据分析，再生成 AI 分析。");

  const messages = await loadAllChatMessages(archive.sourceKey);
  if (!messages.length) throw new Error("聊天档案为空，无法生成 AI 分析。");
  const metrics = archive.metricsJson as RelationMetrics;
  const periodStart = messages[0].day;
  const periodEnd = messages.at(-1)?.day ?? periodStart;
  const prompt = buildRelationAiPrompt({ personName: person.name, periodStart, periodEnd, metrics, samples: sampleMessages(messages) });
  const { model, content } = await requestModel(prompt.system, prompt.user);
  const evidenceIds = prompt.user.match(/msg-\d{6}/g) ?? [];
  return prisma.relationAiReport.create({
    data: {
      userId,
      personId,
      periodStart: new Date(`${periodStart}T00:00:00+08:00`),
      periodEnd: new Date(`${periodEnd}T23:59:59.999+08:00`),
      model,
      status: "COMPLETED",
      contentMarkdown: content,
      evidenceJson: { messageIds: [...new Set(evidenceIds)], sampleCount: sampleMessages(messages).length },
      completedAt: new Date(),
    },
  });
}
