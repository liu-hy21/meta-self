import type { BoardSnapshot } from "@/lib/board/snapshot";

export type AdviceItem = {
  text: string;
  source: string;
};

const cache = new Map<string, { at: number; items: AdviceItem[] }>();
const TTL_MS = 30 * 60 * 1000;

function cacheKey(snapshot: BoardSnapshot) {
  return JSON.stringify({
    metrics: snapshot.metrics.map((metric) => [metric.id, metric.value, metric.recordedAt.toISOString()]),
    foods: snapshot.foods.map((food) => [food.label, food.items]),
    mind: snapshot.mind,
    work: snapshot.work,
    relation: snapshot.relation,
    finance: snapshot.finance,
    play: snapshot.play,
    logs: snapshot.logs.map((log) => [log.id, log.text]),
  });
}

export async function loadBoardAdvice(snapshot: BoardSnapshot): Promise<AdviceItem[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (
    !apiKey ||
    (snapshot.metrics.length === 0 &&
      snapshot.logs.length === 0 &&
      snapshot.foods.length === 0 &&
      !snapshot.mind &&
      !snapshot.work &&
      !snapshot.relation &&
      !snapshot.finance &&
      !snapshot.play)
  ) {
    return [];
  }

  const key = cacheKey(snapshot);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.items;

  const sources = [
    ...snapshot.metrics.map((metric) => metric.sourceLabel),
    ...snapshot.logs.map((log) => log.sourceLabel),
    ...(snapshot.foods.length > 0 ? ["档案 · 饮食"] : []),
    ...((snapshot.mind?.emotionWords.length || snapshot.metrics.some((metric) => metric.id === "emotion-level")) ? ["档案 · 情绪"] : []),
    ...(snapshot.mind?.psycheNote || snapshot.mind?.stressNote ? ["档案 · 心理"] : []),
    ...(snapshot.work ? ["档案 · 工作"] : []),
    ...(snapshot.relation ? ["档案 · 关系"] : []),
    ...(snapshot.finance ? ["档案 · 财商"] : []),
    ...(snapshot.play ? ["档案 · 玩商"] : []),
  ];
  const payload = {
    metrics: snapshot.metrics.map((metric) => ({
      source: metric.sourceLabel,
      label: metric.label,
      value: metric.value,
      unit: metric.unit,
      range: metric.track?.source ?? null,
    })),
    foods: snapshot.foods.map((food) => ({ label: food.label, items: food.items })),
    mind: snapshot.mind
      ? {
          emotionWords: snapshot.mind.emotionWords,
          psycheNote: snapshot.mind.psycheNote,
          stressNote: snapshot.mind.stressNote,
        }
      : null,
    work: snapshot.work,
    relation: snapshot.relation,
    finance: snapshot.finance,
    play: snapshot.play,
    logs: snapshot.logs.map((log) => ({ source: log.sourceLabel, text: log.text })),
    allowedSources: sources,
  };

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-flash",
      thinking: { type: "disabled" },
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "你给个人看板写旁注，内容可以是身体、心态、工作、关系或财商。只根据给定数字、食物、心态、工作、关系、资产和日志，返回最多 3 条。每条一句话，不超过 40 个字。不要诊断，不要写正常或异常，不要打分，不要给投资建议。source 必须原样使用 allowedSources 里的一项。没有可说的就返回 {\"items\":[]}。只返回 JSON：{\"items\":[{\"text\":\"\",\"source\":\"\"}]}",
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) return [];
  const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content;
  if (!content) return [];

  let parsed: { items?: { text?: string; source?: string }[] };
  try {
    parsed = JSON.parse(content) as { items?: { text?: string; source?: string }[] };
  } catch {
    return [];
  }

  const allowed = new Set(sources);
  const items = (parsed.items ?? [])
    .flatMap((item) => {
      const text = item.text?.trim();
      const source = item.source?.trim();
      if (!text || !source || !allowed.has(source)) return [];
      return [{ text, source }];
    })
    .slice(0, 3);

  cache.set(key, { at: Date.now(), items });
  return items;
}
