import {
  boardAdviceSections,
  type BoardAdviceSectionId,
  type BoardAdviceSectionView,
} from "@/lib/board/advice-sections";
import type { BoardSnapshot } from "@/lib/board/snapshot";

const cache = new Map<string, { at: number; texts: Partial<Record<BoardAdviceSectionId, string>> }>();
const TTL_MS = 30 * 60 * 1000;

const sectionIds = boardAdviceSections.map((section) => section.id);

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

function logsMatching(snapshot: BoardSnapshot, pattern: RegExp) {
  return snapshot.logs.filter((log) => pattern.test(log.sourceLabel)).map((log) => log.text);
}

function metricsInGroup(snapshot: BoardSnapshot, group: "身体" | "睡眠" | "体检" | "心态") {
  return snapshot.metrics
    .filter((metric) => metric.group === group)
    .map((metric) => ({
      label: metric.label,
      value: metric.value,
      unit: metric.unit,
      range: metric.track?.source ?? null,
    }));
}

function hasAnyContext(snapshot: BoardSnapshot) {
  return (
    snapshot.metrics.length > 0 ||
    snapshot.foods.length > 0 ||
    snapshot.logs.length > 0 ||
    snapshot.mind != null ||
    snapshot.work != null ||
    snapshot.relation != null ||
    snapshot.finance != null
  );
}

function buildCategoryPayload(snapshot: BoardSnapshot) {
  const work = snapshot.work;
  const workCompany =
    work &&
    (work.companyName || work.department || work.role || work.joinedOn || work.studyHistory)
      ? {
          companyName: work.companyName,
          department: work.department,
          role: work.role,
          joinedOn: work.joinedOn,
          studyHistory: work.studyHistory,
        }
      : null;
  const workStack =
    work && (work.proficient.length || work.learning.length || work.retired.length)
      ? {
          proficient: work.proficient,
          learning: work.learning,
          retired: work.retired,
        }
      : null;

  return {
    diet: {
      foods: snapshot.foods.map((food) => ({ label: food.label, items: food.items })),
      logs: logsMatching(snapshot, /^日志 ·/),
    },
    sleep: {
      metrics: metricsInGroup(snapshot, "睡眠"),
      logs: logsMatching(snapshot, /^日志 ·/),
    },
    fitness: {
      metrics: metricsInGroup(snapshot, "身体"),
      logs: logsMatching(snapshot, /^日志 ·/),
    },
    exam: {
      metrics: metricsInGroup(snapshot, "体检"),
      logs: logsMatching(snapshot, /^日志 ·/),
    },
    mind: {
      profile: snapshot.mind,
      metrics: metricsInGroup(snapshot, "心态"),
      logs: logsMatching(snapshot, /^心态日志 ·/),
    },
    work: {
      profile: workCompany,
      logs: logsMatching(snapshot, /^工作日志 ·/),
    },
    stack: {
      profile: workStack,
      logs: logsMatching(snapshot, /^工作日志 ·/),
    },
    relation: {
      profile: snapshot.relation,
      logs: logsMatching(snapshot, /^关系日志 ·/),
    },
    assets: {
      finance: snapshot.finance,
      logs: [],
    },
  };
}

function emptySections(): BoardAdviceSectionView[] {
  return boardAdviceSections.map((section) => ({
    id: section.id,
    title: section.title,
    text: null,
  }));
}

export async function loadBoardAdviceSections(snapshot: BoardSnapshot): Promise<BoardAdviceSectionView[]> {
  if (!hasAnyContext(snapshot)) return emptySections();

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return emptySections();

  const key = cacheKey(snapshot);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return boardAdviceSections.map((section) => ({
      id: section.id,
      title: section.title,
      text: hit.texts[section.id]?.trim() || null,
    }));
  }

  const categories = buildCategoryPayload(snapshot);
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
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "你给个人看板写分区建议。输入是 categories 对象，键为 diet、sleep、fitness、exam、mind、work、stack、relation、assets。每个键只根据对应数据写一条建议，不超过 48 个字；该分区没有可用信息则返回空字符串。不要诊断，不要写正常或异常，不要打分，不要给投资建议。只返回 JSON 对象，九个键都要出现，值为字符串。",
        },
        { role: "user", content: JSON.stringify({ categories }) },
      ],
    }),
    cache: "no-store",
  });

  const texts: Partial<Record<BoardAdviceSectionId, string>> = {};
  if (response.ok) {
    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = body.choices?.[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content) as Record<string, unknown>;
        for (const id of sectionIds) {
          const raw = parsed[id];
          texts[id] = typeof raw === "string" ? raw.trim() : "";
        }
      } catch {
        // keep empty
      }
    }
  }

  cache.set(key, { at: Date.now(), texts });

  return boardAdviceSections.map((section) => ({
    id: section.id,
    title: section.title,
    text: texts[section.id]?.trim() || null,
  }));
}
